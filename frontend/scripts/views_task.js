class TaskView {
    constructor() {
        this.taskTitle = document.getElementById('task-title');
        this.taskProgress = document.getElementById('task-progress');
        this.taskStepsList = document.getElementById('task-steps-list');
        this.selectBtn = document.getElementById('task-select-btn');
        this.selectView = document.getElementById('task-select-view');
        this.selectList = document.getElementById('task-select-list');
        this.selectCancel = document.getElementById('task-select-cancel');
        this.supplementBox = document.getElementById('task-supplement-box');
        this.supplementInput = document.getElementById('task-supplement-input');
        this.supplementBtn = document.getElementById('task-supplement-btn');
        this.timerCard = document.querySelector('.timer-card');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerStart = document.getElementById('timer-start');
        this.timerPause = document.getElementById('timer-pause');
        this.timerStop = document.getElementById('timer-stop');
        this.timerStatus = document.getElementById('timer-status');

        this.currentTaskId = null;
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.isTimerRunning = false;
        this.renderToken = 0;
        this.loadingTimer = null;
        this.loadingTarget = null;
        this.stepLoadingTimer = null;
        this.baseInput = '';
        this.lastSavedTaskId = null;

        this.init();
    }

    init() {
        this.timerStart.addEventListener('click', () => this.startTimer());
        this.timerPause.addEventListener('click', () => this.pauseTimer());
        this.timerStop.addEventListener('click', () => this.stopTimer());
        this.selectBtn.addEventListener('click', () => this.openTaskSelect());
        this.selectCancel.addEventListener('click', () => this.showTaskView());
        this.supplementBtn.addEventListener('click', () => this.handleSupplement());

        this.syncTimerStatus();
    }

    async generateFromInput(input) {
        this.baseInput = input;
        this.setTaskSelectEnabled(false);
        this.setLoading(true);
        this.hideSupplementBox();
        this.hideTimerCard();
        this.renderStepsLoading();
        const currentToken = ++this.renderToken;

        try {
            const data = await window.API.generateSteps(input);
            if (currentToken !== this.renderToken) {
                return;
            }
            await this.renderStepsTyping(data.title, data.steps, currentToken);
            this.lastSavedTaskId = await this.saveTask(input, data);
            this.showSupplementBox();
            this.showTimerCard();
            await this.loadLatestTask();
        } catch (error) {
            console.error(error);
            this.stopStepLoadingDots();
            this.renderSteps([]);
            const message = error && error.message ? error.message : '请检查后端是否启动';
            alert(`生成失败：${message}`);
        } finally {
            if (currentToken === this.renderToken) {
                this.setLoading(false);
            }
            this.setTaskSelectEnabled(true);
        }
    }

    async loadLatestTask() {
        try {
            const result = await window.API.listTasks(1);
            const latest = (result.items || [])[0];
            if (!latest) {
                this.renderEmptyTask();
                return;
            }
            this.currentTaskId = latest.id;
            this.taskTitle.textContent = latest.title || '未命名任务';
            this.taskProgress.textContent = `进度：${Number(latest.progress || 0)}%`;
            await this.loadTaskSteps(latest.id);
        } catch (error) {
            console.error(error);
            this.renderEmptyTask();
        }
    }

    async loadTaskById(taskId) {
        try {
            const taskInfo = await window.API.getTask(taskId);
            this.currentTaskId = taskInfo.id;
            this.taskTitle.textContent = taskInfo.title || '未命名任务';
            this.taskProgress.textContent = `进度：${Number(taskInfo.progress || 0)}%`;
            await this.loadTaskSteps(taskId);
        } catch (error) {
            console.error(error);
        }
    }

    async openTaskSelect() {
        try {
            const result = await window.API.listTasks(50);
            this.renderTaskSelectList(result.items || []);
        } catch (error) {
            console.error(error);
            this.renderTaskSelectList([]);
        }
        this.showTaskSelectView();
    }

    async loadTaskSteps(taskId) {
        try {
            const result = await window.API.getTaskSteps(taskId);
            const steps = result.items || [];
            this.renderSteps(steps);
            if (steps.length) {
                this.showTimerCard();
                this.showSupplementBox();
            } else {
                this.hideTimerCard();
                this.hideSupplementBox();
            }
        } catch (error) {
            console.error(error);
            this.renderSteps([]);
            this.hideTimerCard();
            this.hideSupplementBox();
        }
    }

    renderEmptyTask() {
        this.currentTaskId = null;
        this.taskTitle.textContent = '------';
        this.taskProgress.textContent = '进度：------';
        this.renderSteps([]);
    }

    renderStepsLoading() {
        this.taskStepsList.innerHTML = '';
        const item = document.createElement('li');
        item.className = 'step-item placeholder';
        item.textContent = '生成中';
        this.taskStepsList.appendChild(item);
        this.startStepLoadingDots(item);
    }

    renderSteps(steps) {
        this.taskStepsList.innerHTML = '';
        this.stopStepLoadingDots();
        if (!steps.length) {
            const empty = document.createElement('li');
            empty.className = 'step-item placeholder';
            empty.textContent = '暂无步骤';
            this.taskStepsList.appendChild(empty);
            return;
        }

        steps.forEach((step, index) => {
            const item = document.createElement('li');
            item.className = 'step-item';
            item.innerHTML = `
                <div class="step-number">${index + 1}</div>
                <div class="step-content">
                    <div class="step-title">${step.title || ''}</div>
                    <div class="step-detail">${step.detail || ''}</div>
                    <div class="step-encouragement">${step.encouragement || ''}</div>
                </div>
            `;
            this.taskStepsList.appendChild(item);
        });
    }

    async renderStepsTyping(title, steps, token) {
        this.taskStepsList.innerHTML = '';
        this.stopStepLoadingDots();
        if (title) {
            const headerItem = document.createElement('li');
            headerItem.className = 'step-item header';
            headerItem.textContent = title;
            this.taskStepsList.appendChild(headerItem);
        }

        for (let i = 0; i < steps.length; i += 1) {
            if (token !== this.renderToken) {
                return;
            }
            const stepData = typeof steps[i] === 'string'
                ? { title: steps[i], detail: '', encouragement: '' }
                : steps[i];
            const item = document.createElement('li');
            item.className = 'step-item';
            item.innerHTML = `
                <div class="step-number">${i + 1}</div>
                <div class="step-content">
                    <div class="step-title"></div>
                    <div class="step-detail"></div>
                    <div class="step-encouragement"></div>
                </div>
            `;
            this.taskStepsList.appendChild(item);

            const titleEl = item.querySelector('.step-title');
            const detailEl = item.querySelector('.step-detail');
            const encouragementEl = item.querySelector('.step-encouragement');

            await this.typeText(titleEl, stepData.title || '', token);
            await this.typeText(detailEl, stepData.detail || '', token);
            await this.typeText(encouragementEl, stepData.encouragement || '', token);
        }
    }

    async typeText(element, text, token) {
        element.textContent = '';
        for (let i = 0; i < text.length; i += 1) {
            if (token !== this.renderToken) {
                return;
            }
            element.textContent += text[i];
            await this.sleep(22);
        }
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async startTimer() {
        if (!this.currentTaskId) {
            alert('请先生成任务或刷新任务');
            return;
        }
        try {
            const data = await window.API.startTimer(this.currentTaskId);
            this.timerSeconds = data.elapsed_seconds || 0;
            this.isTimerRunning = true;
            this.setTimerButtons('running');
            this.startLocalTimer();
            this.setStatusText('计时中');
        } catch (error) {
            console.error(error);
            alert('无法开始计时，请检查后端');
        }
    }

    async pauseTimer() {
        try {
            const data = await window.API.pauseTimer();
            this.timerSeconds = data.elapsed_seconds || this.timerSeconds;
            this.isTimerRunning = false;
            this.setTimerButtons('paused');
            this.stopLocalTimer();
            this.updateTimerDisplay();
            this.setStatusText('已暂停');
        } catch (error) {
            console.error(error);
            alert('无法暂停计时，请检查后端');
        }
    }

    async stopTimer() {
        try {
            const paused = await window.API.pauseTimer();
            this.timerSeconds = paused.elapsed_seconds || this.timerSeconds;
            this.isTimerRunning = false;
            this.setTimerButtons('paused');
            this.stopLocalTimer();
            this.updateTimerDisplay();
            this.setStatusText('已暂停');
            this.openTaskEditModal(this.timerSeconds);
        } catch (error) {
            console.error(error);
            alert('无法结束计时，请检查后端');
        }
    }

    async syncTimerStatus() {
        try {
            const status = await window.API.getTimerStatus();
            if (status.status === 'idle') {
                this.setTimerButtons('idle');
                this.timerSeconds = 0;
                this.updateTimerDisplay();
                this.setStatusText('');
                return;
            }

            this.timerSeconds = status.elapsed_seconds || 0;
            this.updateTimerDisplay();

            if (status.task_id && !this.currentTaskId) {
                this.currentTaskId = status.task_id;
                await this.loadTaskSteps(status.task_id);
            }

            if (status.status === 'running') {
                this.isTimerRunning = true;
                this.setTimerButtons('running');
                this.startLocalTimer();
                this.setStatusText('计时中');
            } else {
                this.isTimerRunning = false;
                this.setTimerButtons('paused');
                this.stopLocalTimer();
                this.setStatusText('已暂停');
            }
        } catch (error) {
            console.error(error);
        }
    }

    startLocalTimer() {
        this.stopLocalTimer();
        this.timerInterval = setInterval(() => {
            if (this.isTimerRunning) {
                this.timerSeconds += 1;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    stopLocalTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    setTimerButtons(state) {
        if (state === 'running') {
            this.timerStart.classList.add('hidden');
            this.timerPause.classList.remove('hidden');
            this.timerStop.classList.remove('hidden');
            return;
        }

        if (state === 'paused') {
            this.timerStart.classList.remove('hidden');
            this.timerStart.textContent = '继续';
            this.timerPause.classList.add('hidden');
            this.timerStop.classList.remove('hidden');
            return;
        }

        this.timerStart.classList.remove('hidden');
        this.timerStart.textContent = '开始';
        this.timerPause.classList.add('hidden');
        this.timerStop.classList.add('hidden');
    }

    updateTimerDisplay() {
        this.timerDisplay.textContent = this.formatTime(this.timerSeconds);
    }

    formatTime(totalSeconds) {
        const seconds = Math.max(Number(totalSeconds) || 0, 0);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    setStatusText(text) {
        this.timerStatus.textContent = text || '';
    }

    setTaskSelectEnabled(isEnabled) {
        if (!this.selectBtn) {
            return;
        }
        this.selectBtn.disabled = !isEnabled;
    }

    showTaskView() {
        if (window.homeView) {
            window.homeView.taskView.classList.add('active');
        } else {
            const view = document.getElementById('task-view');
            if (view) {
                view.classList.add('active');
            }
        }
        if (this.selectView) {
            this.selectView.classList.remove('active');
        }
    }

    showTaskSelectView() {
        if (window.homeView) {
            window.homeView.taskView.classList.remove('active');
        } else {
            const view = document.getElementById('task-view');
            if (view) {
                view.classList.remove('active');
            }
        }
        if (this.selectView) {
            this.selectView.classList.add('active');
        }
    }

    renderTaskSelectList(items) {
        if (!this.selectList) {
            return;
        }
        this.selectList.innerHTML = '';
        if (!items.length) {
            const empty = document.createElement('li');
            empty.className = 'history-item empty';
            empty.textContent = '暂无历史记录';
            this.selectList.appendChild(empty);
            return;
        }

        items.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <div class="history-text">
                    <div class="history-title">${item.title}</div>
                    <div class="history-meta">进度 ${Number(item.progress || 0)}%</div>
                </div>
            `;
            li.addEventListener('click', async () => {
                this.currentTaskId = item.id;
                this.taskTitle.textContent = item.title || '未命名任务';
                this.taskProgress.textContent = `进度：${Number(item.progress || 0)}%`;
                await this.loadTaskSteps(item.id);
                this.showTaskView();
            });
            this.selectList.appendChild(li);
        });
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.startLoadingDots(this.supplementBtn, '生成中');
        } else {
            this.supplementBtn.disabled = false;
            this.supplementBtn.textContent = '补充';
            this.stopLoadingDots();
        }
    }

    startLoadingDots(targetButton, baseText) {
        this.stopLoadingDots();
        this.loadingTarget = targetButton;
        let dots = 0;
        targetButton.disabled = true;
        targetButton.textContent = baseText;
        this.loadingTimer = setInterval(() => {
            dots = (dots + 1) % 4;
            if (this.loadingTarget) {
                this.loadingTarget.textContent = `${baseText}${'.'.repeat(dots)}`;
            }
        }, 400);
    }

    stopLoadingDots() {
        if (this.loadingTimer) {
            clearInterval(this.loadingTimer);
            this.loadingTimer = null;
            this.loadingTarget = null;
        }
    }

    startStepLoadingDots(targetElement) {
        this.stopStepLoadingDots();
        let dots = 0;
        this.stepLoadingTimer = setInterval(() => {
            dots = (dots + 1) % 4;
            targetElement.textContent = `生成中${'.'.repeat(dots)}`;
        }, 400);
    }

    stopStepLoadingDots() {
        if (this.stepLoadingTimer) {
            clearInterval(this.stepLoadingTimer);
            this.stepLoadingTimer = null;
        }
    }

    showSupplementBox() {
        this.supplementBox.classList.remove('hidden');
    }

    hideSupplementBox() {
        this.supplementBox.classList.add('hidden');
        this.supplementInput.value = '';
    }

    showTimerCard() {
        this.timerCard.classList.remove('hidden');
    }

    hideTimerCard() {
        this.timerCard.classList.add('hidden');
    }

    async handleSupplement() {
        const supplement = this.supplementInput.value.trim();
        if (!supplement) {
            alert('请输入补充说明');
            return;
        }

        if (!this.baseInput) {
            alert('请先生成步骤');
            return;
        }

        const fullInput = `${this.baseInput}\n补充说明：${supplement}`;
        this.startLoadingDots(this.supplementBtn, '生成中');
        const currentToken = ++this.renderToken;

        try {
            const data = await window.API.generateSteps(fullInput);
            if (currentToken !== this.renderToken) {
                return;
            }
            await this.renderStepsTyping(data.title, data.steps, currentToken);
            await this.replaceSavedTask(fullInput, data);
            this.showTimerCard();
        } catch (error) {
            console.error(error);
            const message = error && error.message ? error.message : '请检查后端是否启动';
            alert(`生成失败：${message}`);
        } finally {
            if (currentToken === this.renderToken) {
                this.supplementBtn.disabled = false;
                this.supplementBtn.textContent = '补充';
                this.stopLoadingDots();
            }
        }
    }

    async saveTask(userInput, data) {
        try {
            const result = await window.API.createTask({
                title: data.title || '未命名任务',
                user_input: userInput,
                steps: data.steps || [],
            });
            if (window.homeView) {
                await window.homeView.loadHistory();
            }
            return result.id || null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async replaceSavedTask(userInput, data) {
        try {
            if (this.lastSavedTaskId) {
                await window.API.deleteTask(this.lastSavedTaskId);
            }
        } catch (error) {
            console.error(error);
        }

        try {
            const result = await window.API.createTask({
                title: data.title || '未命名任务',
                user_input: userInput,
                steps: data.steps || [],
            });
            this.lastSavedTaskId = result.id || null;
            if (window.homeView) {
                await window.homeView.loadHistory();
            }
        } catch (error) {
            console.error(error);
        }
    }

    openTaskEditModal(durationSeconds) {
        if (!this.currentTaskId) {
            return;
        }

        const initialProgress = this.getCurrentProgress();
        const initialHours = Math.floor(durationSeconds / 3600);
        const initialMinutes = Math.floor((durationSeconds % 3600) / 60);

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">编辑进度与用时</div>
                <div class="modal-body">
                    <label class="label">完成百分比</label>
                    <div class="time-wheel" role="group" aria-label="进度选择器">
                        <div class="wheel-column" data-unit="progress" aria-label="进度百分比">
                            <div class="wheel-control" data-dir="up">▲</div>
                            <div class="wheel-window">
                                <div class="wheel-value" id="task-progress-value">${initialProgress}</div>
                            </div>
                            <div class="wheel-control" data-dir="down">▼</div>
                            <div class="wheel-unit">%</div>
                        </div>
                    </div>
                    <label class="label">用时（小时 / 分钟）</label>
                    <div class="time-wheel" role="group" aria-label="用时选择器">
                        <div class="wheel-column" data-unit="hours" aria-label="小时">
                            <div class="wheel-control" data-dir="up">▲</div>
                            <div class="wheel-window">
                                <div class="wheel-value" id="task-duration-hours">${initialHours}</div>
                            </div>
                            <div class="wheel-control" data-dir="down">▼</div>
                            <div class="wheel-unit">小时</div>
                        </div>
                        <div class="wheel-column" data-unit="minutes" aria-label="分钟">
                            <div class="wheel-control" data-dir="up">▲</div>
                            <div class="wheel-window">
                                <div class="wheel-value" id="task-duration-minutes">${initialMinutes}</div>
                            </div>
                            <div class="wheel-control" data-dir="down">▼</div>
                            <div class="wheel-unit">分钟</div>
                        </div>
                    </div>
                    <div class="modal-hint">本次用时 ${this.formatTime(durationSeconds)}</div>
                </div>
                <div class="modal-actions">
                    <button id="task-edit-cancel" class="btn btn-secondary" type="button">取消</button>
                    <button id="task-edit-submit" class="btn btn-primary" type="button">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        let currentProgress = Math.round(initialProgress / 5) * 5;
        let currentHours = initialHours;
        let currentMinutes = initialMinutes;

        const progressEl = overlay.querySelector('#task-progress-value');
        const hoursEl = overlay.querySelector('#task-duration-hours');
        const minutesEl = overlay.querySelector('#task-duration-minutes');

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        const renderTime = () => {
            progressEl.textContent = String(currentProgress);
            hoursEl.textContent = String(currentHours);
            minutesEl.textContent = String(currentMinutes).padStart(2, '0');
        };
        const animateValue = (element, delta) => {
            const className = delta >= 0 ? 'wheel-animate-up' : 'wheel-animate-down';
            element.classList.remove('wheel-animate-up', 'wheel-animate-down');
            void element.offsetWidth;
            element.classList.add(className);
            window.setTimeout(() => {
                element.classList.remove(className);
            }, 180);
        };
        const adjust = (unit, delta) => {
            if (unit === 'progress') {
                let next = currentProgress + delta * 5;
                if (next > 100) {
                    next = 0;
                } else if (next < 0) {
                    next = 100;
                }
                if (next !== currentProgress) {
                    currentProgress = next;
                    animateValue(progressEl, delta);
                }
            } else if (unit === 'hours') {
                const next = clamp(currentHours + delta, 0, 999);
                if (next !== currentHours) {
                    currentHours = next;
                    animateValue(hoursEl, delta);
                }
            } else {
                let next = currentMinutes + delta;
                if (next > 59) {
                    next = 0;
                } else if (next < 0) {
                    next = 59;
                }
                if (next !== currentMinutes) {
                    currentMinutes = next;
                    animateValue(minutesEl, delta);
                }
            }
            renderTime();
        };

        overlay.querySelectorAll('.wheel-column').forEach((column) => {
            const unit = column.dataset.unit;
            column.addEventListener('wheel', (event) => {
                event.preventDefault();
                const delta = event.deltaY > 0 ? 1 : -1;
                adjust(unit, delta);
            }, { passive: false });
            column.querySelectorAll('.wheel-control').forEach((control) => {
                control.addEventListener('click', () => {
                    const dir = control.dataset.dir === 'up' ? 1 : -1;
                    adjust(unit, dir);
                });
            });
        });

        renderTime();

        const closeModal = () => {
            overlay.remove();
        };

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeModal();
            }
        });

        overlay.querySelector('#task-edit-cancel').addEventListener('click', async () => {
            closeModal();
            try {
                const resumed = await window.API.startTimer(this.currentTaskId);
                this.timerSeconds = resumed.elapsed_seconds || this.timerSeconds;
                this.isTimerRunning = true;
                this.setTimerButtons('running');
                this.startLocalTimer();
                this.setStatusText('计时中');
            } catch (error) {
                console.error(error);
            }
        });

        overlay.querySelector('#task-edit-submit').addEventListener('click', async () => {
            try {
                const stopData = await window.API.stopTimer();
                const totalDurationSeconds = currentHours * 3600 + currentMinutes * 60;
                await window.API.updateTask(this.currentTaskId, {
                    progress: currentProgress,
                    total_duration_seconds: totalDurationSeconds,
                });
                this.timerSeconds = 0;
                this.isTimerRunning = false;
                this.setTimerButtons('idle');
                this.stopLocalTimer();
                this.updateTimerDisplay();
                this.setStatusText(`已结束，本次时长 ${this.formatTime(stopData.duration_seconds || 0)}`);
                this.taskProgress.textContent = `进度：${currentProgress}%`;
                if (window.homeView) {
                    await window.homeView.loadHistory();
                    await window.homeView.loadSuggestion();
                }
                closeModal();
            } catch (error) {
                console.error(error);
                alert('保存进度失败，请检查后端');
            }
        });
    }

    getCurrentProgress() {
        const text = this.taskProgress ? this.taskProgress.textContent : '';
        const match = text.match(/(\d+)/);
        if (!match) {
            return 0;
        }
        const value = Number(match[1]);
        if (Number.isNaN(value)) {
            return 0;
        }
        return Math.max(0, Math.min(100, value));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.taskView = new TaskView();
});
