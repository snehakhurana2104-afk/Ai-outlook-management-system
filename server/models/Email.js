// ===========================================================
// models/Email.js
// ===========================================================

const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    size: Number,
    contentType: String,
    isInline: Boolean,
  },
  {
    _id: false,
  }
);

const emailSchema = new mongoose.Schema(
  {
    graphId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    internetMessageId: {
      type: String,
      default: "",
    },

    conversationId: {
      type: String,
      default: "",
    },

    subject: {
      type: String,
      default: "(No subject)",
    },

    senderName: {
      type: String,
      default: "Unknown Sender",
    },

    senderEmail: {
      type: String,
      default: "",
    },

    company: {
      type: String,
      default: "Unknown",
    },

    body: {
      type: String,
      default: "",
    },

    bodyPreview: {
      type: String,
      default: "",
    },

    receivedDateTime: {
      type: Date,
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Low",
    },

    category: {
      type: String,
      default: "General",
    },

    assignedTo: {
      type: String,
      default: "",
    },

    archived: {
      type: Boolean,
      default: false,
    },

    customerType: {
      type: String,
      default: "",
    },

    technology: {
      type: String,
      default: "",
    },

    trainingType: {
      type: String,
      default: "",
    },

    score: {
      type: Number,
      default: 0,
    },

    actionRequired: {
      type: String,
      default: "",
    },

    recommendation: {
      type: String,
      default: "",
    },

    aiSummary: {
      type: String,
      default: "",
    },

    suggestedReply: {
      type: String,
      default: "",
    },

    dueStatus: {
      type: String,
      default: "",
    },

    companyEmailCount: {
      type: Number,
      default: 0,
    },

    openTasks: {
      type: Number,
      default: 0,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    lastGraphSync: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Email",
  emailSchema
);