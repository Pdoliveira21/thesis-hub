// (IMPORT) d3 from 'd3';

class Graph {

  constructor(width, height, nodeSize, nodeSpace) {
    this.width = width;
    this.height = height;
    this.nodeSize = nodeSize;
    this.nodeSpace = nodeSpace;

    this.dragging = false;
    this.nodeOpacity = 1.0;
    this.linkOpacity = 0.3;
    this.nodeUnhighlightOpacity = 0.05;
    this.linkUnhighlightOpacity = 0.01;
    this.linkHighlightOpacity = 0.8;
  }

  ticked(link, node) {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    node
      .attr("transform", d => `translate(${d.x},${d.y})`);
  }

  #dragstarted(event, d, simulation) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    this.dragging = true;
  }
  
  #dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  #dragended(event, d, simulation) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
    this.dragging = false;
  }

  drag(simulation) {
    return d3.drag()
        .on("start", (event, d) => this.#dragstarted(event, d, simulation))
        .on("drag", (event, d) => this.#dragged(event, d))
        .on("end", (event, d) => this.#dragended(event, d, simulation));
  }

  connected(d, links) {
    return links.some(l => l.source === d || l.target === d);
  }

  highlight(d, node, link, simulation, radius = () => 0) {
    if (!this.connected(d, link.data()) || this.dragging === true) return;

    let neighbors = new Set(link.data().filter(l => l.source === d || l.target === d).flatMap(l => [l.source, l.target]));
    node.filter(n => !neighbors.has(n)).call(g => {
      g.lower().attr("opacity", this.nodeUnhighlightOpacity);
      g.select("text").attr("display", "none");
    });

    var textSizes = {};
    node.filter(n => neighbors.has(n)).call(g => {
      g.raise().attr("opacity", this.nodeOpacity);
      g.select("text").attr("display", "block");
    }).select("text").each(function(d) {
      const text = d3.select(this);
      textSizes[d.id] = {
        name: d.name,
        width: text.node().getBBox().width,
        height: 16
      };
    });

    link.filter(l => l.source !== d && l.target !== d).attr("stroke-opacity", this.linkUnhighlightOpacity);
    link.filter(l => l.source === d || l.target === d).attr("stroke-opacity", this.linkHighlightOpacity);


    simulation.force("text", d3.forceCollide(d => {
      if (neighbors.has(d)) {
        return Math.max(radius(d), textSizes[d.id]?.width / 2);
      }
    }).iterations(1)); // (TODO): cahnge force to do not overlap the "g" elements of the highlighhted nodes
    simulation.alpha(0.05).restart(); // (TOD): restrat only some nodes (the affected ones)?
  }

  unhighlight(node, link, showText = () => false, simulation) {
    if (this.dragging === true) return;
    
    node.call(g => {
      g.attr("opacity", d => this.connected(d, link.data()) ? this.nodeOpacity : this.nodeUnhighlightOpacity);
      g.select("text").attr("display", d => showText(d) ? "block" : "none");
    });
    link.attr("stroke-opacity", this.linkOpacity);

    if (simulation) {
      simulation.force("text", null);
      simulation.alpha(0.5).restart(); // (TOD): restrat only some nodes?
    }
  }

  circularLayout(nodes, group) {
    const nodesCount = nodes.filter(d => d.group === group).length;

    // Calculate the diameter of the circunference based on a heuristic distance between nodes.
    const diameter = Math.max((nodesCount * (2.0 * this.nodeSize + this.nodeSpace)) / Math.PI, 200);
    const scale = Math.min(this.width, this.height) / (diameter + 2 * this.nodeSize);

    nodes.filter(d => d.group === group).forEach((node, index) => {
      if (node.group === group) {
        const position = circunferencePosition(diameter * scale, index, nodesCount);
        node.cx = position.x;
        node.cy = position.y;
        node.theta = position.theta;
      }
    });

    // (TODO): improve this logic!
    return (diameter * scale) / 2;
  }
}
