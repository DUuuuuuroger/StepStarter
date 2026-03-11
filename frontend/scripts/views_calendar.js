class CalendarView {
    constructor() {
        this.prevBtn = document.getElementById('calendar-prev');
        this.nextBtn = document.getElementById('calendar-next');
        this.calBody = document.getElementById('cal-body');
        this.summaryEl = document.getElementById('calendar-summary');
        this.listEl = document.getElementById('calendar-list');

        this.today = new Date();
        this.selectedDate = new Date();
        this.currentDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1);

        // Map of "YYYY-MM" -> Set of days that have events
        this._eventDays = {};
        this.renderToken = 0;

        this.init();
    }

    init() {
        this.prevBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextBtn.addEventListener('click', () => this.changeMonth(1));
        this.renderCalendar();
        this.loadDay(this.formatDateInput(this.selectedDate));
    }

    /* ── Render ─────────────────────────────────────────── */

    async renderCalendar() {
        const token = ++this.renderToken;
        this.calBody.innerHTML = '';
        // Load month events first, then render
        await this._loadMonthEvents(this.currentDate);
        if (token !== this.renderToken) return;
        await this._renderMonth(this.currentDate);
    }

    /* ── Load month events ──────────────────────────────── */

    async _loadMonthEvents(monthDate) {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        try {
            const result = await window.API.getCalendarMonth(year, month);
            const key = `${year}-${String(month + 1).padStart(2, '0')}`;
            this._eventDays[key] = new Set(result.days || []);
        } catch (error) {
            console.error('Failed to load month events:', error);
        }
    }

    async _renderMonth(monthDate) {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();

        const section = document.createElement('div');
        section.className = 'cal-month-section';

        // Month label (e.g. "3月")
        const label = document.createElement('div');
        label.className = 'cal-month-label';
        label.textContent = `${month + 1}月`;
        section.appendChild(label);

        // Days grid
        const grid = document.createElement('div');
        grid.className = 'cal-days-grid';

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startWeekday = (firstDay.getDay() + 6) % 7; // Mon=0
        const daysInMonth = lastDay.getDate();

        // Empty cells before first day
        for (let i = 0; i < startWeekday; i++) {
            const empty = document.createElement('div');
            empty.className = 'cal-day muted';
            grid.appendChild(empty);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const cell = document.createElement('div');
            cell.className = 'cal-day';

            if (this.isSameDay(dateObj, this.today)) cell.classList.add('today');
            if (this.isSameDay(dateObj, this.selectedDate)) cell.classList.add('selected');

            // Number
            const num = document.createElement('div');
            num.className = 'cal-day-num';
            num.textContent = String(day);
            cell.appendChild(num);

            // Event dot (if this day has events)
            const key = `${year}-${String(month + 1).padStart(2, '0')}`;
            if (this._eventDays[key] && this._eventDays[key].has(day)) {
                const dot = document.createElement('div');
                dot.className = 'cal-dot';
                cell.appendChild(dot);
            }

            cell.dataset.date = this.formatDateInput(dateObj);
            cell.addEventListener('click', () => {
                this.selectedDate = dateObj;
                this.updateSelectedDay(cell);
                this.loadDay(this.formatDateInput(dateObj));
            });

            grid.appendChild(cell);
        }

        section.appendChild(grid);
        this.calBody.appendChild(section);
    }

    /* ── Month navigation ───────────────────────────────── */

    async changeMonth(delta) {
        const y = this.currentDate.getFullYear();
        const m = this.currentDate.getMonth();
        this.currentDate = new Date(y, m + delta, 1);
        await this.renderCalendar();
    }

    /* ── Load day data ──────────────────────────────────── */

    async loadDay(dateValue) {
        if (!dateValue) return;
        try {
            const result = await window.API.getCalendarDay(dateValue);
            this.renderDetail(result);
            this._cacheEventDay(dateValue, result);
        } catch (error) {
            console.error(error);
            this.renderDetail({ date: dateValue, total_duration_seconds: 0, items: [] });
        }
    }

    _cacheEventDay(dateValue, data) {
        if (!data || !data.items || !data.items.length) return;
        const [year, month, day] = dateValue.split('-');
        const key = `${year}-${month}`;
        if (!this._eventDays[key]) this._eventDays[key] = new Set();
        const dayNum = Number(day);
        if (this._eventDays[key].has(dayNum)) return;
        this._eventDays[key].add(dayNum);
        this.ensureEventDot(dateValue);
    }

    renderDetail(data) {
        // Summary row
        const totalText = this.formatDuration(data.total_duration_seconds || 0);
        const valueEl = this.summaryEl.querySelector('.cal-summary-value');
        if (valueEl) valueEl.textContent = totalText || '--';

        // List
        this.listEl.innerHTML = '';
        const items = data.items || [];
        if (!items.length) {
            const empty = document.createElement('li');
            empty.className = 'history-item empty';
            empty.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>暂无记录</span>`;
            this.listEl.appendChild(empty);
            return;
        }
        items.forEach((item) => {
            const hasDuration = Number(item.total_duration_seconds || 0) > 0;
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <div class="history-text">
                    <div class="history-title">${item.title || '未命名任务'}</div>
                    <div class="history-meta">用时 ${hasDuration ? this.formatDuration(item.total_duration_seconds || 0) : '----'}</div>
                </div>`;
            this.listEl.appendChild(li);
        });
    }

    /* ── Helpers ────────────────────────────────────────── */

    formatDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }

    updateSelectedDay(targetCell) {
        const prev = this.calBody.querySelector('.cal-day.selected');
        if (prev && prev !== targetCell) {
            prev.classList.remove('selected');
        }
        if (targetCell) {
            targetCell.classList.add('selected');
        }
    }

    ensureEventDot(dateValue) {
        const cell = this.calBody.querySelector(`.cal-day[data-date="${dateValue}"]`);
        if (!cell) return;
        if (cell.querySelector('.cal-dot')) return;
        const dot = document.createElement('div');
        dot.className = 'cal-dot';
        cell.appendChild(dot);
    }

    formatDuration(totalSeconds) {
        const seconds = Math.max(Number(totalSeconds) || 0, 0);
        if (!seconds) return '';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const mins = minutes.toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        if (hours > 0) return `${hours}:${mins}:${secs}`;
        return `${minutes}:${secs}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.calendarView = new CalendarView();
});
