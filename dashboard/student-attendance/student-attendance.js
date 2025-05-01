import { db } from '../../firebase/init.js';
import { doc, getDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';

// DOM Elements
const studentNameElement = document.getElementById('student-name');
const studentIdElement = document.getElementById('student-id');
const todayAttendanceElement = document.getElementById('today-attendance');
const overallAttendanceElement = document.getElementById('overall-attendance');
const calendarDaysElement = document.getElementById('calendar-days');
const currentMonthElement = document.getElementById('currentMonth');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const logoutBtn = document.getElementById('log-out-btn');

// Current date tracking
let currentDate = new Date();
let attendanceData = {};

// Initialize calendar
function initializeCalendar() {
    document.getElementById('todaysDate').textContent = '(' + (currentDate.toLocaleDateString ('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ') ');;
    updateCalendarHeader();
    renderCalendar();
    
    // Add event listeners for month navigation
    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendarHeader();
        renderCalendar();
    });
    
    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendarHeader();
        renderCalendar();
    });
}

// Update calendar header
function updateCalendarHeader() {
    const options = { month: 'long', year: 'numeric' };
    currentMonthElement.textContent = currentDate.toLocaleDateString('en-US', options);
}

// Render calendar
function renderCalendar() {
    calendarDaysElement.innerHTML = '';
    
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDay = firstDay.getDay(); // 0 = Sunday
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        calendarDaysElement.appendChild(dayElement);
    }
    
    // Add days of the current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day current-month';
        dayElement.textContent = day;
        
        // Check attendance for this day
        const dateString = formatDateForFirebase(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        if (attendanceData[dateString]) {
            dayElement.classList.add(attendanceData[dateString].status);
        }
        
        calendarDaysElement.appendChild(dayElement);
    }
}

// Format date for Firebase (YYYY-MM-DD)
function formatDateForFirebase(date) {
    return date.toISOString().split('T')[0];
}

// Check if student is logged in and load data
document.addEventListener('DOMContentLoaded', async () => {
    const studentFirstName = sessionStorage.getItem('studentFirstName');
    const studentLastName = sessionStorage.getItem('studentLastName');
    const studentId = sessionStorage.getItem('studentId');
    const teacherUid = sessionStorage.getItem('teacherUid');
    const firebaseID = sessionStorage.getItem('firebaseID');

    console.log('Session Storage:', {
        studentFirstName,
        studentLastName,
        studentId,
        teacherUid,
        firebaseID
    });

    if (!studentFirstName || !studentLastName || !teacherUid) {
        console.error('Missing session data, redirecting to login');
        window.location.href = '../../loginPage/login.html';
        return;
    }

    try {
        // Get all student documents to find the matching one
        const studentsRef = collection(db, `users/${teacherUid}/students`);
        const querySnapshot = await getDocs(studentsRef);
        
 
        if (!firebaseID) {
            console.error('Student document not found in Firebase');
            studentNameElement.textContent = 'Student not found';
            return;
        }

        // Set student information
        studentNameElement.textContent = `${studentFirstName} ${studentLastName}`;
        studentIdElement.textContent = `ID: ${studentId}`;
        
        // Load attendance data using the found Firebase ID
        await loadStudentAttendance(teacherUid, firebaseID);
        
        // Initialize calendar after loading data
        initializeCalendar();
        
    } catch (error) {
        console.error('Error finding student document:', error);
        studentNameElement.textContent = 'Error loading data';
    }
});

// Load student attendance data
async function loadStudentAttendance(teacherUid, firebaseID) {
    try {
        console.log('Loading attendance for:', { teacherUid, firebaseID });
        
        const studentRef = doc(db, `users/${teacherUid}/students`, firebaseID);
        const studentDoc = await getDoc(studentRef);
        
        if (studentDoc.exists()) {
            const data = studentDoc.data();
            console.log('Student data:', data);
            
            attendanceData = data.attendance || {};
            const today = formatDateForFirebase(new Date());
            
            // Calculate overall attendance
            const totalDays = Object.keys(attendanceData).length;
            const presentDays = Object.values(attendanceData).filter(record => record.status === 'present').length;
            const overallPercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
            console.log(overallPercentage + '% attendance');
            sessionStorage.setItem("attendencePer", overallPercentage);
            // Update overall attendance
            overallAttendanceElement.textContent = `${overallPercentage}%`;
            
            // Update today's attendance
            const todayRecord = attendanceData[today];
            if (todayRecord) {
                todayAttendanceElement.textContent = todayRecord.status === 'present' ? 'Present' : 'Absent';
                todayAttendanceElement.style.color = todayRecord.status === 'present' ? 'green' : 'red';
            } else {
                todayAttendanceElement.textContent = 'Not recorded';
                todayAttendanceElement.style.color = 'gray';
            }
        } else {
            console.error('Student document not found');
            studentNameElement.textContent = 'Student not found';
            studentIdElement.textContent = 'Please contact your teacher';
            todayAttendanceElement.textContent = 'N/A';
            overallAttendanceElement.textContent = 'N/A';
        }
    } catch (error) {
        console.error('Error loading attendance data:', error);
        studentNameElement.textContent = 'Error loading data';
        studentIdElement.textContent = 'Please try again later';
        todayAttendanceElement.textContent = 'Error';
        overallAttendanceElement.textContent = 'Error';
    }
}

// Logout functionality
logoutBtn.addEventListener('click', () => {
    // Clear session storage
    sessionStorage.removeItem('studentFirstName');
    sessionStorage.removeItem('studentLastName');
    sessionStorage.removeItem('teacherUid');
    sessionStorage.removeItem('firebaseID');
    
    // Redirect to login page
    window.location.href = '../../loginPage/login.html';
});

// Hamburger menu functionality
const menuButton = document.getElementById('menuButton');
const menuContent = document.getElementById('menuContent');

menuButton.addEventListener('click', () => {
    menuButton.classList.toggle('active');
    menuContent.classList.toggle('show');
});
