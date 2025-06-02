class RevisionPlanner {
    constructor() {
        this.completedSessions = new Set();
        this.totalSessions = 33;
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
        this.init();
    }

    init() {
        this.loadProgress();
        this.bindEvents();
        this.updateProgress();
        this.createSubjectTracker();
        this.createKeyReminders();
    }

    bindEvents() {
        document.querySelectorAll('.session').forEach(session => {
            session.addEventListener('click', (e) => {
                this.toggleSession(session);
            });
        });
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

    createKeyReminders() {
        // Key reminders are already in HTML, no need to create them dynamically
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

    saveProgress() {
        localStorage.setItem('revisionProgress', JSON.stringify(Array.from(this.completedSessions)));
    }

    loadProgress() {
        const saved = localStorage.getItem('revisionProgress');
        if (saved) {
            this.completedSessions = new Set(JSON.parse(saved));
            
            // Apply completed state to sessions
            this.completedSessions.forEach(sessionId => {
                const [subject, session] = sessionId.split('-');
                const sessionElement = document.querySelector(`[data-subject="${subject}"][data-session="${session}"]`);
                if (sessionElement) {
                    sessionElement.classList.add('completed');
                    sessionElement.querySelector('.checkbox').classList.add('checked');
                }
            });
        }
    }

    resetProgress() {
        this.completedSessions.clear();
        localStorage.removeItem('revisionProgress');
        
        document.querySelectorAll('.session').forEach(session => {
            session.classList.remove('completed');
            session.querySelector('.checkbox').classList.remove('checked');
        });
        
        this.updateProgress();
        this.updateSubjectProgress();
    }
}

// Initialize the planner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const planner = new RevisionPlanner();
    
    // Add reset button functionality if needed
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress?')) {
                planner.resetProgress();
            }
        });
    }
});
