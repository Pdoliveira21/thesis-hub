<!-- Load Font Awesome and custom CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
<link rel="stylesheet" href="<?php echo $includePath.'/infographic.css'; ?>" ></style>


<div id="vis-container">
  <p class="vis-title"><?php echo $title ?></p>
  
  <div class="vis-content">
    <div class="vis-content-container" style="width: min(100%, 1.5 * <?php echo json_decode($graphConfigs, true)['width'] ?? 800; ?>px + 4 * 1rem">
      <div class="vis-loading" id="controls-loading">
        <p class="vis-loading-text"></p>
        <i class="fas fa-spinner fa-spin"></i>
      </div>

      <div class="vis-controls">
        <div class="vis-preview">
          <button id="controls-exchange" class="control-btn control-btn-exchange" style="visibility: hidden;" onclick="exchangeGraphs()">
            <i class="fas fa-exchange-alt"></i>
          </button>
          <span id="graph-container" class="vis-main-graph"></span>
          <span id="details-container"></span>
        </div>

        <div class="vis-controls-container">
          <div id="controls-sort"></div>
          <div id="controls-filters"></div>
          <div id="controls-search"></div>
        </div>
      </div>

      <div class="vis-graph">
        <span class="vis-graph-space"></span>
        <span id="timeline-container" class="vis-timeline"></span>
      </div>
    </div>
  </div>
</div>


<!-- Load D3.js and d3-bboxCollide -->
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-bboxCollide@1.0.4"></script>

<script type="module">
  // Import Dependencies
  import { TemporalGraph } from "<?php echo $includePath.'/TemporalGraph.js'; ?>";
  import { Sort } from "<?php echo $includePath.'/scrubbers/Sort.js'; ?>";
  import { Filter } from "<?php echo $includePath.'/scrubbers/Filter.js'; ?>";
  import { Search } from "<?php echo $includePath.'/scrubbers/Search.js'; ?>";

  import { accessObjectByString } from "<?php echo $includePath.'/utils/Utils.js'; ?>";
  import { dictionary } from "<?php echo $includePath.'/utils/Dictionary.js'; ?>";

  // Passes PHP variables to JavaScript
  const endpoint = "<?php echo $endpoint ?>";
  const dataPath = "<?php echo $dataPath ?>";

  const outerGroup = "<?php echo $outerGroup ?>";
  const outerLabel = "<?php echo $outerLabel ?>";
  const clusterGroup = "<?php echo $clusterGroup ?>";
  const clusterLabel = "<?php echo $clusterLabel ?>";
  const detailGroup = "<?php echo $detailGroup ?>";
  const detailLabel = "<?php echo $detailLabel ?>";
  const defaultSort = "<?php echo $defaultSort ?>";
  const graphConfigs = <?php echo $graphConfigs ?>;
  graphConfigs.graphClickCallback = () => {
    document.getElementById("controls-exchange").style.visibility = "visible";
  }

  // Fetch the data
  document.querySelector("#controls-loading p").textContent = dictionary.loading_data;
  fetch(endpoint)
    .then(response => response.json())
    .then(data => {
      initInfoVis(data);
      document.querySelector("#controls-loading").style.display = "none";
    })
    .catch(error => {
      document.querySelector("#controls-loading p").textContent = dictionary.error_loading_data;
      document.querySelector("#controls-loading i").style.display = "none";
    });

  function initInfoVis(raw) {
    const data = dataPath ? accessObjectByString(raw, dataPath) : raw;
    let graph = new TemporalGraph(data, graphConfigs);
    
    const outerPrefix = outerGroup.replace(' ', '-');
    const clusterPrefix = clusterGroup.replace(' ', '-');
    const detailPrefix = detailGroup.replace(' ', '-');
    
    const sortFields = Sort.extractSortFields(data, ["id", "img", "teams"]);
    if (sortFields.length > 0) {
      const sortNationalTeams = new Sort(outerLabel, outerPrefix, sortFields, defaultSort, (sort) => {
        if (graph && "object" === typeof graph) graph.sortOuterNodes(sort);
      });
      document.getElementById("controls-sort").append(sortNationalTeams.render());
    }

    const filters = Filter.extractFilters(data, outerGroup, clusterGroup, detailGroup, ["id", "name", "img", "logo", "color", "count", "link"]);
    function initFilter(group, name, prefix, callback) {
      if (filters[group]) {
        const filterGroup = new Filter(name, prefix, filters[group], (filter) => {
          if (graph && "object" === typeof graph) callback(filter);
        });
        document.getElementById("controls-filters").append(filterGroup.render());
      }
    }

    initFilter(outerGroup, outerLabel, outerPrefix, (filter) => graph.filterOuterNodes(filter));
    initFilter(clusterGroup, clusterLabel, clusterPrefix, (filter) => graph.filterClusterNodes(filter));
    initFilter(detailGroup, detailLabel, detailPrefix, (filter) => graph.filterDetailNodes(filter));
    
    const search = Search.extractSearchNames(data, "players");
    if (search.length > 0) {
      const searchPlayers = new Search(detailLabel, detailPrefix, search, (name) => {
        if (graph && "object" === typeof graph) graph.searchDetailNodes(name, searchPlayers.result());
      });
      document.getElementById("controls-search").append(searchPlayers.render());
    }
  }
</script>

<script>
  function exchangeGraphs() {
    const clusterGraph = document.getElementById("graph-container");
    const detailsGraph = document.getElementById("details-container");
    if (clusterGraph && clusterGraph.classList.contains("vis-main-graph")) {
      clusterGraph.classList.remove("vis-main-graph");
      detailsGraph.classList.add("vis-main-graph");
    } else if (detailsGraph && detailsGraph.classList.contains("vis-main-graph")) {
      detailsGraph.classList.remove("vis-main-graph");
      clusterGraph.classList.add("vis-main-graph");
    }
  }
</script>
