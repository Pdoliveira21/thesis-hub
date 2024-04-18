<?php session_start(); ?>

<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campeonatos do Mundo</title>

  <link rel="stylesheet" href="./src/app.css" >

  <!-- Hotjar Tracking Code for https://clubs-in-nations.zerozero.pt/ -->
  <script>
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:3930621,hjsv:6};
        a=o.getElementsByTagName("head")[0];
        r=o.createElement("script");r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,"https://static.hotjar.com/c/hotjar-",".js?sv=");
  </script>

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5CR1VR1VL6"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag("js", new Date());

    gtag("set", { "user_properties": {
        "php_session_id": "<?php echo session_id(); ?>"
    }});
    gtag("config", "G-5CR1VR1VL6");
  </script>
</head>

<body>
  <?php 
    $h1 = "Percurso de jogadores em seleções e equipas ao longo do tempo";
    $description = "Desenvolvido como parte de uma tese de pesquisa, esta nova visualização oferece uma perspectiva única sobre como os jogadores evoluem e contribuem para os campeonatos do mundo do futebol.";
    
    include "./src/header/header.php"; 
  ?>

  <?php include "./src/tester/overlays.php"; ?>

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
    $includeEvaluation = true;
    include "./src/footer/footer.php"; 
  ?>
</body>
</html>