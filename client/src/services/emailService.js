const Email = require("../models/Email");
const { spawn } = require("child_process");
const path = require("path");

const { analyzeEmail } = require("./analyzer");

// ======================================
// GET ALL EMAILS
// ======================================

const getAllEmails = async (query = {}) => {

  const filter = {};

  // ==========================
  // Search
  // ==========================

  if (query.search) {

    const keyword = query.search.trim();

    filter.$or = [

      {
        subject: {
          $regex: keyword,
          $options: "i",
        },
      },

      {
        senderName: {
          $regex: keyword,
          $options: "i",
        },
      },

      {
        senderEmail: {
          $regex: keyword,
          $options: "i",
        },
      },

      {
        company: {
          $regex: keyword,
          $options: "i",
        },
      },

      {
        technology: {
          $regex: keyword,
          $options: "i",
        },
      },

      {
        category: {
          $regex: keyword,
          $options: "i",
        },
      },

      {
        assignedTo: {
          $regex: keyword,
          $options: "i",
        },
      },

    ];

  }

  // ==========================
  // Filters
  // ==========================

  if (query.company && query.company !== "All") {
    filter.company = query.company;
  }

  if (query.category && query.category !== "All") {
    filter.category = query.category;
  }

  if (query.priority && query.priority !== "All") {
    filter.priority = query.priority;
  }

  if (query.status && query.status !== "All") {
    filter.status = query.status;
  }

  if (query.assignedTo && query.assignedTo !== "All") {
    filter.assignedTo = query.assignedTo;
  }

  if (query.read === "true") {
    filter.isRead = true;
  }

  if (query.read === "false") {
    filter.isRead = false;
  }

  // ==========================
  // Date Filter
  // ==========================

  if (query.fromDate || query.toDate) {

    filter.receivedDateTime = {};

    if (query.fromDate) {
      filter.receivedDateTime.$gte = new Date(query.fromDate);
    }

    if (query.toDate) {

      const end = new Date(query.toDate);
      end.setHours(23, 59, 59, 999);

      filter.receivedDateTime.$lte = end;

    }

  }

  // ==========================
  // Pagination
  // ==========================

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 8;
  const skip = (page - 1) * limit;

  const total = await Email.countDocuments(filter);

  const emails = await Email.find(filter)
    .sort({
      receivedDateTime: -1,
    })
    .skip(skip)
    .limit(limit);

  return {

    emails,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),

  };

};

// ======================================
// CREATE EMAIL
// ======================================

const createEmail = async (data) => {

  return await Email.create(data);

};

// ======================================
// GET EMAIL BY ID
// ======================================

const getEmailById = async (id) => {

  return await Email.findById(id);

};

// ======================================
// UPDATE EMAIL
// ======================================

const updateEmail = async (id, data) => {

  return await Email.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    }
  );

};

// ======================================
// DELETE EMAIL
// ======================================

const deleteEmail = async (id) => {

  return await Email.findByIdAndDelete(id);

};
// ======================================
// SAVE EMAIL
// ======================================

const saveEmail = async (mail) => {

  // ======================================
  // Duplicate Check
  // ======================================

  const exists = await Email.findOne({
    messageId: mail.messageId,
  });

  // ======================================
  // UPDATE EXISTING EMAIL
  // ======================================

  if (exists) {

    const ai = analyzeEmail({

      subject: mail.subject || "",

      body: mail.body || "",

      senderEmail: mail.senderEmail || "",

      senderName: mail.senderName || "",

    });

    exists.subject = mail.subject || exists.subject;

    exists.senderName = mail.senderName || exists.senderName;

    exists.senderEmail = mail.senderEmail || exists.senderEmail;

    exists.body = mail.body || exists.body;

    exists.bodyPreview = mail.body
      ? mail.body.substring(0, 300)
      : exists.bodyPreview;

    exists.receivedDateTime =
      mail.receivedDateTime || exists.receivedDateTime;

    exists.isRead = !mail.unread;

    // ==========================
    // AI Fields
    // ==========================

    exists.company = ai.company;

    exists.technology = ai.technology;

    exists.category = ai.category;

    exists.trainingType = ai.trainingType;

    exists.customerType = ai.customerType;

    exists.priority = ai.priority;

    exists.status = ai.status;

    exists.requirements = ai.requirements;

    exists.aiSummary = ai.aiSummary;

    exists.task = ai.task;

    exists.tasks = ai.tasks;

    exists.suggestedReply = ai.suggestedReply;

    exists.actionRequired = ai.actionRequired;

    exists.dueStatus = ai.dueStatus;

    exists.score = ai.score;

    exists.tags = ai.tags;

    await exists.save();

    return false;

  }

  // ======================================
  // AI Analysis
  // ======================================

  const ai = analyzeEmail({

    subject: mail.subject || "",

    body: mail.body || "",

    senderEmail: mail.senderEmail || "",

    senderName: mail.senderName || "",

  });

  // ======================================
  // Employee Assignment
  // ======================================

  let assignedTo = "Mukesh";

  if (
    (mail.senderName || "").toLowerCase().includes("sunaina") ||
    (ai.technology || "").toLowerCase().includes("azure")
  ) {

    assignedTo = "Sunaina";

  }

  else if (
    (mail.senderName || "").toLowerCase().includes("kamal") ||
    (ai.technology || "").toLowerCase().includes("java")
  ) {

    assignedTo = "Kamal Kumar Khanna";

  }

  else if (
    (mail.senderName || "").toLowerCase().includes("srishti") ||
    (ai.technology || "").toLowerCase().includes("aws")
  ) {

    assignedTo = "Srishti Gambhir";

  }

  else if (
    (mail.senderName || "").toLowerCase().includes("kanika")
  ) {

    assignedTo = "Kanika Singh";

  }

  else if (
    (mail.senderName || "").toLowerCase().includes("asfiya")
  ) {

    assignedTo = "Syeda Asfiya";

  }
    // ======================================
  // Create New Email
  // ======================================

  await Email.create({

    messageId: mail.messageId,

    subject: mail.subject || "",

    senderName: mail.senderName || "",

    senderEmail: mail.senderEmail || "",

    body: mail.body || "",

    bodyPreview: mail.body
      ? mail.body.substring(0, 300)
      : "",

    receivedDateTime:
      mail.receivedDateTime || new Date(),

    isRead: !mail.unread,

    assignedTo,

    company: ai.company,

    technology: ai.technology,

    category: ai.category,

    trainingType: ai.trainingType,

    customerType: ai.customerType,

    priority: ai.priority,

    status: ai.status,

    requirements: ai.requirements,

    aiSummary: ai.aiSummary,

    task: ai.task,

    tasks: ai.tasks,

    suggestedReply: ai.suggestedReply,

    actionRequired: ai.actionRequired,

    dueStatus: ai.dueStatus,

    score: ai.score,

    tags: ai.tags,

  });

  return true;

};

// ======================================
// SYNC OUTLOOK EMAILS
// ======================================

const syncOutlookEmails = async () => {

  return new Promise((resolve, reject) => {

    const pythonScript = path.join(
      __dirname,
      "../python/outlook_reader.py"
    );

    const python = spawn("python", [pythonScript]);

    let output = "";

    let error = "";

    python.stdout.on("data", (data) => {

      output += data.toString();

    });

    python.stderr.on("data", (data) => {

      error += data.toString();

      console.log(data.toString());

    });

    python.on("close", async (code) => {

      if (code !== 0) {

        return reject(
          new Error(error || "Python Script Failed")
        );

      }

      try {

        const emails = JSON.parse(output);

        let insertedEmails = 0;

        for (const mail of emails) {

          const inserted = await saveEmail(mail);

          if (inserted) {

            insertedEmails++;

          }

        }

        resolve({

          success: true,

          totalEmails: emails.length,

          insertedEmails,

          skippedEmails:
            emails.length - insertedEmails,

        });

      }

      catch (err) {

        reject(err);

      }

    });

  });

};

// ======================================
// REFRESH OUTLOOK
// ======================================

const refreshOutlook = async () => {

  return await syncOutlookEmails();

};

// ======================================
// DASHBOARD STATS
// ======================================

const getEmailStats = async () => {

  const totalEmails = await Email.countDocuments();

  const unreadEmails = await Email.countDocuments({
    isRead: false,
  });

  const readEmails = await Email.countDocuments({
    isRead: true,
  });

  const highPriority = await Email.countDocuments({
    priority: "High",
  });

  const mediumPriority = await Email.countDocuments({
    priority: "Medium",
  });

  const lowPriority = await Email.countDocuments({
    priority: "Low",
  });

  const pendingTasks = await Email.countDocuments({
    status: "Pending",
  });

  const completedTasks = await Email.countDocuments({
    status: "Completed",
  });

  const notCompletedTasks = await Email.countDocuments({
    status: "Not Completed",
  });

  return {

    totalEmails,

    unreadEmails,

    readEmails,

    highPriority,

    mediumPriority,

    lowPriority,

    pendingTasks,

    completedTasks,

    notCompletedTasks,

  };

};

// ======================================
// RE-ANALYZE EMAILS
// ======================================

const reAnalyzeEmails = async () => {

  const emails = await Email.find();

  let updated = 0;

  for (const email of emails) {

    const ai = analyzeEmail({

      subject: email.subject || "",

      body: email.body || "",

      senderEmail: email.senderEmail || "",

      senderName: email.senderName || "",

    });

    Object.assign(email, ai);

    await email.save();

    updated++;

  }

  return {

    success: true,

    updatedEmails: updated,

  };

};

// ======================================
// MARK READ / UNREAD
// ======================================

const markAsRead = async (id) => {

  return await Email.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );

};

const markAsUnread = async (id) => {

  return await Email.findByIdAndUpdate(
    id,
    { isRead: false },
    { new: true }
  );

};

// ======================================
// EXPORTS
// ======================================

module.exports = {

  getAllEmails,
  createEmail,
  getEmailById,
  updateEmail,
  deleteEmail,

  saveEmail,
  syncOutlookEmails,
  refreshOutlook,

  getEmailStats,

  reAnalyzeEmails,

  markAsRead,
  markAsUnread,

};