import api from './api';

const USER_KEY = 'auth_user';

const authService = {
    login: async (username, password) => {
        try {
            const response = await api.login(username, password);
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
            localStorage.setItem('isAuthenticated', 'true');
            return response.user;
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        try {
            await api.logout();
            authService.clearLocalAuth();
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    validateSession: async () => {
        const user = await api.getCurrentUser();
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            localStorage.setItem('isAuthenticated', 'true');
            return user;
        }
        authService.clearLocalAuth();
        return null;
    },

    clearLocalAuth: () => {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('isAuthenticated');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
        return localStorage.getItem('isAuthenticated') === 'true';
    }
};

export default authService;
