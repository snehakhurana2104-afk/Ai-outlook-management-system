/**
 * ============================================================================
 * analyticsExportController.js
 * Phase 7.5 — Enterprise Analytics Export
 * Microsoft 365 Enterprise Analytics Platform
 * ============================================================================
 */

const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const Email = require("../models/Email");


/* ============================================================================
   RESPONSE HELPERS
============================================================================ */

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

        timestamp:
            new Date().toISOString(),

    });

};


const errorResponse = (
    res,
    error,
    status = 500
) => {

    console.error(
        "[AnalyticsExportController]",
        error
    );

    return res.status(status).json({

        success: false,

        message:
            error?.message ||
            "Unable to export analytics.",

        timestamp:
            new Date().toISOString(),

    });

};


/* ============================================================================
   FILTER BUILDER
============================================================================ */

const buildFilter = (filters = {}) => {

    const {

        month,
        year,
        priority,
        category,

    } = filters;


    const query = {};


    /* ------------------------------------------------------------------------
       Month / Year
    ------------------------------------------------------------------------ */

    if (month && year) {

        const selectedMonth =
            Number(month);

        const selectedYear =
            Number(year);


        if (
            selectedMonth >= 1 &&
            selectedMonth <= 12 &&
            selectedYear >= 2000 &&
            selectedYear <= 2100
        ) {

            const startDate =
                new Date(
                    selectedYear,
                    selectedMonth - 1,
                    1
                );


            const endDate =
                new Date(
                    selectedYear,
                    selectedMonth,
                    1
                );


            query.receivedDateTime = {

                $gte: startDate,

                $lt: endDate,

            };

        }

    }


    /* ------------------------------------------------------------------------
       Priority
    ------------------------------------------------------------------------ */

    if (
        priority &&
        priority !== "All"
    ) {

        query.priority = priority;

    }


    /* ------------------------------------------------------------------------
       Category
    ------------------------------------------------------------------------ */

    if (
        category &&
        category !== "All"
    ) {

        query.category = category;

    }


    return query;

};


/* ============================================================================
   FETCH EXPORT DATA
============================================================================ */

const getExportData = async (filters = {}) => {

    const query =
        buildFilter(filters);


    const emails =
        await Email.find(query)
            .sort({
                receivedDateTime: -1,
            })
            .lean();


    const totalEmails =
        emails.length;


    const highPriority =
        emails.filter(
            (email) =>
                email.priority === "High"
        ).length;


    const mediumPriority =
        emails.filter(
            (email) =>
                email.priority === "Medium"
        ).length;


    const lowPriority =
        emails.filter(
            (email) =>
                email.priority === "Low"
        ).length;


    const readEmails =
        emails.filter(
            (email) =>
                email.isRead === true
        ).length;


    const unreadEmails =
        emails.filter(
            (email) =>
                email.isRead === false
        ).length;


    const completedEmails =
        emails.filter(
            (email) =>
                email.status === "Completed"
        ).length;


    const responseRate =
        totalEmails === 0
            ? 0
            : Number(
                (
                    completedEmails /
                    totalEmails
                ) * 100
            ).toFixed(2);


    const companiesMap =
        new Map();


    emails.forEach((email) => {

        const company =
            email.company ||
            "Unknown";


        if (
            !companiesMap.has(company)
        ) {

            companiesMap.set(
                company,
                {
                    company,
                    totalEmails: 0,
                    repliedEmails: 0,
                    highPriority: 0,
                }
            );

        }


        const item =
            companiesMap.get(company);


        item.totalEmails += 1;


        if (
            email.status ===
            "Completed"
        ) {

            item.repliedEmails += 1;

        }


        if (
            email.priority ===
            "High"
        ) {

            item.highPriority += 1;

        }

    });


    const companies =
        [...companiesMap.values()]
            .map((company) => {

                company.responseRate =
                    company.totalEmails === 0
                        ? 0
                        : Number(
                            (
                                company.repliedEmails /
                                company.totalEmails
                            ) * 100
                        ).toFixed(2);

                return company;

            })
            .sort(
                (a, b) =>
                    b.totalEmails -
                    a.totalEmails
            )
            .slice(0, 10);


    return {

        summary: {

            totalEmails,

            highPriority,

            mediumPriority,

            lowPriority,

            readEmails,

            unreadEmails,

            completedEmails,

            responseRate,

        },

        companies,

        emails,

        generatedAt:
            new Date().toISOString(),

    };

};


/* ============================================================================
   EXCEL EXPORT
   POST /api/analytics/export/excel
============================================================================ */

const exportExcel = async (
    req,
    res
) => {

    try {

        const exportData =
            await getExportData(
                req.body || {}
            );


        const workbook =
            new ExcelJS.Workbook();


        workbook.creator =
            "AI Outlook Enterprise";


        workbook.created =
            new Date();


        workbook.modified =
            new Date();


        /* --------------------------------------------------------------------
           Summary Sheet
        -------------------------------------------------------------------- */

        const summarySheet =
            workbook.addWorksheet(
                "Analytics Summary"
            );


        summarySheet.columns = [

            {
                header: "Metric",
                key: "metric",
                width: 30,
            },

            {
                header: "Value",
                key: "value",
                width: 20,
            },

        ];


        const summary =
            exportData.summary;


        summarySheet.addRows([

            {
                metric:
                    "Total Emails",
                value:
                    summary.totalEmails,
            },

            {
                metric:
                    "High Priority",
                value:
                    summary.highPriority,
            },

            {
                metric:
                    "Medium Priority",
                value:
                    summary.mediumPriority,
            },

            {
                metric:
                    "Low Priority",
                value:
                    summary.lowPriority,
            },

            {
                metric:
                    "Read Emails",
                value:
                    summary.readEmails,
            },

            {
                metric:
                    "Unread Emails",
                value:
                    summary.unreadEmails,
            },

            {
                metric:
                    "Completed Emails",
                value:
                    summary.completedEmails,
            },

            {
                metric:
                    "Response Rate",
                value:
                    `${summary.responseRate}%`,
            },

        ]);


        /* --------------------------------------------------------------------
           Company Sheet
        -------------------------------------------------------------------- */

        const companySheet =
            workbook.addWorksheet(
                "Top Companies"
            );


        companySheet.columns = [

            {
                header: "Company",
                key: "company",
                width: 30,
            },

            {
                header: "Total Emails",
                key: "totalEmails",
                width: 18,
            },

            {
                header: "Replied",
                key: "repliedEmails",
                width: 15,
            },

            {
                header: "Response Rate",
                key: "responseRate",
                width: 18,
            },

            {
                header: "High Priority",
                key: "highPriority",
                width: 18,
            },

        ];


        companySheet.addRows(
            exportData.companies
        );


        /* --------------------------------------------------------------------
           Email Details Sheet
        -------------------------------------------------------------------- */

        const emailSheet =
            workbook.addWorksheet(
                "Email Details"
            );


        emailSheet.columns = [

            {
                header: "Subject",
                key: "subject",
                width: 45,
            },

            {
                header: "Sender",
                key: "sender",
                width: 35,
            },

            {
                header: "Company",
                key: "company",
                width: 25,
            },

            {
                header: "Priority",
                key: "priority",
                width: 15,
            },

            {
                header: "Category",
                key: "category",
                width: 20,
            },

            {
                header: "Status",
                key: "status",
                width: 18,
            },

            {
                header: "Read",
                key: "isRead",
                width: 12,
            },

            {
                header:
                    "Received Date",
                key:
                    "receivedDateTime",
                width: 25,
            },

        ];


        exportData.emails.forEach(
            (email) => {

                emailSheet.addRow({

                    subject:
                        email.subject ||
                        "",

                    sender:
                        email.senderEmail ||
                        email.from ||
                        "",

                    company:
                        email.company ||
                        "",

                    priority:
                        email.priority ||
                        "",

                    category:
                        email.category ||
                        "Uncategorized",

                    status:
                        email.status ||
                        "",

                    isRead:
                        email.isRead
                            ? "Yes"
                            : "No",

                    receivedDateTime:
                        email.receivedDateTime
                            ? new Date(
                                email.receivedDateTime
                            ).toLocaleString()
                            : "",

                });

            }
        );


        /* --------------------------------------------------------------------
           Header Styling
        -------------------------------------------------------------------- */

        [
            summarySheet,
            companySheet,
            emailSheet,
        ].forEach((sheet) => {

            const header =
                sheet.getRow(1);


            header.font = {

                bold: true,

                size: 12,

            };


            header.alignment = {

                vertical: "middle",

                horizontal: "center",

            };


            sheet.views = [

                {
                    state: "frozen",
                    ySplit: 1,
                },

            ];

        });


        res.setHeader(

            "Content-Type",

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        );


        res.setHeader(

            "Content-Disposition",

            `attachment; filename="Analytics_${Date.now()}.xlsx"`

        );


        await workbook.xlsx.write(
            res
        );


        res.end();

    }

    catch (error) {

        return errorResponse(
            res,
            error
        );

    }

};


/* ============================================================================
   PDF EXPORT
   POST /api/analytics/export/pdf
============================================================================ */

const exportPDF = async (
    req,
    res
) => {

    try {

        const exportData =
            await getExportData(
                req.body || {}
            );


        const document =
            new PDFDocument({

                margin: 40,

                size: "A4",

            });


        res.setHeader(

            "Content-Type",

            "application/pdf"

        );


        res.setHeader(

            "Content-Disposition",

            `attachment; filename="Analytics_${Date.now()}.pdf"`

        );


        document.pipe(res);


        /* --------------------------------------------------------------------
           Header
        -------------------------------------------------------------------- */

        document
            .fontSize(20)
            .font("Helvetica-Bold")
            .text(
                "Outlook Analytics Report"
            );


        document
            .moveDown(0.5);


        document
            .fontSize(10)
            .font("Helvetica")
            .text(
                "Microsoft 365 Enterprise Analytics"
            );


        document
            .text(
                `Generated: ${new Date().toLocaleString()}`
            );


        document
            .moveDown(1);


        /* --------------------------------------------------------------------
           Executive Summary
        -------------------------------------------------------------------- */

        document
            .fontSize(15)
            .font("Helvetica-Bold")
            .text(
                "Executive Summary"
            );


        document
            .moveDown(0.5);


        const summary =
            exportData.summary;


        const summaryRows = [

            [
                "Total Emails",
                summary.totalEmails,
            ],

            [
                "High Priority",
                summary.highPriority,
            ],

            [
                "Medium Priority",
                summary.mediumPriority,
            ],

            [
                "Low Priority",
                summary.lowPriority,
            ],

            [
                "Read Emails",
                summary.readEmails,
            ],

            [
                "Unread Emails",
                summary.unreadEmails,
            ],

            [
                "Completed Emails",
                summary.completedEmails,
            ],

            [
                "Response Rate",
                `${summary.responseRate}%`,
            ],

        ];


        summaryRows.forEach(
            ([label, value]) => {

                document
                    .fontSize(10)
                    .font("Helvetica")
                    .text(
                        `${label}: ${value}`
                    );

            }
        );


        /* --------------------------------------------------------------------
           Company Analytics
        -------------------------------------------------------------------- */

        document
            .moveDown(1);


        document
            .fontSize(15)
            .font("Helvetica-Bold")
            .text(
                "Top Performing Companies"
            );


        document
            .moveDown(0.5);


        exportData.companies.forEach(
            (company, index) => {

                document
                    .fontSize(10)
                    .font("Helvetica")
                    .text(

                        `${index + 1}. ` +
                        `${company.company} | ` +
                        `Emails: ${company.totalEmails} | ` +
                        `Replied: ${company.repliedEmails} | ` +
                        `Response Rate: ${company.responseRate}%`

                    );

            }
        );


        /* --------------------------------------------------------------------
           Email Details
        -------------------------------------------------------------------- */

        document
            .addPage();


        document
            .fontSize(15)
            .font("Helvetica-Bold")
            .text(
                "Email Details"
            );


        document
            .moveDown(0.5);


        exportData.emails
            .slice(0, 100)
            .forEach(
                (email, index) => {

                    document
                        .fontSize(9)
                        .font("Helvetica-Bold")
                        .text(
                            `${index + 1}. ${
                                email.subject ||
                                "No Subject"
                            }`
                        );


                    document
                        .fontSize(8)
                        .font("Helvetica")
                        .text(

                            `Company: ${
                                email.company ||
                                "N/A"
                            } | ` +

                            `Priority: ${
                                email.priority ||
                                "N/A"
                            } | ` +

                            `Status: ${
                                email.status ||
                                "N/A"
                            }`

                        );


                    document
                        .moveDown(0.3);

                }
            );


        document.end();

    }

    catch (error) {

        return errorResponse(
            res,
            error
        );

    }

};


/* ============================================================================
   EXPORTS
============================================================================ */

module.exports = {

    exportExcel,

    exportPDF,

};