import api from './api';

export const matcherService = {
  getMatchAnalysis: async (resumeFile, jobDescription, timestamp = null) => {
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobDescription', jobDescription);
      if (timestamp) {
        formData.append('timestamp', timestamp.toString());
      }

      const response = await api.post('/matcher/match', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting match analysis:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
}; 