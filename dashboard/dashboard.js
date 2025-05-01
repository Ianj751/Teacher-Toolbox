//import { protectRoute } from "../firebase/init.js";
import { auth } from "../firebase/init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
//protectRoute();
var menuButton = document.getElementById("menuButton");
var menuContent = document.getElementById("menuContent");

menuButton.addEventListener("click", () => {
  menuButton.classList.toggle("active");
  menuContent.classList.toggle("show");
});

document.getElementById("log-out-btn").onclick = window.signOutUser =
  async function () {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
      localStorage.removeItem("googleToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("studentFirstName");
      sessionStorage.removeItem("studentLastName");
      sessionStorage.removeItem("teacherUid");
      sessionStorage.removeItem("firebaseID");

      // Redirect to login page
      window.location.href = "../index.html";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
