import {
  PublicClientApplication,
  LogLevel,
} from "@azure/msal-browser";

/* =========================================================
   ENVIRONMENT
========================================================= */

const CLIENT_ID =
  process.env.REACT_APP_AZURE_CLIENT_ID;

const TENANT_ID =
  process.env.REACT_APP_AZURE_TENANT_ID;

const REDIRECT_URI =
  process.env.REACT_APP_AZURE_REDIRECT_URI ||
  "http://localhost:3000/auth/callback";

const POST_LOGOUT_REDIRECT_URI =
  process.env.REACT_APP_AZURE_POST_LOGOUT_REDIRECT_URI ||
  "http://localhost:3000/login";

/* =========================================================
   VALIDATION
========================================================= */

if (!CLIENT_ID) {
  console.error(
    "[MSAL] Missing REACT_APP_AZURE_CLIENT_ID"
  );
}

if (!TENANT_ID) {
  console.error(
    "[MSAL] Missing REACT_APP_AZURE_TENANT_ID"
  );
}

/* =========================================================
   AUTHORITY
========================================================= */

const authority = TENANT_ID
  ? `https://login.microsoftonline.com/${TENANT_ID}`
  : "https://login.microsoftonline.com/common";

/* =========================================================
   MSAL CONFIGURATION
========================================================= */

export const msalConfig = {
  auth: {
    clientId: CLIENT_ID || "",

    authority,

    redirectUri: REDIRECT_URI,

    postLogoutRedirectUri:
      POST_LOGOUT_REDIRECT_URI,

    navigateToLoginRequestUrl: false,
  },

  cache: {
    cacheLocation: "localStorage",

    storeAuthStateInCookie: false,
  },

  system: {
    loggerOptions: {
      loggerCallback: (
        level,
        message,
        containsPii
      ) => {
        if (containsPii) {
          return;
        }

        switch (level) {
          case LogLevel.Error:
            console.error(
              "[MSAL]",
              message
            );
            break;

          case LogLevel.Warning:
            console.warn(
              "[MSAL]",
              message
            );
            break;

          case LogLevel.Info:
            console.info(
              "[MSAL]",
              message
            );
            break;

          case LogLevel.Verbose:
            console.debug(
              "[MSAL]",
              message
            );
            break;

          default:
            break;
        }
      },
    },
  },
};

/* =========================================================
   LOGIN SCOPES
========================================================= */

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "email",
    "User.Read",
    "Mail.Read",
    "Mail.ReadWrite",
    "Mail.Send",
    "Calendars.Read",
  ],
};

/* =========================================================
   GRAPH TOKEN SCOPES
========================================================= */

export const graphTokenRequest = {
  scopes: [
    "User.Read",
    "Mail.Read",
    "Mail.ReadWrite",
    "Mail.Send",
    "Calendars.Read",
  ],
};

/* =========================================================
   MSAL INSTANCE
========================================================= */

export const msalInstance =
  new PublicClientApplication(
    msalConfig
  );

/* =========================================================
   ACTIVE ACCOUNT
========================================================= */

export function getActiveAccount() {
  let account =
    msalInstance.getActiveAccount();

  if (account) {
    return account;
  }

  const accounts =
    msalInstance.getAllAccounts();

  if (accounts.length > 0) {
    msalInstance.setActiveAccount(
      accounts[0]
    );

    return accounts[0];
  }

  return null;
}

/* =========================================================
   GET GRAPH TOKEN
========================================================= */

export async function getGraphAccessToken() {
  const account =
    getActiveAccount();

  if (!account) {
    throw new Error(
      "Microsoft account is not connected."
    );
  }

  try {
    const response =
      await msalInstance.acquireTokenSilent({
        ...graphTokenRequest,
        account,
      });

    if (response?.accessToken) {
      return response.accessToken;
    }

    throw new Error(
      "Microsoft Graph access token was not returned."
    );
  } catch (silentError) {
    console.warn(
      "[MSAL] Silent token acquisition failed:",
      silentError
    );

    try {
      const response =
        await msalInstance.acquireTokenPopup(
          graphTokenRequest
        );

      if (response?.account) {
        msalInstance.setActiveAccount(
          response.account
        );
      }

      if (!response?.accessToken) {
        throw new Error(
          "Microsoft Graph access token was not returned."
        );
      }

      return response.accessToken;
    } catch (popupError) {
      console.error(
        "[MSAL] Graph token acquisition failed:",
        popupError
      );

      throw popupError;
    }
  }
}

/* =========================================================
   MICROSOFT LOGIN
========================================================= */

export async function loginWithMicrosoft() {
  try {
    const response =
      await msalInstance.loginPopup(
        loginRequest
      );

    if (response?.account) {
      msalInstance.setActiveAccount(
        response.account
      );
    }

    return response;
  } catch (error) {
    console.error(
      "[MSAL] Microsoft login failed:",
      error
    );

    throw error;
  }
}

/* =========================================================
   MICROSOFT LOGOUT
========================================================= */

export async function logoutMicrosoft() {
  const account =
    getActiveAccount();

  try {
    await msalInstance.logoutPopup({
      account: account || undefined,

      postLogoutRedirectUri:
        POST_LOGOUT_REDIRECT_URI,
    });
  } catch (error) {
    console.error(
      "[MSAL] Logout failed:",
      error
    );

    throw error;
  }
}

/* =========================================================
   CONNECTION CHECK
========================================================= */

export function isMicrosoftConnected() {
  return Boolean(
    getActiveAccount()
  );
}

/* =========================================================
   ACCOUNT DETAILS
========================================================= */

export function getMicrosoftAccount() {
  return getActiveAccount();
}