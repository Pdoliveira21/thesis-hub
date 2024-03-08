class DetailGraph extends Graph {
  constructor(width, height, nodeSize, nodeSpace, outerGroup, innerGroup) {
    super(width, height, nodeSize, nodeSpace);

    this.outerRadius = null;
    this.outerGroup = outerGroup;
    this.innerGroup = innerGroup;
    this.animationDuration = 2000;
    this.animationEase = d3.easeCubicInOut;

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
      .force("x", d3.forceX().x(0).strength(0.1))
      .force("y", d3.forceY().y(0).strength(0.1))
      .force("outerXY", this.outerXY.bind(this));
  
    this.svg = d3.create("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.height])
        .attr("style", "max-width: 100%; height: auto;");

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
        .attr("opacity", 0.3)
      .selectAll("image");
    
    this.link = this.svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", this.linkOpacity)
      .selectAll("line");
    
    this.node = this.svg.append("g")
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
    if (d.group === this.innerGroup && d.cluster.split("-")[1] === "0") { // TODO: (future) review this condition
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
    

    
    const clusters = focus && focus.group === this.outerGroup
      ? [...new Map(nodes.filter(d => d.group === this.innerGroup).map(d => ([d.cluster, {id: d.cluster, img: d.clusterImg, x: d.x, y: d.y}]))).values()] : [];
    
    const self = this;
    this.cluster = this.cluster
      .data(clusters, d => d.id)
      .join(
        enter => enter.append("image")
          .attr("href", d => d.img)
          .attr("x", d => d.x - 20)
          .attr("y", d => d.y - 20)
          .attr("width", 40)
          .attr("height", 40)
          .attr("opacity", 0)
          .transition().duration(this.animationDuration * 0.4).ease(this.animationEase)
          .attr("opacity", 1),
        update => update
          .attr("href", d => d.img)
          .attr("x", d => d.x - 20)
          .attr("y", d => d.y - 20),
        exit => exit
          .transition().duration(this.animationDuration * 0.15).ease(this.animationEase)
          .attr("opacity", 0)
          .remove()
      );
    
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
                  .transition().duration(self.animationDuration * 0.4).ease(self.animationEase)
                  .attr("transform", "scale(1)");
              }
            } else {
              g.append("circle")
                .attr("r", 0)
                .transition().duration(self.animationDuration * 0.4).ease(self.animationEase)
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
            } else {
              g.select("image").remove();

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

            g.select("title").text(d.name);
          }),
        exit => exit
          .transition().duration(this.animationDuration * 0.15).ease(this.animationEase)
          .attr("opacity", 0)
          .remove()
    );
    
    this.node.filter(d => d.group === this.innerGroup)
      .call(this.drag(this.simulation));

    this.node
      .on("mouseenter", (_, d) => this.highlight(d, this.node, this.link, this.simulation))
      .on("mouseleave", () => this.unhighlight(this.node, this.link, this.simulation, this.displayNodeText.bind(this)));
    
    this.link = this.link
      .data(links, d => d.id)
      .join(
        enter => enter.append("line")
          .attr("stroke-width", 0)
          .transition().duration(this.animationDuration * 0.4).ease(this.animationEase)
          .attr("stroke-width", 0.75),
        update => update
          .attr("stroke-width", 0.75),
        exit => exit
          .transition().duration(this.animationDuration * 0.15).ease(this.animationEase)
          .attr("stroke-width", 0)
          .remove()
      );

    this.simulation.nodes(nodes);
    this.simulation.force("link").links(links).strength(focus?.group === this.outerGroup ? 0.0 : 0.05);
    this.simulation.alpha(1).restart();
    this.simulation.on("tick", () => this.ticked(this.link, this.node));
  }

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

  updateClusters(clusters) {
    if (this.#changedClusters(clusters)) {
      this.clusters = clusters.map(c => ({id: c.id, x: c.x, y: c.y}));
      
      this.simulation.force("x").x(d => Math.round(this.clusters.find(c => c.id === d.cluster)?.x || 0));
      this.simulation.force("y").y(d => Math.round(this.clusters.find(c => c.id === d.cluster)?.y || 0));
      this.simulation.alphaTarget(0.3).restart();
    } else {
      this.simulation.alphaTarget(0);
    }

    // Update Cluster Images Positions
    this.cluster
      .attr("x", d => (Math.round(this.clusters.find(c => c.id === d.id)?.x) || 0) - 20)
      .attr("y", d => (Math.round(this.clusters.find(c => c.id === d.id)?.y) || 0) - 20);
  }
}
