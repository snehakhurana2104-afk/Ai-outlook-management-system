import axios from "axios";

// ============================================================
// API BASE URL
// ============================================================

const API =
  process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/reports`
    : "http://localhost:5000/api/reports";

// ============================================================
// AXIOS INSTANCE
// ============================================================

const reportClient = axios.create({
  baseURL: API,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// JWT token automatically attach karega
// ============================================================

reportClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

reportClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response) {
      console.error(
        "Report API Error:",
        error.response.status,
        error.response.data
      );

      if (
        error.response.status === 401
      ) {
        console.warn(
          "Report API: Authentication required."
        );
      }

      if (
        error.response.status === 403
      ) {
        console.warn(
          "Report API: Permission denied."
        );
      }
    } else {
      console.error(
        "Report API Network Error:",
        error.message
      );
    }

    return Promise.reject(error);
  }
);

// ============================================================
// DATE HELPERS
// ============================================================

const formatDate = (date) => {
  if (!date) {
    return "";
  }

  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return date;
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "";
  }

  const year =
    parsedDate.getFullYear();

  const month =
    String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      parsedDate.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ============================================================
// DEFAULT DATE RANGE
// Current month → today
// ============================================================

const getDefaultDates = () => {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return {
    fromDate: `${year}-${month}-01`,
    toDate: `${year}-${month}-${day}`,
  };
};

// ============================================================
// NORMALIZE DATES
// ============================================================

const normalizeDates = (
  fromDate,
  toDate
) => {
  const defaults =
    getDefaultDates();

  const normalizedFrom =
    formatDate(fromDate) ||
    defaults.fromDate;

  const normalizedTo =
    formatDate(toDate) ||
    defaults.toDate;

  return {
    fromDate: normalizedFrom,
    toDate: normalizedTo,
  };
};

// ============================================================
// BUILD DATE PARAMS
// ============================================================

const buildDateParams = (
  fromDate,
  toDate
) => {
  const dates =
    normalizeDates(
      fromDate,
      toDate
    );

  return {
    fromDate:
      dates.fromDate,

    toDate:
      dates.toDate,
  };
};

// ============================================================
// DOWNLOAD BLOB
// ============================================================

const downloadBlob = (
  blob,
  filename
) => {
  const url =
    window.URL.createObjectURL(
      blob
    );

  const link =
    document.createElement("a");

  link.href = url;

  link.setAttribute(
    "download",
    filename
  );

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  setTimeout(() => {
    window.URL.revokeObjectURL(
      url
    );
  }, 1000);
};

// ============================================================
// DOWNLOAD PDF
// Backend:
// GET /api/reports/export/pdf
// ============================================================

export const downloadPDF = async (
  fromDate,
  toDate
) => {
  const params =
    buildDateParams(
      fromDate,
      toDate
    );

  const response =
    await reportClient.get(
      "/export/pdf",
      {
        params,
        responseType: "blob",
      }
    );

  downloadBlob(
    response.data,
    `outlook-report-${params.fromDate}-to-${params.toDate}.pdf`
  );

  return {
    success: true,
    data: response.data,
  };
};

// ============================================================
// DOWNLOAD EXCEL
// Backend:
// GET /api/reports/export/xlsx
// ============================================================

export const downloadExcel = async (
  fromDate,
  toDate
) => {
  const params =
    buildDateParams(
      fromDate,
      toDate
    );

  const response =
    await reportClient.get(
      "/export/xlsx",
      {
        params,
        responseType: "blob",
      }
    );

  downloadBlob(
    response.data,
    `outlook-report-${params.fromDate}-to-${params.toDate}.xlsx`
  );

  return {
    success: true,
    data: response.data,
  };
};

// ============================================================
// DOWNLOAD CSV
// Backend:
// GET /api/reports/export/csv
// ============================================================

export const downloadCSV = async (
  fromDate,
  toDate
) => {
  const params =
    buildDateParams(
      fromDate,
      toDate
    );

  const response =
    await reportClient.get(
      "/export/csv",
      {
        params,
        responseType: "blob",
      }
    );

  downloadBlob(
    response.data,
    `outlook-report-${params.fromDate}-to-${params.toDate}.csv`
  );

  return {
    success: true,
    data: response.data,
  };
};

// ============================================================
// GET REPORT STATS
// Backend:
// GET /api/reports/stats
//
// IMPORTANT:
// Agar backend mein /stats route nahi hai,
// ye function 404 dega.
// Current reportRoutes.js mein /stats nahi hai.
// ============================================================

export const getReportStats = async () => {
  const response =
    await reportClient.get(
      "/stats"
    );

  return response.data;
};

// ============================================================
// GET REPORT PREVIEW
// Backend:
// GET /api/reports/preview
// ============================================================

export const getReports = async ({
  filters = {},
  pagination = {},
  sorting = {},
} = {}) => {
  const response =
    await reportClient.get(
      "/preview",
      {
        params: {
          ...filters,
          ...pagination,
          ...sorting,
        },
      }
    );

  return response.data;
};

// ============================================================
// GENERIC REPORT
// Backend:
// POST /api/reports
// ============================================================

export const generateReport = async (
  reportData = {}
) => {
  const response =
    await reportClient.post(
      "/",
      reportData
    );

  return response.data;
};

// ============================================================
// ANALYTICS REPORT
// Backend:
// GET /api/reports/analytics
// ============================================================

export const getAnalyticsReport =
  async (params = {}) => {
    const response =
      await reportClient.get(
        "/analytics",
        {
          params,
        }
      );

    return response.data;
  };

// ============================================================
// TEAM REPORT
// Backend:
// GET /api/reports/team
// ============================================================

export const getTeamReport =
  async (params = {}) => {
    const response =
      await reportClient.get(
        "/team",
        {
          params,
        }
      );

    return response.data;
  };

// ============================================================
// EMAIL REPORT
// Backend:
// GET /api/reports/emails
// ============================================================

export const getEmailReport =
  async (params = {}) => {
    const response =
      await reportClient.get(
        "/emails",
        {
          params,
        }
      );

    return response.data;
  };

// ============================================================
// EXECUTIVE REPORT
// Backend:
// GET /api/reports/executive
// ============================================================

export const getExecutiveReport =
  async (params = {}) => {
    const response =
      await reportClient.get(
        "/executive",
        {
          params,
        }
      );

    return response.data;
  };

// ============================================================
// REPORT META
// Backend:
// GET /api/reports/meta
// ============================================================

export const getReportMeta =
  async () => {
    const response =
      await reportClient.get(
        "/meta"
      );

    return response.data;
  };

// ============================================================
// EXPORT REPORT DATA
//
// Supported:
// pdf
// xlsx
// csv
// ============================================================

export const exportReportData =
  async ({
    format = "pdf",
    filters = {},
    sorting = {},
  } = {}) => {
    let normalizedFormat =
      String(format)
        .trim()
        .toLowerCase();

    if (
      normalizedFormat ===
        "excel" ||
      normalizedFormat ===
        "xlsx"
    ) {
      normalizedFormat =
        "xlsx";
    } else if (
      normalizedFormat ===
      "csv"
    ) {
      normalizedFormat =
        "csv";
    } else {
      normalizedFormat =
        "pdf";
    }

    const response =
      await reportClient.get(
        `/export/${normalizedFormat}`,
        {
          params: {
            ...filters,
            ...sorting,
          },

          responseType:
            "blob",
        }
      );

    const extension =
      normalizedFormat;

    const filename =
      `outlook-report-${new Date()
        .toISOString()
        .slice(0, 10)}.${extension}`;

    downloadBlob(
      response.data,
      filename
    );

    return {
      success: true,
      data: response.data,
      filename,
    };
  };

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  downloadPDF,
  downloadExcel,
  downloadCSV,
  getReportStats,
  getReports,
  generateReport,
  getAnalyticsReport,
  getTeamReport,
  getEmailReport,
  getExecutiveReport,
  getReportMeta,
  exportReportData,
};