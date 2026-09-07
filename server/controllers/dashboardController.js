/******************************************************************************
 * dashboardController.js
 * Part 1
 * Enterprise Dashboard Controller
 ******************************************************************************/

const Email = require("../models/Email");

/* ==========================================================================
   Microsoft Graph Services
========================================================================== */

const graphMailService = require("../services/graphMailService");
const graphReportService = require("../services/graphReportService");
const graphInsightService = require("../services/graphInsightService");
const graphPeopleService = require("../services/graphPeopleService");
const graphCalendarService = require("../services/graphCalendarService");
const graphPlannerService = require("../services/graphPlannerService");

/* ==========================================================================
   AI Services
========================================================================== */

const aiClassificationService = require("../services/aiClassificationService");
const aiPriorityService = require("../services/aiPriorityService");
const aiSuggestionService = require("../services/aiSuggestionService");
const aiSLAService = require("../services/aiSLAService");

/* ==========================================================================
   Enterprise Helpers
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

        data,

        timestamp: new Date().toISOString(),

    });

};

const errorResponse = (
    res,
    error,
    status = 500
) => {

    console.error("[DashboardController]", error);

    return res.status(status).json({

        success: false,

        message:
            error?.message ||
            "Internal Server Error",

        timestamp: new Date().toISOString(),

    });

};

const safeNumber = (value = 0) =>
    Number(value || 0);

const percentage = (value = 0) =>
    Number(value).toFixed(2);

/******************************************************************************
 * End Part 1
 ******************************************************************************/
/******************************************************************************
 * dashboardController.js
 * Part 2
 * Dashboard Overview
 ******************************************************************************/

/* ==========================================================================
   Dashboard Overview
========================================================================== */

const getDashboardOverview = async (req, res) => {

    try {

        const [

            mailboxStats,

            reportStats,

            insightStats,

            peopleStats,

            calendarStats,

            plannerStats,

        ] = await Promise.all([

            graphMailService.getMailboxStatistics(),

            graphReportService.getMailboxUsage(),

            graphInsightService.getTrending(),

            graphPeopleService.getPeople(),

            graphCalendarService.getUpcomingEvents(),

            graphPlannerService.getMyTasks(),

        ]);

        const totalEmails =
            safeNumber(mailboxStats.totalEmails);

        const readEmails =
            safeNumber(mailboxStats.readEmails);

        const unreadEmails =
            safeNumber(mailboxStats.unreadEmails);

        const highPriority =
            safeNumber(mailboxStats.highPriority);

        const responseRate =

            totalEmails === 0

                ? 0

                : percentage(

                    (readEmails / totalEmails) * 100

                );

        const overview = {

            executiveSummary: {

                totalEmails,

                readEmails,

                unreadEmails,

                highPriority,

                responseRate,

            },

            productivity: {

                tasks:

                    plannerStats.value ||

                    plannerStats.tasks ||

                    [],

                upcomingMeetings:

                    calendarStats.value ||

                    calendarStats.events ||

                    [],

            },

            insights: {

                trending:

                    insightStats.trending ||

                    [],

                people:

                    peopleStats.value ||

                    peopleStats.people ||

                    [],

            },

            mailboxUsage: reportStats || {},

            generatedAt:

                new Date().toISOString(),

        };

        return successResponse(

            res,

            overview,

            "Dashboard overview loaded successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * dashboardController.js
 * Part 3
 * Executive Summary
 ******************************************************************************/

/* ==========================================================================
   Executive Summary
========================================================================== */

const getExecutiveSummary = async (req, res) => {

    try {

        const [

            mailboxStats,

            reportStats,

            insightStats,

        ] = await Promise.all([

            graphMailService.getMailboxStatistics(),

            graphReportService.getMailboxUsage(),

            graphInsightService.getTrending(),

        ]);

        const summary = {

            totalEmails:

                safeNumber(mailboxStats.totalEmails),

            readEmails:

                safeNumber(mailboxStats.readEmails),

            unreadEmails:

                safeNumber(mailboxStats.unreadEmails),

            flaggedEmails:

                safeNumber(mailboxStats.flaggedEmails),

            highPriority:

                safeNumber(mailboxStats.highPriority),

            normalPriority:

                safeNumber(mailboxStats.normalPriority),

            lowPriority:

                safeNumber(mailboxStats.lowPriority),

            mailboxStorage: {

                used:

                    safeNumber(reportStats.storageUsed),

                available:

                    safeNumber(reportStats.storageAvailable),

                total:

                    safeNumber(reportStats.storageTotal),

            },

            trendingTopics:

                insightStats.trending || [],

            generatedAt:

                new Date().toISOString(),

        };

        return successResponse(

            res,

            summary,

            "Executive summary loaded successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * dashboardController.js
 * Part 4
 * Dashboard KPI Controller
 ******************************************************************************/

/* ==========================================================================
   Dashboard KPIs
========================================================================== */

const getKPIs = async (req, res) => {

    try {

        const [

            mailboxStats,

            plannerStats,

            calendarStats,

            aiSuggestions,

            slaMetrics,

        ] = await Promise.all([

            graphMailService.getMailboxStatistics(),

            graphPlannerService.getMyTasks(),

            graphCalendarService.getUpcomingEvents(),

            aiSuggestionService.getSuggestions(),

            aiSLAService.getSLAMetrics(),

        ]);

        const totalEmails =
            safeNumber(mailboxStats.totalEmails);

        const readEmails =
            safeNumber(mailboxStats.readEmails);

        const unreadEmails =
            safeNumber(mailboxStats.unreadEmails);

        const highPriority =
            safeNumber(mailboxStats.highPriority);

        const responseRate =

            totalEmails === 0

                ? 0

                : percentage(

                    (readEmails / totalEmails) * 100

                );

        const kpis = {

            emailKPIs: {

                totalEmails,

                readEmails,

                unreadEmails,

                highPriority,

                responseRate,

            },

            taskKPIs: {

                pending:

                    plannerStats.pending ||

                    plannerStats.value?.length ||

                    plannerStats.tasks?.length ||

                    0,

                completed:

                    plannerStats.completed ||

                    0,

            },

            meetingKPIs: {

                upcoming:

                    calendarStats.value?.length ||

                    calendarStats.events?.length ||

                    0,

            },

            aiKPIs: {

                suggestions:

                    aiSuggestions.total ||

                    aiSuggestions.length ||

                    0,

            },

            slaKPIs:

                slaMetrics || {},

            generatedAt:

                new Date().toISOString(),

        };

        return successResponse(

            res,

            kpis,

            "Dashboard KPIs loaded successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/******************************************************************************
 * End Part 4
 ******************************************************************************/
/******************************************************************************
 * dashboardController.js
 * Part 5
 * Charts + Recent Activity
 ******************************************************************************/

/* ==========================================================================
   Dashboard Charts
========================================================================== */

const getCharts = async (req, res) => {

    try {

        const [

            mailboxStats,

            reportStats,

            insightStats,

        ] = await Promise.all([

            graphMailService.getMailboxStatistics(),

            graphReportService.getMailboxUsage(),

            graphInsightService.getTrending(),

        ]);

        const charts = {

            priorityDistribution: [

                {

                    name: "High",

                    value: safeNumber(

                        mailboxStats.highPriority

                    ),

                },

                {

                    name: "Normal",

                    value: safeNumber(

                        mailboxStats.normalPriority

                    ),

                },

                {

                    name: "Low",

                    value: safeNumber(

                        mailboxStats.lowPriority

                    ),

                },

            ],

            mailboxUsage: {

                used: safeNumber(

                    reportStats.storageUsed

                ),

                available: safeNumber(

                    reportStats.storageAvailable

                ),

                total: safeNumber(

                    reportStats.storageTotal

                ),

            },

            trendingTopics:

                insightStats.trending || [],

            generatedAt:

                new Date().toISOString(),

        };

        return successResponse(

            res,

            charts,

            "Dashboard charts loaded successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/* ==========================================================================
   Recent Activity
========================================================================== */

const getRecentActivity = async (req, res) => {

    try {

        const inbox = await graphMailService.getInbox({

            page: 1,

            limit: 10,

        });

        const activity = (

            inbox.value ||

            inbox.messages ||

            []

        ).map((email) => ({

            id: email.id,

            subject: email.subject,

            sender:

                email.from?.emailAddress?.name ||

                email.sender ||

                "Unknown",

            receivedAt:

                email.receivedDateTime,

            importance:

                email.importance ||

                "normal",

            isRead:

                email.isRead,

        }));

        return successResponse(

            res,

            {

                total: activity.length,

                activity,

                generatedAt:

                    new Date().toISOString(),

            },

            "Recent activity loaded successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/******************************************************************************
 * End Part 5
 ******************************************************************************/
/******************************************************************************
 * dashboardController.js
 * Part 6
 * Company Insights + Productivity
 ******************************************************************************/

/* ==========================================================================
   Company Insights
========================================================================== */

const getCompanyInsights = async (req, res) => {

    try {

        const [

            peopleStats,

            insightStats,

            reportStats,

        ] = await Promise.all([

            graphPeopleService.getPeople(),

            graphInsightService.getTrending(),

            graphReportService.getMailboxUsage(),

        ]);

        const companyInsights = {

            people:

                peopleStats.value ||

                peopleStats.people ||

                [],

            trendingTopics:

                insightStats.trending ||

                [],

            mailboxUsage:

                reportStats ||

                {},

            generatedAt:

                new Date().toISOString(),

        };

        return successResponse(

            res,

            companyInsights,

            "Company insights loaded successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/* ==========================================================================
   Productivity Dashboard
========================================================================== */

const getProductivity = async (req, res) => {

    try {

        const [

            plannerStats,

            calendarStats,

            mailboxStats,

            aiSuggestions,

            slaMetrics,

        ] = await Promise.all([

            graphPlannerService.getMyTasks(),

            graphCalendarService.getUpcomingEvents(),

            graphMailService.getMailboxStatistics(),

            aiSuggestionService.getSuggestions(),

            aiSLAService.getSLAMetrics(),

        ]);

        const totalEmails =
            safeNumber(mailboxStats.totalEmails);

        const readEmails =
            safeNumber(mailboxStats.readEmails);

        const responseRate =

            totalEmails === 0

                ? 0

                : percentage(

                    (readEmails / totalEmails) * 100

                );

        const productivity = {

            emails: {

                total: totalEmails,

                unread:

                    safeNumber(

                        mailboxStats.unreadEmails

                    ),

                read: readEmails,

                responseRate,

            },

            planner: {

                pending:

                    plannerStats.pending ||

                    plannerStats.value?.length ||

                    plannerStats.tasks?.length ||

                    0,

                completed:

                    plannerStats.completed ||

                    0,

            },

            meetings: {

                upcoming:

                    calendarStats.value?.length ||

                    calendarStats.events?.length ||

                    0,

            },

            ai: {

                suggestions:

                    aiSuggestions.total ||

                    aiSuggestions.length ||

                    0,

            },

            sla:

                slaMetrics ||

                {},

            generatedAt:

                new Date().toISOString(),

        };

        return successResponse(

            res,

            productivity,

            "Productivity dashboard loaded successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/******************************************************************************
 * End Part 6
 ******************************************************************************/
/******************************************************************************
 * dashboardController.js
 * Part 7
 * Enterprise Controller Exports
 ******************************************************************************/

/* ==========================================================================
   Export Dashboard Controller
========================================================================== */

module.exports = {

    getDashboardOverview,

    getExecutiveSummary,

    getKPIs,

    getCharts,

    getRecentActivity,

    getCompanyInsights,

    getProductivity,

};

/******************************************************************************
 * End dashboardController.js
 ******************************************************************************/