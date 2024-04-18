<!DOCTYPE html>

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campeonatos Brasileiros</title>
</head>

<body>
  <?php
    $includePath = "./src/infovis";

    $title = "Campeonatos Brasileiros";
    $endpoint = "https://www.zerozero.pt/api/v1/getGraphPlayersCountryCompet/AppKey/tY9Qv2xP/competID/51";
    $cacheFile = "./data/brasil-liga.json";
    $dataPath = "data.seasons";

    $defaultSort = "fk_continente";
    $outerGroup = "national teams";
    $clusterGroup = "teams";
    $detailGroup = "players";
    $outerLabel = "Equipas";
    $clusterLabel = "Seleções";
    $detailLabel = "Jogadores";
    $graphConfigs = json_encode(array(
      "clusterGroup" => "teams",
      "noClusterLegend" => "---",
      "defaultOuterSortField" => "fk_continente",
    ));

    include "./src/infovis/infographic.php"; 
  ?>
</body>