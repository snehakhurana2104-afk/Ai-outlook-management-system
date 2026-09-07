const mongoose = require("mongoose");

const Task = require("../models/Task");
const Email = require("../models/Email");
const Counter = require("../models/Counter");

/* ============================================================
   HELPERS
============================================================ */

/**
 * Validate Mongo ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Enterprise Search Builder
 */
const buildSearchQuery = (search = "") => {
  if (!search || !search.trim()) {
    return {};
  }

  const keyword = search.trim();

  return {
    $or: [
      { taskNumber: { $regex: keyword, $options: "i" } },
      { title: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { company: { $regex: keyword, $options: "i" } },
      { customerName: { $regex: keyword, $options: "i" } },
      { customerEmail: { $regex: keyword, $options: "i" } },
      { senderName: { $regex: keyword, $options: "i" } },
      { senderEmail: { $regex: keyword, $options: "i" } },
      { category: { $regex: keyword, $options: "i" } },
      { type: { $regex: keyword, $options: "i" } },
      { tags: { $regex: keyword, $options: "i" } },
      { labels: { $regex: keyword, $options: "i" } },
    ],
  };
};

/**
 * Generate Enterprise Task Number
 * Example:
 * TASK-2026-000001
 */
const generateTaskNumber = async () => {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    {
      name: `TASK-${year}`,
    },
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return `TASK-${year}-${String(counter.sequence).padStart(6, "0")}`;
};

/**
 * Create Activity Log
 */
const createActivity = (
  action,
  description,
  user = null,
  name = ""
) => ({
  action,
  description,
  user,
  name,
  createdAt: new Date(),
});

/* ============================================================
   CREATE TASK
============================================================ */

const createTask = async (taskData) => {
  if (!taskData.title || !taskData.title.trim()) {
    const error = new Error("Task title is required");
    error.statusCode = 400;
    throw error;
  }

  const taskNumber = await generateTaskNumber();

  const payload = {
    ...taskData,

    taskNumber,

    status: taskData.status || "Pending",

    priority: taskData.priority || "Medium",

    category: taskData.category || "General",

    source: taskData.source || "Manual",

    completionPercentage: 0,

    activityLogs: [
      createActivity(
        "Task Created",
        "Task created successfully"
      ),
    ],
  };

  const task = await Task.create(payload);

  return await Task.findById(task._id)
    .populate("emailId")
    .populate("assignedTo", "name email")
    .populate("owner", "name email");
};
/* ============================================================
   GET ALL TASKS
============================================================ */

const getTasks = async (options = {}) => {
  const {
    page = 1,
    limit = 10,

    search = "",

    status,
    priority,
    category,
    type,
    company,
    assignedTo,
    owner,
    source,

    fromDate,
    toDate,

    today = false,
    overdue = false,

    sortBy = "createdAt",
    order = "desc",
  } = options;

  const query = {
    isDeleted: false,
  };

  /* ============================================================
     SEARCH
  ============================================================ */

  if (search) {
    Object.assign(query, buildSearchQuery(search));
  }

  /* ============================================================
     FILTERS
  ============================================================ */

  if (status) query.status = status;

  if (priority) query.priority = priority;

  if (category) query.category = category;

  if (type) query.type = type;

  if (source) query.source = source;

  if (assignedTo) query.assignedTo = assignedTo;

  if (owner) query.owner = owner;

  if (company) {
    query.company = {
      $regex: company,
      $options: "i",
    };
  }

  /* ============================================================
     DATE FILTERS
  ============================================================ */

  if (fromDate || toDate) {
    query.createdAt = {};

    if (fromDate) {
      query.createdAt.$gte = new Date(fromDate);
    }

    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      query.createdAt.$lte = end;
    }
  }

  /* ============================================================
     TODAY
  ============================================================ */

  if (today) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    query.createdAt = {
      $gte: start,
      $lte: end,
    };
  }

  /* ============================================================
     OVERDUE
  ============================================================ */

  if (overdue) {
    query.status = {
      $ne: "Completed",
    };

    query.dueDate = {
      $lt: new Date(),
    };
  }

  /* ============================================================
     SORT
  ============================================================ */

  const sort = {};

  sort[sortBy] = order === "asc" ? 1 : -1;
    /* ============================================================
     PAGINATION
  ============================================================ */

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.max(Number(limit) || 10, 1);
  const skip = (pageNumber - 1) * pageSize;

  /* ============================================================
     DATABASE
  ============================================================ */

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate("assignedTo", "name email")
      .populate("owner", "name email")
      .populate("emailId")
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean(),

    Task.countDocuments(query),
  ]);

  /* ============================================================
     RESPONSE
  ============================================================ */

  return {
    success: true,

    count: tasks.length,

    total,

    page: pageNumber,

    pages: Math.ceil(total / pageSize),

    limit: pageSize,

    hasNextPage: pageNumber < Math.ceil(total / pageSize),

    hasPrevPage: pageNumber > 1,

    data: tasks,
  };
};
/* ============================================================
   GET TASK BY ID
============================================================ */

const getTaskById = async (id) => {
  if (!isValidObjectId(id)) {
    const error = new Error("Invalid Task ID");
    error.statusCode = 400;
    throw error;
  }

  const task = await Task.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("emailId")
    .populate("assignedTo", "name email")
    .populate("owner", "name email");

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  return task;
};

/* ============================================================
   UPDATE TASK
============================================================ */

const updateTask = async (id, updateData = {}) => {
  if (!isValidObjectId(id)) {
    const error = new Error("Invalid Task ID");
    error.statusCode = 400;
    throw error;
  }

  const task = await Task.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  /* ============================================================
     ALLOWED FIELDS
  ============================================================ */

  const allowedFields = [
    "title",
    "description",
    "priority",
    "status",
    "dueDate",
    "assignedTo",
    "category",
    "company",
    "type",
    "source",
    "customerName",
    "customerEmail",
    "estimatedHours",
    "actualHours",
    "completionPercentage",
    "slaHours",
    "tags",
    "labels",
  ];

  /* ============================================================
     TITLE CHANGED
  ============================================================ */

  if (
    updateData.title &&
    updateData.title !== task.title
  ) {
    task.activityLogs.push(
      createActivity(
        "Title Changed",
        `Title changed from "${task.title}" to "${updateData.title}"`
      )
    );
  }

  /* ============================================================
     DESCRIPTION CHANGED
  ============================================================ */

  if (
    updateData.description &&
    updateData.description !== task.description
  ) {
    task.activityLogs.push(
      createActivity(
        "Description Changed",
        "Task description updated"
      )
    );
  }

  /* ============================================================
     STATUS CHANGED
  ============================================================ */

  if (
    updateData.status &&
    updateData.status !== task.status
  ) {
    task.activityLogs.push(
      createActivity(
        "Status Changed",
        `${task.status} → ${updateData.status}`
      )
    );

    if (updateData.status === "Completed") {
      task.completedAt = new Date();
      task.completionPercentage = 100;
    }

    if (updateData.status === "Pending") {
      task.completedAt = null;
    }
  }

  /* ============================================================
     PRIORITY CHANGED
  ============================================================ */

  if (
    updateData.priority &&
    updateData.priority !== task.priority
  ) {
    task.activityLogs.push(
      createActivity(
        "Priority Changed",
        `${task.priority} → ${updateData.priority}`
      )
    );
  }

  /* ============================================================
     ASSIGNMENT CHANGED
  ============================================================ */

  if (
    updateData.assignedTo &&
    String(updateData.assignedTo) !==
      String(task.assignedTo)
  ) {
    task.activityLogs.push(
      createActivity(
        "Assignment Changed",
        "Task assignment updated"
      )
    );
  }

  /* ============================================================
     DUE DATE CHANGED
  ============================================================ */

  if (updateData.dueDate) {
    task.activityLogs.push(
      createActivity(
        "Due Date Changed",
        "Task due date updated"
      )
    );
  }

  /* ============================================================
     UPDATE SAFE FIELDS
  ============================================================ */

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      task[field] = updateData[field];
    }
  });

  /* ============================================================
     LAST ACTIVITY
  ============================================================ */

  task.lastActivityAt = new Date();

  await task.save();

  return await Task.findById(task._id)
    .populate("emailId")
    .populate("assignedTo", "name email")
    .populate("owner", "name email");
};
/* ============================================================
   DELETE TASK (PERMANENT)
============================================================ */

const deleteTask = async (id) => {
  if (!isValidObjectId(id)) {
    const error = new Error("Invalid Task ID");
    error.statusCode = 400;
    throw error;
  }

  const task = await Task.findById(id);

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  // Enterprise Safety:
  // Permanent delete is allowed only after soft delete.

  if (!task.isDeleted) {
    const error = new Error(
      "Soft delete the task before permanent deletion."
    );
    error.statusCode = 400;
    throw error;
  }

  await Task.findByIdAndDelete(id);

  return {
    success: true,
    message: "Task permanently deleted.",
  };
};

/* ============================================================
   SOFT DELETE TASK
============================================================ */

const softDeleteTask = async (id, deletedBy = "System") => {
  if (!isValidObjectId(id)) {
    const error = new Error("Invalid Task ID");
    error.statusCode = 400;
    throw error;
  }

  const task = await Task.findById(id);

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  if (task.isDeleted) {
    return task;
  }

  task.isDeleted = true;
  task.deletedAt = new Date();
  task.deletedBy = deletedBy;
  task.lastActivityAt = new Date();

  task.activityLogs.push(
    createActivity(
      "Task Deleted",
      "Task moved to recycle bin"
    )
  );

  await task.save();

  return task;
};

/* ============================================================
   RESTORE TASK
============================================================ */

const restoreTask = async (id) => {
  if (!isValidObjectId(id)) {
    const error = new Error("Invalid Task ID");
    error.statusCode = 400;
    throw error;
  }

  const task = await Task.findById(id);

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  if (!task.isDeleted) {
    return task;
  }

  task.isDeleted = false;
  task.deletedAt = null;
  task.deletedBy = "";
  task.lastActivityAt = new Date();

  task.activityLogs.push(
    createActivity(
      "Task Restored",
      "Task restored successfully"
    )
  );

  await task.save();

  return task;
};

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  // CRUD
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,

  // Enterprise
  softDeleteTask,
  restoreTask,
};