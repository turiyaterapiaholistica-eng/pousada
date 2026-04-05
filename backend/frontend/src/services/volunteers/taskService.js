import api from '../api';

const taskService = {
  getMyTasks: async (data) =>
    api.get('/volunteers/tasks/my_tasks/', { params: data ? { data } : {} }),

  getMyWeekHours: async () =>
    api.get('/volunteers/tasks/my_week_hours/'),

  getByVolunteerAndDate: async (volunteerId, data) =>
    api.get('/volunteers/tasks/', { params: { volunteer: volunteerId, data } }),

  create: async (data) =>
    api.post('/volunteers/tasks/', data),

  remove: async (id) =>
    api.delete(`/volunteers/tasks/${id}/`),

  update: async (id, data) =>
    api.patch(`/volunteers/tasks/${id}/`, data),

  iniciar: async (id) =>
    api.post(`/volunteers/tasks/${id}/iniciar/`),

  finalizar: async (id, payload) => {
    // payload pode ter: horas_gastas, checklist_progress, respostas_finalizacao,
    //                   problema_reportado, notes, foto (File)
    if (payload.foto instanceof File) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value instanceof File) {
          form.append(key, value);
        } else if (value !== undefined && value !== null) {
          form.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
      });
      // Para multipart, usar axios diretamente com Content-Type correto
      const axios = (await import('axios')).default;
      const response = await axios.post(
        `/api/volunteers/tasks/${id}/finalizar/`,
        form,
        { withCredentials: true, headers: { 'X-CSRFToken': getCsrfToken() } }
      );
      return response.data;
    }
    return api.post(`/volunteers/tasks/${id}/finalizar/`, payload);
  },

  getDashboard: async (data) =>
    api.get('/volunteers/tasks/dashboard/', { params: data ? { data } : {} }),
};

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

export default taskService;
