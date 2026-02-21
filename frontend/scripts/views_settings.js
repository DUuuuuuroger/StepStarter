class SettingsView {
    constructor() {
        this.homeBtn = document.getElementById('view-home-btn');
        this.settingsBtn = document.getElementById('view-settings-btn');
        this.homeView = document.getElementById('home-view');
        this.settingsView = document.getElementById('settings-view');

        this.baseUrlInput = document.getElementById('settings-base-url');
        this.apiKeyInput = document.getElementById('settings-api-key');
        this.modelInput = document.getElementById('settings-model');
        this.saveBtn = document.getElementById('settings-save-btn');
        this.statusEl = document.getElementById('settings-status');

        this.init();
    }

    init() {
        this.homeBtn.addEventListener('click', () => this.showHome());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.saveBtn.addEventListener('click', () => this.saveSettings());

        this.loadSettings();
    }

    setStatus(message, isError = false) {
        this.statusEl.textContent = message;
        this.statusEl.classList.toggle('error', isError);
    }

    showHome() {
        this.homeView.classList.add('active');
        this.settingsView.classList.remove('active');
        this.homeBtn.classList.add('active');
        this.settingsBtn.classList.remove('active');
        this.homeBtn.setAttribute('aria-selected', 'true');
        this.settingsBtn.setAttribute('aria-selected', 'false');
    }

    showSettings() {
        this.homeView.classList.remove('active');
        this.settingsView.classList.add('active');
        this.homeBtn.classList.remove('active');
        this.settingsBtn.classList.add('active');
        this.homeBtn.setAttribute('aria-selected', 'false');
        this.settingsBtn.setAttribute('aria-selected', 'true');
    }

    async loadSettings() {
        try {
            const data = await window.API.getSettings();
            this.baseUrlInput.value = data.base_url || '';
            this.apiKeyInput.value = data.api_key || '';
            this.modelInput.value = data.model || '';
            this.setStatus('');
        } catch (error) {
            console.error(error);
            this.setStatus('读取设置失败，请确认后端已启动', true);
        }
    }

    async saveSettings() {
        this.saveBtn.disabled = true;
        this.saveBtn.textContent = '保存中...';

        try {
            const payload = {
                base_url: this.baseUrlInput.value.trim(),
                api_key: this.apiKeyInput.value.trim(),
                model: this.modelInput.value.trim() || null,
            };
            const data = await window.API.updateSettings(payload);
            this.baseUrlInput.value = data.base_url || '';
            this.apiKeyInput.value = data.api_key || '';
            this.modelInput.value = data.model || '';
            this.setStatus('已保存');
        } catch (error) {
            console.error(error);
            this.setStatus('保存失败，请稍后重试', true);
        } finally {
            this.saveBtn.disabled = false;
            this.saveBtn.textContent = '保存设置';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsView = new SettingsView();
});
