import axios from "axios";

const API_URL = "http://localhost:5000/api/emails";

const emailApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================
// TOKEN
// ======================================

const getToken = () => localStorage.getItem("token");

// ======================================
// REQUEST INTERCEPTOR
// ======================================

emailApi.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================
// RESPONSE INTERCEPTOR
// ======================================

emailApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Email API Error:", error);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }

    return Promise.reject(error);
  }
);

// ======================================
// GET EMAILS
// ======================================

export const getEmails = async (params = {}) => {
  const response = await emailApi.get("/", { params });
  return response.data;
};

// ======================================
// GET EMAIL
// ======================================

export const getEmailById = async (id) => {
  const response = await emailApi.get(`/${id}`);
  return response.data;
};

// ======================================
// CREATE EMAIL
// ======================================

export const createEmail = async (data) => {
  const response = await emailApi.post("/", data);
  return response.data;
};

// ======================================
// UPDATE EMAIL
// ======================================

export const updateEmail = async (id, data) => {
  const response = await emailApi.put(`/${id}`, data);
  return response.data;
};

// ======================================
// DELETE EMAIL
// ======================================

export const deleteEmail = async (id) => {
  const response = await emailApi.delete(`/${id}`);
  return response.data;
};

// ======================================
// SYNC EMAILS
// ======================================

export const syncEmails = async () => {
  const response = await emailApi.post("/sync");
  return response.data;
};

export const syncOutlook = syncEmails;

// ======================================
// DASHBOARD STATS
// ======================================

export const getEmailStats = async () => {
  const response = await emailApi.get("/stats");
  return response.data;
};

// ======================================
// REANALYZE
// ======================================

export const reAnalyzeEmails = async () => {
  const response = await emailApi.post("/reanalyze");
  return response.data;
};

// ======================================
// READ
// ======================================

export const markAsRead = async (id) => {
  const response = await emailApi.patch(`/${id}/read`);
  return response.data;
};

// ======================================
// UNREAD
// ======================================

export const markAsUnread = async (id) => {
  const response = await emailApi.patch(`/${id}/unread`);
  return response.data;
};

// ======================================
// ARCHIVE
// ======================================

export const archiveEmail = async (id) => {
  const response = await emailApi.patch(`/${id}/archive`);
  return response.data;
};

// ======================================
// AI SUMMARY
// ======================================

export const getAISummary = async (id) => {
  const response = await emailApi.get(`/${id}/summary`);
  return response.data;
};

// ======================================
// AI REPLY
// ======================================

export const generateAIReply = async (id) => {
  const response = await emailApi.post(`/${id}/reply`);
  return response.data;
};

export default emailApi;