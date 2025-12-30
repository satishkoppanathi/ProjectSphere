import axios from 'axios';

const backend_url = process.env.VITE_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: backend_url + '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect on 401 - allow guest mode to function
        // The dashboards will handle the error gracefully
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // Don't redirect - let the component handle it
        }
        return Promise.reject(error);
    }
);

// Helper to log guest activity
export const logActivity = async (action, details = {}) => {
    try {
        await api.post('/activity/log', { action, details });
    } catch (error) {
        // Silently fail for logging to not disrupt user experience
        console.error('Failed to log activity:', error);
    }
};

export default api;
