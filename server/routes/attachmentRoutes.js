// ===========================================
// backend/routes/mailRoutes.js
// ===========================================

const express = require("express");

const router = express.Router();

// ===========================================
// Controller
// ===========================================

const {
  replyEmail,
  replyAllEmail,
  forwardEmail,
  deleteEmail,
} = require("../controllers/mailController");

// ===========================================
// Reply Email
// POST /api/mail/reply/:id
// ===========================================

router.post(
  "/reply/:id",
  replyEmail
);

// ===========================================
// Reply All
// POST /api/mail/reply-all/:id
// ===========================================

router.post(
  "/reply-all/:id",
  replyAllEmail
);

// ===========================================
// Forward Email
// POST /api/mail/forward/:id
// ===========================================

router.post(
  "/forward/:id",
  forwardEmail
);

// ===========================================
// Delete Email
// DELETE /api/mail/:id
// ===========================================

router.delete(
  "/:id",
  deleteEmail
);

// ===========================================
// Export
// ===========================================

module.exports = router;