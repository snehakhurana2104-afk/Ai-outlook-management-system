// ============================================================
// services/dashboardService.js
// Enterprise Dashboard Service
// ============================================================

const Task = require("../models/Task");
const Email = require("../models/Email");
const cacheService = require("./cacheService");

// ============================================================
// CACHE
// ============================================================

const CACHE_TTL = 60 * 1000; // 60 Seconds

const buildCacheKey = (filters = {}) =>
  `dashboard:${JSON.stringify(filters)}`;

// ============================================================
// DATE HELPERS
// ============================================================

const getStartOfDay = () => {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
};

const getEndOfDay = () => {
  const date = new Date();

  date.setHours(23, 59, 59, 999);

  return date;
};

const getStartOfWeek = () => {
  const date = new Date();

  const day = date.getDay();

  date.setDate(date.getDate() - day);

  date.setHours(0, 0, 0, 0);

  return date;
};

const getStartOfMonth = () => {
  return new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
};

// ============================================================
// COMMON HELPERS
// ============================================================

const calculatePercentage = (
  value,
  total
) => {
  if (!total) return 0;

  return Number(
    ((value / total) * 100).toFixed(2)
  );
};

const safeCount = (value) =>
  value?.[0]?.count || 0;

// ============================================================
// FILTER BUILDER
// ============================================================

const buildTaskMatch = (
  filters = {}
) => {
  const match = {
    isDeleted: false,
  };

  if (filters.status) {
    match.status = filters.status;
  }

  if (filters.priority) {
    match.priority = filters.priority;
  }

  if (filters.company) {
    match.company = filters.company;
  }

  if (filters.search) {
    match.$or = [
      {
        title: {
          $regex: filters.search,
          $options: "i",
        },
      },
      {
        company: {
          $regex: filters.search,
          $options: "i",
        },
      },
      {
        taskNumber: {
          $regex: filters.search,
          $options: "i",
        },
      },
    ];
  }

  return match;
};

const buildEmailMatch = (
  filters = {}
) => {
  const match = {};

  if (filters.category) {
    match.category = filters.category;
  }

  if (filters.company) {
    match.company = filters.company;
  }

  if (filters.search) {
    match.$or = [
      {
        subject: {
          $regex: filters.search,
          $options: "i",
        },
      },
      {
        senderName: {
          $regex: filters.search,
          $options: "i",
        },
      },
      {
        senderEmail: {
          $regex: filters.search,
          $options: "i",
        },
      },
    ];
  }

  return match;
};

// ============================================================
// RESPONSE TEMPLATE
// ============================================================

const buildDashboardResponse =
  () => ({
    summary: {},

    charts: {},

    recentEmails: [],

    recentTasks: [],

    topCompanies: [],

    aiInsights: {},

    productivity: {},

    notifications: {},

    liveStatus: {},

    generatedAt: null,
  });
  // ============================================================
// TASK DASHBOARD AGGREGATION
// ============================================================

const getTaskDashboardStats = async (
  filters = {}
) => {
  const match = buildTaskMatch(filters);

  const [stats] = await Task.aggregate([
    {
      $match: match,
    },

    {
      $facet: {
        // =====================================
        // TOTAL TASKS
        // =====================================

        total: [
          {
            $count: "count",
          },
        ],

        // =====================================
        // TODAY TASKS
        // =====================================

        today: [
          {
            $match: {
              createdAt: {
                $gte: getStartOfDay(),
                $lte: getEndOfDay(),
              },
            },
          },

          {
            $count: "count",
          },
        ],

        // =====================================
        // STATUS COUNTS
        // =====================================

        pending: [
          {
            $match: {
              status: "Pending",
            },
          },

          {
            $count: "count",
          },
        ],

        inProgress: [
          {
            $match: {
              status: "In Progress",
            },
          },

          {
            $count: "count",
          },
        ],

        completed: [
          {
            $match: {
              status: "Completed",
            },
          },

          {
            $count: "count",
          },
        ],

        onHold: [
          {
            $match: {
              status: "On Hold",
            },
          },

          {
            $count: "count",
          },
        ],

        cancelled: [
          {
            $match: {
              status: "Cancelled",
            },
          },

          {
            $count: "count",
          },
        ],

        // =====================================
        // PRIORITY COUNTS
        // =====================================

        critical: [
          {
            $match: {
              priority: "Critical",
            },
          },

          {
            $count: "count",
          },
        ],

        high: [
          {
            $match: {
              priority: "High",
            },
          },

          {
            $count: "count",
          },
        ],

        medium: [
          {
            $match: {
              priority: "Medium",
            },
          },

          {
            $count: "count",
          },
        ],

        low: [
          {
            $match: {
              priority: "Low",
            },
          },

          {
            $count: "count",
          },
        ],

        // =====================================
        // OVERDUE TASKS
        // =====================================

        overdue: [
          {
            $match: {
              dueDate: {
                $lt: new Date(),
              },

              status: {
                $ne: "Completed",
              },
            },
          },

          {
            $count: "count",
          },
        ],
      },
    },
  ]);

  return {
    totalTasks: safeCount(stats.total),

    todayTasks: safeCount(stats.today),

    pendingTasks: safeCount(stats.pending),

    inProgressTasks: safeCount(
      stats.inProgress
    ),

    completedTasks: safeCount(
      stats.completed
    ),

    onHoldTasks: safeCount(
      stats.onHold
    ),

    cancelledTasks: safeCount(
      stats.cancelled
    ),

    criticalPriority: safeCount(
      stats.critical
    ),

    highPriority: safeCount(
      stats.high
    ),

    mediumPriority: safeCount(
      stats.medium
    ),

    lowPriority: safeCount(
      stats.low
    ),

    overdueTasks: safeCount(
      stats.overdue
    ),
  };
};
// ============================================================
// EMAIL DASHBOARD AGGREGATION
// ============================================================

const getEmailDashboardStats = async (
  filters = {}
) => {
  const match = buildEmailMatch
  // ============================================================
// RECENT EMAILS
// ============================================================

const getRecentEmails = async (
  filters = {}
) => {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);

  const skip = (page - 1) * limit;

  const sortBy =
    filters.sortBy || "receivedDateTime";

  const sortOrder =
    filters.sortOrder === "asc" ? 1 : -1;

  return Email.find(buildEmailMatch(filters))
    .select(
      "subject senderName senderEmail company priority category status receivedDateTime hasAttachments"
    )
    .sort({
      [sortBy]: sortOrder,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

// ============================================================
// RECENT TASKS
// ============================================================

const getRecentTasks = async (
  filters = {}
) => {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);

  const skip = (page - 1) * limit;

  const sortBy =
    filters.sortBy || "createdAt";

  const sortOrder =
    filters.sortOrder === "asc" ? 1 : -1;

  return Task.find(buildTaskMatch(filters))
    .populate(
      "assignedTo",
      "name email"
    )
    .populate(
      "owner",
      "name email"
    )
    .select(
      "taskNumber title company priority status dueDate completionPercentage assignedTo owner createdAt"
    )
    .sort({
      [sortBy]: sortOrder,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

// ============================================================
// DASHBOARD PAGINATION
// ============================================================

const getDashboardPagination = async (
  filters = {}
) => {
  const emailMatch =
    buildEmailMatch(filters);

  const taskMatch =
    buildTaskMatch(filters);

  const [totalEmails, totalTasks] =
    await Promise.all([
      Email.countDocuments(emailMatch),
      Task.countDocuments(taskMatch),
    ]);

  return {
    page: Number(filters.page || 1),

    limit: Number(filters.limit || 10),

    totalEmails,

    totalTasks,

    totalPages: Math.max(
      Math.ceil(
        Math.max(
          totalEmails,
          totalTasks
        ) /
          Number(filters.limit || 10)
      ),
      1
    ),
  };
};
// ============================================================
// DASHBOARD CHARTS
// ============================================================

const getDashboardCharts = async (
  filters = {}
) => {
  const taskMatch = buildTaskMatch(filters);
  const emailMatch = buildEmailMatch(filters);

  const [
    companyDistribution,
    monthlyTaskTrend,
    monthlyEmailTrend,
    weeklyProductivity,
    topCompanies,
  ] = await Promise.all([

    // ========================================================
    // COMPANY DISTRIBUTION
    // ========================================================

    Task.aggregate([
      {
        $match: taskMatch,
      },
      {
        $group: {
          _id: {
            $ifNull: [
              "$company",
              "Unknown",
            ],
          },
          total: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
      {
        $limit: 10,
      },
    ]),

    // ========================================================
    // MONTHLY TASK TREND
    // ========================================================

    Task.aggregate([
      {
        $match: taskMatch,
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
          },
          total: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),

    // ========================================================
    // MONTHLY EMAIL TREND
    // ========================================================

    Email.aggregate([
      {
        $match: emailMatch,
      },
      {
        $group: {
          _id: {
            year: {
              $year:
                "$receivedDateTime",
            },
            month: {
              $month:
                "$receivedDateTime",
            },
          },
          total: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),

    // ========================================================
    // WEEKLY PRODUCTIVITY
    // ========================================================

    Task.aggregate([
      {
        $match: {
          ...taskMatch,
          status: "Completed",
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year:
                "$completedAt",
            },
            week: {
              $week:
                "$completedAt",
            },
          },
          completed: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.week": 1,
        },
      },
    ]),

    // ========================================================
    // TOP COMPANIES
    // ========================================================

    Task.aggregate([
      {
        $match: taskMatch,
      },
      {
        $group: {
          _id: {
            $ifNull: [
              "$company",
              "Unknown",
            ],
          },

          totalTasks: {
            $sum: 1,
          },

          completed: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "Completed",
                  ],
                },
                1,
                0,
              ],
            },
          },

          pending: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "Pending",
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          totalTasks: -1,
        },
      },
      {
        $limit: 10,
      },
    ]),
  ]);

  return {
    companyDistribution,

    monthlyTaskTrend,

    monthlyEmailTrend,

    weeklyProductivity,

    topCompanies,
  };
};
// ============================================================
// AI INSIGHTS
// ============================================================

const getAIInsights = async () => {
  const [stats] = await Task.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $facet: {
        analyzed: [
          {
            $match: {
              "ai.summary": {
                $exists: true,
                $ne: "",
              },
            },
          },
          {
            $count: "count",
          },
        ],

        positive: [
          {
            $match: {
              "ai.sentiment": "Positive",
            },
          },
          {
            $count: "count",
          },
        ],

        neutral: [
          {
            $match: {
              "ai.sentiment": "Neutral",
            },
          },
          {
            $count: "count",
          },
        ],

        negative: [
          {
            $match: {
              "ai.sentiment": "Negative",
            },
          },
          {
            $count: "count",
          },
        ],
      },
    },
  ]);

  return {
    analyzedTasks: safeCount(
      stats.analyzed
    ),

    sentiment: {
      positive: safeCount(
        stats.positive
      ),

      neutral: safeCount(
        stats.neutral
      ),

      negative: safeCount(
        stats.negative
      ),
    },
  };
};

// ============================================================
// PRODUCTIVITY
// ============================================================

const getProductivity = (
  taskStats
) => {
  const completionRate =
    calculatePercentage(
      taskStats.completedTasks,
      taskStats.totalTasks
    );

  const pendingRate =
    calculatePercentage(
      taskStats.pendingTasks,
      taskStats.totalTasks
    );

  return {
    completionRate,

    pendingRate,

    totalTasks:
      taskStats.totalTasks,

    completedTasks:
      taskStats.completedTasks,

    pendingTasks:
      taskStats.pendingTasks,

    overdueTasks:
      taskStats.overdueTasks,
  };
};

// ============================================================
// NOTIFICATIONS
// ============================================================

const getNotifications = (
  taskStats,
  emailStats
) => {
  return {
    overdueTasks:
      taskStats.overdueTasks,

    criticalPriority:
      taskStats.criticalPriority,

    highPriority:
      taskStats.highPriority,

    todayTasks:
      taskStats.todayTasks,

    todayEmails:
      emailStats.todayEmails,

    unreadAlerts:
      taskStats.pendingTasks +
      taskStats.overdueTasks,
  };
};

// ============================================================
// LIVE STATUS
// ============================================================

const getLiveStatus = () => {
  return {
    outlookConnected: true,

    syncStatus: "Healthy",

    lastSync: new Date(),

    serverTime: new Date(),

    cacheEnabled: true,

    uptime:
      Math.floor(
        process.uptime()
      ) + " sec",
  };
};
// ============================================================
// MAIN DASHBOARD SERVICE
// ============================================================

const getDashboard = async (
  filters = {}
) => {
  const cacheKey =
    buildCacheKey(filters);

  // ==========================================================
  // CACHE
  // ==========================================================

  if (!filters.refresh) {
    const cached =
      await cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }
  }

  // ==========================================================
  // LOAD DATA IN PARALLEL
  // ==========================================================

  const [
    taskStats,
    emailStats,
    recentEmails,
    recentTasks,
    pagination,
    charts,
    aiInsights,
  ] = await Promise.all([
    getTaskDashboardStats(filters),

    getEmailDashboardStats(filters),

    getRecentEmails(filters),

    getRecentTasks(filters),

    getDashboardPagination(filters),

    getDashboardCharts(filters),

    getAIInsights(),
  ]);

  // ==========================================================
  // BUILD RESPONSE
  // ==========================================================

  const response =
    buildDashboardResponse();

  response.summary = {
    ...taskStats,
    ...emailStats,
  };

  response.charts = charts;

  response.recentEmails =
    recentEmails;

  response.recentTasks =
    recentTasks;

  response.topCompanies =
    charts.topCompanies;

  response.pagination =
    pagination;

  response.aiInsights =
    aiInsights;

  response.productivity =
    getProductivity(
      taskStats
    );

  response.notifications =
    getNotifications(
      taskStats,
      emailStats
    );

  response.liveStatus =
    getLiveStatus();

  response.generatedAt =
    new Date();

  // ==========================================================
  // SAVE CACHE
  // ==========================================================

  await cacheService.set(
    cacheKey,
    response,
    CACHE_TTL
  );

  return response;
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getDashboard,
};
}