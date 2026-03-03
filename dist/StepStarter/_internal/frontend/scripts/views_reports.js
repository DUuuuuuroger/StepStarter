class ReportsView {
    constructor() {
        this.reportCard = document.getElementById('report-single');
        this.headerEl = document.getElementById('report-header');
        this.generatedAtEl = document.getElementById('report-generated-at');
        this.refreshBtn = document.getElementById('reports-refresh');
        this.statusEl = document.getElementById('reports-status');
        this.tabWeekly = document.getElementById('report-tab-weekly');
        this.tabMonthly = document.getElementById('report-tab-monthly');
        this.tabYearly = document.getElementById('report-tab-yearly');
        this.activePeriod = 'weekly';
        this.reportCache = null;
        this.init();
    }

    init() {
        this.refreshBtn.addEventListener('click', () => this.refreshReports());
        this.tabWeekly.addEventListener('click', () => this.switchPeriod('weekly'));
        this.tabMonthly.addEventListener('click', () => this.switchPeriod('monthly'));
        this.tabYearly.addEventListener('click', () => this.switchPeriod('yearly'));
        this.initReports();
    }

    async initReports() {
        this.setStatus('生成中...', false);
        try {
            this.reportCache = await window.API.initReports();
            this.renderActiveReport();
            this.setStatus('', false);
        } catch (error) {
            console.error(error);
            this.setStatus('生成失败，请确认已配置 API Key', true);
        }
    }

    async refreshReports() {
        this.setStatus('生成中...', false);
        try {
            this.reportCache = await window.API.refreshReports();
            this.renderActiveReport();
            this.setStatus('', false);
        } catch (error) {
            console.error(error);
            this.setStatus('生成失败，请确认已配置 API Key', true);
        }
    }

    switchPeriod(period) {
        if (this.activePeriod === period) {
            return;
        }
        this.activePeriod = period;
        this.updateTabs();
        this.renderActiveReport();
    }

    updateTabs() {
        this.tabWeekly.classList.toggle('active', this.activePeriod === 'weekly');
        this.tabMonthly.classList.toggle('active', this.activePeriod === 'monthly');
        this.tabYearly.classList.toggle('active', this.activePeriod === 'yearly');
    }

    renderActiveReport() {
        if (!this.reportCache) {
            return;
        }
        const payload = this.reportCache[this.activePeriod];
        if (!payload) {
            return;
        }
        if (this.activePeriod === 'weekly') {
            this.headerEl.textContent = '本周';
        } else if (this.activePeriod === 'monthly') {
            this.headerEl.textContent = '本月';
        } else {
            this.headerEl.textContent = '今年';
        }
        if (this.generatedAtEl) {
            this.generatedAtEl.textContent = `生成时间：${payload.generated_at || '--'}`;
        }
        this.renderReport(this.reportCard, payload.report || {});
    }

    renderReport(card, data) {
        if (!card || !data) {
            return;
        }
        card.querySelector('.report-title').textContent = data.title || '行动报告';
        this.renderMetrics(card.querySelector('.report-metrics'), data.metrics || []);
        this.renderList(card.querySelector('.report-highlights'), data.highlights || []);
        this.renderList(card.querySelector('.report-insights'), data.insights || []);
        this.renderList(card.querySelector('.report-suggestions'), data.suggestions || []);
    }

    renderMetrics(container, metrics) {
        container.innerHTML = '';
        metrics.forEach((metric) => {
            const item = document.createElement('div');
            item.className = 'report-metric';
            item.innerHTML = `
                <div class="report-metric-label">${metric.label || ''}</div>
                <div class="report-metric-value">${metric.value || ''}</div>
            `;
            container.appendChild(item);
        });
    }

    renderList(container, items) {
        container.innerHTML = '';
        if (!items.length) {
            const li = document.createElement('li');
            li.textContent = '暂无内容';
            container.appendChild(li);
            return;
        }
        items.forEach((text) => {
            const li = document.createElement('li');
            li.innerHTML = this.formatRichText(text);
            container.appendChild(li);
        });
    }

    formatRichText(text) {
        const safe = String(text || '');
        return safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }

    setStatus(text, isError) {
        if (!this.statusEl) {
            return;
        }
        this.statusEl.textContent = text;
        this.statusEl.classList.toggle('error', Boolean(isError));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reportsView = new ReportsView();
});
