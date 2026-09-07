"use strict";

/**
 * ============================================================================
 * reportService.js
 * Phase 13 — Enterprise Report Service
 *
 * CommonJS version
 *
 * Compatible with:
 *   reportController.js
 *   reportRoutes.js
 *
 * Supported:
 *   - Generic reports
 *   - Preview
 *   - Analytics report
 *   - Team report
 *   - Email report
 *   - Executive report
 *   - PDF export
 *   - XLSX export
 *   - CSV export
 *   - Report metadata
 * ============================================================================
 */

const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const Email =
    require("../models/Email");

/* ============================================================================
 * Constants
 * ========================================================================== */

const REPORT_FORMATS = {
    PDF: "pdf",
    XLSX: "xlsx",
    CSV: "csv",
};

const DEFAULT_FORMAT =
    REPORT_FORMATS.PDF;

const DEFAULT_PERIOD =
    "month";

/* ============================================================================
 * Utility Helpers
 * ========================================================================== */

const safeString = (
    value,
    fallback = ""
) => {
    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    return String(value);
};

const normalizeFormat = (
    format
) => {
    const value =
        safeString(
            format,
            DEFAULT_FORMAT
        )
            .trim()
            .toLowerCase();

    if (
        value === "excel" ||
        value === "xlsx"
    ) {
        return REPORT_FORMATS.XLSX;
    }

    if (
        value === "csv"
    ) {
        return REPORT_FORMATS.CSV;
    }

    return REPORT_FORMATS.PDF;
};

const normalizeDate = (
    value
) => {
    if (!value) {
        return null;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
};

const startOfDay = (
    date
) => {
    const result =
        new Date(date);

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
};

const endOfDay = (
    date
) => {
    const result =
        new Date(date);

    result.setHours(
        23,
        59,
        59,
        999
    );

    return result;
};

const getDateRange = (
    options = {}
) => {

    let start =
        normalizeDate(
            options.startDate
        );

    let end =
        normalizeDate(
            options.endDate
        );

    if (
        start &&
        end
    ) {
        return {
            start:
                startOfDay(start),

            end:
                endOfDay(end),
        };
    }

    const now =
        new Date();

    /*
     * Monthly default.
     */
    start =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

    end =
        now;

    return {
        start:
            startOfDay(start),

        end:
            endOfDay(end),
    };
};

/* ============================================================================
 * MongoDB Query
 * ========================================================================== */

const buildEmailQuery = (
    options = {},
    context = {}
) => {

    const query = {};

    const {
        start,
        end,
    } = getDateRange(
        options
    );

    query.receivedDateTime = {
        $gte: start,
        $lte: end,
    };

    if (
        options.priority
    ) {
        query.priority =
            options.priority;
    }

    if (
        options.category
    ) {
        query.category =
            options.category;
    }

    if (
        options.department
    ) {
        query.department =
            options.department;
    }

    if (
        options.teamId
    ) {
        query.assignedTo =
            options.teamId;
    }

    if (
        options.search
    ) {

        const search =
            String(
                options.search
            )
                .trim();

        if (search) {

            query.$or = [
                {
                    subject: {
                        $regex:
                            search,
                        $options:
                            "i",
                    },
                },
                {
                    senderName: {
                        $regex:
                            search,
                        $options:
                            "i",
                    },
                },
                {
                    senderEmail: {
                        $regex:
                            search,
                        $options:
                            "i",
                    },
                },
                {
                    company: {
                        $regex:
                            search,
                        $options:
                            "i",
                    },
                },
                {
                    body: {
                        $regex:
                            search,
                        $options:
                            "i",
                    },
                },
            ];
        }
    }

    /*
     * Tenant filtering is intentionally
     * applied only when the Email model
     * actually contains tenantId.
     *
     * This prevents breaking the current
     * model if tenantId does not exist.
     */
    if (
        context &&
        context.tenantId
    ) {

        try {

            const schemaPaths =
                Email.schema
                    .paths || {};

            if (
                schemaPaths.tenantId
            ) {
                query.tenantId =
                    context.tenantId;
            }

        } catch (error) {
            console.warn(
                "[ReportService] Tenant field check failed:",
                error.message
            );
        }
    }

    return query;
};

/* ============================================================================
 * Fetch Emails
 * ========================================================================== */

const fetchEmails = async (
    options = {},
    context = {}
) => {

    const query =
        buildEmailQuery(
            options,
            context
        );

    return Email.find(query)
        .sort({
            receivedDateTime:
                -1,
        })
        .lean();
};

/* ============================================================================
 * Basic Statistics
 * ========================================================================== */

const calculateStats = (
    emails = []
) => {

    const total =
        emails.length;

    const unread =
        emails.filter(
            (email) =>
                email.isRead === false
        ).length;

    const read =
        emails.filter(
            (email) =>
                email.isRead !== false
        ).length;

    const high =
        emails.filter(
            (email) =>
                String(
                    email.priority
                ).toLowerCase() ===
                "high"
        ).length;

    const medium =
        emails.filter(
            (email) =>
                String(
                    email.priority
                ).toLowerCase() ===
                "medium"
        ).length;

    const low =
        emails.filter(
            (email) =>
                String(
                    email.priority
                ).toLowerCase() ===
                "low"
        ).length;

    const completed =
        emails.filter(
            (email) =>
                email.isRead !== false ||
                String(
                    email.status
                ).toLowerCase() ===
                "completed"
        ).length;

    const pending =
        emails.filter(
            (email) =>
                email.isRead === false ||
                String(
                    email.status
                ).toLowerCase() ===
                "pending"
        ).length;

    const companies =
        new Set(
            emails
                .map(
                    (email) =>
                        email.company
                )
                .filter(Boolean)
        );

    const members =
        new Set(
            emails
                .map(
                    (email) =>
                        email.assignedTo
                )
                .filter(Boolean)
        );

    return {
        total,
        unread,
        read,
        high,
        medium,
        low,
        completed,
        pending,
        companies:
            companies.size,
        teamMembers:
            members.size,
    };
};

/* ============================================================================
 * Category Statistics
 * ========================================================================== */

const calculateCategories = (
    emails = []
) => {

    const categories = {};

    emails.forEach(
        (email) => {

            const category =
                email.category ||
                "Uncategorized";

            categories[
                category
            ] =
                (categories[
                    category
                ] || 0) + 1;
        }
    );

    return Object.entries(
        categories
    )
        .map(
            ([
                category,
                count,
            ]) => ({
                category,
                count,
            })
        )
        .sort(
            (a, b) =>
                b.count -
                a.count
        );
};

/* ============================================================================
 * Company Statistics
 * ========================================================================== */

const calculateCompanies = (
    emails = []
) => {

    const companies = {};

    emails.forEach(
        (email) => {

            const company =
                email.company ||
                "Unknown";

            companies[
                company
            ] =
                (companies[
                    company
                ] || 0) + 1;
        }
    );

    return Object.entries(
        companies
    )
        .map(
            ([
                company,
                count,
            ]) => ({
                company,
                count,
            })
        )
        .sort(
            (a, b) =>
                b.count -
                a.count
        );
};

/* ============================================================================
 * Team Statistics
 * ========================================================================== */

const calculateTeam = (
    emails = []
) => {

    const team = {};

    emails.forEach(
        (email) => {

            const member =
                email.assignedTo ||
                "Unassigned";

            if (
                !team[member]
            ) {
                team[member] = {
                    name:
                        member,
                    total: 0,
                    completed:
                        0,
                    pending:
                        0,
                    highPriority:
                        0,
                };
            }

            team[member].total +=
                1;

            if (
                email.isRead !==
                false
            ) {
                team[member]
                    .completed +=
                    1;
            } else {
                team[member]
                    .pending +=
                    1;
            }

            if (
                String(
                    email.priority
                ).toLowerCase() ===
                "high"
            ) {
                team[member]
                    .highPriority +=
                    1;
            }
        }
    );

    return Object.values(
        team
    ).sort(
        (a, b) =>
            b.total -
            a.total
    );
};

/* ============================================================================
 * Daily Trend
 * ========================================================================== */

const calculateDailyTrend = (
    emails = []
) => {

    const days = {};

    emails.forEach(
        (email) => {

            const date =
                normalizeDate(
                    email.receivedDateTime
                );

            if (!date) {
                return;
            }

            const key =
                date
                    .toISOString()
                    .slice(
                        0,
                        10
                    );

            days[key] =
                (days[key] || 0) +
                1;
        }
    );

    return Object.entries(
        days
    )
        .sort(
            ([a], [b]) =>
                a.localeCompare(b)
        )
        .map(
            ([
                date,
                count,
            ]) => ({
                date,
                count,
            })
        );
};

/* ============================================================================
 * Build Report Data
 * ========================================================================== */

const buildReportData = (
    emails,
    options = {}
) => {

    const stats =
        calculateStats(
            emails
        );

    return {
        reportType:
            options.reportType ||
            "general",

        report:
            options.report ||
            options.reportType ||
            "email",

        format:
            normalizeFormat(
                options.format
            ),

        period:
            options.period ||
            DEFAULT_PERIOD,

        dateRange:
            getDateRange(
                options
            ),

        generatedAt:
            new Date()
                .toISOString(),

        summary:
            stats,

        stats,

        categories:
            calculateCategories(
                emails
            ),

        companies:
            calculateCompanies(
                emails
            ),

        team:
            calculateTeam(
                emails
            ),

        dailyTrend:
            calculateDailyTrend(
                emails
            ),

        emails,
    };
};

/* ============================================================================
 * Generic Report
 * ========================================================================== */

const generateReport = async (
    options = {},
    context = {}
) => {

    const emails =
        await fetchEmails(
            options,
            context
        );

    const data =
        buildReportData(
            emails,
            options
        );

    return {
        success: true,
        data,
        message:
            "Report generated successfully.",
    };
};

/* ============================================================================
 * Preview
 * ========================================================================== */

const previewReport = async (
    options = {},
    context = {}
) => {

    const result =
        await generateReport(
            options,
            context
        );

    if (
        !result ||
        !result.data
    ) {
        return result;
    }

    const preview =
        {
            ...result.data,
            emails:
                result.data.emails
                    .slice(
                        0,
                        100
                    ),
            preview:
                true,
        };

    return {
        success: true,
        data: preview,
        message:
            "Report preview generated successfully.",
    };
};

/* ============================================================================
 * Analytics Report
 * ========================================================================== */

const generateAnalyticsReport =
    async (
        options = {},
        context = {}
    ) => {

        const emails =
            await fetchEmails(
                options,
                context
            );

        const stats =
            calculateStats(
                emails
            );

        return {
            success: true,

            data: {
                reportType:
                    "analytics",

                generatedAt:
                    new Date()
                        .toISOString(),

                summary:
                    stats,

                priority: {
                    high:
                        stats.high,
                    medium:
                        stats.medium,
                    low:
                        stats.low,
                },

                categories:
                    calculateCategories(
                        emails
                    ),

                companies:
                    calculateCompanies(
                        emails
                    ),

                dailyTrend:
                    calculateDailyTrend(
                        emails
                    ),
            },

            message:
                "Analytics report generated successfully.",
        };
    };

/* ============================================================================
 * Team Report
 * ========================================================================== */

const generateTeamReport =
    async (
        options = {},
        context = {}
    ) => {

        const emails =
            await fetchEmails(
                options,
                context
            );

        const team =
            calculateTeam(
                emails
            );

        return {
            success: true,

            data: {
                reportType:
                    "team",

                generatedAt:
                    new Date()
                        .toISOString(),

                totalTeamMembers:
                    team.length,

                totalEmails:
                    emails.length,

                team,
            },

            message:
                "Team report generated successfully.",
        };
    };

/* ============================================================================
 * Email Report
 * ========================================================================== */

const generateEmailReport =
    async (
        options = {},
        context = {}
    ) => {

        const emails =
            await fetchEmails(
                options,
                context
            );

        return {
            success: true,

            data: {
                reportType:
                    "email",

                generatedAt:
                    new Date()
                        .toISOString(),

                summary:
                    calculateStats(
                        emails
                    ),

                emails,
            },

            message:
                "Email report generated successfully.",
        };
    };

/* ============================================================================
 * Executive Report
 * ========================================================================== */

const generateExecutiveReport =
    async (
        options = {},
        context = {}
    ) => {

        const emails =
            await fetchEmails(
                options,
                context
            );

        const stats =
            calculateStats(
                emails
            );

        const team =
            calculateTeam(
                emails
            );

        const companies =
            calculateCompanies(
                emails
            );

        const categories =
            calculateCategories(
                emails
            );

        const responseRate =
            stats.total > 0
                ? Number(
                      (
                          (
                              stats.completed /
                              stats.total
                          ) *
                          100
                      ).toFixed(2)
                  )
                : 0;

        return {
            success: true,

            data: {
                reportType:
                    "executive",

                generatedAt:
                    new Date()
                        .toISOString(),

                executiveSummary: {
                    totalEmails:
                        stats.total,

                    completed:
                        stats.completed,

                    pending:
                        stats.pending,

                    highPriority:
                        stats.high,

                    responseRate,
                },

                teamPerformance:
                    team,

                topCompanies:
                    companies.slice(
                        0,
                        10
                    ),

                topCategories:
                    categories.slice(
                        0,
                        10
                    ),

                dailyTrend:
                    calculateDailyTrend(
                        emails
                    ),
            },

            message:
                "Executive report generated successfully.",
        };
    };

/* ============================================================================
 * CSV Helpers
 * ========================================================================== */

const escapeCSV = (
    value
) => {

    const text =
        safeString(
            value
        );

    return `"${text
        .replace(
            /"/g,
            '""'
        )
        .replace(
            /\r?\n/g,
            " "
        )}"`;
};

const generateCSV = (
    emails = []
) => {

    const headers = [
        "Date",
        "Sender",
        "Sender Email",
        "Subject",
        "Company",
        "Category",
        "Priority",
        "Status",
        "Assigned To",
        "Read",
    ];

    const rows = [
        headers
            .map(escapeCSV)
            .join(","),
    ];

    emails.forEach(
        (email) => {

            rows.push(
                [
                    email.receivedDateTime,

                    email.senderName,

                    email.senderEmail,

                    email.subject,

                    email.company,

                    email.category,

                    email.priority,

                    email.status,

                    email.assignedTo,

                    email.isRead
                        ? "Yes"
                        : "No",
                ]
                    .map(
                        escapeCSV
                    )
                    .join(",")
            );
        }
    );

    return Buffer.from(
        rows.join("\n"),
        "utf8"
    );
};

/* ============================================================================
 * XLSX
 * ========================================================================== */

const generateXLSX = async (
    emails = []
) => {

    const workbook =
        new ExcelJS.Workbook();

    workbook.creator =
        "AI Outlook Email Intelligence";

    workbook.created =
        new Date();

    const sheet =
        workbook.addWorksheet(
            "Email Report"
        );

    sheet.columns = [
        {
            header: "Date",
            key: "date",
            width: 24,
        },
        {
            header: "Sender",
            key: "sender",
            width: 25,
        },
        {
            header: "Sender Email",
            key: "senderEmail",
            width: 32,
        },
        {
            header: "Subject",
            key: "subject",
            width: 50,
        },
        {
            header: "Company",
            key: "company",
            width: 25,
        },
        {
            header: "Category",
            key: "category",
            width: 20,
        },
        {
            header: "Priority",
            key: "priority",
            width: 15,
        },
        {
            header: "Status",
            key: "status",
            width: 20,
        },
        {
            header: "Assigned To",
            key: "assignedTo",
            width: 25,
        },
        {
            header: "Read",
            key: "read",
            width: 10,
        },
    ];

    emails.forEach(
        (email) => {

            sheet.addRow({
                date:
                    email.receivedDateTime,

                sender:
                    email.senderName,

                senderEmail:
                    email.senderEmail,

                subject:
                    email.subject,

                company:
                    email.company,

                category:
                    email.category,

                priority:
                    email.priority,

                status:
                    email.status,

                assignedTo:
                    email.assignedTo,

                read:
                    email.isRead
                        ? "Yes"
                        : "No",
            });
        }
    );

    sheet.getRow(1).font = {
        bold: true,
    };

    sheet.getRow(1).alignment = {
        vertical:
            "middle",
    };

    sheet.views = [
        {
            state:
                "frozen",
            ySplit:
                1,
        },
    ];

    const buffer =
        await workbook.xlsx.writeBuffer();

    return Buffer.from(
        buffer
    );
};

/* ============================================================================
 * PDF
 * ========================================================================== */

const generatePDF = (
    emails = [],
    options = {}
) => {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            try {

                const document =
                    new PDFDocument({
                        size:
                            "A4",
                        margin:
                            40,
                    });

                const chunks = [];

                document.on(
                    "data",
                    (chunk) => {
                        chunks.push(
                            chunk
                        );
                    }
                );

                document.on(
                    "end",
                    () => {

                        resolve(
                            Buffer.concat(
                                chunks
                            )
                        );
                    }
                );

                document.on(
                    "error",
                    reject
                );

                document
                    .fontSize(20)
                    .text(
                        "AI Outlook Email Intelligence",
                        {
                            align:
                                "center",
                        }
                    );

                document
                    .moveDown()
                    .fontSize(14)
                    .text(
                        "Enterprise Email Report"
                    );

                document
                    .moveDown()
                    .fontSize(10)
                    .text(
                        `Generated: ${new Date().toLocaleString()}`
                    );

                const stats =
                    calculateStats(
                        emails
                    );

                document
                    .moveDown()
                    .fontSize(12)
                    .text(
                        "Executive Summary"
                    );

                document
                    .moveDown(0.5)
                    .fontSize(10)
                    .text(
                        `Total Emails: ${stats.total}`
                    )
                    .text(
                        `Read Emails: ${stats.read}`
                    )
                    .text(
                        `Unread Emails: ${stats.unread}`
                    )
                    .text(
                        `High Priority: ${stats.high}`
                    )
                    .text(
                        `Medium Priority: ${stats.medium}`
                    )
                    .text(
                        `Low Priority: ${stats.low}`
                    )
                    .text(
                        `Completed: ${stats.completed}`
                    )
                    .text(
                        `Pending: ${stats.pending}`
                    );

                document
                    .moveDown()
                    .fontSize(12)
                    .text(
                        "Email Details"
                    );

                emails.forEach(
                    (
                        email,
                        index
                    ) => {

                        if (
                            document.y >
                            720
                        ) {
                            document
                                .addPage();
                        }

                        document
                            .moveDown(0.5)
                            .fontSize(10)
                            .text(
                                `${index + 1}. ${safeString(email.subject, "No Subject")}`
                            );

                        document
                            .fontSize(8)
                            .text(
                                `Sender: ${safeString(email.senderName)} <${safeString(email.senderEmail)}>`
                            )
                            .text(
                                `Company: ${safeString(email.company)}`
                            )
                            .text(
                                `Category: ${safeString(email.category)}`
                            )
                            .text(
                                `Priority: ${safeString(email.priority)}`
                            )
                            .text(
                                `Status: ${safeString(email.status)}`
                            )
                            .text(
                                `Assigned To: ${safeString(email.assignedTo)}`
                            );
                    }
                );

                document.end();

            } catch (
                error
            ) {
                reject(error);
            }
        }
    );
};

/* ============================================================================
 * Download Report
 * ========================================================================== */

const downloadReport =
    async (
        options = {},
        context = {}
    ) => {

        const format =
            normalizeFormat(
                options.format
            );

        const emails =
            await fetchEmails(
                options,
                context
            );

        let buffer;

        let contentType;

        let extension;

        if (
            format ===
            REPORT_FORMATS.CSV
        ) {

            buffer =
                generateCSV(
                    emails
                );

            contentType =
                "text/csv; charset=utf-8";

            extension =
                "csv";

        } else if (
            format ===
            REPORT_FORMATS.XLSX
        ) {

            buffer =
                await generateXLSX(
                    emails
                );

            contentType =
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            extension =
                "xlsx";

        } else {

            buffer =
                await generatePDF(
                    emails,
                    options
                );

            contentType =
                "application/pdf";

            extension =
                "pdf";
        }

        const reportName =
            safeString(
                options.report ||
                options.reportType ||
                "email-report"
            )
                .toLowerCase()
                .replace(
                    /[^a-z0-9-_]/g,
                    "-"
                );

        const timestamp =
            new Date()
                .toISOString()
                .replace(
                    /[:.]/g,
                    "-"
                );

        const filename =
            `microsoft365-${reportName}-${timestamp}.${extension}`;

        return {
            success: true,

            data: {
                buffer,

                data: buffer,

                format,

                contentType,

                filename,
            },

            message:
                "Report downloaded successfully.",
        };
    };

/* ============================================================================
 * Report Metadata
 * ========================================================================== */

const getReportMeta =
    async () => {

        return {
            success: true,

            data: {
                module:
                    "Enterprise Reports",

                version:
                    "1.0.0",

                supportedFormats: [
                    "pdf",
                    "xlsx",
                    "csv",
                ],

                supportedReports: [
                    "general",
                    "analytics",
                    "team",
                    "email",
                    "executive",
                ],

                supportedPeriods: [
                    "day",
                    "week",
                    "month",
                    "quarter",
                    "year",
                    "custom",
                ],

                generatedFrom:
                    "MongoDB / Outlook email data",

                generatedAt:
                    new Date()
                        .toISOString(),
            },

            message:
                "Report metadata loaded successfully.",
        };
    };

/* ============================================================================
 * Export
 * ========================================================================== */

module.exports = {

    generateReport,

    previewReport,

    downloadReport,

    generateAnalyticsReport,

    generateTeamReport,

    generateEmailReport,

    generateExecutiveReport,

    getReportMeta,
};