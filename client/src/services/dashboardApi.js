/******************************************************************************
 * dashboardApi.js
 * Part 1
 * Enterprise Dashboard API
 ******************************************************************************/

import axios from "./axiosInstance";

/* ==========================================================================
   API Base
========================================================================== */

const BASE_URL = "/dashboard";

/* ==========================================================================
   Generic GET Helper
========================================================================== */

const get = async (url, params = {}, config = {}) => {

    try {

        const response = await axios.get(

            `${BASE_URL}${url}`,

            {

                params,

                ...config,

            }

        );

        return response.data;

    }

    catch (error) {

        console.error(

            "[Dashboard API]",

            error.response?.data || error.message

        );

        throw error;

    }

};

/* ==========================================================================
   Generic POST Helper
========================================================================== */

const post = async (

    url,

    body = {},

    config = {}

) => {

    try {

        const response = await axios.post(

            `${BASE_URL}${url}`,

            body,

            config

        );

        return response.data;

    }

    catch (error) {

        console.error(

            "[Dashboard API]",

            error.response?.data || error.message

        );

        throw error;

    }

};

/******************************************************************************
 * End Part 1
 ******************************************************************************/
/******************************************************************************
 * dashboardApi.js
 * Part 2
 * Dashboard Overview APIs
 ******************************************************************************/

/* ==========================================================================
   Dashboard Overview
========================================================================== */

export const getDashboardOverview = (

    params = {},

    config = {}

) => {

    return get(

        "/overview",

        params,

        config

    );

};

/* ==========================================================================
   Executive Summary
========================================================================== */

export const getExecutiveSummary = (

    params = {},

    config = {}

) => {

    return get(

        "/summary",

        params,

        config

    );

};

/* ==========================================================================
   Dashboard KPIs
========================================================================== */

export const getKPIs = (

    params = {},

    config = {}

) => {

    return get(

        "/kpis",

        params,

        config

    );

};

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * dashboardApi.js
 * Part 3
 * Charts + Activity + Company APIs
 ******************************************************************************/

/* ==========================================================================
   Dashboard Charts
========================================================================== */

export const getCharts = (

    params = {},

    config = {}

) => {

    return get(

        "/charts",

        params,

        config

    );

};

/* ==========================================================================
   Recent Activity
========================================================================== */

export const getRecentActivity = (

    params = {},

    config = {}

) => {

    return get(

        "/recent-activity",

        params,

        config

    );

};

/* ==========================================================================
   Company Insights
========================================================================== */

export const getCompanyInsights = (

    params = {},

    config = {}

) => {

    return get(

        "/company-insights",

        params,

        config

    );

};

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * dashboardApi.js
 * Part 4
 * Productivity + Health + Refresh + Meta APIs
 ******************************************************************************/

/* ==========================================================================
   Productivity Dashboard
========================================================================== */

export const getProductivity = (

    params = {},

    config = {}

) => {

    return get(

        "/productivity",

        params,

        config

    );

};

/* ==========================================================================
   Refresh Dashboard
========================================================================== */

export const refreshDashboard = (

    params = {},

    config = {}

) => {

    return get(

        "/overview",

        {

            ...params,

            refresh: true,

        },

        config

    );

};

/* ==========================================================================
   Dashboard Health
========================================================================== */

export const getHealth = (

    config = {}

) => {

    return get(

        "/health",

        {},

        config

    );

};

/* ==========================================================================
   Dashboard Metadata
========================================================================== */

export const getMeta = (

    config = {}

) => {

    return get(

        "/meta",

        {},

        config

    );

};

/******************************************************************************
 * End Part 4
 ******************************************************************************/
/******************************************************************************
 * dashboardApi.js
 * Part 5
 * Enterprise Dashboard Loader + API Object + Exports
 ******************************************************************************/

/* ==========================================================================
   Load Complete Dashboard
========================================================================== */

export const loadDashboard = async (

    params = {},

    config = {}

) => {

    try {

        const [

            overview,

            summary,

            kpis,

            charts,

            activity,

            companies,

            productivity,

        ] = await Promise.all([

            getDashboardOverview(params, config),

            getExecutiveSummary(params, config),

            getKPIs(params, config),

            getCharts(params, config),

            getRecentActivity(params, config),

            getCompanyInsights(params, config),

            getProductivity(params, config),

        ]);

        return {

            success: true,

            overview,

            summary,

            kpis,

            charts,

            activity,

            companies,

            productivity,

            loadedAt: new Date().toISOString(),

        };

    }

    catch (error) {

        console.error(

            "[Dashboard API] Failed to load dashboard",

            error

        );

        return {

            success: false,

            error,

            overview: null,

            summary: null,

            kpis: null,

            charts: null,

            activity: null,

            companies: null,

            productivity: null,

            loadedAt: new Date().toISOString(),

        };

    }

};

/* ==========================================================================
   Dashboard API Object
========================================================================== */

const dashboardApi = {

    getDashboardOverview,

    getExecutiveSummary,

    getKPIs,

    getCharts,

    getRecentActivity,

    getCompanyInsights,

    getProductivity,

    refreshDashboard,

    getHealth,

    getMeta,

    loadDashboard,

};

/* ==========================================================================
   Default Export
========================================================================== */

export default dashboardApi;

/******************************************************************************
 * End dashboardApi.js
 ******************************************************************************/