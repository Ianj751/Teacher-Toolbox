import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  getAuth,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
  getDoc,
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { app, db } from "firebase/init.js";

const googleProvider = new GoogleAuthProvider();
const auth = getAuth(app);
// DOM Elements
const form = document.getElementById("form");
const usernameInput = document.getElementById("user-input");
const passwordInput = document.getElementById("pass-input");
const errorMessage = document.getElementById("error-message");
const googleSignInBtn = document.getElementById("google-signin");
const teacherLink = document.getElementById("teacher-link");
const studentLink = document.getElementById("student-link");
const teacherFields = document.querySelector(".teacher-fields");
const studentFields = document.querySelector(".student-fields");
const teacherOptions = document.getElementById("teacher-options");

// Toggle between teacher and student login
teacherLink.addEventListener("click", (e) => {
  e.preventDefault();
  teacherLink.classList.add("active");
  studentLink.classList.remove("active");
  teacherFields.style.display = "block";
  studentFields.style.display = "none";
  teacherOptions.style.display = "block";
});

studentLink.addEventListener("click", (e) => {
  e.preventDefault();
  studentLink.classList.add("active");
  teacherLink.classList.remove("active");
  studentFields.style.display = "block";
  teacherFields.style.display = "none";
  teacherOptions.style.display = "none";
});

// Form submission handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (teacherLink.classList.contains("active")) {
    handleTeacherLogin();
  } else {
    handleStudentLogin();
  }
});
// Initialize reCAPTCHA
window.recaptchaVerifier = new RecaptchaVerifier(
  auth, // Pass the auth instance here
  "submit-button", // The ID of the reCAPTCHA container
  {
    size: "invisible",
    callback: (response) => {
      console.log("reCAPTCHA verified");
    },
  }
);
function createUserIfNotExists(email, password) {
  return new Promise((resolve, reject) => {
    const appVerifier = window.recaptchaVerifier;

    // First try to sign in
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("User exists, signed in:", userCredential.user.email);
        resolve(userCredential.user);
        window.location.href = "/Teacher-Toolbox/dashboard/dashboard.html";
      })
      .catch((error) => {
        handleAuthError(error);
        if (error.code === "auth/user-not-found") {
          console.log("User doesn't exist, creating new account...");

          createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
              console.log(
                "User created successfully:",
                userCredential.user.email
              );
              resolve(userCredential.user);
            })
            .catch((createError) => {
              reject(createError);
            });
        } else {
          console.error("Error signing in:", error);
          reject(error);
        }
      });
  });
}

// Handle teacher login
async function handleTeacherLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  createUserIfNotExists(username, password);
}

// Handle student login
async function handleStudentLogin() {
  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const studentId = document.getElementById("id-input").value.trim();

  if (!firstName || !lastName || !studentId) {
    displayError("Please fill in all fields");
    return;
  }

  try {
    // Get all users to search through their rosters
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    let studentFound = false;
    let teacherUid = null;

    // Search through each teacher's roster
    for (const userDoc of usersSnapshot.docs) {
      const studentsRef = collection(db, "users", userDoc.id, "students");
      const q = query(
        studentsRef,
        where("firstName", "==", firstName),
        where("lastName", "==", lastName),
        where("iD", "==", studentId)
      );

      const studentSnapshot = await getDocs(q);
      sessionStorage.setItem("firebaseID", studentSnapshot.id);
      if (!studentSnapshot.empty) {
        studentFound = true;
        teacherUid = userDoc.id;
        break;
      }
    }

    if (studentFound) {
      // Store the teacher's UID in sessionStorage for later use
      sessionStorage.setItem("teacherUid", teacherUid);
      sessionStorage.setItem("studentFirstName", firstName);
      sessionStorage.setItem("studentLastName", lastName);
      sessionStorage.setItem("studentId", studentId);

      const studentsRef = collection(db, `users/${teacherUid}/students`);
      const querySnapshot = await getDocs(studentsRef);

      let foundFirebaseId = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Match based on first name and last name
        if (
          data.firstName === firstName &&
          data.lastName === lastName &&
          data.iD === studentId
        ) {
          foundFirebaseId = doc.id;
          // Store the Firebase document ID in session storage
          sessionStorage.setItem("firebaseID", foundFirebaseId);
          console.log("Found Firebase ID:", foundFirebaseId);
          console.log("Matched student data:", data);
          console.log(auth);
        }
      });

      // Redirect to student dashboard
      window.location.href =
        "/Teacher-Toolbox/dashboard/student-dashboard.html";
    } else {
      displayError(
        "Student not found. Please check your information and try again."
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    displayError("An error occurred during login. Please try again.");
  }
}

// Google Sign-In
googleSignInBtn.addEventListener("click", async () => {
  try {
    clearError();
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    console.log("Google sign-in successful:", user);
    localStorage.setItem("googleToken", token);

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        displayName: user.displayName,
        email: user.email,
        uid: user.uid,
        lastLogin: new Date(),
      });
    } else {
      await updateDoc(userDocRef, {
        displayName: user.displayName,
        email: user.email,
        uid: user.uid,
        lastLogin: new Date(),
      });
    }
    window.location.href = "/Teacher-Toolbox/dashboard/dashboard.html";
  } catch (error) {
    handleAuthError(error);
  }
});

// Handle authentication errors
function handleAuthError(error) {
  console.error("Authentication error:", error);
  let message = "An error occurred during authentication.";

  switch (error.code) {
    case "auth/popup-blocked":
      message = "Popup was blocked. Please allow popups for this website.";
      break;
    case "auth/popup-closed-by-user":
      message = "Authentication popup was closed before completion.";
      break;
    case "auth/email-already-in-use":
      message = "This email is already registered. Please log in instead.";
      break;
    case "auth/invalid-email":
      message = "Please enter a valid email address.";
      break;
    case "auth/weak-password":
      message = "Password is too weak. Please use at least 6 characters.";
      break;
    case "auth/user-not-found":
    case "auth/wrong-password":
      message = "Invalid email or password.";
      break;
    case "auth/too-many-requests":
      message = "Too many failed login attempts. Please try again later.";
      break;
    case "auth/cancelled-popup-request":
      return;
    default:
      message = `Error: ${error.message}`;
  }
  displayError(message);
}

// Display error message
function displayError(message) {
  errorMessage.textContent = message;
  errorMessage.style.color = "red";
}

// Clear error message
function clearError() {
  errorMessage.textContent = "";
}

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is already signed in:", user);
  } else {
    console.log("No user is signed in");
  }
});
