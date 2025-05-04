import axios from 'axios';

const API_BASE_URL = 'http://192.168.4.25:5000/api';

export const apiService = {
  getQuestions: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/questions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  submitResponse: async (response) => {
    try {
      const result = await axios.post(`${API_BASE_URL}/responses`, response);
      return result.data;
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  },

  getUserResponses: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/responses/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user responses:', error);
      throw error;
    }
  },

  getParetoAnalysis: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/responses/pareto`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Pareto analysis:', error);
      throw error;
    }
  }
};
