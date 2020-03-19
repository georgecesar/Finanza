class UI {
  constructor() {
    // assigning DOM elements to JS properties
    this.budgetFeedback = document.querySelector(".budget-feedback");
    this.expenseFeedback = document.querySelector(".expense-feedback");
    this.budgetForm = document.getElementById("budget-form");
    this.budgetInput = document.getElementById("budget-input");
    this.incomeAmount = document.getElementById("budget-amount");
    this.expenseAmount = document.getElementById("expense-amount");
    this.balance = document.getElementById("balance");
    this.balanceAmount = document.getElementById("balance-amount");
    this.expenseForm = document.getElementById("expense-form");
    this.radioCategories = document.getElementsByName("radio-category");
    this.amountInput = document.getElementById("amount-input");
    this.notesInput = document.getElementById("notes-input");
    this.expenseList = document.getElementById("expense-list");
    this.itemList = [];
    this.itemID = 0;
    this.radioCurrentState = "";
    this.rootDatabase = firebase.database();
    this.editMode = false;
    this.editID;
    this.display = document.getElementById('display');
    this.listBox = document.getElementById('list-box')
  }

  // dates
  generateDate(format) {
    let fullDateNow = new Date();
    let yearNow = fullDateNow.getFullYear();
    let monthNow = fullDateNow.getMonth();
    let dateNow = fullDateNow.getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"]


    if (format == "month-day") {
      return `${monthNow}/${dateNow}`
    } else if (format == null) {
      return fullDateNow;
    }
    else if (format == "monthName") {
      return monthNames[monthNow];
    }
    else if (format == "date") {
      return dateNow;
    }
  }

  dateConverter(date) {
    let inputDate = new Date(date);

    let yearNow = inputDate.getFullYear();
    let monthNow = inputDate.getMonth();
    let dateNow = inputDate.getDate();

    return `${monthNow}/${dateNow}`
  }

  // format money
  formatMoney(value) {
    let formattedValue = accounting.formatMoney(value, {
      format: {
        pos: "%v",
        neg: "(%v)",
        zero: "0"
      }
    })
    return formattedValue
  }

  // database operations
  readFromDatabase() {
    this.rootDatabase.ref('expenses').on('value', takeSnapshot);

    self = this;

    function takeSnapshot(snapshot) {
      var entries = snapshot.val();

      if (entries !== null) {

        var keys = Object.keys(entries);

        var totalIncome = 0;
        var totalExpense = 0;
        var totalBalance = 0;

        // match id and content
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];

          var category = entries[k].title;
          var amount = entries[k].amount;

          if (amount > 0) {
            totalExpense += amount;
          }
          else {
            totalIncome -= amount;
          }
        }

        totalBalance = totalIncome - totalExpense;

        self.incomeAmount.innerHTML = self.formatMoney(totalIncome);
        self.expenseAmount.innerHTML = self.formatMoney(totalExpense);
        self.balanceAmount.innerHTML = self.formatMoney(totalBalance);
        self.listBox.classList.remove("no-show");
      }
      else {
        self.incomeAmount.innerHTML = self.formatMoney(0);
        self.expenseAmount.innerHTML = self.formatMoney(0);
        self.balanceAmount.innerHTML = self.formatMoney(0);
        self.listBox.classList.add("no-show");
      }
    }
  }

  pushToDatabase(expense) {
    this.rootDatabase.ref('expenses').push(expense);
  }

  // change text color
  changeTextColor() {
    if (this.amountInput.value < 0) {
      this.amountInput.classList.add("green-text");
    } else {
      this.amountInput.classList.remove("green-text");
    }
  }

  // method for radios
  updateRadios(value) {
    // set value from inside
    if (value && value !== "reset") {
      this.radioCurrentState = value;
      for (let i = 0; i < this.radioCategories.length; i++) {
        if (this.radioCategories[i].value == value) {
          this.radioCategories[i].checked = true;
          this.radioCategories[i].parentElement.classList.add("light-label");
        } else {
          this.radioCategories[i].checked = false;
          this.radioCategories[i].parentElement.classList.remove("light-label");
        }
      }
    }
    // reset module
    else if (value == "reset") {
      for (let i = 0; i < this.radioCategories.length; i++) {
        this.radioCategories[i].checked = false;
        this.radioCategories[i].parentElement.classList.remove("light-label");
        this.radioCurrentState = "❓";
      }
    }
    // value absent, set radios from outside
    else {
      for (let i = 0; i < this.radioCategories.length; i++) {
        if (this.radioCategories[i].checked) {
          this.radioCurrentState = this.radioCategories[i];
          this.radioCategories[i].parentElement.classList.add("light-label");
        } else {
          this.radioCurrentState = "❓";
          this.radioCategories[i].parentElement.classList.remove("light-label");
        }
      }
    }
  }

  // submit expense form
  submitExpenseForm() {
    const radioCurrentState = this.radioCurrentState;
    const amountInput = this.amountInput.value;
    const notesInput = this.notesInput.value;
    const editMode = this.editMode;
    const editID = this.editID;


    if (editMode == false) {
      if (amountInput < 0) {
        let amount = parseFloat(amountInput);
        let notes = notesInput;
        this.amountInput.value = "";

        let income = {
          title: '➕',
          date: `${this.generateDate()}`,
          amount: amount,
          notes: notes
        }
        this.pushToDatabase(income);
      } else if (amountInput > 0 && radioCurrentState == null) {
        let amount = parseFloat(amountInput);
        let notes = notesInput;
        this.amountInput.value = "";

        let expense = {
          title: '❓',
          date: `${this.generateDate()}`,
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
          date: `${this.generateDate()}`,
          amount: amount,
          notes: notes
        }
        this.pushToDatabase(expense);
      }
    }
    // if editMode is true
    else if (editMode == true) {
      if (amountInput < 0) {
        let amount = parseFloat(amountInput);
        let notes = notesInput;
        this.amountInput.value = "";

        let income = {
          title: '➕',
          amount: amount,
          notes: notes
        }
        this.rootDatabase.ref('expenses/' + this.editID).update(income)
      } else if (amountInput > 0 && radioCurrentState == null) {
        let amount = parseFloat(amountInput);
        let notes = notesInput;
        this.amountInput.value = "";

        let expense = {
          title: '❓',
          amount: amount,
          notes: notes
        }
        this.rootDatabase.ref('expenses/' + this.editID).update(expense)
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
        this.rootDatabase.ref('expenses/' + this.editID).update(expense)
      }
    }
    this.editMode = false;
    this.updateRadios("reset")
    this.notesInput.placeholder = "Notes"

    // remove selected state on submission
    let selected = document.querySelector('.selected')

    if (selected) {
      selected.classList.remove('selected')
      selected.classList.remove('dimmed')

    }
    this.display.classList.add('display-black')
    this.display.classList.remove('display-blue')
  }

  expenseFilter(expense) {
    if (expense.amount < 0) {
      return "(" + -expense.amount + ")";
    }
    return expense.amount;
  }

  // display-expenses
  displayExpenses() {
    this.rootDatabase.ref('expenses').on('value', takeSnapshot);

    self = this;
    function takeSnapshot(snapshot) {
      self.listBox.innerHTML = '';
      if (snapshot.val() !== null) {
        self.expenseList.innerHTML = '';
        var entries = snapshot.val();
        var keys = Object.keys(entries);

        let listbox = document.getElementById("list-box")
        const div = document.createElement('div');
        div.classList.add('info-month')
        const month = self.generateDate("monthName");
        const dateNow = self.generateDate("date")
        div.innerHTML = `
        <div>${month} ${dateNow}</div>
        `;
        listbox.appendChild(div);
        listbox.classList.add('initial-animation')

        // match id and content
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          var category = entries[k].title;
          var amount = entries[k].amount;
          var amountFormatted = self.formatMoney(amount);
          var date = entries[k].date;
          var notes = entries[k].notes;
          var displayDate = self.dateConverter(date);

          // append to DOM
          let expenseList = document.getElementById("list-box");
          const div = document.createElement("div");
          div.classList.add("expense");
          div.innerHTML = `

        <div class="expense-title">${category}</div>
        <div class="expense-date">${displayDate}</div>
        <div class="expense-amount">${amountFormatted}</div>
        <div class="expense-notes no-show">${notes}</div>
        <div class="expense-icons">
          <a href="#" class="edit-icon" data-id="${k}">
            <div class="edit-icon">Edit</div>
          </a>
          <a href="#" class="delete-icon" data-id="${k}">
            <div class="delete-icon">Delete</div>
          </a>
        </div>
        `;
          expenseList.appendChild(div);
        }
      }
    }
  }

  // edit expense
  editExpense(element) {
    let id = element.dataset.id;
    this.editID = id;
    this.editMode = true;
    let parent = element.parentElement.parentElement;
    let title = parent.querySelector('.expense-title').innerHTML;
    let amount = parent.querySelector('.expense-amount').innerHTML;
    let notes = parent.querySelector('.expense-notes').innerHTML

    // update radios  
    this.updateRadios(title);
    this.amountInput.value = amount;
    this.notesInput.value = notes;

    // visuals
    parent.classList.add('dimmed')
    parent.classList.add('selected')
    this.display.classList.add('display-blue')
    this.display.classList.remove('display-black')
    if (notes == "") {
      this.notesInput.placeholder = ""
    }
  }

  // delete expense
  deleteExpense(element) {
    let id = element.dataset.id;
    let parent = element.parentElement.parentElement;
    // remove from database
    this.rootDatabase.ref('expenses/' + id).remove();
  }
}
// event listeners
function eventListeners() {
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const radioCategories = document.getElementsByName("radio-category");
  const amountInput = document.getElementById("amount-input");
  const expenseInput = document.getElementById("expense-input");
  const notesInput = document.getElementById("notes-input")
  const listBox = document.getElementById("list-box")

  // new instance of UI CLASS
  const ui = new UI();

  // initial read from database (console.log())
  ui.readFromDatabase();
  ui.displayExpenses();

  // reset radio at startup
  ui.updateRadios("reset");

  // expense click
  listBox.addEventListener("click", function (event) {
    if (event.target.classList.contains("edit-icon")) {
      if (ui.editMode == false) {
        ui.editExpense(event.target.parentElement);
        document.getElementById("amount-input").focus();
      }
    } else if (event.target.classList.contains("delete-icon") && ui.editMode == false) {
      ui.deleteExpense(event.target.parentElement);
    }
  });

  // category change
  for (let i = 0; i < radioCategories.length; i++) {
    radioCategories[i].addEventListener("change", function () {
      ui.updateRadios(radioCategories[i].value);
    });
  }

  // display color change
  amountInput.addEventListener("input", function () {
    ui.changeTextColor();
  });

  // auto focus back to display
  expenseInput.addEventListener("click", function (event) {
    document.getElementById("amount-input").focus();
  });

  // form submit on "enter"
  document.onkeydown = function (e) {
    if (e.keyCode == 13) {
      ui.submitExpenseForm();
    }
  }

  // document.addEventListener('keydown', keydown => {
  //   console.log(keydown)
  //   if (keydown.code.includes("Digit") && keydown.shiftKey == false || keydown.code.includes("Period") || keydown.key.includes("+") || keydown.code.includes("Backspace") && notesInput.value == '' || keydown.code.includes("Slash")) {
  //     document.getElementById("amount-input").focus();
  //   }
  //   else {
  //     document.getElementById("notes-input").focus();
  //     document.getElementById("notes-input").classList.remove('zero-opacity');
  //   }
  // })
}

// when DOMContentLoaded function eventListeners loads
document.addEventListener("DOMContentLoaded", function () {
  eventListeners();
  document.getElementById('container').classList.remove("no-show")
  document.getElementById('container').classList.add("initial-animation")
  
});