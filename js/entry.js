export default class Entry {
  constructor(category, date, amount, notes, id) {
    this.category = category;
    this.date = date;
    this.amount = amount;
    this.notes = notes;
    this.id = id;
  }

  get html() {
    const entry = document.createElement("div");
    entry.classList.add("entry");
    entry.dataset.id = this.id;

    for (let property of Object.keys(this)) {
      if (property == 'id') break;
      const p = document.createElement("p");
      p.classList.add(property);
      p.innerHTML = this[property];
      entry.appendChild(p);
    }

    return entry;
  }
}
