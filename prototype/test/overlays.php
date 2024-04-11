<!-- Include overlays elements to test purposes -->
<link rel="stylesheet" href="./test/overlays.css" >

<div id="session-uuid"><?php echo session_id(); ?></div>

<div id="form-notice">
  <div id="form-notice-content">
    <span>
      <p>
        <i class="fas fa-info-circle" aria-hidden="true"></i>
        <strong>Feedback</strong>
      </p>

      <p>Ajuda-nos a melhorar a visualização! Por favor, preenche o seguinte questionário de avaliação.</p>
      <button onClick="onFormLinkClick()">Responder ao Questionário</button>
    </span>
    
    <i id="form-notice-close" class="fas fa-times" onClick="onNoticeCloseClick()" aria-hidden="true"></i>
  </div>
</div>

<script>
  // Redirect to Google Form with the appropriate parameters
  function onFormLinkClick() {
    const openedAt = (new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, "").replace(/-/g, '/');
    const sessionId = "<?php echo session_id(); ?>";
    const interaction = window.matchMedia("(hover: hover)").matches ? "movimento do rato" : "duplo clique";
    
    window.open(`https://docs.google.com/forms/d/e/1FAIpQLSeviCtsr1F_5sxDZYLAq3Z-mGno-2teQACco0jl3v67ZJtFDg/viewform?usp=pp_url&entry.62397297=${openedAt}&entry.2080807630=${sessionId}&entry.1130219802=${interaction}`, "_blank");
  }

  // Close the notice
  function onNoticeCloseClick() {
    document.getElementById("form-notice").style.display = "none";
  }
</script>
