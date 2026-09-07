import axios from "axios";

/* ==========================================================================
   Axios Instance
========================================================================== */

const axiosInstance = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL ||
    "http://localhost:5000/api",

  timeout: 15000,
});

/* ==========================================================================
   Request Interceptor
========================================================================== */

axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* ==========================================================================
   Export
========================================================================== */

export default axiosInstance;