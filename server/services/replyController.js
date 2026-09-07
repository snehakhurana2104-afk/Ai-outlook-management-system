/******************************************************************************
 * replyController.js
 * Part 1
 * Imports + Helpers + Controller Skeleton
 ******************************************************************************/

const OpenAIService = require("../services/openaiService");
const PromptService = require("../services/promptService");
const GrammarService = require("../services/grammarService");
const GraphSendMailService = require("../services/graphSendMail");

/* ==========================================================================
   Success Response
========================================================================== */

const successResponse = (
  res,
  data,
  message = "Success",
  status = 200
) => {

  return res.status(status).json({

    success: true,

    message,

    data,

  });

};

/* ==========================================================================
   Error Response
========================================================================== */

const errorResponse = (
  res,
  error,
  status = 500
) => {

  console.error(
    "[AI Reply Controller]",
    error
  );

  return res.status(status).json({

    success: false,

    message:
      error?.message ||
      "Internal Server Error",

  });

};

/* ==========================================================================
   Reply Controller
========================================================================== */

class ReplyController {

  /**************************************************************************
   * Generate AI Reply
   **************************************************************************/

  async generateReply(req, res) {

    try {

      const {

        prompt,

        tone,

        email,

        instructions,

      } = req.body;

      /* --------------------------------------------------------
         Validation
      -------------------------------------------------------- */

      if (!prompt && !email) {

        return errorResponse(

          res,

          new Error(
            "Prompt or email payload is required."
          ),

          400

        );

      }

      /* --------------------------------------------------------
         Build Prompt
      -------------------------------------------------------- */

      let finalPrompt = prompt;

      if (!finalPrompt && email) {

        finalPrompt =
          PromptService.buildReplyPrompt({

            email,

            tone,

            instructions,

          });

      }

      /* --------------------------------------------------------
         Generate
      -------------------------------------------------------- */

      const aiReply =
        await OpenAIService.generateReply(
          finalPrompt
        );

      /* --------------------------------------------------------
         Response
      -------------------------------------------------------- */

      return successResponse(

        res,

        {

          reply: aiReply,

          generatedAt:
            new Date().toISOString(),

        },

        "AI reply generated successfully."

      );

    }

    catch (error) {

      return errorResponse(

        res,

        error

      );

    }

  }

  /**************************************************************************
   * Regenerate Reply
   **************************************************************************/

  async regenerateReply(req, res) {

    try {

      const {

        prompt,

        tone,

        email,

        instructions,

      } = req.body;

      if (!prompt && !email) {

        return errorResponse(

          res,

          new Error(
            "Prompt or email payload is required."
          ),

          400

        );

      }

      let finalPrompt = prompt;

      if (!finalPrompt && email) {

        finalPrompt =
          PromptService.buildReplyPrompt({

            email,

            tone,

            instructions,

          });

      }

      const regeneratedReply =
        await OpenAIService.generateReply(
          finalPrompt
        );

      return successResponse(

        res,

        {

          reply: regeneratedReply,

          regeneratedAt:
            new Date().toISOString(),

        },

        "AI reply regenerated successfully."

      );

    }

    catch (error) {

      return errorResponse(

        res,

        error

      );

    }

  }
    /**************************************************************************
   * Rewrite Reply
   **************************************************************************/

  async rewriteReply(req, res) {

    try {

      const {

        prompt,

        reply,

        tone,

      } = req.body;

      /* --------------------------------------------------------
         Validation
      -------------------------------------------------------- */

      if (!prompt && !reply) {

        return errorResponse(

          res,

          new Error(
            "Reply content is required."
          ),

          400

        );

      }

      /* --------------------------------------------------------
         Build Rewrite Prompt
      -------------------------------------------------------- */

      let rewritePrompt = prompt;

      if (!rewritePrompt) {

        rewritePrompt =
          PromptService.buildRewritePrompt({

            reply,

            tone,

          });

      }

      /* --------------------------------------------------------
         Rewrite
      -------------------------------------------------------- */

      const rewrittenReply =
        await OpenAIService.generateReply(
          rewritePrompt
        );

      /* --------------------------------------------------------
         Response
      -------------------------------------------------------- */

      return successResponse(

        res,

        {

          reply: rewrittenReply,

          rewrittenAt:
            new Date().toISOString(),

        },

        "Reply rewritten successfully."

      );

    }

    catch (error) {

      return errorResponse(

        res,

        error

      );

    }

  }

  /**************************************************************************
   * Grammar Correction
   **************************************************************************/

  async grammarReply(req, res) {

    try {

      const {

        prompt,

        reply,

        mode,

      } = req.body;

      /* --------------------------------------------------------
         Validation
      -------------------------------------------------------- */

      if (!prompt && !reply) {

        return errorResponse(

          res,

          new Error(
            "Reply is required."
          ),

          400

        );

      }

      /* --------------------------------------------------------
         Build Grammar Prompt
      -------------------------------------------------------- */

      let grammarPrompt = prompt;

      if (!grammarPrompt) {

        grammarPrompt =
          GrammarService.buildGrammarPrompt(

            reply,

            mode

          );

      }

      /* --------------------------------------------------------
         Grammar AI
      -------------------------------------------------------- */

      const correctedReply =
        await OpenAIService.generateReply(
          grammarPrompt
        );

      /* --------------------------------------------------------
         Response
      -------------------------------------------------------- */

      return successResponse(

        res,

        {

          reply: correctedReply,

          correctedAt:
            new Date().toISOString(),

        },

        "Grammar corrected successfully."

      );

    }

    catch (error) {

      return errorResponse(

        res,

        error

      );

    }

  }

  /**************************************************************************
   * Summarize Email
   **************************************************************************/

  async summarizeReply(req, res) {

    try {

      const {

        prompt,

        email,

      } = req.body;

      /* --------------------------------------------------------
         Validation
      -------------------------------------------------------- */

      if (!prompt && !email) {

        return errorResponse(

          res,

          new Error(
            "Email payload is required."
          ),

          400

        );

      }

      /* --------------------------------------------------------
         Build Summary Prompt
      -------------------------------------------------------- */

      let summaryPrompt = prompt;

      if (!summaryPrompt) {

        summaryPrompt =
          PromptService.buildSummaryPrompt(
            email
          );

      }

      /* --------------------------------------------------------
         Generate Summary
      -------------------------------------------------------- */

      const summary =
        await OpenAIService.generateReply(
          summaryPrompt
        );

      /* --------------------------------------------------------
         Response
      -------------------------------------------------------- */

      return successResponse(

        res,

        {

          summary,

          summarizedAt:
            new Date().toISOString(),

        },

        "Email summarized successfully."

      );

    }

    catch (error) {

      return errorResponse(

        res,

        error

      );

    }

  }
    /**************************************************************************
   * Send Reply
   **************************************************************************/

  async sendReply(req, res) {

    try {

      const {

        accessToken,

        messageId,

        reply,

        subject,

        recipients,

      } = req.body;

      /* --------------------------------------------------------
         Validation
      -------------------------------------------------------- */

      if (!accessToken) {

        return errorResponse(

          res,

          new Error(
            "Access token is required."
          ),

          400

        );

      }

      if (!reply) {

        return errorResponse(

          res,

          new Error(
            "Reply content is required."
          ),

          400

        );

      }

      /* --------------------------------------------------------
         Microsoft Graph Send
      -------------------------------------------------------- */

      const result =
        await GraphSendMailService.sendReply({

          accessToken,

          messageId,

          subject,

          body: reply,

          recipients,

        });

      /* --------------------------------------------------------
         Success
      -------------------------------------------------------- */

      return successResponse(

        res,

        {

          messageId,

          result,

          sentAt:
            new Date().toISOString(),

        },

        "Reply sent successfully."

      );

    }

    catch (error) {

      return errorResponse(

        res,

        error

      );

    }

  }

}

/* ==========================================================================
   Export Controller
========================================================================== */

module.exports = new ReplyController();

/******************************************************************************
 * End replyController.js
 ******************************************************************************/