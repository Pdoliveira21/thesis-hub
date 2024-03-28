import { ClusterGraph } from './graphs/ClusterGraph.js';
import { DetailGraph } from './graphs/DetailGraph.js';
import { Timeline } from './scrubbers/Timeline.js';

import { decodeHtmlEntities, decodeWindows1252 } from './utils/Utils.js';
import { dictionary } from './utils/Dictionary.js';

/**
 * @class TemporalGraph
 * @description A class that contains the logic to create a temporal graph component.
 * @param {Object} data - The data to be used in the graph.
 * @param {Object} options - The options to be used in the graph configuration.
 */
export class TemporalGraph {

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
    timelineContainer = "timeline-container",
    graphClickCallback = () => {},
  }) {
    this.outerSortField = defaultOuterSortField;
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
    
    this.detailSearchIds = [];
    this.detailedNode = null;
    this.detailsGraph = new DetailGraph(width, height, nodeSize, nodeSpace, outerGroup, detailGroup, (node) => {
      // Provoke a click event on the corresponding cluster node to update the details graph.
      const clusterNode = this.clusterGraph.node.filter(d => d.id === node.id).node();
      if (clusterNode !== null) clusterNode.dispatchEvent(new PointerEvent("click"));
    });
    this.clusterGraph = new ClusterGraph(width, height, nodeSize, nodeSpace, outerGroup, clusterGroup, (node) => {
      this.detailedNode = node;
      this.drawDetailsGraph(this.detailsContainer, this.timeline.getValue(), this.detailedNode);
      if ("function" === typeof graphClickCallback) graphClickCallback();
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
      newObj[key] = key === "name" ? decodeHtmlEntities(decodeWindows1252(obj[key])) : obj[key];
    });
    return newObj;
  }

  // This method is used to parse the data to be used in the graphs to a more suitable format.
  parseData(data, displayAlwaysAllOuter, outerSortField) {
    this.times = [];
    this.data = {};

    for (let time in data) {
      if (!Array.isArray(data[time]) || data[time].length === 0) continue;
      this.times.push(time);

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
          const groupName  = group.name && group.name !== "" ? decodeHtmlEntities(decodeWindows1252(group.name)) : this.noClusterLegend;           
          const groupColor = group.color && group.color !== "" ? group.color : undefined;
          const groupLogo  = group.logo && group.logo !== "" && group.logo !== "https://www.zerozero.pt/http://www.zerozero.pt/images/dsgn/No_Team_00001.png" ? group.logo : undefined;
          const elementsId = Object.keys(group[this.detailGroup]).map(id => `E-${id}`);
          
          if (!groupsSet.has(groupId)) {
            groupsSet.add(groupId);
            nodes.cluster.push({id: `C-${groupId}`, name: groupName, img: groupLogo, color: groupColor, ...this.#parseObject(group, ["id", "name", "logo", "img", "color", this.detailGroup]), group: this.clusterGroup, supergroups: [`O-${supergroup.id}`], elements: elementsId});
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
            nodes.detail.push({id: `E-${elementId}`, ...this.#parseObject(element, ["id"]), color: groupColor, group: this.detailGroup, cluster: `C-${groupId}`, clusterInfo: {name: groupName, img: groupLogo}, supergroup: `O-${supergroup.id}`});
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

  // This method is used to sort the outer nodes by a specific field.
  sortOuterNodes(field = "name") {
    this.outerSortField = field;

    for (let time in this.data) {
      this.#sortNodes(this.data[time].nodes.outer, field);
    };
    this.#updateGraphs();
  }

  // This method is used to filter the outer nodes by a specific function.
  filterOuterNodes(filter) {
    this.outerFilter = "function" === typeof filter ? filter : (() => true);
    this.#updateGraphs();
  }

  // This method is used to filter the cluster nodes by a specific function.
  filterClusterNodes(filter) {
    this.clusterFilter = "function" === typeof filter ? filter : (() => true);
    this.#updateGraphs();
  }

  // This method is used to filter the detail nodes by a specific function.
  filterDetailNodes(filter) {
    this.detailFilter = "function" === typeof filter ? filter : (() => true);
    this.#updateGraphs();
  }

  // This method is used to search for a specific detail node by its name.
  // It updates the text of the result container with the times where the node was found (whitout considering the filters).
  searchDetailNodes(name, resultContainer) {
    const detailSearchTimes = new Set();
    this.detailSearchIds = name !== null
      ? [...new Set(Object.entries(this.data).flatMap(([time, timeslice]) => {
          const foundIds = timeslice.nodes.detail.filter(d => d.name === name).flatMap(d => d.id)
          if (foundIds.length > 0) detailSearchTimes.add(time);
          return foundIds;
        }))]
      : [];
    
    const resultElement = document.getElementById(resultContainer);
    if (resultElement) {
      resultElement.textContent = (detailSearchTimes.size > 0)
        ? `${Array.from(detailSearchTimes).join(" - ")} (${dictionary.discarding_filters})` : "";
    }

    this.spotlightClusterGraph();
    if (this.detailedNode !== null) {
      this.spotlightDetailsGraph();
    }
  }

  // This method is used to update the graphs, cluster and detail, based on the time value.
  #updateGraphs(time = this.timeline.getValue()) {
    this.drawClusterGraph(this.graphContainer, time);
    if (this.detailedNode !== null) {
      this.drawDetailsGraph(this.detailsContainer, time, this.detailedNode);
    }
  }

  // This method is used to draw the cluster graph. 
  // Selecting the nodes and links to be displayed according to the current time value and the filters.
  drawClusterGraph(container, time) {
    const supergroups = this.data[time].nodes.outer.filter(this.outerFilter).map(d => d.id);
    const groups = this.data[time].nodes.cluster.filter(this.clusterFilter).map(d => d.id);
    const elements = this.data[time].nodes.detail.filter(d => this.detailFilter(d) && supergroups.includes(d.supergroup) && groups.includes(d.cluster)).map(d => d.id);
    
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
    
    this.clusterGraph.update(nodes, links, this.outerSortField);
    this.spotlightClusterGraph(links, elements);
    document.getElementById(container).replaceChildren(this.clusterGraph.render());
  }

  // This method is used to spotlight specific components of the cluster graph. 
  // Selecting the ids to be revealed according to the displayed data and the search.
  spotlightClusterGraph(links, elements) {
    if (this.detailSearchIds.length === 0) {
      this.clusterGraph.spotlight(new Set());
      return;
    }

    if (elements === undefined) {
      const time = this.timeline.getValue();
      elements = this.data[time].nodes.detail.filter(this.detailFilter).map(d => d.id);
    }

    const elementSearchIds = this.detailSearchIds.filter(id => elements.includes(id));
    if (elementSearchIds.length > 0) {
      if (links === undefined) {
        links = this.clusterGraph.link.data().map(d => ({...d, source: d.source.id, target: d.target.id}));
      }
    
      const highlights = new Set(links.filter(l => l.elements.some(e => elementSearchIds.includes(e))).flatMap(l => [l.id, l.source, l.target]));
      this.clusterGraph.spotlight(highlights);
    } else {
      this.clusterGraph.spotlight(new Set());
    }
  }

  // This method is used to draw the details graph.
  // Selecting the nodes and links to be displayed according to the current time value and the filters.
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

    this.detailsGraph.update(nodes, links, node);
    this.spotlightDetailsGraph(links);
    document.getElementById(container).replaceChildren(this.detailsGraph.render());
  }

  // This method is used to spotlight specific components of the details graph.
  // Selecting the ids to be revealed according to the displayed data and the search.
  spotlightDetailsGraph(links) {
    if (this.detailSearchIds.length > 0) {
      if (links === undefined) {
        links = this.detailsGraph.link.data().map(d => ({...d, source: d.source.id, target: d.target.id}));
      }

      const highlights = new Set(links.filter(l => this.detailSearchIds.includes(l.source)).flatMap(l => [l.id, l.source, l.target]));
      this.detailsGraph.spotlight(highlights);
    } else {
      this.detailsGraph.spotlight(new Set());
    }
  }

  // This method is used to update the positions of the clusters in the details graph based on their position in the cluster graph.
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
