/******************************************************************************
 * replyRoutes.js
 * Enterprise AI Reply Routes
 ******************************************************************************/

const express = require("express");
const router = express.Router();

const replyController = require("../controllers/replyController");

const aiRateLimiter = require("../middleware/aiRateLimiter");

/* ==========================================================================
   AI Reply
========================================================================== */

router.post(
  "/generate",
  aiRateLimiter,
  replyController.generateReply
);

/* ==========================================================================
   Regenerate
========================================================================== */

router.post(
  "/regenerate",
  aiRateLimiter,
  replyController.regenerateReply
);

/* ==========================================================================
   Rewrite
========================================================================== */

router.post(
  "/rewrite",
  aiRateLimiter,
  replyController.rewriteReply
);

/* ==========================================================================
   Grammar
========================================================================== */

router.post(
  "/grammar",
  aiRateLimiter,
  replyController.grammarReply
);

/* ==========================================================================
   Summarize
========================================================================== */

router.post(
  "/summarize",
  aiRateLimiter,
  replyController.summarizeReply
);

/* ==========================================================================
   Send Reply
========================================================================== */

router.post(
  "/send",
  aiRateLimiter,
  replyController.sendReply
);

/* ==========================================================================
   Export
========================================================================== */

module.exports = router;