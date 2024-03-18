/**
 * @class Search
 * @description A class to create a search input for a list of values.
 * @param {string} name - The name of the dataset to be searched.
 * @param {string} prefix - Prefix to be used in the id of the search input.
 * @param {Array} values - Array of values to be used as search options.
 * @param {function} changeCallback - Callback function to be called when the search value is changed.
 */
class Search {

  constructor(name, prefix, values, changeCallback = () => {}) {
    this.name = name;
    this.prefix = prefix;
    this.values = Array.from(values);
    this.changeCallback = changeCallback;

    this.search = null;
    this.previousSearchValue = null;
    this.initialize();
  }

  render() {
    return this.search;
  }

  result() {
    return `search-${this.prefix}-result`;
  }

  initialize() {
    this.search = document.createElement("div");
    
    const title = document.createElement("p");
    title.textContent = `${dictionary.find} ${this.name}:`;
    title.classList.add("control-title");

    const input = document.createElement("input");
    input.id = `search-${this.prefix}`;
    input.type = "search";
    input.classList.add("control-input");
    input.setAttribute("list", `search-${this.prefix}-values`);
    input.addEventListener("input", this.onChange.bind(this));

    const datalist = document.createElement("datalist");
    datalist.id = `search-${this.prefix}-values`;

    for (const value of this.values) {
      const option = document.createElement("option");
      option.value = value;
      datalist.appendChild(option);
    }

    const result = document.createElement("span");
    result.id = `search-${this.prefix}-result`;
    result.classList.add("control-label");

    this.search.append(title, input, datalist, result);
  }

  onChange(_) {
    if ("function" === typeof this.changeCallback) {
      const inputValue = document.querySelector(`#search-${this.prefix}`).value;
      const searchValue = inputValue !== "" && this.values.includes(inputValue) ? inputValue : null;
      
      if (searchValue !== this.previousSearchValue) {
        this.changeCallback(searchValue);
        this.previousSearchValue = searchValue;
      }
    }
  }

  /**
   * Extract the names from the dataset to be used as search options of a specific property.
   * Designed according to the expected structure of the dataset provenient from the endpoint.
   * @param {Object} data - The dataset to be used.
   * @param {string} from - The property to be used as the source of the names.
   * @returns {Array} Array of names to be used as search options.
   */
  static extractSearchNames(data, from = "players") {
    let names = new Set();

    function extract(object) {
      if ("object" !== typeof object || object === null) return;

      if (Array.isArray(object)) {
        object.forEach(extract);
        return;
      }

      for (let key in object) {
        if (key === from) {
          Object.values(object[key]).forEach((item) => {
            if (item.name && item.name !== "") {
              names.add(item.name);
            }
          });
          return;
        } else {
          extract(object[key]);
        }
      }
    }

    extract(data);
    return Array.from(names).sort();
  }
}
