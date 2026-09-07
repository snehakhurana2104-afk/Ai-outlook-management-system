// ============================================================
// middlewares/dashboardValidator.js
// Enterprise Dashboard Validation Middleware
// ============================================================

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const ALLOWED_SORT_FIELDS = [
  "createdAt",
  "receivedDateTime",
  "priority",
  "status",
  "company",
  "title",
];

const ALLOWED_SORT_ORDER = [
  "asc",
  "desc",
];

module.exports = (
  req,
  res,
  next
) => {
  try {
    const query = req.query;

    // ========================================================
    // PAGE
    // ========================================================

    query.page =
      Number(query.page) ||
      DEFAULT_PAGE;

    if (query.page < 1) {
      query.page = DEFAULT_PAGE;
    }

    // ========================================================
    // LIMIT
    // ========================================================

    query.limit =
      Number(query.limit) ||
      DEFAULT_LIMIT;

    if (query.limit < 1) {
      query.limit =
        DEFAULT_LIMIT;
    }

    if (query.limit > MAX_LIMIT) {
      query.limit =
        MAX_LIMIT;
    }

    // ========================================================
    // SORT FIELD
    // ========================================================

    if (
      !ALLOWED_SORT_FIELDS.includes(
        query.sortBy
      )
    ) {
      query.sortBy =
        "createdAt";
    }

    // ========================================================
    // SORT ORDER
    // ========================================================

    if (
      !ALLOWED_SORT_ORDER.includes(
        query.sortOrder
      )
    ) {
      query.sortOrder =
        "desc";
    }

    // ========================================================
    // SEARCH
    // ========================================================

    query.search = String(
      query.search || ""
    ).trim();

    // ========================================================
    // PRIORITY
    // ========================================================

    query.priority =
      String(
        query.priority || ""
      ).trim();

    // ========================================================
    // STATUS
    // ========================================================

    query.status =
      String(
        query.status || ""
      ).trim();

    // ========================================================
    // COMPANY
    // ========================================================

    query.company =
      String(
        query.company || ""
      ).trim();

    // ========================================================
    // CATEGORY
    // ========================================================

    query.category =
      String(
        query.category || ""
      ).trim();

    next();
  } catch (error) {
    console.error(
      "Dashboard Validation Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        "Invalid dashboard query parameters.",
    });
  }
};