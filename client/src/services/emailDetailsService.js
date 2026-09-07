import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/email-details",
});

// ======================================
// Attach JWT Token
// ======================================

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ======================================
// Get Email Details
// ======================================

export const getEmailDetails = async (id) => {
  const response = await API.get(`/${id}`);
  return response.data;
};

// ======================================
// Generate AI Reply
// ======================================

export const generateReply = async (id) => {
  const response = await API.post(`/${id}/generate-reply`);
  return response.data;
};

// ======================================
// Reply Email
// ======================================

export const replyEmail = async (id, body) => {
  const response = await API.post(`/${id}/reply`, {
    body,
  });

  return response.data;
};

// ======================================
// Reply All
// ======================================

export const replyAllEmail = async (id, body) => {
  const response = await API.post(`/${id}/reply-all`, {
    body,
  });

  return response.data;
};

// ======================================
// Forward Email
// ======================================

export const forwardEmail = async (id, payload) => {
  const response = await API.post(`/${id}/forward`, payload);
  return response.data;
};

// ======================================
// Delete Email
// ======================================

export const deleteEmail = async (id) => {
  const response = await API.delete(`/${id}`);
  return response.data;
};

// ======================================
// Download Attachment
// ======================================

export const downloadFile = async (emailId, attachmentId) => {
  const response = await API.get(
    `/${emailId}/attachments/${attachmentId}`
  );

  return response.data;
};

// ======================================
// Create Task From Email
// ======================================

export const createTask = async (id) => {
  const response = await API.post(`/${id}/create-task`);
  return response.data;
};

export default API;