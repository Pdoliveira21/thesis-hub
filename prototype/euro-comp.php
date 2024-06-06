<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campeonatos Europeus</title>
  <link rel="stylesheet" href="./src/app.css" >

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5CR1VR1VL6"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag("js", new Date());
    gtag("config", "G-5CR1VR1VL6");
  </script>
</head>

<body>
  <?php 
    $h1 = "Percurso de jogadores em seleções e equipas ao longo do tempo";
    $description = "Esta nova visualização oferece uma perspectiva única sobre como os jogadores evoluem e contribuem para os campeonatos europeus do futebol.";
    
    include "./src/header/header.php"; 
  ?>

  <?php
    $includeSessionId = false;
    $prefillMetadata = false;
    $questionnaireLink = "https://docs.google.com/forms/d/e/1FAIpQLSfHTFlOaHkSQlXpBcmkaUTXWqKaC275vmxxbSOCxKv7d9UImQ/viewform";
    include "./src/tester/overlays.php"; 
  ?>

  <?php
    $includePath = "./src/infovis";

    $endpoint = "https://www.zerozero.pt/api/v1/getGraphPlayersTeamsCompet/AppKey/tY9Qv2xP/competID/29/order/asc";
    $cacheFile = "./data/euro-comp.json";
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
    $includeEvaluation = true;
    include "./src/footer/footer.php"; 
  ?>
</body>
</html>