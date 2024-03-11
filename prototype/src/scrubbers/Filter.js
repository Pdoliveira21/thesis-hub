class Filter {

  constructor(name, prefix, values, changeCallback = () => {}) {
    this.name = name;
    this.prefix = prefix;
    this.values = values;
    this.changeCallback = changeCallback;

    this.filter = null;
    this.selectsIds = [];
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

    for (const field in this.values) {
      const fieldId = `filter-${this.prefix}-${field}`;
      const container = document.createElement("div");

      const label = document.createElement("span");
      label.textContent = field;

      const select = document.createElement("select");
      select.id = fieldId;
      select.name = field;
      select.addEventListener("change", this.onChange.bind(this));

      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = "all";
      select.appendChild(allOption);

      for (const value of this.values[field]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      }

      container.append(label, select);
      this.filter.appendChild(container);
      this.selectsIds.push(fieldId);
    }
  }

  onChange(_) {
    if ("function" === typeof this.changeCallback) {
      this.changeCallback((element) => {
        const selections = this.selectsIds.map((id) => {
          const select = document.querySelector(`#${id}`);
          return [select.name, select.value];
        });
        
        return selections.every(([field, value]) => {
          return value === "all" || element[field] === value;
        });
      });
    }
  }

  static extractFilters(data, outerGroup, clusterGroup, detailGroup, exclude = []) {
    let filters = {}

    function extract(data, parent) {
      if ("object" !== typeof data || data === null) return;

      if (Array.isArray(data)) {
        data.forEach((item) => extract(item, outerGroup));
        return;
      } 

      for (let key in data) {
        if (exclude.includes(key)) continue;
        
        if ("object" === typeof data[key]) {
          extract(data[key], (parent === clusterGroup || parent === detailGroup) && key !== detailGroup ? parent : key);
        } else {
          if (!filters[parent]) filters[parent] = {};
          if (!filters[parent][key]) filters[parent][key] = [];
          if (data[key] && data[key] !== "" && !filters[parent][key].includes(data[key])) {
            filters[parent][key].push(data[key]);
            filters[parent][key].sort();
          }
        }
      }
    }

    extract(data, null);
    return filters;
  }
}
