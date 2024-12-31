import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
});

const apiService = {
    login: async (username, password) => {
        const response = await axiosInstance.post('/auth/login/', { 
            username, 
            password 
        });
        return response.data;
    },

    logout: async () => {
        const response = await axiosInstance.post('/auth/logout/');
        return response.data;
    },

    getCurrentUser: async () => {
        try {
            const response = await axiosInstance.get('/auth/user/');
            return response.data;
        } catch (error) {
            return null;
        }
    },
  // Base CRUD methods
  get: async (url) => {
    const response = await axiosInstance.get(url);
    return response.data;
  },
  
  post: async (url, data) => {
    try {
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      console.error('API Error:', {
        url,
        data,
        error: error.response?.data || error.message
      });
      throw error;
    }
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