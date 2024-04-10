<!DOCTYPE html>

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campeonatos Europeus</title>
</head>

<body>
  <?php
    $includePath = "./src";

    $title = "Campeonatos da Europa";
    $endpoint = "https://www.zerozero.pt/api/v1/getGraphPlayersCountryCompet/AppKey/tY9Qv2xP/competID/51";
    $cacheFile = "./data/brasil-liga.json";
    $dataPath = "data.seasons";

    $defaultSort = "fk_continente";
    $outerGroup = "national teams";
    $clusterGroup = "teams";
    $detailGroup = "players";
    $outerLabel = "Seleções";
    $clusterLabel = "Equipas";
    $detailLabel = "Jogadores";
    $graphConfigs = json_encode(array(
      "clusterGroup" => "teams",
      "noClusterLegend" => "Sem Equipa",
      "defaultOuterSortField" => "fk_continente",
    ));

    include "./src/infographic.php"; 
  ?>
</body>