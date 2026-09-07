/******************************************************************************
 * aiReplyController.js
 * Part 1
 * Imports + Enterprise Helpers
 ******************************************************************************/

const Email = require("../models/Email");
const ReplyHistory = require("../models/ReplyHistory");

const AIReplyService = require("../services/AIReplyService");
const graphService = require("../services/graphService");

/* ==========================================================================
   Constants
========================================================================== */

const DEFAULT_TONE = "Professional";

/* ==========================================================================
   Send Success Response
========================================================================== */

const sendSuccess = (
  res,
  data = {},
  message = "Success",
  status = 200
) => {

  return res.status(status).json({

    success: true,

    message,

    ...data,

  });

};

/* ==========================================================================
   Send Error Response
========================================================================== */

const sendError = (
  res,
  error,
  fallbackMessage = "Internal Server Error",
  status = 500
) => {

  console.error(fallbackMessage, error);

  return res.status(status).json({

    success: false,

    message:
      error?.message || fallbackMessage,

  });

};

/* ==========================================================================
   Get Email Helper
========================================================================== */

const getEmailById = async (emailId) => {

  if (!emailId) {
    throw new Error("Email ID is required.");
  }

  const email = await Email.findById(emailId);

  if (!email) {
    throw new Error("Email not found.");
  }

  return email;

};

/******************************************************************************
 * End Part 1
 ******************************************************************************/
/******************************************************************************
 * aiReplyController.js
 * Part 2
 * Generate AI Reply
 ******************************************************************************/

/* ==========================================================================
   Generate AI Reply
   POST /api/ai/reply/generate
========================================================================== */

exports.generateReply = async (req, res) => {

  try {

    const {

      emailId,

      tone = DEFAULT_TONE,

    } = req.body;

    /* --------------------------------------------------------
       Get Email
    -------------------------------------------------------- */

    const email = await getEmailById(emailId);

    /* --------------------------------------------------------
       Generate Reply
    -------------------------------------------------------- */

    const result =
      await AIReplyService.generateReply({

        email,

        tone,

      });

    /* --------------------------------------------------------
       Save Reply History
    -------------------------------------------------------- */

    await ReplyHistory.create({

      emailId,

      tone,

      reply: result.reply,

      confidence:
        result.confidence || 0,

      summary:
        result.summary || "",

      sentiment:
        result.sentiment || "",

      keywords:
        result.keywords || [],

      createdAt: new Date(),

    });

    /* --------------------------------------------------------
       Success Response
    -------------------------------------------------------- */

    return sendSuccess(

      res,

      {

        reply: result.reply,

        confidence:
          result.confidence || 0,

        summary:
          result.summary || "",

        sentiment:
          result.sentiment || "",

        keywords:
          result.keywords || [],

      },

      "AI reply generated successfully."

    );

  } catch (error) {

    return sendError(

      res,

      error,

      "Failed to generate AI reply."

    );

  }

};

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * aiReplyController.js
 * Part 3
 * Regenerate Reply + Send Reply
 ******************************************************************************/

/* ==========================================================================
   Regenerate AI Reply
   POST /api/ai/reply/regenerate
========================================================================== */

exports.regenerateReply = async (req, res) => {

  try {

    const {

      emailId,

      tone = DEFAULT_TONE,

      previousReply = "",

    } = req.body;

    /* --------------------------------------------------------
       Get Email
    -------------------------------------------------------- */

    const email = await getEmailById(emailId);

    /* --------------------------------------------------------
       Regenerate Reply
    -------------------------------------------------------- */

    const result =
      await AIReplyService.regenerateReply({

        email,

        tone,

        previousReply,

      });

    /* --------------------------------------------------------
       Save History
    -------------------------------------------------------- */

    await ReplyHistory.create({

      emailId,

      tone,

      reply: result.reply,

      confidence:
        result.confidence || 0,

      createdAt: new Date(),

    });

    /* --------------------------------------------------------
       Success
    -------------------------------------------------------- */

    return sendSuccess(

      res,

      {

        reply: result.reply,

        confidence:
          result.confidence || 0,

      },

      "AI reply regenerated successfully."

    );

  } catch (error) {

    return sendError(

      res,

      error,

      "Failed to regenerate AI reply."

    );

  }

};

/* ==========================================================================
   Send Outlook Reply
   POST /api/ai/reply/send
========================================================================== */

exports.sendReply = async (req, res) => {

  try {

    const {

      emailId,

      content,

    } = req.body;

    if (!content?.trim()) {

      return sendError(

        res,

        new Error("Reply content is required."),

        "Validation failed.",

        400

      );

    }

    /* --------------------------------------------------------
       Get Email
    -------------------------------------------------------- */

    const email = await getEmailById(emailId);

    /* --------------------------------------------------------
       Send via Microsoft Graph
    -------------------------------------------------------- */

    const result =
      await graphService.sendReply({

        messageId: email.messageId,

        content,

      });

    /* --------------------------------------------------------
       Update Email
    -------------------------------------------------------- */

    email.status = "Completed";

    email.lastReply = content;

    email.repliedAt = new Date();

    await email.save();

    /* --------------------------------------------------------
       Success
    -------------------------------------------------------- */

    return sendSuccess(

      res,

      {

        data: result,

      },

      "Reply sent successfully."

    );

  } catch (error) {

    return sendError(

      res,

      error,

      "Failed to send Outlook reply."

    );

  }

};

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * aiReplyController.js
 * Part 4
 * Reply History APIs
 ******************************************************************************/

/* ==========================================================================
   Get Reply History
   GET /api/ai/reply/history/:emailId
========================================================================== */

exports.getReplyHistory = async (req, res) => {

  try {

    const { emailId } = req.params;

    if (!emailId) {

      return sendError(

        res,

        new Error("Email ID is required."),

        "Validation failed.",

        400

      );

    }

    const history = await ReplyHistory
      .find({ emailId })
      .sort({ createdAt: -1 });

    return sendSuccess(

      res,

      {

        history,

      },

      "Reply history fetched successfully."

    );

  } catch (error) {

    return sendError(

      res,

      error,

      "Failed to fetch reply history."

    );

  }

};

/* ==========================================================================
   Delete Reply History
   DELETE /api/ai/reply/history/:id
========================================================================== */

exports.deleteReplyHistory = async (req, res) => {

  try {

    const { id } = req.params;

    if (!id) {

      return sendError(

        res,

        new Error("History ID is required."),

        "Validation failed.",

        400

      );

    }

    const deleted =
      await ReplyHistory.findByIdAndDelete(id);

    if (!deleted) {

      return sendError(

        res,

        new Error("Reply history not found."),

        "Delete failed.",

        404

      );

    }

    return sendSuccess(

      res,

      {},

      "Reply history deleted successfully."

    );

  } catch (error) {

    return sendError(

      res,

      error,

      "Failed to delete reply history."

    );

  }

};

/******************************************************************************
 * End Part 4
 ******************************************************************************/
/******************************************************************************
 * aiReplyController.js
 * Part 5
 * Rewrite + Grammar + Summarize APIs
 ******************************************************************************/

/* ==========================================================================
   Rewrite Reply
   POST /api/ai/reply/rewrite
========================================================================== */

exports.rewriteReply = async (req, res) => {

  try {

    const {

      reply,

      tone = DEFAULT_TONE,

    } = req.body;

    if (!reply?.trim()) {

      return sendError(

        res,

        new Error("Reply is required."),

        "Validation failed.",

        400

      );

    }

    const result =
      await AIReplyService.rewriteReply({

        reply,

        tone,

      });

    return sendSuccess(

      res,

      {

        reply: result.reply,

      },

      "Reply rewritten successfully."

    );

  }

  catch (error) {

    return sendError(

      res,

      error,

      "Failed to rewrite reply."

    );

  }

};

/* ==========================================================================
   Grammar Correction
   POST /api/ai/reply/grammar
========================================================================== */

exports.grammarReply = async (req, res) => {

  try {

    const { reply } = req.body;

    if (!reply?.trim()) {

      return sendError(

        res,

        new Error("Reply is required."),

        "Validation failed.",

        400

      );

    }

    const result =
      await AIReplyService.grammarReply({

        reply,

      });

    return sendSuccess(

      res,

      {

        reply: result.reply,

      },

      "Grammar improved successfully."

    );

  }

  catch (error) {

    return sendError(

      res,

      error,

      "Grammar correction failed."

    );

  }

};

/* ==========================================================================
   Summarize Reply
   POST /api/ai/reply/summarize
========================================================================== */

exports.summarizeReply = async (req, res) => {

  try {

    const { reply } = req.body;

    if (!reply?.trim()) {

      return sendError(

        res,

        new Error("Reply is required."),

        "Validation failed.",

        400

      );

    }

    const result =
      await AIReplyService.summarizeReply({

        reply,

      });

    return sendSuccess(

      res,

      {

        summary: result.summary,

      },

      "Summary generated successfully."

    );

  }

  catch (error) {

    return sendError(

      res,

      error,

      "Failed to summarize reply."

    );

  }

};

/******************************************************************************
 * End Part 5
 ******************************************************************************/