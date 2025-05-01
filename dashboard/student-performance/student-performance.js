import { db } from "../../firebase/init.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// DOM Elements
const performanceTable = document.getElementById("performance-table");
const menuButton = document.getElementById("menuButton");
const menuContent = document.getElementById("menuContent");
const logoutBtn = document.getElementById("log-out-btn");

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

// Check if student is logged in and load data
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Page loaded, checking session storage...");

  // Log all session storage items
  console.log("All session storage items:");
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    console.log(`${key}: ${sessionStorage.getItem(key)}`);
  }

  const studentId = sessionStorage.getItem("studentId");
  const teacherUid = sessionStorage.getItem("teacherUid");

  console.log("Retrieved values:", {
    studentId,
    teacherUid,
  });

  if (!studentId || !teacherUid) {
    console.error("Missing required session data:", {
      hasStudentId: !!studentId,
      hasTeacherUid: !!teacherUid,
    });
    window.location.href = "../../index.html";
    return;
  }

  try {
    console.log("Attempting to fetch student document...");
    let firebaseID = sessionStorage.getItem("firebaseID");
    const studentDoc = await getDoc(
      doc(db, `users/${teacherUid}/students`, firebaseID)
    );

    console.log("Student document found:", studentDoc.data());
    const studentData = studentDoc.data();

    if (!studentDoc.exists()) {
      console.error("Student document not found in Firestore");
      document.getElementById("performance-table").innerHTML =
        '<tr><td colspan="2">Student not found</td></tr>';
      return;
    }

    const attendancePercentage = sessionStorage.getItem("attendencePer");

    const grade = studentData.grade;

    console.log("Calculated attendance:", {
      attendancePercentage,
      grade,
    });

    // Create simple table with student info
    const table = document.getElementById("performance-table");
    table.innerHTML = `
            <tr>
                <td>Student ID:</td>
                <td>${studentId}</td>
            </tr>
            <tr>
                <td>Name:</td>
                <td>${studentData.firstName} ${studentData.lastName}</td>
            </tr>
            <tr>
                <td><a href="../create-quizzes/student-quizzes.html">Grade:</a></td>
                <td>${studentData.grade || "Not graded"}</td>
            </tr>
            <tr>
                <td><a href = "../track-student-attendance/track-student-attendance.html">Attendance:</a></td>
                <td>${attendancePercentage}%</td>
            </tr>
        `;

    console.log("Table updated with student information");
  } catch (error) {
    console.error("Error loading student data:", error);
    document.getElementById("performance-table").innerHTML =
      '<tr><td colspan="2">Error loading data</td></tr>';
  }
});
