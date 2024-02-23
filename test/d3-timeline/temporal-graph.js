// (NOTE): opting by using only d3, por causa das limitaçoes de interacoes
// da lib que nao correspondem ao pretendido, e workaround seria mais complicado do que o manual coding do d3 nas outras coisas




// ---- Graphs Interaction's functions (TODO): move to a separate file

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

// ---- Construct the visualization based on the data and configuration

function timeslices(data, timestep) {
  const min = d3.min(data.nodes, node => node.lifetime?.start) || 0;
  const max = d3.max(data.nodes, node => node.lifetime?.end) || 0;

  return d3.range(min, max, timestep).concat(max);
}

function inTimeslice({start, end}, timeslice) {
  return start <= timeslice && end >= timeslice;
}


function TemporalGraph(data, graphContainer, timelineContainer, {
  width = 800,
  height = 800,
  nodeSize = 12,
  nodeSpace = 15,
  timestep = 1,
  outerGroup = "national teams",
  innerGroup = "clubs",
  // detailGroup = "players",
  color = d3.scaleOrdinal(d3.schemeCategory10),
}) {

  function overviewSVG() {
    
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
      .selectAll("line");

    let node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0)
      .selectAll("circle");
          

    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
    }

    function hovered(node) {

      // follow d3.js example
    }

    // if (invalidation) invalidation.then(() => simulation.stop());
  
    return Object.assign(svg.node(), {
      update({nodes, links}) {

        const old = new Map(node.data().map(d => [d.id, {x: d.x, y: d.y}]));
        nodes = nodes.map(d => ({...old.get(d.id) || {x:0, y:0}, ...d}));
        links = links.map(d => ({...d}));

        node = node
          .data(nodes, d => d.id)
          .join(enter => enter.append("circle"))
            .attr("r", nodeSize)
            .attr("fill", d => color(d.group))
            .attr("opacity", d => links.some(l => l.source === d.id || l.target === d.id) ? 1.0 : 0.3)
            .call(node => node.append("title").text(d => d.id))
            .call(node => node.filter(d => d.group === innerGroup).call(drag(simulation)))
            .call(node => node.on("mouseenter", (_, d) => hovered(d)))
            .call(node => node.on("mouseleave", () => hovered(null)));
            // .on("click", clicked);

        link = link
          .data(links, d => [d.source, d.target])
          .join("line")
            .attr("stroke-width", d => Math.min(d.value * 0.75, nodeSize * 2));

        simulation.nodes(nodes);
        simulation.force("link").links(links);
        simulation.alpha(1).restart();
        simulation.on("tick", ticked);
      }
    });
  }

  function updateOverview(graph, nodes, links, timeslice) {
    const displayedNodes = nodes.filter(d => d.group === outerGroup || inTimeslice(d.lifetime, timeslice));
    const displayedLinks = links.filter(d => inTimeslice(d.lifetime, timeslice));

    graph.update({nodes: displayedNodes, links: displayedLinks});
    document.getElementById(graphContainer).replaceChildren(graph);
  }

  const times = timeslices(data, timestep);
  const timeline = Scrubber(times, timestep, { delay: 1000 });
  document.getElementById(timelineContainer).append(timeline);


  // for now we supposed that is just the overview graph... think about data and best format next week
  // first filter by all overview nodes and links according to the variables then
  // filter data to only include nodes and links that are active in the current timeslice
  // (if displayouter always dont consider timeslice in the nodes) then calcule outer circle pos
  // if displayouter always, only needed to do it once, otherwise, needed for each timeslice

  // prepare and filter the correct data to be displayed in each graph based also on the timeslice
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

  // (THINK) some sort heuristics to the national teams nodes....
  overviewNodes.forEach((node, index) => {
    if (node.group === outerGroup) {
      const position = circunferencePosition(diameter * scale, index, nodesOuterCount);
      node.fx = position.x;
      node.fy = position.y;
    }
  });


  const graph = overviewSVG();
  updateOverview(graph, overviewNodes, overviewLinks, times[0]);

  timeline.querySelector("#timeline-range").addEventListener("input", (_) => {
    const timeslice = timeline.value;
    updateOverview(graph, overviewNodes, overviewLinks, timeslice);
  });
}
