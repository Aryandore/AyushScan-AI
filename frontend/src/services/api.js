import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const submitAssessment = async (data) => {
  const requestBody = {
    patient_name: data.patient?.name || 'Unknown',
    patient_age: data.patient?.age || 'Unknown',
    patient_location: data.patient?.location || 'Unknown',
    symptoms_text: data.voice?.transcript || '',
    image_analysis: data.image?.s3Key || '',
    language: data.voice?.language || 'en',
  };
  
  const response = await api.post('/triage', requestBody, { timeout: 30000 });
  return { data: response.data };
};

export const generateReport = async (assessmentId) => {
  const response = await api.post('/report', {
    assessment_id: assessmentId,
  }, { timeout: 30000 });
  return { data: response.data };
};

export const getAssessments = async () => {
  const response = await api.get('/assessments');
  return { data: response.data };
};

export const getUploadUrl = async (filename, contentType) => {
  const response = await api.get('/upload-url', {
    params: { filename, content_type: contentType }
  });
  return { data: response.data };
};

export default api;
