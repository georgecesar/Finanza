'use strict';

import generateDate from "./date.js";

class State {
  constructor(message, previous, storage) {
    this.message = message || 'Initialized';
    this.previous = previous;
    this.storage = storage || [];
    this.time = new Date();
  }

  change(message) {
    return new State(message, this, this.storage);
  }

  revert() {
    return this.previous ? this.previous : new Error('No past available.');
  }
}

class Record {
  constructor(id, title, amount, date, notes) {
    this.title = title;
    this.id = id;
    this.amount = amount;
    this.date = date;
    this.notes = notes;
  }
}

class App {
  constructor() {
    this.state = new State;
    this.history = [];
    this.radioCurrentState = "";
    this.editMode = false;
    this.editID;
    this.userUID;
    this.sortBy = "byID";
    this.database = firebase.database();
    this.container = document.getElementById("container");
    this.incomeAmount = document.getElementById("budget-amount");
    this.expenseAmount = document.getElementById("expense-amount");
    this.balance = document.getElementById("balance");
    this.balanceAmount = document.getElementById("balance-amount");
    this.expenseForm = document.getElementById("expense-form");
    this.radioCategories = document.getElementsByName("radio-category");
    this.amountInput = document.getElementById("amount-input");
    this.notesInput = document.getElementById("notes-input");
    this.display = document.getElementById("display");
    this.data = document.getElementById("list-box");
    this.headerDate = document.getElementById("month-day");
    this.transactions = document.getElementById("transactions");
    this.userEmail = document.getElementById("userEmail");
    this.userPassword = document.getElementById("userPassword");
    this.loginBox = document.getElementById("login-box");
    this.expenseList = document.getElementById("list-box");
  }

  formatMoney(value) {
    return accounting.formatMoney(value, {
      format: {
        pos: "%v",
        neg: "(%v)",
        zero: "–"
      }
    });
  }

  // AESTHETICS
  // change text color to green
  changeTextColor() {
    if (this.amountInput.value < 0) {
      this.amountInput.classList.add("green-text");
    } else {
      this.amountInput.classList.remove("green-text");
    }
  }

  transactionsFadeIn() {
    this.transactions.classList.remove('no-show')
    // glitch: removing no-show without delay doesn't trigger the animation
    setTimeout(() => {
      this.transactions.classList.remove('min-opacity')
      this.transactions.classList.add('max-opacity')
    }, 10)
  }

  transactionsFadeOut() {
    this.transactions.classList.add('min-opacity')
    this.transactions.classList.remove('max-opacity')
    setTimeout(() => {
      this.transactions.classList.add('no-show')
    }, 250);
  }

  loginFadeIn() {
    this.loginBox.classList.remove('no-show')
    this.loginBox.classList.remove('min-opacity')
    this.loginBox.classList.add('max-opacity')
  }

  loginFadeOut() {
    this.loginBox.classList.add('min-opacity')
    this.loginBox.classList.remove('max-opacity')
    self = this;
    setTimeout(() => {
      this.loginBox.classList = "no-show min-opacity"
    }, 250);
  }

  // AUTH
  // check authentication state
  authState() {
    let self = this;
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        self.userUID = user.uid;
        self.readFirebase();
        console.log(user.email + ' is logged in.');
        // aestethic: toggle view on login-box
        self.loginFadeOut();
      } else {
        console.log("No user is signed in.");
        self.userUID = "";
        // aestethic: toggle view on login-box
        self.loginFadeIn();
      }
    });
  }
  // sign up, and if already registered, log in
  signUpFirebase() {
    let email = this.userEmail.value;
    let password = this.userPassword.value;
    this.userEmail.value = "";
    this.userPassword.value = "";
    // create user
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(function () {
        console.log('Sign-up succesful.');
      })
      .catch(() => {
        // log in existing user
        firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .catch(function (error) {
            console.log(error);
          });
      });
  }
  // sign out
  signOutFirebase() {
    this.userEmail.value = "";
    this.userPassword.value = "";
    firebase
      .auth()
      .signOut()
      .then(function () {
        console.log('Sign-out successful.');
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  readFirebase() {
    let self = this;
    this.database
      .ref("users/" + this.userUID + "/expenses")
      .once("value", storeSnapshot);

    function storeSnapshot(snapshot) {
      self.state.storage = [];
      const entries = snapshot.val();
      for (let key of Object.keys(entries)) {
        self.state.storage.push(new Record(key, entries[key].title, entries[key].amount, entries[key].date, entries[key].notes));
      }

      let amounts = self.state.storage.map(a => a.amount);
      let expenses = amounts.filter(a => a > 0).reduce((a, b) => a + b);
      let income = amounts.filter(a => a < 0).reduce((a, b) => a + b);
      let balance = amounts.reduce((a, b) => a + b);
      self.incomeAmount.innerHTML = self.formatMoney(-income);
      self.expenseAmount.innerHTML = self.formatMoney(expenses);
      self.balanceAmount.innerHTML = self.formatMoney(-balance);
      // colorize balance
      if (-balance > 0) {
        document.querySelector('.balance').classList.remove('red');
        document.querySelector('.balance').classList.add('green');
      } else {
        document.querySelector('.balance').classList.remove('green');
        document.querySelector('.balance').classList.add('red');
      }
      self.displayExpenses(self.state.storage);
      self.state = self.state.change('Read database.')
      console.log(self.state);
    }
  }

  // push to database
  pushToDatabase(expense) {
    this.database.ref("users/" + this.userUID + "/expenses").push(expense);
  }

  // SYSTEM UTILITIES
  // control radio buttons
  updateRadios(value) {
    // check to input value
    if (value && value !== "reset") {
      this.radioCurrentState = value;
      for (let i = 0; i < this.radioCategories.length; i++) {
        if (this.radioCategories[i].value == value) {
          this.radioCategories[i].checked = true;
          // aesthetic: brighten radio buttons
          this.radioCategories[i].parentElement.classList.add("light-label");
        } else {
          this.radioCategories[i].checked = false;
          // aesthetic: darken radio buttons
          this.radioCategories[i].parentElement.classList.remove("light-label");
        }
      }
    }
    // reset module
    else if (value == "reset") {
      for (let i = 0; i < this.radioCategories.length; i++) {
        this.radioCategories[i].checked = false;
        this.radioCurrentState = "❓";
        // aesthetic: darken radio buttons
        this.radioCategories[i].parentElement.classList.remove("light-label");
      }
    }
    // value absent, set current state from checked
    else {
      for (let i = 0; i < this.radioCategories.length; i++) {
        if (this.radioCategories[i].checked) {
          this.radioCurrentState = this.radioCategories[i];
          // aesthetic: brighten radio buttons
          this.radioCategories[i].parentElement.classList.add("light-label");
        } else {
          this.radioCurrentState = "❓";
          // aesthetic: darken radio buttons
          this.radioCategories[i].parentElement.classList.remove("light-label");
        }
      }
    }
  }

  // FUNCTIONALITIES
  // submit expense
  submit() {
    const radioCurrentState = this.radioCurrentState;
    const amountInput = this.amountInput.value;
    const notesInput = this.notesInput.value;
    const editMode = this.editMode;

    // normal mode
    if (editMode == false) {
      if (amountInput) {
        if (amountInput < 0) {
          let amount = parseFloat(amountInput);
          let notes = notesInput;
          this.amountInput.value = "";
          let income = {
            title: "➕",
            date: generateDate(),
            amount: amount,
            notes: notes
          }
          this.pushToDatabase(income);
        } else if (amountInput > 0 && radioCurrentState == null) {
          let amount = parseFloat(amountInput);
          let notes = notesInput;
          this.amountInput.value = "";
          let expense = {
            title: "❓",
            date: generateDate(),
            amount: amount,
            notes: notes
          }
          this.pushToDatabase(expense);
        } else {
          let amount = parseFloat(amountInput);
          let notes = notesInput;
          this.amountInput.value = "";
          this.notesInput.value = "";
          let expense = {
            title: radioCurrentState,
            date: generateDate(),
            amount: amount,
            notes: notes
          }
          this.pushToDatabase(expense);
        }
      } else {
        this.notesInput.value = "";
        console.log('No input.')
      }
    }
    // edit mode
    else if (editMode == true) {
      if (amountInput) {
        if (amountInput < 0) {
          let amount = parseFloat(amountInput);
          let notes = notesInput;
          this.amountInput.value = "";
          let income = {
            title: "➕",
            amount: amount,
            notes: notes
          }
          this.database
            .ref("users/" + this.userUID + "/expenses/" + this.editID)
            .update(income);
        } else if (amountInput > 0 && radioCurrentState == null) {
          let amount = parseFloat(amountInput);
          let notes = notesInput;
          this.amountInput.value = "";
          let expense = {
            title: "❓",
            amount: amount,
            notes: notes
          }
          this.database
            .ref("users/" + this.userUID + "/expenses/" + this.editID)
            .update(expense);
        } else if (amountInput > 0 && radioCurrentState == "➕") {
          let amount = parseFloat(amountInput);
          let notes = notesInput;
          this.amountInput.value = "";
          let expense = {
            title: "❓",
            amount: amount,
            notes: notes
          }
          this.database
            .ref("users/" + this.userUID + "/expenses/" + this.editID)
            .update(expense);
        } else {
          let amount = parseFloat(amountInput);
          let notes = notesInput;
          this.amountInput.value = "";
          this.notesInput.value = "";
          let expense = {
            title: radioCurrentState,
            amount: amount,
            notes: notes
          }
          this.database
            .ref("users/" + this.userUID + "/expenses/" + this.editID)
            .update(expense);
        }
      } else {
        this.notesInput.value = "";
        this.editMode = false;
      }
    }
    this.editMode = false;
    this.updateRadios("reset");
    this.notesInput.placeholder = "Notes";
    // remove selected on submission
    let selected = document.querySelector(".selected");
    // aesthetic: change colors in edit mode
    if (selected) {
      selected.classList.remove("selected");
      selected.classList.remove("dimmed");
    }
    this.display.classList.add("display-black");
    this.display.classList.remove("display-blue");

    this.state = this.state.change('Submitted.');
    console.log(this.state);
  }

  displayExpenses(database) {
    if (database.length == 0) throw "Database is empty.";
    this.data.innerHTML = "";
    this.headerDate.innerHTML = `${generateDate("monthName")}, ${generateDate("day")}`;

    for (let entry of database) {
      let entryDiv = document.createElement("div");
      entryDiv.classList.add("expense");
      entryDiv.innerHTML = `
        <div class="expense-title">${entry.title}</div>
        <div class="expense-date">${generateDate('month-day', entry.date)}</div>
        <div class="expense-amount">${this.formatMoney(entry.amount)}</div>
        <div class="expense-notes">${entry.notes}</div>
        <div class="expense-icons">
          <a href="#" class="edit-icon" data-id="${entry.id}">
            <div class="edit-icon">🖍</div>
          </a>
          <a href="#" class="delete-icon" data-id="${entry.id}">
            <div class="delete-icon">❌</div>
          </a>
        </div>
        `;
      this.expenseList.appendChild(entryDiv);
      this.transactionsFadeIn();
    }
    // HOLD ON
  }

  // edit expense
  editExpense(element) {
    this.editMode = true;
    let id = element.dataset.id;
    this.editID = id;
    let parent = element.parentElement.parentElement;
    let title = parent.querySelector(".expense-title").innerHTML;
    let amount = parent.querySelector(".expense-amount").innerHTML;
    let notes = parent.querySelector(".expense-notes").innerHTML;
    // update radios to entry being edited
    this.updateRadios(title);
    this.amountInput.value = amount;
    this.notesInput.value = notes;
    // aesthetic: dim the entry being edited, and make the screen blue for edit mode
    parent.classList.add("dimmed");
    parent.classList.add("selected");
    this.display.classList.add("display-blue");
    this.display.classList.remove("display-black");
    if (notes == "") {
      this.notesInput.placeholder = "";
    }
  }

  // delete expense
  deleteExpense(element) {
    let id = element.dataset.id;
    this.database.ref("users/" + this.userUID + "/expenses/" + id).remove();
  }
}

function initialize() {
  const radioCategories = document.getElementsByName("radio-category");
  const amountInput = document.getElementById("amount-input");
  const expenseInput = document.getElementById("expense-input");
  const expenseForm = document.getElementById("expense-form");
  const listBox = document.getElementById("list-box");
  const loginForm = document.getElementById("login-form");
  const logOutButton = document.getElementById("log-out-button");
  const infoRow = document.getElementById('info-row');

  // new instance of UI CLASS
  var app = new App();
  console.log(app.state);
  // utility to see who's in
  app.authState();
  // reset radio at startup
  app.updateRadios("reset");

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
  });
  // login submit on "enter"
  loginForm.onkeydown = function (e) {
    if (e.keyCode == 13) {
      app.signUpFirebase();
      app.readFirebase();
    }
  }
  logOutButton.addEventListener("click", () => {
    app.signOutFirebase();
    window.location.reload();
  });
  // expense click
  listBox.addEventListener("click", function (event) {
    if (event.target.classList.contains("edit-icon")) {
      if (app.editMode == false) {
        app.editExpense(event.target.parentElement);
        document.getElementById("amount-input").focus();
      }
    } else if (event.target.classList.contains("delete-icon") &&
      app.editMode == false) {
      app.deleteExpense(event.target.parentElement);
    }
    app.readFirebase();
  });
  // category change
  for (let i = 0; i < radioCategories.length; i++) {
    radioCategories[i].addEventListener("change", function () {
      app.updateRadios(radioCategories[i].value);
    });
  }
  // sorting change
  infoRow.addEventListener('click', (e) => {
    app.sortBy = e.target.innerHTML;
    app.readFirebase();
  })
  // display color change
  amountInput.addEventListener("input", function () {
    app.changeTextColor();
  });
  // auto focus back to display
  expenseInput.addEventListener("click", function () {
    document.getElementById("amount-input").focus();
  });
  expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();
  });
  // form submit on "enter"
  expenseForm.onkeydown = function (e) {
    if (e.keyCode == 13) {
      app.submit();
      app.readFirebase();
    }
  }
}

// START
// when DOMContentLoaded function eventListeners loads
document.addEventListener("DOMContentLoaded", function () {
  initialize();
  document.getElementById("container").classList.add("initial-animation");
});
