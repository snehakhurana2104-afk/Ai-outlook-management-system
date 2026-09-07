/******************************************************************************
 * services/analyticsAggregatorService.js
 * Part 1
 * Configuration + Imports + Logger
 ******************************************************************************/

/* ==========================================================================
   Imports
========================================================================== */

const Email = require("../models/Email");
const Task = require("../models/Task");

/* ==========================================================================
   Configuration
========================================================================== */

const DEFAULT_DAYS = 30;

/* ==========================================================================
   Logger
========================================================================== */

const log = (message, payload = {}) => {

    console.log(

        `[Analytics Aggregator] ${message}`,

        payload

    );

};

const errorLog = (message, error) => {

    console.error(

        `[Analytics Aggregator] ${message}`,

        error?.message || error

    );

};

/* ==========================================================================
   Date Helper
========================================================================== */

const getFromDate = (days = DEFAULT_DAYS) => {

    const date = new Date();

    date.setDate(

        date.getDate() - days

    );

    return date;

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Get Dashboard Analytics
 ******************************************************************************/

const getDashboardAnalytics = async (

    userId,

    days = DEFAULT_DAYS

) => {

    try {

        const fromDate =

            getFromDate(days);

        const [

            totalEmails,

            unreadEmails,

            completedTasks,

            pendingTasks,

        ] = await Promise.all([

            Email.countDocuments({

                userId,

                createdAt: {

                    $gte: fromDate,

                },

            }),

            Email.countDocuments({

                userId,

                isRead: false,

                createdAt: {

                    $gte: fromDate,

                },

            }),

            Task.countDocuments({

                userId,

                status: "COMPLETED",

            }),

            Task.countDocuments({

                userId,

                status: {

                    $ne: "COMPLETED",

                },

            }),

        ]);

        return {

            totalEmails,

            unreadEmails,

            completedTasks,

            pendingTasks,

        };

    }

    catch (error) {

        errorLog(

            "Dashboard Analytics Failed",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Get Priority Analytics
 ******************************************************************************/

const getPriorityAnalytics = async (

    userId

) => {

    try {

        return await Email.aggregate([

            {

                $match: {

                    userId,

                },

            },

            {

                $group: {

                    _id: "$importance",

                    count: {

                        $sum: 1,

                    },

                },

            },

        ]);

    }

    catch (error) {

        errorLog(

            "Priority Analytics Failed",

            error

        );

        throw error;

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Get Company Analytics
 ******************************************************************************/

const getCompanyAnalytics = async (

    userId

) => {

    try {

        return await Email.aggregate([

            {

                $match: {

                    userId,

                },

            },

            {

                $group: {

                    _id: "$company",

                    totalEmails: {

                        $sum: 1,

                    },

                },

            },

            {

                $sort: {

                    totalEmails: -1,

                },

            },

            {

                $limit: 10,

            },

        ]);

    }

    catch (error) {

        errorLog(

            "Company Analytics Failed",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Get Daily Email Trend
 ******************************************************************************/

const getDailyTrend = async (

    userId,

    days = DEFAULT_DAYS

) => {

    try {

        const fromDate =

            getFromDate(days);

        return await Email.aggregate([

            {

                $match: {

                    userId,

                    createdAt: {

                        $gte: fromDate,

                    },

                },

            },

            {

                $group: {

                    _id: {

                        $dateToString: {

                            format: "%Y-%m-%d",

                            date: "$createdAt",

                        },

                    },

                    total: {

                        $sum: 1,

                    },

                },

            },

            {

                $sort: {

                    _id: 1,

                },

            },

        ]);

    }

    catch (error) {

        errorLog(

            "Daily Trend Failed",

            error

        );

        throw error;

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Get Task Analytics
 ******************************************************************************/

const getTaskAnalytics = async (

    userId

) => {

    try {

        return await Task.aggregate([

            {

                $match: {

                    userId,

                },

            },

            {

                $group: {

                    _id: "$status",

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

        ]);

    }

    catch (error) {

        errorLog(

            "Task Analytics Failed",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Aggregate Complete Analytics
 ******************************************************************************/

const aggregateAnalytics = async (

    userId,

    days = DEFAULT_DAYS

) => {

    try {

        const [

            dashboard,

            priority,

            company,

            trend,

            tasks,

        ] = await Promise.all([

            getDashboardAnalytics(

                userId,

                days

            ),

            getPriorityAnalytics(

                userId

            ),

            getCompanyAnalytics(

                userId

            ),

            getDailyTrend(

                userId,

                days

            ),

            getTaskAnalytics(

                userId

            ),

        ]);

        return {

            dashboard,

            priority,

            company,

            trend,

            tasks,

            generatedAt:

                new Date().toISOString(),

        };

    }

    catch (error) {

        errorLog(

            "Aggregate Analytics Failed",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    getDashboardAnalytics,

    getPriorityAnalytics,

    getCompanyAnalytics,

    getDailyTrend,

    getTaskAnalytics,

    aggregateAnalytics,

};

/******************************************************************************
 * End analyticsAggregatorService.js
 ******************************************************************************/