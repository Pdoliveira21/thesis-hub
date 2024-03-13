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

  highlight(d, node, link, simulation) {
    if (!this.connected(d, link.data()) || this.dragging === true) return;

    let neighbors = new Set(link.data().filter(l => l.source === d || l.target === d).flatMap(l => [l.source, l.target]));
    node.filter(n => !neighbors.has(n)).call(g => {
      g.lower().attr("opacity", this.nodeUnhighlightOpacity);
      g.select("text").attr("display", "none");
    });
    node.filter(n => neighbors.has(n)).call(g => {
      g.raise().attr("opacity", this.nodeOpacity);
      g.select("text").attr("display", "block");
    });

    link.filter(l => l.source !== d && l.target !== d).attr("stroke-opacity", this.linkUnhighlightOpacity);
    link.filter(l => l.source === d || l.target === d).attr("stroke-opacity", this.linkHighlightOpacity);

    // Add a force to avoid text overlap.
    // let sizes = {};
    // node.each(function(d) {
    //   const g = d3.select(this);
    //   sizes[d.id] = {
    //     width: g.node().getBBox().width,
    //     height: g.node().getBBox().height,
    //   };
    // });

    // simulation.force("text", d3.forceCollide(d => {
    //   if (neighbors.has(d)) {
    //     return Math.max(sizes[d.id].width, sizes[d.id].height) / 2;
    //   }
    // }).iterations(1)); // (TODO): cahnge force to do not overlap the "g" elements of the highlighhted nodes
    // simulation.alpha(0.05).restart();
  }

  unhighlight(node, link, simulation, showText = () => false) {
    if (this.dragging === true) return;
    
    node.call(g => {
      g.attr("opacity", d => this.connected(d, link.data()) ? this.nodeOpacity : this.nodeUnhighlightOpacity);
      g.select("text").attr("display", d => showText(d) ? "block" : "none");
    });
    link.attr("stroke-opacity", this.linkOpacity);

    // Remove the force to avoid text overlap.
    // simulation.force("text", null);
    // simulation.alpha(0.3).restart();
  }

  reveal(node, link, ids, color, width) {
    node.call(g => {
      this.#revealImage(g.select("image"), ids, color, width);
      this.#revealCircle(g.select("circle"), ids, color, width);
    });

    link.call(line => this.#revealLine(line, ids, color));
  }

  #revealImage(image, ids, color, width) {
    image
      .style("outline", d => ids.has(d.id) ? `${width}px solid ${color}` : "none")
      .style("border-radius", d => ids.has(d.id) ? "50%" : "none"); // TODO: circle or square?
  }

  #revealCircle(circle, ids, color, width) {
    circle
      .style("stroke", d => ids.has(d.id) ? color : "none")
      .style("stroke-width", d => ids.has(d.id) ? `${width}px` : 0);
  }

  #revealLine(line, ids, color) {
    line
      .style("stroke", d => ids.has(d.id) ? color : "unset");
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

    return (diameter * scale) / 2;
  }
}

// https://lvngd.com/blog/rectangular-collision-detection-d3-force-layouts/
