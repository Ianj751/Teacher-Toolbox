import { db } from '../../firebase/init.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
const menuButton = document.getElementById('menuButton');
const menuContent = document.getElementById('menuContent');
const logoutBtn = document.getElementById('log-out-btn');

// Load students button functionality
document.getElementById("load-students").onclick = async function() {
    const user = getAuth().currentUser;
    if (!user) {
        alert("No user signed in");
        return;
    }

    try {
        const studentsCollectionRef = collection(db, 'users', user.uid, 'students');
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
        document.getElementById("select-names").value = studentNames.join('\n');
    } catch (error) {
        console.error("Error loading students:", error);
        alert("Error loading students. Please try again.");
    }
};

document.getElementById("select-student").onclick = function() {myFunction()};

function myFunction() {
    let textarea = document.getElementById("select-names").value;
    if (!textarea){
        alert("student names can not be empty")
        return 
    }
    //split names into an array, then select a random index
    let names = textarea.split('\n');
    let randomStudent = names[Math.floor(Math.random() * names.length)];
    document.getElementById("output").innerHTML = randomStudent;
}
// Hamburger menu functionality
menuButton.addEventListener('click', () => {
    menuButton.classList.toggle('active');
    menuContent.classList.toggle('show');
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    // Clear session storage
    sessionStorage.removeItem('studentId');
    sessionStorage.removeItem('teacherUid');
    sessionStorage.removeItem('firebaseID');
    
    // Redirect to login page
    window.location.href = '../../loginPage/login.html';
});
