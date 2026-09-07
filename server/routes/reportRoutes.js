/******************************************************************************
 * reportRoutes.js
 * Enterprise Report Routes
 ******************************************************************************/

const express = require("express");

const router = express.Router();

/* ==========================================================================
   Report Controller
========================================================================== */

let reportController = null;

try {
  reportController = require("../controllers/reportController");
} catch (error) {
  console.warn(
    "[Report Routes] reportController not available:",
    error.message
  );
}

/* ==========================================================================
   Helper
========================================================================== */

const controllerMethod = (methodName) => {
  return async (req, res, next) => {
    try {
      if (
        reportController &&
        typeof reportController[methodName] === "function"
      ) {
        return await reportController[methodName](
          req,
          res,
          next
        );
      }

      return res.status(501).json({
        success: false,
        message: `Report operation '${methodName}' is not implemented yet.`,
      });
    } catch (error) {
      return next(error);
    }
  };
};

/* ==========================================================================
   Routes
========================================================================== */

// All reports
router.get(
  "/",
  controllerMethod("getReports")
);

// Report by ID
router.get(
  "/:reportId",
  controllerMethod("getReportById")
);

// Generate report
router.post(
  "/generate",
  controllerMethod("generateReport")
);

// Create report
router.post(
  "/",
  controllerMethod("createReport")
);

// Update report
router.put(
  "/:reportId",
  controllerMethod("updateReport")
);

// Delete report
router.delete(
  "/:reportId",
  controllerMethod("deleteReport")
);

// Export report
router.get(
  "/:reportId/export",
  controllerMethod("exportReport")
);

// Report statistics
router.get(
  "/stats/summary",
  controllerMethod("getReportStats")
);

/* ==========================================================================
   Health
========================================================================== */

router.get(
  "/health/check",
  (req, res) => {
    return res.json({
      success: true,
      service: "Report Routes",
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  }
);

/* ==========================================================================
   Export
========================================================================== */

module.exports = router;