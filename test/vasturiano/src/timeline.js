// ----- Scrubber -----

/*
  COPYRIGHT 2020-2023 - D3 by observable (https://observablehq.com/@d3/temporal-force-directed-graph)
  Used as a reference for the scrubber component
*/

// TODO: add .css to style the form and disable and enable according to min and max values
function _form(autoplay = false, min = 0, max = 10, step = 1) {
  const form = document.createElement("form");
  form.id = "form-timeline";

  const btnPlay = document.createElement("button");
  btnPlay.id = "timeline-control";
  btnPlay.type = "button";
  btnPlay.textContent = autoplay ? "Pause" : "Play";
  btnPlay.classList.add("btn-timeline");

  const btnPrev = document.createElement("button");
  btnPrev.id = "timeline-prev";
  btnPrev.type = "button";
  btnPrev.textContent = "Prev";
  btnPrev.classList.add("btn-timeline");

  const btnNext = document.createElement("button");
  btnNext.id = "timeline-next";
  btnNext.type = "button";
  btnNext.textContent = "Next";
  btnNext.classList.add("btn-timeline");
  
  const range = document.createElement("input");
  range.id = "timeline-range";
  range.type = "range";
  range.min = min;
  range.max = max;
  range.step = step;
  range.value = min;
  range.classList.add("input-timeline");

  const output = document.createElement("output");
  output.id = "timeline-output";
  output.classList.add("output-timeline");

  const player = document.createElement("div");
  player.append(btnPlay, btnPrev, range, btnNext);
  form.append(player, output);

  return form;
}

function Scrubber(values, step, {
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
  const form = _form(autoplay, 0, values.length - 1, step);
  const control = form.querySelector("#timeline-control");
  const range = form.querySelector("#timeline-range");
  const output = form.querySelector("#timeline-output");

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