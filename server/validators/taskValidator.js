const validateTask = (req, res, next) => {
  const {
    title,
    priority,
    status,
    senderEmail,
  } = req.body;

  // Title
  if (!title || title.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Task title is required",
    });
  }

  // Priority
  const priorities = ["High", "Medium", "Low"];

  if (priority && !priorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: "Invalid priority",
    });
  }

  // Status
  const statuses = [
    "Pending",
    "In Progress",
    "Completed",
  ];

  if (status && !statuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task status",
    });
  }

  // Email validation
  if (
    senderEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid sender email",
    });
  }

  next();
};

module.exports = {
  validateTask,
};