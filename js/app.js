// ~Temporary
const hideButton = document.querySelector("#hide");
hideButton.onclick = e => {
  loginContainer.classList.toggle("hidden");
  container.classList.toggle("blurry");
};

// .container
const container = document.querySelector(".container");

// .login-container
const loginContainer = document.querySelector(".login-container");

// #login-form
const userEmail = document.querySelector("#user-email");
const userPassword = document.querySelector("#user-password");
const loginEnter = document.querySelector("#login-enter");

// #entry-form
const displayNotes = document.querySelector("#display-notes");
const displayDate = document.querySelector("#display-date");
const displayAmount = document.querySelector("#display-amount");

// checked radio
const checkedRadio = document.querySelector("input[name='category']:checked");

// #summary
const income = document.querySelector("#income");
const expenses = document.querySelector("#expenses");
const balance = document.querySelector("#balance");
const fixed = document.querySelector("#fixed");

// .list#this-month
const thisMonth = document.querySelector("#this-month");
const lastMonth = document.querySelector("#last-month");
