"use strict";

const Email = require("../models/Email");

const graphMailService = require("../services/graphMailService");
const graphSearchService = require("../services/graphSearchService");
const graphCategoryService = require("../services/graphCategoryService");

const aiClassificationService = require("../services/aiClassificationService");
const aiAutoReplyService = require("../services/aiAutoReplyService");
const aiPriorityService = require("../services/aiPriorityService");
const aiSuggestionService = require("../services/aiSuggestionService");
const aiSLAService = require("../services/aiSLAService");

/* ============================================================
   RESPONSE HELPERS
============================================================ */

const successResponse = (
  res,
  data = {},
  message = "Success",
  status = 200
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const errorResponse = (
  res,
  error,
  status = 500
) => {
  console.error("[MailController]", error);

  return res.status(status).json({
    success: false,
    message:
      error?.message ||
      "Internal Server Error",
    code:
      error?.code ||
      "MAIL_CONTROLLER_ERROR",
    timestamp: new Date().toISOString(),
  });
};

/* ============================================================
   GRAPH ACCESS TOKEN
============================================================ */

const getGraphAccessToken = (req) => {
  const tokenFromUser =
    req?.user?.accessToken ||
    req?.user?.access_token ||
    req?.user?.token ||
    null;

  if (tokenFromUser) {
    return tokenFromUser;
  }

  if (req?.accessToken) {
    return req.accessToken;
  }

  if (req?.session?.accessToken) {
    return req.session.accessToken;
  }

  const authorization =
    req?.headers?.authorization;

  if (
    authorization &&
    authorization.startsWith("Bearer ")
  ) {
    const token =
      authorization
        .substring(7)
        .trim();

    if (token) {
      return token;
    }
  }

  return null;
};

const requireGraphAccessToken = (req) => {
  const accessToken =
    getGraphAccessToken(req);

  if (!accessToken) {
    const error = new Error(
      "Microsoft Graph access token is missing. Please authenticate with Microsoft 365 first."
    );

    error.code =
      "GRAPH_ACCESS_TOKEN_MISSING";

    error.status = 401;

    throw error;
  }

  return accessToken;
};

/* ============================================================
   MONGODB EMAIL HELPERS
============================================================ */

const validateMailId = async (
  emailId
) => {
  if (!emailId) {
    const error = new Error(
      "Email ID is required."
    );

    error.status = 400;

    throw error;
  }

  const email =
    await Email.findById(emailId);

  if (!email) {
    const error = new Error(
      "Email not found."
    );

    error.status = 404;

    throw error;
  }

  return email;
};

const getGraphMessageId = (email) => {
  return (
    email?.messageId ||
    email?.graphMessageId ||
    email?.outlookMessageId ||
    email?.id ||
    null
  );
};

/* ============================================================
   GET INBOX

   GET /api/outlook/inbox
============================================================ */

const getInbox = async (
  req,
  res
) => {
  try {
    const {
      page = 1,
      limit = 25,
      folder = "Inbox",
      search = "",
      unread,
      importance,
    } = req.query;

    const accessToken =
      requireGraphAccessToken(req);

    /* --------------------------------------------------------
       SEARCH
    -------------------------------------------------------- */

    if (
      search &&
      search.trim().length > 0
    ) {
      const result =
        await graphSearchService.searchMessages({
          query: search.trim(),
          page: Number(page),
          limit: Number(limit),
          accessToken,
        });

      return successResponse(
        res,
        {
          emails:
            result?.value ||
            result?.messages ||
            [],

          pagination: {
            page: Number(page),
            limit: Number(limit),

            total:
              result?.total ||
              result?.count ||
              0,

            nextLink:
              result?.["@odata.nextLink"] ||
              result?.nextLink ||
              null,
          },
        },
        "Mail search completed successfully."
      );
    }

    /* --------------------------------------------------------
       INBOX
    -------------------------------------------------------- */

    const result =
      await graphMailService.getInbox({
        folder,
        page: Number(page),
        limit: Number(limit),
        unread,
        importance,
        accessToken,
      });

    return successResponse(
      res,
      {
        emails:
          result?.value ||
          result?.messages ||
          [],

        pagination: {
          page: Number(page),
          limit: Number(limit),

          total:
            result?.total ||
            result?.count ||
            0,

          nextLink:
            result?.["@odata.nextLink"] ||
            result?.nextLink ||
            null,
        },
      },
      "Inbox fetched successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   GET MAIL BY ID

   GET /api/outlook/:mailId
============================================================ */

const getMailById = async (
  req,
  res
) => {
  try {
    const { mailId } =
      req.params;

    if (!mailId) {
      return errorResponse(
        res,
        new Error(
          "Mail ID is required."
        ),
        400
      );
    }

    const accessToken =
      requireGraphAccessToken(req);

    const mail =
      await graphMailService.getMessage(
        mailId,
        accessToken
      );

    if (!mail) {
      return errorResponse(
        res,
        new Error(
          "Mail not found."
        ),
        404
      );
    }

    return successResponse(
      res,
      { mail },
      "Mail fetched successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   SYNC INBOX

   POST /api/outlook/sync
============================================================ */

const syncInbox = async (
  req,
  res
) => {
  try {
    const accessToken =
      requireGraphAccessToken(req);

    const syncResult =
      await graphMailService.syncInbox(
        accessToken
      );

    return successResponse(
      res,
      {
        synced:
          syncResult?.synced ||
          0,

        inserted:
          syncResult?.inserted ||
          0,

        updated:
          syncResult?.updated ||
          0,

        skipped:
          syncResult?.skipped ||
          0,

        duration:
          syncResult?.duration ||
          null,

        messages:
          syncResult?.messages ||
          [],
      },
      "Inbox synchronized successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   CLASSIFY MAIL
============================================================ */

const classifyMail = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const email =
      await validateMailId(
        emailId
      );

    const classification =
      await aiClassificationService.classifyEmail({
        subject:
          email.subject || "",

        body:
          email.body ||
          email.bodyPreview ||
          "",

        sender:
          email.from?.emailAddress?.address ||
          email.senderEmail ||
          email.sender ||
          "",
      });

    email.aiClassification =
      classification;

    await email.save();

    return successResponse(
      res,
      { classification },
      "Email classified successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   PREDICT PRIORITY
============================================================ */

const predictPriority = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const email =
      await validateMailId(
        emailId
      );

    const prediction =
      await aiPriorityService.predictPriority({
        subject:
          email.subject || "",

        body:
          email.body ||
          email.bodyPreview ||
          "",

        sender:
          email.from?.emailAddress?.address ||
          email.senderEmail ||
          email.sender ||
          "",

        importance:
          email.importance ||
          "normal",
      });

    email.aiPriority =
      prediction;

    if (
      typeof prediction ===
      "string"
    ) {
      email.priority =
        prediction;
    }

    await email.save();

    return successResponse(
      res,
      {
        priority:
          prediction,
      },
      "Priority prediction completed."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   GENERATE AI REPLY
============================================================ */

const generateReply = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const email =
      await validateMailId(
        emailId
      );

    const reply =
      await aiAutoReplyService.generateReply({
        subject:
          email.subject || "",

        body:
          email.body ||
          email.bodyPreview ||
          "",

        sender:
          email.from?.emailAddress?.address ||
          email.senderEmail ||
          email.sender ||
          "",
      });

    return successResponse(
      res,
      { reply },
      "AI reply generated successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   SEND REPLY
============================================================ */

const sendReply = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const {
      reply = "",
    } = req.body || {};

    if (
      !reply ||
      !reply.trim()
    ) {
      return errorResponse(
        res,
        new Error(
          "Reply message is required."
        ),
        400
      );
    }

    const email =
      await validateMailId(
        emailId
      );

    const messageId =
      getGraphMessageId(email);

    if (!messageId) {
      return errorResponse(
        res,
        new Error(
          "Microsoft Graph message ID is missing."
        ),
        400
      );
    }

    const accessToken =
      requireGraphAccessToken(req);

    await graphMailService.replyToMessage({
      messageId,
      comment: reply,
      accessToken,
    });

    if (
      email.status !==
      undefined
    ) {
      email.status =
        "Completed";
    }

    if (
      email.actionRequired !==
      undefined
    ) {
      email.actionRequired =
        false;
    }

    await email.save();

    return successResponse(
      res,
      { messageId },
      "Reply sent successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   REPLY ALL
============================================================ */

const replyAll = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const {
      reply = "",
    } = req.body || {};

    if (
      !reply ||
      !reply.trim()
    ) {
      return errorResponse(
        res,
        new Error(
          "Reply message is required."
        ),
        400
      );
    }

    const email =
      await validateMailId(
        emailId
      );

    const messageId =
      getGraphMessageId(email);

    if (!messageId) {
      return errorResponse(
        res,
        new Error(
          "Microsoft Graph message ID is missing."
        ),
        400
      );
    }

    const accessToken =
      requireGraphAccessToken(req);

    await graphMailService.replyAll({
      messageId,
      comment: reply,
      accessToken,
    });

    if (
      email.status !==
      undefined
    ) {
      email.status =
        "Completed";
    }

    if (
      email.actionRequired !==
      undefined
    ) {
      email.actionRequired =
        false;
    }

    await email.save();

    return successResponse(
      res,
      { messageId },
      "Reply All sent successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   FORWARD MAIL
============================================================ */

const forwardMail = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const {
      to,
      comment = "",
    } = req.body || {};

    if (!to) {
      return errorResponse(
        res,
        new Error(
          "Forward recipient is required."
        ),
        400
      );
    }

    const email =
      await validateMailId(
        emailId
      );

    const messageId =
      getGraphMessageId(email);

    if (!messageId) {
      return errorResponse(
        res,
        new Error(
          "Microsoft Graph message ID is missing."
        ),
        400
      );
    }

    const accessToken =
      requireGraphAccessToken(req);

    await graphMailService.forwardMessage({
      messageId,
      to,
      comment,
      accessToken,
    });

    return successResponse(
      res,
      {
        messageId,
        to,
      },
      "Email forwarded successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   ARCHIVE MAIL
============================================================ */

const archiveMail = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const email =
      await validateMailId(
        emailId
      );

    const messageId =
      getGraphMessageId(email);

    if (!messageId) {
      return errorResponse(
        res,
        new Error(
          "Microsoft Graph message ID is missing."
        ),
        400
      );
    }

    const accessToken =
      requireGraphAccessToken(req);

    await graphMailService.archiveMessage({
      messageId,
      accessToken,
    });

    if (
      email.status !==
      undefined
    ) {
      email.status =
        "Archived";
    }

    await email.save();

    return successResponse(
      res,
      { messageId },
      "Email archived successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   DELETE MAIL
============================================================ */

const deleteMail = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const email =
      await validateMailId(
        emailId
      );

    const messageId =
      getGraphMessageId(email);

    if (!messageId) {
      return errorResponse(
        res,
        new Error(
          "Microsoft Graph message ID is missing."
        ),
        400
      );
    }

    const accessToken =
      requireGraphAccessToken(req);

    await graphMailService.deleteMessage(
      messageId,
      accessToken
    );

    await Email.findByIdAndDelete(
      emailId
    );

    return successResponse(
      res,
      {
        messageId,
        emailId,
      },
      "Email deleted successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   SEARCH MAIL
============================================================ */

const searchMail = async (
  req,
  res
) => {
  try {
    const {
      query = "",
      page = 1,
      limit = 25,
    } = req.query;

    if (
      !query ||
      !query.trim()
    ) {
      return errorResponse(
        res,
        new Error(
          "Search query is required."
        ),
        400
      );
    }

    const accessToken =
      requireGraphAccessToken(req);

    const result =
      await graphSearchService.searchMessages({
        query:
          query.trim(),

        page:
          Number(page),

        limit:
          Number(limit),

        accessToken,
      });

    return successResponse(
      res,
      {
        emails:
          result?.value ||
          result?.messages ||
          [],

        pagination: {
          page:
            Number(page),

          limit:
            Number(limit),

          total:
            result?.total ||
            result?.count ||
            0,

          nextLink:
            result?.["@odata.nextLink"] ||
            result?.nextLink ||
            null,
        },
      },
      "Search completed successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   EXPORT MAILS
============================================================ */

const exportMails = async (
  req,
  res
) => {
  try {
    const {
      fromDate,
      toDate,
      status,
      priority,
      company,
    } = req.query;

    const filter = {};

    if (
      fromDate ||
      toDate
    ) {
      filter.receivedDateTime =
        {};

      if (fromDate) {
        filter.receivedDateTime.$gte =
          new Date(
            `${fromDate}T00:00:00.000Z`
          );
      }

      if (toDate) {
        filter.receivedDateTime.$lte =
          new Date(
            `${toDate}T23:59:59.999Z`
          );
      }
    }

    if (
      status &&
      status !== "all"
    ) {
      filter.status =
        status;
    }

    if (
      priority &&
      priority !== "all"
    ) {
      filter.priority =
        priority;
    }

    if (
      company &&
      company !== "all"
    ) {
      filter.company =
        company;
    }

    const emails =
      await Email.find(filter)
        .sort({
          receivedDateTime:
            -1,
        })
        .lean();

    return successResponse(
      res,
      {
        total:
          emails.length,

        emails,

        filters: {
          fromDate:
            fromDate ||
            null,

          toDate:
            toDate ||
            null,

          status:
            status ||
            null,

          priority:
            priority ||
            null,

          company:
            company ||
            null,
        },
      },
      "Emails exported successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   MARK AS READ
============================================================ */

const markAsRead = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const email =
      await validateMailId(
        emailId
      );

    const messageId =
      getGraphMessageId(email);

    const accessToken =
      requireGraphAccessToken(req);

    if (messageId) {
      await graphMailService.updateMessage({
        messageId,
        isRead: true,
        accessToken,
      });
    }

    email.isRead =
      true;

    if (
      email.status !==
      undefined
    ) {
      email.status =
        "Completed";
    }

    await email.save();

    return successResponse(
      res,
      {
        emailId,
        messageId,
        isRead: true,
        status:
          email.status,
      },
      "Email marked as read."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   MARK AS UNREAD
============================================================ */

const markAsUnread = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const email =
      await validateMailId(
        emailId
      );

    const messageId =
      getGraphMessageId(email);

    const accessToken =
      requireGraphAccessToken(req);

    if (messageId) {
      await graphMailService.updateMessage({
        messageId,
        isRead: false,
        accessToken,
      });
    }

    email.isRead =
      false;

    if (
      email.status !==
      undefined
    ) {
      email.status =
        "Pending";
    }

    await email.save();

    return successResponse(
      res,
      {
        emailId,
        messageId,
        isRead: false,
        status:
          email.status,
      },
      "Email marked as unread."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   AI SUGGESTION
============================================================ */

const getSuggestion = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const email =
      await validateMailId(
        emailId
      );

    if (
      !aiSuggestionService ||
      typeof aiSuggestionService.generateSuggestion !==
        "function"
    ) {
      return errorResponse(
        res,
        new Error(
          "AI suggestion service is not available."
        ),
        503
      );
    }

    const suggestion =
      await aiSuggestionService.generateSuggestion({
        subject:
          email.subject || "",

        body:
          email.body ||
          email.bodyPreview ||
          "",

        sender:
          email.senderEmail ||
          email.sender ||
          "",
      });

    return successResponse(
      res,
      { suggestion },
      "AI suggestion generated successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   SLA ANALYSIS
============================================================ */

const analyzeSLA = async (
  req,
  res
) => {
  try {
    const { emailId } =
      req.params;

    const email =
      await validateMailId(
        emailId
      );

    if (!aiSLAService) {
      return errorResponse(
        res,
        new Error(
          "AI SLA service is not available."
        ),
        503
      );
    }

    let result;

    if (
      typeof aiSLAService.analyzeSLA ===
      "function"
    ) {
      result =
        await aiSLAService.analyzeSLA({
          subject:
            email.subject || "",

          body:
            email.body ||
            email.bodyPreview ||
            "",

          receivedDateTime:
            email.receivedDateTime,

          priority:
            email.priority,
        });
    } else if (
      typeof aiSLAService.calculateSLA ===
      "function"
    ) {
      result =
        await aiSLAService.calculateSLA(
          email
        );
    } else {
      return errorResponse(
        res,
        new Error(
          "No supported SLA method found."
        ),
        503
      );
    }

    return successResponse(
      res,
      { sla: result },
      "SLA analysis completed successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   GET CATEGORIES
============================================================ */

const getCategories = async (
  req,
  res
) => {
  try {
    const accessToken =
      requireGraphAccessToken(req);

    if (!graphCategoryService) {
      return errorResponse(
        res,
        new Error(
          "Graph category service is not available."
        ),
        503
      );
    }

    let categories;

    if (
      typeof graphCategoryService.getCategories ===
      "function"
    ) {
      categories =
        await graphCategoryService.getCategories(
          accessToken
        );
    } else if (
      typeof graphCategoryService.listCategories ===
      "function"
    ) {
      categories =
        await graphCategoryService.listCategories(
          accessToken
        );
    } else {
      return errorResponse(
        res,
        new Error(
          "No supported category method found."
        ),
        503
      );
    }

    return successResponse(
      res,
      {
        categories:
          categories?.value ||
          categories?.categories ||
          categories ||
          [],
      },
      "Mail categories fetched successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      error?.status || 500
    );
  }
};

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  getInbox,
  getMailById,
  syncInbox,
  classifyMail,
  predictPriority,
  generateReply,
  sendReply,
  replyAll,
  forwardMail,
  archiveMail,
  deleteMail,
  searchMail,
  exportMails,
  markAsRead,
  markAsUnread,
  getSuggestion,
  analyzeSLA,
  getCategories,
};