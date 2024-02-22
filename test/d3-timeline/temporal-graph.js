
function circunferencePosition(diameter, index, count) {
  let angle = (2 * Math.PI * index) / count - (Math.PI / 2);
  
  return {
    x: (diameter / 2) * Math.cos(angle),
    y: (diameter / 2) * Math.sin(angle),
  };
}

function drag(simulation) {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}

// function overviewGraph() {
  
// }


function TemporalGraph(data, graphContainer, {
  width = 800,
  height = 800,
  nodeSize = 12,
  nodeSpace = 15,
  color = d3.scaleOrdinal(d3.schemeCategory10),
  outerGroup = "national teams",
  innerGroup = "clubs",
  // detailGroup = "players",
}) {

  const overviewNodes = data.nodes.map(d => ({...d}));
  const overviewLinks = data.links.map(d => ({...d}));

  const nodesOuterCount = overviewNodes.filter(d => d.group === outerGroup).length;
  const nodesInnerCount = overviewNodes.filter(d => d.group === innerGroup).length;
  
  // Calculate the diameter of the circunference based on a heuristic distance between nodes.
  const diameter = Math.max(
    (nodesOuterCount * (2.0 * nodeSize + nodeSpace)) / Math.PI, 
    (nodesInnerCount * (3.0 * nodeSize)) / Math.PI, 
    200
  );
  const scale = Math.min(width, height) / (diameter + 2 * nodeSize);

  // (TODO) (THINK) some sort heuristics to the national teams nodes....
  overviewNodes.forEach((node, index) => {
    if (node.group === outerGroup) {
      const position = circunferencePosition(diameter * scale, index, nodesOuterCount);
      // node.circleX = position.x;
      // node.circleY = position.y;
      node.fx = position.x;
      node.fy = position.y;
    }
  });


  const simulation = d3.forceSimulation()
        .force("collide", d3.forceCollide(nodeSize + 2))
        .force("link", d3.forceLink().id(d => d.id).strength(d => d.value * 0.01))
        .force("x", d3.forceX().x(d => d.group === outerGroup ? d.fx : 0).strength(d => d.group === outerGroup ? 1.0 : 0.01))
        .force("y", d3.forceY().y(d => d.group === outerGroup ? d.fy : 0).strength(d => d.group === outerGroup ? 1.0 : 0.01));

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    let link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.8)
      .selectAll("line")
      .data(overviewLinks)
      .join("line")
        .attr("stroke-width", d => Math.min(d.value * 0.75, nodeSize * 2));

    let node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0)
      .selectAll("circle")
      .data(overviewNodes)
      .join("circle")
        .attr("r", d => d.group === outerGroup ? nodeSize * 2 : nodeSize)
        .attr("fill", d => color(d.group))
        // .attr("opacity", d => d.clubs_count === 0 ? 0.3 : 1)
        // .on("mouseenter", (event, d) => highlightNodeNeighbors(event, d, overwiewLinks, node, link, (d) => d.clubs_count === 0))
        // .on("mouseleave", () => resetNetworkStyle(node, link, (d) => d.clubs_count === 0))
        // .on("click", clicked);
        // .call(drag(simulation))
        .call(node => node.append("title").text(d => d.id));

      node.filter(d => d.group === innerGroup)
        .call(drag(simulation));
    
      simulation.nodes(overviewNodes);
      simulation.force("link").links(overviewLinks);
      simulation.on("tick", () => {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
      });
    
      document.getElementById(graphContainer).append(svg.node());
}

// (TODO): separate responsabilities in functions and files if possible to simplify logic
// working the display in it self, then add the timeline...