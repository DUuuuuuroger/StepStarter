class HomeView {
    constructor() {
        this.goalInput = document.getElementById('goal-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.stepsContainer = document.getElementById('steps-container');
        this.stepsList = document.getElementById('steps-list');

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

        try {
            const data = await window.API.generateSteps(input);
            this.renderSteps(data.title, data.steps);
        } catch (error) {
            console.error(error);
            alert('生成失败，请检查后端是否启动');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.generateBtn.disabled = true;
            this.generateBtn.textContent = '生成中...';
        } else {
            this.generateBtn.disabled = false;
            this.generateBtn.textContent = '生成步骤';
        }
    }

    renderSteps(title, steps) {
        this.stepsList.innerHTML = '';

        const headerItem = document.createElement('li');
        headerItem.className = 'step-item header';
        headerItem.textContent = title;
        this.stepsList.appendChild(headerItem);

        steps.forEach((step, index) => {
            const item = document.createElement('li');
            item.className = 'step-item';
            item.textContent = `${index + 1}. ${step}`;
            this.stepsList.appendChild(item);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.homeView = new HomeView();
});
