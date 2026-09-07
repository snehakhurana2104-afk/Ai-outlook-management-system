/******************************************************************************
 * graphMailService.js
 * Microsoft Graph Mail Service
 * Adapter for mailController.js
 ******************************************************************************/

"use strict";

const axios = require("axios");

/* ============================================================================
   Configuration
============================================================================ */

const GRAPH_BASE_URL =
  "https://graph.microsoft.com/v1.0";

const DEFAULT_TIMEOUT =
  Number(process.env.GRAPH_TIMEOUT || 30000);

const MAX_RETRIES =
  Number(process.env.GRAPH_MAX_RETRIES || 3);

/* ============================================================================
   Graph Mail Service
============================================================================ */

class GraphMailService {

  constructor() {
    this.baseURL = GRAPH_BASE_URL;
    this.timeout = DEFAULT_TIMEOUT;
    this.maxRetries = MAX_RETRIES;
  }

  /* ==========================================================================
     Get Access Token
  ========================================================================== */

  getAccessToken(req) {

    const token =
      req?.headers?.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null;

    if (!token) {
      throw new Error(
        "Microsoft Graph access token is required."
      );
    }

    return token;
  }

  /* ==========================================================================
     Axios Client
  ========================================================================== */

  createClient(accessToken) {

    if (!accessToken) {
      throw new Error(
        "Microsoft Graph access token is required."
      );
    }

    return axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  /* ==========================================================================
     Retry
  ========================================================================== */

  async execute(requestFn) {

    let lastError = null;

    for (
      let attempt = 1;
      attempt <= this.maxRetries;
      attempt++
    ) {

      try {

        return await requestFn();

      } catch (error) {

        lastError = error;

        console.error(
          `[Graph Mail Attempt ${attempt}]`,
          error.message
        );

        const status =
          error?.response?.status;

        // Don't retry authentication / bad request errors
        if (
          status === 400 ||
          status === 401 ||
          status === 403 ||
          status === 404
        ) {
          throw error;
        }

        if (
          attempt < this.maxRetries
        ) {

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                attempt * 1000
              )
          );

        }

      }

    }

    throw lastError;
  }

  /* ==========================================================================
     Graph Error
  ========================================================================== */

  mapGraphError(error) {

    const graphError =
      error?.response?.data?.error;

    const mapped =
      new Error(
        graphError?.message ||
        error?.message ||
        "Microsoft Graph request failed."
      );

    mapped.status =
      error?.response?.status || 500;

    mapped.code =
      graphError?.code ||
      "GRAPH_ERROR";

    return mapped;
  }

  /* ==========================================================================
     GET INBOX
  ========================================================================== */

  async getInbox({
    folder = "Inbox",
    page = 1,
    limit = 25,
    unread,
    importance,
    accessToken,
  } = {}) {

    if (!accessToken) {
      throw new Error(
        "Microsoft Graph access token is required."
      );
    }

    const client =
      this.createClient(accessToken);

    const safePage =
      Math.max(Number(page) || 1, 1);

    const safeLimit =
      Math.min(
        Math.max(Number(limit) || 25, 1),
        100
      );

    const skip =
      (safePage - 1) * safeLimit;

    let folderPath =
      "inbox";

    if (
      folder &&
      String(folder).toLowerCase() !== "inbox"
    ) {

      folderPath =
        encodeURIComponent(folder);

    }

    const params = {
      $top: safeLimit,
      $skip: skip,
      $orderby: "receivedDateTime desc",
    };

    const filters = [];

    if (
      unread !== undefined &&
      unread !== ""
    ) {

      const unreadValue =
        String(unread).toLowerCase() === "true";

      filters.push(
        `isRead eq ${!unreadValue}`
      );

    }

    if (
      importance &&
      importance !== "all"
    ) {

      filters.push(
        `importance eq '${String(
          importance
        ).replace(/'/g, "''")}'`
      );

    }

    if (filters.length > 0) {

      params.$filter =
        filters.join(" and ");

    }

    try {

      const response =
        await this.execute(
          () =>
            client.get(
              `/me/mailFolders/${folderPath}/messages`,
              {
                params,
              }
            )
        );

      const messages =
        response?.data?.value || [];

      return {

        success: true,

        count:
          messages.length,

        total:
          messages.length,

        messages,

        value:
          messages,

        "@odata.nextLink":
          response?.data?.["@odata.nextLink"] ||
          null,

      };

    } catch (error) {

      throw this.mapGraphError(error);

    }

  }

  /* ==========================================================================
     GET MESSAGE
  ========================================================================== */

  async getMessage(
    messageId,
    accessToken
  ) {

    if (!messageId) {

      throw new Error(
        "Message ID is required."
      );

    }

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    const client =
      this.createClient(accessToken);

    try {

      const response =
        await this.execute(
          () =>
            client.get(
              `/me/messages/${encodeURIComponent(
                messageId
              )}`
            )
        );

      return (
        response?.data || null
      );

    } catch (error) {

      throw this.mapGraphError(error);

    }

  }

  /* ==========================================================================
     SYNC INBOX
  ========================================================================== */

  async syncInbox(accessToken) {

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    const client =
      this.createClient(accessToken);

    const startedAt =
      Date.now();

    try {

      const response =
        await this.execute(
          () =>
            client.get(
              "/me/mailFolders/inbox/messages",
              {
                params: {
                  $top: 100,
                  $orderby:
                    "receivedDateTime desc",
                },
              }
            )
        );

      const messages =
        response?.data?.value || [];

      return {

        success: true,

        synced:
          messages.length,

        inserted:
          0,

        updated:
          0,

        skipped:
          0,

        messages,

        duration:
          `${Date.now() - startedAt}ms`,

        nextLink:
          response?.data?.["@odata.nextLink"] ||
          null,

      };

    } catch (error) {

      throw this.mapGraphError(error);

    }

  }

  /* ==========================================================================
     REPLY TO MESSAGE
  ========================================================================== */

  async replyToMessage({
    messageId,
    comment = "",
    accessToken,
  }) {

    if (!messageId) {

      throw new Error(
        "Message ID is required."
      );

    }

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    const client =
      this.createClient(accessToken);

    try {

      const response =
        await this.execute(
          () =>
            client.post(
              `/me/messages/${encodeURIComponent(
                messageId
              )}/reply`,
              {
                comment:
                  comment || "",
              }
            )
        );

      return {

        success: true,

        status:
          response.status,

        messageId,

        sentAt:
          new Date().toISOString(),

      };

    } catch (error) {

      throw this.mapGraphError(error);

    }

  }

  /* ==========================================================================
     REPLY ALL
  ========================================================================== */

  async replyAll({
    messageId,
    comment = "",
    accessToken,
  }) {

    if (!messageId) {

      throw new Error(
        "Message ID is required."
      );

    }

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    const client =
      this.createClient(accessToken);

    try {

      const response =
        await this.execute(
          () =>
            client.post(
              `/me/messages/${encodeURIComponent(
                messageId
              )}/replyAll`,
              {
                comment:
                  comment || "",
              }
            )
        );

      return {

        success: true,

        status:
          response.status,

        messageId,

        sentAt:
          new Date().toISOString(),

      };

    } catch (error) {

      throw this.mapGraphError(error);

    }

  }

  /* ==========================================================================
     FORWARD MESSAGE
  ========================================================================== */

  async forwardMessage({
    messageId,
    to,
    comment = "",
    accessToken,
  }) {

    if (!messageId) {

      throw new Error(
        "Message ID is required."
      );

    }

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    if (!to) {

      throw new Error(
        "Forward recipient is required."
      );

    }

    const client =
      this.createClient(accessToken);

    let recipients = [];

    if (Array.isArray(to)) {

      recipients =
        to.map(address => ({
          emailAddress: {
            address,
          },
        }));

    } else {

      recipients = [
        {
          emailAddress: {
            address: String(to).trim(),
          },
        },
      ];

    }

    try {

      const response =
        await this.execute(
          () =>
            client.post(
              `/me/messages/${encodeURIComponent(
                messageId
              )}/forward`,
              {
                comment:
                  comment || "",

                toRecipients:
                  recipients,
              }
            )
        );

      return {

        success: true,

        status:
          response.status,

        messageId,

        forwardedAt:
          new Date().toISOString(),

      };

    } catch (error) {

      throw this.mapGraphError(error);

    }

  }

  /* ==========================================================================
     ARCHIVE MESSAGE
  ========================================================================== */

  async archiveMessage({
    messageId,
    accessToken,
  }) {

    if (!messageId) {

      throw new Error(
        "Message ID is required."
      );

    }

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    const client =
      this.createClient(accessToken);

    try {

      // Microsoft Graph archive folder
      // destination is archive folder ID.

      const foldersResponse =
        await this.execute(
          () =>
            client.get(
              "/me/mailFolders",
              {
                params: {
                  $filter:
                    "displayName eq 'Archive'",
                },
              }
            )
        );

      let archiveFolder =
        foldersResponse?.data?.value?.[0];

      // If Archive folder isn't returned,
      // try well-known archive folder.

      if (!archiveFolder) {

        archiveFolder = {
          id: "archive",
        };

      }

      const response =
        await this.execute(
          () =>
            client.post(
              `/me/messages/${encodeURIComponent(
                messageId
              )}/move`,
              {
                destinationId:
                  archiveFolder.id,
              }
            )
        );

      return {

        success: true,

        messageId,

        folderId:
          archiveFolder.id,

        message:
          response?.data || null,

        archivedAt:
          new Date().toISOString(),

      };

    } catch (error) {

      throw this.mapGraphError(error);

    }

  }

  /* ==========================================================================
     DELETE MESSAGE
  ========================================================================== */

  async deleteMessage(
    messageId,
    accessToken
  ) {

    if (!messageId) {

      throw new Error(
        "Message ID is required."
      );

    }

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    const client =
      this.createClient(accessToken);

    try {

      const response =
        await this.execute(
          () =>
            client.delete(
              `/me/messages/${encodeURIComponent(
                messageId
              )}`
            )
        );

      return {

        success: true,

        status:
          response.status,

        messageId,

        deletedAt:
          new Date().toISOString(),

      };

    } catch (error) {

      throw this.mapGraphError(error);

    }

  }

  /* ==========================================================================
     MARK AS READ
  ========================================================================== */

  async markAsRead({
    messageId,
    accessToken,
  }) {

    return this.updateMessage({
      messageId,
      isRead: true,
      accessToken,
    });

  }

  /* ==========================================================================
     MARK AS UNREAD
  ========================================================================== */

  async markAsUnread({
    messageId,
    accessToken,
  }) {

    return this.updateMessage({
      messageId,
      isRead: false,
      accessToken,
    });

  }

  /* ==========================================================================
     UPDATE MESSAGE
  ========================================================================== */

  async updateMessage({
    messageId,
    subject,
    body,
    isRead,
    accessToken,
  }) {

    if (!messageId) {

      throw new Error(
        "Message ID is required."
      );

    }

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    const client =
      this.createClient(accessToken);

    const payload = {};

    if (
      subject !== undefined
    ) {

      payload.subject =
        subject;

    }

    if (
      body !== undefined
    ) {

      payload.body = {

        contentType:
          "HTML",

        content:
          body,

      };

    }

    if (
      isRead !== undefined
    ) {

      payload.isRead =
        isRead;

    }

    try {

      const response =
        await this.execute(
          () =>
            client.patch(
              `/me/messages/${encodeURIComponent(
                messageId
              )}`,
              payload
            )
        );

      return {

        success: true,

        messageId,

        message:
          response?.data || null,

        updatedAt:
          new Date().toISOString(),

      };

    } catch (error) {

      throw this.mapGraphError(error);

    }

  }

  /* ==========================================================================
     HEALTH CHECK
  ========================================================================== */

  async healthCheck(accessToken) {

    if (!accessToken) {

      return {

        success: false,

        status: "unhealthy",

        message:
          "Microsoft Graph access token is required.",

      };

    }

    try {

      const client =
        this.createClient(accessToken);

      const response =
        await client.get("/me");

      return {

        success: true,

        status: "healthy",

        service:
          "Microsoft Graph Mail Service",

        user:
          response?.data?.userPrincipalName ||
          response?.data?.mail ||
          response?.data?.displayName ||
          null,

        checkedAt:
          new Date().toISOString(),

      };

    } catch (error) {

      const mapped =
        this.mapGraphError(error);

      return {

        success: false,

        status: "unhealthy",

        code:
          mapped.code,

        message:
          mapped.message,

      };

    }

  }

  /* ==========================================================================
     SERVICE INFO
  ========================================================================== */

  getServiceInfo() {

    return {

      provider:
        "Microsoft Graph",

      service:
        "Mail Service",

      version:
        "v1.0",

      endpoint:
        this.baseURL,

      timeout:
        this.timeout,

      retries:
        this.maxRetries,

    };

  }

}

/* ============================================================================
   Singleton
============================================================================ */

const graphMailService =
  new GraphMailService();

console.info(
  "[Microsoft Graph] GraphMailService initialized."
);

/* ============================================================================
   Export
============================================================================ */

module.exports =
  graphMailService;