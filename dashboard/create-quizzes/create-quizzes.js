import { db } from '../../firebase/init.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';

let questionCount = 0;

const outputDiv = document.getElementById('question-output');
const addQuestionBtn = document.getElementById('addQuestion');
const createQuizBtn = document.getElementById('createQuiz');
const quizNameInput = document.getElementById('quizName');
const descriptionInput = document.getElementById('description');

const questionsData = [];

addQuestionBtn.addEventListener('click', () => {
  questionCount++;
  const questionWrapper = document.createElement('div');
  questionWrapper.className = 'question-wrapper';
  questionWrapper.dataset.index = questionCount;

  const questionLabel = document.createElement('label');
  questionLabel.textContent = `Question ${questionCount}:`;
  const questionInput = document.createElement('input');
  questionInput.type = 'text';
  questionInput.placeholder = 'Enter your question';
  questionInput.required = true;
  questionInput.className = 'question-input';

  const answersWrapper = document.createElement('div');
  answersWrapper.className = 'answers-wrapper';

  //default to at least 2 answer choices
  for (let i = 0; i < 2; i++) {
    addAnswerChoice(answersWrapper, questionCount);
  }

  const addChoiceBtn = document.createElement('button');
  addChoiceBtn.textContent = 'Add Answer Choice';
  addChoiceBtn.type = 'button';
  addChoiceBtn.className = 'add-button'
  addChoiceBtn.addEventListener('click', () => addAnswerChoice(answersWrapper, questionCount));

  const removeQuestionBtn = document.createElement('button');
  removeQuestionBtn.textContent = 'Remove Question';
  removeQuestionBtn.className = 'rmv-button'
  removeQuestionBtn.type = 'button';
  removeQuestionBtn.style.marginLeft = '10px';
  removeQuestionBtn.addEventListener('click', () => {
    questionCount--;
    outputDiv.removeChild(questionWrapper);
  });
  
  questionWrapper.appendChild(questionLabel);
  questionWrapper.appendChild(questionInput);
  questionWrapper.appendChild(answersWrapper);
  questionWrapper.appendChild(addChoiceBtn);
  questionWrapper.appendChild(removeQuestionBtn);
  outputDiv.appendChild(questionWrapper);
  
});

function addAnswerChoice(wrapper, questionId) {
  const choiceCount = wrapper.children.length;

  const answerWrapper = document.createElement('div');
  answerWrapper.className = 'answer-option';
  answerWrapper.style.display = 'flex';
  answerWrapper.style.alignItems = 'center';
  answerWrapper.style.marginBottom = '10px';

  const answerInput = document.createElement('input');
  answerInput.type = 'text';
  answerInput.placeholder = `Enter choice`;
  answerInput.className = 'answer-input';
  answerInput.required = true;
  answerInput.style.flex = '1';
  answerInput.style.padding = '8px';
  answerInput.style.marginRight = '12px';

  const radioWrapper = document.createElement('div');
  radioWrapper.style.display = 'flex';
  radioWrapper.style.alignItems = 'center';
  radioWrapper.style.gap = '4px';
  radioWrapper.style.marginRight = '10px';

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = `correct-${questionId}`;
  radio.className = 'correct-radio';

  const radioLabel = document.createElement('label');
  radioLabel.textContent = 'Correct';

  radioWrapper.appendChild(radio);
  radioWrapper.appendChild(radioLabel);

  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'Remove';
  removeBtn.type = 'button';
  removeBtn.className = 'rmv-button'
  removeBtn.style.marginLeft = '5px';
  removeBtn.addEventListener('click', () => {
    if (wrapper.children.length > 2) {
      wrapper.removeChild(answerWrapper);
    } else {
      alert('Each question must have at least two answer choices.');
    }
  });

  answerWrapper.appendChild(answerInput);
  answerWrapper.appendChild(radioWrapper);
  answerWrapper.appendChild(removeBtn);

  wrapper.appendChild(answerWrapper);
}



menuButton.addEventListener("click", () => {
  menuButton.classList.toggle("active");
  menuContent.classList.toggle("show");
});
//create quiz
createQuizBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const quizName = quizNameInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!quizName || !description) return alert('Please fill out quiz name and description.');

  try {
    const quizRef = await addDoc(collection(db, 'quizzes'), {
      name: quizName,
      description: description
    });

    const questionWrappers = document.querySelectorAll('.question-wrapper');

    for (let qIndex = 0; qIndex < questionWrappers.length; qIndex++) {
      const wrapper = questionWrappers[qIndex];
      const questionText = wrapper.querySelector('.question-input').value.trim();
      const answers = [];
      let correctIndex = -1;

      const answerOptions = wrapper.querySelectorAll('.answer-option');
      answerOptions.forEach((opt, i) => {
        const answerText = opt.querySelector('.answer-input').value.trim();
        const isCorrect = opt.querySelector('.correct-radio').checked;

        answers.push(answerText);
        if (isCorrect) correctIndex = i;
      });

      if (!questionText || answers.length < 2 || correctIndex === -1) {
        alert(`Please complete all fields and select a correct answer for Question ${qIndex + 1}`);
        return;
      }

      await addDoc(collection(quizRef, 'questions'), {
        text: questionText,
        answers: answers,
        correctIndex: correctIndex
      });
    }

    alert('Quiz created successfully!');
    window.location.reload(); //reset
  } catch (err) {
    console.error('Error creating quiz:', err);
    alert('Error creating quiz.');
  }

});

