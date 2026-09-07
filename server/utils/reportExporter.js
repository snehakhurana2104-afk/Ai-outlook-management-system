/**
 * ============================================================================
 * reportExporter.js
 * Phase 10.5 — Enterprise Report Exporter
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 *
 * - PDF report generation
 * - XLSX report generation
 * - CSV report generation
 * - Enterprise-safe report normalization
 * - Secure filename generation
 * - MIME type handling
 * - Buffer-based file output
 * - Large export protection
 * - Empty-data handling
 * - Consistent exporter response
 *
 * Integration:
 *
 * reportService.js
 *        ↓
 * reportExporter.generate()
 *        ↓
 * ┌──────────────┬──────────────┬──────────────┐
 * │     PDF      │     XLSX     │     CSV      │
 * └──────────────┴──────────────┴──────────────┘
 *
 * ============================================================================
 */

"use strict";

/* ============================================================================
 * Dependencies
 * ========================================================================== */

const {
    REPORT_FORMATS,
    REPORT_LIMITS,
} = require("./reportConstants");

/* ============================================================================
 * Optional Dependencies
 *
 * These are intentionally loaded defensively.
 * The application can still start when one export dependency is not installed.
 * ========================================================================== */

let PDFDocument = null;
let ExcelJS = null;

try {
    PDFDocument = require("pdfkit");
} catch (error) {
    console.warn(
        "[Report Exporter] pdfkit is not installed."
    );
}

try {
    ExcelJS = require("exceljs");
} catch (error) {
    console.warn(
        "[Report Exporter] exceljs is not installed."
    );
}

/* ============================================================================
 * Constants
 * ========================================================================== */

const MODULE_NAME = "ReportExporter";
const API_VERSION = "1.0.0";

const DEFAULT_FILENAME_PREFIX = "microsoft365";

const MAX_EXPORT_ROWS =
    Number(
        REPORT_LIMITS?.MAX_EXPORT_ROWS
    ) || 100000;

const MAX_REPORT_SIZE_MB =
    Number(
        REPORT_LIMITS?.MAX_REPORT_SIZE_MB
    ) || 25;

const MAX_REPORT_SIZE_BYTES =
    MAX_REPORT_SIZE_MB *
    1024 *
    1024;

/* ============================================================================
 * Error Factory
 * ========================================================================== */

const createExporterError = (
    message,
    code = "REPORT_EXPORT_ERROR",
    status = 500,
    details = null
) => {
    const error = new Error(message);

    error.code = code;
    error.status = status;
    error.details = details;

    return error;
};

/* ============================================================================
 * String Helpers
 * ========================================================================== */

const normalizeString = (
    value,
    fallback = ""
) => {
    if (
        typeof value !== "string"
    ) {
        return fallback;
    }

    return value.trim();
};

/* ============================================================================
 * Format Validation
 * ========================================================================== */

const normalizeFormat = (
    format
) => {
    const normalized =
        normalizeString(
            format,
            REPORT_FORMATS.PDF
        ).toLowerCase();

    if (
        !Object.values(
            REPORT_FORMATS
        ).includes(normalized)
    ) {
        throw createExporterError(
            `Unsupported report format: ${normalized}`,
            "REPORT_EXPORT_FORMAT_INVALID",
            400
        );
    }

    return normalized;
};

/* ============================================================================
 * Safe Filename
 * ========================================================================== */

const sanitizeFilename = (
    value
) => {
    return String(
        value || "report"
    )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .replace(
            /^[-.]+|[-.]+$/g,
            ""
        )
        .slice(
            0,
            120
        ) || "report";
};

/* ============================================================================
 * Filename Builder
 * ========================================================================== */

const buildFilename = (
    report,
    format
) => {
    const reportName =
        sanitizeFilename(
            report?.report ||
            report?.type ||
            "report"
        );

    const timestamp =
        new Date()
            .toISOString()
            .replace(
                /[:.]/g,
                "-"
            );

    return (
        `${DEFAULT_FILENAME_PREFIX}-` +
        `${reportName}-` +
        `${timestamp}.` +
        format
    );
};

/* ============================================================================
 * Content Type
 * ========================================================================== */

const getContentType = (
    format
) => {
    switch (format) {
        case REPORT_FORMATS.PDF:
            return "application/pdf";

        case REPORT_FORMATS.XLSX:
            return (
                "application/vnd." +
                "openxmlformats-officedocument." +
                "spreadsheetml.sheet"
            );

        case REPORT_FORMATS.CSV:
            return "text/csv; charset=utf-8";

        default:
            return "application/octet-stream";
    }
};

/* ============================================================================
 * Data Extraction
 * ========================================================================== */

/**
 * Attempts to locate the actual report payload.
 *
 * Supported structures:
 *
 * {
 *   data: [...]
 * }
 *
 * {
 *   data: {
 *      data: [...]
 *   }
 * }
 *
 * {
 *   analytics: ...
 *   team: ...
 *   email: ...
 * }
 */

const extractReportPayload = (
    report
) => {
    if (
        report === null ||
        report === undefined
    ) {
        return {};
    }

    if (
        Array.isArray(report)
    ) {
        return report;
    }

    if (
        report &&
        typeof report === "object"
    ) {
        if (
            Array.isArray(
                report.data
            )
        ) {
            return report.data;
        }

        if (
            report.data &&
            typeof report.data === "object"
        ) {
            return report.data;
        }

        return report;
    }

    return {
        value: report,
    };
};

/* ============================================================================
 * Flatten Object
 * ========================================================================== */

const flattenObject = (
    object,
    prefix = "",
    output = {}
) => {
    if (
        object === null ||
        object === undefined
    ) {
        return output;
    }

    if (
        typeof object !== "object" ||
        object instanceof Date
    ) {
        output[
            prefix || "value"
        ] = object;

        return output;
    }

    if (
        Array.isArray(object)
    ) {
        object.forEach(
            (value, index) => {
                flattenObject(
                    value,
                    prefix
                        ? `${prefix}.${index}`
                        : String(index),
                    output
                );
            }
        );

        return output;
    }

    Object.entries(
        object
    ).forEach(
        ([key, value]) => {
            const nextKey =
                prefix
                    ? `${prefix}.${key}`
                    : key;

            if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value) &&
                !(value instanceof Date)
            ) {
                flattenObject(
                    value,
                    nextKey,
                    output
                );
            } else {
                output[nextKey] =
                    value;
            }
        }
    );

    return output;
};

/* ============================================================================
 * Normalize Rows
 * ========================================================================== */

const normalizeRows = (
    report
) => {
    const payload =
        extractReportPayload(
            report
        );

    if (
        Array.isArray(payload)
    ) {
        return payload
            .slice(
                0,
                MAX_EXPORT_ROWS
            )
            .map(
                (row) => {
                    if (
                        row &&
                        typeof row === "object" &&
                        !Array.isArray(row)
                    ) {
                        return flattenObject(
                            row
                        );
                    }

                    return {
                        value: row,
                    };
                }
            );
    }

    if (
        payload &&
        typeof payload === "object"
    ) {
        const arrayEntry =
            Object.entries(
                payload
            ).find(
                ([, value]) =>
                    Array.isArray(value)
            );

        if (
            arrayEntry
        ) {
            return arrayEntry[1]
                .slice(
                    0,
                    MAX_EXPORT_ROWS
                )
                .map(
                    (row) => {
                        if (
                            row &&
                            typeof row === "object" &&
                            !Array.isArray(row)
                        ) {
                            return flattenObject(
                                row
                            );
                        }

                        return {
                            value: row,
                        };
                    }
                );
        }

        return [
            flattenObject(
                payload
            ),
        ];
    }

    return [
        {
            value: payload,
        },
    ];
};

/* ============================================================================
 * Column Discovery
 * ========================================================================== */

const getColumns = (
    rows
) => {
    const columns = new Set();

    rows.forEach(
        (row) => {
            Object.keys(
                row || {}
            ).forEach(
                (key) => {
                    columns.add(key);
                }
            );
        }
    );

    return Array.from(
        columns
    );
};

/* ============================================================================
 * Value Formatter
 * ========================================================================== */

const formatCellValue = (
    value
) => {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        value instanceof Date
    ) {
        return value.toISOString();
    }

    if (
        typeof value === "object"
    ) {
        try {
            return JSON.stringify(
                value
            );
        } catch (error) {
            return String(
                value
            );
        }
    }

    return String(
        value
    );
};

/* ============================================================================
 * CSV Escaping
 * ========================================================================== */

const escapeCsvValue = (
    value
) => {
    const stringValue =
        formatCellValue(
            value
        );

    const escaped =
        stringValue.replace(
            /"/g,
            '""'
        );

    if (
        /[",\n\r]/.test(
            escaped
        )
    ) {
        return `"${escaped}"`;
    }

    return escaped;
};

/* ============================================================================
 * CSV Generation
 * ========================================================================== */

const generateCSV = async ({
    report,
}) => {
    const rows =
        normalizeRows(
            report
        );

    const columns =
        getColumns(
            rows
        );

    if (
        !columns.length
    ) {
        throw createExporterError(
            "No report columns are available for CSV export.",
            "REPORT_CSV_NO_COLUMNS",
            422
        );
    }

    const header =
        columns
            .map(
                escapeCsvValue
            )
            .join(",");

    const body =
        rows
            .map(
                (row) =>
                    columns
                        .map(
                            (column) =>
                                escapeCsvValue(
                                    row?.[column]
                                )
                        )
                        .join(",")
            )
            .join("\r\n");

    /*
     * UTF-8 BOM improves compatibility with Microsoft Excel.
     */

    const csv =
        "\uFEFF" +
        header +
        "\r\n" +
        body;

    const buffer =
        Buffer.from(
            csv,
            "utf8"
        );

    validateBufferSize(
        buffer,
        REPORT_FORMATS.CSV
    );

    return buffer;
};

/* ============================================================================
 * XLSX Generation
 * ========================================================================== */

const generateXLSX = async ({
    report,
    options = {},
}) => {
    if (!ExcelJS) {
        throw createExporterError(
            "Excel export is unavailable because exceljs is not installed.",
            "REPORT_XLSX_DEPENDENCY_MISSING",
            503
        );
    }

    const rows =
        normalizeRows(
            report
        );

    const columns =
        getColumns(
            rows
        );

    if (
        !columns.length
    ) {
        throw createExporterError(
            "No report columns are available for XLSX export.",
            "REPORT_XLSX_NO_COLUMNS",
            422
        );
    }

    const workbook =
        new ExcelJS.Workbook();

    workbook.creator =
        "Microsoft 365 Enterprise";

    workbook.lastModifiedBy =
        "Microsoft 365 Enterprise";

    workbook.created =
        new Date();

    workbook.modified =
        new Date();

    workbook.properties = {
        title:
            `Microsoft 365 ${options?.report || "Report"}`,

        subject:
            "Enterprise Report",

        company:
            "Microsoft 365 Enterprise",

        category:
            "Enterprise Reporting",

        keywords:
            "Microsoft 365, Report, Analytics",
    };

    const worksheet =
        workbook.addWorksheet(
            sanitizeFilename(
                options?.report ||
                "Report"
            ).slice(
                0,
                31
            )
        );

    worksheet.views = [
        {
            state: "frozen",
            ySplit: 1,
        },
    ];

    worksheet.autoFilter = {
        from: {
            row: 1,
            column: 1,
        },
        to: {
            row: 1,
            column: columns.length,
        },
    };

    worksheet.columns =
        columns.map(
            (column) => ({
                header: column,
                key: column,
                width:
                    Math.min(
                        Math.max(
                            column.length + 2,
                            12
                        ),
                        50
                    ),
            })
        );

    rows.forEach(
        (row) => {
            worksheet.addRow(
                columns.map(
                    (column) =>
                        formatCellValue(
                            row?.[column]
                        )
                )
            );
        }
    );

    worksheet.getRow(
        1
    ).font = {
        bold: true,
    };

    worksheet.getRow(
        1
    ).alignment = {
        vertical: "middle",
    };

    worksheet.eachRow(
        (row) => {
            row.eachCell(
                (cell) => {
                    cell.alignment = {
                        vertical:
                            "top",
                        wrapText:
                            true,
                    };
                }
            );
        }
    );

    const buffer =
        await workbook.xlsx.writeBuffer();

    const output =
        Buffer.isBuffer(buffer)
            ? buffer
            : Buffer.from(
                buffer
            );

    validateBufferSize(
        output,
        REPORT_FORMATS.XLSX
    );

    return output;
};

/* ============================================================================
 * PDF Helpers
 * ========================================================================== */

const collectPdfLines = (
    report,
    options
) => {
    const rows =
        normalizeRows(
            report
        );

    const lines = [];

    lines.push(
        "Microsoft 365 Enterprise Report"
    );

    lines.push(
        ""
    );

    lines.push(
        `Report: ${
            options?.report ||
            options?.reportType ||
            "Enterprise Report"
        }`
    );

    lines.push(
        `Period: ${
            options?.period ||
            "month"
        }`
    );

    if (
        options?.startDate
    ) {
        lines.push(
            `Start Date: ${
                new Date(
                    options.startDate
                ).toISOString()
            }`
        );
    }

    if (
        options?.endDate
    ) {
        lines.push(
            `End Date: ${
                new Date(
                    options.endDate
                ).toISOString()
            }`
        );
    }

    lines.push(
        `Generated: ${
            new Date().toISOString()
        }`
    );

    lines.push(
        ""
    );

    const columns =
        getColumns(
            rows
        );

    if (
        columns.length
    ) {
        lines.push(
            columns.join(
                " | "
            )
        );

        lines.push(
            "-".repeat(
                Math.min(
                    180,
                    Math.max(
                        20,
                        columns.join(
                            " | "
                        ).length
                    )
                )
            )
        );

        rows.forEach(
            (row) => {
                lines.push(
                    columns
                        .map(
                            (column) =>
                                formatCellValue(
                                    row?.[column]
                                )
                        )
                        .join(
                            " | "
                        )
                );
            }
        );
    } else {
        lines.push(
            "No report data available."
        );
    }

    return lines;
};

/* ============================================================================
 * PDF Generation
 * ========================================================================== */

const generatePDF = async ({
    report,
    options = {},
}) => {
    if (!PDFDocument) {
        throw createExporterError(
            "PDF export is unavailable because pdfkit is not installed.",
            "REPORT_PDF_DEPENDENCY_MISSING",
            503
        );
    }

    const lines =
        collectPdfLines(
            report,
            options
        );

    return new Promise(
        (
            resolve,
            reject
        ) => {
            try {
                const document =
                    new PDFDocument({
                        size: "A4",
                        margin: 40,
                        info: {
                            Title:
                                "Microsoft 365 Enterprise Report",

                            Author:
                                "Microsoft 365 Enterprise",

                            Subject:
                                "Enterprise Report",

                            Creator:
                                "Microsoft 365 Enterprise",
                        },
                    });

                const chunks = [];

                let totalSize = 0;

                document.on(
                    "data",
                    (chunk) => {
                        totalSize +=
                            chunk.length;

                        if (
                            totalSize >
                            MAX_REPORT_SIZE_BYTES
                        ) {
                            document.destroy(
                                createExporterError(
                                    "Generated PDF exceeds the configured report size limit.",
                                    "REPORT_PDF_TOO_LARGE",
                                    413
                                )
                            );

                            return;
                        }

                        chunks.push(
                            chunk
                        );
                    }
                );

                document.on(
                    "error",
                    (error) => {
                        reject(
                            error
                        );
                    }
                );

                document.on(
                    "end",
                    () => {
                        const buffer =
                            Buffer.concat(
                                chunks
                            );

                        validateBufferSize(
                            buffer,
                            REPORT_FORMATS.PDF
                        );

                        resolve(
                            buffer
                        );
                    }
                );

                document
                    .fontSize(
                        18
                    )
                    .text(
                        "Microsoft 365 Enterprise Report",
                        {
                            align: "center",
                        }
                    );

                document.moveDown(
                    1
                );

                lines.forEach(
                    (line) => {
                        document
                            .fontSize(
                                9
                            )
                            .text(
                                line,
                                {
                                    width:
                                        515,
                                }
                            );

                        document.moveDown(
                            0.15
                        );
                    }
                );

                document.end();
            } catch (error) {
                reject(
                    error
                );
            }
        }
    );
};

/* ============================================================================
 * Buffer Validation
 * ========================================================================== */

const validateBufferSize = (
    buffer,
    format
) => {
    if (
        !Buffer.isBuffer(
            buffer
        )
    ) {
        throw createExporterError(
            `Exporter did not return a Buffer for ${format}.`,
            "REPORT_EXPORT_BUFFER_INVALID",
            500
        );
    }

    if (
        buffer.length === 0
    ) {
        throw createExporterError(
            `Generated ${format} report is empty.`,
            "REPORT_EXPORT_BUFFER_EMPTY",
            500
        );
    }

    if (
        buffer.length >
        MAX_REPORT_SIZE_BYTES
    ) {
        throw createExporterError(
            `Generated ${format} report exceeds the ${MAX_REPORT_SIZE_MB} MB size limit.`,
            "REPORT_EXPORT_TOO_LARGE",
            413
        );
    }

    return true;
};

/* ============================================================================
 * Export Dispatcher
 * ========================================================================== */

const generate = async ({
    format,
    report,
    options = {},
    context = {},
}) => {
    const normalizedFormat =
        normalizeFormat(
            format
        );

    if (
        !context?.tenantId
    ) {
        throw createExporterError(
            "Tenant context is required for report export.",
            "REPORT_EXPORT_TENANT_REQUIRED",
            401
        );
    }

    let buffer;

    switch (
        normalizedFormat
    ) {
        case REPORT_FORMATS.PDF:
            buffer =
                await generatePDF({
                    report,
                    options,
                    context,
                });
            break;

        case REPORT_FORMATS.XLSX:
            buffer =
                await generateXLSX({
                    report,
                    options,
                    context,
                });
            break;

        case REPORT_FORMATS.CSV:
            buffer =
                await generateCSV({
                    report,
                    options,
                    context,
                });
            break;

        default:
            throw createExporterError(
                `Unsupported report format: ${normalizedFormat}`,
                "REPORT_EXPORT_FORMAT_INVALID",
                400
            );
    }

    validateBufferSize(
        buffer,
        normalizedFormat
    );

    return {
        buffer,

        format:
            normalizedFormat,

        filename:
            buildFilename(
                report,
                normalizedFormat
            ),

        contentType:
            getContentType(
                normalizedFormat
            ),

        size:
            buffer.length,

        sizeMB:
            Number(
                (
                    buffer.length /
                    1024 /
                    1024
                ).toFixed(
                    3
                )
            ),

        generatedAt:
            new Date().toISOString(),
    };
};

/* ============================================================================
 * Export Metadata
 * ========================================================================== */

const getExporterMeta = () => {
    return {
        module:
            MODULE_NAME,

        version:
            API_VERSION,

        formats:
            REPORT_FORMATS,

        maxExportRows:
            MAX_EXPORT_ROWS,

        maxReportSizeMB:
            MAX_REPORT_SIZE_MB,

        dependencies: {
            pdf:
                Boolean(
                    PDFDocument
                ),

            xlsx:
                Boolean(
                    ExcelJS
                ),

            csv:
                true,
        },
    };
};

/* ============================================================================
 * Exports
 * ========================================================================== */

module.exports = {
    generate,

    getExporterMeta,

    generatePDF,
    generateXLSX,
    generateCSV,

    normalizeRows,
    getColumns,

    sanitizeFilename,
    buildFilename,
    getContentType,
};

/**
 * ============================================================================
 * End reportExporter.js
 * Phase 10.5
 * ============================================================================
 */