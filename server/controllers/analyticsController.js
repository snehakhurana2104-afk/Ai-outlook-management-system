/**
 * ============================================================================
 * analyticsController.js
 * Phase 7.6 — Enterprise Analytics Controller
 * Microsoft 365 / Outlook Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 * - Analytics overview
 * - Dashboard analytics
 * - Company analytics
 * - Daily email trends
 * - Priority analytics
 * - Category analytics
 * - Today's analytics
 * - Productivity analytics
 * - Excel export
 * - PDF export
 * - Microsoft Graph integration
 * - MongoDB aggregation
 * - Safe calculations
 * - Consistent API responses
 * - Enterprise error handling
 * ============================================================================
 */

"use strict";

const Email = require("../models/Email");

/* ==========================================================================
   Microsoft Graph Services
========================================================================== */

const graphMailService =
  require("../services/graphMailService");

const graphReportService =
  require("../services/graphReportService");

const graphInsightService =
  require("../services/graphInsightService");

const graphPeopleService =
  require("../services/graphPeopleService");

const graphPlannerService =
  require("../services/graphPlannerService");

const graphCalendarService =
  require("../services/graphCalendarService");

/* ==========================================================================
   AI Services
========================================================================== */

const aiSuggestionService =
  require("../services/aiSuggestionService");

const aiSLAService =
  require("../services/aiSLAService");

/* ==========================================================================
   Constants
========================================================================== */

const MODULE_NAME = "Analytics";

const API_VERSION = "2.0.0";

const TREND_DAYS = 30;

const TOP_COMPANIES_LIMIT = 10;

/* ==========================================================================
   Response Helpers
========================================================================== */

const successResponse = (
  res,
  data = {},
  message = "Success",
  status = 200
) => {
  return res.status(status).json({
    success: true,

    message,

    ...data,

    timestamp:
      new Date().toISOString(),
  });
};

const errorResponse = (
  res,
  error,
  status = 500
) => {
  console.error(
    `[${MODULE_NAME}Controller]`,
    error
  );

  return res.status(status).json({
    success: false,

    message:
      error?.message ||
      "Internal Server Error",

    data: null,

    timestamp:
      new Date().toISOString(),
  });
};

/* ==========================================================================
   Utility Helpers
========================================================================== */

const safeNumber = (
  value,
  fallback = 0
) => {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const safeString = (
  value,
  fallback = ""
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value);
};

const normalizeArray = (
  value
) => {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  if (
    Array.isArray(
      value?.value
    )
  ) {
    return value.value;
  }

  if (
    Array.isArray(
      value?.items
    )
  ) {
    return value.items;
  }

  if (
    Array.isArray(
      value?.data
    )
  ) {
    return value.data;
  }

  return [];
};

const percentage = (
  numerator = 0,
  denominator = 0
) => {
  const num =
    safeNumber(numerator);

  const den =
    safeNumber(denominator);

  if (den <= 0) {
    return 0;
  }

  return Number(
    (
      (num / den) *
      100
    ).toFixed(2)
  );
};

const now = () => {
  return new Date();
};

const startOfToday = () => {
  const date =
    new Date();

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
};

const endOfToday = () => {
  const date =
    new Date();

  date.setHours(
    23,
    59,
    59,
    999
  );

  return date;
};

const lastNDays = (
  days = TREND_DAYS
) => {
  const date =
    new Date();

  date.setDate(
    date.getDate() - days
  );

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
};

/* ==========================================================================
   ANALYTICS OVERVIEW
========================================================================== */

const getAnalyticsOverview =
  async (
    req,
    res
  ) => {
    try {
      const [
        mailboxStats,
        mailboxUsage,
        trendingInsights,
        people,
      ] =
        await Promise.all([
          graphMailService
            .getMailboxStatistics(),

          graphReportService
            .getMailboxUsage(),

          graphInsightService
            .getTrending(),

          graphPeopleService
            .getPeople(),
        ]);

      const totalEmails =
        safeNumber(
          mailboxStats?.totalEmails
        );

      const readEmails =
        safeNumber(
          mailboxStats?.readEmails
        );

      const unreadEmails =
        safeNumber(
          mailboxStats?.unreadEmails
        );

      const peopleList =
        normalizeArray(
          people
        );

      const overview = {
        executiveSummary: {
          totalEmails,

          readEmails,

          unreadEmails,

          responseRate:
            percentage(
              readEmails,
              totalEmails
            ),
        },

        prioritySummary: {
          high:
            safeNumber(
              mailboxStats
                ?.highPriority
            ),

          medium:
            safeNumber(
              mailboxStats
                ?.mediumPriority
            ),

          low:
            safeNumber(
              mailboxStats
                ?.lowPriority
            ),
        },

        mailboxUsage: {
          used:
            safeNumber(
              mailboxUsage
                ?.storageUsed
            ),

          available:
            safeNumber(
              mailboxUsage
                ?.storageAvailable
            ),

          total:
            safeNumber(
              mailboxUsage
                ?.storageTotal
            ),
        },

        people: {
          totalContacts:
            peopleList.length,
        },

        trendingTopics:
          normalizeArray(
            trendingInsights?.trending ||
            trendingInsights?.topics
          ),

        connected: true,

        generatedAt:
          new Date().toISOString(),
      };

      return successResponse(
        res,
        {
          analytics:
            overview,
        },
        "Analytics overview loaded successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error
      );
    }
  };

/* ==========================================================================
   INTERNAL ANALYTICS DATA
========================================================================== */

const getAnalyticsData =
  async () => {
    const mailboxStats =
      await graphMailService
        .getMailboxStatistics();

    const totalEmails =
      safeNumber(
        mailboxStats?.totalEmails
      );

    const readEmails =
      safeNumber(
        mailboxStats?.readEmails
      );

    const unreadEmails =
      safeNumber(
        mailboxStats?.unreadEmails
      );

    return {
      totalEmails,

      readEmails,

      unreadEmails,

      responseRate:
        percentage(
          readEmails,
          totalEmails
        ),

      prioritySummary: {
        high:
          safeNumber(
            mailboxStats
              ?.highPriority
          ),

        medium:
          safeNumber(
            mailboxStats
              ?.mediumPriority
          ),

        low:
          safeNumber(
            mailboxStats
              ?.lowPriority
          ),
      },
    };
  };

/* ==========================================================================
   COMPANY DATA
========================================================================== */

const getCompaniesData =
  async () => {
    return Email.aggregate([
      {
        $match: {
          company: {
            $exists: true,

            $type: "string",

            $ne: "",
          },
        },
      },

      {
        $group: {
          _id: "$company",

          totalEmails: {
            $sum: 1,
          },

          highPriority: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$priority",
                    "High",
                  ],
                },
                1,
                0,
              ],
            },
          },

          mediumPriority: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$priority",
                    "Medium",
                  ],
                },
                1,
                0,
              ],
            },
          },

          lowPriority: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$priority",
                    "Low",
                  ],
                },
                1,
                0,
              ],
            },
          },

          unreadEmails: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$isRead",
                    false,
                  ],
                },
                1,
                0,
              ],
            },
          },

          repliedEmails: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$isRead",
                    true,
                  ],
                },
                1,
                0,
              ],
            },
          },

          completedReplies: {
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
        },
      },

      {
        $project: {
          _id: 0,

          company: "$_id",

          name: "$_id",

          totalEmails: 1,

          highPriority: 1,

          mediumPriority: 1,

          lowPriority: 1,

          unreadEmails: 1,

          repliedEmails: 1,

          completedReplies: 1,

          responseRate: {
            $cond: [
              {
                $eq: [
                  "$totalEmails",
                  0,
                ],
              },

              0,

              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$repliedEmails",
                          "$totalEmails",
                        ],
                      },

                      100,
                    ],
                  },

                  2,
                ],
              },
            ],
          },
        },
      },

      {
        $sort: {
          totalEmails: -1,

          company: 1,
        },
      },

      {
        $limit:
          TOP_COMPANIES_LIMIT,
      },
    ]);
  };

/* ==========================================================================
   COMPANY ANALYTICS
========================================================================== */

const getCompanyAnalytics =
  async (
    req,
    res
  ) => {
    try {
      const companies =
        await getCompaniesData();

      return successResponse(
        res,
        {
          companies,

          totalCompanies:
            companies.length,

          generatedAt:
            new Date().toISOString(),
        },
        "Company analytics loaded successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error
      );
    }
  };

/* ==========================================================================
   DAILY TREND DATA
========================================================================== */

const getDailyTrendData =
  async () => {
    const endDate =
      now();

    const startDate =
      lastNDays(
        TREND_DAYS
      );

    return Email.aggregate([
      {
        $match: {
          receivedDateTime: {
            $gte: startDate,

            $lte: endDate,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format:
                "%Y-%m-%d",

              date:
                "$receivedDateTime",
            },
          },

          totalEmails: {
            $sum: 1,
          },

          readEmails: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$isRead",
                    true,
                  ],
                },
                1,
                0,
              ],
            },
          },

          unreadEmails: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$isRead",
                    false,
                  ],
                },
                1,
                0,
              ],
            },
          },

          completedReplies: {
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

          highPriority: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$priority",
                    "High",
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
          _id: 1,
        },
      },
    ]);
  };

/* ==========================================================================
   DAILY EMAIL TREND
========================================================================== */

const getDailyEmailTrend =
  async (
    req,
    res
  ) => {
    try {
      const trend =
        await getDailyTrendData();

      return successResponse(
        res,
        {
          trend,

          totalDays:
            trend.length,

          generatedAt:
            new Date().toISOString(),
        },
        "Daily email trend loaded successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error
      );
    }
  };

/* ==========================================================================
   PRIORITY DATA
========================================================================== */

const getPriorityData =
  async () => {
    return Email.aggregate([
      {
        $group: {
          _id: {
            $ifNull: [
              "$priority",
              "Unknown",
            ],
          },

          totalEmails: {
            $sum: 1,
          },

          readEmails: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$isRead",
                    true,
                  ],
                },
                1,
                0,
              ],
            },
          },

          unreadEmails: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$isRead",
                    false,
                  ],
                },
                1,
                0,
              ],
            },
          },

          completedReplies: {
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
        },
      },

      {
        $project: {
          _id: 0,

          priority: "$_id",

          totalEmails: 1,

          readEmails: 1,

          unreadEmails: 1,

          completedReplies: 1,
        },
      },

      {
        $sort: {
          totalEmails: -1,
        },
      },
    ]);
  };

/* ==========================================================================
   PRIORITY ANALYTICS
========================================================================== */

const getPriorityAnalytics =
  async (
    req,
    res
  ) => {
    try {
      const priorities =
        await getPriorityData();

      return successResponse(
        res,
        {
          priorities,

          totalPriorities:
            priorities.length,

          generatedAt:
            new Date().toISOString(),
        },
        "Priority analytics loaded successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error
      );
    }
  };

/* ==========================================================================
   CATEGORY DATA
========================================================================== */

const getCategoryData =
  async () => {
    return Email.aggregate([
      {
        $group: {
          _id: {
            $ifNull: [
              "$category",
              "Uncategorized",
            ],
          },

          totalEmails: {
            $sum: 1,
          },

          highPriority: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$priority",
                    "High",
                  ],
                },
                1,
                0,
              ],
            },
          },

          mediumPriority: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$priority",
                    "Medium",
                  ],
                },
                1,
                0,
              ],
            },
          },

          lowPriority: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$priority",
                    "Low",
                  ],
                },
                1,
                0,
              ],
            },
          },

          readEmails: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$isRead",
                    true,
                  ],
                },
                1,
                0,
              ],
            },
          },

          unreadEmails: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$isRead",
                    false,
                  ],
                },
                1,
                0,
              ],
            },
          },

          completedReplies: {
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
        },
      },

      {
        $project: {
          _id: 0,

          category: "$_id",

          totalEmails: 1,

          highPriority: 1,

          mediumPriority: 1,

          lowPriority: 1,

          readEmails: 1,

          unreadEmails: 1,

          completedReplies: 1,
        },
      },

      {
        $sort: {
          totalEmails: -1,
        },
      },
    ]);
  };

/* ==========================================================================
   CATEGORY ANALYTICS
========================================================================== */

const getCategoryAnalytics =
  async (
    req,
    res
  ) => {
    try {
      const categories =
        await getCategoryData();

      return successResponse(
        res,
        {
          categories,

          totalCategories:
            categories.length,

          generatedAt:
            new Date().toISOString(),
        },
        "Category analytics loaded successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error
      );
    }
  };

/* ==========================================================================
   TODAY DATA
========================================================================== */

const getTodayData =
  async () => {
    const start =
      startOfToday();

    const end =
      endOfToday();

    const result =
      await Email.aggregate([
        {
          $match: {
            receivedDateTime: {
              $gte: start,

              $lte: end,
            },
          },
        },

        {
          $group: {
            _id: null,

            totalEmails: {
              $sum: 1,
            },

            readEmails: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isRead",
                      true,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            unreadEmails: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isRead",
                      false,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            completedReplies: {
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

            highPriority: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$priority",
                      "High",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

    const data =
      result[0] || {};

    const totalEmails =
      safeNumber(
        data.totalEmails
      );

    const completed =
      safeNumber(
        data.completedReplies
      );

    return {
      received:
        totalEmails,

      replied:
        safeNumber(
          data.readEmails
        ),

      completed,

      highPriority:
        safeNumber(
          data.highPriority
        ),

      unread:
        safeNumber(
          data.unreadEmails
        ),

      pending:
        Math.max(
          0,
          totalEmails -
            completed
        ),
    };
  };

/* ==========================================================================
   TODAY ANALYTICS
========================================================================== */

const getTodayAnalytics =
  async (
    req,
    res
  ) => {
    try {
      const todayAnalytics =
        await getTodayData();

      return successResponse(
        res,
        {
          today:
            todayAnalytics,
        },
        "Today's analytics loaded successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error
      );
    }
  };

/* ==========================================================================
   PRODUCTIVITY DATA
========================================================================== */

const getProductivityData =
  async () => {
    const [
      mailboxStats,
      plannerTasks,
      calendarEvents,
      aiSuggestions,
      slaMetrics,
    ] =
      await Promise.all([
        graphMailService
          .getMailboxStatistics(),

        graphPlannerService
          .getMyTasks(),

        graphCalendarService
          .getUpcomingEvents(),

        aiSuggestionService
          .getSuggestions(),

        aiSLAService
          .getSLAMetrics(),
      ]);

    const totalEmails =
      safeNumber(
        mailboxStats?.totalEmails
      );

    const readEmails =
      safeNumber(
        mailboxStats?.readEmails
      );

    const plannerList =
      normalizeArray(
        plannerTasks
      );

    const calendarList =
      normalizeArray(
        calendarEvents
      );

    const suggestionList =
      normalizeArray(
        aiSuggestions
      );

    const plannerCompleted =
      safeNumber(
        plannerTasks?.completed
      );

    const plannerPendingRaw =
      safeNumber(
        plannerTasks?.pending
      );

    const plannerPending =
      plannerPendingRaw > 0
        ? plannerPendingRaw
        : Math.max(
            0,
            plannerList.length -
              plannerCompleted
          );

    const plannerTotal =
      plannerPending +
      plannerCompleted;

    const taskCompletionRate =
      percentage(
        plannerCompleted,
        plannerTotal
      );

    return {
      emails: {
        total:
          totalEmails,

        read:
          readEmails,

        unread:
          safeNumber(
            mailboxStats
              ?.unreadEmails
          ),

        responseRate:
          percentage(
            readEmails,
            totalEmails
          ),
      },

      planner: {
        pending:
          plannerPending,

        completed:
          plannerCompleted,

        total:
          plannerTotal,

        completionRate:
          taskCompletionRate,
      },

      meetings: {
        upcoming:
          calendarList.length,
      },

      ai: {
        suggestions:
          safeNumber(
            aiSuggestions?.total
          ) ||
          suggestionList.length,
      },

      sla:
        slaMetrics || {},

      generatedAt:
        new Date().toISOString(),
    };
  };

/* ==========================================================================
   PRODUCTIVITY ANALYTICS
========================================================================== */

const getProductivityAnalytics =
  async (
    req,
    res
  ) => {
    try {
      const productivity =
        await getProductivityData();

      return successResponse(
        res,
        {
          productivity,
        },
        "Productivity analytics loaded successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error
      );
    }
  };

/* ==========================================================================
   DASHBOARD ANALYTICS
========================================================================== */

const getDashboardAnalytics =
  async (
    req,
    res
  ) => {
    try {
      const [
        analyticsResult,
        companiesResult,
        trendResult,
        priorityResult,
        categoryResult,
        todayResult,
        productivityResult,
      ] =
        await Promise.all([
          getAnalyticsData(),

          getCompaniesData(),

          getDailyTrendData(),

          getPriorityData(),

          getCategoryData(),

          getTodayData(),

          getProductivityData(),
        ]);

      const analytics =
        analyticsResult || {};

      const companies =
        normalizeArray(
          companiesResult
        );

      const trend =
        normalizeArray(
          trendResult
        );

      const priorities =
        normalizeArray(
          priorityResult
        );

      const categories =
        normalizeArray(
          categoryResult
        );

      const today =
        todayResult || {};

      const productivity =
        productivityResult ||
        null;

      const priorityDistribution =
        priorities.map(
          (item) => ({
            name:
              safeString(
                item?.priority,
                "Unknown"
              ),

            value:
              safeNumber(
                item?.totalEmails
              ),
          })
        );

      const categoryAnalysis =
        categories.map(
          (item) => ({
            name:
              safeString(
                item?.category,
                "Uncategorized"
              ),

            count:
              safeNumber(
                item?.totalEmails
              ),
          })
        );

      const dailyTrend =
        trend.map(
          (item) => ({
            date:
              safeString(
                item?._id ||
                item?.date,
                ""
              ),

            received:
              safeNumber(
                item?.totalEmails
              ),

            replied:
              safeNumber(
                item?.readEmails
              ),

            completed:
              safeNumber(
                item?.completedReplies
              ),

            highPriority:
              safeNumber(
                item?.highPriority
              ),
          })
        );

      const companyTotalEmails =
        companies.reduce(
          (
            total,
            company
          ) =>
            total +
            safeNumber(
              company?.totalEmails
            ),
          0
        );

      const companyCompleted =
        companies.reduce(
          (
            total,
            company
          ) =>
            total +
            safeNumber(
              company?.completedReplies
            ),
          0
        );

      const overallCompletionRate =
        percentage(
          companyCompleted,
          companyTotalEmails
        );

      const highestPriority =
        priorities.reduce(
          (
            highest,
            item
          ) =>
            Math.max(
              highest,
              safeNumber(
                item?.totalEmails
              )
            ),
          0
        );

      const dashboard = {
        analytics: {
          monthlyEmails:
            safeNumber(
              analytics?.totalEmails
            ),

          totalEmails:
            safeNumber(
              analytics?.totalEmails
            ),

          highPriority:
            safeNumber(
              analytics
                ?.prioritySummary
                ?.high
            ),

          totalCompanies:
            companies.length,

          responseRate:
            safeNumber(
              analytics
                ?.responseRate
            ),

          unreadEmails:
            safeNumber(
              analytics
                ?.unreadEmails
            ),
        },

        topCompanies:
          companies,

        today,

        executive: {
          completionRate:
            overallCompletionRate,

          topCompany:
            safeString(
              companies[0]?.name ||
              companies[0]?.company,
              "N/A"
            ),

          highestPriority,

          avgResponseTime:
            "N/A",

          connected:
            true,
        },

        productivity,

        priorityDistribution,

        categoryAnalysis,

        dailyTrend,

        generatedAt:
          new Date().toISOString(),
      };

      return successResponse(
        res,
        dashboard,
        "Dashboard analytics loaded successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error
      );
    }
  };

/* ==========================================================================
   EXPORT ANALYTICS DATA
========================================================================== */

/**
 * Builds a lightweight export-ready dataset.
 *
 * This uses the same live MongoDB analytics data already used by
 * the dashboard.
 */

const getExportData =
  async () => {
    const [
      companies,
      priorities,
      categories,
      trend,
      today,
    ] =
      await Promise.all([
        getCompaniesData(),

        getPriorityData(),

        getCategoryData(),

        getDailyTrendData(),

        getTodayData(),
      ]);

    return {
      generatedAt:
        new Date().toISOString(),

      today,

      companies,

      priorities,

      categories,

      trend,
    };
  };

/* ==========================================================================
   EXCEL EXPORT
========================================================================== */

const exportAnalyticsExcel =
  async (
    req,
    res
  ) => {
    try {
      const data =
        await getExportData();

      /*
       * If ExcelJS is installed, generate a real XLSX file.
       *
       * package:
       * npm install exceljs
       */

      let ExcelJS;

      try {
        ExcelJS =
          require("exceljs");
      } catch (packageError) {
        return res.status(500).json({
          success: false,

          message:
            "Excel export requires the 'exceljs' package. Run: npm install exceljs",

          timestamp:
            new Date().toISOString(),
        });
      }

      const workbook =
        new ExcelJS.Workbook();

      workbook.creator =
        "AI Outlook Management System";

      workbook.created =
        new Date();

      /* ----------------------------------------------------------------------
         Summary Sheet
      ---------------------------------------------------------------------- */

      const summarySheet =
        workbook.addWorksheet(
          "Summary"
        );

      summarySheet.columns = [
        {
          header: "Metric",
          key: "metric",
          width: 30,
        },

        {
          header: "Value",
          key: "value",
          width: 20,
        },
      ];

      summarySheet.addRows([
        {
          metric:
            "Generated At",

          value:
            data.generatedAt,
        },

        {
          metric:
            "Today Received",

          value:
            data.today.received,
        },

        {
          metric:
            "Today Replied",

          value:
            data.today.replied,
        },

        {
          metric:
            "Today Completed",

          value:
            data.today.completed,
        },

        {
          metric:
            "Today Pending",

          value:
            data.today.pending,
        },

        {
          metric:
            "Today High Priority",

          value:
            data.today.highPriority,
        },
      ]);

      /* ----------------------------------------------------------------------
         Companies Sheet
      ---------------------------------------------------------------------- */

      const companySheet =
        workbook.addWorksheet(
          "Companies"
        );

      companySheet.columns = [
        {
          header: "Company",
          key: "company",
          width: 30,
        },

        {
          header: "Total Emails",
          key: "totalEmails",
          width: 18,
        },

        {
          header: "High Priority",
          key: "highPriority",
          width: 18,
        },

        {
          header: "Medium Priority",
          key: "mediumPriority",
          width: 18,
        },

        {
          header: "Low Priority",
          key: "lowPriority",
          width: 18,
        },

        {
          header: "Unread",
          key: "unreadEmails",
          width: 15,
        },

        {
          header: "Completed",
          key: "completedReplies",
          width: 15,
        },

        {
          header: "Response Rate %",
          key: "responseRate",
          width: 20,
        },
      ];

      companySheet.addRows(
        data.companies
      );

      /* ----------------------------------------------------------------------
         Priority Sheet
      ---------------------------------------------------------------------- */

      const prioritySheet =
        workbook.addWorksheet(
          "Priorities"
        );

      prioritySheet.columns = [
        {
          header: "Priority",
          key: "priority",
          width: 20,
        },

        {
          header: "Total Emails",
          key: "totalEmails",
          width: 20,
        },

        {
          header: "Read",
          key: "readEmails",
          width: 15,
        },

        {
          header: "Unread",
          key: "unreadEmails",
          width: 15,
        },

        {
          header: "Completed",
          key: "completedReplies",
          width: 20,
        },
      ];

      prioritySheet.addRows(
        data.priorities
      );

      /* ----------------------------------------------------------------------
         Category Sheet
      ---------------------------------------------------------------------- */

      const categorySheet =
        workbook.addWorksheet(
          "Categories"
        );

      categorySheet.columns = [
        {
          header: "Category",
          key: "category",
          width: 30,
        },

        {
          header: "Total Emails",
          key: "totalEmails",
          width: 20,
        },

        {
          header: "High Priority",
          key: "highPriority",
          width: 18,
        },

        {
          header: "Medium Priority",
          key: "mediumPriority",
          width: 20,
        },

        {
          header: "Low Priority",
          key: "lowPriority",
          width: 18,
        },

        {
          header: "Read",
          key: "readEmails",
          width: 15,
        },

        {
          header: "Unread",
          key: "unreadEmails",
          width: 15,
        },

        {
          header: "Completed",
          key: "completedReplies",
          width: 20,
        },
      ];

      categorySheet.addRows(
        data.categories
      );

      /* ----------------------------------------------------------------------
         Trend Sheet
      ---------------------------------------------------------------------- */

      const trendSheet =
        workbook.addWorksheet(
          "Daily Trend"
        );

      trendSheet.columns = [
        {
          header: "Date",
          key: "date",
          width: 20,
        },

        {
          header: "Total Emails",
          key: "totalEmails",
          width: 20,
        },

        {
          header: "Read Emails",
          key: "readEmails",
          width: 20,
        },

        {
          header: "Unread Emails",
          key: "unreadEmails",
          width: 20,
        },

        {
          header: "Completed Replies",
          key: "completedReplies",
          width: 25,
        },

        {
          header: "High Priority",
          key: "highPriority",
          width: 20,
        },
      ];

      trendSheet.addRows(
        data.trend.map(
          (item) => ({
            date:
              item?._id,

            totalEmails:
              item?.totalEmails || 0,

            readEmails:
              item?.readEmails || 0,

            unreadEmails:
              item?.unreadEmails || 0,

            completedReplies:
              item?.completedReplies ||
              0,

            highPriority:
              item?.highPriority ||
              0,
          })
        )
      );

      /* ----------------------------------------------------------------------
         Response
      ---------------------------------------------------------------------- */

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${Date.now()}.xlsx"`
      );

      await workbook.xlsx.write(
        res
      );

      return res.end();
    } catch (error) {
      return errorResponse(
        res,
        error
      );
    }
  };

/* ==========================================================================
   PDF EXPORT
========================================================================== */

const exportAnalyticsPDF =
  async (
    req,
    res
  ) => {
    try {
      const data =
        await getExportData();

      /*
       * If PDFKit is installed, generate a real PDF.
       *
       * package:
       * npm install pdfkit
       */

      let PDFDocument;

      try {
        PDFDocument =
          require("pdfkit");
      } catch (packageError) {
        return res.status(500).json({
          success: false,

          message:
            "PDF export requires the 'pdfkit' package. Run: npm install pdfkit",

          timestamp:
            new Date().toISOString(),
        });
      }

      const doc =
        new PDFDocument({
          margin: 50,
          size: "A4",
        });

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${Date.now()}.pdf"`
      );

      doc.pipe(res);

      /* ----------------------------------------------------------------------
         Header
      ---------------------------------------------------------------------- */

      doc
        .fontSize(20)
        .text(
          "AI Outlook Management System",
          {
            align: "center",
          }
        );

      doc.moveDown();

      doc
        .fontSize(16)
        .text(
          "Analytics Report",
          {
            align: "center",
          }
        );

      doc.moveDown();

      doc
        .fontSize(10)
        .text(
          `Generated: ${data.generatedAt}`,
          {
            align: "center",
          }
        );

      doc.moveDown(2);

      /* ----------------------------------------------------------------------
         Today's Summary
      ---------------------------------------------------------------------- */

      doc
        .fontSize(14)
        .text(
          "Today's Summary"
        );

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .text(
          `Received Emails: ${data.today.received}`
        );

      doc
        .text(
          `Replied Emails: ${data.today.replied}`
        );

      doc
        .text(
          `Completed: ${data.today.completed}`
        );

      doc
        .text(
          `Pending: ${data.today.pending}`
        );

      doc
        .text(
          `High Priority: ${data.today.highPriority}`
        );

      doc.moveDown(1.5);

      /* ----------------------------------------------------------------------
         Companies
      ---------------------------------------------------------------------- */

      doc
        .fontSize(14)
        .text(
          "Top Companies"
        );

      doc.moveDown(0.5);

      data.companies.forEach(
        (company, index) => {
          doc
            .fontSize(10)
            .text(
              `${index + 1}. ${
                company.company ||
                company.name ||
                "Unknown"
              } — ${
                company.totalEmails || 0
              } emails — ${
                company.completedReplies ||
                0
              } completed`
            );
        }
      );

      doc.moveDown(1.5);

      /* ----------------------------------------------------------------------
         Priorities
      ---------------------------------------------------------------------- */

      doc
        .fontSize(14)
        .text(
          "Priority Analytics"
        );

      doc.moveDown(0.5);

      data.priorities.forEach(
        (priority) => {
          doc
            .fontSize(10)
            .text(
              `${priority.priority}: ${
                priority.totalEmails || 0
              } emails | Read: ${
                priority.readEmails || 0
              } | Unread: ${
                priority.unreadEmails || 0
              }`
            );
        }
      );

      doc.moveDown(1.5);

      /* ----------------------------------------------------------------------
         Categories
      ---------------------------------------------------------------------- */

      doc
        .fontSize(14)
        .text(
          "Category Analytics"
        );

      doc.moveDown(0.5);

      data.categories.forEach(
        (category) => {
          doc
            .fontSize(10)
            .text(
              `${category.category}: ${
                category.totalEmails || 0
              } emails`
            );
        }
      );

      doc.moveDown(1.5);

      /* ----------------------------------------------------------------------
         Daily Trend
      ---------------------------------------------------------------------- */

      doc
        .fontSize(14)
        .text(
          "Daily Email Trend"
        );

      doc.moveDown(0.5);

      data.trend.forEach(
        (item) => {
          doc
            .fontSize(9)
            .text(
              `${item._id}: ${
                item.totalEmails || 0
              } received | ${
                item.readEmails || 0
              } read | ${
                item.completedReplies ||
                0
              } completed`
            );
        }
      );

      /* ----------------------------------------------------------------------
         Footer
      ---------------------------------------------------------------------- */

      doc.moveDown(2);

      doc
        .fontSize(9)
        .text(
          "Generated by AI Outlook Management System",
          {
            align: "center",
          }
        );

      doc.end();
    } catch (error) {
      return errorResponse(
        res,
        error
      );
    }
  };

/* ==========================================================================
   ENTERPRISE CONTROLLER EXPORTS
========================================================================== */

module.exports = {
  getAnalyticsOverview,

  getDashboardAnalytics,

  getCompanyAnalytics,

  getDailyEmailTrend,

  getPriorityAnalytics,

  getCategoryAnalytics,

  getTodayAnalytics,

  getProductivityAnalytics,

  exportAnalyticsExcel,

  exportAnalyticsPDF,
};

/**
 * ============================================================================
 * End analyticsController.js
 * ============================================================================
 */