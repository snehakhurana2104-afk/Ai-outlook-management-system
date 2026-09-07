const asyncHandler = require("../utils/asyncHandler");
const taskService = require("../services/taskService");

/* ============================================================
   GET ALL TASKS
============================================================ */

const getTasks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status,
    priority,
    company,
    assignedTo,
    sortBy = "createdAt",
    order = "desc",
  } = req.query;

  const result = await taskService.getTasks({
    page: Number(page),
    limit: Number(limit),
    search,
    status,
    priority,
    company,
    assignedTo,
    sortBy,
    order,
  });

  res.status(200).json({
    success: true,
    count: result.count,
    page: result.page,
    pages: result.pages,
    data: result.data,
  });
});

/* ============================================================
   GET TASK BY ID
============================================================ */

const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);

  res.status(200).json({
    success: true,
    data: task,
  });
});

/* ============================================================
   CREATE TASK
============================================================ */

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body);

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: task,
  });
});

/* ============================================================
   UPDATE TASK
============================================================ */

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: task,
  });
});

/* ============================================================
   DELETE TASK
============================================================ */

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id);

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

/* ============================================================
   SOFT DELETE TASK
============================================================ */

const softDeleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.softDeleteTask(req.params.id);

  res.status(200).json({
    success: true,
    message: "Task moved to trash",
    data: task,
  });
});

/* ============================================================
   RESTORE TASK
============================================================ */

const restoreTask = asyncHandler(async (req, res) => {
  const task = await taskService.restoreTask(req.params.id);

  res.status(200).json({
    success: true,
    message: "Task restored successfully",
    data: task,
  });
});
/* ============================================================
   DASHBOARD STATISTICS
============================================================ */

const getTaskStats = asyncHandler(async (req, res) => {
  const stats = await taskService.getTaskStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/* ============================================================
   TODAY TASKS
============================================================ */

const getTodayTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTodayTasks();

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

/* ============================================================
   OVERDUE TASKS
============================================================ */

const getOverdueTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getOverdueTasks();

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

/* ============================================================
   HIGH PRIORITY TASKS
============================================================ */

const getHighPriorityTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getHighPriorityTasks();

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

/* ============================================================
   PENDING TASKS
============================================================ */

const getPendingTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getPendingTasks();

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

/* ============================================================
   COMPLETED TASKS
============================================================ */

const getCompletedTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getCompletedTasks();

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

/* ============================================================
   IN PROGRESS TASKS
============================================================ */

const getInProgressTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getInProgressTasks();

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

/* ============================================================
   TASKS BY COMPANY
============================================================ */

const getTasksByCompany = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasksByCompany(
    req.params.company
  );

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

/* ============================================================
   TASKS BY USER
============================================================ */

const getTasksByUser = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasksByUser(
    req.params.user
  );

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});
/* ============================================================
   BULK DELETE TASKS
============================================================ */

const bulkDeleteTasks = asyncHandler(async (req, res) => {
  const { taskIds } = req.body;

  const result = await taskService.bulkDeleteTasks(taskIds);

  res.status(200).json({
    success: true,
    message: "Tasks deleted successfully",
    data: result,
  });
});

/* ============================================================
   BULK SOFT DELETE
============================================================ */

const bulkSoftDeleteTasks = asyncHandler(async (req, res) => {
  const { taskIds } = req.body;

  const result = await taskService.bulkSoftDeleteTasks(taskIds);

  res.status(200).json({
    success: true,
    message: "Tasks moved to trash",
    data: result,
  });
});

/* ============================================================
   BULK RESTORE
============================================================ */

const bulkRestoreTasks = asyncHandler(async (req, res) => {
  const { taskIds } = req.body;

  const result = await taskService.bulkRestoreTasks(taskIds);

  res.status(200).json({
    success: true,
    message: "Tasks restored successfully",
    data: result,
  });
});

/* ============================================================
   BULK COMPLETE
============================================================ */

const bulkCompleteTasks = asyncHandler(async (req, res) => {
  const { taskIds } = req.body;

  const result = await taskService.bulkCompleteTasks(taskIds);

  res.status(200).json({
    success: true,
    message: "Tasks marked as completed",
    data: result,
  });
});

/* ============================================================
   BULK UPDATE STATUS
============================================================ */

const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { taskIds, status } = req.body;

  const result = await taskService.bulkUpdateStatus(
    taskIds,
    status
  );

  res.status(200).json({
    success: true,
    message: "Task status updated successfully",
    data: result,
  });
});

/* ============================================================
   BULK ASSIGN USER
============================================================ */

const bulkAssignUser = asyncHandler(async (req, res) => {
  const { taskIds, assignedTo } = req.body;

  const result = await taskService.bulkAssignUser(
    taskIds,
    assignedTo
  );

  res.status(200).json({
    success: true,
    message: "Tasks assigned successfully",
    data: result,
  });
});

/* ============================================================
   CREATE TASK FROM EMAIL
============================================================ */

const createTaskFromEmail = asyncHandler(async (req, res) => {
  const task = await taskService.createTaskFromEmail(
    req.params.emailId
  );

  res.status(201).json({
    success: true,
    message: "Task created from email successfully",
    data: task,
  });
});

/* ============================================================
   EXTRACT TASKS FROM EMAILS
============================================================ */

const extractTasksFromEmails = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;

  const result = await taskService.extractTasksFromEmails(
    fromDate,
    toDate
  );

  res.status(200).json({
    success: true,
    scanned: result.scanned,
    created: result.created,
    data: result.tasks,
  });
});

/* ============================================================
   EXPORT CSV
============================================================ */

const exportTasksCSV = asyncHandler(async (req, res) => {
  const file = await taskService.exportTasksCSV(req.query);

  res.status(200).json({
    success: true,
    data: file,
  });
});

/* ============================================================
   EXPORT PDF
============================================================ */

const exportTasksPDF = asyncHandler(async (req, res) => {
  const file = await taskService.exportTasksPDF(req.query);

  res.status(200).json({
    success: true,
    data: file,
  });
});
/* ============================================================
   TASK TIMELINE
============================================================ */

const getTaskTimeline = asyncHandler(async (req, res) => {
  const timeline = await taskService.getTaskTimeline(
    req.params.id
  );

  res.status(200).json({
    success: true,
    data: timeline,
  });
});

/* ============================================================
   TASK ACTIVITY LOGS
============================================================ */

const getTaskActivity = asyncHandler(async (req, res) => {
  const activities =
    await taskService.getTaskActivity(
      req.params.id
    );

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities,
  });
});

/* ============================================================
   ADD COMMENT
============================================================ */

const addComment = asyncHandler(async (req, res) => {
  const task = await taskService.addComment(
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Comment added successfully",
    data: task,
  });
});

/* ============================================================
   REMOVE COMMENT
============================================================ */

const removeComment = asyncHandler(async (req, res) => {
  const task = await taskService.removeComment(
    req.params.id,
    req.params.commentId
  );

  res.status(200).json({
    success: true,
    message: "Comment removed successfully",
    data: task,
  });
});

/* ============================================================
   ADD ATTACHMENT
============================================================ */

const addAttachment = asyncHandler(async (req, res) => {
  const task = await taskService.addAttachment(
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Attachment added successfully",
    data: task,
  });
});

/* ============================================================
   REMOVE ATTACHMENT
============================================================ */

const removeAttachment = asyncHandler(async (req, res) => {
  const task =
    await taskService.removeAttachment(
      req.params.id,
      req.params.attachmentId
    );

  res.status(200).json({
    success: true,
    message: "Attachment removed successfully",
    data: task,
  });
});

/* ============================================================
   UPDATE REMINDER
============================================================ */

const updateReminder = asyncHandler(async (req, res) => {
  const task =
    await taskService.updateReminder(
      req.params.id,
      req.body
    );

  res.status(200).json({
    success: true,
    message: "Reminder updated successfully",
    data: task,
  });
});

/* ============================================================
   AI SUMMARY
============================================================ */

const generateAISummary = asyncHandler(async (req, res) => {
  const summary =
    await taskService.generateAISummary(
      req.params.id
    );

  res.status(200).json({
    success: true,
    data: summary,
  });
});

/* ============================================================
   AI SUGGESTED REPLY
============================================================ */

const generateAIReply = asyncHandler(async (req, res) => {
  const reply =
    await taskService.generateAIReply(
      req.params.id
    );

  res.status(200).json({
    success: true,
    data: reply,
  });
});

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  // CRUD
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,

  // Soft Delete
  softDeleteTask,
  restoreTask,

  // Dashboard
  getTaskStats,
  getTodayTasks,
  getOverdueTasks,
  getHighPriorityTasks,
  getPendingTasks,
  getCompletedTasks,
  getInProgressTasks,

  // Filters
  getTasksByCompany,
  getTasksByUser,

  // Bulk
  bulkDeleteTasks,
  bulkSoftDeleteTasks,
  bulkRestoreTasks,
  bulkCompleteTasks,
  bulkUpdateStatus,
  bulkAssignUser,

  // Email Integration
  createTaskFromEmail,
  extractTasksFromEmails,

  // Export
  exportTasksCSV,
  exportTasksPDF,

  // Timeline
  getTaskTimeline,
  getTaskActivity,

  // Comments
  addComment,
  removeComment,

  // Attachments
  addAttachment,
  removeAttachment,

  // Reminder
  updateReminder,

  // AI
  generateAISummary,
  generateAIReply,
};