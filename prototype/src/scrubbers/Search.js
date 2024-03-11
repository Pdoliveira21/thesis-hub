class Search {

  constructor(name, prefix, values, changeCallback = () => {}) {
    this.name = name;
    this.prefix = prefix;
    this.values = Array.from(values);
    this.changeCallback = changeCallback;

    this.search = null;
    this.initialize();
  }

  render() {
    return this.search;
  }

  initialize() {
    this.search = document.createElement("div");
    
    const title = document.createElement("span");
    title.textContent = `Find/Follow ${this.name}:`;

    const select = document.createElement("select");
    select.id = `search-${this.prefix}`;
    select.addEventListener("change", this.onChange.bind(this));

    // TODO: change by inpput box with autocomplete for now just selecting the first 10
    for (const value of this.values.slice(0, 10)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    }

    this.search.append(title, select);
  }

  onChange(_) {
    if ("function" === typeof this.changeCallback) {
      this.changeCallback(document.querySelector(`#search-${this.prefix}`).value);
    }
  }

  static extractSearchNames(data, from = "players") {
    let names = new Set();

    // TODO: go throug data till from object is found and and to the values set their name
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
