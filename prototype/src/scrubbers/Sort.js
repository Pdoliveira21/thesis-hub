class Sort {

  constructor(name, prefix, fields, selected, changeCallback = () => {}) {
    this.name = name;
    this.prefix = prefix;
    this.fields = fields;
    this.selected = selected;
    this.changeCallback = changeCallback;

    this.sort = null;
    this.initialize();
  }

  render() {
    return this.sort;
  }

  initialize() {
    this.sort = document.createElement("div");
    
    const title = document.createElement("span");
    title.textContent = `Sort ${this.name} by:`;

    const select = document.createElement("select");
    select.id = `sort-${this.prefix}`;
    select.addEventListener("change", this.onChange.bind(this));

    for (const field of this.fields) {
      const option = document.createElement("option");
      option.value = field;
      option.textContent = field;
      if (field === this.selected) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    this.sort.append(title, select);
  }

  onChange(_) {
    if ("function" === typeof this.changeCallback) {
      this.changeCallback(document.querySelector(`#sort-${this.prefix}`).value);
    }
  }
}