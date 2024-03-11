class Filter {
  
  constructor(name, values, changeCallback = () => {}) {
    this.name = name;
    this.values = Array.from(values);
    this.changeCallback = changeCallback;

    this.initialize();
  }

  render() {
    return this.filter;
  }

  initialize() {
    this.filter = document.createElement("div");
    
    const title = document.createElement("p");
    title.textContent = `Filter ${this.name} by:`;
    this.filter.appendChild(title);

    for (const filter of this.values) {
      const container = document.createElement("div");

      const label = document.createElement("span");
      label.textContent = filter["field"];

      const select = document.createElement("select");
      select.id = filter["id"];
      select.name = filter["field"];
      select.addEventListener("change", this.onChange.bind(this));

      const allOpt = document.createElement("option");
      allOpt.value = "all";
      allOpt.textContent = "all";
      select.appendChild(allOpt);

      for (const option of filter["options"]) {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
      }

      container.append(label, select);
      this.filter.appendChild(container);
    }
  }

  onChange(_) {
    if ("function" === typeof this.changeCallback) {
      this.changeCallback((element) => {
        const selections = this.values.map((filter) => {
          const select = document.querySelector(`#${filter["id"]}`);
          return [select.name, select.value];
        });
        
        return selections.every(([field, value]) => {
          return value === "all" || element[field] === value;
        });
      });
    }
  }
}