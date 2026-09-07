// ===========================================
// backend/controllers/attachmentController.js
// ===========================================

const Email = require("../models/Email");

// ===========================================
// Download Attachment
// GET /api/attachments/:emailId/:attachmentId
// ===========================================

const downloadAttachment = async (req, res) => {
  try {
    const { emailId, attachmentId } = req.params;

    const email = await Email.findById(emailId);

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    if (
      !email.attachments ||
      email.attachments.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "No attachments found",
      });
    }

    const attachment = email.attachments.find(
      (item) =>
        item.id.toString() === attachmentId.toString()
    );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found",
      });
    }

    // =====================================
    // TODO:
    // Replace with Microsoft Graph download URL
    // =====================================

    return res.status(200).json({
      success: true,
      message: "Attachment Found",
      data: {
        id: attachment.id,
        name: attachment.name,
        size: attachment.size || 0,
        contentType:
          attachment.contentType ||
          "application/octet-stream",

        downloadUrl:
          attachment.downloadUrl || "",

        isInline:
          attachment.isInline || false,
      },
    });
  } catch (error) {
    console.error("Attachment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to download attachment",
      error: error.message,
    });
  }
};

// ===========================================
// Export
// ===========================================

module.exports = {
  downloadAttachment,
};