<div id="footer-credits" class="lateral-gap">
  <div class="credit-card">
    <div class="credit-card-author">
      <img src="./img/logo_zzlabs.png" alt="ZeroZero Labs Logo" class="author-image">
    </div>

    <div class="credit-card-text">
      <p class="text">
        O zerozero Labs é um espaço do zerozero que compila estudos realizados in-house sobre o Desporto 
        e as suas estatísticas, os quais revelam, em termos analíticos, a evolução de uma grande variedade de tópicos. 
        Considerando a grandeza da base de dados e a expertise do zerozero, os consumidores poderao ter acesso a 
        estudos que cobrem temas tão diversos como as probabilidades de chegar ao título, a disciplina no desporto 
        (número de cartões, faltas,...), comparativos de índices e valores entre diferentes Ligas, a internacionalização 
        das ligas de cada pais e as tendencias de transterencias (no que toca a talxas etárias, nacionalidades,...), 
        a distribuição da idade dos jogadores em cada escalão e sua respetiva evolução, entre outros.
      </p>
    </div>
  </div>

  <div class="credit-card">
    <div class="credit-card-author">
      <img src="./img/profile_patricia.png" alt="Patricia Perfil" class="author-image radius-50">
      <div>
        <p class="author-name">Patricia Oliveira</p>
        <p class="author-institution">FEUP</p>
      </div>
    </div>

    <div class="credit-card-text">
      <p class="text">
        Patricia Oliveira é uma estudante de 23 anos a frequentar o segundo ano do mestrado em Engenharia Informática e Computação na FEUP.
        Atualmente, encontra-se a realizar a sua tese em ambiente empresarial, em colaboração com a empresa ZOS.
        Ao longo dos últimos dois anos, tem vindo a ganhar experiência através de estágios de verão, onde se tem envolvido em projetos de desenvolvimento web.
      </p>
    </div>
  </div>
</div>

<?php if (isset($includeEvaluation) && $includeEvaluation == true) { ?>
  <div id="footer-evaluation" class="lateral-gap">
    <img src="./img/icon_attention.png" alt="Call Icon">
    <div id="footer-evaluation-content">
      <p class="title">Avalie a sua experiência</p>
      <p class="text">
        A sua opinião é valiosa para nós! Queremos garantir que a sua experiência seja sempre a melhor possível. 
        Por favor, tire um momento para nos contar como foi a sua experiência. Agradecemos imensamente pelo seu feedback!
      </p>
      <button onClick="onFormLinkClick()">Responder ao questionário</button>
    </div>
  </div>
<?php } ?>



<div id="footer-partners" class="lateral-gap">
  <p class="text">em colaboração com</p>
  <img src="./img/logo_feup.png" alt="FEUP Logo">
</div>
