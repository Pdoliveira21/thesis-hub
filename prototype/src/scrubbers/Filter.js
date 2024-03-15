/**
 * @class Filter
 * @description A class to create a filter component for a given dataset.
 * @param {string} name - The name of the dataset to be filtered.
 * @param {string} prefix - Prefix to be used in the id of the filter dropdowns.
 * @param {Object} values - Object with the fields and their respective values to be used as filtering options.
 * @param {function} changeCallback - Callback function to be called when the filter fields are changed.
 */
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
    title.textContent = `${dictionary.filter} ${this.name} ${dictionary.by}:`;
    title.classList.add("control-title");
    this.filter.appendChild(title);

    for (const field in this.values) {
      const fieldId = `filter-${this.prefix}-${field}`;
      const container = document.createElement("div");
      container.classList.add("control-line");

      const label = document.createElement("span");
      label.textContent = dictionary[field].label;
      label.classList.add("control-label");

      const select = document.createElement("select");
      select.id = fieldId;
      select.name = field;
      select.classList.add("control-dropdown");
      select.addEventListener("change", this.onChange.bind(this));

      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = dictionary.all;
      select.appendChild(allOption);

      for (const value of this.values[field]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = dictionary[field].options[value] || value;
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

  /**
   * Extract the fields and values from the dataset to be used as filtering options for every group level.
   * Designed according to the expected structure of the dataset provenient from the endpoint.
   * @param {Object} data - The dataset to be used.
   * @param {string} outerGroup - The name of the outer group in the dataset.
   * @param {string} clusterGroup - The name of the cluster group in the dataset.
   * @param {string} detailGroup - The name of the detail group in the dataset.
   * @param {Array} exclude - Specific fields to be excluded from the filtering options.
   * @returns {Object} Object with the fields and their respective values to be used as filtering options.
   */
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
