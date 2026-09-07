import axios from "axios";

const API = "http://localhost:5000/api/categories";

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getCategories = async () => {
  const response = await api.get("/");
  return response.data;
};