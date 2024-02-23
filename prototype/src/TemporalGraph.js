// (IMPORT) import { ClusterGraph } from './ClusterGraph.js';
// import d3 from 'd3';
// import Timeline from './scrubbers/Timeline.js';

class TemporalGraph {

  constructor(data, graphContainer, {
    width = 800,
    height = 800,
    nodeSize = 12,
    nodeSpace = 15,
    // timestep = 1,
    outerGroup = "national teams",
    innerGroup = "clubs",
    // detailGroup = "players",
    color = d3.scaleOrdinal(d3.schemeCategory10),
  }) {

    // from data in that format - in desider format
    // from data get timeslices
    // send to graphs according the ones to be displayed, 
    // the graph it self is manage at their own level

    // usar para ja a data nao formato oficil para ver se funciona a logica das classes
    // so depois mudar estas funcoes para a data oficial que nao deve afetar a logica dos graficos em si

    this.data = {
      nodes: data.nodes.map(d => ({...d})), 
      links: data.links.map(d => ({...d}))
    };
    this.clusterGraph = new ClusterGraph(width, height, nodeSize, nodeSpace, outerGroup, innerGroup, color);
    this.draw(graphContainer);

    // this.test().then(() => this.draw(graphContainer));

    this.timeline = new Timeline([2, 3, 4, 5, 6, 7, 8, 9], null, (value) => {
      console.log(value);
      // filter and update data based on the selected value
    });
    document.getElementById("timeline-container").replaceChildren(this.timeline.render());    
  }

  async test() {
    await new Promise((resolve, reject) => setTimeout(resolve, 1000));
    this.data.nodes = this.data.nodes.filter(d => this.data.links.some(l => l.source === d.id || l.target === d.id));
    this.data.nodes.push({id: "new", name: "new", group: "clubs"});
    this.data.nodes.push({id: "2acd", name: "new", group: "national teams"});
  }

  draw(container) {
    this.clusterGraph.update(this.data.nodes, this.data.links);
    document.getElementById(container).replaceChildren(this.clusterGraph.render());
  }
}