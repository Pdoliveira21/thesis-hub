<!DOCTYPE html>

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Custom Test</title>
</head>

<body>
  <?php
    $includePath = "./src";

    $title = "Custom Test";
    $endpoint = "./data/data.json";
    $dataPath = null;

    $defaultSort = "name";
    $outerGroup = "national teams";
    $clusterGroup = "clubs";
    $detailGroup = "players";
    $outerLabel = "Seleções";
    $clusterLabel = "Equipas";
    $detailLabel = "Jogadores";
    $graphConfigs = json_encode(array(
      "clusterGroup" => "clubs",
      "noClusterLegend" => "Sem Equipa",
      "defaultOuterSortField" => "name",
    ));

    include "./src/infographic.php"; 
  ?>
</body>