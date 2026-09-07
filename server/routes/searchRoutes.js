/******************************************************************************
 * searchRoutes.js
 * Part 1
 * Enterprise Search Routes
 ******************************************************************************/

const express = require("express");

const router = express.Router();

/* ==========================================================================
   Controllers
========================================================================== */

const {

  searchEmails,

  advancedSearch,

  searchCompanies,

  searchContacts,

  searchAttachments,

  searchSuggestions,

  searchStatistics,

} = require("../controllers/searchController");

/* ==========================================================================
   Middlewares
========================================================================== */

const authenticate =
  require("../middleware/authMiddleware");

const authorize =
  require("../middleware/authorize");

const validate =
  require("../middleware/validate");

/******************************************************************************
 * Global Authentication
 ******************************************************************************/

router.use(authenticate);
/******************************************************************************
 * Search Emails
 ******************************************************************************/

router.get(

  "/",

  authorize("search.read"),

  searchEmails

);

/******************************************************************************
 * Advanced Search
 ******************************************************************************/

router.get(

  "/advanced",

  authorize("search.read"),

  advancedSearch

);

/******************************************************************************
 * Search Statistics
 ******************************************************************************/

router.get(

  "/statistics",

  authorize("search.read"),

  searchStatistics

);
/******************************************************************************
 * Search Companies
 ******************************************************************************/

router.get(

  "/companies",

  authorize("search.read"),

  searchCompanies

);

/******************************************************************************
 * Search Contacts
 ******************************************************************************/

router.get(

  "/contacts",

  authorize("search.read"),

  searchContacts

);

/******************************************************************************
 * Search Attachments
 ******************************************************************************/

router.get(

  "/attachments",

  authorize("search.read"),

  searchAttachments

);
/******************************************************************************
 * Search Suggestions
 ******************************************************************************/

router.get(

  "/suggestions",

  authorize("search.read"),

  searchSuggestions

);

/******************************************************************************
 * Search Health
 ******************************************************************************/

router.get(

  "/health",

  (req, res) => {

    return res.status(200).json({

      success: true,

      service: "Search API",

      status: "Healthy",

      version: "1.0.0",

      timestamp:

        new Date().toISOString(),

    });

  }

);

/******************************************************************************
 * Route Metadata
 ******************************************************************************/

router.get(

  "/meta",

  authorize("search.read"),

  (req, res) => {

    return res.status(200).json({

      success: true,

      module: "Search",

      version: "1.0.0",

      endpoints: [

        "GET /",

        "GET /advanced",

        "GET /statistics",

        "GET /companies",

        "GET /contacts",

        "GET /attachments",

        "GET /suggestions",

        "GET /health",

        "GET /meta",

      ],

      timestamp:

        new Date().toISOString(),

    });

  }

);
/******************************************************************************
 * 404 Route Handler
 ******************************************************************************/

router.use(

  "*",

  (req, res) => {

    return res.status(404).json({

      success: false,

      message: "Search route not found.",

      path: req.originalUrl,

      timestamp:

        new Date().toISOString(),

    });

  }

);

/******************************************************************************
 * Export Router
 ******************************************************************************/

module.exports = router;

/******************************************************************************
 * End searchRoutes.js
 ******************************************************************************/