const express = require("express");

const router = express.Router();

const {
  syncOutlookEmails,
} = require("../controllers/emailSyncController");

// ======================================
// Sync Outlook Emails
// POST /api/email-sync
// ======================================

router.post("/", syncOutlookEmails);

module.exports = router;