import { db } from "../../firebase/init.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const auth = getAuth();
let attendanceChanges = [];
document.getElementById("date").valueAsDate = new Date();

onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    console.log("User UID:", uid);
    loadStudents(uid); // Load students for this user

    // Add event listener for date changes
    document.getElementById("date").addEventListener("change", () => {
      // Clear attendance changes when date changes
      attendanceChanges = [];
      // Reload students with new date
      loadStudents(uid);
    });
  } else {
    console.error("No user signed in.");
  }
});

async function loadStudents(uid) {
  try {
    const querySnapshot = await getDocs(
      collection(db, "users", uid, "students")
    );
    const outputDiv = document.getElementById("output");
    outputDiv.innerHTML = ""; // clear

    // Add a header row
    outputDiv.innerHTML = `
      <div class="attendance-header">
        <div class="student-info">Student Information</div>
        <div class="attendance-options">
          <label>Present</label>
          <label>Absent</label>
        </div>
      </div>
    `;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const studentId = docSnap.id;
      const date = document.getElementById("date").value;
      const attendance = data.attendance || {};
      const isPresent = attendance[date]?.status === "present";
      const isAbsent = attendance[date]?.status === "absent";

      // Create status indicator text
      let statusText = "";
      if (isPresent) {
        statusText =
          '<span style="color: green; font-weight: bold;">Present</span>';
      } else if (isAbsent) {
        statusText =
          '<span style="color: red; font-weight: bold;">Absent</span>';
      } else {
        statusText = '<span style="color: gray;">Not recorded</span>';
      }

      outputDiv.innerHTML += `<div class="student-row">
          <div class="student-info">
          <strong>Name:</strong> ${data.firstName} ${data.lastName} - 
          <strong>ID:</strong> ${data.iD} 
          <strong>Present days:</strong> ${data.present || 0}
          <strong>Absent days:</strong> ${data.absent || 0}
            <strong>Status for ${date}:</strong> ${statusText}
          </div>
          <div class="attendance-options">
            <input type="checkbox" 
                   id="present-${studentId}" 
                   ${isPresent ? "checked" : ""} 
                   onchange="addList('${studentId}', 'present', this.checked)">
            <input type="checkbox" 
                   id="absent-${studentId}" 
                   ${isAbsent ? "checked" : ""} 
                   onchange="addList('${studentId}', 'absent', this.checked)">
          </div>
        </div>`;
    });
  } catch (error) {
    console.error("Error loading students:", error);
  }
}

// Fixed addList function to store objects with all necessary information
function addList(studentId, status, checked) {
  // Remove any existing entry for this student
  attendanceChanges = attendanceChanges.filter(
    (item) => item.studentId !== studentId
  );

  // Add new entry if checked
  if (checked) {
    attendanceChanges.push({
      studentId: studentId,
      status: status,
      checked: checked,
    });
  }

  // If this is a present checkbox being checked, uncheck the absent checkbox
  if (status === "present" && checked) {
    document.getElementById(`absent-${studentId}`).checked = false;
  }

  // If this is an absent checkbox being checked, uncheck the present checkbox
  if (status === "absent" && checked) {
    document.getElementById(`present-${studentId}`).checked = false;
  }

  console.log("Current attendance changes:", attendanceChanges);
}

// Fixed submit button event listener
document.getElementById("sub").addEventListener("click", async (event) => {
  event.preventDefault();

  // Check if date is selected
  const date = document.getElementById("date").value;
  if (!date) {
    alert("Please select a date before taking attendance.");
    return;
  }

  console.log("Submitting attendance changes:", attendanceChanges);

  // Process each attendance change
  for (let i = 0; i < attendanceChanges.length; i++) {
    const change = attendanceChanges[i];
    await updateAttendance(change.studentId, change.status, change.checked);
  }

  // Clear the attendance changes array after processing
  attendanceChanges = [];

  // Reload the student list to show updated attendance
  const user = auth.currentUser;
  if (user) {
    loadStudents(user.uid);
  }
});

// Function to update attendance based on checkbox state
async function updateAttendance(studentId, status, checked) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user signed in.");
      return;
    }

    // Get the date value
    const date = document.getElementById("date").value;
    if (!date) {
      console.error("No date selected.");
      return;
    }

    //variables for easier access
    const studentRef = doc(db, "users", user.uid, "students", studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      console.error("Student not found.");
      return;
    }

    const studentData = studentDoc.data();

    // Initialize attendance object if it doesn't exist
    const attendance = studentData.attendance || {};

    // Check if attendance was already recorded for this date
    const wasAlreadyRecorded = attendance[date] !== undefined;
    const previousStatus = wasAlreadyRecorded ? attendance[date].status : null;

    if (checked) {
      // If checking a box, update the attendance
      attendance[date] = {
        status: status,
        timestamp: new Date(),
        notes: "",
      };

      // Update the counter
      const counterField = status === "present" ? "present" : "absent";
      const otherStatus = status === "present" ? "absent" : "present";

      // Increment the selected status counter
      const counterValue = (studentData[counterField] || 0) + 1;

      // Only decrement the other status counter if it was previously recorded
      let otherCounterValue = studentData[otherStatus] || 0;
      if (wasAlreadyRecorded && previousStatus === otherStatus) {
        otherCounterValue = Math.max(0, otherCounterValue - 1);
      }

      await updateDoc(studentRef, {
        attendance: attendance,
        [counterField]: counterValue,
        [otherStatus]: otherCounterValue,
      });

      console.log(
        `Updated ${status} status for student ${studentId} on date: ${date}`
      );
    } else {
      // If unchecking a box, remove the attendance record
      delete attendance[date];

      // Update the counter - only decrement if it was previously recorded
      const counterField = status === "present" ? "present" : "absent";

      // Only decrement if this status was previously recorded
      let counterValue = studentData[counterField] || 0;
      if (wasAlreadyRecorded && previousStatus === status) {
        counterValue = Math.max(0, counterValue - 1);
      }

      await updateDoc(studentRef, {
        attendance: attendance,
        [counterField]: counterValue,
      });

      console.log(
        `Removed ${status} status for student ${studentId} on date: ${date}`
      );
    }
  } catch (error) {
    console.error(`Error updating ${status} status:`, error);
  }
}

//Declares the functions
window.updateAttendance = updateAttendance;
window.addList = addList;

// Hamburger menu functionality
var menuButton = document.getElementById("menuButton");
var menuContent = document.getElementById("menuContent");

menuButton.addEventListener("click", () => {
  menuButton.classList.toggle("active");
  menuContent.classList.toggle("show");
});
