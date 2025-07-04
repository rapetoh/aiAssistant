import api from './api';

export const matcherService = {
  getMatchAnalysis: async (resumeInput, jobDescription, timestamp = null) => {
    try {
      let response;
      if (resumeInput instanceof File) {
        // Use file upload as before
        const formData = new FormData();
        formData.append('resume', resumeInput);
        formData.append('jobDescription', jobDescription);
        if (timestamp) {
          formData.append('timestamp', timestamp.toString());
        }
        response = await api.post('/matcher/match', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Use plain text resume
        const payload = {
          resumeText: resumeInput,
          jobDescription,
        };
        if (timestamp) payload.timestamp = timestamp;
        response = await api.post('/matcher/match', payload);
      }
      return response.data;
    } catch (error) {
      console.error('Error getting match analysis:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
}; 