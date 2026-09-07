/******************************************************************************
 * searchController.js
 * Part 1
 * Enterprise Search Controller
 ******************************************************************************/

const Email = require("../models/Email");

/* ==========================================================================
   Microsoft Graph Services
========================================================================== */

const graphSearchService =
  require("../services/graphSearchService");

const graphMailService =
  require("../services/graphMailService");

/* ==========================================================================
   AI Services
========================================================================== */

const aiClassificationService =
  require("../services/aiClassificationService");

const aiPriorityService =
  require("../services/aiPriorityService");

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

    data,

    timestamp: new Date().toISOString(),

  });

};

const errorResponse = (
  res,
  error,
  status = 500
) => {

  console.error(

    "[SearchController]",

    error

  );

  return res.status(status).json({

    success: false,

    message:

      error?.message ||

      "Internal Server Error",

    timestamp:

      new Date().toISOString(),

  });

};

/* ==========================================================================
   Utility Helpers
========================================================================== */

const safeNumber = (value) =>
  Number(value || 0);

/* ==========================================================================
   Search Controller Starts
========================================================================== */
/******************************************************************************
 * searchEmails()
 ******************************************************************************/

const searchEmails = async (req, res) => {

  try {

    const {

      query = "",

      page = 1,

      limit = 20,

      priority,

      category,

      company,

      isRead,

      startDate,

      endDate,

    } = req.query;

    const filters = {

      page:

        Number(page),

      limit:

        Number(limit),

      priority,

      category,

      company,

      isRead,

      startDate,

      endDate,

    };

    const result =

      await graphSearchService.searchEmails(

        query,

        filters

      );

    return successResponse(

      res,

      {

        total:

          result.total ||

          result.value?.length ||

          0,

        page:

          filters.page,

        limit:

          filters.limit,

        emails:

          result.value ||

          result.emails ||

          [],

        generatedAt:

          new Date().toISOString(),

      },

      "Email search completed successfully."

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
 * advancedSearch()
 ******************************************************************************/

const advancedSearch = async (req, res) => {

  try {

    const filters = {

      keyword:

        req.query.keyword || "",

      subject:

        req.query.subject || "",

      sender:

        req.query.sender || "",

      company:

        req.query.company || "",

      priority:

        req.query.priority || "",

      category:

        req.query.category || "",

      isRead:

        req.query.isRead,

      startDate:

        req.query.startDate,

      endDate:

        req.query.endDate,

      page:

        Number(req.query.page || 1),

      limit:

        Number(req.query.limit || 20),

    };

    const results =

      await graphSearchService.advancedSearch(

        filters

      );

    return successResponse(

      res,

      {

        total:

          results.total ||

          results.value?.length ||

          0,

        page:

          filters.page,

        limit:

          filters.limit,

        emails:

          results.value ||

          results.emails ||

          [],

        generatedAt:

          new Date().toISOString(),

      },

      "Advanced search completed successfully."

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
 * searchCompanies()
 ******************************************************************************/

const searchCompanies = async (req, res) => {

  try {

    const keyword =

      req.query.keyword || "";

    const companies =

      await Email.aggregate([

        {

          $match: {

            company: {

              $regex: keyword,

              $options: "i",

            },

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

          $limit: 20,

        },

      ]);

    return successResponse(

      res,

      {

        total:

          companies.length,

        companies,

        generatedAt:

          new Date().toISOString(),

      },

      "Company search completed successfully."

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
 * searchContacts()
 ******************************************************************************/

const searchContacts = async (req, res) => {

  try {

    const keyword =

      req.query.keyword || "";

    const contacts =

      await graphSearchService.searchContacts(

        keyword

      );

    return successResponse(

      res,

      {

        total:

          contacts.total ||

          contacts.value?.length ||

          0,

        contacts:

          contacts.value ||

          contacts.contacts ||

          [],

        generatedAt:

          new Date().toISOString(),

      },

      "Contact search completed successfully."

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
 * searchAttachments()
 ******************************************************************************/

const searchAttachments = async (req, res) => {

  try {

    const keyword =

      req.query.keyword || "";

    const attachments =

      await graphSearchService.searchAttachments(

        keyword

      );

    return successResponse(

      res,

      {

        total:

          attachments.total ||

          attachments.value?.length ||

          0,

        attachments:

          attachments.value ||

          attachments.attachments ||

          [],

        generatedAt:

          new Date().toISOString(),

      },

      "Attachment search completed successfully."

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
 * searchSuggestions()
 ******************************************************************************/

const searchSuggestions = async (req, res) => {

  try {

    const keyword =

      req.query.keyword || "";

    const suggestions =

      await graphSearchService.getSearchSuggestions(

        keyword

      );

    return successResponse(

      res,

      {

        total:

          suggestions.total ||

          suggestions.length ||

          0,

        suggestions,

        generatedAt:

          new Date().toISOString(),

      },

      "Search suggestions loaded successfully."

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
 * searchStatistics()
 ******************************************************************************/

const searchStatistics = async (req, res) => {

  try {

    const [

      mailboxStats,

      priorityStats,

      classificationStats,

    ] = await Promise.all([

      graphMailService.getMailboxStatistics(),

      aiPriorityService.getPriorityAnalytics(),

      aiClassificationService.getClassificationAnalytics(),

    ]);

    const statistics = {

      totalEmails:

        safeNumber(

          mailboxStats.totalEmails

        ),

      searchableEmails:

        safeNumber(

          mailboxStats.totalEmails

        ),

      priorityAnalytics:

        priorityStats,

      classificationAnalytics:

        classificationStats,

      generatedAt:

        new Date().toISOString(),

    };

    return successResponse(

      res,

      statistics,

      "Search statistics loaded successfully."

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
 * Export Controller
 ******************************************************************************/

module.exports = {

  searchEmails,

  advancedSearch,

  searchCompanies,

  searchContacts,

  searchAttachments,

  searchSuggestions,

  searchStatistics,

};

/******************************************************************************
 * End searchController.js
 ******************************************************************************/