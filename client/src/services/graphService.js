import {
  initializeMsal,
  getActiveAccount as getMsalActiveAccount,
  getGraphTokenForScopes,
  acquireGraphTokenInteractively as acquireMsalGraphTokenInteractively,
  graphAccessScopes,
} from "../config/msalConfig";

export { initializeMsal };

export const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

const RAW_API_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:5000";

const API_ROOT = RAW_API_URL
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

export const TOKEN_SCOPES = {
  user: ["User.Read"],
  mailRead: ["User.Read", "Mail.Read"],
  mailWrite: ["User.Read", "Mail.Read", "Mail.ReadWrite"],
  mailSend: ["User.Read", "Mail.Send"],
  calendar: ["User.Read", "Calendars.Read"],
  calendarWrite: ["User.Read", "Calendars.Read", "Calendars.ReadWrite"],
  tasks: ["User.Read", "Tasks.ReadWrite"],
  contacts: ["User.Read", "Contacts.Read"],
  people: ["User.Read", "People.Read"],
  files: ["User.Read", "Files.Read"],
  presence: ["User.Read", "Presence.Read"],
  mailboxSettings: ["User.Read", "MailboxSettings.Read"],
};

export class GraphInteractionRequiredError extends Error {
  constructor(message = "Microsoft Graph authorization is required.") {
    super(message);
    this.name = "GraphInteractionRequiredError";
    this.code = "GRAPH_INTERACTION_REQUIRED";
  }
}

const tokenPromises = new Map();

const normalizeScopes = (scopes) => {
  const source =
    Array.isArray(scopes) && scopes.length
      ? scopes
      : TOKEN_SCOPES.user;

  return [
    ...new Set(
      source
        .filter(Boolean)
        .map((item) => String(item).trim())
        .filter(Boolean)
    ),
  ];
};

const scopeKey = (scopes) =>
  normalizeScopes(scopes)
    .map((item) => item.toLowerCase())
    .sort()
    .join(" ");

const accountKey = (account) =>
  account?.homeAccountId ||
  account?.localAccountId ||
  account?.username ||
  account?.email ||
  "anonymous";

const isInteractionError = (error) => {
  if (!error) return false;

  const code = String(
    error.code ||
      error.errorCode ||
      error.name ||
      ""
  ).toLowerCase();

  const message = String(
    error.message || ""
  ).toLowerCase();

  return (
    code.includes("interaction_required") ||
    code.includes("interactionrequired") ||
    code.includes("consent_required") ||
    code.includes("login_required") ||
    message.includes("interaction required") ||
    message.includes("interaction_required") ||
    message.includes("consent required") ||
    message.includes("login required")
  );
};

const decodeBase64Url = (value) => {
  try {
    const normalized = value
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded =
      normalized +
      "=".repeat(
        (4 - (normalized.length % 4)) % 4
      );

    return atob(padded);
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  try {
    const decoded = decodeBase64Url(parts[1]);

    if (!decoded) return null;

    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const isGraphToken = (token) => {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return false;
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return false;
  }

  const audience = payload.aud;

  if (typeof audience === "string") {
    return (
      audience === "https://graph.microsoft.com" ||
      audience === "00000003-0000-0000-c000-000000000000"
    );
  }

  if (Array.isArray(audience)) {
    return audience.some(
      (item) =>
        item === "https://graph.microsoft.com" ||
        item === "00000003-0000-0000-c000-000000000000"
    );
  }

  return false;
};

export const isTokenValid = (token) => {
  if (!isGraphToken(token)) {
    return false;
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return false;
  }

  if (
    payload.exp &&
    Number(payload.exp) <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  return true;
};

const getValidToken = async ({
  scopes = TOKEN_SCOPES.user,
  forceRefresh = false,
} = {}) => {
  await initializeMsal();

  const account = await getMsalActiveAccount();

  if (!account) {
    throw new GraphInteractionRequiredError(
      "No Microsoft account is signed in."
    );
  }

  const normalized = normalizeScopes(scopes);

  const key = [
    accountKey(account),
    scopeKey(normalized),
    forceRefresh ? "refresh" : "normal",
  ].join("|");

  if (tokenPromises.has(key)) {
    return tokenPromises.get(key);
  }

  const promise = (async () => {
    try {
      const token = await getGraphTokenForScopes(
        normalized,
        Boolean(forceRefresh)
      );

      if (!token) {
        throw new GraphInteractionRequiredError(
          "Microsoft Graph access token is missing."
        );
      }

      if (!isGraphToken(token)) {
        throw new Error(
          "Microsoft Graph returned an invalid access token."
        );
      }

      return token;
    } catch (error) {
      if (error instanceof GraphInteractionRequiredError) {
        throw error;
      }

      if (isInteractionError(error)) {
        throw new GraphInteractionRequiredError(
          "Microsoft Graph authorization is required."
        );
      }

      throw error;
    }
  })();

  tokenPromises.set(key, promise);

  try {
    return await promise;
  } finally {
    tokenPromises.delete(key);
  }
};

export const getGraphAccessToken = async ({
  scopes = TOKEN_SCOPES.user,
  forceRefresh = false,
} = {}) => {
  return getValidToken({
    scopes,
    forceRefresh,
  });
};

export const getAccessToken = getGraphAccessToken;

export const getTokenForFeature = async (
  feature,
  forceRefresh = false
) => {
  const scopes =
    TOKEN_SCOPES[feature] || TOKEN_SCOPES.user;

  return getGraphAccessToken({
    scopes,
    forceRefresh,
  });
};

export const getTokenScopes = (feature) =>
  normalizeScopes(
    TOKEN_SCOPES[feature] || TOKEN_SCOPES.user
  );

export const getMailReadToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.mailRead,
  });

export const getMailWriteToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.mailWrite,
  });

export const getMailSendToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.mailSend,
  });

export const getMailManagementToken =
  getMailWriteToken;

export const getCalendarToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.calendar,
  });

export const getCalendarReadToken =
  getCalendarToken;

export const getCalendarWriteToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.calendarWrite,
  });

export const getTasksToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.tasks,
  });

export const getTasksReadToken =
  getTasksToken;

export const getTasksWriteToken =
  getTasksToken;

export const getContactsToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.contacts,
  });

export const getPeopleToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.people,
  });

export const getFilesToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.files,
  });

export const getPresenceToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.presence,
  });

export const getMailboxSettingsToken = () =>
  getGraphAccessToken({
    scopes: TOKEN_SCOPES.mailboxSettings,
  });

export const acquireGraphTokenInteractively =
  async (
    scopes = graphAccessScopes,
    options = {}
  ) => {
    try {
      return await acquireMsalGraphTokenInteractively(
        normalizeScopes(scopes),
        options
      );
    } catch (error) {
      if (isInteractionError(error)) {
        throw new GraphInteractionRequiredError(
          error?.message ||
            "Microsoft Graph interactive authorization is required."
        );
      }

      throw error;
    }
  };

export const acquireGraphTokenInteractivelySafe =
  acquireGraphTokenInteractively;

export const getActiveAccountSafe = async () => {
  try {
    await initializeMsal();
    return await getMsalActiveAccount();
  } catch {
    return null;
  }
};

export const getActiveAccount =
  getActiveAccountSafe;

export const getApiRoot = () =>
  API_ROOT;

export const getGraphBaseUrl = () =>
  GRAPH_BASE_URL;

export const getRequestUrl = (path = "") => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (String(path).startsWith("/api/")) {
    return `${API_ROOT}${path}`;
  }

  return `${API_ROOT}/api/${String(path).replace(/^\/+/, "")}`;
};

export const getRequestUrlSafe =
  getRequestUrl;

const parseResponseBody = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const extractErrorMessage = (data, status) => {
  if (
    typeof data === "string" &&
    data.trim()
  ) {
    return data;
  }

  return (
    data?.message ||
    data?.error?.message ||
    data?.error_description ||
    data?.detail ||
    `Request failed with status ${status}.`
  );
};

export const normalizeApiResponse = (data) => {
  if (!data) {
    return {
      success: true,
      data: null,
      value: [],
    };
  }

  if (Array.isArray(data)) {
    return {
      success: true,
      data,
      value: data,
    };
  }

  return {
    ...data,
    success: data.success !== false,
    data:
      data.data ??
      data.value ??
      data,
    value:
      Array.isArray(data.value)
        ? data.value
        : Array.isArray(data.data)
        ? data.data
        : [],
  };
};

export const getScopesForPath = (path = "") => {
  const value = String(path).toLowerCase();

  if (
    value.includes("/calendar") ||
    value.includes("/event")
  ) {
    if (
      value.includes("post") ||
      value.includes("patch") ||
      value.includes("delete")
    ) {
      return TOKEN_SCOPES.calendarWrite;
    }

    return TOKEN_SCOPES.calendar;
  }

  if (
    value.includes("/task") ||
    value.includes("/todo")
  ) {
    return TOKEN_SCOPES.tasks;
  }

  if (
    value.includes("/send") ||
    value.includes("/reply")
  ) {
    return TOKEN_SCOPES.mailSend;
  }

  if (
    value.includes("/message") ||
    value.includes("/mail") ||
    value.includes("/inbox")
  ) {
    return TOKEN_SCOPES.mailWrite;
  }

  return TOKEN_SCOPES.user;
};

export const getScopesForBackendPath =
  getScopesForPath;

export const backendRequest = async (
  method,
  path,
  body = undefined,
  options = {}
) => {
  const requestMethod = String(
    method || "GET"
  ).toUpperCase();

  const scopes =
    options.scopes ||
    getScopesForPath(path);

  const forceRefresh =
    Boolean(options.forceRefresh);

  let token = await getGraphAccessToken({
    scopes,
    forceRefresh,
  });

  if (!isGraphToken(token)) {
    throw new Error(
      "Invalid Microsoft Graph access token."
    );
  }

  const url = getRequestUrl(path);

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...(body !== undefined
      ? {
          "Content-Type": "application/json",
        }
      : {}),
    ...(options.headers || {}),
  };

  let response = await fetch(url, {
    method: requestMethod,
    headers,
    body:
      body !== undefined
        ? JSON.stringify(body)
        : undefined,
    credentials:
      options.credentials || "include",
    signal: options.signal,
  });

  let data = await parseResponseBody(response);

  if (
    response.status === 401 &&
    !forceRefresh
  ) {
    token = await getGraphAccessToken({
      scopes,
      forceRefresh: true,
    });

    response = await fetch(url, {
      method: requestMethod,
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
      credentials:
        options.credentials || "include",
      signal: options.signal,
    });

    data = await parseResponseBody(response);
  }

  if (!response.ok) {
    const error = new Error(
      extractErrorMessage(
        data,
        response.status
      )
    );

    error.status = response.status;
    error.response = data;

    throw error;
  }

  return data;
};

export const requestBackend =
  backendRequest;

const graphUrl = (endpoint) => {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  if (String(endpoint).startsWith("/v1.0")) {
    return `https://graph.microsoft.com${endpoint}`;
  }

  return `${GRAPH_BASE_URL}/${String(endpoint).replace(
    /^\/+/,
    ""
  )}`;
};

export const graphRequest = async (
  endpoint,
  options = {}
) => {
  const {
    method = "GET",
    body,
    scopes = TOKEN_SCOPES.mailRead,
    forceRefresh = false,
    headers = {},
    signal,
  } = options;

  let token = await getGraphAccessToken({
    scopes,
    forceRefresh,
  });

  if (!isGraphToken(token)) {
    throw new Error(
      "Invalid Microsoft Graph access token."
    );
  }

  const url = graphUrl(endpoint);

  const makeRequest = (accessToken) =>
    fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(body !== undefined
          ? {
              "Content-Type": "application/json",
            }
          : {}),
        ...headers,
      },
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
      signal,
    });

  let response = await makeRequest(token);
  let data = await parseResponseBody(response);

  if (
    response.status === 401 &&
    !forceRefresh
  ) {
    token = await getGraphAccessToken({
      scopes,
      forceRefresh: true,
    });

    response = await makeRequest(token);
    data = await parseResponseBody(response);
  }

  if (!response.ok) {
    const error = new Error(
      extractErrorMessage(
        data,
        response.status
      )
    );

    error.status = response.status;
    error.response = data;
    error.endpoint = endpoint;

    throw error;
  }

  return data;
};

export const requestGraph =
  graphRequest;

export const getGraphRequest =
  graphRequest;

export const getAllGraphPages = async (
  endpoint,
  tokenOrOptions = undefined,
  maxItems = 5000,
  scopes = TOKEN_SCOPES.mailRead
) => {
  let suppliedToken = null;
  let options = {};

  if (
    typeof tokenOrOptions === "string"
  ) {
    suppliedToken = tokenOrOptions;
  } else if (
    tokenOrOptions &&
    typeof tokenOrOptions === "object"
  ) {
    options = tokenOrOptions;
  }

  const effectiveScopes =
    options.scopes ||
    scopes ||
    TOKEN_SCOPES.mailRead;

  const limit =
    Number.isFinite(
      Number(options.maxItems)
    )
      ? Number(options.maxItems)
      : Number(maxItems) || 5000;

  let token = suppliedToken;

  if (!isGraphToken(token)) {
    token = await getGraphAccessToken({
      scopes: effectiveScopes,
      forceRefresh: Boolean(
        options.forceRefresh
      ),
    });
  }

  const results = [];
  let next = graphUrl(endpoint);
  let retried = false;

  while (
    next &&
    results.length < limit
  ) {
    const response = await fetch(next, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: options.signal,
    });

    const data =
      await parseResponseBody(response);

    if (
      response.status === 401 &&
      !retried
    ) {
      token = await getGraphAccessToken({
        scopes: effectiveScopes,
        forceRefresh: true,
      });

      retried = true;
      continue;
    }

    if (!response.ok) {
      const error = new Error(
        extractErrorMessage(
          data,
          response.status
        )
      );

      error.status = response.status;
      error.response = data;

      throw error;
    }

    const pageItems =
      Array.isArray(data?.value)
        ? data.value
        : [];

    for (const item of pageItems) {
      if (results.length >= limit) {
        break;
      }

      results.push(item);
    }

    next =
      data?.["@odata.nextLink"] ||
      data?.nextLink ||
      null;
  }

  return results;
};

export const fetchGraphPages = async (
  endpoint,
  options = {}
) =>
  getAllGraphPages(
    endpoint,
    options
  );

export const getUserProfile = async () => {
  const data = await graphRequest(
    "/me?$select=id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,companyName,officeLocation",
    {
      scopes: TOKEN_SCOPES.user,
    }
  );

  return {
    success: true,
    connected: true,
    profile: data,
    user: data,
    data,
    ...data,
  };
};

export const getProfile =
  getUserProfile;

export const getMicrosoftProfile =
  getUserProfile;

export const getProfileData =
  getUserProfile;

export const getOutlookMe =
  getUserProfile;

export const getOutlookProfile =
  getUserProfile;

export const getOutlookStatus =
  async () => {
    const data = await graphRequest(
      "/me?$select=id,displayName,mail,userPrincipalName",
      {
        scopes: TOKEN_SCOPES.user,
      }
    );

    return {
      success: true,
      connected: true,
      graphConnected: true,
      profile: data,
      data,
      ...data,
    };
  };

export const getGraphHealth =
  getOutlookStatus;

export const getConnectionStatus =
  async () => {
    try {
      const result =
        await getOutlookStatus();

      return {
        connected: true,
        graphConnected: true,
        success: true,
        ...result,
      };
    } catch (error) {
      return {
        connected: false,
        graphConnected: false,
        success: false,
        error:
          error?.message ||
          "Microsoft Graph connection failed.",
      };
    }
  };

export const checkGraphConnection =
  async () => {
    try {
      const token =
        await getGraphAccessToken({
          scopes: TOKEN_SCOPES.user,
        });

      const connected =
        Boolean(isGraphToken(token));

      return {
        connected,
        graphConnected: connected,
        success: connected,
      };
    } catch {
      return {
        connected: false,
        graphConnected: false,
        success: false,
      };
    }
  };

const MESSAGE_FIELDS = [
  "id",
  "subject",
  "from",
  "sender",
  "toRecipients",
  "ccRecipients",
  "bccRecipients",
  "receivedDateTime",
  "sentDateTime",
  "bodyPreview",
  "body",
  "isRead",
  "importance",
  "flag",
  "categories",
  "conversationId",
  "hasAttachments",
  "webLink",
  "isDraft",
].join(",");

export const getOutlookInbox =
  async ({
    top = 100,
    select = MESSAGE_FIELDS,
    filter,
    orderby = "receivedDateTime desc",
  } = {}) => {
    const safeTop = Math.min(
      Math.max(Number(top) || 100, 1),
      100
    );

    const params =
      new URLSearchParams();

    params.set(
      "$top",
      String(safeTop)
    );

    params.set(
      "$select",
      select
    );

    if (filter) {
      params.set(
        "$filter",
        filter
      );
    }

    if (orderby) {
      params.set(
        "$orderby",
        orderby
      );
    }

    const items =
      await getAllGraphPages(
        `/me/mailFolders/inbox/messages?${params.toString()}`,
        {
          scopes:
            TOKEN_SCOPES.mailRead,
          maxItems:
            safeTop,
        }
      );

    return {
      success: true,
      connected: true,
      count: items.length,
      emails: items,
      messages: items,
      value: items,
      data: items,
      source: "Microsoft Graph Inbox",
    };
  };

export const getInbox =
  getOutlookInbox;

export const getInboxData =
  getOutlookInbox;

export const getInboxMessages =
  getOutlookInbox;

export const getMail =
  getOutlookInbox;

export const getOutlookMail =
  getOutlookInbox;

export const getOutlookMessages =
  async ({
    folder = "inbox",
    top = 100,
    filter,
    orderby = "receivedDateTime desc",
    select = MESSAGE_FIELDS,
  } = {}) => {
    const safeTop = Math.min(
      Math.max(Number(top) || 100, 1),
      100
    );

    const params =
      new URLSearchParams();

    params.set(
      "$top",
      String(safeTop)
    );

    params.set(
      "$select",
      select
    );

    if (filter) {
      params.set(
        "$filter",
        filter
      );
    }

    if (orderby) {
      params.set(
        "$orderby",
        orderby
      );
    }

    const items =
      await getAllGraphPages(
        `/me/mailFolders/${encodeURIComponent(
          folder
        )}/messages?${params.toString()}`,
        {
          scopes:
            TOKEN_SCOPES.mailRead,
          maxItems:
            safeTop,
        }
      );

    return {
      success: true,
      connected: true,
      count: items.length,
      emails: items,
      messages: items,
      value: items,
      data: items,
    };
  };

export const getOutlookMessagesData =
  getOutlookMessages;

export const getOutlookMessage =
  async (messageId) => {
    if (!messageId) {
      throw new Error(
        "Message ID is required."
      );
    }

    return graphRequest(
      `/me/messages/${encodeURIComponent(
        messageId
      )}?$select=${MESSAGE_FIELDS}`,
      {
        scopes:
          TOKEN_SCOPES.mailRead,
      }
    );
  };

export const getMessage =
  getOutlookMessage;

export const getEmailById =
  getOutlookMessage;

export const updateOutlookMessage =
  async (
    messageId,
    payload
  ) => {
    if (!messageId) {
      throw new Error(
        "Message ID is required."
      );
    }

    return graphRequest(
      `/me/messages/${encodeURIComponent(
        messageId
      )}`,
      {
        method: "PATCH",
        scopes:
          TOKEN_SCOPES.mailWrite,
        body: payload,
      }
    );
  };

export const markEmailAsRead =
  (messageId) =>
    updateOutlookMessage(
      messageId,
      {
        isRead: true,
      }
    );

export const markEmailAsUnread =
  (messageId) =>
    updateOutlookMessage(
      messageId,
      {
        isRead: false,
      }
    );

export const markRead =
  markEmailAsRead;

export const markUnread =
  markEmailAsUnread;

export const deleteOutlookMessage =
  async (messageId) => {
    if (!messageId) {
      throw new Error(
        "Message ID is required."
      );
    }

    return graphRequest(
      `/me/messages/${encodeURIComponent(
        messageId
      )}`,
      {
        method: "DELETE",
        scopes:
          TOKEN_SCOPES.mailWrite,
      }
    );
  };

export const deleteOutlookMessageById =
  deleteOutlookMessage;

export const deleteEmail =
  deleteOutlookMessage;

export const moveOutlookMessage =
  async (
    messageId,
    destinationId
  ) => {
    if (!messageId) {
      throw new Error(
        "Message ID is required."
      );
    }

    if (!destinationId) {
      throw new Error(
        "Destination folder ID is required."
      );
    }

    return graphRequest(
      `/me/messages/${encodeURIComponent(
        messageId
      )}/move`,
      {
        method: "POST",
        scopes:
          TOKEN_SCOPES.mailWrite,
        body: {
          destinationId,
        },
      }
    );
  };

export const moveEmail =
  moveOutlookMessage;

const normalizeRecipient = (
  recipient
) => {
  if (
    typeof recipient === "string"
  ) {
    return {
      emailAddress: {
        address:
          recipient.trim(),
      },
    };
  }

  if (recipient?.emailAddress) {
    return recipient;
  }

  return {
    emailAddress: {
      address:
        recipient?.address ||
        recipient?.email ||
        "",
      name:
        recipient?.name ||
        undefined,
    },
  };
};

const normalizeRecipients = (
  recipients
) => {
  if (!recipients) {
    return [];
  }

  const list = Array.isArray(
    recipients
  )
    ? recipients
    : [recipients];

  return list
    .map(normalizeRecipient)
    .filter(
      (item) =>
        item?.emailAddress?.address
    );
};

export const sendOutlookMail =
  async ({
    message,
    to,
    cc,
    bcc,
    subject,
    body,
    bodyType = "HTML",
    saveToSentItems = true,
  } = {}) => {
    const finalMessage =
      message || {
        subject: subject || "",
        body: {
          contentType: bodyType,
          content: body || "",
        },
        toRecipients:
          normalizeRecipients(to),
        ccRecipients:
          normalizeRecipients(cc),
        bccRecipients:
          normalizeRecipients(bcc),
      };

    if (
      !Array.isArray(
        finalMessage.toRecipients
      ) ||
      finalMessage.toRecipients.length === 0
    ) {
      throw new Error(
        "At least one recipient is required."
      );
    }

    return graphRequest(
      "/me/sendMail",
      {
        method: "POST",
        scopes:
          TOKEN_SCOPES.mailSend,
        body: {
          message: finalMessage,
          saveToSentItems:
            saveToSentItems !== false,
        },
      }
    );
  };

export const sendMail =
  sendOutlookMail;

export const sendMessage =
  sendOutlookMail;

export const sendEmail =
  sendOutlookMail;

export const sendOutlookEmail =
  sendOutlookMail;

export const createOutlookEmail =
  sendOutlookMail;

export const sendOutlookMailMessage =
  sendOutlookMail;

export const replyToOutlookMessage =
  async (
    messageId,
    options = {}
  ) => {
    if (!messageId) {
      throw new Error(
        "Message ID is required."
      );
    }

    const comment =
      typeof options === "string"
        ? options
        : options?.comment || "";

    const replyAll =
      typeof options === "object"
        ? Boolean(
            options?.replyAll
          )
        : false;

    const action =
      replyAll
        ? "replyAll"
        : "reply";

    return graphRequest(
      `/me/messages/${encodeURIComponent(
        messageId
      )}/${action}`,
      {
        method: "POST",
        scopes:
          TOKEN_SCOPES.mailSend,
        body: {
          comment,
        },
      }
    );
  };

export const replyToMessage =
  replyToOutlookMessage;

export const replyToEmail =
  replyToOutlookMessage;

export const archiveOutlookEmail =
  async (
    messageId,
    archiveFolderId
  ) => {
    if (!messageId) {
      throw new Error(
        "Message ID is required."
      );
    }

    let destinationId =
      archiveFolderId;

    if (!destinationId) {
      const archive =
        await graphRequest(
          "/me/mailFolders/archive",
          {
            scopes:
              TOKEN_SCOPES.mailRead,
          }
        );

      destinationId =
        archive?.id;
    }

    if (!destinationId) {
      throw new Error(
        "Archive folder was not found."
      );
    }

    return moveOutlookMessage(
      messageId,
      destinationId
    );
  };

export const archiveEmail =
  archiveOutlookEmail;

const toGraphDateTime = (
  value
) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return {
      dateTime:
        value
          .toISOString()
          .replace("Z", ""),
      timeZone: "UTC",
    };
  }

  const stringValue =
    String(value).trim();

  if (!stringValue) {
    return null;
  }

  if (
    /Z$/i.test(stringValue) ||
    /[+-]\d{2}:\d{2}$/.test(
      stringValue
    )
  ) {
    const date =
      new Date(stringValue);

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return {
        dateTime:
          date
            .toISOString()
            .replace("Z", ""),
        timeZone: "UTC",
      };
    }
  }

  return {
    dateTime: stringValue,
    timeZone:
      "India Standard Time",
  };
};

const normalizeEventPayload = (
  event = {}
) => {
  const start =
    event.start ||
    toGraphDateTime(
      event.startDateTime
    );

  const end =
    event.end ||
    toGraphDateTime(
      event.endDateTime
    );

  const payload = {
    subject:
      event.subject || "",
    body:
      event.body || {
        contentType:
          event.bodyType ||
          "HTML",
        content:
          event.description ||
          "",
      },
    start,
    end,
  };

  if (event.location) {
    payload.location =
      typeof event.location ===
      "string"
        ? {
            displayName:
              event.location,
          }
        : event.location;
  }

  if (
    Array.isArray(
      event.attendees
    )
  ) {
    payload.attendees =
      event.attendees
        .map((attendee) => ({
          emailAddress: {
            address:
              attendee?.emailAddress
                ?.address ||
              attendee?.address ||
              attendee?.email ||
              "",
            name:
              attendee?.emailAddress
                ?.name ||
              attendee?.name ||
              "",
          },
          type:
            attendee?.type ||
            "required",
        }))
        .filter(
          (item) =>
            item.emailAddress.address
        );
  }

  if (
    event.isAllDay !== undefined
  ) {
    payload.isAllDay =
      Boolean(event.isAllDay);
  }

  if (
    event.isReminderOn !== undefined
  ) {
    payload.isReminderOn =
      Boolean(event.isReminderOn);
  }

  if (
    event.reminderMinutesBeforeStart !==
    undefined
  ) {
    payload.reminderMinutesBeforeStart =
      Number(
        event.reminderMinutesBeforeStart
      ) || 0;
  }

  if (
    event.isOnlineMeeting !==
    undefined
  ) {
    payload.isOnlineMeeting =
      Boolean(
        event.isOnlineMeeting
      );
  }

  if (
    event.onlineMeetingProvider
  ) {
    payload.onlineMeetingProvider =
      event.onlineMeetingProvider;
  }

  return payload;
};

export const getOutlookCalendar =
  async (
    date = new Date(),
    options = {}
  ) => {
    const selectedDate =
      date instanceof Date
        ? date
        : new Date(date);

    const start =
      options.startDateTime ||
      startOfLocalDay(
        selectedDate
      );

    const end =
      options.endDateTime ||
      endOfLocalDay(
        selectedDate
      );

    const startIso =
      start instanceof Date
        ? start.toISOString()
        : new Date(
            start
          ).toISOString();

    const endIso =
      end instanceof Date
        ? end.toISOString()
        : new Date(
            end
          ).toISOString();

    const params =
      new URLSearchParams();

    params.set(
      "startDateTime",
      startIso
    );

    params.set(
      "endDateTime",
      endIso
    );

    params.set(
      "$orderby",
      "start/dateTime"
    );

    params.set(
      "$top",
      String(
        Math.min(
          Number(options.top) || 100,
          1000
        )
      )
    );

    params.set(
      "$select",
      options.select ||
        [
          "id",
          "subject",
          "bodyPreview",
          "body",
          "start",
          "end",
          "location",
          "attendees",
          "organizer",
          "isAllDay",
          "isCancelled",
          "isOrganizer",
          "responseStatus",
          "showAs",
          "importance",
          "isReminderOn",
          "reminderMinutesBeforeStart",
          "webLink",
          "onlineMeeting",
          "isOnlineMeeting",
          "onlineMeetingProvider",
          "categories",
        ].join(",")
    );

    const items =
      await getAllGraphPages(
        `/me/calendarView?${params.toString()}`,
        {
          scopes:
            TOKEN_SCOPES.calendar,
          maxItems:
            options.maxItems || 1000,
        }
      );

    return {
      success: true,
      connected: true,
      count: items.length,
      events: items,
      value: items,
      data: items,
    };
  };

export const getCalendar =
  getOutlookCalendar;

export const getCalendarData =
  getOutlookCalendar;

export const getCalendarDataForDay =
  getOutlookCalendar;

export const getTodayCalendar =
  (date = new Date()) =>
    getOutlookCalendar(date);

export const getCalendarEvents =
  async (options = {}) => {
    const date =
      options.date || new Date();

    return getOutlookCalendar(
      date,
      options
    );
  };

export const getEvents =
  getCalendarEvents;

export const getCalendarEvent =
  async (eventId) => {
    if (!eventId) {
      throw new Error(
        "Calendar event ID is required."
      );
    }

    return graphRequest(
      `/me/events/${encodeURIComponent(
        eventId
      )}`,
      {
        scopes:
          TOKEN_SCOPES.calendar,
      }
    );
  };

export const createOutlookCalendarEvent =
  async (event) => {
    const payload =
      normalizeEventPayload(event);

    if (
      !payload.start ||
      !payload.end
    ) {
      throw new Error(
        "Calendar event start and end are required."
      );
    }

    return graphRequest(
      "/me/events",
      {
        method: "POST",
        scopes:
          TOKEN_SCOPES.calendarWrite,
        body: payload,
      }
    );
  };

export const createCalendarEvent =
  createOutlookCalendarEvent;

export const createEvent =
  createOutlookCalendarEvent;

export const addCalendarEvent =
  createOutlookCalendarEvent;

export const updateOutlookCalendarEvent =
  async (
    eventId,
    event
  ) => {
    if (!eventId) {
      throw new Error(
        "Calendar event ID is required."
      );
    }

    return graphRequest(
      `/me/events/${encodeURIComponent(
        eventId
      )}`,
      {
        method: "PATCH",
        scopes:
          TOKEN_SCOPES.calendarWrite,
        body:
          normalizeEventPayload(
            event
          ),
      }
    );
  };

export const updateCalendarEvent =
  updateOutlookCalendarEvent;

export const updateEvent =
  updateOutlookCalendarEvent;

export const editCalendarEvent =
  updateOutlookCalendarEvent;

export const deleteOutlookCalendarEvent =
  async (eventId) => {
    if (!eventId) {
      throw new Error(
        "Calendar event ID is required."
      );
    }

    return graphRequest(
      `/me/events/${encodeURIComponent(
        eventId
      )}`,
      {
        method: "DELETE",
        scopes:
          TOKEN_SCOPES.calendarWrite,
      }
    );
  };

export const deleteCalendarEvent =
  deleteOutlookCalendarEvent;

export const deleteEvent =
  deleteOutlookCalendarEvent;

export const getOutlookTodoLists =
  async () => {
    const items =
      await getAllGraphPages(
        "/me/todo/lists?$top=100",
        {
          scopes:
            TOKEN_SCOPES.tasks,
          maxItems: 100,
        }
      );

    return {
      success: true,
      connected: true,
      count: items.length,
      lists: items,
      taskLists: items,
      value: items,
      data: items,
    };
  };

export const getTaskLists =
  getOutlookTodoLists;

export const getOutlookTaskLists =
  getOutlookTodoLists;

export const createTaskLists =
  async (payload) => {
    const data =
      typeof payload === "string"
        ? {
            displayName:
              payload.trim(),
          }
        : payload;

    if (
      !data?.displayName
    ) {
      throw new Error(
        "Task list name is required."
      );
    }

    return graphRequest(
      "/me/todo/lists",
      {
        method: "POST",
        scopes:
          TOKEN_SCOPES.tasks,
        body: {
          displayName:
            data.displayName,
        },
      }
    );
  };

const normalizeTaskPayload = (
  task = {}
) => {
  const payload = {};

  if (
    task.title !== undefined
  ) {
    payload.title =
      String(
        task.title
      ).trim();
  }

  if (
    task.body !== undefined
  ) {
    payload.body =
      typeof task.body === "string"
        ? {
            content:
              task.body,
            contentType:
              "text",
          }
        : task.body;
  }

  if (
    task.importance !== undefined
  ) {
    payload.importance =
      task.importance;
  }

  if (
    task.status !== undefined
  ) {
    payload.status =
      task.status;
  }

  if (
    task.dueDateTime !== undefined
  ) {
    payload.dueDateTime =
      task.dueDateTime;
  } else if (
    task.dueDate
  ) {
    payload.dueDateTime = {
      dateTime:
        new Date(
          task.dueDate
        )
          .toISOString()
          .replace("Z", ""),
      timeZone: "UTC",
    };
  }

  if (
    task.reminderDateTime !==
    undefined
  ) {
    payload.reminderDateTime =
      task.reminderDateTime;
  }

  if (
    task.categories !== undefined
  ) {
    payload.categories =
      Array.isArray(
        task.categories
      )
        ? task.categories
        : [];
  }

  return payload;
};

export const getOutlookTasks =
  async ({
    top = 500,
    listId,
  } = {}) => {
    const safeTop = Math.min(
      Math.max(
        Number(top) || 500,
        1
      ),
      500
    );

    const lists =
      listId
        ? [{ id: listId }]
        : await getAllGraphPages(
            "/me/todo/lists?$top=100",
            {
              scopes:
                TOKEN_SCOPES.tasks,
              maxItems: 100,
            }
          );

    const allTasks = [];

    for (
      const list of lists
    ) {
      if (!list?.id) {
        continue;
      }

      const remaining =
        safeTop -
        allTasks.length;

      if (remaining <= 0) {
        break;
      }

      const tasks =
        await getAllGraphPages(
          `/me/todo/lists/${encodeURIComponent(
            list.id
          )}/tasks?$top=${Math.min(
            remaining,
            100
          )}`,
          {
            scopes:
              TOKEN_SCOPES.tasks,
            maxItems:
              remaining,
          }
        );

      tasks.forEach(
        (task) => {
          allTasks.push({
            ...task,
            listId:
              list.id,
            listName:
              list.displayName ||
              "Tasks",
          });
        }
      );
    }

    return {
      success: true,
      connected: true,
      count:
        allTasks.length,
      tasks:
        allTasks,
      value:
        allTasks,
      data:
        allTasks,
      lists,
      taskLists:
        lists,
    };
  };

export const getTasks =
  getOutlookTasks;

export const getTaskData =
  getOutlookTasks;

export const getTasksData =
  getOutlookTasks;

export const getOutlookTodoTasks =
  getOutlookTasks;

export const getTask =
  async (
    taskId,
    listId
  ) => {
    if (!taskId) {
      throw new Error(
        "Task ID is required."
      );
    }

    if (!listId) {
      throw new Error(
        "Task list ID is required."
      );
    }

    return graphRequest(
      `/me/todo/lists/${encodeURIComponent(
        listId
      )}/tasks/${encodeURIComponent(
        taskId
      )}`,
      {
        scopes:
          TOKEN_SCOPES.tasks,
      }
    );
  };

export const getTaskDataById =
  getTask;

export const createOutlookTodoTask =
  async (task) => {
    const listId =
      task?.listId ||
      task?.todoListId;

    if (!listId) {
      throw new Error(
        "Task list ID is required."
      );
    }

    const payload =
      normalizeTaskPayload(task);

    if (!payload.title) {
      throw new Error(
        "Task title is required."
      );
    }

    return graphRequest(
      `/me/todo/lists/${encodeURIComponent(
        listId
      )}/tasks`,
      {
        method: "POST",
        scopes:
          TOKEN_SCOPES.tasks,
        body: payload,
      }
    );
  };

export const createOutlookTask =
  createOutlookTodoTask;

export const createTask =
  createOutlookTodoTask;

export const addTask =
  createOutlookTodoTask;

export const createTaskListsData =
  getOutlookTodoLists;

export const updateOutlookTodoTask =
  async (
    taskId,
    task,
    listId
  ) => {
    const effectiveListId =
      listId ||
      task?.listId ||
      task?.todoListId;

    if (!taskId) {
      throw new Error(
        "Task ID is required."
      );
    }

    if (!effectiveListId) {
      throw new Error(
        "Task list ID is required."
      );
    }

    return graphRequest(
      `/me/todo/lists/${encodeURIComponent(
        effectiveListId
      )}/tasks/${encodeURIComponent(
        taskId
      )}`,
      {
        method: "PATCH",
        scopes:
          TOKEN_SCOPES.tasks,
        body:
          normalizeTaskPayload(
            task
          ),
      }
    );
  };

export const updateOutlookTask =
  updateOutlookTodoTask;

export const updateTask =
  updateOutlookTodoTask;

export const editTask =
  updateOutlookTodoTask;

export const updateTodoTask =
  updateOutlookTodoTask;

export const completeOutlookTodoTask =
  async (
    taskId,
    listId
  ) => {
    if (!taskId) {
      throw new Error(
        "Task ID is required."
      );
    }

    if (!listId) {
      throw new Error(
        "Task list ID is required."
      );
    }

    return graphRequest(
      `/me/todo/lists/${encodeURIComponent(
        listId
      )}/tasks/${encodeURIComponent(
        taskId
      )}`,
      {
        method: "PATCH",
        scopes:
          TOKEN_SCOPES.tasks,
        body: {
          status:
            "completed",
        },
      }
    );
  };

export const completeOutlookTask =
  completeOutlookTodoTask;

export const completeTask =
  completeOutlookTodoTask;

export const finishTask =
  completeOutlookTodoTask;

export const uncompleteTask =
  async (
    taskId,
    listId
  ) => {
    if (!taskId) {
      throw new Error(
        "Task ID is required."
      );
    }

    if (!listId) {
      throw new Error(
        "Task list ID is required."
      );
    }

    return graphRequest(
      `/me/todo/lists/${encodeURIComponent(
        listId
      )}/tasks/${encodeURIComponent(
        taskId
      )}`,
      {
        method: "PATCH",
        scopes:
          TOKEN_SCOPES.tasks,
        body: {
          status:
            "notStarted",
        },
      }
    );
  };

export const deleteTask =
  async (
    taskId,
    listId
  ) => {
    if (!taskId) {
      throw new Error(
        "Task ID is required."
      );
    }

    if (!listId) {
      throw new Error(
        "Task list ID is required."
      );
    }

    return graphRequest(
      `/me/todo/lists/${encodeURIComponent(
        listId
      )}/tasks/${encodeURIComponent(
        taskId
      )}`,
      {
        method: "DELETE",
        scopes:
          TOKEN_SCOPES.tasks,
      }
    );
  };

export const deleteOutlookTask =
  deleteTask;

export const startOfLocalDay =
  (date = new Date()) => {
    const result =
      new Date(
        date instanceof Date
          ? date
          : new Date(date)
      );

    result.setHours(
      0,
      0,
      0,
      0
    );

    return result;
  };

export const endOfLocalDay =
  (date = new Date()) => {
    const result =
      new Date(
        date instanceof Date
          ? date
          : new Date(date)
      );

    result.setHours(
      23,
      59,
      59,
      999
    );

    return result;
  };

export const startOfWeek =
  (date = new Date()) => {
    const result =
      startOfLocalDay(date);

    const day =
      result.getDay();

    const diff =
      day === 0
        ? 6
        : day - 1;

    result.setDate(
      result.getDate() - diff
    );

    return result;
  };

export const endOfWeek =
  (date = new Date()) => {
    const result =
      startOfWeek(date);

    result.setDate(
      result.getDate() + 6
    );

    return endOfLocalDay(result);
  };

export const startOfCurrentMonth =
  (date = new Date()) => {
    const result =
      new Date(
        date instanceof Date
          ? date
          : new Date(date)
      );

    result.setDate(1);
    result.setHours(
      0,
      0,
      0,
      0
    );

    return result;
  };

export const endOfCurrentMonth =
  (date = new Date()) => {
    const result =
      startOfCurrentMonth(date);

    result.setMonth(
      result.getMonth() + 1
    );

    result.setMilliseconds(
      result.getMilliseconds() - 1
    );

    return result;
  };

export const formatDateOnly =
  (date = new Date()) => {
    const value =
      date instanceof Date
        ? date
        : new Date(date);

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return "";
    }

    return [
      value.getFullYear(),
      String(
        value.getMonth() + 1
      ).padStart(2, "0"),
      String(
        value.getDate()
      ).padStart(2, "0"),
    ].join("-");
  };

export const formatDateTime =
  (date) => {
    if (!date) {
      return "";
    }

    const value =
      date instanceof Date
        ? date
        : new Date(date);

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return "";
    }

    return value.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

export const formatDateTimeLocal =
  (date) => {
    if (!date) {
      return "";
    }

    const value =
      date instanceof Date
        ? date
        : new Date(date);

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return "";
    }

    return `${value.getFullYear()}-${String(
      value.getMonth() + 1
    ).padStart(2, "0")}-${String(
      value.getDate()
    ).padStart(2, "0")}T${String(
      value.getHours()
    ).padStart(2, "0")}:${String(
      value.getMinutes()
    ).padStart(2, "0")}`;
  };

export const isToday =
  (date) => {
    if (!date) {
      return false;
    }

    return isSameDay(
      date,
      new Date()
    );
  };

export const isSameDay =
  (first, second) => {
    if (!first || !second) {
      return false;
    }

    const a =
      first instanceof Date
        ? first
        : new Date(first);

    const b =
      second instanceof Date
        ? second
        : new Date(second);

    if (
      Number.isNaN(
        a.getTime()
      ) ||
      Number.isNaN(
        b.getTime()
      )
    ) {
      return false;
    }

    return (
      a.getFullYear() ===
        b.getFullYear() &&
      a.getMonth() ===
        b.getMonth() &&
      a.getDate() ===
        b.getDate()
    );
  };

export const getDateRange =
  (date = new Date()) => ({
    startDateTime:
      startOfLocalDay(
        date
      ).toISOString(),
    endDateTime:
      endOfLocalDay(
        date
      ).toISOString(),
  });

export const getTodayTasks =
  async (
    date = new Date()
  ) => {
    const response =
      await getOutlookTasks({
        top: 500,
      });

    const tasks =
      Array.isArray(
        response?.tasks
      )
        ? response.tasks
        : [];

    const selected =
      tasks.filter(
        (task) => {
          const due =
            task?.dueDateTime
              ?.dateTime ||
            task?.dueDate ||
            null;

          return (
            due &&
            isSameDay(
              due,
              date
            )
          );
        }
      );

    return {
      ...response,
      tasks: selected,
      value: selected,
      data: selected,
      count:
        selected.length,
    };
  };

export const getCurrentDayTasks =
  getTodayTasks;

export const getTodayTaskList =
  getTodayTasks;

export const getTodayInbox =
  async (
    date = new Date()
  ) => {
    const filter =
      `receivedDateTime ge ${startOfLocalDay(
        date
      ).toISOString()} and receivedDateTime le ${endOfLocalDay(
        date
      ).toISOString()}`;

    return getOutlookMessages({
      folder: "inbox",
      top: 100,
      filter,
      orderby:
        "receivedDateTime desc",
    });
  };

export const getInboxForRange =
  async ({
    startDateTime,
    endDateTime,
    top = 100,
  } = {}) => {
    const filterParts = [];

    if (startDateTime) {
      filterParts.push(
        `receivedDateTime ge ${new Date(
          startDateTime
        ).toISOString()}`
      );
    }

    if (endDateTime) {
      filterParts.push(
        `receivedDateTime le ${new Date(
          endDateTime
        ).toISOString()}`
      );
    }

    return getOutlookMessages({
      folder: "inbox",
      top,
      filter:
        filterParts.join(
          " and "
        ),
      orderby:
        "receivedDateTime desc",
    });
  };

export const getSentForRange =
  async ({
    startDateTime,
    endDateTime,
    top = 100,
  } = {}) => {
    const filterParts = [];

    if (startDateTime) {
      filterParts.push(
        `sentDateTime ge ${new Date(
          startDateTime
        ).toISOString()}`
      );
    }

    if (endDateTime) {
      filterParts.push(
        `sentDateTime le ${new Date(
          endDateTime
        ).toISOString()}`
      );
    }

    return getOutlookMessages({
      folder: "sentitems",
      top,
      filter:
        filterParts.join(
          " and "
        ),
      orderby:
        "sentDateTime desc",
    });
  };

export const getTodaySent =
  async (
    date = new Date()
  ) =>
    getSentForRange({
      startDateTime:
        startOfLocalDay(
          date
        ).toISOString(),
      endDateTime:
        endOfLocalDay(
          date
        ).toISOString(),
      top: 100,
    });

const normalizeArray =
  (value) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (
      Array.isArray(
        value?.value
      )
    ) {
      return value.value;
    }

    if (
      Array.isArray(
        value?.emails
      )
    ) {
      return value.emails;
    }

    if (
      Array.isArray(
        value?.messages
      )
    ) {
      return value.messages;
    }

    if (
      Array.isArray(
        value?.tasks
      )
    ) {
      return value.tasks;
    }

    if (
      Array.isArray(
        value?.events
      )
    ) {
      return value.events;
    }

    return [];
  };

export const getDashboardMetrics =
  async (
    date = new Date()
  ) => {
    const selectedDate =
      date instanceof Date
        ? date
        : new Date(date);

    const [
      inboxResponse,
      sentResponse,
      tasksResponse,
      calendarResponse,
    ] =
      await Promise.allSettled([
        getTodayInbox(
          selectedDate
        ),
        getTodaySent(
          selectedDate
        ),
        getTodayTasks(
          selectedDate
        ),
        getOutlookCalendar(
          selectedDate
        ),
      ]);

    const inbox =
      inboxResponse.status ===
      "fulfilled"
        ? normalizeArray(
            inboxResponse.value
          )
        : [];

    const sent =
      sentResponse.status ===
      "fulfilled"
        ? normalizeArray(
            sentResponse.value
          )
        : [];

    const tasks =
      tasksResponse.status ===
      "fulfilled"
        ? normalizeArray(
            tasksResponse.value
          )
        : [];

    const events =
      calendarResponse.status ===
      "fulfilled"
        ? normalizeArray(
            calendarResponse.value
          )
        : [];

    const unread =
      inbox.filter(
        (item) =>
          item?.isRead === false
      ).length;

    const important =
      inbox.filter(
        (item) =>
          String(
            item?.importance ||
              ""
          ).toLowerCase() ===
          "high"
      ).length;

    const flagged =
      inbox.filter(
        (item) =>
          String(
            item?.flag
              ?.flagStatus ||
              ""
          ).toLowerCase() ===
          "flagged"
      ).length;

    const completedTasks =
      tasks.filter(
        (task) =>
          String(
            task?.status ||
              ""
          ).toLowerCase() ===
          "completed"
      ).length;

    const pendingTasks =
      Math.max(
        tasks.length -
          completedTasks,
        0
      );

    const responseRate =
      inbox.length +
        sent.length >
      0
        ? Math.round(
            (sent.length /
              (inbox.length +
                sent.length)) *
              100
          )
        : 0;

    return {
      success: true,
      connected: true,
      total:
        inbox.length,
      totalEmails:
        inbox.length,
      received:
        inbox.length,
      receivedCount:
        inbox.length,
      totalReceived:
        inbox.length,
      unread,
      unreadEmails:
        unread,
      unreadCount:
        unread,
      important,
      highPriority:
        important,
      highPriorityEmails:
        important,
      highPriorityCount:
        important,
      flagged,
      flaggedEmails:
        flagged,
      sent:
        sent.length,
      sentCount:
        sent.length,
      responseRate,
      tasks:
        tasks.length,
      totalTasks:
        tasks.length,
      completedTasks,
      pendingTasks,
      events:
        events.length,
      totalEvents:
        events.length,
      inbox,
      emails:
        inbox,
      messages:
        inbox,
      sentEmails:
        sent,
      tasksData:
        tasks,
      eventsData:
        events,
      calendar:
        events,
      date:
        formatDateOnly(
          selectedDate
        ),
      generatedAt:
        new Date().toISOString(),
    };
  };

export const getOutlookDashboardMetrics =
  getDashboardMetrics;

export const getThisMonthInbox =
  async () => {
    const start =
      startOfCurrentMonth();

    const end =
      endOfCurrentMonth();

    return getInboxForRange({
      startDateTime:
        start.toISOString(),
      endDateTime:
        end.toISOString(),
      top: 100,
    });
  };

export const getThisMonthSent =
  async () => {
    const start =
      startOfCurrentMonth();

    const end =
      endOfCurrentMonth();

    return getSentForRange({
      startDateTime:
        start.toISOString(),
      endDateTime:
        end.toISOString(),
      top: 100,
    });
  };

export const getInboxMessagesData =
  getOutlookInbox;

export const normalizeEmailResponse =
  (response) => {
    const emails =
      normalizeArray(
        response
      );

    return {
      success:
        response?.success !== false,
      connected:
        response?.connected !== false,
      count:
        emails.length,
      emails,
      messages:
        emails,
      value:
        emails,
      data:
        emails,
    };
  };

export const normalizeMailResponse =
  normalizeEmailResponse;

export const normalizeCalendarResponse =
  (response) => {
    const events =
      normalizeArray(
        response
      );

    return {
      success:
        response?.success !== false,
      connected:
        response?.connected !== false,
      count:
        events.length,
      events,
      value:
        events,
      data:
        events,
    };
  };

export const normalizeEventResponse =
  normalizeCalendarResponse;

export const normalizeTaskResponse =
  (response) => {
    const tasks =
      normalizeArray(
        response
      );

    return {
      success:
        response?.success !== false,
      connected:
        response?.connected !== false,
      count:
        tasks.length,
      tasks,
      value:
        tasks,
      data:
        tasks,
      lists:
        response?.lists ||
        response?.taskLists ||
        [],
    };
  };

const graphService = {
  GRAPH_BASE_URL,
  TOKEN_SCOPES,
  GraphInteractionRequiredError,

  getApiRoot,
  getGraphBaseUrl,
  getRequestUrl,

  getActiveAccount,
  getActiveAccountSafe,

  getAccessToken,
  getGraphAccessToken,
  getTokenForFeature,
  getTokenScopes,

  getMailReadToken,
  getMailWriteToken,
  getMailSendToken,
  getMailManagementToken,

  getCalendarToken,
  getCalendarReadToken,
  getCalendarWriteToken,

  getTasksToken,
  getTasksReadToken,
  getTasksWriteToken,

  getContactsToken,
  getPeopleToken,
  getFilesToken,
  getPresenceToken,
  getMailboxSettingsToken,

  acquireGraphTokenInteractively,
  acquireGraphTokenInteractivelySafe,

  isGraphToken,
  isTokenValid,

  backendRequest,
  requestBackend,

  graphRequest,
  requestGraph,
  getGraphRequest,

  getAllGraphPages,
  fetchGraphPages,

  getScopesForPath,
  getScopesForBackendPath,

  getUserProfile,
  getProfile,
  getMicrosoftProfile,
  getProfileData,
  getOutlookMe,
  getOutlookProfile,

  getOutlookStatus,
  getGraphHealth,
  getConnectionStatus,
  checkGraphConnection,

  getOutlookInbox,
  getInbox,
  getInboxData,
  getInboxMessages,
  getMail,
  getOutlookMail,

  getOutlookMessages,
  getOutlookMessagesData,

  getOutlookMessage,
  getMessage,
  getEmailById,

  updateOutlookMessage,

  markEmailAsRead,
  markEmailAsUnread,
  markRead,
  markUnread,

  deleteOutlookMessage,
  deleteOutlookMessageById,
  deleteEmail,

  moveOutlookMessage,
  moveEmail,

  sendOutlookMail,
  sendOutlookEmail,
  sendOutlookMailMessage,
  createOutlookEmail,
  sendMail,
  sendMessage,
  sendEmail,

  replyToOutlookMessage,
  replyToMessage,
  replyToEmail,

  archiveOutlookEmail,
  archiveEmail,

  getOutlookCalendar,
  getCalendar,
  getCalendarData,
  getCalendarDataForDay,
  getTodayCalendar,
  getCalendarEvents,
  getEvents,
  getCalendarEvent,

  createOutlookCalendarEvent,
  createCalendarEvent,
  createEvent,
  addCalendarEvent,

  updateOutlookCalendarEvent,
  updateCalendarEvent,
  updateEvent,
  editCalendarEvent,

  deleteOutlookCalendarEvent,
  deleteCalendarEvent,
  deleteEvent,

  getOutlookTodoLists,
  getTaskLists,
  getOutlookTaskLists,
  createTaskLists,
  createTaskListsData,

  getOutlookTasks,
  getTasks,
  getTaskData,
  getTasksData,
  getOutlookTodoTasks,

  getTask,
  getTaskDataById,

  createOutlookTodoTask,
  createOutlookTask,
  createTask,
  addTask,

  updateOutlookTodoTask,
  updateOutlookTask,
  updateTask,
  editTask,
  updateTodoTask,

  completeOutlookTodoTask,
  completeOutlookTask,
  completeTask,
  finishTask,

  uncompleteTask,
  deleteTask,
  deleteOutlookTask,

  startOfLocalDay,
  endOfLocalDay,
  startOfWeek,
  endOfWeek,
  startOfCurrentMonth,
  endOfCurrentMonth,

  formatDateOnly,
  formatDateTime,
  formatDateTimeLocal,

  isToday,
  isSameDay,
  getDateRange,

  getTodayTasks,
  getCurrentDayTasks,
  getTodayTaskList,

  getTodayInbox,
  getInboxForRange,

  getTodaySent,
  getSentForRange,

  getThisMonthInbox,
  getThisMonthSent,

  getDashboardMetrics,
  getOutlookDashboardMetrics,

  normalizeApiResponse,
  normalizeEmailResponse,
  normalizeMailResponse,
  normalizeCalendarResponse,
  normalizeEventResponse,
  normalizeTaskResponse,
};

export default graphService;