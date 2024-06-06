<!-- Include overlays elements to test purposes -->
<link rel="stylesheet" type="text/css" href="./src/tester/overlays.css">

<?php if (isset($includeSessionId) && $includeSessionId == true) { ?>
  <div id="session-uuid"><?php echo session_id(); ?></div>
<?php } ?>

<div id="form-notice" class="lateral-gap">
  <div id="form-notice-content">
    <span>
      <p>
        <i class="fas fa-info-circle" aria-hidden="true"></i>
        <strong>Feedback</strong>
      </p>

      <p>Ajude-nos a melhorar a visualização! Por favor, preencha o seguinte questionário de avaliação.</p>
      <button onClick="onFormLinkClick()">Responder ao Questionário</button>
    </span>
    
    <i id="form-notice-close" class="fas fa-times" onClick="onNoticeCloseClick()" aria-hidden="true"></i>
  </div>
</div>

<script>
  // Redirect to Google Form with the appropriate parameters
  function onFormLinkClick() {
    <?php if (isset($prefillMetadata) && $prefillMetadata == true) { ?>
      const openedAt = new Date().toLocaleString();
      const sessionId = "<?php echo session_id(); ?>";
      const interaction = window.matchMedia("(hover: hover)").matches ? "movimento do rato" : "duplo clique";

      window.open(`<?php echo $questionnaireLink ?>?usp=pp_url&entry.62397297=${openedAt}&entry.2080807630=${sessionId}&entry.1130219802=${interaction}`, "_blank");
    <?php } else { ?>
      window.open("<?php echo $questionnaireLink ?>", "_blank");
    <?php } ?>
  }

  // Close the notice
  function onNoticeCloseClick() {
    document.getElementById("form-notice").style.display = "none";
  }
</script>
