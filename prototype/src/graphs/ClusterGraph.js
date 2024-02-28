// (IMPORT) import { Graph } from './Graph.js';
// import d3 from 'd3';

class ClusterGraph extends Graph {

  constructor(width, height, nodeSize, nodeSpace, outerGroup, innerGroup, color, clickNodeCallback = () => {}) {
    super(width, height, nodeSize, nodeSpace);

    this.scaleFactor = 2.5 / this.nodeSize;
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
      .force("collide", d3.forceCollide(d => this.nodeRadius(d) + 2))
      .force("link", d3.forceLink().id(d => d.id).strength(d => d.value * 0.1))
      .force("x", d3.forceX().x(d => d.group === this.outerGroup ? d.fx : 0).strength(d => d.group === this.outerGroup ? 1.0 : 0.01))
      .force("y", d3.forceY().y(d => d.group === this.outerGroup ? d.fy : 0).strength(d => d.group === this.outerGroup ? 1.0 : 0.01));

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
    return d.group === this.innerGroup ? d.value * 2 + 0.5 : this.nodeSize;
  }

  displayNodeText(d) {
    return d.group === this.outerGroup || this.nodeRadius(d) >= this.nodeSize;
  }

  update(nodes, links) {
    const old = new Map(this.node.data().map(d => [d.id, {x: d.x, y: d.y}]));

    // (THINK) some sort heuristics to the national teams nodes....
    this.circularLayout(nodes, this.outerGroup); 
    nodes = nodes.map(d => ({...old.get(d.id) || {x: 0, y: 0}, ...d}));
    links = links.map(d => ({...d}));

    this.node = this.node
      .data(nodes, d => d.id)
      .join(
        enter => enter.append("g")
          .attr("opacity", d => this.connected(d.id, links) ? this.nodeOpacity : this.nodeUnhighlightOpacity)
          .call(g => {
            g.append("circle")
              .attr("r", d => this.nodeRadius(d))
              .attr("fill", d => this.color(d.group))
            g.append("text")
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "central")
              .attr("fill", d => d3.lab(this.color(d.group)).l < 60 ? "white" : "black")
              .attr("display", d => this.displayNodeText(d) ? "block" : "none")
              .text(d => d.name);
            g.append("title").text(d => d.name);
          }),
        update => update
          .attr("opacity", d => this.connected(d.id, links) ? this.nodeOpacity : this.nodeUnhighlightOpacity)
          .call(g => {
            g.select("circle")
              .attr("r", d => this.nodeRadius(d))
              .attr("fill", d => this.color(d.group));
            g.select("text")
              .attr("fill", d => d3.lab(this.color(d.group)).l < 60 ? "white" : "black")
              .attr("display", d => this.displayNodeText(d) ? "block" : "none")
              .text(d => d.name);
            g.select("title").text(d => d.name);
          }),
        exit => exit.remove()
    );
    
    this.node.filter(d => d.group === this.innerGroup)
      .call(this.drag(this.simulation));

    this.node
      .on("click", (event, d) => this.clicked(event, d))
      .on("mouseenter", (_, d) => this.highlight(d, this.node, this.link))
      .on("mouseleave", () => this.unhighlight(this.node, this.link, this.displayNodeText.bind(this)));

    this.link = this.link
      .data(links, d => [d.source, d.target])
      .join("line")
        .attr("stroke-width", d => d.value * 0.75);
        //.attr("stroke-width", d => Math.min(d.value * 0.75, this.nodeSize * 2));

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
