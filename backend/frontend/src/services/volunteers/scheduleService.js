import api from '../api';

const scheduleService = {
  getWeekly: async (weekStart) =>
    api.get('/volunteers/schedule/weekly_schedule/', {
      params: weekStart ? { week_start: weekStart } : {},
    }),

  create: async (data) => api.post('/volunteers/schedule/', data),
  update: async (id, data) => api.put(`/volunteers/schedule/${id}/`, data),
  remove: async (id) => api.delete(`/volunteers/schedule/${id}/`),

  getByVolunteer: async (volunteerId) =>
    api.get('/volunteers/schedule/', { params: { volunteer: volunteerId } }),

  setTurno: async (volunteerId, data, turno) =>
    api.post('/volunteers/schedule/set_turno/', { volunteer: volunteerId, data, turno }),
};

export default scheduleService;
