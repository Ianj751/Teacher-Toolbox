import { db } from "../../firebase/init.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

//protectRoute();

// Load students button functionality
document.getElementById("load-students").onclick = async function () {
  const user = getAuth().currentUser;
  if (!user) {
    alert("No user signed in");
    return;
  }

  try {
    const studentsCollectionRef = collection(db, "users", user.uid, "students");
    const querySnapshot = await getDocs(studentsCollectionRef);

    if (querySnapshot.empty) {
      alert("No students found");
      return;
    }
    //add all students to the textarea
    let studentNames = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      studentNames.push(`${data.firstName} ${data.lastName}`);
    });
    document.getElementById("student-names").value = studentNames.join("\n");
  } catch (error) {
    console.error("Error loading students:", error);
    alert("Error loading students. Please try again.");
  }
};

document.getElementById("generate-teams").onclick = function () {
  myFunction();
};

function myFunction() {
  let textarea = document.getElementById("student-names").value;
  if (!textarea) {
    alert("student names can not be empty");
    return;
  }
  let names = textarea.split("\n");
  const numGroups = document.getElementById("number-teams").value;
  if (isNaN(numGroups)) {
    alert("Number of groups field must contain a number");
  }
  if (!numGroups || numGroups <= 0) {
    alert("Number of groups must be greater than 0");
    return;
  }

  if (numGroups > names.length) {
    alert("Number of groups cannot exceed the number of names");
    return;
  }

  let val = document
    .getElementById("team-results")
    .getElementsByTagName("tbody");
  for (let i = 0; i < val.length; i++) {
    val[i].innerHTML = "";
  }

  let table = document
    .getElementById("team-results")
    .getElementsByTagName("tbody")[0];

  const groups = Array.from({ length: numGroups }, () => []);

  const shuffledNames = names
    .map((name) => ({ name, sort: Math.random() })) //{alice, .75},{bob, .13}
    .sort((a, b) => a.sort - b.sort) //sort ascending
    .map((item) => item.name); // get names back

  shuffledNames.forEach((name, index) => {
    groups[index % numGroups].push(name);
  });

  for (let i = 0; i < groups.length; ++i) {
    let newRow = table.insertRow();
    let cell = newRow.insertCell(0);
    cell.innerHTML = `Team ${i + 1}: ${groups[i]}`;
  }
}
// Hamburger menu functionality
menuButton.addEventListener("click", () => {
  menuButton.classList.toggle("active");
  menuContent.classList.toggle("show");
});

// Logout functionality
logoutBtn.addEventListener("click", () => {
  // Clear session storage
  sessionStorage.removeItem("studentId");
  sessionStorage.removeItem("teacherUid");
  sessionStorage.removeItem("firebaseID");

  // Redirect to login page
  window.location.href = "../../index.html";
});
