// ----- Scrubber -----

/*
  COPYRIGHT 2020-2023 - D3 by observable (https://observablehq.com/@d3/temporal-force-directed-graph)
  Used as a reference for the scrubber component
*/

function Scrubber(values, {
  format = value => value,
  initial = 0,
  direction = 1,
  delay = 1000,
  autoplay = false,
  loop = false,
  loopDelay = null,
  alternate = false
}) {
  values = Array.from(values);
  
  // TODO:  make this logic more independent... make form here and return it
  // improve the form layout 
  const form = document.getElementById("form-animation");
  const control = form.querySelector("#btn-control");
  const range = form.querySelector("#form-range");
  const output = form.querySelector("#form-output");

  let frame = null;
  let timer = null;
  let interval = null;
  
  function start() {
    control.textContent = "Pause";
    if (delay === null) frame = requestAnimationFrame(tick);
    else interval = setInterval(tick, delay);
  }

  function stop() {
    control.textContent = "Play";
    if (frame !== null) cancelAnimationFrame(frame), frame = null;
    if (timer !== null) clearTimeout(timer), timer = null;
    if (interval !== null) clearInterval(interval), interval = null;
  }

  function running() {
    return frame !== null || timer !== null || interval !== null;
  }

  function tick() {
    if (range.valueAsNumber === (direction > 0 ? values.length - 1 : direction < 0 ? 0 : NaN)) {
      if (!loop) return stop();
      if (alternate) direction = -direction;
      if (loopDelay !== null) {
        if (frame !== null) cancelAnimationFrame(frame), frame = null;
        if (interval !== null) clearInterval(interval), interval = null;
        timer = setTimeout(() => (step(), start()), loopDelay);
        return;
      }
    }

    if (delay === null) frame = requestAnimationFrame(tick);
    step();
  }

  // TODO: on running if no loop - when getting to the end stop animation
  // :: simplify the logic to our requirements
  function step() {
    range.valueAsNumber = (range.valueAsNumber + direction + values.length) % values.length;
    range.dispatchEvent(new CustomEvent("input"));
  }

  range.oninput = event => {
    if (event && event.isTrusted && running()) stop();
    form.value = values[range.valueAsNumber];
    output.value = format(form.value, range.valueAsNumber, values);
  };

  control.onclick = () => {
    if (running()) return stop();
    direction = alternate && range.valueAsNumber === values.length - 1 ? -1 : 1;
    range.valueAsNumber = (range.valueAsNumber + direction) % values.length;
    range.dispatchEvent(new CustomEvent("input"));
    start();
  };

  range.oninput();
  if (autoplay) start();
  else stop();
  // (TODO): mke first layout on time 0 if not autoplay

  // Inputs.disposal(form).then(stop); // (TODO): search more about invalidation and disposal
  return form;
}