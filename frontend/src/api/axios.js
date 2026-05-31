import axios from 'axios';
import { API_BASE_URL } from './baseUrl';

const api = axios.create({
    baseURL: API_BASE_URL,
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
