class CalendarView {
    constructor() {
        this.prevBtn = document.getElementById('calendar-prev');
        this.nextBtn = document.getElementById('calendar-next');
        this.monthLabel = document.getElementById('calendar-month');
        this.daysContainer = document.getElementById('calendar-days');
        this.summaryEl = document.getElementById('calendar-summary');
        this.listEl = document.getElementById('calendar-list');
        this.currentDate = new Date();
        this.selectedDate = new Date();

        this.init();
    }

    init() {
        this.prevBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextBtn.addEventListener('click', () => this.changeMonth(1));
        this.renderCalendar();
        this.loadDay(this.formatDateInput(this.selectedDate));
    }

    async loadDay(dateValue) {
        if (!dateValue) {
            return;
        }
        try {
            const result = await window.API.getCalendarDay(dateValue);
            this.render(result);
        } catch (error) {
            console.error(error);
            this.render({ date: dateValue, total_duration_seconds: 0, items: [] });
        }
    }

    render(data) {
        const totalText = this.formatDuration(data.total_duration_seconds || 0);
        this.summaryEl.textContent = `当天用时：${totalText || '--'}`;
        this.listEl.innerHTML = '';
        const items = data.items || [];
        if (!items.length) {
            const empty = document.createElement('li');
            empty.className = 'history-item empty';
            empty.textContent = '暂无记录';
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
                </div>
            `;
            this.listEl.appendChild(li);
        });
    }

    formatDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    renderCalendar(animation) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        this.monthLabel.textContent = `${year}年${month + 1}月`;
        this.daysContainer.innerHTML = '';
        if (animation) {
            this.daysContainer.classList.remove('slide-left', 'slide-right');
            void this.daysContainer.offsetWidth;
            this.daysContainer.classList.add(animation);
        }

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startWeekday = (firstDay.getDay() + 6) % 7;
        const daysInMonth = lastDay.getDate();

        for (let i = 0; i < startWeekday; i += 1) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day muted';
            empty.textContent = '';
            this.daysContainer.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const dateObj = new Date(year, month, day);
            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            cell.textContent = String(day);
            if (this.isSameDay(dateObj, this.selectedDate)) {
                cell.classList.add('selected');
            }
            cell.addEventListener('click', () => {
                this.selectedDate = dateObj;
                this.renderCalendar();
                this.loadDay(this.formatDateInput(dateObj));
            });
            this.daysContainer.appendChild(cell);
        }
    }

    changeMonth(delta) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        this.currentDate = new Date(year, month + delta, 1);
        const animation = delta > 0 ? 'slide-left' : 'slide-right';
        this.renderCalendar(animation);
    }

    isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.calendarView = new CalendarView();
});
