// (IMPORT) import { Graph } from './Graph.js';
// import d3 from 'd3';

class ClusterGraph extends Graph {

  constructor(width, height, nodeSize, nodeSpace, outerGroup, innerGroup, color, clickNodeCallback = () => {}, tickCallback = () => {}) {
    super(width, height, nodeSize, nodeSpace);

    this.outerRadius = null;
    this.outerGroup = outerGroup;
    this.innerGroup = innerGroup;
    this.color = color;
    this.animationDuration = 1000;
    this.animationEase = d3.easeCubicInOut;

    this.clickNodeCallback = clickNodeCallback;
    this.tickCallback = tickCallback;
    this.initialize();
  }

  render() {
    return this.svg.node();
  }

  initialize() {
    this.simulation = d3.forceSimulation()
      // (TODO): investigate more how to "slow down" the simulation 
      // .alphaDecay(0.01)
      // .velocityDecay(0.8)
      .force("collide", d3.forceCollide(d => this.nodeRadius(d) + 2))
      .force("link", d3.forceLink().id(d => d.id).strength(d => d.value * 0.1))
      .force("x", d3.forceX().x(0).strength(0.01))
      .force("y", d3.forceY().y(0).strength(0.01))
      .force("outerXY", this.outerXY.bind(this));

    this.svg = d3.create("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.height])
        .attr("style", "max-width: 100%; height: auto;");

    this.link = this.svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", this.linkOpacity)
      .selectAll("line");

    this.node = this.svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0)
      .selectAll("g");
  }

  outerXY(alpha) {
    this.node.filter(d => d.group === this.outerGroup && !d.inPlace).each(d => {
      // Close enough to the new position - snap to it
      if (Math.abs(d.fx - d.cx) <= 1.0 && Math.abs(d.fy - d.cy) <= 1.0) {
        d.fx = d.cx;
        d.fy = d.cy;
        d.inPlace = true;
      } else {
        if (d.t === undefined) {
          // does not have old theta - move new node linearly to the new position
          const factor = Math.max((1 - alpha) * 0.25, 0);
          d.fx = d.x + (d.cx - d.x) * factor;
          d.fy = d.y + (d.cy - d.y) * factor;
        } else {
          // has old theta - move existing node along the circunference to the new position
          const factor = Math.max(alpha * 2 - 1, 0);
          d.fx = this.outerRadius * Math.cos(factor * d.t + (1 - factor) * d.theta);
          d.fy = this.outerRadius * Math.sin(factor * d.t + (1 - factor) * d.theta);
        }
      }
    });
  }

  nodeRadius(d) {
    return d.group === this.innerGroup ? d.value * 2 + 0.5 : this.nodeSize;
  }

  nodeColor(d) {
    return d.group === this.outerGroup ? "#e6e6e6" : (`#${d.color || "333"}`);
  }

  displayNodeText(d) {
    return (d.group === this.outerGroup || this.nodeRadius(d) >= this.nodeSize);
  }

  displayNodeImg(d) {
    return d.img !== undefined && (d.group === this.outerGroup || d.value >= 4); // this.nodeRadius(d) >= this.nodeSize * 0.35);
  }

  update(nodes, links) {
    const old = new Map(this.node.data().map(d => [d.id, {x: d.x, y: d.y, t: d.theta}]));

    // (THINK) some sort heuristics to the national teams nodes....
    this.outerRadius = this.circularLayout(nodes, this.outerGroup); 
    nodes = nodes.map(d => ({
      ...old.get(d.id) || {
        x: d.group === this.outerGroup ? d.cx * 1.2 : 0, 
        y: d.group === this.outerGroup ? d.cy * 1.2 : 0,
        t: undefined,
      }, 
      inPlace: false,
      ...d, 
    }));
    links = links.map(d => ({...d}));

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
                  .transition().duration(self.animationDuration).ease(self.animationEase)
                  .attr("transform", "scale(1)");
              } else {
                // (TODO): keep this animation even with the transition forced by the force
                g.select("image")
                  .attr("transform", `scale(0.5)`)
                  .transition().duration(self.animationDuration / 2).ease(self.animationEase)
                  .attr("transform", "scale(1)");
              }
            } else {
              g.append("circle")
                .attr("r", 0)  
                .transition().duration(self.animationDuration).ease(self.animationEase)
                .attr("r", radius)
                .attr("fill", color);
              g.append("text")
                .classed("node-text", true)
                .attr("display", displayText ? "block" : "none")
                .text(d.name);
            }

            g.append("title").text(d.name);
          }),
        update => update
          .attr("opacity", d => this.connected(d.id, links) ? this.nodeOpacity : this.nodeUnhighlightOpacity)
          .each(function(d) {
            const g = d3.select(this);

            const radius = self.nodeRadius(d);
            const color = self.nodeColor(d);
            const displayImg = self.displayNodeImg(d);
            const displayText = self.displayNodeText(d);

            if (displayImg) {
              // Get the old size of the image/circle
              const oldRadius = g.select("circle").empty() 
                ? +g.select("image").attr("width") / 2 
                : +g.select("circle").attr("r") + 2;
              
              // Remove the old circle and text, if exist, and add or update the image properties 
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

              if (d.group === self.innerGroup) {
                g.select("image")
                  .attr("transform", `scale(${oldRadius / imgRadius})`)
                  .transition().duration(self.animationDuration).ease(self.animationEase)
                  .attr("transform", "scale(1)");
              }
            } else {
              // Get the old size of the image/circle
              const oldRadius = g.select("image").empty() 
                ? +g.select("circle").attr("r") 
                : +g.select("image").attr("width") / 2 - 2;

              // Remove the old image and add or update the circle and text properties
              g.select("image").remove();

              const circle = g.select("circle").empty() ? g.append("circle") : g.select("circle");
              circle
                .attr("r", oldRadius)
                .transition().duration(self.animationDuration).ease(self.animationEase)
                .attr("r", radius)
                .attr("fill", color);

              const text = g.select("text").empty() ? g.append("text") : g.select("text");
              text
                .classed("node-text", true)
                .attr("display", displayText ? "block" : "none")
                .text(d.name);
            }
              
            g.select("title").text(d.name);
          }),
        exit => exit.remove()
    );
    
    this.node.filter(d => d.group === this.innerGroup)
      .call(this.drag(this.simulation));

    this.node
      .on("click", (event, d) => this.clicked(event, d))
      .on("mouseenter", (_, d) => this.highlight(d, this.node, this.link, this.simulation))
      .on("mouseleave", () => this.unhighlight(this.node, this.link, this.simulation, this.displayNodeText.bind(this), this.simulation));

    this.link = this.link
      .data(links, d => [d.source, d.target])
      .join(
        enter => enter.append("line")
          .attr("stroke-width", d => d.value * 0.75),
          //.attr("stroke-width", d => Math.min(d.value * 0.75, this.nodeSize * 2));
        exit => exit.remove()
      );

    this.simulation.nodes(nodes);
    this.simulation.force("link").links(links);
    this.simulation.alpha(1).restart();
    this.simulation.on("tick", () => {
      this.ticked(this.link, this.node);
      if ("function" === typeof this.tickCallback) {
        this.tickCallback(this.node.data(), this.link.data());
      }
    });
  }

  clicked(event, d) {
    if (event && event.isTrusted && "function" === typeof this.clickNodeCallback) {
      this.clickNodeCallback(d);
      
      if (d.group === this.outerGroup) {
        // Trigger the tick event of nodes not draggable
        this.simulation.alpha(0.05).restart();
        // simulation.tick(??)
      }
    }
  }
}
