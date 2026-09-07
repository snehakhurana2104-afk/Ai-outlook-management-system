"use strict";

import {
  PublicClientApplication,
  LogLevel,
  InteractionRequiredAuthError,
} from "@azure/msal-browser";

const CLIENT_ID =
  process.env.REACT_APP_AZURE_CLIENT_ID ||
  process.env.REACT_APP_CLIENT_ID ||
  "";

const TENANT_ID =
  process.env.REACT_APP_AZURE_TENANT_ID ||
  process.env.REACT_APP_TENANT_ID ||
  "common";

const REDIRECT_URI =
  process.env.REACT_APP_AZURE_REDIRECT_URI ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000");

const POST_LOGOUT_REDIRECT_URI =
  process.env.REACT_APP_AZURE_POST_LOGOUT_REDIRECT_URI ||
  (typeof window !== "undefined"
    ? `${window.location.origin}/login`
    : "http://localhost:3000/login");

export const GRAPH_BASE_URL =
  "https://graph.microsoft.com/v1.0";

export const graphAccessScopes = [
  "User.Read",
  "Mail.Read",
  "Mail.ReadWrite",
  "Mail.Send",
  "Calendars.Read",
  "Calendars.ReadWrite",
  "Tasks.ReadWrite",
  "Contacts.Read",
  "People.Read",
  "Files.Read",
  "Presence.Read",
  "MailboxSettings.Read",
];

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "email",
    "User.Read",
  ],
};

export const graphScopes = {
  user: {
    scopes: ["User.Read"],
  },

  mailboxRead: {
    scopes: [
      "User.Read",
      "Mail.Read",
    ],
  },

  mailboxManagement: {
    scopes: [
      "User.Read",
      "Mail.Read",
      "Mail.ReadWrite",
    ],
  },

  mailboxSend: {
    scopes: [
      "User.Read",
      "Mail.Send",
    ],
  },

  calendar: {
    scopes: [
      "User.Read",
      "Calendars.Read",
    ],
  },

  calendarWrite: {
    scopes: [
      "User.Read",
      "Calendars.Read",
      "Calendars.ReadWrite",
    ],
  },

  tasks: {
    scopes: [
      "User.Read",
      "Tasks.ReadWrite",
    ],
  },

  contacts: {
    scopes: [
      "User.Read",
      "Contacts.Read",
    ],
  },

  people: {
    scopes: [
      "User.Read",
      "People.Read",
    ],
  },

  files: {
    scopes: [
      "User.Read",
      "Files.Read",
    ],
  },

  presence: {
    scopes: [
      "User.Read",
      "Presence.Read",
    ],
  },

  mailboxSettings: {
    scopes: [
      "User.Read",
      "MailboxSettings.Read",
    ],
  },

  organization: {
    scopes: [
      "User.Read",
      "Directory.Read.All",
    ],
  },
};

export const msalConfig = {
  auth: {
    clientId:
      CLIENT_ID || "MISSING_CLIENT_ID",
    authority:
      `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri:
      POST_LOGOUT_REDIRECT_URI,
    navigateToLoginRequestUrl: false,
  },

  cache: {
  cacheLocation: "sessionStorage",
  storeAuthStateInCookie: false,
},

  system: {
    allowNativeBroker: false,
    windowHashTimeout: 30000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 6000,
    tokenRenewalOffsetSeconds: 300,

    loggerOptions: {
      logLevel:
        process.env.NODE_ENV === "production"
          ? LogLevel.Warning
          : LogLevel.Warning,

      piiLoggingEnabled: false,

      loggerCallback: (
        level,
        message,
        containsPii
      ) => {
        if (containsPii) {
          return;
        }

        if (level === LogLevel.Error) {
          console.error(
            "[MSAL ERROR]",
            message
          );
        }
      },
    },
  },
};

export const msalInstance =
  new PublicClientApplication(msalConfig);

let initializationPromise = null;
let redirectResultPromise = null;
let initialized = false;

let silentTokenRequests = new Map();
let interactiveTokenPromise = null;

const isBrowser = () =>
  typeof window !== "undefined" &&
  typeof document !== "undefined";

const normalizeScopes = (scopes) => {
  if (Array.isArray(scopes)) {
    return [
      ...new Set(
        scopes.filter(
          (scope) =>
            typeof scope === "string" &&
            scope.trim()
        )
      ),
    ];
  }

  if (
    typeof scopes === "string" &&
    scopes.trim()
  ) {
    return [scopes.trim()];
  }

  return [];
};

const isInteractionInProgressError = (
  error
) => {
  const code = String(
    error?.errorCode ||
      error?.code ||
      ""
  ).toLowerCase();

  const message = String(
    error?.message ||
      error?.errorMessage ||
      ""
  ).toLowerCase();

  return (
    code.includes(
      "interaction_in_progress"
    ) ||
    message.includes(
      "interaction_in_progress"
    )
  );
};

const getCurrentReturnUrl = () => {
  if (!isBrowser()) {
    return "/";
  }

  return (
    window.location.pathname +
    window.location.search +
    window.location.hash
  );
};

const isValidAccessToken = (token) => {
  if (
    typeof token !== "string" ||
    !token.trim()
  ) {
    return false;
  }

  const parts =
    token.trim().split(".");

  return (
    parts.length === 3 &&
    parts.every(Boolean)
  );
};

const decodeJwtPayload = (token) => {
  try {
    if (!isValidAccessToken(token)) {
      return null;
    }

    const payload =
      token.split(".")[1];

    const normalized =
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const padded =
      normalized +
      "=".repeat(
        (4 -
          (normalized.length % 4)) %
          4
      );

    return JSON.parse(
      atob(padded)
    );
  } catch {
    return null;
  }
};

const isGraphAccessToken = (
  token
) => {
  if (!isValidAccessToken(token)) {
    return false;
  }

  const payload =
    decodeJwtPayload(token);

  if (!payload) {
    return false;
  }

  if (!payload.aud) {
    return false;
  }

  return (
    payload.aud ===
      "https://graph.microsoft.com" ||
    payload.aud ===
      "00000003-0000-0000-c000-000000000000"
  );
};

const getActiveAccountSync = () => {
  const active =
    msalInstance.getActiveAccount();

  if (active) {
    return active;
  }

  const accounts =
    msalInstance.getAllAccounts();

  if (
    Array.isArray(accounts) &&
    accounts.length > 0
  ) {
    const account = accounts[0];

    msalInstance.setActiveAccount(
      account
    );

    return account;
  }

  return null;
};

export async function initializeMsal() {
  if (initialized) {
    return {
      success: true,
      account:
        getActiveAccountSync(),
    };
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise =
    (async () => {
      try {
        await msalInstance.initialize();

        if (!redirectResultPromise) {
          redirectResultPromise =
            msalInstance.handleRedirectPromise();
        }

        let redirectResponse = null;

        try {
          redirectResponse =
            await redirectResultPromise;
        } catch (error) {
          if (
            !isInteractionInProgressError(
              error
            )
          ) {
            console.warn(
              "[MSAL] Redirect handling failed:",
              error
            );
          }
        }

        if (
          redirectResponse?.account
        ) {
          msalInstance.setActiveAccount(
            redirectResponse.account
          );
        }

        const account =
          getActiveAccountSync();

        initialized = true;

        return {
          success: true,
          account: account || null,
        };
      } catch (error) {
        initialized = false;
        initializationPromise = null;
        redirectResultPromise = null;

        throw error;
      }
    })();

  return initializationPromise;
}

export function getActiveAccount() {
  return getActiveAccountSync();
}

export function isMicrosoftConnected() {
  return Boolean(
    getActiveAccountSync()
  );
}

export function getMicrosoftAccount() {
  return getActiveAccountSync();
}

export function getMicrosoftUsername() {
  return (
    getActiveAccountSync()
      ?.username || ""
  );
}

export function getMicrosoftDisplayName() {
  const account =
    getActiveAccountSync();

  return (
    account?.name ||
    account?.username ||
    "Microsoft User"
  );
}

export function getMicrosoftAccountId() {
  const account =
    getActiveAccountSync();

  return (
    account?.localAccountId ||
    account?.homeAccountId ||
    ""
  );
}

async function acquireGraphTokenSilently(
  scopes,
  forceRefresh = false
) {
  await initializeMsal();

  const requestedScopes =
    normalizeScopes(scopes);

  if (!requestedScopes.length) {
    throw new Error(
      "Microsoft Graph scopes are required."
    );
  }

  const account =
    getActiveAccountSync();

  if (!account) {
    throw new InteractionRequiredAuthError(
      "No Microsoft account is connected."
    );
  }

  const key =
    `${account.homeAccountId}|${requestedScopes
      .slice()
      .sort()
      .join(" ")}`;

  if (
    !forceRefresh &&
    silentTokenRequests.has(key)
  ) {
    return silentTokenRequests.get(key);
  }

  const requestPromise =
    (async () => {
      try {
        const response =
          await msalInstance.acquireTokenSilent(
            {
              scopes: requestedScopes,
              account,
              forceRefresh,
            }
          );

        const token =
          response?.accessToken?.trim();

        if (
          !isGraphAccessToken(token)
        ) {
          throw new Error(
            "Microsoft Graph returned an invalid access token."
          );
        }

        if (response?.account) {
          msalInstance.setActiveAccount(
            response.account
          );
        }

        return token;
      } finally {
        silentTokenRequests.delete(
          key
        );
      }
    })();

  silentTokenRequests.set(
    key,
    requestPromise
  );

  return requestPromise;
}

export function getGraphTokenForScopes(
  scopes,
  forceRefresh = false
) {
  return acquireGraphTokenSilently(
    scopes,
    forceRefresh
  );
}

export async function getGraphAccessToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Mail.Read",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getMailManagementToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Mail.Read",
      "Mail.ReadWrite",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getMailSendToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Mail.Send",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getCalendarToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Calendars.Read",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getCalendarWriteToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Calendars.Read",
      "Calendars.ReadWrite",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getTasksToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Tasks.ReadWrite",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getTasksReadToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Tasks.ReadWrite",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getTasksWriteToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Tasks.ReadWrite",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getContactsToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Contacts.Read",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getPeopleToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "People.Read",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getFilesToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Files.Read",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getPresenceToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Presence.Read",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getMailboxSettingsToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "MailboxSettings.Read",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function getOrganizationToken(
  options = {}
) {
  return acquireGraphTokenSilently(
    [
      "User.Read",
      "Directory.Read.All",
    ],
    Boolean(
      options?.forceRefresh
    )
  );
}

export async function acquireGraphTokenInteractively(
  mode = "popup"
) {
  await initializeMsal();

  if (interactiveTokenPromise) {
    return interactiveTokenPromise;
  }

  interactiveTokenPromise =
    (async () => {
      const account =
        getActiveAccountSync();

      const request = {
        scopes: [
          "User.Read",
          "Mail.Read",
          "Mail.ReadWrite",
          "Mail.Send",
          "Calendars.Read",
          "Calendars.ReadWrite",
          "Tasks.ReadWrite",
          "Contacts.Read",
          "People.Read",
          "Files.Read",
          "Presence.Read",
          "MailboxSettings.Read",
        ],
        ...(account
          ? { account }
          : {}),
      };

      try {
        let response = null;

        if (mode === "redirect") {
          await msalInstance.acquireTokenRedirect(
            request
          );

          return null;
        }

        response =
          await msalInstance.acquireTokenPopup(
            request
          );

        if (response?.account) {
          msalInstance.setActiveAccount(
            response.account
          );
        }

        const token =
          response?.accessToken?.trim();

        if (
          !isGraphAccessToken(token)
        ) {
          throw new Error(
            "Microsoft Graph did not return a valid access token."
          );
        }

        return token;
      } finally {
        interactiveTokenPromise = null;
      }
    })();

  return interactiveTokenPromise;
}

export async function loginWithMicrosoft() {
  await initializeMsal();

  const account =
    getActiveAccountSync();

  if (account) {
    return account;
  }

  await msalInstance.loginRedirect({
    ...loginRequest,
    redirectUri: REDIRECT_URI,
    state: JSON.stringify({
      type: "login",
      returnUrl:
        getCurrentReturnUrl(),
    }),
  });

  return null;
}

export async function logoutMicrosoft() {
  await initializeMsal();

  const account =
    getActiveAccountSync();

  return msalInstance.logoutRedirect({
    account: account || undefined,
    postLogoutRedirectUri:
      POST_LOGOUT_REDIRECT_URI,
  });
}

export const GRAPH_ENDPOINTS = {
  profile: "/me",
  profilePhoto:
    "/me/photo/$value",

  organization:
    "/organization",

  inbox:
    "/me/mailFolders/inbox/messages",

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

  tasks:
    "/me/todo/lists/{listId}/tasks",

  task:
    "/me/todo/lists/{listId}/tasks/{taskId}",

  contacts:
    "/me/contacts",

  categories:
    "/me/outlook/masterCategories",

  presence:
    "/me/presence",

  drive:
    "/me/drive/root/children",
};

export function getGraphUrl(
  endpoint
) {
  if (
    typeof endpoint !== "string"
  ) {
    throw new Error(
      "Graph endpoint must be a string."
    );
  }

  if (
    endpoint.startsWith(
      "http://"
    ) ||
    endpoint.startsWith(
      "https://"
    )
  ) {
    return endpoint;
  }

  return `${GRAPH_BASE_URL}${
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`
  }`;
}

export function getTaskListUrl() {
  return getGraphUrl(
    GRAPH_ENDPOINTS.taskLists
  );
}

export function getTaskListTasksUrl(
  listId
) {
  if (!listId) {
    throw new Error(
      "Microsoft To Do list ID is required."
    );
  }

  return getGraphUrl(
    GRAPH_ENDPOINTS.tasks.replace(
      "{listId}",
      encodeURIComponent(listId)
    )
  );
}

export function getTaskUrl(
  listId,
  taskId
) {
  if (!listId) {
    throw new Error(
      "Microsoft To Do list ID is required."
    );
  }

  if (!taskId) {
    throw new Error(
      "Microsoft To Do task ID is required."
    );
  }

  return getGraphUrl(
    GRAPH_ENDPOINTS.task
      .replace(
        "{listId}",
        encodeURIComponent(listId)
      )
      .replace(
        "{taskId}",
        encodeURIComponent(taskId)
      )
  );
}

export {
  InteractionRequiredAuthError,
};

export default msalConfig;