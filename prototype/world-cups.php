<!DOCTYPE html>

<head>
  <meta charset="UTF-8">
  <title>World Cups</title>
</head>

<body>
  <?php 
    $title = "Percurso de Jogadores em Seleções e Equipas ao Longo do Tempo";
    $endpoint = 'https://www.zerozero.pt/api/v1/getGraphPlayersTeamsCompet/AppKey/tY9Qv2xP/competID/30';
    $dataPath = 'data.seasons';

    $defaultSort = 'fk_continente';
    $outerGroup = 'national teams';
    $clusterGroup = 'teams';
    $detailGroup = 'players';
    $outerLabel = 'Seleções';
    $clusterLabel = 'Equipas';
    $detailLabel = 'Jogadores';
    $graphConfigs = json_encode(array(
      'clusterGroup' => 'teams',
      'noClusterLegend' => 'No Team',
      'defaultOuterSortField' => 'fk_continente',
    ));

    include 'src/infographic.php'; 
  ?>
</body>