export class Analytics {

  /**
   * Sends an event to Google Analytics via Google Tag Manager.
   * @param {string} action - The action of the event.
   * @param {string} category - The category of the event.
   * @param {number} value - The value of the event.
   */
  static sendEvent(action, category, value, params = {}) {
    if ("function" !== typeof gtag) return;
    
    gtag("event", action, {
      "event_category": category,
      "event_value": value,
      ...params,
    });
  }

  // Send events related to the interaction with the controls.
  static sendSortEvent(variable, field) {
    this.sendEvent("change_sort", variable, field);
  }

  static sendFilterEvent(variable, field, value) {
    this.sendEvent("change_filter", `${variable}_${field}`, value);
  }

  static sendSearchEvent(variable, value) {
    this.sendEvent("change_search", variable, value);
  }
  // ---

  // Send events related to the interaction with the timeline.
  static sendTimelineEvent(category, value) {
    this.sendEvent("control_timeline", category, value);
  }
  // ---

  // Send events related to the interaction with the nodes.
  static sendNodeEvent(action, category, value, graph) {
    this.sendEvent(action, category, value, {
      "event_graph": graph,
      "event_timeslice": document.querySelector(`#timeline-output`).value,
    });
  }

  static sendNodeHoverEvent(category, id, name, graph) {
    this.sendNodeEvent("node_highlight", category, `(${id}) ${name}`, graph);
  }

  static sendNodeClickEvent(category, id, name, graph) {
    this.sendNodeEvent("node_in_detail", category, `(${id}) ${name}`, graph);
  }
  // ---
}
