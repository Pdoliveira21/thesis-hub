<style>
  body {
    margin: 0;
  }
  
  .sticky-notice {
    text-align: center;
    position: sticky;
    top: 0;
    background-color: #faebd7;
    padding: 1rem 0;
    z-index: 250;
    margin-bottom: 1rem;
  }

  .sticky-notice p {
    margin: 0;
  }
</style>

<div class="sticky-notice">
  <p>
    Ajuda-nos a melhorar a visualização! Por favor, preenche o seguinte questionário de avaliação.
    <button onClick="openGoogleForm()">Google Form</button>
  </p>
</div>

<script>
  function openGoogleForm() {
    const openedAt = (new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '/');
    const sessionId = "<?php echo session_id(); ?>";
    const interaction = window.matchMedia('(hover: hover)').matches ? "movimento do rato" : "duplo clique";
    
    // Redirect to Google Form with the appropriate parameters
    window.open(`https://docs.google.com/forms/d/e/1FAIpQLSeviCtsr1F_5sxDZYLAq3Z-mGno-2teQACco0jl3v67ZJtFDg/viewform?usp=pp_url&entry.62397297=${openedAt}&entry.2080807630=${sessionId}&entry.1130219802=${interaction}`, "_blank");
  }
</script>
