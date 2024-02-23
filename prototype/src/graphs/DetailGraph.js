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
    // (TODO) invisible links keeping cluster tgether or point of the cluster
    this.cx = 0;
    this.cy = 0;

    this.simulation = d3.forceSimulation()
      .force("collide", d3.forceCollide(this.nodeSize))
      .force("link", d3.forceLink().id(d => d.id).strength(0.15))
      .force("x", d3.forceX().x(d => d.group === this.outerGroup ? d.cx : this.cx).strength(d => d.group === this.outerGroup ? 1.0 : 0.35))
      .force("y", d3.forceY().y(d => d.group === this.outerGroup ? d.cy : this.cy).strength(d => d.group === this.outerGroup ? 1.0 : 0.35));
  
    this.svg = d3.create("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.height])
        .attr("style", "max-width: 100%; height: auto;");
    
    this.link = this.svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.8)
      .selectAll("line");
    
    this.node = this.svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0)
      .selectAll("circle");
  }

  update(nodes, links, cluster) {
    this.cx = cluster.x || 0;
    this.cy = cluster.y || 0;
    console.log(this.cx, this.cy);

    const old = new Map(this.node.data().map(d => [d.id, {x: d.x, y: d.y}]));
    
    this.circularPositions(nodes, this.outerGroup);
    nodes = nodes.map(d => ({
      ...old.get(d.id) || {
        x: d.group === this.outerGroup ? d.cx * 1.2 : this.cx, 
        y: d.group === this.outerGroup ? d.cy * 1.2 : this.cy
      }, 
      ...d}));
    links = links.map(d => ({...d}));

    this.node = this.node
      .data(nodes, d => d.id)
      .join(enter => enter.append("circle"))
        .attr("r", d => d.group === this.innerGroup ? this.nodeSize * 0.75 : this.nodeSize)
        .attr("fill", d => this.color(d.group))
        .attr("opacity", d => links.some(l => l.source === d.id || l.target === d.id) ? 1.0 : 0.3)
    
    this.node.append("title").text(d => d.id);
    this.node.filter(d => d.group === this.innerGroup)
      .call(this.drag(this.simulation));

    // .call(node => node.on("mouseenter", (_, d) => hovered(d)))
    // .call(node => node.on("mouseleave", () => hovered(null)));
    
    this.link = this.link
      .data(links, d => [d.source, d.target])
      .join("line")
        .attr("stroke-width", 1.0 * 0.75);

    this.simulation.nodes(nodes);
    this.simulation.force("link").links(links);
    this.simulation.alpha(1).restart();
    this.simulation.on("tick", () => this.ticked(this.link, this.node));
  }

  // (SEE) maybe should be a function of the graph class, as may be used in other graphs
  circularPositions(nodes, group) {
    const nodesCount = nodes.filter(d => d.group === group).length;

    // Calculate the diameter of the circunference based on a heuristic distance between nodes.
    const diameter = Math.max(
      (nodesCount * (2.0 * this.nodeSize + this.nodeSpace)) / Math.PI,
      ((nodes.length - nodesCount) * (3.0 * this.nodeSize)) / Math.PI,
      200
    );
    const scale = Math.min(this.width, this.height) / (diameter + 2 * this.nodeSize);

    nodes.filter(d => d.group === group).forEach((node, index) => {
      if (node.group === group) {
        const position = circunferencePosition(diameter * scale, index, nodesCount);
        node.cx = position.x;
        node.cy = position.y;
      }
    });
  }
}