/**
 * @class Timeline
 * @description A class to create a timeline scrubber component. 
 * @param {Array} values - An array of values to be used as the timeline.
 * @param {number} delay - Delay between each step in the timeline.
 * @param {function} updateCallback - Callback function to be called when the timeline value is updated.
 * 
 * @copyright 2020-2023
 * @author D3 by observable
 * @see https://observablehq.com/@d3/temporal-force-directed-graph - used as reference example that was adapted and simplified for the project purposes.
 */
class Timeline {

  constructor(values, delay, updateCallback = () => {}) { 
    this.values = Array.from(values);
    this.delay = delay;
    this.updateCallback = updateCallback;

    this.interval = null;
    this.initialize();
    this.step(0);
  }

  render() {
    return this.timeline;
  }

  getValue() {
    return this.timeline.value;
  }

  initialize() {
    this.timeline = document.createElement("form");
    this.timeline.id = "form-timeline";

    this.btnPlay = document.createElement("button");
    this.btnPlay.id = "timeline-control";
    this.btnPlay.type = "button";
    this.btnPlay.textContent = dictionary.play;
    this.btnPlay.classList.add("btn-timeline");
    this.btnPlay.addEventListener("click", this.onPlay.bind(this));

    this.btnPrev = document.createElement("button");
    this.btnPrev.id = "timeline-prev";
    this.btnPrev.type = "button";
    this.btnPrev.textContent = dictionary.prev;
    this.btnPrev.classList.add("btn-timeline");
    this.btnPrev.addEventListener("click", this.onPrev.bind(this));

    this.btnNext = document.createElement("button");
    this.btnNext.id = "timeline-next";
    this.btnNext.type = "button";
    this.btnNext.textContent = dictionary.next;
    this.btnNext.classList.add("btn-timeline");
    this.btnNext.addEventListener("click", this.onNext.bind(this));

    this.range = document.createElement("input");
    this.range.id = "timeline-range";
    this.range.type = "range";
    this.range.min = 0;
    this.range.max = this.values.length - 1;
    this.range.step = 1;
    this.range.value = 0;
    this.range.classList.add("input-timeline");
    this.range.addEventListener("input", this.onUpdate.bind(this));

    this.output = document.createElement("output");
    this.output.id = "timeline-output";
    this.output.value = `${dictionary.current}: ---`;
    this.output.classList.add("output-timeline");

    this.player = document.createElement("div");
    this.player.append(this.btnPlay, this.btnPrev, this.range, this.btnNext);
    this.timeline.append(this.output, this.player);
  }

  start() {
    this.btnPlay.textContent = dictionary.pause;
    this.interval = setInterval(this.tick.bind(this), this.delay !== null ? this.delay : 1000);
  }

  stop() {
    this.btnPlay.textContent = dictionary.play;
    
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  running() {
    return this.interval !== null;
  }

  tick() {
    if (this.range.valueAsNumber >= this.range.max) return this.stop();
    this.step();
  }

  step(direction = 1) {
    if (direction > 0) {
      this.range.valueAsNumber = Math.min(this.range.valueAsNumber + direction, this.range.max);
    } else if (direction < 0) {
      this.range.valueAsNumber = Math.max(this.range.valueAsNumber + direction, this.range.min);
    }

    this.range.dispatchEvent(new Event("input"));
  }

  onPlay() {
    if (this.running()) return this.stop();
    this.start();
  }

  onPrev() {
    if (this.running()) this.stop();
    this.step(-1);
  }

  onNext() {
    if (this.running()) this.stop();
    this.step(1);
  }

  onUpdate(event) {
    if (event && event.isTrusted && this.running()) this.stop();
    this.timeline.value = this.values[this.range.valueAsNumber];
    this.output.value = `${dictionary.current}: ${this.timeline.value}`;
    if ("function" === typeof this.updateCallback) {
      this.updateCallback(this.timeline.value);
    }
  }
}
