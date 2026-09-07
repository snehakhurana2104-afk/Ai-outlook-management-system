import axios from "axios";

const API = "http://localhost:5000/api/ai";

const getToken = () => localStorage.getItem("token");

// ======================================
// Axios Instance
// ======================================

const aiApi = axios.create({
  baseURL: API,
});

aiApi.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ======================================
// Generate AI Summary
// POST /api/ai/summary
// ======================================

export const generateSummary = async (emailId) => {
  const response = await aiApi.post("/summary", {
    emailId,
  });

  return response.data;
};

// ======================================
// Extract Tasks
// POST /api/ai/tasks
// ======================================

export const extractTasks = async (emailId) => {
  const response = await aiApi.post("/tasks", {
    emailId,
  });

  return response.data;
};

// ======================================
// Detect Priority
// POST /api/ai/priority
// ======================================

export const detectPriority = async (emailId) => {
  const response = await aiApi.post("/priority", {
    emailId,
  });

  return response.data;
};

// ======================================
// Detect Category
// POST /api/ai/category
// ======================================

export const detectCategory = async (emailId) => {
  const response = await aiApi.post("/category", {
    emailId,
  });

  return response.data;
};

// ======================================
// AI Sentiment Analysis
// POST /api/ai/sentiment
// ======================================

export const analyzeSentiment = async (emailId) => {
  const response = await aiApi.post("/sentiment", {
    emailId,
  });

  return response.data;
};

// ======================================
// Run Complete AI Pipeline
// POST /api/ai/process
// ======================================

export const processEmailAI = async (emailId) => {
  const response = await aiApi.post("/process", {
    emailId,
  });

  return response.data;
};

export default aiApi;