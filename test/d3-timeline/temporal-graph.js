
// ---- Utils functions (TODO): move to a separate file

function circunferencePosition(diameter, index, count) {
  let angle = (2 * Math.PI * index) / count - (Math.PI / 2);
  
  return {
    x: (diameter / 2) * Math.cos(angle),
    y: (diameter / 2) * Math.sin(angle),
  };
}


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


function _timeslices(data, timestep) {
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

  function overviewSVG(nodes, links) {

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
        .data(links)
        .join("line")
          .attr("stroke-width", d => Math.min(d.value * 0.75, nodeSize * 2));
  
      let node = svg.append("g")
          .attr("stroke", "#fff")
          .attr("stroke-width", 0)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
          .attr("r", nodeSize)
          .attr("fill", d => color(d.group))
          // .attr("opacity", d => d.clubs_count === 0 ? 0.3 : 1)
          // .on("mouseenter", (event, d) => highlightNodeNeighbors(event, d, overwiewLinks, node, link, (d) => d.clubs_count === 0))
          // .on("mouseleave", () => resetNetworkStyle(node, link, (d) => d.clubs_count === 0))
          // .on("click", clicked);
          .call(node => node.append("title").text(d => d.id));
  
        node.filter(d => d.group === innerGroup)
          .call(drag(simulation));
      
        simulation.nodes(nodes);
        simulation.force("link").links(links);
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
  
        return svg.node();
  }

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

  const graph = overviewSVG(overviewNodes, overviewLinks, { width, height, nodeSize, outerGroup, innerGroup, color });
  document.getElementById(graphContainer).append(graph);

  const timeslices = _timeslices(data, timestep);
  console.log(timeslices)
  const timeline = Scrubber(timeslices, timestep, { delay: 1000 });
  document.getElementById(timelineContainer).append(timeline);
}



// ---- Timeline Scrubber (TODO): move to a separate file


function Scrubber(values, step, {
  format = value => value,
  initial = 0,
  direction = 1,
  delay = 1000,
  autoplay = false,
  loop = false,
  loopDelay = null,
  alternate = false
}) {

  function createTimeline(min = 0, max = 10, step = 1) {
    const timeline = document.createElement("form");
    timeline.id = "form-timeline";

    const btnPlay = document.createElement("button");
    btnPlay.id = "timeline-control";
    btnPlay.type = "button";
    btnPlay.textContent = autoplay ? "Pause" : "Play";
    btnPlay.classList.add("btn-timeline");

    const btnPrev = document.createElement("button");
    btnPrev.id = "timeline-prev";
    btnPrev.type = "button";
    btnPrev.textContent = "Prev";
    btnPrev.classList.add("btn-timeline");

    const btnNext = document.createElement("button");
    btnNext.id = "timeline-next";
    btnNext.type = "button";
    btnNext.textContent = "Next";
    btnNext.classList.add("btn-timeline");
    
    const range = document.createElement("input");
    range.id = "timeline-range";
    range.type = "range";
    range.min = min;
    range.max = max;
    range.step = step;
    range.value = min;
    range.classList.add("input-timeline");

    const output = document.createElement("output");
    output.id = "timeline-output";
    output.classList.add("output-timeline");

    const player = document.createElement("div");
    player.append(btnPlay, btnPrev, range, btnNext);
    timeline.append(output, player);

    return timeline;
  }

  values = Array.from(values);
  const timeline = createTimeline(autoplay, 0, values.length - 1, step);
  const control = timeline.querySelector("#timeline-control");
  const range = timeline.querySelector("#timeline-range");
  const output = timeline.querySelector("#timeline-output");

  let frame = null;
  let timer = null;
  let interval = null;
  
  function start() {
    control.textContent = "Pause";
    if (delay === null) frame = requestAnimationFrame(tick);
    else interval = setInterval(tick, delay);
  }

  function stop() {
    control.textContent = "Play";
    if (frame !== null) cancelAnimationFrame(frame), frame = null;
    if (timer !== null) clearTimeout(timer), timer = null;
    if (interval !== null) clearInterval(interval), interval = null;
  }

  function running() {
    return frame !== null || timer !== null || interval !== null;
  }

  function tick() {
    if (range.valueAsNumber === (direction > 0 ? values.length - 1 : direction < 0 ? 0 : NaN)) {
      if (!loop) return stop();
      if (alternate) direction = -direction;
      if (loopDelay !== null) {
        if (frame !== null) cancelAnimationFrame(frame), frame = null;
        if (interval !== null) clearInterval(interval), interval = null;
        timer = setTimeout(() => (step(), start()), loopDelay);
        return;
      }
    }

    if (delay === null) frame = requestAnimationFrame(tick);
    step();
  }

  // TODO: on running if no loop - when getting to the end stop animation
  // :: simplify the logic to our requirements
  function step() {
    range.valueAsNumber = (range.valueAsNumber + direction + values.length) % values.length;
    range.dispatchEvent(new CustomEvent("input"));
  }

  range.oninput = event => {
    if (event && event.isTrusted && running()) stop();
    timeline.value = values[range.valueAsNumber];
    output.value = `Current Timeslice: ${format(timeline.value, range.valueAsNumber, values)}`;
  };

  control.onclick = () => {
    if (running()) return stop();
    direction = alternate && range.valueAsNumber === values.length - 1 ? -1 : 1;
    range.valueAsNumber = (range.valueAsNumber + direction) % values.length;
    range.dispatchEvent(new CustomEvent("input"));
    start();
  };

  range.oninput();
  if (autoplay) start();
  else stop();
  // (TODO): mke first layout on time 0 if not autoplay

  // Inputs.disposal(form).then(stop); // (TODO): search more about invalidation and disposal
  return timeline;
}