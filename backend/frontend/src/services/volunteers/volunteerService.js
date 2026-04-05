import api from '../api';

const volunteerService = {
  getAll: async (params = {}) => api.get('/volunteers/volunteers/', { params }),
  getById: async (id) => api.get(`/volunteers/volunteers/${id}/`),
  getMe: async () => api.get('/volunteers/volunteers/me/'),
  getVolunteerOfWeek: async () => api.get('/volunteers/volunteers/volunteer_of_week/'),
  create: async (data) => api.post('/volunteers/volunteers/', data),
  update: async (id, data) => api.put(`/volunteers/volunteers/${id}/`, data),
  patch: async (id, data) => api.patch(`/volunteers/volunteers/${id}/`, data),
  remove: async (id) => api.delete(`/volunteers/volunteers/${id}/`),
  getWeeklyHours: async (id) => api.get(`/volunteers/volunteers/${id}/weekly_hours/`),

  getBadges: async (tipo) => api.get('/volunteers/badges/', { params: tipo ? { tipo } : {} }),
  createBadge: async (data) => api.post('/volunteers/badges/', data),

  grantBadge: async (volunteerId, badgeId) =>
    api.post('/volunteers/volunteer-badges/', { volunteer: volunteerId, badge_id: badgeId }),
  revokeBadge: async (id) => api.delete(`/volunteers/volunteer-badges/${id}/`),
};

export default volunteerService;
