class DetailGraph extends Graph {
  constructor(width, height, nodeSize, nodeSpace, outerGroup, innerGroup, color) {
    super(width, height, nodeSize, nodeSpace);

    this.outerRadius = null;
    this.outerGroup = outerGroup;
    this.innerGroup = innerGroup;
    this.color = color;

    this.clusters = [];
    this.initialize();
  }

  render() {
    return this.svg.node();
  }

  initialize() {
    this.simulation = d3.forceSimulation()
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
  
    this.background = this.svg.append("image")
        .attr("x", -(this.width / 4) / 2)
        .attr("y", -(this.height / 4) / 2)
        .attr("width", this.width / 4)
        .attr("height", this.height / 4)
        .attr("opacity", 0.15);
    
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
          d.fx = d.x + (d.cx - d.x) * (1 - alpha);
          d.fy = d.y + (d.cy - d.y) * (1 - alpha);
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

    if (focus) {
      this.background.attr("href", focus.img || "");
    }

    const self = this;
    this.node = this.node
      .data(nodes, d => d.id)
      // (TODO): improve animations and text stuff
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
            } else {
              g.append("circle")
                .attr("r", radius)
                .attr("fill", color);
              // TODO: improve text positioning and style
              g.append("text")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("fill", "black")
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
                .attr("fill", color);

              const text = g.select("text").empty() ? g.append("text") : g.select("text");
              text
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("fill", "black")
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
      .on("mouseenter", (_, d) => this.highlight(d, this.node, this.link))
      .on("mouseleave", () => this.unhighlight(this.node, this.link, this.displayNodeText.bind(this)));
    
    this.link = this.link
      .data(links, d => [d.source, d.target])
      .join("line")
        .attr("stroke-width", 1.0 * 0.75);

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
  }
}
