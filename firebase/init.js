import firebaseConfig from "./firebaseconfig.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

//Not sure where to put this function but
//This func is to ensure that unauthz users can not access certain routes.
//Without a user id, users would be unable to access personalized resources
export function protectRoute() {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      // Redirect to login if not authenticated
      alert("You must be logged in to view this page");
      window.location.href = "/loginPage/login.html";
    }
  });
}
