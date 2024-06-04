<?php session_start(); ?>

<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campeonatos do Mundo</title>
  <link rel="stylesheet" href="./src/app.css" >
</head>

<body>
  <?php 
    $h1 = "Percurso de jogadores em seleções e equipas ao longo do tempo";
    $description = "Desenvolvido como parte de uma tese de pesquisa, esta nova visualização oferece uma perspectiva única sobre como os jogadores evoluem e contribuem para os campeonatos do mundo do futebol.";
    
    include "./src/header/header.php"; 
  ?>

  <?php
    $includePath = "./src/infovis";

    $endpoint = "https://www.zerozero.pt/api/v1/getGraphPlayersTeamsCompet/AppKey/tY9Qv2xP/competID/30/order/asc";
    $cacheFile = "./data/world-cups.json";
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

    include "./src/infovis/infographic.php"; 
  ?>

  <?php
    $includeEvaluation = false;
    include "./src/footer/footer.php"; 
  ?>
</body>
</html>