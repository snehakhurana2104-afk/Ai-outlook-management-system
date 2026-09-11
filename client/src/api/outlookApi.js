import {
  backendRequest,
  graphRequest as serviceGraphRequest,
  getAllGraphPages as serviceGetAllGraphPages,
  getGraphAccessToken,
  getActiveAccount,
  getUserProfile,
  getOutlookProfile as serviceGetOutlookProfile,
  getOutlookMe,
  getOutlookStatus,
  checkGraphConnection,
  getOutlookInbox as serviceGetOutlookInbox,
  getOutlookMail as serviceGetOutlookMail,
  getOutlookMessages,
  getOutlookMessage,
  updateOutlookMessage,
  deleteOutlookMessage,
  moveOutlookMessage,
  sendOutlookMail,
  replyToOutlookMessage,
  getOutlookCalendar as serviceGetOutlookCalendar,
  getCalendarEvents as serviceGetCalendarEvents,
  getCalendarEvent as serviceGetCalendarEvent,
  createCalendarEvent as serviceCreateCalendarEvent,
  updateCalendarEvent as serviceUpdateCalendarEvent,
  deleteCalendarEvent as serviceDeleteCalendarEvent,
  getTaskLists as serviceGetTaskLists,
  getOutlookTasks as serviceGetOutlookTasks,
  createOutlookTask as serviceCreateOutlookTask,
  updateOutlookTask as serviceUpdateOutlookTask,
  completeOutlookTask as serviceCompleteOutlookTask,
  startOfLocalDay,
  endOfLocalDay,
  startOfCurrentMonth,
  endOfCurrentMonth,
} from "../services/graphService";

export const MAX_MAIL_TOP = 100;
export const MAX_TASK_TOP = 500;
export const MAX_GRAPH_ITEMS = 5000;

export const MESSAGE_SELECT = [
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
  "parentFolderId",
  "inferenceClassification",
].join(",");

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const clamp = (value, min, max, fallback) => {
  const number = safeNumber(value, fallback);
  return Math.min(Math.max(number, min), max);
};

const isValidDate = (value) => {
  if (!value) {
    return false;
  }

  const date = value instanceof Date ? value : new Date(value);

  return !Number.isNaN(date.getTime());
};

const toDate = (value, fallback = new Date()) => {
  if (value instanceof Date && isValidDate(value)) {
    return new Date(value.getTime());
  }

  if (isValidDate(value)) {
    return new Date(value);
  }

  return new Date(fallback.getTime());
};

const parseDateOnly = (value) => {
  if (!value) {
    return null;
  }

  const text = String(value).trim();

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const normalizeDateRange = ({
  startDate,
  endDate,
  startDateTime,
  endDateTime,
} = {}) => {
  let rangeStart = startDateTime || null;
  let rangeEnd = endDateTime || null;

  if (!rangeStart && startDate) {
    const start = parseDateOnly(startDate);

    if (start) {
      rangeStart = startOfLocalDay(start).toISOString();
    }
  }

  if (!rangeEnd && endDate) {
    const end = parseDateOnly(endDate);

    if (end) {
      rangeEnd = endOfLocalDay(end).toISOString();
    }
  }

  if (rangeStart && !rangeEnd && startDate) {
    const end = parseDateOnly(startDate);

    if (end) {
      rangeEnd = endOfLocalDay(end).toISOString();
    }
  }

  if (!rangeStart && rangeEnd && endDate) {
    const start = parseDateOnly(endDate);

    if (start) {
      rangeStart = startOfLocalDay(start).toISOString();
    }
  }

  return {
    startDateTime: rangeStart,
    endDateTime: rangeEnd,
  };
};

export const normalizeResponseArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  if (Array.isArray(response?.emails)) {
    return response.emails;
  }

  if (Array.isArray(response?.messages)) {
    return response.messages;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
};

export const normalizeTaskArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.tasks)) {
    return response.tasks;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
};

export const normalizeCalendarArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.events)) {
    return response.events;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
};

export const getActiveMicrosoftAccount = async () => {
  return getActiveAccount();
};

export const getMicrosoftAccount = async () => {
  const account = await getActiveAccount();

  if (!account) {
    return null;
  }

  return {
    username:
      account.username ||
      account.email ||
      "",
    name:
      account.name ||
      "",
    homeAccountId:
      account.homeAccountId ||
      null,
    localAccountId:
      account.localAccountId ||
      null,
    tenantId:
      account.tenantId ||
      null,
  };
};

export const getProfile = async () => {
  return getUserProfile();
};

export const getOutlookProfile = async (...args) => {
  try {
    return await getProfile(...args);
  } catch (error) {
    try {
      return await serviceGetOutlookProfile(...args);
    } catch (fallbackError) {
      throw fallbackError || error;
    }
  }
};

export const getOutlookUser = async () => {
  return getOutlookProfile();
};

export const getMe = async () => {
  return getOutlookMe();
};

export const getConnectionStatus = async () => {
  try {
    const status = await getOutlookStatus();

    return {
      success: true,
      connected: status?.connected !== false,
      ...status,
    };
  } catch (error) {
    return {
      success: false,
      connected: false,
      error:
        error?.message ||
        "Outlook connection failed.",
    };
  }
};

export const testOutlookConnection = async () => {
  return checkGraphConnection();
};

export const getAccessToken = async () => {
  return getGraphAccessToken();
};

export const getInbox = async (params = {}) => {
  const {
    startDate,
    endDate,
    startDateTime,
    endDateTime,
    top = MAX_MAIL_TOP,
    ...rest
  } = params || {};

  const safeTop = clamp(
    top,
    1,
    MAX_MAIL_TOP,
    MAX_MAIL_TOP
  );

  const hasDateFilter =
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(startDateTime) ||
    Boolean(endDateTime);

  if (hasDateFilter) {
    const range = normalizeDateRange({
      startDate,
      endDate,
      startDateTime,
      endDateTime,
    });

    if (
      range.startDateTime &&
      range.endDateTime
    ) {
      return getInboxForRange({
        ...range,
        top: safeTop,
      });
    }
  }

  return serviceGetOutlookInbox({
    top: safeTop,
    ...rest,
  });
};

export const getInboxEmails = getInbox;
export const getOutlookInbox = getInbox;

export const getMail = async (params = {}) => {
  const safeTop = clamp(
    params?.top,
    1,
    MAX_MAIL_TOP,
    MAX_MAIL_TOP
  );

  return serviceGetOutlookMail({
    ...params,
    top: safeTop,
  });
};

export const getAllMail = getMail;
export const getOutlookMail = getMail;

export const getMessages = async (params = {}) => {
  const safeTop = clamp(
    params?.top,
    1,
    MAX_MAIL_TOP,
    MAX_MAIL_TOP
  );

  return getOutlookMessages({
    ...params,
    top: safeTop,
  });
};

export const getMessage = async (messageId) => {
  if (!messageId) {
    throw new Error("Message ID is required.");
  }

  return getOutlookMessage(messageId);
};

export const getEmailById = getMessage;

export const markAsRead = async (messageId) => {
  if (!messageId) {
    throw new Error("Message ID is required.");
  }

  return updateOutlookMessage(
    messageId,
    {
      isRead: true,
    }
  );
};

export const markAsUnread = async (messageId) => {
  if (!messageId) {
    throw new Error("Message ID is required.");
  }

  return updateOutlookMessage(
    messageId,
    {
      isRead: false,
    }
  );
};

export const markEmailAsRead = async (messageId) => {
  return markAsRead(messageId);
};

export const markEmailAsUnread = async (messageId) => {
  return markAsUnread(messageId);
};

export const updateMessage = async (
  messageId,
  payload
) => {
  if (!messageId) {
    throw new Error("Message ID is required.");
  }

  if (
    !payload ||
    typeof payload !== "object"
  ) {
    throw new Error(
      "Message update payload is required."
    );
  }

  return updateOutlookMessage(
    messageId,
    payload
  );
};

export const deleteMessage = async (messageId) => {
  if (!messageId) {
    throw new Error("Message ID is required.");
  }

  return deleteOutlookMessage(messageId);
};

export const deleteEmail = async (messageId) => {
  return deleteMessage(messageId);
};

export const moveMessage = async (
  messageId,
  destinationId
) => {
  if (!messageId) {
    throw new Error("Message ID is required.");
  }

  if (!destinationId) {
    throw new Error(
      "Destination folder ID is required."
    );
  }

  return moveOutlookMessage(
    messageId,
    destinationId
  );
};

export const archiveEmail = async (messageId) => {
  if (!messageId) {
    throw new Error("Message ID is required.");
  }

  return moveMessage(
    messageId,
    "archive"
  );
};

export const sendMail = async ({
  to,
  cc,
  bcc,
  subject,
  body,
  bodyType = "HTML",
  importance,
  attachments,
} = {}) => {
  if (
    !to ||
    (
      Array.isArray(to) &&
      to.length === 0
    )
  ) {
    throw new Error(
      "At least one recipient is required."
    );
  }

  if (!subject && !body) {
    throw new Error(
      "Subject or message body is required."
    );
  }

  const recipients =
    Array.isArray(to)
      ? to
      : [to];

  const normalizeRecipients = (items) => {
    if (!items) {
      return [];
    }

    const list =
      Array.isArray(items)
        ? items
        : [items];

    return list
      .filter(Boolean)
      .map((item) => {
        if (typeof item === "string") {
          return {
            emailAddress: {
              address: item,
            },
          };
        }

        if (item?.emailAddress) {
          return item;
        }

        if (item?.address) {
          return {
            emailAddress: {
              address: item.address,
              name:
                item.name ||
                undefined,
            },
          };
        }

        return {
          emailAddress: {
            address:
              item?.email ||
              item?.value ||
              "",
            name:
              item?.name ||
              undefined,
          },
        };
      });
  };

  return sendOutlookMail({
    message: {
      subject:
        subject ||
        "",
      importance:
        importance ||
        "normal",
      body: {
        contentType:
          bodyType,
        content:
          body ||
          "",
      },
      toRecipients:
        normalizeRecipients(
          recipients
        ),
      ccRecipients:
        normalizeRecipients(cc),
      bccRecipients:
        normalizeRecipients(bcc),
      attachments:
        Array.isArray(attachments)
          ? attachments
          : [],
    },
    saveToSentItems: true,
  });
};

export const replyToMessage = async (
  messageId,
  comment = "",
  replyAll = false
) => {
  if (!messageId) {
    throw new Error("Message ID is required.");
  }

  return replyToOutlookMessage(
    messageId,
    replyAll
      ? {
          comment,
          replyAll: true,
        }
      : {
          comment,
        }
  );
};

export const replyToEmail = async (
  messageId,
  comment = "",
  replyAll = false
) => {
  return replyToMessage(
    messageId,
    comment,
    replyAll
  );
};

export const getTodayRange = (
  date = new Date()
) => {
  const safeDate = toDate(date);

  return {
    startDateTime:
      startOfLocalDay(
        safeDate
      ).toISOString(),
    endDateTime:
      endOfLocalDay(
        safeDate
      ).toISOString(),
  };
};

export const getCurrentMonthRange = (
  date = new Date()
) => {
  const safeDate = toDate(date);

  const start =
    startOfCurrentMonth(
      safeDate
    );

  const now = new Date();

  const isCurrentDate =
    safeDate.toDateString() ===
    now.toDateString();

  if (!isCurrentDate) {
    return {
      startDateTime:
        start.toISOString(),
      endDateTime:
        endOfLocalDay(
          safeDate
        ).toISOString(),
    };
  }

  const end =
    now < endOfLocalDay(safeDate)
      ? now
      : endOfLocalDay(safeDate);

  return {
    startDateTime:
      start.toISOString(),
    endDateTime:
      end.toISOString(),
  };
};

export const getInboxForRange = async ({
  startDateTime,
  endDateTime,
  top = MAX_MAIL_TOP,
} = {}) => {
  if (
    !startDateTime ||
    !endDateTime
  ) {
    throw new Error(
      "startDateTime and endDateTime are required."
    );
  }

  const safeTop = clamp(
    top,
    1,
    MAX_MAIL_TOP,
    MAX_MAIL_TOP
  );

  const filter =
    `receivedDateTime ge ${startDateTime}` +
    ` and receivedDateTime le ${endDateTime}`;

  const endpoint =
    `/me/mailFolders/inbox/messages` +
    `?$top=${safeTop}` +
    `&$select=${encodeURIComponent(
      MESSAGE_SELECT
    )}` +
    `&$filter=${encodeURIComponent(
      filter
    )}` +
    `&$orderby=receivedDateTime desc`;

  const response =
    await serviceGetAllGraphPages(
      endpoint,
      {
        maxItems:
          MAX_GRAPH_ITEMS,
      }
    );

  return normalizeResponseArray(
    response
  );
};

export const getTodayInbox = async (
  date = new Date()
) => {
  return getInboxForRange({
    ...getTodayRange(date),
    top: MAX_MAIL_TOP,
  });
};

export const getThisMonthInbox = async (
  date = new Date()
) => {
  return getInboxForRange({
    ...getCurrentMonthRange(date),
    top: MAX_MAIL_TOP,
  });
};

export const getSentForRange = async ({
  startDateTime,
  endDateTime,
  top = MAX_MAIL_TOP,
} = {}) => {
  if (
    !startDateTime ||
    !endDateTime
  ) {
    throw new Error(
      "startDateTime and endDateTime are required."
    );
  }

  const safeTop = clamp(
    top,
    1,
    MAX_MAIL_TOP,
    MAX_MAIL_TOP
  );

  const filter =
    `sentDateTime ge ${startDateTime}` +
    ` and sentDateTime le ${endDateTime}`;

  const endpoint =
    `/me/mailFolders/sentitems/messages` +
    `?$top=${safeTop}` +
    `&$select=${encodeURIComponent(
      MESSAGE_SELECT
    )}` +
    `&$filter=${encodeURIComponent(
      filter
    )}` +
    `&$orderby=sentDateTime desc`;

  const response =
    await serviceGetAllGraphPages(
      endpoint,
      {
        maxItems:
          MAX_GRAPH_ITEMS,
      }
    );

  return normalizeResponseArray(
    response
  );
};

export const getTodaySent = async (
  date = new Date()
) => {
  return getSentForRange({
    ...getTodayRange(date),
    top: MAX_MAIL_TOP,
  });
};

export const getThisMonthSent = async (
  date = new Date()
) => {
  return getSentForRange({
    ...getCurrentMonthRange(date),
    top: MAX_MAIL_TOP,
  });
};

const normalizeEmailAddress = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }

  return String(
    value?.emailAddress?.address ||
    value?.address ||
    value?.email ||
    value?.value ||
    ""
  )
    .trim()
    .toLowerCase();
};

const getEmailSenderAddress = (email) => {
  return normalizeEmailAddress(
    email?.from ||
    email?.sender
  );
};

const getEmailRecipientAddresses = (email) => {
  const recipients = [
    ...(Array.isArray(email?.toRecipients)
      ? email.toRecipients
      : []),
    ...(Array.isArray(email?.ccRecipients)
      ? email.ccRecipients
      : []),
    ...(Array.isArray(email?.bccRecipients)
      ? email.bccRecipients
      : []),
  ];

  return recipients
    .map(normalizeEmailAddress)
    .filter(Boolean);
};

const getMessageTimestamp = (email) => {
  const value =
    email?.receivedDateTime ||
    email?.sentDateTime ||
    email?.createdDateTime ||
    null;

  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
};

const normalizeSubject = (subject) => {
  return String(subject || "")
    .replace(
      /^\s*((re|fw|fwd)\s*:\s*)+/i,
      ""
    )
    .trim()
    .toLowerCase();
};

const getConversationKey = (email) => {
  const conversationId =
    String(
      email?.conversationId ||
      ""
    ).trim();

  if (conversationId) {
    return `conversation:${conversationId}`;
  }

  const subject =
    normalizeSubject(
      email?.subject
    );

  if (subject) {
    return `subject:${subject}`;
  }

  return `message:${email?.id || Math.random()}`;
};

const getCurrentUserAddresses = async () => {
  const addresses = new Set();

  try {
    const account =
      await getActiveAccount();

    const accountAddress =
      normalizeEmailAddress(
        account?.username ||
        account?.email ||
        ""
      );

    if (accountAddress) {
      addresses.add(
        accountAddress
      );
    }
  } catch (error) {
    void error;
  }

  try {
    const profile =
      await getUserProfile();

    const profileAddress =
      normalizeEmailAddress(
        profile?.mail ||
        profile?.userPrincipalName ||
        profile?.email ||
        profile?.username ||
        ""
      );

    if (profileAddress) {
      addresses.add(
        profileAddress
      );
    }
  } catch (error) {
    void error;
  }

  return addresses;
};

const isSentByCurrentUser = (
  email,
  currentUserAddresses
) => {
  const sender =
    getEmailSenderAddress(
      email
    );

  if (
    sender &&
    currentUserAddresses.has(sender)
  ) {
    return true;
  }

  const recipients =
    getEmailRecipientAddresses(
      email
    );

  const hasRecipient =
    recipients.length > 0;

  if (
    hasRecipient &&
    !email?.receivedDateTime &&
    email?.sentDateTime
  ) {
    return true;
  }

  return false;
};

const hasCompletionSignal = (email) => {
  const text = [
    email?.subject || "",
    email?.bodyPreview || "",
  ]
    .join(" ")
    .toLowerCase();

  const signals = [
    "completed",
    "complete",
    "resolved",
    "closed",
    "done",
    "finished",
    "successfully completed",
    "issue resolved",
    "case closed",
    "task completed",
  ];

  return signals.some(
    (signal) =>
      text.includes(signal)
  );
};

const hasReplyRequestSignal = (email) => {
  const text = [
    email?.subject || "",
    email?.bodyPreview || "",
  ]
    .join(" ")
    .toLowerCase();

  const signals = [
    "please reply",
    "please respond",
    "please confirm",
    "kindly reply",
    "kindly respond",
    "need your response",
    "awaiting your response",
    "waiting for your response",
    "let me know",
    "your feedback",
    "please advise",
    "action required",
    "response required",
    "reply required",
  ];

  return signals.some(
    (signal) =>
      text.includes(signal)
  );
};

const getWorkflowStatus = (
  messages,
  currentUserAddresses
) => {
  const list =
    Array.isArray(messages)
      ? [...messages]
      : [];

  if (list.length === 0) {
    return "Complete";
  }

  list.sort(
    (a, b) =>
      getMessageTimestamp(a) -
      getMessageTimestamp(b)
  );

  const explicitComplete =
    list.some(
      hasCompletionSignal
    );

  if (explicitComplete) {
    return "Complete";
  }

  const latest =
    list[list.length - 1];

  const latestIsOutgoing =
    isSentByCurrentUser(
      latest,
      currentUserAddresses
    );

  if (latestIsOutgoing) {
    return "Pending Client";
  }

  const latestIsIncoming =
    !latestIsOutgoing &&
    Boolean(
      latest?.receivedDateTime
    );

  if (latestIsIncoming) {
    const highImportance =
      String(
        latest?.importance ||
        ""
      ).toLowerCase() ===
      "high";

    const replyRequired =
      hasReplyRequestSignal(
        latest
      );

    if (
      highImportance ||
      replyRequired
    ) {
      return "Priority";
    }

    return "Pending Self";
  }

  const hasIncoming =
    list.some(
      (message) =>
        Boolean(
          message?.receivedDateTime
        )
    );

  const hasOutgoing =
    list.some(
      (message) =>
        isSentByCurrentUser(
          message,
          currentUserAddresses
        )
    );

  if (
    hasIncoming &&
    hasOutgoing
  ) {
    return "In Progress";
  }

  return "Complete";
};

export const getWorkflowMessages = async (
  date = new Date()
) => {
  const todayRange =
    getTodayRange(date);

  const monthRange =
    getCurrentMonthRange(date);

  const [
    todayInbox,
    todaySent,
    monthInbox,
    monthSent,
  ] = await Promise.all([
    getInboxForRange({
      ...todayRange,
      top: MAX_MAIL_TOP,
    }),
    getSentForRange({
      ...todayRange,
      top: MAX_MAIL_TOP,
    }),
    getInboxForRange({
      ...monthRange,
      top: MAX_MAIL_TOP,
    }),
    getSentForRange({
      ...monthRange,
      top: MAX_MAIL_TOP,
    }),
  ]);

  const combined = [
    ...normalizeResponseArray(
      monthInbox
    ),
    ...normalizeResponseArray(
      monthSent
    ),
  ];

  const unique =
    new Map();

  for (const message of combined) {
    const id =
      String(
        message?.id ||
        ""
      ).trim();

    if (!id) {
      continue;
    }

    if (!unique.has(id)) {
      unique.set(
        id,
        message
      );
    }
  }

  const history =
    Array.from(
      unique.values()
    );

  const currentUserAddresses =
    await getCurrentUserAddresses();

  const conversationMap =
    new Map();

  for (const message of history) {
    const key =
      getConversationKey(
        message
      );

    if (!conversationMap.has(key)) {
      conversationMap.set(
        key,
        []
      );
    }

    conversationMap
      .get(key)
      .push(message);
  }

  const workflowByConversation =
    new Map();

  for (
    const [
      key,
      messages,
    ] of conversationMap
  ) {
    workflowByConversation.set(
      key,
      {
        status:
          getWorkflowStatus(
            messages,
            currentUserAddresses
          ),
        messages,
      }
    );
  }

  const todayMessages = [
    ...normalizeResponseArray(
      todayInbox
    ),
    ...normalizeResponseArray(
      todaySent
    ),
  ];

  const todayUnique =
    new Map();

  for (
    const message of todayMessages
  ) {
    const id =
      String(
        message?.id ||
        ""
      ).trim();

    if (!id) {
      continue;
    }

    if (!todayUnique.has(id)) {
      todayUnique.set(
        id,
        message
      );
    }
  }

  const workflowMessages =
    Array.from(
      todayUnique.values()
    ).map(
      (message) => {
        const key =
          getConversationKey(
            message
          );

        const workflow =
          workflowByConversation.get(
            key
          );

        const sentByUser =
          isSentByCurrentUser(
            message,
            currentUserAddresses
          );

        return {
          ...message,
          workflowStatus:
            workflow?.status ||
            "Complete",
          isSentByCurrentUser:
            sentByUser,
          conversationKey:
            key,
        };
      }
    );

  const statusCounts = {
    "Pending Client": 0,
    "Pending Self": 0,
    "In Progress": 0,
    Priority: 0,
    Complete: 0,
  };

  const conversationStatusCounts = {
    "Pending Client": 0,
    "Pending Self": 0,
    "In Progress": 0,
    Priority: 0,
    Complete: 0,
  };

  for (
    const workflow of workflowByConversation.values()
  ) {
    const status =
      workflow?.status;

    if (
      Object.prototype.hasOwnProperty.call(
        conversationStatusCounts,
        status
      )
    ) {
      conversationStatusCounts[
        status
      ] += 1;
    }
  }

  for (
    const message of workflowMessages
  ) {
    const status =
      message?.workflowStatus;

    if (
      Object.prototype.hasOwnProperty.call(
        statusCounts,
        status
      )
    ) {
      statusCounts[
        status
      ] += 1;
    }
  }

  return {
    success: true,
    date:
      toDate(date).toISOString(),
    todayInbox:
      normalizeResponseArray(
        todayInbox
      ),
    todaySent:
      normalizeResponseArray(
        todaySent
      ),
    monthInbox:
      normalizeResponseArray(
        monthInbox
      ),
    monthSent:
      normalizeResponseArray(
        monthSent
      ),
    messages:
      workflowMessages,
    workflowMessages,
    conversations:
      Array.from(
        workflowByConversation.entries()
      ).map(
        ([conversationKey, value]) => ({
          conversationKey,
          status:
            value.status,
          messages:
            value.messages,
        })
      ),
    statusCounts,
    conversationStatusCounts,
    currentUserAddresses:
      Array.from(
        currentUserAddresses
      ),
    generatedAt:
      new Date().toISOString(),
  };
};

export const getDashboardWorkflowData =
  getWorkflowMessages;

export const getWorkflowData =
  getWorkflowMessages;

export const calculateEmailMetrics = (
  emails = []
) => {
  const list =
    Array.isArray(emails)
      ? emails
      : [];

  const totalEmails =
    list.length;

  const unreadEmails =
    list.filter(
      (email) =>
        email?.isRead === false
    ).length;

  const highPriorityEmails =
    list.filter(
      (email) =>
        String(
          email?.importance ||
          ""
        ).toLowerCase() ===
        "high"
    ).length;

  const attachmentEmails =
    list.filter(
      (email) =>
        email?.hasAttachments === true
    ).length;

  const flaggedEmails =
    list.filter(
      (email) =>
        email?.flag?.flagStatus &&
        email.flag.flagStatus !==
          "notFlagged"
    ).length;

  return {
    totalEmails,
    unreadEmails,
    highPriorityEmails,
    attachmentEmails,
    flaggedEmails,
    total:
      totalEmails,
    unread:
      unreadEmails,
    highPriority:
      highPriorityEmails,
    attachments:
      attachmentEmails,
    flagged:
      flaggedEmails,
  };
};

export const calculateResponseRate = ({
  received = 0,
  sent = 0,
} = {}) => {
  const safeReceived =
    safeNumber(received);

  const safeSent =
    safeNumber(sent);

  const total =
    safeReceived +
    safeSent;

  if (total === 0) {
    return 0;
  }

  return Math.round(
    (
      safeSent /
      total
    ) * 100
  );
};

export const getTodayEmailMetrics = async (
  date = new Date()
) => {
  const [
    emails,
    sent,
  ] = await Promise.all([
    getTodayInbox(date),
    getTodaySent(date),
  ]);

  const metrics =
    calculateEmailMetrics(
      emails
    );

  const responseRate =
    calculateResponseRate({
      received:
        emails.length,
      sent:
        sent.length,
    });

  return {
    ...metrics,
    sent:
      sent.length,
    sentCount:
      sent.length,
    responseRate,
    emails,
    sentEmails:
      sent,
    date:
      toDate(date).toISOString(),
  };
};

export const getCurrentMonthEmailMetrics =
  async (date = new Date()) => {
    const [
      emails,
      sent,
    ] = await Promise.all([
      getThisMonthInbox(date),
      getThisMonthSent(date),
    ]);

    const metrics =
      calculateEmailMetrics(
        emails
      );

    const responseRate =
      calculateResponseRate({
        received:
          emails.length,
        sent:
          sent.length,
      });

    return {
      ...metrics,
      sent:
        sent.length,
      sentCount:
        sent.length,
      responseRate,
      emails,
      sentEmails:
        sent,
      month:
        toDate(date)
          .toISOString()
          .slice(0, 7),
    };
  };

export const getCurrentMonthResponseRate =
  async () => {
    const [
      received,
      sent,
    ] = await Promise.all([
      getThisMonthInbox(),
      getThisMonthSent(),
    ]);

    return calculateResponseRate({
      received:
        received.length,
      sent:
        sent.length,
    });
  };

export const getDashboardMetrics = async (
  params = {}
) => {
  const {
    startDate,
    endDate,
    startDateTime,
    endDateTime,
  } = params || {};

  let selectedRange;

  if (
    startDateTime &&
    endDateTime
  ) {
    selectedRange = {
      startDateTime,
      endDateTime,
    };
  } else if (
    startDate ||
    endDate
  ) {
    selectedRange =
      normalizeDateRange({
        startDate,
        endDate,
      });
  } else {
    selectedRange =
      getTodayRange();
  }

  const [
    selectedInbox,
    selectedSent,
    monthInbox,
    monthSent,
  ] = await Promise.all([
    getInboxForRange({
      ...selectedRange,
      top:
        MAX_MAIL_TOP,
    }),
    getSentForRange({
      ...selectedRange,
      top:
        MAX_MAIL_TOP,
    }),
    getThisMonthInbox(),
    getThisMonthSent(),
  ]);

  const today =
    calculateEmailMetrics(
      selectedInbox
    );

  const month =
    calculateEmailMetrics(
      monthInbox
    );

  const todayResponseRate =
    calculateResponseRate({
      received:
        selectedInbox.length,
      sent:
        selectedSent.length,
    });

  const monthResponseRate =
    calculateResponseRate({
      received:
        monthInbox.length,
      sent:
        monthSent.length,
    });

  return {
    success: true,

    today: {
      total:
        today.total,
      totalEmails:
        today.totalEmails,
      totalReceived:
        today.total,
      received:
        today.total,
      receivedCount:
        today.total,
      unread:
        today.unread,
      unreadEmails:
        today.unreadEmails,
      unreadCount:
        today.unread,
      highPriority:
        today.highPriority,
      highPriorityEmails:
        today.highPriorityEmails,
      important:
        today.highPriority,
      attachments:
        today.attachments,
      attachmentEmails:
        today.attachmentEmails,
      attachmentCount:
        today.attachments,
      flagged:
        today.flagged,
      flaggedEmails:
        today.flaggedEmails,
      sent:
        selectedSent.length,
      sentCount:
        selectedSent.length,
      responseRate:
        todayResponseRate,
      emails:
        selectedInbox,
      messages:
        selectedInbox,
      sentEmails:
        selectedSent,
      startDateTime:
        selectedRange.startDateTime,
      endDateTime:
        selectedRange.endDateTime,
    },

    thisMonth: {
      total:
        month.total,
      totalEmails:
        month.totalEmails,
      totalReceived:
        month.total,
      received:
        month.total,
      receivedCount:
        month.total,
      unread:
        month.unread,
      unreadEmails:
        month.unreadEmails,
      unreadCount:
        month.unread,
      highPriority:
        month.highPriority,
      highPriorityEmails:
        month.highPriorityEmails,
      important:
        month.highPriority,
      attachments:
        month.attachments,
      attachmentEmails:
        month.attachmentEmails,
      attachmentCount:
        month.attachments,
      flagged:
        month.flagged,
      flaggedEmails:
        month.flaggedEmails,
      sent:
        monthSent.length,
      sentCount:
        monthSent.length,
      responseRate:
        monthResponseRate,
      emails:
        monthInbox,
      messages:
        monthInbox,
      sentEmails:
        monthSent,
    },

    totalReceived:
      today.total,
    received:
      today.total,
    receivedCount:
      today.total,
    totalEmails:
      today.total,
    unread:
      today.unread,
    unreadCount:
      today.unread,
    unreadEmails:
      today.unreadEmails,
    highPriority:
      today.highPriority,
    highPriorityCount:
      today.highPriority,
    important:
      today.highPriority,
    attachments:
      today.attachments,
    attachmentCount:
      today.attachments,
    flagged:
      today.flagged,
    sent:
      selectedSent.length,
    sentCount:
      selectedSent.length,
    responseRate:
      todayResponseRate,
    emails:
      selectedInbox,
    messages:
      selectedInbox,
    sentEmails:
      selectedSent,
    generatedAt:
      new Date().toISOString(),
  };
};

export const getOutlookDashboardMetrics =
  async (params = {}) => {
    return getDashboardMetrics(
      params
    );
  };

export const getCalendar = async (
  date,
  params = {}
) => {
  return serviceGetOutlookCalendar(
    date,
    params
  );
};

export const getCalendarForDate =
  getCalendar;

export const getOutlookCalendar =
  getCalendar;

export const getEvents = async (
  params = {}
) => {
  const response =
    await serviceGetCalendarEvents(
      params
    );

  return normalizeCalendarArray(
    response
  );
};

export const getCalendarEventsList =
  getEvents;

export const getCalendarEvents =
  getEvents;

export const getEvent = async (
  eventId
) => {
  if (!eventId) {
    throw new Error(
      "Calendar event ID is required."
    );
  }

  return serviceGetCalendarEvent(
    eventId
  );
};

export const getCalendarEvent =
  getEvent;

export const createEvent = async (
  event
) => {
  if (!event) {
    throw new Error(
      "Calendar event data is required."
    );
  }

  return serviceCreateCalendarEvent(
    event
  );
};

export const createCalendarEvent =
  createEvent;

export const updateEvent = async (
  eventId,
  event
) => {
  if (!eventId) {
    throw new Error(
      "Calendar event ID is required."
    );
  }

  if (!event) {
    throw new Error(
      "Calendar event data is required."
    );
  }

  return serviceUpdateCalendarEvent(
    eventId,
    event
  );
};

export const updateCalendarEvent =
  updateEvent;

export const deleteEvent = async (
  eventId
) => {
  if (!eventId) {
    throw new Error(
      "Calendar event ID is required."
    );
  }

  return serviceDeleteCalendarEvent(
    eventId
  );
};

export const deleteCalendarEvent =
  deleteEvent;

export const getTodoLists = async () => {
  return serviceGetTaskLists();
};

export const getTaskListsData =
  getTodoLists;

export const getTaskLists =
  getTodoLists;

export const getTasks = async (
  params = {}
) => {
  const safeTop =
    clamp(
      params?.top,
      1,
      MAX_TASK_TOP,
      MAX_TASK_TOP
    );

  return serviceGetOutlookTasks({
    ...params,
    top:
      safeTop,
  });
};

export const getTodoTasks =
  getTasks;

export const getOutlookTasks =
  getTasks;

export const getNormalizedTasks =
  async (params = {}) => {
    const response =
      await getTasks(params);

    return normalizeTaskArray(
      response
    );
  };

export const createTask = async (
  task
) => {
  if (
    !task?.title ||
    !String(
      task.title
    ).trim()
  ) {
    throw new Error(
      "Task title is required."
    );
  }

  return serviceCreateOutlookTask(
    task
  );
};

export const createTodoTask =
  createTask;

export const createOutlookTask =
  createTask;

export const updateTask = async (
  taskId,
  task
) => {
  if (!taskId) {
    throw new Error(
      "Task ID is required."
    );
  }

  if (
    !task ||
    typeof task !== "object"
  ) {
    throw new Error(
      "Task update data is required."
    );
  }

  return serviceUpdateOutlookTask(
    taskId,
    task
  );
};

export const updateTodoTask =
  updateTask;

export const updateOutlookTask =
  updateTask;

export const completeTask = async (
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

  return serviceCompleteOutlookTask(
    taskId,
    listId
  );
};

export const completeTodoTask =
  completeTask;

export const completeOutlookTask =
  completeTask;

export const calculateTaskStats = (
  tasks = []
) => {
  const list =
    Array.isArray(tasks)
      ? tasks
      : [];

  const now =
    new Date();

  let completed = 0;
  let pending = 0;
  let overdue = 0;

  for (const task of list) {
    const status =
      String(
        task?.status ||
        ""
      ).toLowerCase();

    const isCompleted =
      status ===
      "completed";

    if (isCompleted) {
      completed += 1;
      continue;
    }

    pending += 1;

    const due =
      task?.dueDateTime
        ?.dateTime ||
      task?.dueDateTime ||
      task?.dueDate ||
      null;

    if (due) {
      const dueDate =
        new Date(due);

      if (
        !Number.isNaN(
          dueDate.getTime()
        ) &&
        dueDate < now
      ) {
        overdue += 1;
      }
    }
  }

  const total =
    list.length;

  const completionRate =
    total > 0
      ? Math.round(
          (
            completed /
            total
          ) * 100
        )
      : 0;

  return {
    total,
    completed,
    pending,
    overdue,
    completionRate,
  };
};

export const getTaskMetrics =
  async () => {
    const response =
      await getTasks({
        top:
          MAX_TASK_TOP,
      });

    const tasks =
      normalizeTaskArray(
        response
      );

    const stats =
      calculateTaskStats(
        tasks
      );

    return {
      ...stats,
      tasks,
      lists:
        response?.lists ||
        response?.taskLists ||
        [],
      generatedAt:
        new Date().toISOString(),
    };
  };

export const getHealth = async () => {
  try {
    return await backendRequest(
      "GET",
      "/outlook/health"
    );
  } catch (error) {
    return {
      success: false,
      connected: false,
      error:
        error?.message ||
        "Outlook health check failed.",
    };
  }
};

export const getOutlookHealth =
  async (...args) => {
    return getHealth(
      ...args
    );
  };

export const requestGraph = async (
  endpoint,
  options = {}
) => {
  return serviceGraphRequest(
    endpoint,
    options
  );
};

export const requestAllGraphPages =
  async (
    endpoint,
    options = {}
  ) => {
    return serviceGetAllGraphPages(
      endpoint,
      options
    );
  };

const outlookApi = {
  getActiveMicrosoftAccount,
  getMicrosoftAccount,

  getAccessToken,

  getProfile,
  getOutlookProfile,
  getOutlookUser,
  getMe,

  getConnectionStatus,
  testOutlookConnection,

  getDashboardMetrics,
  getOutlookDashboardMetrics,

  getInbox,
  getInboxEmails,
  getOutlookInbox,

  getMail,
  getAllMail,
  getOutlookMail,

  getMessages,
  getMessage,
  getEmailById,

  markAsRead,
  markAsUnread,
  markEmailAsRead,
  markEmailAsUnread,

  updateMessage,

  deleteMessage,
  deleteEmail,

  moveMessage,
  archiveEmail,

  sendMail,

  replyToMessage,
  replyToEmail,

  getTodayRange,
  getCurrentMonthRange,

  getInboxForRange,
  getTodayInbox,
  getThisMonthInbox,

  getSentForRange,
  getTodaySent,
  getThisMonthSent,

  getWorkflowMessages,
  getDashboardWorkflowData,
  getWorkflowData,

  calculateEmailMetrics,

  getTodayEmailMetrics,
  getCurrentMonthEmailMetrics,

  calculateResponseRate,
  getCurrentMonthResponseRate,

  getCalendar,
  getCalendarForDate,
  getOutlookCalendar,

  getEvents,
  getCalendarEventsList,
  getCalendarEvents,

  getEvent,
  getCalendarEvent,

  createEvent,
  createCalendarEvent,

  updateEvent,
  updateCalendarEvent,

  deleteEvent,
  deleteCalendarEvent,

  getTodoLists,
  getTaskListsData,
  getTaskLists,

  getTasks,
  getTodoTasks,
  getOutlookTasks,
  getNormalizedTasks,

  createTask,
  createTodoTask,
  createOutlookTask,

  updateTask,
  updateTodoTask,
  updateOutlookTask,

  completeTask,
  completeTodoTask,
  completeOutlookTask,

  calculateTaskStats,
  getTaskMetrics,

  getHealth,
  getOutlookHealth,

  requestGraph,
  requestAllGraphPages,
};

export default outlookApi;