// ===========================================================
// client/src/config/msalConfig.js
// Microsoft Entra ID / MSAL Browser Configuration
// AI Outlook Email Intelligence Platform
// ===========================================================

import {
  PublicClientApplication,
  LogLevel,
} from "@azure/msal-browser";

// ===========================================================
// ENVIRONMENT
// ===========================================================

const CLIENT_ID =
  process.env.REACT_APP_AZURE_CLIENT_ID ||
  process.env.REACT_APP_CLIENT_ID;

const TENANT_ID =
  process.env.REACT_APP_AZURE_TENANT_ID ||
  process.env.REACT_APP_TENANT_ID;

const REDIRECT_URI =
  process.env.REACT_APP_AZURE_REDIRECT_URI ||
  "http://localhost:3000";

const POST_LOGOUT_REDIRECT_URI =
  process.env.REACT_APP_AZURE_POST_LOGOUT_REDIRECT_URI ||
  "http://localhost:3000/login";

// ===========================================================
// GRAPH
// ===========================================================

export const GRAPH_BASE_URL =
  "https://graph.microsoft.com/v1.0";

// ===========================================================
// VALIDATION
// ===========================================================

if (!CLIENT_ID) {
  console.error("[MSAL] Missing Microsoft Azure Client ID.");
}

if (!TENANT_ID) {
  console.error("[MSAL] Missing Microsoft Azure Tenant ID.");
}

// ===========================================================
// MSAL CONFIG
// ===========================================================

export const msalConfig = {
  auth: {
    clientId:
      CLIENT_ID || "MISSING_CLIENT_ID",

    authority:
      `https://login.microsoftonline.com/${
        TENANT_ID || "common"
      }`,

    redirectUri:
      REDIRECT_URI,

    postLogoutRedirectUri:
      POST_LOGOUT_REDIRECT_URI,

    navigateToLoginRequestUrl: false,
  },

  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },

  system: {
    allowNativeBroker: false,

    windowHashTimeout: 60000,
    iframeHashTimeout: 10000,
    loadFrameTimeout: 10000,

    loggerOptions: {
      logLevel:
        process.env.NODE_ENV === "production"
          ? LogLevel.Warning
          : LogLevel.Info,

      piiLoggingEnabled: false,

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
              "[MSAL ERROR]",
              message
            );
            break;

          case LogLevel.Warning:
            console.warn(
              "[MSAL WARNING]",
              message
            );
            break;

          case LogLevel.Info:
            console.info(
              "[MSAL INFO]",
              message
            );
            break;

          case LogLevel.Verbose:
            if (
              process.env.NODE_ENV ===
              "development"
            ) {
              console.debug(
                "[MSAL VERBOSE]",
                message
              );
            }
            break;

          default:
            break;
        }
      },
    },
  },
};

// ===========================================================
// MSAL INSTANCE
// ===========================================================

export const msalInstance =
  new PublicClientApplication(
    msalConfig
  );

// ===========================================================
// LOGIN REQUEST
// ===========================================================

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "email",
    "User.Read",
    "Mail.Read",
  ],
};

// ===========================================================
// GRAPH ACCESS SCOPES
// ===========================================================

export const graphAccessScopes = [
  "User.Read",
  "Mail.Read",
  "Mail.ReadWrite",
  "Mail.Send",
  "Calendars.Read",
  "Calendars.ReadWrite",
  "Tasks.ReadWrite",
];

// ===========================================================
// GRAPH SCOPE OBJECT
// ===========================================================

export const graphScopes = {
  user: {
    scopes: ["User.Read"],
  },

  mailboxRead: {
    scopes: ["Mail.Read"],
  },

  mailboxManagement: {
    scopes: ["Mail.ReadWrite"],
  },

  mailboxSend: {
    scopes: ["Mail.Send"],
  },

  calendar: {
    scopes: ["Calendars.Read"],
  },

  calendarWrite: {
    scopes: ["Calendars.ReadWrite"],
  },

  tasks: {
    scopes: ["Tasks.ReadWrite"],
  },

  contacts: {
    scopes: ["Contacts.Read"],
  },

  people: {
    scopes: ["People.Read"],
  },

  files: {
    scopes: ["Files.Read"],
  },

  presence: {
    scopes: ["Presence.Read"],
  },

  mailboxSettings: {
    scopes: ["MailboxSettings.Read"],
  },

  organization: {
    scopes: ["Directory.Read.All"],
  },
};

// ===========================================================
// ACTIVE ACCOUNT
// ===========================================================

export function getActiveAccount() {
  const active =
    msalInstance.getActiveAccount();

  if (active) {
    return active;
  }

  const accounts =
    msalInstance.getAllAccounts();

  if (
    accounts &&
    accounts.length > 0
  ) {
    msalInstance.setActiveAccount(
      accounts[0]
    );

    return accounts[0];
  }

  return null;
}

// ===========================================================
// INITIALIZE MSAL
// IMPORTANT
// ===========================================================

let msalInitialized = false;

export async function initializeMsal() {
  if (msalInitialized) {
    return;
  }

  await msalInstance.initialize();

  msalInitialized = true;

  // ---------------------------------------------------------
  // HANDLE REDIRECT RESPONSE
  // ---------------------------------------------------------

  try {
    const response =
      await msalInstance.handleRedirectPromise();

    if (response?.account) {
      msalInstance.setActiveAccount(
        response.account
      );

      console.log(
        "[MSAL] Redirect account:",
        response.account.username
      );
    }
  } catch (error) {
    console.error(
      "[MSAL] Redirect handling failed:",
      error
    );

    throw error;
  }

  // ---------------------------------------------------------
  // RESTORE EXISTING ACCOUNT
  // ---------------------------------------------------------

  getActiveAccount();
}

// ===========================================================
// ENSURE INITIALIZED
// ===========================================================

async function ensureMsalInitialized() {
  if (!msalInitialized) {
    await initializeMsal();
  }
}

// ===========================================================
// GET GRAPH ACCESS TOKEN
// ===========================================================

export async function getGraphAccessToken() {
  await ensureMsalInitialized();

  const account =
    getActiveAccount();

  if (!account) {
    throw new Error(
      "Microsoft account is not connected."
    );
  }

  // ---------------------------------------------------------
  // SILENT TOKEN
  // ---------------------------------------------------------

  try {
    console.log(
      "[MSAL] Acquiring Graph token silently..."
    );

    const response =
      await msalInstance.acquireTokenSilent({
        scopes: [
          "User.Read",
          "Mail.Read",
        ],

        account,

        redirectUri:
          REDIRECT_URI,
      });

    if (
      response?.accessToken
    ) {
      return response.accessToken;
    }
  } catch (silentError) {
    console.warn(
      "[MSAL] Silent token failed:",
      silentError
    );
  }

  // ---------------------------------------------------------
  // POPUP FALLBACK
  // ---------------------------------------------------------

  try {
    console.log(
      "[MSAL] Requesting Mail.Read consent..."
    );

    const response =
      await msalInstance.acquireTokenPopup({
        scopes: [
          "User.Read",
          "Mail.Read",
        ],

        account,

        redirectUri:
          REDIRECT_URI,
      });

    if (
      response?.account
    ) {
      msalInstance.setActiveAccount(
        response.account
      );
    }

    if (
      response?.accessToken
    ) {
      return response.accessToken;
    }

    throw new Error(
      "Microsoft Graph did not return an access token."
    );
  } catch (error) {
    console.error(
      "[MSAL] Graph token acquisition failed:",
      error
    );

    throw error;
  }
}

// ===========================================================
// GENERIC GRAPH TOKEN
// ===========================================================

export async function getGraphTokenForScopes(
  scopes
) {
  await ensureMsalInitialized();

  const account =
    getActiveAccount();

  if (!account) {
    throw new Error(
      "Microsoft account is not connected."
    );
  }

  const requestedScopes =
    Array.isArray(scopes)
      ? scopes
      : [scopes];

  try {
    const response =
      await msalInstance.acquireTokenSilent({
        scopes:
          requestedScopes,

        account,

        redirectUri:
          REDIRECT_URI,
      });

    if (
      response?.accessToken
    ) {
      return response.accessToken;
    }
  } catch (silentError) {
    console.warn(
      "[MSAL] Silent token failed:",
      silentError
    );
  }

  const response =
    await msalInstance.acquireTokenPopup({
      scopes:
        requestedScopes,

      account,

      redirectUri:
        REDIRECT_URI,
    });

  if (
    response?.account
  ) {
    msalInstance.setActiveAccount(
      response.account
    );
  }

  return response.accessToken;
}

// ===========================================================
// LOGIN
// ===========================================================

export async function loginWithMicrosoft() {
  await ensureMsalInitialized();

  console.log(
    "[MSAL] Starting Microsoft login..."
  );

  try {
    await msalInstance.loginRedirect({
      ...loginRequest,

      redirectUri:
        REDIRECT_URI,
    });
  } catch (error) {
    console.error(
      "[MSAL] Microsoft login failed:",
      error
    );

    throw error;
  }
}

// ===========================================================
// LOGOUT
// ===========================================================

export async function logoutMicrosoft() {
  await ensureMsalInitialized();

  const account =
    getActiveAccount();

  try {
    await msalInstance.logoutRedirect({
      account:
        account || undefined,

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

// ===========================================================
// CONNECTION HELPERS
// ===========================================================

export function isMicrosoftConnected() {
  return Boolean(
    getActiveAccount()
  );
}

export function getMicrosoftAccount() {
  return getActiveAccount();
}

// ===========================================================
// GRAPH ENDPOINTS
// ===========================================================

export const GRAPH_ENDPOINTS = {
  profile:
    "/me",

  profilePhoto:
    "/me/photo/$value",

  organization:
    "/organization",

  inbox:
    "/me/mailFolders/Inbox/messages",

  sent:
    "/me/mailFolders/SentItems/messages",

  drafts:
    "/me/mailFolders/Drafts/messages",

  deleted:
    "/me/mailFolders/DeletedItems/messages",

  messages:
    "/me/messages",

  sendMail:
    "/me/sendMail",

  calendar:
    "/me/events",

  calendarView:
    "/me/calendarView",

  taskLists:
    "/me/todo/lists",

  contacts:
    "/me/contacts",

  categories:
    "/me/outlook/masterCategories",

  presence:
    "/me/presence",

  drive:
    "/me/drive/root/children",
};

// ===========================================================
// DEVELOPMENT LOG
// ===========================================================

if (
  process.env.NODE_ENV ===
  "development"
) {
  console.group(
    "[MSAL] Configuration"
  );

  console.info(
    "Client ID:",
    CLIENT_ID
      ? "Configured"
      : "Missing"
  );

  console.info(
    "Tenant ID:",
    TENANT_ID
      ? "Configured"
      : "Missing"
  );

  console.info(
    "Authority:",
    msalConfig.auth.authority
  );

  console.info(
    "Redirect URI:",
    REDIRECT_URI
  );

  console.info(
    "Graph URL:",
    GRAPH_BASE_URL
  );

  console.groupEnd();
}

// ===========================================================
// DEFAULT EXPORT
// ===========================================================

export default msalConfig;