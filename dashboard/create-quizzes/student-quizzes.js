import { db } from '../../firebase/init.js';
import { collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';


const outputDiv = document.getElementById('outputDivQuiz');
outputDiv.innerHTML = '';

//style block
const style = document.createElement('style');
style.textContent = `
  body {
    background-color:rgb(255, 255, 255);
    color: #fff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 40px;
  }

  #outputDivQuiz {
    max-width: 1500px;
    margin: 0 auto;
    margin-top: 10%;
    padding: 70px;
    background-color: rgb(71, 132, 218);
    border-radius: 5px;
    box-shadow: 0 0 15px rgba(0,0,0,0.5);
  }

  a {
    text-decoration: none;
    color:rgb(255, 255, 255);
    font-weight: bold;
    font-size: 1.8em;
    margin: 20px 0;
    display: block;
    padding: 10px;
    transition: color 0.3s, text-decoration 0.3s;
  }

  a:hover {
    text-decoration: underline;
    color: rgb(189, 191, 194);
  }

  p {
    font-size: 1.2em;
    color: #fff;
    margin: 15px 0;
  }
  
  a:active {
    color: #009acd;
  }
`;
document.head.appendChild(style);

// Hamburger menu functionality
var menuButton = document.getElementById("menuButton");
var menuContent = document.getElementById("menuContent");

menuButton.addEventListener("click", () => {
  menuButton.classList.toggle("active");
  menuContent.classList.toggle("show");
});

document.addEventListener('DOMContentLoaded', async () => {
  const teacherUid = sessionStorage.getItem("teacherUid");
  const studentFirstName = sessionStorage.getItem("studentFirstName");
  const studentLastName = sessionStorage.getItem("studentLastName");

  if (!teacherUid || !studentFirstName || !studentLastName) {
    outputDiv.innerHTML = "<p>Please log in to view quizzes.</p>";
    return;
  }

  try {
    //get the student document
    const studentsRef = collection(db, "users", teacherUid, "students");
    const studentSnapshot = await getDocs(studentsRef);
    const studentDoc = studentSnapshot.docs.find(doc =>
      doc.data().firstName === studentFirstName &&
      doc.data().lastName === studentLastName
    );

    if (!studentDoc) {
      outputDiv.innerHTML = "<p>Student not found.</p>";
      return;
    }

    const studentId = studentDoc.id;

    //fetch quizzes
    const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));

    if (quizzesSnapshot.empty) {
      outputDiv.innerHTML = '<p>No quizzes found.</p>';
      return;
    }

    for (const quizDoc of quizzesSnapshot.docs) {
      const quizId = quizDoc.id;
      const submissionRef = doc(db, "users", teacherUid, "students", studentId, "quizSubmissions", quizId);
      const submissionSnap = await getDoc(submissionRef);

      //skip submitted quizzes
      if (submissionSnap.exists() && submissionSnap.data().submitted) continue;

      const quizData = quizDoc.data();
      const quizTitle = document.createElement('a');
      quizTitle.href = `quiz.html?id=${quizId}`;
      quizTitle.textContent = quizData.name;
      quizTitle.addEventListener('mouseenter', () => {
        quizTitle.style.textDecoration = 'underline';
      });
      quizTitle.addEventListener('mouseleave', () => {
        quizTitle.style.textDecoration = 'none';
      });

      outputDiv.appendChild(quizTitle);
    }
  } catch (error) {
    console.error("Error loading quizzes:", error);
    outputDiv.innerHTML = "<p>Something went wrong loading quizzes.</p>";
  }
});
