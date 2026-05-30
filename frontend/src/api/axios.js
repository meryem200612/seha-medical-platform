import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
    const storedToken = localStorage.getItem('auth_token');
    const token = storedToken ? storedToken.replace(/^"(.*)"$/, '$1').trim() : '';
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
