import { Graph } from "./Graph.js";

import { compareStringId } from "./../utils/Utils.js";

/**
 * @class DetailGraph
 * @extends Graph
 * @description A class to create a detail graph component.
 * @param {number} width - The width of the graph.
 * @param {number} height - The height of the graph.
 * @param {number} nodeSize - The size of the nodes.
 * @param {number} nodeSpace - The space between nodes.
 * @param {string} outerGroup - The outer group of nodes.
 * @param {string} innerGroup - The inner group of nodes.
 * @param {function} clickNodeCallback - Callback function to be called when a node is clicked.
 */
export class DetailGraph extends Graph {
  constructor(width, height, nodeSize, nodeSpace, outerGroup, innerGroup, clickNodeCallback = () => {}) {
    super(width, height, nodeSize, nodeSpace);

    this.outerRadius = null;
    this.outerGroup = outerGroup;
    this.innerGroup = innerGroup;
    this.animationDuration = 2000;
    this.animationEase = d3.easeCubicInOut;

    this.clickNodeCallback = clickNodeCallback;
    this.clusters = [];
    this.initialize();
  }

  render() {
    return this.svg.node();
  }

  initialize() {
    this.simulation = d3.forceSimulation()
      .force("charge", d3.forceManyBody().strength(-1))
      .force("collide", d3.forceCollide(d => this.nodeRadius(d) + 2))
      .force("link", d3.forceLink().id(d => d.id).strength(0.0))
      .force("x", d3.forceX().x(0).strength(0.3))
      .force("y", d3.forceY().y(0).strength(0.3))
      .force("outerXY", this.outerXY.bind(this))
      .force("withinCircleBounds", this.withinCircleBounds.bind(this));
  
    this.svg = d3.create("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.height])
        .attr("style", "width: 100%; height: auto;");

    let pattern = this.svg.append("defs").append("pattern")
        .attr("id", "stripes")
        .attr("width", 10)
        .attr("height", 10)
        .attr("patternUnits", "userSpaceOnUse");

    pattern.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", "#333");

    pattern.append("path")
        .attr("d", "M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2")
        .attr("stroke", "#fff")
        .attr("stroke-width", 3)
        .attr("stroke-opacity", 0.3);
  
    this.background = this.svg.append("image")
        .attr("x", -(this.width / 4) / 2)
        .attr("y", -(this.height / 4) / 2)
        .attr("width", this.width / 4)
        .attr("height", this.height / 4)
        .attr("opacity", 0.15);

    this.cluster = this.svg.append("g")
        .attr("transform", `translate(${this.width / 2 - 20}, ${this.height / 2 - 40})`);
        
    const imgSize = this.nodeSize * 2;
    this.cluster.append("image")
        .attr("x", - imgSize)
        .attr("y", - imgSize)
        .attr("width", imgSize)
        .attr("height", imgSize)
        .attr("opacity", 0.8);
    this.cluster.append("text")
        .attr("x", -5)
        .attr("y", 20)
        .attr("text-anchor", "end");

    this.link = this.svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", this.linkOpacity)
      .selectAll("line");
    
    this.node = this.svg.append("g")
      .selectAll("g");
  }

  // Custom force to place the outer nodes in the circunference.
  outerXY(alpha) {
    this.node.filter(d => d.group === this.outerGroup && !d.inPlace).each(d => {
      // Close enough to the new position - snap to it.
      if (Math.abs(d.fx - d.cx) <= 1.0 && Math.abs(d.fy - d.cy) <= 1.0) {
        d.fx = d.cx;
        d.fy = d.cy;
        d.inPlace = true;
      } else {
        if (d.t === undefined) {
          // does not have old theta - move new node linearly to the new position.
          const factor = Math.max((1 - alpha) * 0.25, 0);
          d.fx = d.x + (d.cx - d.x) * factor;
          d.fy = d.y + (d.cy - d.y) * factor;
        } else {
          // has old theta - move existing node along the circunference to the new position.
          const factor = Math.max(alpha * 2 - 1, 0);
          d.fx = this.outerRadius * Math.cos(factor * d.t + (1 - factor) * d.theta);
          d.fy = this.outerRadius * Math.sin(factor * d.t + (1 - factor) * d.theta);
        }
      }
    });
  }

  // Custom force to keep the inner nodes within the circunference.
  withinCircleBounds() {
    this.node.filter(d => d.group === this.innerGroup).each(d => {
      const distance = Math.sqrt(d.x * d.x + d.y * d.y);
      if (distance > this.outerRadius) {
        const target = distance - this.outerRadius + (this.nodeSize * 2);
        d.x -= d.x * target / distance;
        d.y -= d.y * target / distance;
      }
    });
  }

  // Calculate the average position of the clusters.
  clusterPosition() {
    if (this.clusters.length === 0) {
      return {x: 0, y: 0};
    }

    return {
      x: this.clusters.reduce((acc, c) => acc + c.x, 0) / this.clusters.length, 
      y: this.clusters.reduce((acc, c) => acc + c.y, 0) / this.clusters.length
    };
  }

  nodeRadius(d) {
    return d.group === this.innerGroup ? this.nodeSize * 0.25 : this.nodeSize;
  }

  nodeColor(d) {
    if (d.group === this.innerGroup && compareStringId(d.cluster, "0")) {
      return "url(#stripes)";
    }

    return d.group === this.outerGroup ? "#e6e6e6" : (`#${d.color || "333"}`);
  }

  displayNodeText(d) {
    return d.group === this.outerGroup;
  }

  displayNodeImg(d) {
    return d.img !== undefined && (d.group === this.outerGroup);
  }

  // Update the graph with the new nodes and links reusing the old information when possible to keep visual consistency.
  // Updates the graph background based on the focus node.
  // Defines the transitions, the nodes interactions and updates and restarts the simulation.
  update(nodes, links, focus) {
    const old = new Map(this.node.data().map(d => [d.id, {x: d.x, y: d.y, t: d.theta}]));
    const oldClusterCenter = this.clusterPosition();
    
    this.outerRadius = this.circularLayout(nodes, this.outerGroup);
    nodes = nodes.map(d => ({
      ...old.get(d.id) || {
        x: d.group === this.outerGroup ? d.cx * 1.2 : (this.clusters.find(c => c.id === d.cluster)?.x || oldClusterCenter.x), 
        y: d.group === this.outerGroup ? d.cy * 1.2 : (this.clusters.find(c => c.id === d.cluster)?.y || oldClusterCenter.y),
        t: undefined,
      },
      inPlace: false,
      ...d,
    }));
    links = links.map(d => ({...d}));
    
    this.background.attr("href", focus ? focus.img || "" : "");

    const self = this;
    this.node = this.node
      .data(nodes, d => d.id)
      .join(
        enter => enter.append("g")
          .attr("opacity", d => this.connected(d.id, links) ? this.nodeOpacity : this.nodeUnhighlightOpacity)
          .each(function(d) {
            const g = d3.select(this);

            const radius = self.nodeRadius(d);
            const color = self.nodeColor(d);
            const displayImg = self.displayNodeImg(d);
            const displayText = self.displayNodeText(d);

            if (displayImg) {
              const imgRadius = radius + 1;
              g.append("image")
                .attr("href", d.img)
                .attr("x", -imgRadius)
                .attr("y", -imgRadius)
                .attr("width", imgRadius * 2)
                .attr("height", imgRadius * 2);
              
              if (d.group === self.innerGroup) {
                g.select("image")
                  .attr("transform", "scale(0)")
                  .transition().duration(self.animationDuration * 0.6).ease(self.animationEase)
                  .attr("transform", "scale(1)");
              }

              g.append("title").text(d.name);
            } else {
              g.append("circle")
                .attr("r", 0)
                .transition().duration(self.animationDuration * 0.6).ease(self.animationEase)
                .attr("r", radius)
                .attr("fill", color);
              g.append("text")
                .classed("node-text", true)
                .attr("display", displayText ? "block" : "none")
                .text(d.name);
            }
          }),
        update => update
          .transition().duration(this.animationDuration * 0.4).ease(this.animationEase)
          .attr("opacity", d => this.connected(d.id, links) ? this.nodeOpacity : this.nodeUnhighlightOpacity)
          .each(function(d) {
            const g = d3.select(this);

            const radius = self.nodeRadius(d);
            const color = self.nodeColor(d);
            const displayImg = self.displayNodeImg(d);
            const displayText = self.displayNodeText(d);

            if (displayImg) {
              g.select("circle").remove();
              g.select("text").remove();
              
              const imgRadius = radius + 1;
              const img = g.select("image").empty() ? g.append("image") : g.select("image");
              img
                .attr("href", d.img)
                .attr("x", -imgRadius)
                .attr("y", -imgRadius)
                .attr("width", imgRadius * 2)
                .attr("height", imgRadius * 2);
              
              const title = g.select("title").empty() ? g.append("title") : g.select("title");
              title.text(d.name);
            } else {
              g.select("image").remove();
              g.select("title").remove();

              const circle = g.select("circle").empty() ? g.append("circle") : g.select("circle");
              circle
                .attr("r", radius)
                .transition().duration(self.animationDuration).ease(self.animationEase)
                .attr("fill", color);

              const text = g.select("text").empty() ? g.append("text") : g.select("text");
              text
                .classed("node-text", true)
                .attr("display", displayText ? "block" : "none")
                .text(d.name);
            }
          }),
        exit => exit
          .transition().duration(this.animationDuration * 0.15).ease(this.animationEase)
          .attr("opacity", 0)
          .remove()
    );
    
    this.node.filter(d => d.group === this.innerGroup)
      .call(this.drag(this.simulation, this.outerRadius));

    this.node
      .classed("node-clickable", d => (d.group === this.outerGroup && d.id !== focus.id) || (d.link !== undefined && d.link !== ""))
      .on("click", (event, d) => this.clicked(event, d, focus))
      .on("mouseenter", (_, d) => {
        this.highlight(d, this.node, this.link, this.simulation, d.group === this.outerGroup);
        this.displayNodeCluster(d, focus);
      })
      .on("mouseleave", () => {
        this.unhighlight(this.node, this.link, this.simulation, this.displayNodeText.bind(this));
        this.removeNodeCluster();
      });
    
    this.link = this.link
      .data(links, d => d.id)
      .join(
        enter => enter.append("line")
          .attr("stroke-width", 0)
          .transition().duration(this.animationDuration * 0.6).ease(this.animationEase)
          .attr("stroke-width", 0.75),
        update => update
          .attr("stroke-width", 0.75),
        exit => exit
          .transition().duration(this.animationDuration * 0.15).ease(this.animationEase)
          .attr("stroke-width", 0)
          .remove()
      );

    this.simulation.nodes(nodes);
    this.simulation.force("link").links(links).strength(focus?.group === this.outerGroup ? 0.0 : 0.2);
    this.simulation.alpha(1).restart();
    this.simulation.on("tick", () => this.ticked(this.link, this.node));
  }

  // Check if the clusters position has changed beyond a certain threshold (10 pixels).
  #changedClusters(clusters) {
    if (clusters.length !== this.clusters.length) return true;

    for (let cluster of clusters) {
      const newX = Math.round(cluster.x) || 0;
      const newY = Math.round(cluster.y) || 0;
      const old = this.clusters.find(c => c.id === cluster.id);
      
      if (!old || Math.abs(newX - old.x) > 10 || Math.abs(newY - old.y) > 10) 
        return true;
    };

    return false;
  }

  // Update the position of the clusters, if needed, and update the simulation accordingly.
  updateClusters(clusters) {
    if (this.#changedClusters(clusters)) {
      this.clusters = clusters.map(c => ({id: c.id, x: c.x, y: c.y}));
      
      this.simulation.force("x").x(d => Math.round(this.clusters.find(c => c.id === d.cluster)?.x || 0));
      this.simulation.force("y").y(d => Math.round(this.clusters.find(c => c.id === d.cluster)?.y || 0));
      this.simulation.alphaTarget(0.3).restart();
    } else {
      this.simulation.alphaTarget(0);
    }
  }

  // Call the clickNodeCallback function with the node data when an outer node is clicked.
  // Open the link of the node in a new browser tab when an inner node is clicked.
  clicked(event, d, focus) {
    if (!event || !event.isTrusted) return;

    if (d.group === this.outerGroup && "function" === typeof this.clickNodeCallback) {
      if (d.id === focus?.id) return;

      const clickedNode = this.node.filter(n => n.id === d.id).node();
      if (clickedNode !== null) {
        clickedNode.dispatchEvent(new MouseEvent("mouseleave"));
        this.clickNodeCallback(d);
      }
    } else if (d.group === this.innerGroup && d.link !== "") {
      window.open(`https://www.zerozero.pt${d.link}`, "_blank");
    }
  }

  // Update the cluster corner image and text to match the node being hovered.
  displayNodeCluster(d, focus) {
    if (this.dragging === true) return;

    if (focus.group === this.outerGroup && d.group === this.innerGroup) {
      this.cluster.select("image").attr("href", d.clusterInfo?.img || "");
      this.cluster.select("text").text(d.clusterInfo?.name || "");
      this.cluster.attr("display", "inherit");
    }

    if (focus.group !== this.outerGroup && d.group === this.outerGroup) {
      const count = this.link.data().filter(l => l.source === d || l.target === d).length;
      if (count <= 0) return;

      this.cluster.select("image").attr("href", "");
      this.cluster.select("text").text(`receives ${count} players`);
      this.cluster.attr("display", "inherit");
    }
  }

  // Reset the cluster corner image and text when the mouse leaves the node.
  removeNodeCluster() {
    if (this.dragging === true) return;
    
    this.cluster.attr("display", "none");
    this.cluster.select("image").attr("href", "");
    this.cluster.select("text").text("");
  }

  // Reveal the nodes and links with the given ids in the graph.
  spotlight(ids) {
    this.reveal(this.node, this.link, ids);
  }
}
