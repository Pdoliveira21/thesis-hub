// (IMPORT) import { ClusterGraph } from './ClusterGraph.js';
// import d3 from 'd3';
// import Timeline from './scrubbers/Timeline.js';

class TemporalGraph {

  constructor(data, {
    width = 800,
    height = 800,
    nodeSize = 24,
    nodeSpace = 15,
    color = d3.scaleOrdinal(d3.schemeCategory10),
    outerGroup = "national teams",
    clusterGroup = "clubs",
    detailGroup = "players",
    graphContainer = "graph-container",
    detailsContainer = "details-container",
    timelineContainer = "timeline-container"
  }) {

    this.outerGroup = outerGroup;
    this.clusterGroup = clusterGroup;
    this.detailGroup = detailGroup;
    this.parseData(data);
    
    this.detailedNode = null;
    this.detailsGraph = new DetailGraph(width, height, nodeSize, nodeSpace, outerGroup, detailGroup, color);
    this.clusterGraph = new ClusterGraph(width, height, nodeSize, nodeSpace, outerGroup, clusterGroup, color, (node) => {
      this.detailedNode = node;
      this.drawDetailsGraph(detailsContainer, this.timeline.getValue(), this.detailedNode);
    }, (nodes, links) => {
      if (this.detailedNode === null) return;

      if (this.detailedNode.group === clusterGroup) {
        this.detailsGraph.updateCluster([nodes.find(d => d.id === this.detailedNode.id)]);
      } else {
        this.detailsGraph.updateCluster(nodes.filter(d => d.group === this.clusterGroup && links.some(l => l.source === d && l.target === this.detailedNode)));
      }
    });
    
    this.timeline = new Timeline(this.times, 1500, (value) => {
      this.drawClusterGraph(graphContainer, value);
      if (this.detailedNode !== null) {
        this.drawDetailsGraph(detailsContainer, value, this.detailedNode);
      }
    });

    this.drawTimeline(timelineContainer);    
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
        nodes.outer.push({id: `O-${supergroup.id}`, name: supergroup.name, group: this.outerGroup});

        // Process the groups
        Object.entries(supergroup[this.clusterGroup]).forEach(([groupId, group]) => {    
          const elementsCount = Number(group.count) || Object.keys(group[this.detailGroup]).length;
          if (!groupsSet.has(groupId)) {
            groupsSet.add(groupId);
            nodes.cluster.push({id: `C-${groupId}`, name: group.name, group: this.clusterGroup, value: elementsCount});
          } else {
            const index = nodes.cluster.findIndex(d => d.id === `C-${groupId}`);
            nodes.cluster[index].value += elementsCount;
          }

          links.cluster.push({source: `C-${groupId}`, target: `O-${supergroup.id}`, value: elementsCount});

          // Process the elements
          Object.entries(group[this.detailGroup]).forEach(([elementId, element]) => {
            if (elementsSet.has(elementId)) {
              console.error(`Duplicate element id: ${elementId} in time: ${time}`);
              return;
            }

            elementsSet.add(elementId);
            nodes.detail.push({id: `E-${elementId}`, name: element.name, group: this.detailGroup, cluster: `C-${groupId}`, supergroup: `O-${supergroup.id}`});
            links.detail.push({source: `E-${elementId}`, target: `O-${supergroup.id}`, cluster: `C-${groupId}`, value: 1});
          });
        });
      });

      this.data[time] = { nodes, links };
    }
  }

  // (NOTE): logic of keeping only the national teams per year, not all all the time for now
  // so recalculate fixed positions each update still needed
  // future: extra boolean to pass this configuration to the ClusterGraph

  drawClusterGraph(container, time) {
    const nodes = this.data[time].nodes.outer.concat(this.data[time].nodes.cluster).map(d => ({...d}));
    const links = this.data[time].links.cluster.map(d => ({...d}));

    this.clusterGraph.update(nodes, links);
    document.getElementById(container).replaceChildren(this.clusterGraph.render());
  }

  drawDetailsGraph(container, time, node) {
    const nodeId = node.id;

    if (node.group === this.clusterGroup) {
      const nodes = this.data[time].nodes.outer.concat(this.data[time].nodes.detail.filter(d => d.cluster === nodeId)).map(d => ({...d}));
      const links = this.data[time].links.detail.filter(d => d.cluster === nodeId).map(d => ({...d}));

      this.detailsGraph.update(nodes, links, node);
      document.getElementById(container).replaceChildren(this.detailsGraph.render());
    } else {
      const nodes = this.data[time].nodes.outer.concat(this.data[time].nodes.detail.filter(d => d.supergroup === nodeId)).map(d => ({...d}));
      const links = this.data[time].links.detail.filter(d => d.target === nodeId).map(d => ({...d}));

      this.detailsGraph.update(nodes, links, node);
      document.getElementById(container).replaceChildren(this.detailsGraph.render());
    }
  }

  drawTimeline(container) {
    document.getElementById(container).replaceChildren(this.timeline.render());
  }
}