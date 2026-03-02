const API = {
    baseURL: 'http://127.0.0.1:8000',

    async health() {
        const resp = await fetch(`${this.baseURL}/health`);
        if (!resp.ok) {
            throw new Error(`Health check failed: ${resp.status}`);
        }
        return resp.json();
    },

    async generateSteps(input) {
        const resp = await fetch(`${this.baseURL}/ai/steps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input }),
        });

        if (!resp.ok) {
            throw new Error(`Generate steps failed: ${resp.status}`);
        }

        return resp.json();
    },

    async getSettings() {
        const resp = await fetch(`${this.baseURL}/settings`);
        if (!resp.ok) {
            throw new Error(`Get settings failed: ${resp.status}`);
        }
        return resp.json();
    },

    async updateSettings(payload) {
        const resp = await fetch(`${this.baseURL}/settings`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            throw new Error(`Update settings failed: ${resp.status}`);
        }

        return resp.json();
    },

    async createTask(payload) {
        const resp = await fetch(`${this.baseURL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            throw new Error(`Create task failed: ${resp.status}`);
        }

        return resp.json();
    },

    async listTasks(limit = 20) {
        const resp = await fetch(`${this.baseURL}/tasks?limit=${limit}`);
        if (!resp.ok) {
            throw new Error(`List tasks failed: ${resp.status}`);
        }
        return resp.json();
    },

    async getTaskSteps(taskId) {
        const resp = await fetch(`${this.baseURL}/tasks/${taskId}/steps`);
        if (!resp.ok) {
            throw new Error(`Get task steps failed: ${resp.status}`);
        }
        return resp.json();
    },

    async getTask(taskId) {
        const resp = await fetch(`${this.baseURL}/tasks/${taskId}`);
        if (!resp.ok) {
            throw new Error(`Get task failed: ${resp.status}`);
        }
        return resp.json();
    },

    async getNextStartSuggestion() {
        const resp = await fetch(`${this.baseURL}/suggestions/next-start`);
        if (!resp.ok) {
            throw new Error(`Get suggestion failed: ${resp.status}`);
        }
        return resp.json();
    },

    async getCalendarDay(dateValue) {
        const resp = await fetch(`${this.baseURL}/calendar/day?date=${encodeURIComponent(dateValue)}`);
        if (!resp.ok) {
            throw new Error(`Get calendar day failed: ${resp.status}`);
        }
        return resp.json();
    },

    async getWeeklyReport(week) {
        const resp = await fetch(`${this.baseURL}/reports/weekly?week=${encodeURIComponent(week)}`);
        if (!resp.ok) {
            throw new Error(`Get weekly report failed: ${resp.status}`);
        }
        return resp.json();
    },

    async getMonthlyReport(month) {
        const resp = await fetch(`${this.baseURL}/reports/monthly?month=${encodeURIComponent(month)}`);
        if (!resp.ok) {
            throw new Error(`Get monthly report failed: ${resp.status}`);
        }
        return resp.json();
    },

    async getYearlyReport(year) {
        const resp = await fetch(`${this.baseURL}/reports/yearly?year=${encodeURIComponent(year)}`);
        if (!resp.ok) {
            throw new Error(`Get yearly report failed: ${resp.status}`);
        }
        return resp.json();
    },

    async initReports() {
        const resp = await fetch(`${this.baseURL}/reports/init`);
        if (!resp.ok) {
            throw new Error(`Init reports failed: ${resp.status}`);
        }
        return resp.json();
    },

    async refreshReports() {
        const resp = await fetch(`${this.baseURL}/reports/refresh`, { method: 'POST' });
        if (!resp.ok) {
            throw new Error(`Refresh reports failed: ${resp.status}`);
        }
        return resp.json();
    },

    async deleteTask(taskId) {
        const resp = await fetch(`${this.baseURL}/tasks/${taskId}`, {
            method: 'DELETE',
        });
        if (!resp.ok) {
            throw new Error(`Delete task failed: ${resp.status}`);
        }
        return resp.json();
    },

    async updateTask(taskId, payload) {
        const resp = await fetch(`${this.baseURL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!resp.ok) {
            throw new Error(`Update task failed: ${resp.status}`);
        }
        return resp.json();
    },

    async startTimer(taskId) {
        const resp = await fetch(`${this.baseURL}/timer/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ task_id: taskId }),
        });
        if (!resp.ok) {
            throw new Error(`Start timer failed: ${resp.status}`);
        }
        return resp.json();
    },

    async pauseTimer() {
        const resp = await fetch(`${this.baseURL}/timer/pause`, {
            method: 'POST',
        });
        if (!resp.ok) {
            throw new Error(`Pause timer failed: ${resp.status}`);
        }
        return resp.json();
    },

    async stopTimer() {
        const resp = await fetch(`${this.baseURL}/timer/stop`, {
            method: 'POST',
        });
        if (!resp.ok) {
            throw new Error(`Stop timer failed: ${resp.status}`);
        }
        return resp.json();
    },

    async getTimerStatus() {
        const resp = await fetch(`${this.baseURL}/timer/status`);
        if (!resp.ok) {
            throw new Error(`Timer status failed: ${resp.status}`);
        }
        return resp.json();
    },
};

window.API = API;
