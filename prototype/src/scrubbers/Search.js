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

  initialize() {
    this.search = document.createElement("div");
    
    const title = document.createElement("span");
    title.textContent = `Find/Follow ${this.name}:`;

    const input = document.createElement("input");
    input.id = `search-${this.prefix}`;
    input.type = "search";
    input.setAttribute("list", `search-${this.prefix}-values`);
    input.addEventListener("input", this.onChange.bind(this));

    const datalist = document.createElement("datalist");
    datalist.id = `search-${this.prefix}-values`;

    for (const value of this.values) {
      const option = document.createElement("option");
      option.value = value;
      datalist.appendChild(option);
    }

    this.search.append(title, input, datalist);
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

  static extractSearchNames(data, from = "players") {
    let names = new Set();

    // TODO (review): go throug data till from object is found and and to the values set their name
    // iterate data recursevel and add to the set the names of the objects that correspond to the from object
    function extract(object) {
      if ("object" !== typeof object || object === null) return;

      if (Array.isArray(object)) {
        object.forEach(extract);
        return;
      }

      for (let key in object) {
        if (key === from) {
          Object.values(object[key]).forEach((item) => names.add(item.name));
        } else {
          extract(object[key]);
        }
      }
    }

    extract(data);
    return Array.from(names).sort();
  }
}
