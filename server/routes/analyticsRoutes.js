/**
 * ============================================================================
 * analyticsRoutes.js
 * Phase 7.9 — Enterprise Analytics Routing
 * Microsoft 365 / Outlook Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 * - Authentication
 * - Permission-based authorization
 * - Analytics API routing
 * - Frontend-compatible endpoint aliases
 * - Health monitoring
 * - API metadata
 * - Excel/PDF export
 * - Controlled 404 handling
 * ============================================================================
 */

"use strict";

const express = require("express");

const router = express.Router();

/* ==========================================================================
   Controllers
========================================================================== */

const analyticsController = require("../controllers/analyticsController");

/* ==========================================================================
   Middlewares
========================================================================== */

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

/* ==========================================================================
   API Configuration
========================================================================== */

const API_VERSION = "2.0.0";
const MODULE_NAME = "Analytics";

/* ==========================================================================
   Controller Validation
========================================================================== */

console.log("[Analytics Routes] Controller validation:", {
  getAnalyticsOverview:
    typeof analyticsController.getAnalyticsOverview,

  getDashboardAnalytics:
    typeof analyticsController.getDashboardAnalytics,

  getCompanyAnalytics:
    typeof analyticsController.getCompanyAnalytics,

  getDailyEmailTrend:
    typeof analyticsController.getDailyEmailTrend,

  getPriorityAnalytics:
    typeof analyticsController.getPriorityAnalytics,

  getCategoryAnalytics:
    typeof analyticsController.getCategoryAnalytics,

  getTodayAnalytics:
    typeof analyticsController.getTodayAnalytics,

  getProductivityAnalytics:
    typeof analyticsController.getProductivityAnalytics,

  exportAnalyticsExcel:
    typeof analyticsController.exportAnalyticsExcel,

  exportAnalyticsPDF:
    typeof analyticsController.exportAnalyticsPDF,
});

/* ==========================================================================
   Global Authentication

   Every Analytics API endpoint requires authentication.
========================================================================== */

router.use(authenticate);

/* ==========================================================================
   ANALYTICS OVERVIEW
========================================================================== */

/**
 * GET /analytics/overview
 */
router.get(
  "/overview",
  authorize("analytics.read"),
  analyticsController.getAnalyticsOverview
);

/* ==========================================================================
   DASHBOARD ANALYTICS
========================================================================== */

/**
 * GET /analytics/dashboard
 *
 * Frontend-compatible dashboard endpoint.
 */
router.get(
  "/dashboard",
  authorize("analytics.read"),
  analyticsController.getDashboardAnalytics
);

/* ==========================================================================
   COMPANY ANALYTICS
========================================================================== */

/**
 * GET /analytics/companies
 */
router.get(
  "/companies",
  authorize("analytics.read"),
  analyticsController.getCompanyAnalytics
);

/* ==========================================================================
   DAILY EMAIL TREND
========================================================================== */

/**
 * GET /analytics/daily-trend
 */
router.get(
  "/daily-trend",
  authorize("analytics.read"),
  analyticsController.getDailyEmailTrend
);

/**
 * GET /analytics/trends
 *
 * Frontend-compatible alias.
 */
router.get(
  "/trends",
  authorize("analytics.read"),
  analyticsController.getDailyEmailTrend
);

/* ==========================================================================
   PRIORITY ANALYTICS
========================================================================== */

/**
 * GET /analytics/priority
 */
router.get(
  "/priority",
  authorize("analytics.read"),
  analyticsController.getPriorityAnalytics
);

/**
 * GET /analytics/priorities
 *
 * Frontend-compatible plural alias.
 */
router.get(
  "/priorities",
  authorize("analytics.read"),
  analyticsController.getPriorityAnalytics
);

/* ==========================================================================
   CATEGORY ANALYTICS
========================================================================== */

/**
 * GET /analytics/categories
 */
router.get(
  "/categories",
  authorize("analytics.read"),
  analyticsController.getCategoryAnalytics
);

/* ==========================================================================
   TODAY ANALYTICS
========================================================================== */

/**
 * GET /analytics/today
 */
router.get(
  "/today",
  authorize("analytics.read"),
  analyticsController.getTodayAnalytics
);

/* ==========================================================================
   PRODUCTIVITY ANALYTICS
========================================================================== */

/**
 * GET /analytics/productivity
 */
router.get(
  "/productivity",
  authorize("analytics.read"),
  analyticsController.getProductivityAnalytics
);

/* ==========================================================================
   EXPORT — EXCEL
========================================================================== */

/**
 * GET /analytics/export/excel
 */
router.get(
  "/export/excel",
  authorize("analytics.read"),
  analyticsController.exportAnalyticsExcel
);

/* ==========================================================================
   EXPORT — PDF
========================================================================== */

/**
 * GET /analytics/export/pdf
 */
router.get(
  "/export/pdf",
  authorize("analytics.read"),
  analyticsController.exportAnalyticsPDF
);

/* ==========================================================================
   HEALTH CHECK
========================================================================== */

/**
 * GET /analytics/health
 *
 * Health endpoint is intentionally placed after authentication.
 */
router.get(
  "/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      service: MODULE_NAME,
      status: "Healthy",
      version: API_VERSION,
      authenticated: true,
      timestamp: new Date().toISOString(),
    });
  }
);

/* ==========================================================================
   API METADATA
========================================================================== */

/**
 * GET /analytics/meta
 */
router.get(
  "/meta",
  authorize("analytics.read"),
  (req, res) => {
    return res.status(200).json({
      success: true,

      module: MODULE_NAME,

      version: API_VERSION,

      endpoints: {
        overview: {
          method: "GET",
          path: "/analytics/overview",
        },

        dashboard: {
          method: "GET",
          path: "/analytics/dashboard",
        },

        companies: {
          method: "GET",
          path: "/analytics/companies",
        },

        dailyTrend: {
          method: "GET",
          path: "/analytics/daily-trend",
        },

        trends: {
          method: "GET",
          path: "/analytics/trends",
        },

        priority: {
          method: "GET",
          path: "/analytics/priority",
        },

        priorities: {
          method: "GET",
          path: "/analytics/priorities",
        },

        categories: {
          method: "GET",
          path: "/analytics/categories",
        },

        today: {
          method: "GET",
          path: "/analytics/today",
        },

        productivity: {
          method: "GET",
          path: "/analytics/productivity",
        },

        exportExcel: {
          method: "GET",
          path: "/analytics/export/excel",
        },

        exportPDF: {
          method: "GET",
          path: "/analytics/export/pdf",
        },

        health: {
          method: "GET",
          path: "/analytics/health",
        },

        meta: {
          method: "GET",
          path: "/analytics/meta",
        },
      },

      timestamp: new Date().toISOString(),
    });
  }
);

/* ==========================================================================
   ROUTE NOT FOUND

   Must remain at the end of this router.
========================================================================== */

router.use(
  (req, res) => {
    return res.status(404).json({
      success: false,

      module: MODULE_NAME,

      message:
        "Analytics API route not found.",

      path:
        req.originalUrl,

      method:
        req.method,

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* ==========================================================================
   EXPORT ROUTER
========================================================================== */

module.exports = router;

/**
 * ============================================================================
 * End analyticsRoutes.js
 * ============================================================================
 */