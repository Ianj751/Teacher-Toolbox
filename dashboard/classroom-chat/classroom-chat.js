import {
  collection,
  getDoc,
  addDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { auth, db } from "../../firebase/init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

let isTeacher = false;
let user = null;

// Check if the user is a student
const studentFirstName = sessionStorage.getItem("studentFirstName");
const studentLastName = sessionStorage.getItem("studentLastName");
const studentId = sessionStorage.getItem("firebaseID");
const teacherUid = sessionStorage.getItem("teacherUid");


const outputDiv = document.getElementById('studentOrTeacher');


if (studentFirstName && studentLastName && studentId && teacherUid) {
  // User is a student
  console.log("Student signed in:", studentFirstName, studentLastName);
  user = teacherUid;
  isTeacher = false;
  outputDiv.innerHTML = `<a href="../student-dashboard.html">Home</a>`
  listenForPosts();
} else {
  // Check if the user is a teacher
  onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      console.log("Teacher signed in:", currentUser);
      user = currentUser.uid;
      isTeacher = true;
        outputDiv.innerHTML = `<a href="../dashboard.html">Home</a>`
      console.log(isTeacher)
      listenForPosts();
    } else {
      console.error("No valid user found. Please sign in.");
      alert("Please sign in to use the chat.");
    }
  });
}
console.log(isTeacher+ " isTeacher")
//check if the user is a student or teacher, then create the appropriate link in the hamburger menu


var menuButton = document.getElementById("menuButton");
var menuContent = document.getElementById("menuContent");

menuButton.addEventListener("click", () => {
  menuButton.classList.toggle("active");
  menuContent.classList.toggle("show");
});

/**
 * Real-time listener for posts
 */
function listenForPosts() {
  if (!user) {
    console.error("No valid user found to listen for posts.");
    return;
  }

  const postsRef = collection(db, "users", user, "chat-messages");
  const postsQuery = query(postsRef, orderBy("createdAt", "asc"));

  console.log("Listening for posts at path:", postsRef.path);

  onSnapshot(postsQuery, (snapshot) => {
    console.log("Posts updated in real-time");
    renderPosts(snapshot);
  });
}

/**
 * Function to render posts in the DOM
 */
async function renderPosts(snapshot) {
  const posts = document.getElementById("posts");
  posts.innerHTML = ""; // Clear existing posts

  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(doc.data().isTeacher);

    const name = await getUserName(data.authorId);

    const time = `${data.createdAt
      .toDate()
      .toLocaleDateString()} ${data.createdAt
      .toDate()
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    const item = document.createElement("my-post");
    item.innerHTML = `
      <span slot="content">${data.content}</span>
      <span slot="author">${name}</span>
      <span slot="time">${time}</span>
    `;

    posts.appendChild(item);
  }

  // Scroll to the last message
  const lastMessageElement = posts.lastChild;
  if (lastMessageElement) {
    requestAnimationFrame(() => {
      lastMessageElement.scrollIntoView({ behavior: "smooth" });
    });
  }
}

/**
 * Fetch the display name of a user
 */
async function getUserName(userRef) {
  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      console.error(`Document at path ${userRef.path} does not exist`);
      return "Unknown Author";
    }

    if (!(typeof docSnap.data().iD === "undefined")) {
      const firstName = docSnap.data().firstName;
      const lastName = docSnap.data().lastName;

      return `${firstName} ${lastName}`;
    }

    return docSnap.data().displayName || "Unknown";
  } catch (error) {
    console.error("Error fetching user data:", error);
    return "Unknown Author";
  }
}

// Handle form submission
let form = document.getElementById("msg-form");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = document.getElementById("form-msg").value.trim();
  if (!content) {
    alert("Please enter a message");
    return;
  }
  document.getElementById("form-msg").value = "";

  let authorId;
  if (isTeacher) {
    authorId = doc(db, "users", user);
  } else {
    authorId = doc(db, "users", user, "students", studentId);
  }

  try {
    const msgsRef = collection(db, "users", user, "chat-messages");

    let docData = {
      content: content,
      createdAt: Timestamp.now(),
      authorId: authorId,
      isTeacher: isTeacher,
    };

    const docRef = await addDoc(msgsRef, docData);
    console.log("Message sent: ", docRef);
  } catch (error) {
    console.error("Error creating post:", error);
    alert("Error creating post: " + error.message);
  }
});
