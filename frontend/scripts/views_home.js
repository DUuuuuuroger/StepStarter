class HomeView {
    constructor() {
        this.goalInput = document.getElementById('goal-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.stepsContainer = document.getElementById('steps-container');
        this.stepsList = document.getElementById('steps-list');
        this.historyRefreshBtn = document.getElementById('history-refresh-btn');
        this.historyList = document.getElementById('history-list');
        this.historyDetailTitle = document.getElementById('history-detail-title');
        this.historyStepsList = document.getElementById('history-steps-list');
        this.historyBackBtn = document.getElementById('history-back-btn');
        this.supplementBox = document.getElementById('supplement-box');
        this.supplementInput = document.getElementById('supplement-input');
        this.supplementBtn = document.getElementById('supplement-btn');

        this.homeTab = document.getElementById('view-home-btn');
        this.settingsTab = document.getElementById('view-settings-btn');
        this.homeView = document.getElementById('home-view');
        this.historyView = document.getElementById('history-view');
        this.settingsView = document.getElementById('settings-view');

        this.loadingTimer = null;
        this.loadingTarget = null;
        this.renderToken = 0;
        this.baseInput = '';
        this.lastSavedTaskId = null;

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
        this.homeTab.addEventListener('click', () => this.showHome());
        this.settingsTab.addEventListener('click', () => this.showSettings());
        this.supplementBtn.addEventListener('click', () => this.handleSupplement());
        this.loadHistory();
    }

    showHome() {
        this.homeView.classList.add('active');
        this.historyView.classList.remove('active');
        this.settingsView.classList.remove('active');
        this.homeTab.classList.add('active');
        this.settingsTab.classList.remove('active');
        this.homeTab.setAttribute('aria-selected', 'true');
        this.settingsTab.setAttribute('aria-selected', 'false');
    }

    showHistory() {
        this.homeView.classList.remove('active');
        this.historyView.classList.add('active');
        this.settingsView.classList.remove('active');
        this.homeTab.classList.remove('active');
        this.settingsTab.classList.remove('active');
        this.homeTab.setAttribute('aria-selected', 'false');
        this.settingsTab.setAttribute('aria-selected', 'false');
    }

    showSettings() {
        this.homeView.classList.remove('active');
        this.historyView.classList.remove('active');
        this.settingsView.classList.add('active');
        this.homeTab.classList.remove('active');
        this.settingsTab.classList.add('active');
        this.homeTab.setAttribute('aria-selected', 'false');
        this.settingsTab.setAttribute('aria-selected', 'true');
    }

    async handleGenerateSteps() {
        const input = this.goalInput.value.trim();

        if (!input) {
            alert('请输入你想做的事情');
            return;
        }

        this.setLoading(true);
        this.renderSteps('', []);
        this.hideSupplementBox();
        const currentToken = ++this.renderToken;
        this.baseInput = input;

        try {
            const data = await window.API.generateSteps(input);
            if (currentToken !== this.renderToken) {
                return;
            }
            await this.renderStepsTyping(data.title, data.steps, currentToken);
            this.lastSavedTaskId = await this.saveTask(input, data);
            this.showSupplementBox();
        } catch (error) {
            console.error(error);
            alert('生成失败，请检查后端是否启动');
        } finally {
            if (currentToken === this.renderToken) {
                this.setLoading(false);
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
            await this.loadHistory();
            return result.id || null;
        } catch (error) {
            console.error(error);
            return null;
        }
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
        this.setSupplementLoading(true);
        const currentToken = ++this.renderToken;

        try {
            const data = await window.API.generateSteps(fullInput);
            if (currentToken !== this.renderToken) {
                return;
            }
            await this.renderStepsTyping(data.title, data.steps, currentToken);
            await this.replaceSavedTask(fullInput, data);
        } catch (error) {
            console.error(error);
            alert('生成失败，请检查后端是否启动');
        } finally {
            if (currentToken === this.renderToken) {
                this.setSupplementLoading(false);
            }
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
            await this.loadHistory();
        } catch (error) {
            console.error(error);
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

    renderHistory(items) {
        this.historyList.innerHTML = '';
        if (!items.length) {
            const empty = document.createElement('li');
            empty.className = 'history-item empty';
            empty.textContent = '暂无历史记录';
            this.historyList.appendChild(empty);
            return;
        }

        items.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <div class="history-title">${item.title}</div>
                <div class="history-meta">${this.formatLocalTime(item.created_at)}</div>
            `;
            li.addEventListener('click', () => {
                this.loadHistorySteps(item.id, item.title);
            });
            this.historyList.appendChild(li);
        });
    }

    async loadHistorySteps(taskId, title) {
        try {
            const result = await window.API.getTaskSteps(taskId);
            const steps = result.items || [];
            this.renderHistorySteps(title, steps);
            this.showHistory();
        } catch (error) {
            console.error(error);
            alert('读取历史步骤失败，请确认后端已启动');
        }
    }

    renderHistorySteps(title, steps) {
        this.historyDetailTitle.textContent = title || '历史步骤';
        this.historyStepsList.innerHTML = '';
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

    setLoading(isLoading) {
        if (isLoading) {
            this.generateBtn.disabled = true;
            this.startLoadingDots(this.generateBtn);
        } else {
            this.generateBtn.disabled = false;
            this.generateBtn.textContent = '生成步骤';
            this.stopLoadingDots();
        }
    }

    setSupplementLoading(isLoading) {
        if (isLoading) {
            this.supplementBtn.disabled = true;
            this.startLoadingDots(this.supplementBtn);
        } else {
            this.supplementBtn.disabled = false;
            this.supplementBtn.textContent = '补充';
            this.stopLoadingDots();
        }
    }

    startLoadingDots(targetButton) {
        this.stopLoadingDots();
        this.loadingTarget = targetButton;
        let dots = 0;
        targetButton.textContent = '生成中';
        this.loadingTimer = setInterval(() => {
            dots = (dots + 1) % 4;
            if (this.loadingTarget) {
                this.loadingTarget.textContent = `生成中${'.'.repeat(dots)}`;
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

    renderSteps(title, steps) {
        this.stepsList.innerHTML = '';

        if (title) {
            const headerItem = document.createElement('li');
            headerItem.className = 'step-item header';
            headerItem.textContent = title;
            this.stepsList.appendChild(headerItem);
        }

        steps.forEach((step, index) => {
            const stepData = typeof step === 'string'
                ? { title: step, detail: '', encouragement: '' }
                : step;
            const item = document.createElement('li');
            item.className = 'step-item';
            item.innerHTML = `
                <div class="step-number">${index + 1}</div>
                <div class="step-content">
                    <div class="step-title">${stepData.title || ''}</div>
                    <div class="step-detail">${stepData.detail || ''}</div>
                    <div class="step-encouragement">${stepData.encouragement || ''}</div>
                </div>
            `;
            this.stepsList.appendChild(item);
        });
    }

    async renderStepsTyping(title, steps, token) {
        this.stepsList.innerHTML = '';
        if (title) {
            const headerItem = document.createElement('li');
            headerItem.className = 'step-item header';
            headerItem.textContent = title;
            this.stepsList.appendChild(headerItem);
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
            this.stepsList.appendChild(item);

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

    showSupplementBox() {
        this.supplementBox.classList.remove('hidden');
    }

    hideSupplementBox() {
        this.supplementBox.classList.add('hidden');
        this.supplementInput.value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.homeView = new HomeView();
});
