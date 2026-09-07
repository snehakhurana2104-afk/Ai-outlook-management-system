const express = require("express");

const router = express.Router();

const {
  getEmailDetails,
  generateAIReply,
  replyEmail,
  replyAllEmail,
  forwardEmail,
  deleteEmail,
  downloadAttachment,
  createTask,
} = require("../controllers/emailDetailsController");

// ==========================================
// Email Details
// ==========================================

router.get("/:id", getEmailDetails);

// ==========================================
// Generate AI Reply
// ==========================================

router.post("/:id/generate-reply", generateAIReply);

// ==========================================
// Reply
// ==========================================

router.post("/:id/reply", replyEmail);

// ==========================================
// Reply All
// ==========================================

router.post("/:id/reply-all", replyAllEmail);

// ==========================================
// Forward
// ==========================================

router.post("/:id/forward", forwardEmail);

// ==========================================
// Delete Email
// ==========================================

router.delete("/:id", deleteEmail);

// ==========================================
// Download Attachment
// ==========================================

router.get(
  "/:id/attachments/:attachmentId",
  downloadAttachment
);

// ==========================================
// Create Task
// ==========================================

router.post("/:id/create-task", createTask);

module.exports = router;