class RevisionPlanner {
   constructor() {
       this.completedSessions = new Set();
       this.totalSessions = 33;
       this.customSessionNames = {};
       this.customReminders = [];
       this.userId = 'revision-user'; // Simple user ID
       this.subjectTotals = {
           english: 4,
           chemistry: 3,
           physics: 3,
           geography: 2,
           latin: 2,
           german: 3,
           french: 4,
           greek: 3,
           maths: 3,
           history: 2,
           biology: 2,
           philosophy: 2
       };
       this.defaultReminders = [
           { text: "Thursday 05/06: French Listening + Writing Exam", type: "exam" },
           { text: "French Strategy: 2 sessions before exam, 2 after", type: "strategy" },
           { text: "Tuesday Power Day: 5 sessions total", type: "" },
           { text: "Final Day Focus: Latin → Greek → English → Geography", type: "" }
       ];
       this.init();
   }


   async init() {
       await this.loadProgress();
       await this.loadCustomNames();
       await this.loadCustomReminders();
       this.bindEvents();
       this.updateProgress();
       this.createSubjectTracker();
       this.createKeyReminders();
       this.initDragAndDrop();
       this.initNameEditing();
       this.initReminderEditing();
       this.initTimeDisplay();
   }


   initTimeDisplay() {
       this.updateTime();
       setInterval(() => {
           this.updateTime();
       }, 1000);
   }


   updateTime() {
       const now = new Date();
      
       const timeOptions = {
           hour12: true,
           hour: 'numeric',
           minute: '2-digit',
           second: '2-digit'
       };
       const timeString = now.toLocaleTimeString('en-US', timeOptions);
      
       const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
       const dayName = days[now.getDay()];
       const day = now.getDate();
       const month = months[now.getMonth()];
       const year = now.getFullYear().toString().slice(-2);
      
       const dateString = `${dayName} | ${day} ${month} '${year}`;
      
       const currentDayProgress = this.getCurrentDayProgress();
      
       const timeElement = document.getElementById('currentTime');
       const dateElement = document.getElementById('currentDate');
       const progressBar = document.querySelector('.time-progress-bar');
      
       if (timeElement) timeElement.textContent = timeString;
       if (dateElement) dateElement.textContent = dateString;
       if (progressBar) {
           const progressFill = document.getElementById('timeProgressFill');
           if (progressFill) {
               progressFill.style.width = `${currentDayProgress}%`;
           }
       }
   }


   getCurrentDayProgress() {
       const dayCardIndex = this.getDayCardIndexForToday();
      
       if (dayCardIndex === -1) return 0;
      
       const dayCards = document.querySelectorAll('.day-card');
       const currentDayCard = dayCards[dayCardIndex];
      
       if (!currentDayCard) return 0;
      
       const allSessions = currentDayCard.querySelectorAll('.session');
       const completedSessions = currentDayCard.querySelectorAll('.session.completed');
      
       if (allSessions.length === 0) return 0;
      
       return Math.round((completedSessions.length / allSessions.length) * 100);
   }


   getDayCardIndexForToday() {
       const today = new Date();
       const currentDate = today.getDate();
       const currentMonth = today.getMonth() + 1;
      
       const scheduleMap = {
           '2-6': 0,   // Monday 02/06
           '3-6': 1,   // Tuesday 03/06 
           '4-6': 2,   // Wednesday 04/06
           '5-6': 3,   // Thursday 05/06
           '6-6': 4,   // Friday 06/06
           '7-6': 5,   // Saturday 07/06
           '8-6': 6,   // Sunday 08/06
           '9-6': 7    // Monday 09/06
       };
      
       const dateKey = `${currentDate}-${currentMonth}`;
       return scheduleMap[dateKey] !== undefined ? scheduleMap[dateKey] : -1;
   }


   bindEvents() {
       document.querySelectorAll('.session').forEach(session => {
           session.addEventListener('click', (e) => {
               if (!session.classList.contains('dragging') && !e.target.classList.contains('editing')) {
                   this.toggleSession(session);
               }
           });
       });
   }


   initNameEditing() {
       document.querySelectorAll('.subject-name').forEach(nameElement => {
           nameElement.addEventListener('dblclick', (e) => {
               e.stopPropagation();
               this.editSessionName(nameElement);
           });
       });
   }


   initReminderEditing() {
       document.querySelectorAll('.reminder-item').forEach(reminder => {
           reminder.addEventListener('dblclick', (e) => {
               e.stopPropagation();
               this.editReminder(reminder);
           });
       });


       this.addNewReminderButton();
   }


   addNewReminderButton() {
       const reminderList = document.querySelector('.reminder-list');
      
       if (reminderList.querySelector('.add-new-reminder')) {
           return;
       }
      
       const addButton = document.createElement('div');
       addButton.className = 'reminder-item add-new-reminder';
       addButton.innerHTML = '+ Add New Reminder';
       addButton.style.cssText = `
           cursor: pointer;
           border-left-color: #64748b;
           background: rgba(100, 116, 139, 0.1);
           text-align: center;
           font-style: italic;
           opacity: 0.7;
       `;
      
       addButton.addEventListener('click', () => {
           this.addNewReminder();
       });
      
       reminderList.appendChild(addButton);
   }


   editReminder(reminderElement) {
       if (reminderElement.classList.contains('add-new-reminder')) return;
      
       const currentText = reminderElement.textContent;
       const reminderIndex = Array.from(reminderElement.parentNode.children).indexOf(reminderElement);
      
       const input = document.createElement('input');
       input.type = 'text';
       input.value = currentText;
       input.className = 'editing';
       input.style.cssText = `
           background: rgba(255, 255, 255, 0.9);
           border: 1px solid #10b981;
           border-radius: 4px;
           padding: 0.4rem;
           font-size: 0.9rem;
           color: #1f2937;
           width: 100%;
           outline: none;
       `;
      
       reminderElement.style.display = 'none';
       reminderElement.parentNode.insertBefore(input, reminderElement.nextSibling);
       input.focus();
       input.select();
      
       const finishEditing = () => {
           const newText = input.value.trim();
           if (newText && newText !== currentText) {
               reminderElement.innerHTML = newText;
               this.updateCustomReminder(reminderIndex, newText);
           }
           input.remove();
           reminderElement.style.display = 'block';
       };
      
       input.addEventListener('blur', finishEditing);
       input.addEventListener('keydown', (e) => {
           if (e.key === 'Enter') {
               finishEditing();
           } else if (e.key === 'Escape') {
               input.remove();
               reminderElement.style.display = 'block';
           }
       });
   }


   addNewReminder() {
       const reminderList = document.querySelector('.reminder-list');
       const addButton = reminderList.querySelector('.add-new-reminder');
      
       const newReminder = document.createElement('div');
       newReminder.className = 'reminder-item';
       newReminder.innerHTML = 'New reminder - double click to edit';
       newReminder.style.cssText = `
           border-left-color: #64748b;
           background: rgba(255, 255, 255, 0.03);
       `;
      
       reminderList.insertBefore(newReminder, addButton);
      
       newReminder.addEventListener('dblclick', (e) => {
           e.stopPropagation();
           this.editReminder(newReminder);
       });
      
       this.customReminders.push({ text: 'New reminder - double click to edit', type: '' });
       this.saveCustomReminders();
      
       setTimeout(() => {
           this.editReminder(newReminder);
       }, 100);
   }


   updateCustomReminder(index, newText) {
       if (index < this.defaultReminders.length) {
           if (!this.customReminders[index]) {
               this.customReminders[index] = { ...this.defaultReminders[index] };
           }
           this.customReminders[index].text = newText;
       } else {
           const customIndex = index - this.defaultReminders.length;
           if (this.customReminders[customIndex]) {
               this.customReminders[customIndex].text = newText;
           }
       }
       this.saveCustomReminders();
   }


   createKeyReminders() {
       const reminderList = document.querySelector('.reminder-list');
       reminderList.innerHTML = '';
      
       this.defaultReminders.forEach((reminder, index) => {
           const customReminder = this.customReminders[index];
           const reminderText = customReminder ? customReminder.text : reminder.text;
           const reminderType = customReminder ? customReminder.type : reminder.type;
          
           const reminderElement = document.createElement('div');
           reminderElement.className = `reminder-item ${reminderType}`;
           reminderElement.innerHTML = reminderText;
           reminderList.appendChild(reminderElement);
       });
      
       this.customReminders.slice(this.defaultReminders.length).forEach(reminder => {
           const reminderElement = document.createElement('div');
           reminderElement.className = `reminder-item ${reminder.type}`;
           reminderElement.innerHTML = reminder.text;
           reminderList.appendChild(reminderElement);
       });
   }


   editSessionName(nameElement) {
       const session = nameElement.closest('.session');
       const sessionId = this.getSessionId(session);
       const currentName = nameElement.textContent;
      
       const input = document.createElement('input');
       input.type = 'text';
       input.value = currentName;
       input.className = 'editing';
       input.style.cssText = `
           background: rgba(255, 255, 255, 0.9);
           border: 1px solid #10b981;
           border-radius: 4px;
           padding: 0.2rem 0.4rem;
           font-size: 1rem;
           font-weight: 500;
           color: #1f2937;
           width: 100%;
           outline: none;
       `;
      
       nameElement.style.display = 'none';
       nameElement.parentNode.insertBefore(input, nameElement.nextSibling);
       input.focus();
       input.select();
      
       const finishEditing = () => {
           const newName = input.value.trim();
           if (newName && newName !== currentName) {
               this.customSessionNames[sessionId] = newName;
               nameElement.textContent = newName;
               this.saveCustomNames();
           }
           input.remove();
           nameElement.style.display = 'block';
       };
      
       input.addEventListener('blur', finishEditing);
       input.addEventListener('keydown', (e) => {
           if (e.key === 'Enter') {
               finishEditing();
           } else if (e.key === 'Escape') {
               input.remove();
               nameElement.style.display = 'block';
           }
       });
   }


   initDragAndDrop() {
       document.querySelectorAll('.session').forEach(session => {
           session.draggable = true;
          
           session.addEventListener('dragstart', (e) => {
               session.classList.add('dragging');
               e.dataTransfer.effectAllowed = 'move';
               e.dataTransfer.setData('text/html', session.outerHTML);
               e.dataTransfer.setData('text/plain', session.dataset.subject + '-' + session.dataset.session);
           });


           session.addEventListener('dragend', (e) => {
               session.classList.remove('dragging');
           });
       });


       document.querySelectorAll('.sessions').forEach(container => {
           container.addEventListener('dragover', (e) => {
               e.preventDefault();
               e.dataTransfer.dropEffect = 'move';
              
               const draggingElement = document.querySelector('.dragging');
               const afterElement = this.getDragAfterElement(container, e.clientY);
              
               if (afterElement == null) {
                   container.appendChild(draggingElement);
               } else {
                   container.insertBefore(draggingElement, afterElement);
               }
           });


           container.addEventListener('drop', (e) => {
               e.preventDefault();
               this.updateSessionNumbers();
               this.saveSessionOrder();
               this.initNameEditing();
           });
       });
   }


   updateSessionNumbers() {
       document.querySelectorAll('.day-card').forEach(dayCard => {
           const sessions = dayCard.querySelectorAll('.session');
           sessions.forEach((session, index) => {
               const sessionNumber = session.querySelector('.session-number');
               sessionNumber.textContent = index + 1;
           });
       });
   }


   getDragAfterElement(container, y) {
       const draggableElements = [...container.querySelectorAll('.session:not(.dragging)')];
      
       return draggableElements.reduce((closest, child) => {
           const box = child.getBoundingClientRect();
           const offset = y - box.top - box.height / 2;
          
           if (offset < 0 && offset > closest.offset) {
               return { offset: offset, element: child };
           } else {
               return closest;
           }
       }, { offset: Number.NEGATIVE_INFINITY }).element;
   }


   loadSessionOrderFromData(sessionOrder) {
       Object.keys(sessionOrder).forEach(dayKey => {
           const dayIndex = parseInt(dayKey.split('-')[1]);
                       const dayCard = document.querySelectorAll('.day-card')[dayIndex];
           const sessionsContainer = dayCard.querySelector('.sessions');
           const sessions = [...sessionsContainer.querySelectorAll('.session')];
          
           const orderedSessions = sessionOrder[dayKey].sort((a, b) => a.order - b.order)
               .map(orderItem => {
                   return sessions.find(session =>
                       session.dataset.subject === orderItem.subject &&
                       session.dataset.session === orderItem.session
                   );
               })
               .filter(session => session !== undefined);
          
           orderedSessions.forEach(session => {
               sessionsContainer.appendChild(session);
           });
       });
      
       this.updateSessionNumbers();
   }


   toggleSession(sessionElement) {
       const sessionId = this.getSessionId(sessionElement);
       const checkbox = sessionElement.querySelector('.checkbox');
      
       if (this.completedSessions.has(sessionId)) {
           this.completedSessions.delete(sessionId);
           sessionElement.classList.remove('completed');
           checkbox.classList.remove('checked');
       } else {
           this.completedSessions.add(sessionId);
           sessionElement.classList.add('completed');
           checkbox.classList.add('checked');
       }
      
       this.saveProgress();
       this.updateProgress();
       this.updateSubjectProgress();
   }


   getSessionId(sessionElement) {
       const subject = sessionElement.dataset.subject;
       const session = sessionElement.dataset.session;
       return `${subject}-${session}`;
   }


   updateProgress() {
       const completed = this.completedSessions.size;
       const percentage = Math.round((completed / this.totalSessions) * 100);
      
       const completionBar = document.getElementById('completionBar');
       const completionText = document.getElementById('completionText');
      
       completionBar.style.width = `${percentage}%`;
       completionText.textContent = `${percentage}% Complete (${completed}/${this.totalSessions})`;
   }


   createSubjectTracker() {
       const subjectList = document.getElementById('subjectList');
       const trackerHTML = Object.entries(this.subjectTotals).map(([subject, total]) => `
           <div class="subject-item ${subject}">
               <span class="subject-name">${this.formatSubjectName(subject)}</span>
               <div class="subject-progress">
                   <div class="progress-bar">
                       <div class="progress-fill" data-subject="${subject}"></div>
                   </div>
                   <span class="progress-text" data-subject-text="${subject}">0/${total}</span>
               </div>
           </div>
       `).join('');
      
       subjectList.innerHTML = trackerHTML;
       this.updateSubjectProgress();
   }


   updateSubjectProgress() {
       Object.keys(this.subjectTotals).forEach(subject => {
           const completed = Array.from(this.completedSessions).filter(sessionId =>
               sessionId.startsWith(subject + '-')).length;


           const total = this.subjectTotals[subject];
           const percentage = (completed / total) * 100;
          
           const progressFill = document.querySelector(`[data-subject="${subject}"]`);
           const progressText = document.querySelector(`[data-subject-text="${subject}"]`);
          
           if (progressFill) {
               progressFill.style.width = `${percentage}%`;
           }
           if (progressText) {
               progressText.textContent = `${completed}/${total}`;
           }
       });
   }


   formatSubjectName(subject) {
       const names = {
           english: 'English',
           chemistry: 'Chemistry',
           physics: 'Physics',
           geography: 'Geography',
           latin: 'Latin',
           german: 'German',
           french: 'French',
           greek: 'Greek',
           maths: 'Maths',
           history: 'History',
           biology: 'Biology',
           philosophy: 'Philosophy & Theology'
       };
       return names[subject] || subject;
   }


   // LocalStorage save methods
   saveProgress() {
       try {
           localStorage.setItem('revisionProgress', JSON.stringify(Array.from(this.completedSessions)));
       } catch (error) {
           console.error('Error saving progress:', error);
       }
   }


   saveCustomNames() {
       try {
           localStorage.setItem('customSessionNames', JSON.stringify(this.customSessionNames));
       } catch (error) {
           console.error('Error saving custom names:', error);
       }
   }


   saveCustomReminders() {
       try {
           localStorage.setItem('customReminders', JSON.stringify(this.customReminders));
       } catch (error) {
           console.error('Error saving custom reminders:', error);
       }
   }


   saveSessionOrder() {
       const sessionOrder = {};
      
       document.querySelectorAll('.day-card').forEach((dayCard, dayIndex) => {
           const sessions = dayCard.querySelectorAll('.session');
           const dayOrder = [];
          
           sessions.forEach((session, sessionIndex) => {
               dayOrder.push({
                   subject: session.dataset.subject,
                   session: session.dataset.session,
                   order: sessionIndex
               });
           });
          
           sessionOrder[`day-${dayIndex}`] = dayOrder;
       });
      
       try {
           localStorage.setItem('sessionOrder', JSON.stringify(sessionOrder));
       } catch (error) {
           console.error('Error saving session order:', error);
       }
   }


   // LocalStorage load methods
   async loadProgress() {
       try {
           const saved = localStorage.getItem('revisionProgress');
           if (saved) {
               this.completedSessions = new Set(JSON.parse(saved));
              
               this.completedSessions.forEach(sessionId => {
                   const [subject, session] = sessionId.split('-');
                   const sessionElement = document.querySelector(`[data-subject="${subject}"][data-session="${session}"]`);
                   if (sessionElement) {
                       sessionElement.classList.add('completed');
                       sessionElement.querySelector('.checkbox').classList.add('checked');
                   }
               });
           }
          
           const savedOrder = localStorage.getItem('sessionOrder');
           if (savedOrder) {
               this.loadSessionOrderFromData(JSON.parse(savedOrder));
           }
       } catch (error) {
           console.error('Error loading progress:', error);
       }
   }


   async loadCustomNames() {
       try {
           const saved = localStorage.getItem('customSessionNames');
           if (saved) {
               this.customSessionNames = JSON.parse(saved);
              
               Object.keys(this.customSessionNames).forEach(sessionId => {
                   const [subject, session] = sessionId.split('-');
                   const sessionElement = document.querySelector(`[data-subject="${subject}"][data-session="${session}"]`);
                   if (sessionElement) {
                       const nameElement = sessionElement.querySelector('.subject-name');
                       if (nameElement) {
                           nameElement.textContent = this.customSessionNames[sessionId];
                       }
                   }
               });
           }
       } catch (error) {
           console.error('Error loading custom names:', error);
       }
   }


   async loadCustomReminders() {
       try {
           const saved = localStorage.getItem('customReminders');
           if (saved) {
               this.customReminders = JSON.parse(saved);
           }
       } catch (error) {
           console.error('Error loading custom reminders:', error);
       }
   }


   resetProgress() {
       this.completedSessions.clear();
       this.customSessionNames = {};
       this.customReminders = [];
      
       localStorage.removeItem('revisionProgress');
       localStorage.removeItem('sessionOrder');
       localStorage.removeItem('customSessionNames');
       localStorage.removeItem('customReminders');
      
       document.querySelectorAll('.session').forEach(session => {
           session.classList.remove('completed');
           session.querySelector('.checkbox').classList.remove('checked');
       });
      
       this.updateProgress();
       this.updateSubjectProgress();
      
       location.reload();
   }
}


document.addEventListener('DOMContentLoaded', () => {
   const planner = new RevisionPlanner();
  
   const resetButton = document.getElementById('resetButton');
   if (resetButton) {
       resetButton.addEventListener('click', () => {
           if (confirm('Are you sure you want to reset all progress?')) {
               planner.resetProgress();
           }
       });
   }
});
// ... all your existing RevisionPlanner code stays here ...

// ADD THIS NEW CODE AT THE VERY END:
// Background toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    // SVG icons
    const imageIcon = `
        <svg class="toggle-icon" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
    `;
    
    const gradientIcon = `
        <svg class="toggle-icon" viewBox="0 0 24 24">
            <path d="M11 9h2v2h-2zm-2 2h2v2H9zm4 0h2v2h-2zm2-2h2v2h-2zM7 9h2v2H7zm12-6H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 18H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm2-7h-2v2h2v2h-2v-2h-2v2h-2v-2h-2v2H9v-2H7v2H5v-2h2v-2H5V9h2V7H5V5h2v2h2V5h2v2h2V5h2v2h2V5h2v2h-2v2h2v2z"/>
        </svg>
    `;
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'background-toggle';
    toggleButton.innerHTML = imageIcon + 'Switch to Image';
    document.body.appendChild(toggleButton);
    
    // Set initial state
    let isImageMode = false;
    document.body.classList.add('gradient-mode');
    
    // Toggle function
    toggleButton.addEventListener('click', function() {
        if (isImageMode) {
            // Switch to gradient
            document.body.classList.remove('image-mode');
            document.body.classList.add('gradient-mode');
            toggleButton.innerHTML = imageIcon + 'Switch to Image';
            isImageMode = false;
        } else {
            // Switch to image
            document.body.classList.remove('gradient-mode');
            document.body.classList.add('image-mode');
            toggleButton.innerHTML = gradientIcon + 'Switch to Gradient';
            isImageMode = true;
        }
        
        // Save preference
        localStorage.setItem('backgroundMode', isImageMode ? 'image' : 'gradient');
    });
    
    // Load saved preference
    const savedMode = localStorage.getItem('backgroundMode');
    if (savedMode === 'image') {
        toggleButton.click();
    }
});




