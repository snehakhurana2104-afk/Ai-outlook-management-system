import axios from "axios";

const API = "http://localhost:5000/api/auth";

// ======================================
// Login
// ======================================

export const microsoftLogin = () => {
  window.location.href = `${API}/login`;
};

// ======================================
// Get Current User
// ======================================

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

// ======================================
// Logout
// ======================================

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};