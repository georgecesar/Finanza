import Entry from './entry.js';

firebase.initializeApp({
  apiKey: "AIzaSyAI3ttWz-31uUi99QDp0HtUHJldgzt4_wk",
  authDomain: "finances-app-v1.firebaseapp.com",
  databaseURL: "https://finances-app-v1.firebaseio.com",
  projectId: "finances-app-v1",
  storageBucket: "finances-app-v1.appspot.com",
  messagingSenderId: "580579540966",
  appId: "1:580579540966:web:c759e69f6bf54abae2a027"
});

export default class Firebase {
  constructor(reference) {
    this.database = [];
    this.reference = reference;
  }

  createId() {
    return this.reference.push().key;
  }

  create(Entry) {
    return this.reference.push(Entry);
  }

  read() {
    const database = this.database = []

    function store(snapshot) {
      for (let key of Object.keys(snapshot)) {
        let entry = new Entry(snapshot[key].category, snapshot[key].date, snapshot[key].amount, snapshot[key].notes, key)
        database.push(entry);
      }
    }

    return this.reference.on("value", snapshot => store(snapshot.val()));
  }

  update(Entry) {
    let id = Entry.id;
    delete Entry.id;
    let update = {}
    update[id] = Entry;

    return this.reference.update(update);
  }

  delete(Entry) {
    return this.reference.child(Entry.id).remove();
  }
}
