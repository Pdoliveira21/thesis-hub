// (IMPORT) import { ClusterGraph } from './ClusterGraph.js';
// import d3 from 'd3';
// import Timeline from './scrubbers/Timeline.js';

class TemporalGraph {

  constructor(data, {
    width = 800,
    height = 800,
    nodeSize = 24,
    nodeSpace = 15,
    displayAlwaysAllOuter = false,
    defaultOuterSortField = "name",
    defaultOuterFilter = () => true,
    defaultClusterFilter = () => true,
    defaultDetailFilter = () => true,
    noClusterLegend = "No Club",
    outerGroup = "national teams",
    clusterGroup = "clubs",
    detailGroup = "players",
    graphContainer = "graph-container",
    detailsContainer = "details-container",
    timelineContainer = "timeline-container"
  }) {

    this.outerFilter = defaultOuterFilter;
    this.clusterFilter = defaultClusterFilter;
    this.detailFilter = defaultDetailFilter;
    this.noClusterLegend = noClusterLegend;
    this.outerGroup = outerGroup;
    this.clusterGroup = clusterGroup;
    this.detailGroup = detailGroup;
    this.graphContainer = graphContainer;
    this.detailsContainer = detailsContainer;
    this.parseData(data, displayAlwaysAllOuter, defaultOuterSortField);

    this.detailedNode = null;
    this.detailsGraph = new DetailGraph(width, height, nodeSize, nodeSpace, outerGroup, detailGroup);
    this.clusterGraph = new ClusterGraph(width, height, nodeSize, nodeSpace, outerGroup, clusterGroup, (node) => {
      this.detailedNode = node;
      this.drawDetailsGraph(this.detailsContainer, this.timeline.getValue(), this.detailedNode);
    }, (nodes, links) => {
      if (this.detailedNode === null) return;
      this.updateClustersPositionsInDetailsGraph(nodes, links);
    });

    this.timeline = new Timeline(this.times, 2500, (value) => this.#updateGraphs(value));
    this.drawTimeline(timelineContainer);
  }

  #parseObject(obj, exclude = []) {
    const newObj = {};
    Object.keys(obj).filter(key => !exclude.includes(key)).forEach(key => {
      newObj[key] = obj[key];
    });
    return newObj;
  }

  parseData(data, displayAlwaysAllOuter, outerSortField) {
    this.times = Object.keys(data);
    this.data = {};

    for (let time in data) {
      const nodes = {outer: [], cluster: [], detail: []};
      const links = {cluster: [], detail: []};

      const supergroupsSet = new Set();
      const groupsSet = new Set();
      const elementsSet = new Set();

      // Process the supergroups
      data[time].forEach(supergroup => {
        if (supergroupsSet.has(supergroup.id)) {
          console.error(`Duplicate supergroup id: ${supergroup.id} in time: ${time}`);
          return;
        }

        supergroupsSet.add(supergroup.id);
        nodes.outer.push({id: `O-${supergroup.id}`, img: supergroup.img || undefined, ...this.#parseObject(supergroup, ["id", "img", this.clusterGroup]), group: this.outerGroup});

        // Process the groups
        Object.entries(supergroup[this.clusterGroup]).forEach(([groupId, group]) => {
          const elementsId = Object.keys(group[this.detailGroup]).map(id => `E-${id}`);
          const groupColor = group.color && group.color !== "" ? group.color : undefined;
          
          if (!groupsSet.has(groupId)) {
            const name = group.name && group.name !== "" ? group.name : this.noClusterLegend;
            const logo = group.logo && group.logo !== "" && group.logo !== "https://www.zerozero.pt/http://www.zerozero.pt/images/dsgn/No_Team_00001.png" ? group.logo : undefined;
            
            groupsSet.add(groupId);
            nodes.cluster.push({id: `C-${groupId}`, name: name, img: logo, color: groupColor, ...this.#parseObject(group, ["name", "logo", "img", "color", this.detailGroup]), group: this.clusterGroup, supergroups: [`O-${supergroup.id}`], elements: elementsId});
          } else {
            const index = nodes.cluster.findIndex(d => d.id === `C-${groupId}`);
            nodes.cluster[index].supergroups.push(`O-${supergroup.id}`);
            nodes.cluster[index].elements = nodes.cluster[index].elements.concat(elementsId);
          }

          links.cluster.push({id: `C-${groupId}-O-${supergroup.id}`, source: `C-${groupId}`, target: `O-${supergroup.id}`, elements: elementsId});

          // Process the elements
          Object.entries(group[this.detailGroup]).forEach(([elementId, element]) => {
            if (elementsSet.has(elementId)) {
              console.error(`Duplicate element id: ${elementId} in time: ${time}`);
              return;
            }

            elementsSet.add(elementId);
            nodes.detail.push({id: `E-${elementId}`, ...this.#parseObject(element), color: groupColor, group: this.detailGroup, cluster: `C-${groupId}`, supergroup: `O-${supergroup.id}`});
            links.detail.push({id: `E-${elementId}-O-${supergroup.id}`, source: `E-${elementId}`, target: `O-${supergroup.id}`, cluster: `C-${groupId}`, value: 1});
          });
        });
      });

      this.#sortNodes(nodes.outer, outerSortField);
      this.data[time] = { nodes, links };
    }

    if (displayAlwaysAllOuter) {
      const allOuterNodes = Object.values(this.data).reduce((acc, timeslice) => {
        return acc.concat(timeslice.nodes.outer.filter(node => !acc.some(n => n.id === node.id)));
      }, []);

      this.#sortNodes(allOuterNodes, outerSortField);
      for (let time in this.data) {
        this.data[time].nodes.outer = allOuterNodes;
      }
    }
  }

  #sortNodes(nodes, field = "name") {
    nodes.sort((a, b) => {
      if (a[field] === b[field]) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }

      return a[field].toLowerCase().localeCompare(b[field].toLowerCase());
    });
  }

  sortOuterNodes(field = "name") {
    for (let time in this.data) {
      this.#sortNodes(this.data[time].nodes.outer, field);
    };
    this.#updateGraphs();
  }

  filterOuterNodes(filter) {
    this.outerFilter = "function" === typeof filter ? filter : (() => true);
    this.#updateGraphs();
  }

  filterClusterNodes(filter) {
    this.clusterFilter = "function" === typeof filter ? filter : (() => true);
    this.#updateGraphs();
  }

  filterDetailNodes(filter) {
    this.detailFilter = "function" === typeof filter ? filter : (() => true);
    this.#updateGraphs();
  }

  searchDetailNodes(name) {
    // this.detailSearch = name
    // this.#updateGraphs();
  }

  #updateGraphs(time = this.timeline.getValue()) {
    this.drawClusterGraph(this.graphContainer, time);
    if (this.detailedNode !== null) {
      this.drawDetailsGraph(this.detailsContainer, time, this.detailedNode);
    }
  }

  drawClusterGraph(container, time) {
    const supergroups = this.data[time].nodes.outer.filter(this.outerFilter).map(d => d.id);
    const groups = this.data[time].nodes.cluster.filter(this.clusterFilter).map(d => d.id);
    const elements = this.data[time].nodes.detail.filter(this.detailFilter).map(d => d.id);
    
    const links = this.data[time].links.cluster
      .filter(d => supergroups.includes(d.target) && groups.includes(d.source) && d.elements.some(e => elements.includes(e)))
      .map(d => ({...d, value: d.elements.filter(e => elements.includes(e)).length}));
    
    const nodes = this.data[time].nodes.outer
      .filter(d => supergroups.includes(d.id))
      .concat(
        this.data[time].nodes.cluster
          .filter(d => groups.includes(d.id) && d.supergroups.some(s => supergroups.includes(s)) && d.elements.some(e => elements.includes(e)))
          .map(d => ({...d, value: links.filter(l => l.source === d.id).reduce((acc, l) => acc + l.value, 0)})))
      .map(d => ({...d}));
    
    this.clusterGraph.update(nodes, links);
    document.getElementById(container).replaceChildren(this.clusterGraph.render());
  }

  drawDetailsGraph(container, time, node) {
    const nodeId = node.id;
    const nodeFilter = node.group === this.clusterGroup ? (d) => d.cluster === nodeId : (d) => d.supergroup === nodeId;
    const linkFilter = node.group === this.clusterGroup ? (d) => d.cluster === nodeId : (d) => d.target === nodeId;

    const supergroups = this.data[time].nodes.outer.filter(this.outerFilter).map(d => d.id);
    const groups = this.data[time].nodes.cluster.filter(this.clusterFilter).map(d => d.id);
    const elements = this.data[time].nodes.detail.filter(this.detailFilter).map(d => d.id);

    const links = this.data[time].links.detail
      .filter((d) => linkFilter(d) && supergroups.includes(d.target) && groups.includes(d.cluster) && elements.includes(d.source))
      .map(d => ({...d}));
    
    const nodes = this.data[time].nodes.outer
      .filter(d => supergroups.includes(d.id)) 
      .concat(
        this.data[time].nodes.detail
          .filter((d) => nodeFilter(d) && supergroups.includes(d.supergroup) && groups.includes(d.cluster) && elements.includes(d.id)))
      .map(d => ({...d}));

    // (TODO)
    // (1) GET ALL IDS in deatil nodes that match that name
    const playerIds = ["E-1579", "E-74952"]; 

    // (2) Get the ids of the links and nodes to highligt based on the links that have that id as source
    // complete list of the ids of the links to highligth
    const highlights = playerIds !== null && playerIds.length > 0
      ? links.filter(l => playerIds.includes(l.source)).flatMap(l => [l.id, l.source, l.target])
      : [];  
    console.log(highlights);

    this.detailsGraph.update(nodes, links, node);
    document.getElementById(container).replaceChildren(this.detailsGraph.render());
  }

  updateClustersPositionsInDetailsGraph(nodes, links) {
    const clusters = this.detailedNode.group === this.clusterGroup
      ? nodes.filter(d => d.id === this.detailedNode.id)
      : nodes.filter(d => d.group === this.clusterGroup && links.some(l => l.source === d && l.target.id === this.detailedNode.id));

    this.detailsGraph.updateClusters(clusters);
  }

  drawTimeline(container) {
    document.getElementById(container).replaceChildren(this.timeline.render());
  }
}
