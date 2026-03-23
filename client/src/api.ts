import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (data: any) => api.post('/auth/login', data),
    verifyOtp: (data: any) => api.post('/auth/verify-otp', data),
    register: (data: any) => api.post('/auth/register', data),
    getQr: () => api.post('/auth/setup'),
};

export const fileApi = {
    upload: (formData: FormData) => api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    createShare: (fileId: string, targetEmail: string) => api.post('/shares/create', { fileId, targetEmail }),
    getSharedFiles: () => api.get('/files/shared'),
};

export const publicApi = {
    getChallenge: (token: string) => api.get(`/share/${token}`),
    verifyChallenge: (data: any) => api.post('/challenge/verify', data),
    download: (token: string) => `${API_URL}/download/${token}`,
};

export default api;
