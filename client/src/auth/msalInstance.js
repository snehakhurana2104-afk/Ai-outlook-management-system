import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_CLIENT_ID,
    authority:
      process.env.REACT_APP_AUTHORITY ||
      "https://login.microsoftonline.com/common",
    redirectUri:
      process.env.REACT_APP_REDIRECT_URI ||
      window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance =
  new PublicClientApplication(msalConfig);