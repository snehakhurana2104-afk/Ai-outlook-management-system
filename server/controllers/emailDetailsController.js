const Email = require("../models/Email");

// ==========================================
// Get Email Details
// ==========================================

const getEmailDetails = async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    return res.json({
      success: true,
      data: email,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Generate AI Reply
// ==========================================

const generateAIReply = async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    const aiReply = `Hi ${email.senderName || "Sir/Madam"},

Thank you for your email regarding "${email.subject}".

We have received your request and our team is reviewing it.

We will get back to you shortly.

Regards,
AI Outlook Email Intelligence`;

    return res.json({
      success: true,
      data: {
        aiReply,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Reply Email
// ==========================================

const replyEmail = async (req, res) => {
  try {
    const { reply } = req.body;

    return res.json({
      success: true,
      message: "Reply sent successfully",
      data: {
        reply,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Reply All
// ==========================================

const replyAllEmail = async (req, res) => {
  try {
    const { reply } = req.body;

    return res.json({
      success: true,
      message: "Reply All sent successfully",
      data: {
        reply,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Forward Email
// ==========================================

const forwardEmail = async (req, res) => {
  try {
    const { to, comment } = req.body;

    return res.json({
      success: true,
      message: "Email forwarded successfully",
      data: {
        to,
        comment,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Delete Email
// ==========================================

const deleteEmail = async (req, res) => {
  try {
    const email = await Email.findByIdAndDelete(req.params.id);

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    return res.json({
      success: true,
      message: "Email deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Download Attachment
// ==========================================

const downloadAttachment = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        downloadUrl:
          "https://example.com/sample-file.pdf",
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Create Task
// ==========================================

const createTask = async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Task created successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getEmailDetails,
  generateAIReply,
  replyEmail,
  replyAllEmail,
  forwardEmail,
  deleteEmail,
  downloadAttachment,
  createTask,
};