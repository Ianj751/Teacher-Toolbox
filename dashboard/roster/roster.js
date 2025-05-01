import { db } from '../../firebase/init.js';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const auth = getAuth();
const outputDiv = document.getElementById('output');

async function loadStudents(uid) {
  if (!uid) {
    console.error("No UID available.");
    return;
  }

  try {
    const studentsCollectionRef = collection(db, 'users', uid, 'students');
    const querySnapshot = await getDocs(studentsCollectionRef);
    outputDiv.innerHTML = '';

    if (querySnapshot.empty) {
      outputDiv.innerHTML = '<p>No students found.</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      outputDiv.innerHTML += `<p style="border:1px solid #ccc !important; border-radius:16px; font-size: 17px;"><strong>Name: </strong>${data.firstName} ${data.lastName} <span style="margin: 0 auto;"><strong>ID: </strong>${data.iD}</span> 
 <button class='rmv-button' data-id='${doc.id}'>Remove</button> </p>`;
    });
    
  } catch (error) {
    console.error("Error loading students:", error);
  }
}

//hamburger menu
var menuButton = document.getElementById("menuButton");
var menuContent = document.getElementById("menuContent");
        
menuButton.addEventListener("click", async () => {
    menuButton.classList.toggle("active");
    menuContent.classList.toggle("show");
});

outputDiv.addEventListener('click', async (event) => {
  if (event.target.classList.contains('rmv-button')) {
    const docId = event.target.getAttribute('data-id');
    console.log("Removing student with ID:", docId);

    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user signed in.");
        return;
      }
      
      const docRef = doc(db, 'users', user.uid, 'students', docId);
      await deleteDoc(docRef);
      console.log("Student removed successfully!");
      
      loadStudents(user.uid); // Refresh student list
    } catch (error) {
      console.error("Error removing student:", error);
    }
  }
});

//
// User authitication
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.uid);
    const uid = user.uid;
    loadStudents(uid);

    //Add Student button
    document.getElementById('addUserBtn').addEventListener('click', async () => {
      let first = document.getElementById('first').value;
      let last = document.getElementById('last').value;
      let identity = document.getElementById('studentId').value;
      if(!first){
        console.error("No first name value");
        alert("First name can not be empty")
      }
      else if (!last){
        console.error("No last name value");
        alert("Last  name can not be empty")
      }
      else if (!identity){
        console.error("No ID value");
        alert("ID can not be empty")
      }
      else{
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, { uid }, { merge: true });
      const studentsCollectionRef = collection(db, "users", uid, "students");
      //add student to firebase
      await addDoc(studentsCollectionRef, {
        firstName: first,
        lastName: last,
        iD: identity,
        present: 0,
        absent:0,
        timestamp: Date.now()
      });
      // clear input fields
      document.getElementById('first').value = "";
      document.getElementById('last').value = "";
      document.getElementById('studentId').value = "";
      //refresh
      loadStudents(uid);
    }
    });

  } else {
    console.error("No user signed in.");
  }
});

