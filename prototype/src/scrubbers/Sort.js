/**
 * @class Sort
 * @description A class to create a sort dropdown for a given dataset.
 * @param {string} name - The name of the dataset to be sorted.
 * @param {string} prefix - Prefix to be used in the id of the sort dropdown.
 * @param {Array} fields - Array of fields to be used as sorting options.
 * @param {string} selected - The default selected field.
 * @param {function} changeCallback - Callback function to be called when the sort field is changed.
 */
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
    
    const title = document.createElement("p");
    title.textContent = `${dictionary.sort} ${this.name} ${dictionary.by}:`;
    title.classList.add("control-title");

    const select = document.createElement("select");
    select.id = `sort-${this.prefix}`;
    select.classList.add("control-dropdown");
    select.addEventListener("change", this.onChange.bind(this));

    for (const field of this.fields) {
      const option = document.createElement("option");
      option.value = field;
      option.textContent = dictionary.dataset_fields[field] 
        ? (dictionary.dataset_fields[field]?.label || dictionary.dataset_fields[field]) : field;
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

  /**
   * Extract the fields from the dataset to be used as sorting options.
   * Considers only the outer level of the dataset.
   * Designed according to the expected structure of the dataset provenient from the endpoint.
   * @param {Object} data - The dataset to be used.
   * @param {Array} exclude - Specific fields to be excluded from the sorting options.
   * @returns {Array} Array of fields to be used as sorting options.
   */
  static extractSortFields(data, exclude = []) {
    let fields = new Set();

    for (let time in data) {
      data[time].forEach((item) => {
        for (let key in item) {
          if (exclude.includes(key) || "object" === typeof item[key]) continue;
          fields.add(key);
        };
      });
    }

    return Array.from(fields).sort();
  }
}
