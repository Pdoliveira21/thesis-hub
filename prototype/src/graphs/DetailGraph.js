class DetailGraph extends Graph {
  constructor(width, height, nodeSize, nodeSpace, outerGroup, innerGroup, color) {
    super(width, height, nodeSize, nodeSpace);

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
      .force("x", d3.forceX().x(d => d.group === this.outerGroup ? d.fx : 0).strength(0.1))
      .force("y", d3.forceY().y(d => d.group === this.outerGroup ? d.fy : 0).strength(0.1));
  
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
      .selectAll("circle");
  }

  clusterPosition() {
    if (this.clusters.length === 0) return {x: 0, y: 0};

    return {
      x: this.clusters.reduce((acc, c) => acc + c.x, 0) / this.clusters.length, 
      y: this.clusters.reduce((acc, c) => acc + c.y, 0) / this.clusters.length
    };
  }

  nodeRadius(d) {
    return d.group === this.innerGroup ? this.nodeSize * 0.25 : this.nodeSize;
  }

  displayNodeText(d) {
    return d.group === this.outerGroup;
  }

  update(nodes, links, focus) {
    const old = new Map(this.node.data().map(d => [d.id, {x: d.x, y: d.y}]));
    
    this.circularLayout(nodes, this.outerGroup);
    const oldCenter = this.clusterPosition();
    nodes = nodes.map(d => ({...old.get(d.id) || {x: oldCenter.x, y: oldCenter.y}, ...d}));
    links = links.map(d => ({...d}));

    this.node = this.node
      .data(nodes, d => d.id)
      .join(
        enter => enter.append("g")
          .attr("opacity", d => this.connected(d.id, links) ? this.nodeOpacity : this.nodeUnhighlightOpacity)
          .call(g => {          
            g.append("circle")
              .attr("r", d => this.nodeRadius(d))
              .attr("fill", d => this.color(d.cluster ? d.cluster : d.group))
            g.append("title").text(d => d.name);
          }),
        update => update
          .attr("opacity", d => this.connected(d.id, links) ? this.nodeOpacity : this.nodeUnhighlightOpacity)
          .call(g => {
            g.select("circle")
              .attr("r", d => this.nodeRadius(d))
              .attr("fill", d => this.color(d.cluster ? d.cluster : d.group));
            g.select("title").text(d => d.name);
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

  updateClusters(clusters) {
    let changed = false;
    clusters.forEach(cluster => {
      const newX = Math.round(cluster.x) || 0;
      const newY = Math.round(cluster.y) || 0;
      const old = this.clusters.find(c => c.id === cluster.id);

      if (!old || Math.abs(newX - old.x) > 10 || Math.abs(newY - old.y) > 10) {
        changed = true;
        return;
      }
    });

    if (changed || clusters.length !== this.clusters.length) {
      this.clusters = clusters.map(c => ({id: c.id, x: c.x, y: c.y}));
      
      this.simulation.force("link");
      this.simulation.force("x").x(d => d.group === this.outerGroup ? d.fx : Math.round(this.clusters.find(c => c.id === d.cluster)?.x || 0));
      this.simulation.force("y") .y(d => d.group === this.outerGroup ? d.fy : Math.round(this.clusters.find(c => c.id === d.cluster)?.y || 0));
      this.simulation.alphaTarget(0.3).restart();
    } else {
      this.simulation.alphaTarget(0);
    }
  }
}
