class HomeView {
    constructor() {
        this.goalInput = document.getElementById('goal-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.stepsContainer = document.getElementById('steps-container');
        this.stepsList = document.getElementById('steps-list');
        this.loadingTimer = null;
        this.renderToken = 0;

        this.init();
    }

    init() {
        this.generateBtn.addEventListener('click', () => {
            this.handleGenerateSteps();
        });
    }

    async handleGenerateSteps() {
        const input = this.goalInput.value.trim();

        if (!input) {
            alert('请输入你想做的事情');
            return;
        }

        this.setLoading(true);
        this.renderSteps('', []);
        const currentToken = ++this.renderToken;

        try {
            const data = await window.API.generateSteps(input);
            if (currentToken !== this.renderToken) {
                return;
            }
            await this.renderStepsTyping(data.title, data.steps, currentToken);
        } catch (error) {
            console.error(error);
            alert('生成失败，请检查后端是否启动');
        } finally {
            if (currentToken === this.renderToken) {
                this.setLoading(false);
            }
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.generateBtn.disabled = true;
            this.startLoadingDots();
        } else {
            this.generateBtn.disabled = false;
            this.generateBtn.textContent = '生成步骤';
            this.stopLoadingDots();
        }
    }

    startLoadingDots() {
        this.stopLoadingDots();
        let dots = 0;
        this.generateBtn.textContent = '生成中';
        this.loadingTimer = setInterval(() => {
            dots = (dots + 1) % 4;
            this.generateBtn.textContent = `生成中${'.'.repeat(dots)}`;
        }, 400);
    }

    stopLoadingDots() {
        if (this.loadingTimer) {
            clearInterval(this.loadingTimer);
            this.loadingTimer = null;
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.homeView = new HomeView();
});
