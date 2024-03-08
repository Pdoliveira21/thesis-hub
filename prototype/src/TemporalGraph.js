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
    defaultElementFilter = () => true,
    outerGroup = "national teams",
    clusterGroup = "clubs",
    detailGroup = "players",
    graphContainer = "graph-container",
    detailsContainer = "details-container",
    timelineContainer = "timeline-container"
  }) {

    this.displayAlwaysAllOuter = displayAlwaysAllOuter;
    this.outerSortField = defaultOuterSortField;
    this.outerFilter = defaultOuterFilter;
    this.clusterFilter = defaultClusterFilter;
    this.elementFilter = defaultElementFilter;
    this.outerGroup = outerGroup;
    this.clusterGroup = clusterGroup;
    this.detailGroup = detailGroup;
    this.graphContainer = graphContainer;
    this.detailsContainer = detailsContainer;
    this.parseData(data);

    this.detailedNode = null;
    this.detailsGraph = new DetailGraph(width, height, nodeSize, nodeSpace, outerGroup, detailGroup);
    this.clusterGraph = new ClusterGraph(width, height, nodeSize, nodeSpace, outerGroup, clusterGroup, (node) => {
      this.detailedNode = node;
      this.drawDetailsGraph(this.detailsContainer, this.timeline.getValue(), this.detailedNode);
    }, (nodes, links) => {
      if (this.detailedNode === null) return;
      this.updateClustersPositionsInDetailsGraph(nodes, links);
    });

    this.timeline = new Timeline(this.times, 2500, (value) => {
      this.drawClusterGraph(graphContainer, value);
      if (this.detailedNode !== null) {
        this.drawDetailsGraph(this.detailsContainer, value, this.detailedNode);
      }
    });

    this.drawTimeline(timelineContainer);
  }

  #parseObject(obj, exclude = []) {
    const newObj = {};
    Object.keys(obj).filter(key => !exclude.includes(key)).forEach(key => {
      newObj[key] = obj[key];
    });
    return newObj;
  }

  parseData(data) {
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
          // const elementsCount = Number(group.count) || Object.keys(group[this.detailGroup]).length;
          const elementsId = Object.keys(group[this.detailGroup]).map(id => `E-${id}`);
          const groupColor = group.color && group.color !== "" ? group.color : undefined;
          
          if (!groupsSet.has(groupId)) {
            const name = group.name && group.name !== "" ? group.name : "No Team";
            const logo = group.logo && group.logo !== "" && group.logo !== "https://www.zerozero.pt/http://www.zerozero.pt/images/dsgn/No_Team_00001.png" ? group.logo : undefined;
            
            groupsSet.add(groupId);
            nodes.cluster.push({id: `C-${groupId}`, name: name, img: logo, color: groupColor, group: this.clusterGroup, supergroup: [`O-${supergroup.id}`], element: elementsId});
          } else {
            const index = nodes.cluster.findIndex(d => d.id === `C-${groupId}`);
            nodes.cluster[index].supergroup.push(`O-${supergroup.id}`);
            nodes.cluster[index].element = nodes.cluster[index].element.concat(elementsId);
          }

          links.cluster.push({id: `C-${groupId}-O-${supergroup.id}`, source: `C-${groupId}`, target: `O-${supergroup.id}`, element: elementsId});

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

      this.#sortNodes(nodes.outer, this.outerSortField);
      this.data[time] = { nodes, links };
    }

    if (this.displayAlwaysAllOuter) {
      const allOuterNodes = Object.values(this.data).reduce((acc, timeslice) => {
        return acc.concat(timeslice.nodes.outer.filter(node => !acc.some(n => n.id === node.id)));
      }, []);

      this.#sortNodes(allOuterNodes, this.outerSortField);
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

    // TODO: (future extract method to a updateGraphs method)
    this.drawClusterGraph(this.graphContainer, this.timeline.getValue());
    if (this.detailedNode !== null) {
      this.drawDetailsGraph(this.detailsContainer, this.timeline.getValue(), this.detailedNode);
    }
  }

  filterOuterNodes(filter) {
    this.outerFilter = "function" === typeof filter ? filter : (() => true);

    // TODO: (future extract method to a updateGraphs method)
    this.drawClusterGraph(this.graphContainer, this.timeline.getValue());
    if (this.detailedNode !== null) {
      this.drawDetailsGraph(this.detailsContainer, this.timeline.getValue(), this.detailedNode);
    }
  }

  filterClusterNodes(filter) {
    this.clusterFilter = "function" === typeof filter ? filter : (() => true);

    // TODO: (future extract method to a updateGraphs method)
    this.drawClusterGraph(this.graphContainer, this.timeline.getValue());
    if (this.detailedNode !== null) {
      this.drawDetailsGraph(this.detailsContainer, this.timeline.getValue(), this.detailedNode);
    }
  }

  filterElementNodes(filter) {
    this.elementFilter = "function" === typeof filter ? filter : (() => true);

    // TODO: (future extract method to a updateGraphs method)
    this.drawClusterGraph(this.graphContainer, this.timeline.getValue());
    if (this.detailedNode !== null) {
      this.drawDetailsGraph(this.detailsContainer, this.timeline.getValue(), this.detailedNode);
    }
  }

  drawClusterGraph(container, time) {
    const supergroups = this.data[time].nodes.outer.filter(this.outerFilter).map(d => d.id);
    const groups = this.data[time].nodes.cluster.filter(this.clusterFilter).map(d => d.id);
    const elements = this.data[time].nodes.detail.filter(this.elementFilter).map(d => d.id);
    
    const links = this.data[time].links.cluster.filter(d => supergroups.includes(d.target) && groups.includes(d.source) && d.element.some(e => elements.includes(e)))
      .map(d => ({...d, value: d.element.filter(e => elements.includes(e)).length}));
    const nodes = this.data[time].nodes.outer.filter(d => supergroups.includes(d.id)) // TODO: (future) show all outer nodes?
      .concat(this.data[time].nodes.cluster
        .filter(d => groups.includes(d.id) && d.supergroup.some(s => supergroups.includes(s)) && d.element.some(e => elements.includes(e)))
        .map(d => ({...d, value: links.filter(l => l.source === d.id).reduce((acc, l) => acc + l.value, 0)}))) // TODO: change to calculate value based on elements to be present?
      .map(d => ({...d}));
    
    this.clusterGraph.update(nodes, links);
    document.getElementById(container).replaceChildren(this.clusterGraph.render());
  }

  // TODO: (future) improve filter logic (e.g. filter by supergroup, group, element, etc. only once before drawing the graphs?)
  drawDetailsGraph(container, time, node) {
    const nodeId = node.id;
    const nodeFilter = node.group === this.clusterGroup ? (d) => d.cluster === nodeId : (d) => d.supergroup === nodeId;
    const linkFilter = node.group === this.clusterGroup ? (d) => d.cluster === nodeId : (d) => d.target === nodeId;

    const supergroups = this.data[time].nodes.outer.filter(this.outerFilter).map(d => d.id);
    const groups = this.data[time].nodes.cluster.filter(this.clusterFilter).map(d => d.id);
    const elements = this.data[time].nodes.detail.filter(this.elementFilter).map(d => d.id);

    const links = this.data[time].links.detail.filter((d) => linkFilter(d) && supergroups.includes(d.target) && groups.includes(d.cluster) && elements.includes(d.source)).map(d => ({...d}));
    const nodes = this.data[time].nodes.outer.filter(d => supergroups.includes(d.id)) // TODO: (future) show all outer nodes?
      .concat(this.data[time].nodes.detail
        .filter((d) => nodeFilter(d) && supergroups.includes(d.supergroup) && groups.includes(d.cluster) && elements.includes(d.id)))
      .map(d => ({...d}));

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