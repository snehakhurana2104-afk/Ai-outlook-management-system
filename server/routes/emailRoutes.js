// ===========================================================
// routes/emailRoutes.js
// ===========================================================

const express = require("express");

const router = express.Router();

const {
  getEmails,
  syncOutlookEmails,
  markRead,
  toggleRead,
  archiveEmail,
  deleteEmail,
  assignEmail,
} = require("../controllers/emailController");

// ===========================================================
// GET LOCAL MONGODB EMAILS
// ===========================================================

router.get(
  "/emails",
  getEmails
);

// ===========================================================
// SYNC MICROSOFT OUTLOOK → MONGODB
// ===========================================================

router.post(
  "/emails/sync",
  syncOutlookEmails
);

// ===========================================================
// READ
// ===========================================================

router.put(
  "/emails/:id/read",
  markRead
);

// ===========================================================
// TOGGLE READ
// ===========================================================

router.put(
  "/emails/:id/toggle-read",
  toggleRead
);

// ===========================================================
// ARCHIVE
// ===========================================================

router.put(
  "/emails/:id/archive",
  archiveEmail
);

// ===========================================================
// DELETE
// ===========================================================

router.delete(
  "/emails/:id",
  deleteEmail
);

// ===========================================================
// ASSIGN
// ===========================================================

router.put(
  "/emails/:id/assign",
  assignEmail
);

module.exports = router;