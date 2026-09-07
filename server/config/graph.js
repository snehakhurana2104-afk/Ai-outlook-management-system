/******************************************************************************
 * graphService.js
 * Microsoft Graph API Service
 *
 * Location:
 * server/services/graphService.js
 *
 * Purpose:
 * - Calls Microsoft Graph API from Node.js backend
 * - Uses Microsoft access token received from frontend
 * - Does NOT use MSAL browser
 * - Does NOT use window
 * - Does NOT use React environment variables
 * - Does NOT verify Graph token with JWT_SECRET
 ******************************************************************************/

"use strict";

const axios = require("axios");

/* ============================================================================
   MICROSOFT GRAPH
============================================================================ */

const GRAPH_BASE_URL =
  process.env.GRAPH_BASE_URL ||
  "https://graph.microsoft.com/v1.0";

/* ============================================================================
   AXIOS CLIENT
============================================================================ */

const graphClient = axios.create({
  baseURL: GRAPH_BASE_URL,

  timeout:
    Number(process.env.GRAPH_TIMEOUT || 30000),

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/* ============================================================================
   TOKEN VALIDATION
============================================================================ */

const normalizeToken = (token) => {
  if (!token) {
    return null;
  }

  if (
    typeof token !== "string"
  ) {
    return null;
  }

  const cleaned =
    token.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned;
};

/* ============================================================================
   GET GRAPH TOKEN FROM REQUEST
============================================================================ */

const getGraphToken = (req) => {
  const token =
    normalizeToken(req?.graphToken) ||
    normalizeToken(req?.accessToken) ||
    normalizeToken(req?.user?.accessToken);

  return token;
};

/* ============================================================================
   GRAPH REQUEST
============================================================================ */

const graphRequest = async ({
  req,
  method = "GET",
  url,
  params,
  data,
  headers = {},
}) => {
  const token =
    getGraphToken(req);

  if (!token) {
    const error =
      new Error(
        "Microsoft Graph access token is missing."
      );

    error.code =
      "GRAPH_TOKEN_MISSING";

    error.status =
      401;

    throw error;
  }

  try {
    const response =
      await graphClient.request({
        method,

        url,

        params,

        data,

        headers: {
          ...headers,

          Authorization:
            `Bearer ${token}`,
        },
      });

    return response;
  } catch (error) {
    const status =
      error?.response?.status;

    const graphError =
      error?.response?.data;

    console.error(
      "[GraphService] Microsoft Graph request failed:",
      {
        status,
        url,
        error:
          graphError ||
          error.message,
      }
    );

    if (status === 401) {
      const authError =
        new Error(
          "Microsoft access token is invalid or expired."
        );

      authError.code =
        "GRAPH_TOKEN_INVALID";

      authError.status =
        401;

      authError.graphResponse =
        graphError;

      throw authError;
    }

    if (status === 403) {
      const permissionError =
        new Error(
          "Microsoft Graph permission denied. Please check Microsoft 365 permissions and consent."
        );

      permissionError.code =
        "GRAPH_PERMISSION_DENIED";

      permissionError.status =
        403;

      permissionError.graphResponse =
        graphError;

      throw permissionError;
    }

    error.status =
      status || 500;

    throw error;
  }
};

/* ============================================================================
   GET USER PROFILE
============================================================================ */

const getUserProfile = async (
  req
) => {
  const response =
    await graphRequest({
      req,

      method: "GET",

      url: "/me",

      params: {
        $select:
          [
            "id",
            "displayName",
            "givenName",
            "surname",
            "mail",
            "userPrincipalName",
            "jobTitle",
            "officeLocation",
          ].join(","),
      },
    });

  return response.data;
};

/* ============================================================================
   EMAIL SELECT
============================================================================ */

const EMAIL_SELECT = [
  "id",
  "subject",
  "from",
  "sender",
  "toRecipients",
  "ccRecipients",
  "receivedDateTime",
  "sentDateTime",
  "bodyPreview",
  "isRead",
  "importance",
  "flag",
  "categories",
  "conversationId",
  "hasAttachments",
  "webLink",
  "isDraft",
].join(",");

/* ============================================================================
   GET MESSAGES
============================================================================ */

const getMessages = async (
  req,
  {
    folder = null,
    top = 100,
    maxMessages = 1000,
    filter = null,
  } = {}
) => {
  const safeTop =
    Math.min(
      Math.max(
        Number(top) || 100,
        1
      ),
      100
    );

  const safeMax =
    Math.min(
      Math.max(
        Number(maxMessages) || 1000,
        1
      ),
      5000
    );

  let url =
    folder
      ? `/me/mailFolders/${folder}/messages`
      : "/me/messages";

  const allMessages = [];

  let firstRequest = true;

  let nextUrl =
    url;

  while (
    nextUrl &&
    allMessages.length <
      safeMax
  ) {
    let response;

    if (firstRequest) {
      response =
        await graphRequest({
          req,

          method: "GET",

          url: nextUrl,

          params: {
            $top: safeTop,

            $orderby:
              "receivedDateTime DESC",

            $select:
              EMAIL_SELECT,

            ...(filter
              ? {
                  $filter:
                    filter,
                }
              : {}),
          },
        });

      firstRequest = false;
    } else {
      /*
       * @odata.nextLink already contains
       * all required query parameters.
       */

      response =
        await graphRequest({
          req,

          method: "GET",

          url: nextUrl,
        });
    }

    const page =
      Array.isArray(
        response?.data?.value
      )
        ? response.data.value
        : [];

    allMessages.push(
      ...page
    );

    nextUrl =
      response?.data?.[
        "@odata.nextLink"
      ] || null;

    if (!page.length) {
      break;
    }
  }

  const messages =
    allMessages.slice(
      0,
      safeMax
    );

  return {
    value: messages,

    count:
      messages.length,

    total:
      messages.length,
  };
};

/* ============================================================================
   ALL MAIL
============================================================================ */

const getAllMail = async (
  req,
  options = {}
) => {
  return getMessages(
    req,
    options
  );
};

/* ============================================================================
   INBOX
============================================================================ */

const getInbox = async (
  req,
  options = {}
) => {
  return getMessages(
    req,
    {
      ...options,

      folder: "Inbox",
    }
  );
};

/* ============================================================================
   SENT
============================================================================ */

const getSentMail = async (
  req,
  options = {}
) => {
  return getMessages(
    req,
    {
      ...options,

      folder: "SentItems",
    }
  );
};

/* ============================================================================
   DRAFTS
============================================================================ */

const getDraftMail = async (
  req,
  options = {}
) => {
  return getMessages(
    req,
    {
      ...options,

      folder: "Drafts",
    }
  );
};

/* ============================================================================
   DELETED
============================================================================ */

const getDeletedMail = async (
  req,
  options = {}
) => {
  return getMessages(
    req,
    {
      ...options,

      folder: "DeletedItems",
    }
  );
};

/* ============================================================================
   GET SINGLE MESSAGE
============================================================================ */

const getMessageById = async (
  req,
  messageId
) => {
  if (!messageId) {
    const error =
      new Error(
        "Message ID is required."
      );

    error.status =
      400;

    throw error;
  }

  const response =
    await graphRequest({
      req,

      method: "GET",

      url:
        `/me/messages/${encodeURIComponent(
          messageId
        )}`,

      params: {
        $select:
          EMAIL_SELECT,
      },
    });

  return response.data;
};

/* ============================================================================
   MARK AS READ
============================================================================ */

const markAsRead = async (
  req,
  messageId
) => {
  if (!messageId) {
    const error =
      new Error(
        "Message ID is required."
      );

    error.status =
      400;

    throw error;
  }

  const response =
    await graphRequest({
      req,

      method: "PATCH",

      url:
        `/me/messages/${encodeURIComponent(
          messageId
        )}`,

      data: {
        isRead: true,
      },
    });

  return response.data;
};

/* ============================================================================
   MARK AS UNREAD
============================================================================ */

const markAsUnread = async (
  req,
  messageId
) => {
  if (!messageId) {
    const error =
      new Error(
        "Message ID is required."
      );

    error.status =
      400;

    throw error;
  }

  const response =
    await graphRequest({
      req,

      method: "PATCH",

      url:
        `/me/messages/${encodeURIComponent(
          messageId
        )}`,

      data: {
        isRead: false,
      },
    });

  return response.data;
};

/* ============================================================================
   DELETE MESSAGE
============================================================================ */

const deleteMessage = async (
  req,
  messageId
) => {
  if (!messageId) {
    const error =
      new Error(
        "Message ID is required."
      );

    error.status =
      400;

    throw error;
  }

  await graphRequest({
    req,

    method: "DELETE",

    url:
      `/me/messages/${encodeURIComponent(
        messageId
      )}`,
  });

  return true;
};

/* ============================================================================
   ARCHIVE MESSAGE
============================================================================ */

const archiveMessage = async (
  req,
  messageId
) => {
  if (!messageId) {
    const error =
      new Error(
        "Message ID is required."
      );

    error.status =
      400;

    throw error;
  }

  /*
   * Get Archive folder first.
   */

  const archiveResponse =
    await graphRequest({
      req,

      method: "GET",

      url:
        "/me/mailFolders",

      params: {
        $filter:
          "displayName eq 'Archive'",
      },
    });

  const folders =
    archiveResponse?.data?.value ||
    [];

  const archiveFolder =
    folders[0];

  if (!archiveFolder?.id) {
    const error =
      new Error(
        "Archive folder was not found."
      );

    error.status =
      404;

    throw error;
  }

  const response =
    await graphRequest({
      req,

      method: "POST",

      url:
        `/me/messages/${encodeURIComponent(
          messageId
        )}/move`,

      data: {
        destinationId:
          archiveFolder.id,
      },
    });

  return response.data;
};

/* ============================================================================
   SEND MAIL
============================================================================ */

const sendMail = async (
  req,
  {
    to,
    cc = [],
    bcc = [],
    subject = "",
    body = "",
    bodyType = "HTML",
  }
) => {
  if (!to) {
    const error =
      new Error(
        "Recipient email is required."
      );

    error.status =
      400;

    throw error;
  }

  const recipients =
    Array.isArray(to)
      ? to
      : [to];

  const toRecipients =
    recipients
      .filter(Boolean)
      .map(
        (email) => ({
          emailAddress: {
            address:
              email,
          },
        })
      );

  const ccRecipients =
    Array.isArray(cc)
      ? cc
          .filter(Boolean)
          .map(
            (email) => ({
              emailAddress: {
                address:
                  email,
              },
            })
          )
      : [];

  const bccRecipients =
    Array.isArray(bcc)
      ? bcc
          .filter(Boolean)
          .map(
            (email) => ({
              emailAddress: {
                address:
                  email,
              },
            })
          )
      : [];

  await graphRequest({
    req,

    method: "POST",

    url: "/me/sendMail",

    data: {
      message: {
        subject,

        body: {
          contentType:
            bodyType,

          content:
            body,
        },

        toRecipients,

        ccRecipients,

        bccRecipients,
      },

      saveToSentItems:
        true,
    },
  });

  return true;
};

/* ============================================================================
   REPLY MESSAGE
============================================================================ */

const replyToMessage = async (
  req,
  messageId,
  comment
) => {
  if (!messageId) {
    const error =
      new Error(
        "Message ID is required."
      );

    error.status =
      400;

    throw error;
  }

  await graphRequest({
    req,

    method: "POST",

    url:
      `/me/messages/${encodeURIComponent(
        messageId
      )}/reply`,

    data: {
      comment:
        comment || "",
    },
  });

  return true;
};

/* ============================================================================
   REPLY ALL
============================================================================ */

const replyAllToMessage =
  async (
    req,
    messageId,
    comment
  ) => {
    if (!messageId) {
      const error =
        new Error(
          "Message ID is required."
        );

      error.status =
        400;

      throw error;
    }

    await graphRequest({
      req,

      method: "POST",

      url:
        `/me/messages/${encodeURIComponent(
          messageId
        )}/replyAll`,

      data: {
        comment:
          comment || "",
      },
    });

    return true;
  };

/* ============================================================================
   FORWARD MESSAGE
============================================================================ */

const forwardMessage = async (
  req,
  messageId,
  {
    to,
    comment = "",
  } = {}
) => {
  if (!messageId) {
    const error =
      new Error(
        "Message ID is required."
      );

    error.status =
      400;

    throw error;
  }

  const recipients =
    Array.isArray(to)
      ? to
      : [to];

  const toRecipients =
    recipients
      .filter(Boolean)
      .map(
        (email) => ({
          emailAddress: {
            address:
              email,
          },
        })
      );

  if (
    !toRecipients.length
  ) {
    const error =
      new Error(
        "Forward recipient is required."
      );

    error.status =
      400;

    throw error;
  }

  await graphRequest({
    req,

    method: "POST",

    url:
      `/me/messages/${encodeURIComponent(
        messageId
      )}/forward`,

    data: {
      comment,

      toRecipients,
    },
  });

  return true;
};

/* ============================================================================
   SEARCH MAIL
============================================================================ */

const searchMail = async (
  req,
  searchText,
  options = {}
) => {
  if (!searchText) {
    return {
      value: [],
      count: 0,
      total: 0,
    };
  }

  const safeTop =
    Math.min(
      Math.max(
        Number(options.top) || 50,
        1
      ),
      100
    );

  const response =
    await graphRequest({
      req,

      method: "GET",

      url: "/me/messages",

      params: {
        $top: safeTop,

        $search:
          `"${searchText}"`,

        $select:
          EMAIL_SELECT,
      },

      headers: {
        ConsistencyLevel:
          "eventual",
      },
    });

  const messages =
    Array.isArray(
      response?.data?.value
    )
      ? response.data.value
      : [];

  return {
    value: messages,

    count:
      messages.length,

    total:
      messages.length,
  };
};

/* ============================================================================
   PROFILE PHOTO
============================================================================ */

const getProfilePhoto =
  async (req) => {
    const token =
      getGraphToken(req);

    if (!token) {
      const error =
        new Error(
          "Microsoft Graph access token is missing."
        );

      error.status =
        401;

      throw error;
    }

    try {
      const response =
        await axios.get(
          `${GRAPH_BASE_URL}/me/photo/$value`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            responseType:
              "arraybuffer",

            timeout: 30000,
          }
        );

      return {
        data:
          response.data,

        contentType:
          response.headers[
            "content-type"
          ] ||
          "image/jpeg",
      };
    } catch (error) {
      if (
        error?.response?.status ===
        404
      ) {
        return null;
      }

      throw error;
    }
  };

/* ============================================================================
   EXPORTS
============================================================================ */

module.exports = {
  graphRequest,

  getGraphToken,

  getUserProfile,

  getAllMail,

  getInbox,

  getSentMail,

  getDraftMail,

  getDeletedMail,

  getMessageById,

  markAsRead,

  markAsUnread,

  deleteMessage,

  archiveMessage,

  sendMail,

  replyToMessage,

  replyAllToMessage,

  forwardMessage,

  searchMail,

  getProfilePhoto,
};

/******************************************************************************
 * End graphService.js
 ******************************************************************************/