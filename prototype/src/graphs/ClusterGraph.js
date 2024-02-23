// (IMPORT) import { Graph } from './Graph.js';
// import d3 from 'd3';

class ClusterGraph extends Graph {

  constructor(width, height, nodeSize, nodeSpace, outerGroup, innerGroup, color, clickNodeCallback = () => {}) {
    super(width, height, nodeSize, nodeSpace);

    this.outerGroup = outerGroup;
    this.innerGroup = innerGroup;
    this.color = color;
    this.clickNodeCallback = clickNodeCallback;
    this.initialize();
  }

  render() {
    return this.svg.node();
  }

  initialize() {
    this.simulation = d3.forceSimulation()
      .force("collide", d3.forceCollide(this.nodeSize + 2))
      .force("link", d3.forceLink().id(d => d.id).strength(d => d.value * 0.01))
      .force("x", d3.forceX().x(d => d.group === this.outerGroup ? d.cx : 0).strength(d => d.group === this.outerGroup ? 1.0 : 0.01))
      .force("y", d3.forceY().y(d => d.group === this.outerGroup ? d.cy : 0).strength(d => d.group === this.outerGroup ? 1.0 : 0.01));

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

  update(nodes, links) {
    const old = new Map(this.node.data().map(d => [d.id, {x: d.x, y: d.y}]));
    
    // (THINK) some sort heuristics to the national teams nodes....
    this.circularLayout(nodes, this.outerGroup); 
    nodes = nodes.map(d => ({
      ...old.get(d.id) || {
        x: d.group === this.outerGroup ? d.cx * 1.2 : 0, 
        y: d.group === this.outerGroup ? d.cy * 1.2 : 0
      }, 
      ...d}));
    links = links.map(d => ({...d}));

    this.node = this.node
      .data(nodes, d => d.id)
      .join(enter => enter.append("circle"))
        .attr("r", d => d.group === this.innerGroup ? this.nodeSize * 0.5 * d.value : this.nodeSize)
        .attr("fill", d => this.color(d.group))
        .attr("opacity", d => this.connected(d.id, links) ? this.nodeOpacity : this.nodeUnhighlightOpacity);
          
    this.node.append("title").text(d => d.id);
    this.node.filter(d => d.group === this.innerGroup)
      .call(this.drag(this.simulation));

    this.node
      .on("click", (event, d) => this.clicked(event, d))
      .on("mouseenter", (_, d) => this.highlight(d, this.node, this.link))
      .on("mouseleave", () => this.unhighlight(this.node, this.link));

    this.link = this.link
      .data(links, d => [d.source, d.target])
      .join("line")
        .attr("stroke-width", d => Math.min(d.value * 0.75, this.nodeSize * 2));

    this.simulation.nodes(nodes);
    this.simulation.force("link").links(links);
    this.simulation.alpha(1).restart();
    this.simulation.on("tick", () => this.ticked(this.link, this.node));
  }

  clicked(event, d) {
    if (event && event.isTrusted && "function" === typeof this.clickNodeCallback) {
      this.clickNodeCallback(d);
    }
  }
}