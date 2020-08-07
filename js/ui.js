import Element from './element.js'

export default class UI {
  constructor(elements = [], canvas) {
    this.elements = elements;
    this.canvas = canvas;
  }

  displayElements() {
    const canvas = this.canvas = null;
    for (element of this.elements) {
      canvas.appendChild(element);
    }
  }

  eventListeners() {

    this.loginForm.onkeydown = e => {
      if (e.keyCode == 13) {
        self.signUpFirebase();
      }
    };

    this.logOutButton.addEventListener("click", () => {
      this.signOutFirebase();
    });

    // Lists
    this.lists.forEach(list => {
      list.addEventListener("click", event => {
        if (event.target.classList.contains("edit-icon")) {
          self.editRecord(event.target.parentElement.dataset.id);
        }
        if (event.target.classList.contains("delete-icon")) {
          self.deleteExpense(event.target);
        }
      });
    });

    // Category change
    for (let e of this.radioCategories) {
      e.addEventListener("change", function () {
        self.updateRadios(e.value);
      });
    }

    // Focus to display
    this.expenseInput.addEventListener("click", function () {
      document.getElementById("amount-input").focus();
    });

    // Form submit
    this.expenseForm.onkeydown = function (e) {
      if (e.keyCode == 13) {
        let selectedRadio = !document.querySelector('input[name="radio-category"]:checked') ? null : document.querySelector('input[name="radio-category"]:checked').value;
        let record = new Record(selectedRadio, Number(self.amountInput.value), String(new Date()), self.notesInput.value || '');
        self.submitRecord(record);
        self.amountInput.value = '';
        self.notesInput.value = '';
      }
    }
  }
}
