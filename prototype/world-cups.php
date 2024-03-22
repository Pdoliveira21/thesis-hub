<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>World Cups</title>
</head>

<body>
  <?php
    $includePath = "./src";

    $title = "Percurso de Jogadores em Seleções e Equipas ao Longo do Tempo";
    $endpoint = "https://www.zerozero.pt/api/v1/getGraphPlayersTeamsCompet/AppKey/tY9Qv2xP/competID/30";
    // $endpoint = "data/asd.json";
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
</html>