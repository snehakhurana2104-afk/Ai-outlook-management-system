// ===========================================================
// authService.js
// Microsoft Entra ID + Microsoft Graph
// ===========================================================

import {
  InteractionRequiredAuthError,
} from "@azure/msal-browser";

import {
  loginRequest,
} from "../config/msalConfig";

// ===========================================================
// ACQUIRE ACCESS TOKEN
// ===========================================================

export const acquireAccessToken = async (
  msalInstance,
  account
) => {
  if (!msalInstance) {
    throw new Error(
      "MSAL instance is required."
    );
  }

  if (!account) {
    throw new Error(
      "Microsoft account is required."
    );
  }

  try {
    const response =
      await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

    if (!response?.accessToken) {
      throw new Error(
        "Access token not returned."
      );
    }

    sessionStorage.setItem(
      "accessToken",
      response.accessToken
    );

    if (response.expiresOn) {
      sessionStorage.setItem(
        "expiresOn",
        response.expiresOn.getTime()
      );
    }

    return response;
  } catch (error) {
    if (
      error instanceof
      InteractionRequiredAuthError
    ) {
      console.warn(
        "[AUTH SERVICE] Interaction required."
      );

      await msalInstance.acquireTokenRedirect({
        ...loginRequest,
        account,
      });

      return null;
    }

    console.error(
      "[AUTH SERVICE] Token acquisition failed:",
      error
    );

    throw error;
  }
};

// ===========================================================
// TOKEN EXPIRATION
// ===========================================================

export const isTokenExpired = () => {
  const expiresOn =
    sessionStorage.getItem(
      "expiresOn"
    );

  if (!expiresOn) {
    return true;
  }

  return (
    Date.now() >
    Number(expiresOn) - 60000
  );
};

// ===========================================================
// GET TOKEN
// ===========================================================

export const getAccessToken = () => {
  return sessionStorage.getItem(
    "accessToken"
  );
};

// ===========================================================
// CLEAR SESSION
// ===========================================================

export const clearSession = () => {
  sessionStorage.removeItem(
    "accessToken"
  );

  sessionStorage.removeItem(
    "expiresOn"
  );
};

// ===========================================================
// LOGOUT
// ===========================================================

export const logout = async (
  msalInstance
) => {
  if (!msalInstance) {
    throw new Error(
      "MSAL instance is required."
    );
  }

  clearSession();

  await msalInstance.logoutRedirect({
    postLogoutRedirectUri:
      `${window.location.origin}/login`,
  });
};

// ===========================================================
// REQUIRED INITIAL SCOPES
// ===========================================================
//
// These are the scopes requested during initial login.
// Extra permissions are handled incrementally.
//

export const REQUIRED_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  "Mail.Read",
  "Mail.Send",
];

// ===========================================================
// OPTIONAL / INCREMENTAL SCOPES
// ===========================================================

export const OPTIONAL_SCOPES = {
  mailWrite: [
    "Mail.ReadWrite",
  ],

  calendar: [
    "Calendars.Read",
  ],

  tasks: [
    "Tasks.Read",
  ],

  contacts: [
    "Contacts.Read",
  ],

  people: [
    "People.Read",
  ],

  presence: [
    "Presence.Read",
  ],

  files: [
    "Files.Read",
  ],

  mailboxSettings: [
    "MailboxSettings.Read",
  ],

  organization: [
    "Directory.Read.All",
  ],
};

// ===========================================================
// VALIDATE SCOPES
// ===========================================================

export const validateScopes = (
  grantedScopes = []
) => {
  return REQUIRED_SCOPES.every(
    (scope) =>
      grantedScopes.includes(scope)
  );
};

// ===========================================================
// GET ACTIVE ACCOUNT
// ===========================================================

export const getActiveAccount = (
  msalInstance
) => {
  if (!msalInstance) {
    return null;
  }

  const activeAccount =
    msalInstance.getActiveAccount();

  if (activeAccount) {
    return activeAccount;
  }

  const accounts =
    msalInstance.getAllAccounts();

  if (!accounts.length) {
    return null;
  }

  msalInstance.setActiveAccount(
    accounts[0]
  );

  return accounts[0];
};

// ===========================================================
// IS AUTHENTICATED
// ===========================================================

export const isAuthenticated = (
  msalInstance
) => {
  if (!msalInstance) {
    return false;
  }

  return (
    msalInstance.getAllAccounts()
      .length > 0
  );
};

// ===========================================================
// DEFAULT EXPORT
// ===========================================================

export default {
  acquireAccessToken,
  logout,
  clearSession,
  getAccessToken,
  isTokenExpired,
  validateScopes,
  getActiveAccount,
  isAuthenticated,
};