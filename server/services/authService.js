"use strict";

const axios = require("axios");

const TOKEN_URL = `https://login.microsoftonline.com/${
  process.env.TENANT_ID || "common"
}/oauth2/v2.0/token`;

const getAccessToken = async () => {
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "CLIENT_ID, CLIENT_SECRET and TENANT_ID are required."
    );
  }

  const params = new URLSearchParams();

  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      params.toString(),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        timeout: 30000,
      }
    );

    if (!response.data?.access_token) {
      throw new Error(
        "Microsoft access token was not returned."
      );
    }

    return response.data.access_token;
  } catch (error) {
    const message =
      error?.response?.data?.error_description ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Unable to acquire Microsoft Graph access token.";

    console.error(
      "[AuthService] Microsoft token error:",
      message
    );

    throw new Error(message);
  }
};

const clearSession = () => {
  return true;
};

const isTokenExpired = () => {
  return false;
};

const validateScopes = () => {
  return true;
};

const getActiveAccount = () => {
  return null;
};

const isAuthenticated = () => {
  return Boolean(
    process.env.CLIENT_ID &&
    process.env.CLIENT_SECRET &&
    process.env.TENANT_ID
  );
};

const logout = async () => {
  return true;
};

const REQUIRED_SCOPES = [
  "https://graph.microsoft.com/.default",
];

module.exports = {
  getAccessToken,
  acquireAccessToken: getAccessToken,
  clearSession,
  isTokenExpired,
  validateScopes,
  getActiveAccount,
  isAuthenticated,
  logout,
  REQUIRED_SCOPES,
};