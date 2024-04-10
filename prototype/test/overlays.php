<style>
  #session-uuid {
    position: absolute;
    top: 4px;
    right: 4px;
    color: #cacaca;
    font-family: Monospace;
    font-size: 12px;
  }

  #form-notice {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 250;
    font-family: Arial, sans-serif;
    background-color: #fff0d9;
  }

  #form-notice-content {
    display: flex;
    justify-content: space-around;
    column-gap: 1rem;
    padding: 1rem;
    max-width: 1700px;
    margin: 0 auto;
  }

  #form-notice-content button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    background-color: #ff9800;
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
  }

  #form-notice-content button:hover {
    background-color: #0d6dbe;
  }

  #form-notice-close {
    cursor: pointer;
    margin-top: 0.85rem;
    font-size: larger;
  }
</style>

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
    const openedAt = (new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '/');
    const sessionId = "<?php echo session_id(); ?>";
    const interaction = window.matchMedia('(hover: hover)').matches ? "movimento do rato" : "duplo clique";
    
    window.open(`https://docs.google.com/forms/d/e/1FAIpQLSeviCtsr1F_5sxDZYLAq3Z-mGno-2teQACco0jl3v67ZJtFDg/viewform?usp=pp_url&entry.62397297=${openedAt}&entry.2080807630=${sessionId}&entry.1130219802=${interaction}`, "_blank");
  }

  function onNoticeCloseClick() {
    document.getElementById("form-notice").style.display = "none";
  }
</script>
