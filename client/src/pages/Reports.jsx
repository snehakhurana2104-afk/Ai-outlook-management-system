/******************************************************************************
 * Reports.jsx
 * Enterprise Outlook Intelligence Reports
 * Compile-safe Create React App version
 ******************************************************************************/

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  RefreshCw,
  AlertTriangle,
  Building2,
} from "lucide-react";

import {
  getReportStats,
  downloadPDF,
  downloadExcel,
  downloadCSV,
} from "../services/reportService";

import "./Reports.css";

/* ==========================================================================
   HELPERS
========================================================================== */

const numberValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return 0;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(
    numberValue(value)
  );

/* ==========================================================================
   REPORTS
========================================================================== */

const Reports = () => {
  const [stats, setStats] = useState({
    totalEmails: 0,
    totalCompanies: 0,
    totalTraining: 0,
    highPriority: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [exporting, setExporting] =
    useState(false);

  /* ==========================================================================
     LOAD STATS
  ========================================================================== */

  const loadStats =
    useCallback(async () => {
      try {
        setRefreshing(true);
        setError("");

        const response =
          await getReportStats();

        const data =
          response?.data ??
          response ??
          {};

        setStats({
          totalEmails:
            numberValue(
              data.totalEmails,
              data.emails,
              data.total
            ),

          totalCompanies:
            numberValue(
              data.totalCompanies,
              data.companies
            ),

          totalTraining:
            numberValue(
              data.totalTraining,
              data.training
            ),

          highPriority:
            numberValue(
              data.highPriority,
              data.highPriorityEmails,
              data.high
            ),
        });
      } catch (loadError) {
        console.error(
          "Report stats error:",
          loadError
        );

        setError(
          loadError?.message ||
            "Unable to load report statistics."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  /* ==========================================================================
     INITIAL LOAD
  ========================================================================== */

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  /* ==========================================================================
     DOWNLOAD
  ========================================================================== */

  const handleDownload =
    useCallback(
      async (type) => {
        try {
          setExporting(true);
          setError("");

          if (type === "pdf") {
            await downloadPDF(
              fromDate,
              toDate
            );
          }

          if (type === "excel") {
            await downloadExcel(
              fromDate,
              toDate
            );
          }

          if (type === "csv") {
            await downloadCSV(
              fromDate,
              toDate
            );
          }
        } catch (downloadError) {
          console.error(
            "Report download error:",
            downloadError
          );

          setError(
            downloadError?.message ||
              "Report download failed."
          );
        } finally {
          setExporting(false);
        }
      },
      [fromDate, toDate]
    );

  /* ==========================================================================
     LOADING
  ========================================================================== */

  if (loading) {
    return (
      <div
        className="reports-page"
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <RefreshCw
          size={28}
          style={{
            animation:
              "reports-spin 1s linear infinite",
          }}
        />

        <h2>
          Loading Reports...
        </h2>

        <style>
          {`
            @keyframes reports-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <div
      className="reports-page"
      style={{
        minHeight:
          "100vh",
        background:
          "#f8fafc",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
        }}
      >
        {/* ================================================================
            HEADER
        ================================================================ */}

        <div
          className="reports-header"
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 20,
            marginBottom: 24,
            flexWrap:
              "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 800,
                color:
                  "#0f172a",
              }}
            >
              Reports Center
            </h1>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  "#64748b",
              }}
            >
              Enterprise Outlook Email
              Intelligence Reporting
            </p>
          </div>

          <button
            type="button"
            onClick={
              loadStats
            }
            disabled={
              refreshing
            }
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: 8,
              padding:
                "10px 16px",
              borderRadius: 10,
              border:
                "1px solid #cbd5e1",
              background:
                "#fff",
              cursor:
                "pointer",
            }}
          >
            <RefreshCw
              size={17}
            />

            Refresh
          </button>
        </div>

        {/* ================================================================
            ERROR
        ================================================================ */}

        {error && (
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: 10,
              padding: 14,
              marginBottom: 20,
              background:
                "#fef2f2",
              border:
                "1px solid #fecaca",
              borderRadius: 12,
              color:
                "#b91c1c",
            }}
          >
            <AlertTriangle
              size={18}
            />

            {error}
          </div>
        )}

        {/* ================================================================
            STATISTICS
        ================================================================ */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            className="report-card"
            style={{
              background:
                "#fff",
              border:
                "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <Mail
              size={24}
              color="#2563eb"
            />

            <div
              style={{
                marginTop: 15,
                color:
                  "#64748b",
                fontSize: 13,
              }}
            >
              Total Emails
            </div>

            <strong
              style={{
                display:
                  "block",
                marginTop: 6,
                fontSize: 28,
                color:
                  "#0f172a",
              }}
            >
              {formatNumber(
                stats.totalEmails
              )}
            </strong>
          </div>

          <div
            className="report-card"
            style={{
              background:
                "#fff",
              border:
                "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <Building2
              size={24}
              color="#7c3aed"
            />

            <div
              style={{
                marginTop: 15,
                color:
                  "#64748b",
                fontSize: 13,
              }}
            >
              Companies
            </div>

            <strong
              style={{
                display:
                  "block",
                marginTop: 6,
                fontSize: 28,
                color:
                  "#0f172a",
              }}
            >
              {formatNumber(
                stats.totalCompanies
              )}
            </strong>
          </div>

          <div
            className="report-card"
            style={{
              background:
                "#fff",
              border:
                "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <FileText
              size={24}
              color="#16a34a"
            />

            <div
              style={{
                marginTop: 15,
                color:
                  "#64748b",
                fontSize: 13,
              }}
            >
              Training / Reports
            </div>

            <strong
              style={{
                display:
                  "block",
                marginTop: 6,
                fontSize: 28,
                color:
                  "#0f172a",
              }}
            >
              {formatNumber(
                stats.totalTraining
              )}
            </strong>
          </div>

          <div
            className="report-card"
            style={{
              background:
                "#fff",
              border:
                "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <AlertTriangle
              size={24}
              color="#dc2626"
            />

            <div
              style={{
                marginTop: 15,
                color:
                  "#64748b",
                fontSize: 13,
              }}
            >
              High Priority
            </div>

            <strong
              style={{
                display:
                  "block",
                marginTop: 6,
                fontSize: 28,
                color:
                  "#0f172a",
              }}
            >
              {formatNumber(
                stats.highPriority
              )}
            </strong>
          </div>
        </div>

        {/* ================================================================
            DATE FILTER
        ================================================================ */}

        <section
          style={{
            background:
              "#fff",
            border:
              "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin:
                "0 0 16px",
              fontSize: 18,
              color:
                "#0f172a",
            }}
          >
            Report Date Range
          </h2>

          <div
            style={{
              display:
                "flex",
              gap: 14,
              alignItems:
                "flex-end",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <label
                style={{
                  display:
                    "block",
                  marginBottom: 6,
                  fontSize: 12,
                  color:
                    "#64748b",
                }}
              >
                <Calendar
                  size={13}
                  style={{
                    verticalAlign:
                      "middle",
                    marginRight: 5,
                  }}
                />
                From
              </label>

              <input
                type="date"
                value={
                  fromDate
                }
                onChange={(event) =>
                  setFromDate(
                    event.target
                      .value
                  )
                }
                style={{
                  padding:
                    "10px 12px",
                  borderRadius: 9,
                  border:
                    "1px solid #cbd5e1",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display:
                    "block",
                  marginBottom: 6,
                  fontSize: 12,
                  color:
                    "#64748b",
                }}
              >
                <Calendar
                  size={13}
                  style={{
                    verticalAlign:
                      "middle",
                    marginRight: 5,
                  }}
                />
                To
              </label>

              <input
                type="date"
                value={
                  toDate
                }
                onChange={(event) =>
                  setToDate(
                    event.target
                      .value
                  )
                }
                style={{
                  padding:
                    "10px 12px",
                  borderRadius: 9,
                  border:
                    "1px solid #cbd5e1",
                }}
              />
            </div>
          </div>
        </section>

        {/* ================================================================
            EXPORT OPTIONS
        ================================================================ */}

        <section
          style={{
            background:
              "#fff",
            border:
              "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2
            style={{
              margin:
                "0 0 8px",
              fontSize: 18,
              color:
                "#0f172a",
            }}
          >
            Export Reports
          </h2>

          <p
            style={{
              margin:
                "0 0 20px",
              color:
                "#64748b",
              fontSize: 13,
            }}
          >
            Generate Outlook reports
            for the selected date range.
            If no dates are selected,
            the service uses the current
            month.
          </p>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(200px,1fr))",
              gap: 14,
            }}
          >
            <button
              type="button"
              disabled={
                exporting
              }
              onClick={() =>
                handleDownload(
                  "pdf"
                )
              }
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 9,
                padding:
                  "13px 18px",
                border: 0,
                borderRadius: 10,
                background:
                  "#dc2626",
                color:
                  "#fff",
                cursor:
                  "pointer",
                opacity:
                  exporting
                    ? 0.6
                    : 1,
              }}
            >
              <FileText
                size={18}
              />

              {exporting
                ? "Exporting..."
                : "Download PDF"}
            </button>

            <button
              type="button"
              disabled={
                exporting
              }
              onClick={() =>
                handleDownload(
                  "excel"
                )
              }
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 9,
                padding:
                  "13px 18px",
                border: 0,
                borderRadius: 10,
                background:
                  "#16a34a",
                color:
                  "#fff",
                cursor:
                  "pointer",
                opacity:
                  exporting
                    ? 0.6
                    : 1,
              }}
            >
              <FileSpreadsheet
                size={18}
              />

              Download Excel
            </button>

            <button
              type="button"
              disabled={
                exporting
              }
              onClick={() =>
                handleDownload(
                  "csv"
                )
              }
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 9,
                padding:
                  "13px 18px",
                border: 0,
                borderRadius: 10,
                background:
                  "#2563eb",
                color:
                  "#fff",
                cursor:
                  "pointer",
                opacity:
                  exporting
                    ? 0.6
                    : 1,
              }}
            >
              <Download
                size={18}
              />

              Download CSV
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Reports;