// frontend/src/services/volunteers/activityService.js
import api from '../api';

const activityService = {

  // Listar atividades — aceita filtros opcionais
  // Ex: getAll({ area: 'Cozinha', ativa: true })
  getAll: async (params = {}) => {
    return await api.get('/volunteers/activities/', { params });
  },

  // Buscar uma atividade pelo ID
  getById: async (id) => {
    return await api.get(`/volunteers/activities/${id}/`);
  },

  // Criar nova atividade
  create: async (data) => {
    return await api.post('/volunteers/activities/', data);
  },

  // Editar atividade existente (substituição completa)
  update: async (id, data) => {
    return await api.put(`/volunteers/activities/${id}/`, data);
  },

  // Ativar ou desativar — atualização parcial
  toggleActive: async (id, ativa) => {
    return await api.patch(`/volunteers/activities/${id}/`, { ativa });
  },

  // Deletar atividade
  remove: async (id) => {
    return await api.delete(`/volunteers/activities/${id}/`);
  },

};

export default activityService;