/******************************************************************************
 * dashboardRoutes.js
 * Part 1
 * Enterprise Dashboard Routes
 ******************************************************************************/

const express = require("express");

const router = express.Router();

/* ==========================================================================
   Dashboard Controller
========================================================================== */

const dashboardController =
    require("../controllers/dashboardController");

/* ==========================================================================
   Middlewares
========================================================================== */

const authenticate =
    require("../middleware/authMiddleware");

const authorize =
    require("../middleware/authorize");

/* ==========================================================================
   Global Authentication
========================================================================== */

router.use(authenticate);

/******************************************************************************
 * End Part 1
 ******************************************************************************/
/******************************************************************************
 * dashboardRoutes.js
 * Part 2
 * Overview + Summary + KPI Routes
 ******************************************************************************/

/* ==========================================================================
   Dashboard Overview
========================================================================== */

router.get(

    "/overview",

    authorize("dashboard.read"),

    dashboardController.getDashboardOverview

);

/* ==========================================================================
   Executive Summary
========================================================================== */

router.get(

    "/summary",

    authorize("dashboard.read"),

    dashboardController.getExecutiveSummary

);

/* ==========================================================================
   Dashboard KPIs
========================================================================== */

router.get(

    "/kpis",

    authorize("dashboard.read"),

    dashboardController.getKPIs

);

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * dashboardRoutes.js
 * Part 3
 * Charts + Activity + Company Insights Routes
 ******************************************************************************/

/* ==========================================================================
   Dashboard Charts
========================================================================== */

router.get(

    "/charts",

    authorize("dashboard.read"),

    dashboardController.getCharts

);

/* ==========================================================================
   Recent Activity
========================================================================== */

router.get(

    "/recent-activity",

    authorize("dashboard.read"),

    dashboardController.getRecentActivity

);

/* ==========================================================================
   Company Insights
========================================================================== */

router.get(

    "/company-insights",

    authorize("dashboard.read"),

    dashboardController.getCompanyInsights

);

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * dashboardRoutes.js
 * Part 4
 * Productivity + Health + Meta + 404 + Export
 ******************************************************************************/

/* ==========================================================================
   Productivity Dashboard
========================================================================== */

router.get(

    "/productivity",

    authorize("dashboard.read"),

    dashboardController.getProductivity

);

/* ==========================================================================
   Dashboard Health
========================================================================== */

router.get(

    "/health",

    (req, res) => {

        return res.status(200).json({

            success: true,

            service: "Dashboard API",

            status: "Healthy",

            version: "2.0.0",

            timestamp: new Date().toISOString(),

        });

    }

);

/* ==========================================================================
   API Metadata
========================================================================== */

router.get(

    "/meta",

    authorize("dashboard.read"),

    (req, res) => {

        return res.status(200).json({

            success: true,

            module: "Dashboard",

            version: "2.0.0",

            endpoints: {

                overview: "GET /overview",

                summary: "GET /summary",

                kpis: "GET /kpis",

                charts: "GET /charts",

                recentActivity: "GET /recent-activity",

                companyInsights: "GET /company-insights",

                productivity: "GET /productivity",

                health: "GET /health",

                meta: "GET /meta",

            },

            timestamp: new Date().toISOString(),

        });

    }

);

/* ==========================================================================
   Route Not Found
========================================================================== */

router.use((req, res) => {

    return res.status(404).json({

        success: false,

        message: "Dashboard API route not found.",

        path: req.originalUrl,

        method: req.method,

        timestamp: new Date().toISOString(),

    });

});

/* ==========================================================================
   Export Router
========================================================================== */

module.exports = router;

/******************************************************************************
 * End dashboardRoutes.js
 ******************************************************************************/