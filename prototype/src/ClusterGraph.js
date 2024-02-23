// (IMPORT) import { Graph } from './Graph.js';
// import d3 from 'd3';

class ClusterGraph extends Graph {

  // outer group in fixed positions in outside circle
  // inner group is a force directed graph that "clusters" its details in weigthed edges and circle sizes
  // para ja parser da data aqui from data.json format, depois passar para uma funcao que faz tudo isso
  // para o cluster view e detail view based on the variables e aqui??

  // para qui ja so vem o que vai ser displayed na forma que deve

  constructor(width, height, nodeSize, nodeSpace, outerGroup, innerGroup, color) {
    super(width, height, nodeSize, nodeSpace);

    
    this.outerGroup = outerGroup;
    this.innerGroup = innerGroup;
    this.color = color;
    this.initialize();
  }

  call() {
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
      .attr("stroke-opacity", 0.8)
    .selectAll("line");

    this.node = this.svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0)
    .selectAll("circle");
  }

  // nodes - array of objects with id, group, value (se outer group and value 0 - coppacity, senao change radius of circle)
  // links - array of objects with source, target, value (affects the line width)
  update(nodes, links) {
    const old = new Map(this.node.data().map(d => [d.id, {x: d.x, y: d.y}]));
    
    // (THINK) some sort heuristics to the national teams nodes....
    this.circularPositions(nodes, this.outerGroup); 
    // this should be done only once if the outer group nodes are fixed between updates
    // all included always even if 0 connections
    // rearrange velocity? ou transition without animation?, forces vs fx anfd fy
    
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
        .attr("r", this.nodeSize)
        .attr("fill", d => this.color(d.group))
        .attr("opacity", d => links.some(l => l.source === d.id || l.target === d.id) ? 1.0 : 0.3)
          
    this.node.append("title").text(d => d.id);
    this.node.filter(d => d.group === this.innerGroup)
      .call(this.drag(this.simulation));

    // .call(node => node.on("mouseenter", (_, d) => hovered(d)))
    // .call(node => node.on("mouseleave", () => hovered(null)));
    // .on("click", clicked);

    this.link = this.link
      .data(links, d => [d.source, d.target])
      .join("line")
        .attr("stroke-width", d => Math.min(d.value * 0.75, this.nodeSize * 2));

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
