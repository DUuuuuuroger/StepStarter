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

    async deleteTask(taskId) {
        const resp = await fetch(`${this.baseURL}/tasks/${taskId}`, {
            method: 'DELETE',
        });
        if (!resp.ok) {
            throw new Error(`Delete task failed: ${resp.status}`);
        }
        return resp.json();
    },
};

window.API = API;
