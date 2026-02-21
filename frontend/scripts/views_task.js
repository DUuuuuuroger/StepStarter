// Task View - Placeholder for Step 2
// Will be fully implemented in later steps

class TaskView {
    constructor() {
        this.taskTitle = document.getElementById('task-title');
        this.taskProgress = document.getElementById('task-progress');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerStart = document.getElementById('timer-start');
        this.timerPause = document.getElementById('timer-pause');
        this.timerStop = document.getElementById('timer-stop');
        this.taskStepsList = document.getElementById('task-steps-list');
        this.refineStepBtn = document.getElementById('refine-step-btn');
        this.backHomeBtn = document.getElementById('back-home-btn');
        
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.isTimerRunning = false;
        
        this.init();
    }
    
    init() {
        console.log('TaskView initialized');
        
        // Timer controls
        this.timerStart.addEventListener('click', () => this.startTimer());
        this.timerPause.addEventListener('click', () => this.pauseTimer());
        this.timerStop.addEventListener('click', () => this.stopTimer());
        
        // Action buttons
        this.refineStepBtn.addEventListener('click', () => this.handleRefineStep());
        this.backHomeBtn.addEventListener('click', () => this.handleBackHome());
    }
    
    startTimer() {
        console.log('Timer started - placeholder');
        if (!this.isTimerRunning) {
            this.isTimerRunning = true;
            this.timerStart.classList.add('hidden');
            this.timerPause.classList.remove('hidden');
            this.timerStop.classList.remove('hidden');
            
            // Start timer interval
            this.timerInterval = setInterval(() => {
                this.timerSeconds++;
                this.updateTimerDisplay();
            }, 1000);
        }
    }
    
    pauseTimer() {
        console.log('Timer paused - placeholder');
        if (this.isTimerRunning) {
            this.isTimerRunning = false;
            clearInterval(this.timerInterval);
            
            this.timerStart.classList.remove('hidden');
            this.timerPause.classList.add('hidden');
            this.timerStart.textContent = '继续';
        }
    }
    
    stopTimer() {
        console.log('Timer stopped - placeholder');
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        
        this.timerSeconds = 0;
        this.updateTimerDisplay();
        
        this.timerStart.classList.remove('hidden');
        this.timerPause.classList.add('hidden');
        this.timerStop.classList.add('hidden');
        this.timerStart.textContent = '开始';
    }
    
    updateTimerDisplay() {
        const hours = Math.floor(this.timerSeconds / 3600);
        const minutes = Math.floor((this.timerSeconds % 3600) / 60);
        const seconds = this.timerSeconds % 60;
        
        this.timerDisplay.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    handleRefineStep() {
        console.log('Refine step clicked - placeholder');
        alert('再拆小一点功能将在后续步骤实现');
    }
    
    handleBackHome() {
        console.log('Back to home clicked - placeholder');
        // Will switch to home view in later steps
    }
    
    loadTask(taskData) {
        console.log('Load task - placeholder:', taskData);
        // Will load task data in later steps
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.taskView = new TaskView();
    console.log('Task view loaded');
});
