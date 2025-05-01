import { db } from "../../firebase/init.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const auth = getAuth();
const outputTableBody = document.getElementById("performance-table");
const searchInput = document.getElementById("search-student");

let allStudents = [];

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadStudents(user.uid);
  } else {
    console.error("User is not logged in.");
  }
});

async function loadStudents(uid) {
  if (!uid) {
    console.error("No UID available.");
    return;
  }

  try {
    const studentsCollectionRef = collection(db, "users", uid, "students");
    const querySnapshot = await getDocs(studentsCollectionRef);

    allStudents = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allStudents.push(data);
    });

    renderTable(allStudents);
  } catch (error) {
    console.error("Error loading students:", error);
  }
}

function renderTable(students) {
  outputTableBody.innerHTML = "";

  if (students.length === 0) {
    outputTableBody.innerHTML =
      '<tr><td colspan="5">No students found.</td></tr>';
    return;
  }

  students.forEach((data) => {
    outputTableBody.innerHTML += `
      <tr>
        <td>${data.iD}</td>
        <td>${data.lastName}</td>
        <td>${data.firstName}</td>
        <td>${data.subject || "-"}</td> <!-- to be added soon -->
        <td>${data.grade || "-"}</td>
        <td>${
          (data.present / (data.absent + data.present)) * 100 + "%" || "-"
        }</td>
      </tr>`;
  });
}

//live search
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = allStudents.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(query);
  });

  renderTable(filtered);
});

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
