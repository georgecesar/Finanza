// IMPORTS
import generateDate from "./date.js";

class App {
  constructor() {
    this.container = document.getElementById("container");
    this.incomeAmount = document.getElementById("budget-amount");
    this.expenseAmount = document.getElementById("expense-amount");
    this.balance = document.getElementById("balance");
    this.balanceAmount = document.getElementById("balance-amount");
    this.expenseForm = document.getElementById("expense-form");
    this.radioCategories = document.getElementsByName("radio-category");
    this.amountInput = document.getElementById("amount-input");
    this.notesInput = document.getElementById("notes-input");
    this.radioCurrentState = "";
    this.editMode = false;
    this.editID;
    this.display = document.getElementById("display");
    this.listBox = document.getElementById("list-box");
    this.database = firebase.database();
    this.monthDay = document.getElementById("month-day");
    this.transactions = document.getElementById("transactions");
    this.userEmail = document.getElementById("userEmail");
    this.userPassword = document.getElementById("userPassword");
    this.loginBox = document.getElementById("login-box");
    this.userUid;
    this.sortBy = "byID";
  };

  // format money to accounting style
  formatMoney(value) {
    let formattedValue = accounting.formatMoney(value, {
      format: {
        pos: "%v",
        neg: "(%v)",
        zero: "–"
      }
    });
    return formattedValue;
  };

  // AESTHETICS
  // change text color to green
  changeTextColor() {
    if (this.amountInput.value < 0) {
      this.amountInput.classList.add("green-text");
    } else {
      this.amountInput.classList.remove("green-text");
    }
  };

  transactionsFadeIn() {
    this.transactions.classList.remove('no-show')
    // glitch: removing no-show without delay doesn't trigger the animation
    setTimeout(() => {
      this.transactions.classList.remove('min-opacity')
      this.transactions.classList.add('max-opacity')
    }, 10)
  };

  transactionsFadeOut() {
    this.transactions.classList.add('min-opacity')
    this.transactions.classList.remove('max-opacity')
    setTimeout(() => {
      this.transactions.classList.add('no-show')
    }, 250);
  };

  loginFadeIn() {
    this.loginBox.classList.remove('no-show')
    this.loginBox.classList.remove('min-opacity')
    this.loginBox.classList.add('max-opacity')
  };

  loginFadeOut() {
    this.loginBox.classList.add('min-opacity')
    this.loginBox.classList.remove('max-opacity')
    self = this;
    setTimeout(() => {
      this.loginBox.classList = "no-show min-opacity"
    }, 250);
  };

  // AUTHENTICATION
  // check authentication state
  authState() {
    let self = this;
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        self.userUid = user.uid;
        self.readFromDatabase();
        console.log(user.email + ' is logged in.');
        // aestethic: toggle view on login-box
        self.loginFadeOut();
      } else {
        console.log("No user is signed in.");
        self.userUid = "";
        // aestethic: toggle view on login-box
        self.loginFadeIn();
      }
    });
  };
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
  };
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
  };

  // DATABASE
  // read from real-time database
  readFromDatabase() {
    this.database
      .ref("users/" + this.userUid + "/expenses")
      .once("value", takeSnapshot);
    let self = this;

    function takeSnapshot(snapshot) {
      var entries = snapshot.val();
      if (entries) {
        var keys = Object.keys(entries);
        var totalIncome = 0;
        var totalExpense = 0;
        var totalBalance = 0;

        var formattedArray = [];
        var sortedArray = [];
        var formattedObject = {};

        // operations through the database
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          var amount = entries[k].amount;
          if (amount > 0) {
            totalExpense += amount;
          } else {
            totalIncome -= amount;
          }
          // format entries (including the parent key)
          let formattedEntry = {
            key: keys[i],
            title: entries[k].title,
            date: entries[k].date,
            amount: entries[k].amount,
            notes: entries[k].notes,
          }
          formattedArray.push(formattedEntry);
        }
        // sort the formatted array
        if (self.sortBy) {
          sortedArray = formattedArray.sort(function (a, b) {
            if (self.sortBy == "byID") {
              if (a.key < b.key) {
                return -1;
              }
              if (a.key > b.key) {
                return 1;
              }
              return 0;
            } else if (self.sortBy == "Category") {
              if (a.title < b.title) {
                return -1;
              }
              if (a.title > b.title) {
                return 1;
              }
              return 0;
            } else if (self.sortBy == "Date") {
              if (a.date < b.date) {
                return -1;
              }
              if (a.date > b.date) {
                return 1;
              }
              return 0;
            } else if (self.sortBy == "Amount") {
              if (a.amount < b.amount) {
                return -1;
              }
              if (a.amount > b.amount) {
                return 1;
              }
              return 0;
            }
          })
        } else {
          console.log("no sortBy state.");
        }
        // transform array to object - REVIEW REDUCE_METHOD
        formattedObject = sortedArray.reduce((acc, val) => {
          acc[val.key] = val;
          return acc;
        }, {});
        // display entries
        self.displayExpenses(formattedObject);
        // display balance
        totalBalance = totalIncome - totalExpense;
        // display summary
        self.incomeAmount.innerHTML = self.formatMoney(totalIncome);
        self.expenseAmount.innerHTML = self.formatMoney(totalExpense);
        self.balanceAmount.innerHTML = self.formatMoney(totalBalance);
        // aesthetic: show transactions list
        self.transactionsFadeIn();
      } else {
        self.incomeAmount.innerHTML = self.formatMoney(0);
        self.expenseAmount.innerHTML = self.formatMoney(0);
        self.balanceAmount.innerHTML = self.formatMoney(0);
        // aesthetic: hide transactions list
        self.transactionsFadeOut();
      }
    }
  };
  // push to database
  pushToDatabase(expense) {
    this.database.ref("users/" + this.userUid + "/expenses").push(expense);
  };

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
  submitExpenseForm() {
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
          };
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
          };
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
          };
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
          };
          this.database
            .ref("users/" + this.userUid + "/expenses/" + this.editID)
            .update(income);
        } else if (amountInput > 0 && radioCurrentState == null) {
          let amount = parseFloat(amountInput);
          let notes = notesInput;
          this.amountInput.value = "";
          let expense = {
            title: "❓",
            amount: amount,
            notes: notes
          };
          this.database
            .ref("users/" + this.userUid + "/expenses/" + this.editID)
            .update(expense);
        } else if (amountInput > 0 && radioCurrentState == "➕") {
          let amount = parseFloat(amountInput);
          let notes = notesInput;
          this.amountInput.value = "";
          let expense = {
            title: "❓",
            amount: amount,
            notes: notes
          };
          this.database
            .ref("users/" + this.userUid + "/expenses/" + this.editID)
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
          };
          this.database
            .ref("users/" + this.userUid + "/expenses/" + this.editID)
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
  }

  // display database in DOM through Firebase snapshot
  displayExpenses(snapshot) {
    this.listBox.innerHTML = "";
    this.monthDay.innerHTML = "";
    if (snapshot !== null) {
      // display today's date
      let monthDay = document.getElementById("month-day");
      const div = document.createElement("div");
      const monthName = generateDate("monthName");
      const day = generateDate("day");
      
      
      div.innerHTML = `
        <div class="info-month">${monthName} ${day}</div>
        `;
      monthDay.appendChild(div);
      // for through database entries
      for (let key of Object.keys(snapshot)) {
        var category = snapshot[key].title;
        var amount = snapshot[key].amount;
        var amountFormatted = this.formatMoney(amount);
        var date = snapshot[key].date;        
        var notes = snapshot[key].notes;
        var displayDate = generateDate('month-day', date);
        // append entry[n] to DOM
        let expenseList = document.getElementById("list-box");
        const div = document.createElement("div");
        div.classList.add("expense");
        div.innerHTML = `
        <div class="expense-title">${category}</div>
        <div class="expense-date">${displayDate}</div>
        <div class="expense-amount">${amountFormatted}</div>
        <div class="expense-notes">${notes}</div>
        <div class="expense-icons">
          <a href="#" class="edit-icon" data-id="${key}">
            <div class="edit-icon">🖍</div>
          </a>
          <a href="#" class="delete-icon" data-id="${key}">
            <div class="delete-icon">❌</div>
          </a>
        </div>
        `;
        expenseList.appendChild(div);
      }
    }
  };

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
  };

  // delete expense
  deleteExpense(element) {
    let id = element.dataset.id;
    this.database.ref("users/" + this.userUid + "/expenses/" + id).remove();
  };
};

// event listeners
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
  const app = new App();
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
      app.readFromDatabase();
    }
  };
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
    app.readFromDatabase();
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
    app.readFromDatabase();
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
      app.submitExpenseForm();
      app.readFromDatabase();
    };
  };
};

// START
// when DOMContentLoaded function eventListeners loads
document.addEventListener("DOMContentLoaded", function () {
  initialize();
  document.getElementById("container").classList.add("initial-animation");
});
