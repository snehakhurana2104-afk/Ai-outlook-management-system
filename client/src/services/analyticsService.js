// ==========================================================
// analyticsService.js
// Phase 7.1
// Enterprise Analytics Service
// Microsoft 365 Enterprise Edition
// ==========================================================

import axiosInstance from "./axiosInstance";

/* ==========================================================================
   Base Configuration
========================================================================== */

const BASE_URL = "/analytics";

const DEFAULT_TIMEOUT = 30000;

/* ==========================================================================
   Endpoints
========================================================================== */

const ENDPOINTS = Object.freeze({
  overview: `${BASE_URL}/overview`,
  analytics: `${BASE_URL}`,
  dashboard: `${BASE_URL}/dashboard`,

  trends: `${BASE_URL}/trends`,
  dailyTrend: `${BASE_URL}/daily-trend`,

  productivity: `${BASE_URL}/productivity`,

  companies: `${BASE_URL}/companies`,

  priority: `${BASE_URL}/priority`,
  priorities: `${BASE_URL}/priorities`,

  categories: `${BASE_URL}/categories`,

  today: `${BASE_URL}/today`,

  meta: `${BASE_URL}/meta`,
  health: `${BASE_URL}/health`,

  exportExcel: `${BASE_URL}/export/excel`,
  exportPDF: `${BASE_URL}/export/pdf`,
});

/* ==========================================================================
   Request Error Normalizer
========================================================================== */

const normalizeError = (error) => {
  const responseData = error?.response?.data;

  return {
    status: error?.response?.status ?? null,

    message:
      responseData?.message ||
      responseData?.error ||
      error?.message ||
      "Unable to load analytics.",

    code:
      responseData?.code ||
      error?.code ||
      "ANALYTICS_REQUEST_ERROR",

    details:
      responseData?.details ||
      null,
  };
};

/* ==========================================================================
   Safe Request Wrapper
========================================================================== */

const safeRequest = async (
  request,
  options = {}
) => {
  const {
    fallbackData = null,
    throwError = false,
  } = options;

  try {
    const response = await request();

    return {
      success: true,

      data:
        response?.data ??
        fallbackData,

      status:
        response?.status ??
        200,

      message: null,

      error: null,
    };
  } catch (error) {
    const normalizedError =
      normalizeError(error);

    console.error(
      "[Analytics Service]",
      normalizedError
    );

    if (throwError) {
      throw error;
    }

    return {
      success: false,

      data: fallbackData,

      status:
        normalizedError.status,

      message:
        normalizedError.message,

      error: normalizedError,
    };
  }
};

/* ==========================================================================
   Request Configuration
========================================================================== */

const buildConfig = (
  params = {},
  timeout = DEFAULT_TIMEOUT
) => ({
  params,
  timeout,
});

/* ==========================================================================
   Get Complete Analytics
========================================================================== */

export const getAnalytics = async (
  filters = {}
) => {
  return safeRequest(
    () =>
      axiosInstance.get(
        ENDPOINTS.analytics,
        buildConfig(filters)
      ),
    {
      fallbackData: {},
    }
  );
};

/* ==========================================================================
   Analytics Overview
========================================================================== */

export const getAnalyticsOverview = async (
  filters = {}
) => {
  return safeRequest(
    () =>
      axiosInstance.get(
        ENDPOINTS.overview,
        buildConfig(filters)
      ),
    {
      fallbackData: {},
    }
  );
};

/* ==========================================================================
   Dashboard Analytics
========================================================================== */

export const getDashboardAnalytics = async (
  filters = {}
) => {
  return safeRequest(
    () =>
      axiosInstance.get(
        ENDPOINTS.dashboard,
        buildConfig(filters)
      ),
    {
      fallbackData: {},
    }
  );
};

/* ==========================================================================
   Email Trends
========================================================================== */

export const getEmailTrends = async (
  filters = {}
) => {
  return safeRequest(
    () =>
      axiosInstance.get(
        ENDPOINTS.trends,
        buildConfig(filters)
      ),
    {
      fallbackData: [],
    }
  );
};

/* ==========================================================================
   Daily Email Trend
========================================================================== */

export const getDailyEmailTrend = async (
  filters = {}
) => {
  return safeRequest(
    () =>
      axiosInstance.get(
        ENDPOINTS.dailyTrend,
        buildConfig(filters)
      ),
    {
      fallbackData: [],
    }
  );
};

/* ==========================================================================
   Productivity Analytics
========================================================================== */

export const getProductivityAnalytics =
  async (filters = {}) => {
    return safeRequest(
      () =>
        axiosInstance.get(
          ENDPOINTS.productivity,
          buildConfig(filters)
        ),
      {
        fallbackData: {},
      }
    );
  };

/* ==========================================================================
   Company Analytics
========================================================================== */

export const getCompanyAnalytics =
  async (filters = {}) => {
    return safeRequest(
      () =>
        axiosInstance.get(
          ENDPOINTS.companies,
          buildConfig(filters)
        ),
      {
        fallbackData: {
          companies: [],
          totalCompanies: 0,
        },
      }
    );
  };

/* ==========================================================================
   Priority Analytics
========================================================================== */

export const getPriorityAnalytics =
  async (filters = {}) => {
    return safeRequest(
      () =>
        axiosInstance.get(
          ENDPOINTS.priority,
          buildConfig(filters)
        ),
      {
        fallbackData: {
          priorities: [],
          totalPriorities: 0,
        },
      }
    );
  };

/* ==========================================================================
   Priority Analytics - Plural Alias
========================================================================== */

export const getPriorities = async (
  filters = {}
) => {
  return safeRequest(
    () =>
      axiosInstance.get(
        ENDPOINTS.priorities,
        buildConfig(filters)
      ),
    {
      fallbackData: {
        priorities: [],
        totalPriorities: 0,
      },
    }
  );
};

/* ==========================================================================
   Category Analytics
========================================================================== */

export const getCategoryAnalytics =
  async (filters = {}) => {
    return safeRequest(
      () =>
        axiosInstance.get(
          ENDPOINTS.categories,
          buildConfig(filters)
        ),
      {
        fallbackData: {
          categories: [],
          totalCategories: 0,
        },
      }
    );
  };

/* ==========================================================================
   Today's Analytics
========================================================================== */

export const getTodayAnalytics = async (
  filters = {}
) => {
  return safeRequest(
    () =>
      axiosInstance.get(
        ENDPOINTS.today,
        buildConfig(filters)
      ),
    {
      fallbackData: {
        received: 0,
        replied: 0,
        completed: 0,
        highPriority: 0,
        unread: 0,
        pending: 0,
      },
    }
  );
};

/* ==========================================================================
   API Metadata
========================================================================== */

export const getAnalyticsMeta = async () => {
  return safeRequest(
    () =>
      axiosInstance.get(
        ENDPOINTS.meta,
        {
          timeout: DEFAULT_TIMEOUT,
        }
      ),
    {
      fallbackData: {},
    }
  );
};

/* ==========================================================================
   Analytics Health
========================================================================== */

export const getAnalyticsHealth = async () => {
  return safeRequest(
    () =>
      axiosInstance.get(
        ENDPOINTS.health,
        {
          timeout: DEFAULT_TIMEOUT,
        }
      ),
    {
      fallbackData: {
        success: false,
        status: "Unknown",
      },
    }
  );
};

/* ==========================================================================
   Export Excel
========================================================================== */

export const exportAnalyticsExcel =
  async (filters = {}) => {
    return safeRequest(
      () =>
        axiosInstance.get(
          ENDPOINTS.exportExcel,
          {
            ...buildConfig(
              filters,
              DEFAULT_TIMEOUT
            ),

            responseType: "blob",
          }
        ),
      {
        fallbackData: null,
      }
    );
  };

/* ==========================================================================
   Export PDF
========================================================================== */

export const exportAnalyticsPDF =
  async (filters = {}) => {
    return safeRequest(
      () =>
        axiosInstance.get(
          ENDPOINTS.exportPDF,
          {
            ...buildConfig(
              filters,
              DEFAULT_TIMEOUT
            ),

            responseType: "blob",
          }
        ),
      {
        fallbackData: null,
      }
    );
  };

/* ==========================================================================
   Default Service Object
========================================================================== */

const AnalyticsService = {
  getAnalytics,

  getAnalyticsOverview,

  getDashboardAnalytics,

  getEmailTrends,

  getDailyEmailTrend,

  getProductivityAnalytics,

  getCompanyAnalytics,

  getPriorityAnalytics,

  getPriorities,

  getCategoryAnalytics,

  getTodayAnalytics,

  getAnalyticsMeta,

  getAnalyticsHealth,

  exportAnalyticsExcel,

  exportAnalyticsPDF,
};

export default AnalyticsService;

/* ==========================================================================
   End analyticsService.js
========================================================================== */