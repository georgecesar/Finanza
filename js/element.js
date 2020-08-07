export default class Element {
  constructor(tag, id, classes = [], content = [], dataAttr = [{}]) {
    this.tag = tag;
    this.id = id;
    this.classes = classes;
    this.content = content;
    this.dataAttr = dataAttr;
  }

  get html() {
    const element = document.createElement(this.tag);
    for (let class_ of this.classes) {
      element.classList.add(class_);
    }
    for (let content of this.content) {
      element.innerHTML += content;
    }
    for (let attr of this.dataAttr) {
      element.dataset[attr.name] = attr.value;
    }

    return element;
  }
}
