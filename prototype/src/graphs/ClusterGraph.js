// (IMPORT) import { Graph } from './Graph.js';
// import d3 from 'd3';

class ClusterGraph extends Graph {

  constructor(width, height, nodeSize, nodeSpace, outerGroup, innerGroup, color, clickNodeCallback = () => {}, tickCallback = () => {}) {
    super(width, height, nodeSize, nodeSpace);

    this.scaleFactor = 2.5 / this.nodeSize;
    this.outerRadius = null;
    this.outerGroup = outerGroup;
    this.innerGroup = innerGroup;
    this.color = color;

    this.clickNodeCallback = clickNodeCallback;
    this.tickCallback = tickCallback;
    this.initialize();
  }

  render() {
    return this.svg.node();
  }

  initialize() {
    this.simulation = d3.forceSimulation()
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

  // (TODO): move to a helper class or Grpah class? repeated in DetailGraph
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

  nodeRadius(d) {
    return d.group === this.innerGroup ? d.value * 2 + 0.5 : this.nodeSize;
  }

  displayNodeText(d) {
    return d.group === this.outerGroup || this.nodeRadius(d) >= this.nodeSize;
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

    this.node = this.node
      .data(nodes, d => d.id)
      .join(
        enter => enter.append("g")
          .attr("opacity", d => this.connected(d.id, links) ? this.nodeOpacity : this.nodeUnhighlightOpacity)
          .call(g => {
            g.append("circle")
              // (TODO) details what to animate - improve in the future
              .attr("r", d => this.nodeRadius(d))
              .attr("fill", d => this.color(d.group));
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
              .transition() 
              .duration(500)
              .ease(d3.easeLinear)
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
