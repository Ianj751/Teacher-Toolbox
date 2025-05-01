import { db } from '../../firebase/init.js';
import { doc, collection, query, where, updateDoc, getDoc, getDocs, setDoc} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const auth = getAuth();

const studentId = sessionStorage.getItem('studentId');
const teacherUid = sessionStorage.getItem('teacherUid');
const studentFirstName = sessionStorage.getItem("studentFirstName");
const studentLastName = sessionStorage.getItem("studentLastName");

const quizId = new URLSearchParams(window.location.search).get('id');
const quizContainer = document.getElementById('quizContainer');
const submitButton = document.querySelector('.submit_quiz');

let questions = [];

if (!quizId) {
  quizContainer.innerHTMƒL = '<p>No quiz ID found in URL.</p>';
}

async function hasStudentSubmittedQuiz(teacherUid, studentId, quizId) {
  const submissionRef = doc(db, "users", teacherUid, "students", studentId, "quizSubmissions", quizId);
  const submissionSnap = await getDoc(submissionRef);
  return submissionSnap.exists() ? submissionSnap.data() : null;
}

async function displayQuiz(quizId) {
  try {
    const quizDocRef = doc(db, 'quizzes', quizId);
    const quizSnapshot = await getDoc(quizDocRef);

    if (!quizSnapshot.exists()) {
      quizContainer.innerHTML = '<p>Quiz not found.</p>';
      return;
    }

    const quizData = quizSnapshot.data();
    quizContainer.innerHTML += `<h2>${quizData.name}</h2>`;
    quizContainer.innerHTML += `<p><strong>Description:</strong> ${quizData.description}</p><hr>`;

    const questionsColRef = collection(quizDocRef, 'questions');
    const questionsSnapshot = await getDocs(questionsColRef);

    if (questionsSnapshot.empty) {
      quizContainer.innerHTML += '<p>No questions found for this quiz.</p>';
      return;
    }

    let questionIndex = 0;

    questionsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const questionText = data.text;
      const answers = data.answers || [];
      const correctAnswerIndex = parseInt(data.correctIndex);

      const questionDiv = document.createElement('div');
      questionDiv.className = 'question-block';
      questionDiv.setAttribute('data-question-index', questionIndex);

      questionDiv.innerHTML += `<p><strong>Question ${questionIndex + 1}:</strong> ${questionText}</p>`;

      answers.forEach((answer, i) => {
        const answerId = `q${questionIndex}_a${i}`;
        questionDiv.innerHTML += `
          <label for="${answerId}">
            <input type="radio" name="question-${questionIndex}" id="${answerId}" value="${i}">
            ${answer}
          </label><br>
        `;
      });

      quizContainer.appendChild(questionDiv);
      quizContainer.appendChild(document.createElement('hr'));

      questions.push({ correctAnswerIndex });
      questionIndex++;
    });

  } catch (error) {
    console.error('Error loading quiz:', error);
    quizContainer.innerHTML = '<p>Failed to load quiz. Please try again later.</p>';
  }
}

//get student ID
const studentsRef = collection(db, "users", teacherUid, "students");
const q = query(
  studentsRef,
  where("firstName", "==", studentFirstName),
  where("lastName", "==", studentLastName)
);

const querySnapshot = await getDocs(q);

if (querySnapshot.empty) {
  quizContainer.innerHTML = "<p>Student not found.</p>";
} else {
  const studentDoc = querySnapshot.docs[0];
  const studentDocRef = doc(db, "users", teacherUid, "students", studentDoc.id);

  //check if quiz submitted
  const submissionData = await hasStudentSubmittedQuiz(teacherUid, studentDoc.id, quizId);

  if (submissionData && submissionData.submitted) {
    quizContainer.innerHTML = `
      <p>You have already submitted this quiz.</p>
      <p><strong>Your Score:</strong> ${submissionData.score}/${submissionData.total}</p>
    `;
    submitButton.style.display = 'none';
  } else {
    if (quizId) {
      await displayQuiz(quizId);
    }

    submitButton.addEventListener('click', async () => {
      let score = 0;

      questions.forEach((q, idx) => {
        const selectedInput = document.querySelector(`input[name="question-${idx}"]:checked`);
        const allInputs = document.querySelectorAll(`input[name="question-${idx}"]`);

        allInputs.forEach(input => {
          const label = input.parentElement;
          label.style.color = 'black';
          label.style.fontWeight = 'normal';
        });

        if (!selectedInput) return;

        const selectedVal = parseInt(selectedInput.value);
        const correctVal = parseInt(q.correctAnswerIndex);

        if (selectedVal === correctVal) {
          score++;
        }

        allInputs.forEach(input => {
          const label = input.parentElement;
          const val = parseInt(input.value);

          if (val === correctVal) {
            label.style.color = 'green';
            label.style.fontWeight = 'bold';
          } else if (input.checked) {
            label.style.color = 'red';
          }
        });
      });

      const resultPara = document.createElement('p');
      resultPara.innerHTML = `<strong>Your Score:</strong> ${score}/${questions.length}`;
      resultPara.style.marginTop = '20px';

      quizContainer.innerHTML = ''; //clear the quiz content
      quizContainer.appendChild(resultPara);
      submitButton.disabled = true;

      //update cumulative grade
      const existingData = studentDoc.data();
      const prevCorrect = existingData.totalCorrect || 0;
      const prevAttempted = existingData.totalAttempted || 0;
      //add quiz results to totals
      const newCorrect = prevCorrect + score;
      const newAttempted = prevAttempted + questions.length;
      const gradePercent = ((newCorrect / newAttempted) * 100).toFixed(2);

      try {
        await updateDoc(studentDocRef, {
          totalCorrect: newCorrect,
          totalAttempted: newAttempted,
          grade: `${gradePercent}%`,
          timestamp: Date.now()
        });

        const quizSubmissionsRef = doc(db, "users", teacherUid, "students", studentDoc.id, "quizSubmissions", quizId);
        await setDoc(quizSubmissionsRef, {
          submitted: true,
          submittedAt: Date.now(),
          score: score,
          total: questions.length
        });

        console.log("Score and submission status updated successfully.");
      } catch (error) {
        console.error("Error updating student document:", error);
      }

    });
  }
}
