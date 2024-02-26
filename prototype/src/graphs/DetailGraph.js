class DetailGraph extends Graph {
  constructor(width, height, nodeSize, nodeSpace, outerGroup, innerGroup, color) {
    super(width, height, nodeSize, nodeSpace);

    this.outerGroup = outerGroup;
    this.innerGroup = innerGroup;
    this.color = color;
    this.initialize();
  }

  render() {
    return this.svg.node();
  }

  initialize() {
    // (TODO) invisible links keeping cluster tgether or point of the cluster?? 
    this.cx = 0;
    this.cy = 0;

    this.simulation = d3.forceSimulation()
      .force("collide", d3.forceCollide(d => this.nodeRadius(d) + 2))
      .force("link", d3.forceLink().id(d => d.id).strength(0.15))
      .force("x", d3.forceX().x(d => d.group === this.outerGroup ? d.fx : this.cx).strength(d => d.group === this.outerGroup ? 1.0 : 0.35))
      .force("y", d3.forceY().y(d => d.group === this.outerGroup ? d.fy : this.cy).strength(d => d.group === this.outerGroup ? 1.0 : 0.35));
  
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

  nodeRadius(d) {
    return d.group === this.innerGroup ? this.nodeSize * 0.25 : this.nodeSize;
  }

  update(nodes, links, cluster) {
    this.cx = cluster.x || 0;
    this.cy = cluster.y || 0;

    const old = new Map(this.node.data().map(d => [d.id, {x: d.x, y: d.y}]));
    
    this.circularLayout(nodes, this.outerGroup);
    nodes = nodes.map(d => ({
      ...old.get(d.id) || {
        x: d.group === this.outerGroup ? d.fx : this.cx, 
        y: d.group === this.outerGroup ? d.fy : this.cy
      }, 
      ...d}));
    links = links.map(d => ({...d}));

    this.node = this.node
      .data(nodes, d => d.id)
      .join(enter => enter.append("circle"))
        .attr("r", d => this.nodeRadius(d))
        .attr("fill", d => this.color(d.group))
        .attr("opacity", d => this.connected(d.id, links) ? this.nodeOpacity : this.nodeUnhighlightOpacity)
    
    this.node.append("title").text(d => d.name);
    this.node.filter(d => d.group === this.innerGroup)
      .call(this.drag(this.simulation));

    this.node
      .on("mouseenter", (_, d) => this.highlight(d, this.node, this.link))
      .on("mouseleave", () => this.unhighlight(this.node, this.link));
    
    this.link = this.link
      .data(links, d => [d.source, d.target])
      .join("line")
        .attr("stroke-width", 1.0 * 0.75);

    this.simulation.nodes(nodes);
    this.simulation.force("link").links(links);
    this.simulation.alpha(1).restart();
    this.simulation.on("tick", () => this.ticked(this.link, this.node));
  }
}
