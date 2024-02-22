// data format ???
// {
//   nodes: [{id, group, name, lifetime: [start, end]}],
//   links: [{source, target, value?, lifetime: [start, end]}],
// }

// (NOTE): opting by using only d3, por causa das limitaçoes de interacoes
// da lib que nao correspondem ao pretendido, e workaround seria mais complicado do que o manual coding do d3 nas outras coisas

// import { circunferencePosition } from "./utils";
function circunferencePosition(diameter, index, count) {
  let angle = (2 * Math.PI * index) / count - (Math.PI / 2);
  
  return {
    x: (diameter / 2) * Math.cos(angle),
    y: (diameter / 2) * Math.sin(angle),
  };
}

function _timeslices(data, timestep) {
  const min = d3.min(data.nodes, node => node.lifetime.start);
  const max = d3.max(data.nodes, node => node.lifetime.end);

  return d3.range(min, max, timestep).concat(max);
}

function _inTimeslice({start, end}, timeslice) {
  return start <= timeslice && end >= timeslice;
}

function _draw(data, timeslice, graph, container) {
  const nodes = data.nodes.filter(node => _inTimeslice(node.lifetime, timeslice));
  const links = data.links.filter(link => _inTimeslice(link.lifetime, timeslice));
  graph.update({nodes, links});

  document.getElementById(container).replaceChildren(graph);
}

function dragstarted(event, simulation) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
}

function dragged(event) {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
}

function dragended(event, simulation) {
  if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
}

function TemporalGraph(data, graphContainer, timelineContainer, {
  width = 800,
  height = 600,
  nodeSize = 8,
  nodeSpace = 15,
  timestep = 1,
  outerGroup = "national teams",
  innerGroup = "clubs",
  detailGroup = "players",
}) {

  const color = d3.scaleOrdinal(d3.schemeCategory10);
  

  function overviewGraph() {
    const simulation = d3.forceSimulation()
        .force("collide", d3.forceCollide(nodeSize + 2))
        .force("link", d3.forceLink().id(d => d.id).strength(d => d.value * 0.01))
        .force("x", d3.forceX().x(d => d.group === outerGroup ? d.circleX : 0).strength(d => d.group === outerGroup ? 1.0 : 0.01))
        .force("y", d3.forceY().y(d => d.group === outerGroup ? d.circleY : 0).strength(d => d.group === outerGroup ? 1.0 : 0.01));

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
      link.attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
      node.attr("cx", d => d.x)
          .attr("cy", d => d.y);
    }

    // if (invalidation) invalidation.then(() => simulation.stop());

    return Object.assign(svg.node(), {
      update({nodes, links}) {

        // Make a shallow copy to protect against mutation, while
        // recycling old nodes to preserve position and velocity.
        // const old = new Map(node.data().map(d => [d.id, d]));
        // nodes = nodes.map(d => ({...old.get(d.id), ... d}));
        // links = links.map(d => ({...d}));

        node = node
          .data(nodes)
          .join("circle")
            .attr("r", nodeSize)
            .attr("fill", d => color(d.group))
            // oppacity and other events
            .call(node => node.append("title").text(d => d.id));
        
        node.filter(d => d.group === innerGroup)
          .call(d3.drag()
            .on("start", (event) => dragstarted(event, simulation))
            .on("drag", dragged)
            .on("end", (event) => dragended(event, simulation)));

        link = link
          .data(links)
          .join("line")
            .attr("stroke-width", d => Math.min(d.value * 0.75, nodeSize * 2));

        simulation.nodes(nodes);
        simulation.force("link").links(links);
        simulation.alpha(1).restart().tick();
        ticked();
      }
    });
  }

  // for now we supposed that is just the overview graph... think about data and best format next week
  // first filter by all overview nodes and links according to the variables then
  // filter data to only include nodes and links that are active in the current timeslice
  // (if displayouter always dont consider timeslice in the nodes) then calcule outer circle pos
  // if displayouter always, only needed to do it once, otherwise, needed for each timeslice

  const nodeOuterCount = data.nodes.filter(d => d.group === outerGroup).length;
  const nodeInnerCount = data.nodes.filter(d => d.group === innerGroup).length;
  
  // Calculate the diameter of the circunference based on a heuristic distance between nodes.
  const diameter = Math.max(
    (nodeOuterCount * (2.0 * nodeSize + nodeSpace)) / Math.PI, 
    (nodeInnerCount * (3.0 * nodeSize)) / Math.PI, 
    200
  );
  const scale = Math.min(width, height) / (diameter + 2 * nodeSize);

  // (TODO) (THINK) some sort heuristics to the national teams nodes. 
  data.nodes.forEach((node, index) => {
    if (node.group === outerGroup) {
      const position = circunferencePosition(diameter * scale, index, nodeOuterCount);
      node.circleX = position.x;
      node.circleY = position.y;
    }
  });

  const timeslices = _timeslices(data, timestep);
  const timeline = Scrubber(timeslices, timestep, { delay: 1000 });
  const graph = overviewGraph();
  
  // _draw(data, timeslices[0], graph, graphContainer);
  document.getElementById(timelineContainer).append(timeline);
  
  timeline.querySelector("#timeline-range").addEventListener("input", (_) => {
    const timeslice = timeline.value;
    _draw(data, timeslice, graph, graphContainer);
  });
}
