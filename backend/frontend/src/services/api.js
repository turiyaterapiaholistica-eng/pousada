// services/api.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: window.location.origin + '/api'
});

const apiService = {
  // Base CRUD methods
  get: async (url) => {
    const response = await axiosInstance.get(url);
    return response.data;
  },
  
  post: async (url, data) => {
    const response = await axiosInstance.post(url, data);
    return response.data;
  },
  
  patch: async (url, data) => {
    const response = await axiosInstance.patch(url, data);
    return response.data;
  },
  
  delete: async (url) => {
    const response = await axiosInstance.delete(url);
    return response.data;
  },
  
  // Payment related methods
  payments: {
    register: async (consumacaoId, paymentData) => {
      try {
        const response = await axiosInstance.post(
          `/consumacoes/${consumacaoId}/registrar_pagamento/`,
          {
            valor: paymentData.amount,
            forma_pagamento: paymentData.method,
            observacao: paymentData.notes
          }
        );
        return response.data;
      } catch (error) {
        if (error.response?.data) {
          throw error;
        }
        throw new Error('Erro ao processar pagamento');
      }
    },

    getHistory: async (consumacaoId) => {
      try {
        const response = await axiosInstance.get(
          `/consumacoes/${consumacaoId}/pagamentos/`
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    }
  }
};

export default apiService;