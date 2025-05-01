import {
  createUserWithEmailAndPassword,
  getAuth,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const form = document.getElementById("form");
const email = document.getElementById("email-input");
const username = document.getElementById("user-input");
const password = document.getElementById("pass-input");
const passwordRep = document.getElementById("pass-repeat-input");
const error_message = document.getElementById("error-message");

const auth = getAuth();

form.addEventListener("submit", (e) => {
  console.log("DID THIS WORK");
  let errors = [];

  if (email) {
    //if there is an email input, we are at the signup page
    errors = getSignupErrors(
      email.value,
      username.value,
      password.value,
      passwordRep.value
    );
  } else {
    // if there is no email input, we are in the loginscreen
    errors = getLoginErrors(username.value, password.value);
  }

  if (errors.length > 0) {
    // If there are any errors
    e.preventDefault();
    error_message.innerText = errors.join(". ");
  } else {
    // Only attempt to create account if validation passes
    createUserWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        // Signed in successfully
        const user = auth.currentUser;
        window.location.pathname = "/dashboard/student-dashboard.html";
      })
      .catch((error) => {
        e.preventDefault();
        let errorMessage = "An error occurred during signup. ";
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage += "This email is already registered.";
            break;
          case "auth/invalid-email":
            errorMessage += "The email address is invalid.";
            break;
          case "auth/operation-not-allowed":
            errorMessage += "Email/password accounts are not enabled.";
            break;
          case "auth/weak-password":
            errorMessage += "The password is too weak.";
            break;
          default:
            errorMessage += error.message;
        }
        error_message.innerText = errorMessage;
        console.log(errorMessage);
      });
  }
});

function getSignupErrors(email, username, password, passwordRep) {
  let errors = [];

  if (email == "" || email == null) {
    errors.push("Email is required");
  }
  if (username == "" || username == null) {
    errors.push("Username is required");
  }
  if (password == "" || password == null) {
    errors.push("Password is required");
  }
  if (passwordRep != password) {
    errors.push("Passwords do not match");
  }

  return errors;
}

function getLoginErrors(username, password) {
  let errors = [];

  if (username == "" || username == null) {
    errors.push("Username is required");
  }
  if (password == "" || password == null) {
    errors.push("Password is required");
  }

  return errors;
}

const allInputs = [email, username, password, passwordRep].filter(
  (input) => input != null
);

allInputs.forEach((input) => {
  input.addEventListener("input", () => {
    if (input.parentElement.classList.contains("incorrect")) {
      input.parentElement.classList.remove("incorrect");
      error_message.innerText = "";
    }
  });
});
