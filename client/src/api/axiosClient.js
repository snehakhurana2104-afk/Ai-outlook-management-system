"use strict";

import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| ACCESS TOKEN
|--------------------------------------------------------------------------
*/

let accessToken = "";

export const setAccessToken = (token) => {
  accessToken =
    typeof token === "string"
      ? token.trim()
      : "";

  if (accessToken) {
    try {
      sessionStorage.setItem(
        "accessToken",
        accessToken
      );
    } catch (error) {
      console.warn(
        "[Axios] Unable to save access token:",
        error
      );
    }
  }
};

export const getAccessToken = () => {
  if (accessToken) {
    return accessToken;
  }

  try {
    return (
      sessionStorage.getItem(
        "accessToken"
      ) || ""
    );
  } catch (error) {
    return "";
  }
};

export const clearAccessToken = () => {
  accessToken = "";

  try {
    sessionStorage.removeItem(
      "accessToken"
    );
  } catch (error) {
    console.warn(
      "[Axios] Unable to clear access token:",
      error
    );
  }
};

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
*/

axiosClient.interceptors.request.use(
  (config) => {
    const token =
      getAccessToken();

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const status =
      error?.response?.status;

    if (status === 401) {
      console.warn(
        "[Axios] Backend returned 401 Unauthorized."
      );
    }

    if (status === 403) {
      console.warn(
        "[Axios] Backend returned 403 Forbidden."
      );
    }

    return Promise.reject(error);
  }
);

export default axiosClient;