// (IMPORT) d3 from 'd3';

class Graph {

  constructor(width, height, nodeSize, nodeSpace) {
    this.width = width;
    this.height = height;
    this.nodeSize = nodeSize;
    this.nodeSpace = nodeSpace;

    this.dragging = false;
    this.separating = false;
    this.nodeOpacity = 1.0;
    this.linkOpacity = 0.3;
    this.nodeUnhighlightOpacity = 0.05;
    this.linkUnhighlightOpacity = 0.01;
    this.linkHighlightOpacity = 0.8;
    this.revealColor = "blue";
    this.revealWidth = 5;
    this.backupInfo = {};
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

  drag(simulation, radius) {
    const self = this;
    return d3.drag()
      .on("start", function(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        self.dragging = true;
      })
      .on("drag", function(event, d) {
        const distance = Math.sqrt(event.x * event.x + event.y * event.y);
        const selfSize = d3.select(this).node().getBBox().height / 2;
        const maxDistance = radius + self.nodeSize - selfSize;

        if (distance > maxDistance) {
          // Manually trigger mouseup event to stop dragging.
          const syntheticEvent = new MouseEvent("mouseup", { bubbles: true, view: window });
          d3.select(this).node().dispatchEvent(syntheticEvent);
        } else {
          d.fx = event.x;
          d.fy = event.y;
        }
      })
      .on("end", function(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        self.dragging = false;
      });
  }

  connected(d, links) {
    return links.some(l => l.source === d || l.target === d);
  }

  highlight(d, node, link, simulation, separate = false) {
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

    if (!separate) return;
    this.separating = true;
    this.backupInfo = {};

    // STOP Current Simulation and save the alpha.
    simulation.stop();
    this.backupInfo["alpha"] = simulation.alpha();

    // SAVE nodes sizes.
    const self = this;
    node.each(function(d) {
      const g = d3.select(this);
      self.backupInfo[d.id] = {
        width: g.node().getBBox().width,
        height: g.node().getBBox().height,
      };
    });

    // ADD a force to avoid text overlap. (rectangular collision d3-plugin: https://github.com/emeeks/d3-bboxCollide)
    simulation.force("text", d3.bboxCollide(d => {
      const dx = this.backupInfo[d.id].width / 2;
      const dy = this.backupInfo[d.id].height / 2;
      return [[-dx, -dy], [dx, dy]];
    }).strength(0.1).iterations(1));

    // CONTINUE Simulation just to rearrange highligthed nodes.
    simulation.alpha(0.01).restart();
  }

  unhighlight(node, link, simulation, showText = () => false) {
    if (this.dragging === true) return;
    
    node.call(g => {
      g.attr("opacity", d => this.connected(d, link.data()) ? this.nodeOpacity : this.nodeUnhighlightOpacity);
      g.select("text").attr("display", d => showText(d) ? "block" : "none");
    });
    link.attr("stroke-opacity", this.linkOpacity);

    // Remove the force added to avoid text overlap. and go back to old positions.
    if (!this.separating) return;
    this.separating = false;

    // STOP Current Simulation.
    simulation.stop();
    // REMOVE the force added to avoid text overlap.
    simulation.force("text", null);
    // CONTINUE Simulation from where it previous where.
    simulation.alpha(Math.max(this.backupInfo["alpha"], 0.3)).restart();
  }

  reveal(node, link, ids) {
    node.call(g => {
      g.select("image")
        .style("outline", d => ids.has(d.id) ? `${this.revealWidth}px solid ${this.revealColor}` : "none")
        .style("border-radius", d => ids.has(d.id) ? "50%" : "none"); // TODO: circle or square?
      g.select("circle")
        .style("stroke", d => ids.has(d.id) ? this.revealColor : "none")
        .style("stroke-width", d => ids.has(d.id) ? `${this.revealWidth}px` : 0);
    });

    link.call(line => {
        line.style("stroke", d => ids.has(d.id)  ? this.revealColor : "unset")
    });
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
