class HomeView {
    constructor() {
        this.goalInput = document.getElementById('goal-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.historyRefreshBtn = document.getElementById('history-refresh-btn');
        this.historyList = document.getElementById('history-list');
        this.historyDetailTitle = document.getElementById('history-detail-title');
        this.historyStepsList = document.getElementById('history-steps-list');
        this.historyBackBtn = document.getElementById('history-back-btn');
        this.historyEditBtn = document.getElementById('history-edit-btn');
        this.historyPromptBox = document.getElementById('history-prompt-box');
        this.historyPromptText = document.getElementById('history-prompt-text');
        this.historySelectBtn = document.getElementById('history-select-btn');
        this.historyCancelBtn = document.getElementById('history-cancel-btn');
        this.historyDeleteBtn = document.getElementById('history-delete-btn');
        this.homeTab = document.getElementById('view-home-btn');
        this.taskTab = document.getElementById('view-task-btn');
        this.calendarTab = document.getElementById('view-calendar-btn');
        this.reportsTab = document.getElementById('view-reports-btn');
        this.settingsTab = document.getElementById('view-settings-btn');
        this.homeView = document.getElementById('home-view');
        this.historyView = document.getElementById('history-view');
        this.taskView = document.getElementById('task-view');
        this.taskSelectView = document.getElementById('task-select-view');
        this.calendarView = document.getElementById('calendar-view');
        this.reportsView = document.getElementById('reports-view');
        this.settingsView = document.getElementById('settings-view');
        this.suggestionCard = document.getElementById('suggestion-card');
        this.suggestionText = document.getElementById('suggestion-text');
        this.suggestionAction = document.getElementById('suggestion-action');

        this.renderToken = 0;
        this.selectionMode = false;
        this.selectedTaskIds = new Set();
        this.historyItemsById = new Map();
        this.currentHistoryTaskId = null;
        this.currentHistorySteps = [];
        this.homeScrollY = 0;

        this.init();
    }

    init() {
        this.generateBtn.addEventListener('click', () => {
            this.handleGenerateSteps();
        });
        this.historyRefreshBtn.addEventListener('click', () => {
            this.loadHistory();
        });
        this.historyBackBtn.addEventListener('click', () => {
            this.showHome();
        });
        this.historyEditBtn.addEventListener('click', () => {
            this.openHistoryEditModal();
        });
        this.historySelectBtn.addEventListener('click', () => {
            this.enterSelectionMode();
        });
        this.historyCancelBtn.addEventListener('click', () => {
            this.exitSelectionMode();
        });
        this.historyDeleteBtn.addEventListener('click', () => {
            this.deleteSelectedTasks();
        });
        this.homeTab.addEventListener('click', () => this.showHome());
        this.taskTab.addEventListener('click', () => this.showTask());
        this.calendarTab.addEventListener('click', () => this.showCalendar());
        this.reportsTab.addEventListener('click', () => this.showReports());
        this.settingsTab.addEventListener('click', () => this.showSettings());
        this.suggestionAction.addEventListener('click', () => this.openSuggestionTask());
        this.loadHistory();
        this.loadSuggestion();
    }

    showHome() {
        this.homeView.classList.add('active');
        this.historyView.classList.remove('active');
        this.taskView.classList.remove('active');
        this.taskSelectView.classList.remove('active');
        this.calendarView.classList.remove('active');
        this.reportsView.classList.remove('active');
        this.settingsView.classList.remove('active');
        this.homeTab.classList.add('active');
        this.taskTab.classList.remove('active');
        this.calendarTab.classList.remove('active');
        this.reportsTab.classList.remove('active');
        this.settingsTab.classList.remove('active');
        this.homeTab.setAttribute('aria-selected', 'true');
        this.taskTab.setAttribute('aria-selected', 'false');
        this.calendarTab.setAttribute('aria-selected', 'false');
        this.reportsTab.setAttribute('aria-selected', 'false');
        this.settingsTab.setAttribute('aria-selected', 'false');
        window.requestAnimationFrame(() => {
            window.scrollTo(0, this.homeScrollY || 0);
        });
    }

    showHistory() {
        this.homeView.classList.remove('active');
        this.historyView.classList.add('active');
        this.taskView.classList.remove('active');
        this.taskSelectView.classList.remove('active');
        this.calendarView.classList.remove('active');
        this.reportsView.classList.remove('active');
        this.settingsView.classList.remove('active');
        this.homeTab.classList.remove('active');
        this.taskTab.classList.remove('active');
        this.calendarTab.classList.remove('active');
        this.reportsTab.classList.remove('active');
        this.settingsTab.classList.remove('active');
        this.homeTab.setAttribute('aria-selected', 'false');
        this.taskTab.setAttribute('aria-selected', 'false');
        this.calendarTab.setAttribute('aria-selected', 'false');
        this.reportsTab.setAttribute('aria-selected', 'false');
        this.settingsTab.setAttribute('aria-selected', 'false');
        window.requestAnimationFrame(() => {
            window.scrollTo(0, 0);
        });
    }

    showTask() {
        this.homeView.classList.remove('active');
        this.historyView.classList.remove('active');
        this.taskView.classList.add('active');
        this.taskSelectView.classList.remove('active');
        this.calendarView.classList.remove('active');
        this.reportsView.classList.remove('active');
        this.settingsView.classList.remove('active');
        this.homeTab.classList.remove('active');
        this.taskTab.classList.add('active');
        this.calendarTab.classList.remove('active');
        this.reportsTab.classList.remove('active');
        this.settingsTab.classList.remove('active');
        this.homeTab.setAttribute('aria-selected', 'false');
        this.taskTab.setAttribute('aria-selected', 'true');
        this.calendarTab.setAttribute('aria-selected', 'false');
        this.reportsTab.setAttribute('aria-selected', 'false');
        this.settingsTab.setAttribute('aria-selected', 'false');
    }

    showCalendar() {
        this.homeView.classList.remove('active');
        this.historyView.classList.remove('active');
        this.taskView.classList.remove('active');
        this.taskSelectView.classList.remove('active');
        this.calendarView.classList.add('active');
        this.reportsView.classList.remove('active');
        this.settingsView.classList.remove('active');
        this.homeTab.classList.remove('active');
        this.taskTab.classList.remove('active');
        this.calendarTab.classList.add('active');
        this.reportsTab.classList.remove('active');
        this.settingsTab.classList.remove('active');
        this.homeTab.setAttribute('aria-selected', 'false');
        this.taskTab.setAttribute('aria-selected', 'false');
        this.calendarTab.setAttribute('aria-selected', 'true');
        this.reportsTab.setAttribute('aria-selected', 'false');
        this.settingsTab.setAttribute('aria-selected', 'false');
    }

    showReports() {
        this.homeView.classList.remove('active');
        this.historyView.classList.remove('active');
        this.taskView.classList.remove('active');
        this.taskSelectView.classList.remove('active');
        this.calendarView.classList.remove('active');
        this.reportsView.classList.add('active');
        this.settingsView.classList.remove('active');
        this.homeTab.classList.remove('active');
        this.taskTab.classList.remove('active');
        this.calendarTab.classList.remove('active');
        this.reportsTab.classList.add('active');
        this.settingsTab.classList.remove('active');
        this.homeTab.setAttribute('aria-selected', 'false');
        this.taskTab.setAttribute('aria-selected', 'false');
        this.calendarTab.setAttribute('aria-selected', 'false');
        this.reportsTab.setAttribute('aria-selected', 'true');
        this.settingsTab.setAttribute('aria-selected', 'false');
    }

    showSettings() {
        this.homeView.classList.remove('active');
        this.historyView.classList.remove('active');
        this.taskView.classList.remove('active');
        this.taskSelectView.classList.remove('active');
        this.calendarView.classList.remove('active');
        this.reportsView.classList.remove('active');
        this.settingsView.classList.add('active');
        this.homeTab.classList.remove('active');
        this.taskTab.classList.remove('active');
        this.calendarTab.classList.remove('active');
        this.reportsTab.classList.remove('active');
        this.settingsTab.classList.add('active');
        this.homeTab.setAttribute('aria-selected', 'false');
        this.taskTab.setAttribute('aria-selected', 'false');
        this.calendarTab.setAttribute('aria-selected', 'false');
        this.reportsTab.setAttribute('aria-selected', 'false');
        this.settingsTab.setAttribute('aria-selected', 'true');
    }

    async handleGenerateSteps() {
        const input = this.goalInput.value.trim();

        if (!input) {
            alert('请输入你想做的事情');
            return;
        }

        if (!window.taskView) {
            alert('任务页面尚未准备好');
            return;
        }
        this.generateBtn.disabled = true;
        this.showTask();
        try {
            await window.taskView.generateFromInput(input);
            this.goalInput.value = '';
        } finally {
            this.generateBtn.disabled = false;
        }
    }

    async loadHistory() {
        try {
            const result = await window.API.listTasks(20);
            this.renderHistory(result.items || []);
        } catch (error) {
            console.error(error);
            this.renderHistory([]);
        }
    }

    async loadSuggestion() {
        try {
            const result = await window.API.getNextStartSuggestion();
            this.renderSuggestion(result);
        } catch (error) {
            console.error(error);
            this.renderSuggestion(null);
        }
    }

    renderHistory(items) {
        this.historyList.innerHTML = '';
        this.historyList.classList.toggle('selection-mode', this.selectionMode);
        this.historyItemsById.clear();
        if (!items.length) {
            const empty = document.createElement('li');
            empty.className = 'history-item empty';
            empty.textContent = '暂无历史记录';
            this.historyList.appendChild(empty);
            return;
        }

        items.forEach((item) => {
            this.historyItemsById.set(item.id, item);
            const li = document.createElement('li');
            li.className = 'history-item';
            li.dataset.taskId = item.id;
            li.innerHTML = `
                <div class="history-check" aria-hidden="true">▢</div>
                <div class="history-text">
                    <div class="history-title">${item.title}</div>
                    <div class="history-meta">${this.formatHistoryMeta(item)}</div>
                </div>
            `;
            li.addEventListener('click', () => {
                if (this.selectionMode) {
                    this.toggleTaskSelection(li, item.id);
                } else {
                    this.loadHistorySteps(item);
                }
            });
            this.historyList.appendChild(li);
        });
    }

    renderSuggestion(data) {
        if (!this.suggestionCard || !this.suggestionText || !this.suggestionAction) {
            return;
        }
        if (!data || !data.task) {
            this.suggestionText.textContent = '暂无可启动的任务';
            this.suggestionAction.classList.add('hidden');
            this.suggestionCard.classList.remove('hidden');
            return;
        }
        const taskTitle = data.task.title || '未命名任务';
        const stepTitle = data.step ? data.step.title : '请选择一个步骤开始';
        this.suggestionText.textContent = `先从「${taskTitle}」开始：${stepTitle}`;
        this.suggestionAction.dataset.taskId = String(data.task.id);
        this.suggestionAction.classList.remove('hidden');
        this.suggestionCard.classList.remove('hidden');
    }

    async openSuggestionTask() {
        const taskId = Number(this.suggestionAction.dataset.taskId || 0);
        if (!taskId || !window.taskView) {
            return;
        }
        await window.taskView.loadTaskById(taskId);
        this.showTask();
    }

    enterSelectionMode() {
        this.selectionMode = true;
        this.selectedTaskIds.clear();
        this.historySelectBtn.classList.add('hidden');
        this.historyRefreshBtn.classList.add('hidden');
        this.historyCancelBtn.classList.remove('hidden');
        this.historyDeleteBtn.classList.remove('hidden');
        this.renderHistoryFromDom();
    }

    exitSelectionMode() {
        this.selectionMode = false;
        this.selectedTaskIds.clear();
        this.historySelectBtn.classList.remove('hidden');
        this.historyRefreshBtn.classList.remove('hidden');
        this.historyCancelBtn.classList.add('hidden');
        this.historyDeleteBtn.classList.add('hidden');
        const selectedItems = this.historyList.querySelectorAll('.history-item.selected');
        selectedItems.forEach((item) => item.classList.remove('selected'));
        this.renderHistoryFromDom();
    }

    renderHistoryFromDom() {
        this.historyList.classList.toggle('selection-mode', this.selectionMode);
        const items = this.historyList.querySelectorAll('.history-item');
        items.forEach((item) => {
            const check = item.querySelector('.history-check');
            if (check) {
                check.textContent = item.classList.contains('selected') ? '■' : '▢';
            }
        });
    }

    toggleTaskSelection(element, taskId) {
        if (this.selectedTaskIds.has(taskId)) {
            this.selectedTaskIds.delete(taskId);
            element.classList.remove('selected');
            const check = element.querySelector('.history-check');
            if (check) {
                check.textContent = '▢';
            }
            return;
        }
        this.selectedTaskIds.add(taskId);
        element.classList.add('selected');
        const check = element.querySelector('.history-check');
        if (check) {
            check.textContent = '■';
        }
    }

    async deleteSelectedTasks() {
        if (!this.selectedTaskIds.size) {
            alert('请选择要删除的历史任务');
            return;
        }

        const ids = Array.from(this.selectedTaskIds);
        for (const taskId of ids) {
            try {
                await window.API.deleteTask(taskId);
            } catch (error) {
                console.error(error);
            }
        }

        await this.loadHistory();
        this.exitSelectionMode();
        this.historyStepsList.innerHTML = '<li class="step-item placeholder">请选择一条历史任务</li>';
    }

    async loadHistorySteps(item) {
        const taskId = item.id;
        const title = item.title;
        try {
            this.homeScrollY = window.scrollY || 0;
            const [taskInfo, result] = await Promise.all([
                window.API.getTask(taskId),
                window.API.getTaskSteps(taskId),
            ]);
            const steps = result.items || [];
            this.renderHistorySteps(title, steps);
            this.currentHistoryTaskId = taskId;
            this.currentHistorySteps = steps;
            this.renderHistoryPrompt(taskInfo.user_input || '');
            this.showHistory();
        } catch (error) {
            console.error(error);
            alert('读取历史步骤失败，请确认后端已启动');
        }
    }

    renderHistorySteps(title, steps) {
        this.historyDetailTitle.textContent = title || '历史步骤';
        this.historyStepsList.innerHTML = '';
        this.renderHistoryPrompt('');
        if (!steps.length) {
            const empty = document.createElement('li');
            empty.className = 'step-item placeholder';
            empty.textContent = '该任务没有步骤记录';
            this.historyStepsList.appendChild(empty);
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
            this.historyStepsList.appendChild(item);
        });
    }

    renderHistoryPrompt(text) {
        if (!this.historyPromptBox || !this.historyPromptText) {
            return;
        }
        if (!text) {
            this.historyPromptBox.classList.add('hidden');
            this.historyPromptText.textContent = '';
            return;
        }
        this.historyPromptText.textContent = text;
        this.historyPromptBox.classList.remove('hidden');
    }

    formatLocalTime(value) {
        if (!value) {
            return '';
        }
        const text = String(value);
        const cleaned = text.replace('T', ' ');
        const parts = cleaned.split(' ');
        if (parts.length < 2) {
            return cleaned;
        }
        const datePart = parts[0];
        const timePart = parts[1].slice(0, 5);
        return `${datePart} ${timePart}`;
    }

    formatHistoryMeta(item) {
        const timeText = this.formatLocalTime(item.created_at);
        const progress = Number(item.progress || 0);
        const duration = this.formatDuration(item.total_duration_seconds || 0);
        const durationText = duration ? ` · 用时 ${duration}` : '';
        return `${timeText} · 进度 ${progress}%${durationText}`;
    }

    formatDuration(totalSeconds) {
        const seconds = Math.max(Number(totalSeconds) || 0, 0);
        if (!seconds) {
            return '';
        }
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const mins = minutes.toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        if (hours > 0) {
            return `${hours}:${mins}:${secs}`;
        }
        return `${minutes}:${secs}`;
    }

    openHistoryEditModal() {
        if (!this.currentHistoryTaskId) {
            alert('请先选择一条历史任务');
            return;
        }
        const item = this.historyItemsById.get(this.currentHistoryTaskId);
        const progressValue = item ? Number(item.progress || 0) : 0;
        const durationSeconds = item ? Number(item.total_duration_seconds || 0) : 0;
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
                                <div class="wheel-value" id="history-progress-value">${progressValue}</div>
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
                                <div class="wheel-value" id="history-duration-hours">${initialHours}</div>
                            </div>
                            <div class="wheel-control" data-dir="down">▼</div>
                            <div class="wheel-unit">小时</div>
                        </div>
                        <div class="wheel-column" data-unit="minutes" aria-label="分钟">
                            <div class="wheel-control" data-dir="up">▲</div>
                            <div class="wheel-window">
                                <div class="wheel-value" id="history-duration-minutes">${initialMinutes}</div>
                            </div>
                            <div class="wheel-control" data-dir="down">▼</div>
                            <div class="wheel-unit">分钟</div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="history-edit-cancel" class="btn btn-secondary" type="button">取消</button>
                    <button id="history-edit-submit" class="btn btn-primary" type="button">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        let currentHours = initialHours;
        let currentMinutes = initialMinutes;
        let currentProgress = Math.round(progressValue / 5) * 5;

        const progressEl = overlay.querySelector('#history-progress-value');
        const hoursEl = overlay.querySelector('#history-duration-hours');
        const minutesEl = overlay.querySelector('#history-duration-minutes');

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

        overlay.querySelector('#history-edit-cancel').addEventListener('click', () => {
            closeModal();
        });

        overlay.querySelector('#history-edit-submit').addEventListener('click', async () => {
            const totalDurationSeconds = currentHours * 3600 + currentMinutes * 60;
            try {
                await window.API.updateTask(this.currentHistoryTaskId, {
                    progress: currentProgress,
                    total_duration_seconds: totalDurationSeconds,
                });
                await this.loadHistory();
                await this.loadSuggestion();
                const updatedItem = this.historyItemsById.get(this.currentHistoryTaskId);
                if (updatedItem) {
                    this.renderHistorySteps(updatedItem.title, this.currentHistorySteps || []);
                }
                closeModal();
            } catch (error) {
                console.error(error);
                alert('更新失败，请检查后端');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.homeView = new HomeView();
});
