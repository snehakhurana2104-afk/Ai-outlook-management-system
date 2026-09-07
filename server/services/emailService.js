const Email = require("../models/Email");
const { spawn } = require("child_process");
const path = require("path");

const { analyzeEmail } = require("./analyzer");

// ======================================
// GET ALL EMAILS
// ======================================

const getAllEmails = async (query = {}) => {

  const filter = {};

  // ===============================
  // Search
  // ===============================

  if (query.search) {

    const keyword = query.search.trim();

    filter.$or = [
      { subject: { $regex: keyword, $options: "i" } },
      { senderName: { $regex: keyword, $options: "i" } },
      { senderEmail: { $regex: keyword, $options: "i" } },
      { company: { $regex: keyword, $options: "i" } },
      { technology: { $regex: keyword, $options: "i" } },
      { category: { $regex: keyword, $options: "i" } },
      { assignedTo: { $regex: keyword, $options: "i" } },
    ];

  }

  // ===============================
  // Filters
  // ===============================

  if (query.company && query.company !== "All")
    filter.company = query.company;

  if (query.category && query.category !== "All")
    filter.category = query.category;

  if (query.technology && query.technology !== "All")
    filter.technology = query.technology;

  if (query.priority && query.priority !== "All")
    filter.priority = query.priority;

  if (query.status && query.status !== "All")
    filter.status = query.status;

  if (query.assignedTo && query.assignedTo !== "All")
    filter.assignedTo = query.assignedTo;

  if (query.read === "true")
    filter.isRead = true;

  if (query.read === "false")
    filter.isRead = false;

  // ===============================
  // Date Filter
  // ===============================

  if (query.fromDate || query.toDate) {

    filter.receivedDateTime = {};

    if (query.fromDate) {
      const start = new Date(query.fromDate);
      start.setHours(0, 0, 0, 0);
      filter.receivedDateTime.$gte = start;
    }

    if (query.toDate) {
      const end = new Date(query.toDate);
      end.setHours(23, 59, 59, 999);
      filter.receivedDateTime.$lte = end;
    }

  }

  // ===============================
  // Pagination
  // ===============================

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Email.countDocuments(filter);

  const emails = await Email.find(filter)
    .sort({ receivedDateTime: -1 })
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

const createEmail = async (emailData) => {

  return await Email.create(emailData);

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

const updateEmail = async (id, emailData) => {

  return await Email.findByIdAndUpdate(
    id,
    emailData,
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

  // ===============================
  // Check Duplicate
  // ===============================

  const exists = await Email.findOne({
    messageId: mail.messageId,
  });

  // ===============================
  // AI Analysis
  // ===============================

  const ai = analyzeEmail({

    subject: mail.subject || "",

    body: mail.body || "",

    senderEmail: mail.senderEmail || "",

    senderName: mail.senderName || "",

  });

  // ======================================
  // UPDATE EXISTING EMAIL
  // ======================================

  if (exists) {

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
        exists.company = ai.company;

    exists.technology = ai.technology;

    exists.category = ai.category;

    exists.trainingType = ai.trainingType;

    exists.customerType = ai.customerType;

    exists.priority = ai.priority;

    exists.status = ai.status;

    exists.requirements = Array.isArray(ai.requirements)
      ? ai.requirements.join(", ")
      : String(ai.requirements || "");

    exists.aiSummary = ai.aiSummary;

    exists.task = Array.isArray(ai.task)
      ? ai.task.join(", ")
      : String(ai.task || "");

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
  // AUTO ASSIGN USER
  // ======================================

  let assignedTo = "Mukesh";

  if (
    (mail.senderName || "").toLowerCase().includes("sunaina") ||
    (ai.technology || "").toLowerCase().includes("azure")
  ) {

    assignedTo = "Sunaina";

  } else if (
    (mail.senderName || "").toLowerCase().includes("kamal") ||
    (ai.technology || "").toLowerCase().includes("java")
  ) {

    assignedTo = "Kamal Kumar Khanna";

  } else if (
    (mail.senderName || "").toLowerCase().includes("srishti") ||
    (ai.technology || "").toLowerCase().includes("aws")
  ) {

    assignedTo = "Srishti Gambhir";

  } else if (
    (mail.senderName || "").toLowerCase().includes("kanika")
  ) {

    assignedTo = "Kanika Singh";

  } else if (
    (mail.senderName || "").toLowerCase().includes("asfiya")
  ) {

    assignedTo = "Syeda Asfiya";

  }
    // ======================================
  // CREATE NEW EMAIL
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

    requirements: Array.isArray(ai.requirements)
      ? ai.requirements.join(", ")
      : String(ai.requirements || ""),

    aiSummary: ai.aiSummary,

    task: Array.isArray(ai.task)
      ? ai.task.join(", ")
      : String(ai.task || ""),

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

    const pythonExecutable = process.env.PYTHON_EXECUTABLE || "python";

    const python = spawn(pythonExecutable, [pythonScript], {
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
      },
    });

    let output = "";
    let error = "";

    // ===========================
    // Python Output
    // ===========================

    python.stdout.on("data", (data) => {

      output += data.toString();

    });

    // ===========================
    // Python Errors
    // ===========================

    python.stderr.on("data", (data) => {

      error += data.toString();

      try {
        console.log(data.toString());
      } catch (logErr) {
        // ignore logging errors (console encoding issues on Windows terminals)
      }

    });

    // ===========================
    // Python Completed
    // ===========================

    python.on("close", async (code) => {

      // Try to parse stdout JSON even if the process exited with a non-zero code.
      // Some pywin32 runs emit diagnostics to stderr and may exit non-zero
      // while still producing a valid JSON array on stdout. Prefer to parse
      // stdout when possible so we can upsert emails even in that case.
      try {
        let emails = [];

        try {
          emails = JSON.parse(output || "[]");
        } catch (parseErr) {
          // If parse fails and process reported an error code, reject with stderr.
          if (code !== 0) {
            return reject(new Error(error || "Python Script Failed"));
          }
          return reject(parseErr);
        }

        let insertedEmails = 0;

        if (!Array.isArray(emails)) {
          // Python returned an error object or unexpected payload
          return reject(new Error((emails && (emails.error || emails.message)) || 'Unexpected Python output'));
        }

        for (const mail of emails) {

          const inserted = await saveEmail(mail);

          if (inserted) {

            insertedEmails++;

          }

        }

        // Emit realtime event so frontends refresh automatically
        try {
          const gateway = require("../gateway/eventGateway");
          if (gateway && gateway.emitNewEmail) {
            gateway.emitNewEmail({
              success: true,
              totalEmails: emails.length,
              insertedEmails,
              skippedEmails: emails.length - insertedEmails,
              timestamp: new Date(),
            });
          }
        } catch (emitErr) {
          // ignore emit errors
        }

        resolve({

          success: true,

          totalEmails: emails.length,

          insertedEmails,

          skippedEmails:
            emails.length - insertedEmails,

        });

      } catch (err) {

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

  const unreadEmails = await Email.countDocuments({ isRead: false });

  const readEmails = await Email.countDocuments({ isRead: true });

  const highPriority = await Email.countDocuments({ priority: "High" });

  const mediumPriority = await Email.countDocuments({ priority: "Medium" });

  const lowPriority = await Email.countDocuments({ priority: "Low" });

  // Today's range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayEmails = await Email.countDocuments({
    receivedDateTime: { $gte: todayStart, $lte: todayEnd },
  });

  const todayReadEmails = await Email.countDocuments({
    receivedDateTime: { $gte: todayStart, $lte: todayEnd },
    isRead: true,
  });

  const todayUnreadEmails = await Email.countDocuments({
    receivedDateTime: { $gte: todayStart, $lte: todayEnd },
    isRead: false,
  });

  const todayHighPriority = await Email.countDocuments({
    receivedDateTime: { $gte: todayStart, $lte: todayEnd },
    priority: "High",
  });

  const todayMediumPriority = await Email.countDocuments({
    receivedDateTime: { $gte: todayStart, $lte: todayEnd },
    priority: "Medium",
  });

  const todayLowPriority = await Email.countDocuments({
    receivedDateTime: { $gte: todayStart, $lte: todayEnd },
    priority: "Low",
  });

  // Today's task/status counts
  const todayCompletedTasks = await Email.countDocuments({
    receivedDateTime: { $gte: todayStart, $lte: todayEnd },
    status: "Completed",
  });

  const todayPendingTasks = await Email.countDocuments({
    receivedDateTime: { $gte: todayStart, $lte: todayEnd },
    status: "Pending",
  });

  const todayNotCompletedTasks = await Email.countDocuments({
    receivedDateTime: { $gte: todayStart, $lte: todayEnd },
    status: "Not Completed",
  });

  // Task / status counts
  const completedTasks = await Email.countDocuments({ status: "Completed" });
  const pendingTasks = await Email.countDocuments({ status: "Pending" });
  const notCompletedTasks = await Email.countDocuments({ status: "Not Completed" });

  return {
    totalEmails,
    todayEmails,
    todayReadEmails,
    todayUnreadEmails,
    todayHighPriority,
    todayMediumPriority,
    todayLowPriority,
    todayCompletedTasks,
    todayPendingTasks,
    todayNotCompletedTasks,
    completedTasks,
    pendingTasks,
    notCompletedTasks,
    unreadEmails,
    readEmails,
    highPriority,
    mediumPriority,
    lowPriority,
  };

};

  // ======================================
// RE-ANALYZE EMAILS
// ======================================

const reAnalyzeEmails = async () => {

  const emails = await Email.find();

  let updatedEmails = 0;

  for (const email of emails) {

    const ai = analyzeEmail({

      subject: email.subject || "",

      body: email.body || "",

      senderEmail: email.senderEmail || "",

      senderName: email.senderName || "",

    });

    email.company = ai.company;
    email.technology = ai.technology;
    email.category = ai.category;
    email.trainingType = ai.trainingType;
    email.customerType = ai.customerType;
    email.priority = ai.priority;
    email.status = ai.status;

    email.requirements = Array.isArray(ai.requirements)
      ? ai.requirements.join(", ")
      : String(ai.requirements || "");

    email.aiSummary = ai.aiSummary;

    email.task = Array.isArray(ai.task)
      ? ai.task.join(", ")
      : String(ai.task || "");

    email.tasks = ai.tasks;
    email.suggestedReply = ai.suggestedReply;
    email.actionRequired = ai.actionRequired;
    email.dueStatus = ai.dueStatus;
    email.score = ai.score;
    email.tags = ai.tags;

    await email.save();

    updatedEmails++;

  }

  return {

    success: true,

    updatedEmails,

  };

};

// ======================================
// MARK AS READ
// ======================================

const markAsRead = async (id) => {

  return await Email.findByIdAndUpdate(

    id,

    { isRead: true },

    { new: true }

  );

};

// ======================================
// MARK AS UNREAD
// ======================================

const markAsUnread = async (id) => {

  return await Email.findByIdAndUpdate(

    id,

    { isRead: false },

    { new: true }

  );

};
// ======================================
// ARCHIVE EMAIL
// ======================================

const archiveEmail = async (id) => {

  return await Email.findByIdAndUpdate(

    id,

    {
      archived: true,
    },

    {
      new: true,
    }

  );

};

// ======================================
// AI SUMMARY
// ======================================

const getAISummary = async (id) => {

  const email = await Email.findById(id);

  if (!email) {
    throw new Error("Email not found");
  }

  return {
    subject: email.subject,
    sender: email.senderName,
    company: email.company,
    technology: email.technology,
    priority: email.priority,
    summary: email.aiSummary || "No AI Summary Available",
    actionRequired: email.actionRequired,
    suggestedReply: email.suggestedReply,
    tasks: email.tasks,
  };

};

// ======================================
// GENERATE AI REPLY
// ======================================

const generateAIReply = async (id) => {

  const email = await Email.findById(id);

  if (!email) {
    throw new Error("Email not found");
  }

  let reply =
`Hi ${email.senderName || "Team"},

Thank you for your email regarding "${email.subject}".

We have received your request and our team is reviewing it.

We will get back to you shortly with the required information.

Regards,
SSDN Technologies`;

  email.suggestedReply = reply;

  await email.save();

  return {
    reply,
  };

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

  archiveEmail,
  getAISummary,
  generateAIReply,
};



