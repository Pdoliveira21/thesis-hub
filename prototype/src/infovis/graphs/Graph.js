import { circunferencePosition, isTouchDevice } from "./../utils/Utils.js";

/**
 * @class Graph
 * @description A class that aggregates common methods of a graph component.
 * @param {number} width - The width of the graph.
 * @param {number} height - The height of the graph.
 * @param {number} nodeSize - The size of the nodes.
 * @param {number} nodeSpace - The space between nodes.
 */
export class Graph {

  constructor(width, height, nodeSize, nodeSpace) {
    this.width = width;
    this.height = height;
    this.nodeSize = nodeSize;
    this.nodeSpace = nodeSpace;

    this.isTouchDevice = isTouchDevice();
    this.dragging = false;
    this.separating = false;
    this.nodeOpacity = 1.0;
    this.linkOpacity = 0.3;
    this.nodeUnhighlightOpacity = 0.05;
    this.linkUnhighlightOpacity = 0.01;
    this.linkHighlightOpacity = 0.8;
    this.revealColor = "#3fc1ff";
    this.revealWidth = 5;
    this.revealOffset = -2;
    this.revealRadius = 15;
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
    
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      self.dragging = true;
    }

    function dragged(event, d) {
      const distance = Math.sqrt(event.x * event.x + event.y * event.y);
      const nodeSize = d3.select(this).node().getBBox().height / 2;
      const maxDistance = radius + self.nodeSize - nodeSize;

      if (distance > maxDistance) {
        // Manually trigger mouseup event to stop dragging and mouseleave to unhighlight nodes.
        const node = d3.select(this).node();
        if (!self.isTouchDevice) {
          node.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, view: window }));
          node.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true, view: window }));
        }
      } else {
        d.fx = event.x;
        d.fy = event.y;
      }
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      self.dragging = false;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  connected(d, links) {
    return links.some(l => l.source === d || l.target === d);
  }

  highlight(d, node, link, simulation, separate = false) {
    if (!this.connected(d, link.data()) || this.dragging === true) return;

    // Highlight (change oppacity and display labels) of the node and its neighbors as well as corresponding links.
    let neighbors = new Set(link.data().filter(l => l.source === d || l.target === d).flatMap(l => [l.source, l.target]));
    node.filter(n => !neighbors.has(n)).call(g => {
      g.attr("opacity", this.nodeUnhighlightOpacity);
      g.select("text").attr("display", "none");
    });
    node.filter(n => neighbors.has(n)).call(g => {
      g.attr("opacity", this.nodeOpacity);
      g.select("text").attr("display", "block");
    });

    link.filter(l => l.source !== d && l.target !== d).attr("stroke-opacity", this.linkUnhighlightOpacity);
    link.filter(l => l.source === d || l.target === d).attr("stroke-opacity", this.linkHighlightOpacity);

    // Add a force to avoid text overlap (if is to separate - eg.: hover outer node).
    if (!separate) return;
    this.separating = true;
    this.backupInfo = {};

    // (1) Stop Current Simulation and save the alpha.
    simulation.stop();
    this.backupInfo["alpha"] = simulation.alpha();

    // (2) Add a force to avoid text overlap. (used rectangular collision d3-plugin: https://github.com/emeeks/d3-bboxCollide)
    const self = this;
    node.each(function(d) {
      const g = d3.select(this);
      self.backupInfo[d.id] = {
        width: g.node().getBBox().width,
        height: g.node().getBBox().height,
      };
    });

    simulation.force("text", d3.bboxCollide(d => {
      const dx = this.backupInfo[d.id].width / 2 + 2;
      const dy = this.backupInfo[d.id].height / 2 + 2;
      return [[-dx, -dy], [dx, dy]];
    }).strength(0.1).iterations(1));

    // (3) Continue Simulation just to rearrange highligthed nodes.
    simulation.alpha(0.01).restart();
  }

  unhighlight(node, link, simulation, showText = () => false) {
    if (this.dragging === true) return;
    
    // Unhighlight (change oppacity and display labels) of all nodes and links - reset network style.
    node.call(g => {
      g.attr("opacity", d => this.connected(d, link.data()) ? this.nodeOpacity : this.nodeUnhighlightOpacity);
      g.select("text").attr("display", d => showText(d) ? "block" : "none");
    });
    link.attr("stroke-opacity", this.linkOpacity);

    // Remove the force added to avoid text overlap and restabilize the simulation (if nodes are separated).
    if (!this.separating) return;
    this.separating = false;

    // (1) Stop Current Simulation.
    simulation.stop();
    // (2) Remove the force added to avoid text overlap.
    simulation.force("text", null);
    // (3) Continue Simulation from where it previous where.
    simulation.alpha(Math.max(this.backupInfo["alpha"], 0.3)).restart();
  }

  reveal(node, link, ids) {
    // Reveal (change outline or stoke) the nodes and links with the given ids.
    node.call(g => {
      g.select("image")
        .style("outline", d => ids.has(d.id) ? `${this.revealWidth}px solid ${this.revealColor}` : "none")
        .style("outline-offset", d => ids.has(d.id) ? `${this.revealOffset}px` : "none")
        .style("border-radius", d => ids.has(d.id) ? `${this.revealRadius}%` : "none");
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
    const diameter = Math.max(
      (nodesCount * (2.0 * this.nodeSize + this.nodeSpace)) / Math.PI, 
      this.width - 4 * this.nodeSize - 4 * this.nodeSpace,
    );
    const scale = Math.min(this.width, this.height) / (diameter + 3.5 * this.nodeSize);

    // Calculate the position of the nodes on the circunference.
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

  circularSections(nodes, field) {
    // Calculate the start and end theta of each section based on the field that defines separation criteria.
    const offset = (2 * Math.PI) / (nodes.length * 2) - 0.02;
    
    return nodes.reduce((acc, d) => {
      const obj = acc.find(obj => obj.id === d[field]);
      if (obj === undefined) {
        acc.push({
          id: d[field],
          startTheta: d.theta - offset,
          endTheta: d.theta + offset, 
        });
      } else {
        obj.endTheta = d.theta + offset;
      }
      return acc;
    }, []);
  }

  applySectionArc(selection, outerRadius, innerRadius, full = false) {
    // Apply the arc to the selection based on the given radius and full flag.
    selection.attr("d", d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(d => full ? - Math.PI / 4 : d.startTheta + Math.PI / 2)
      .endAngle(d => full ? (2 * Math.PI) - (Math.PI / 4) - 0.04 : d.endTheta + Math.PI / 2)
    );
  }
}
