// ==========================================================
// ExportService.js
// Excel & PDF Export Utility
// ==========================================================

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ==========================================================
   Export JSON Data to Excel
========================================================== */

export const exportToExcel = (
  data = [],
  fileName = "Report"
) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("No data available for Excel export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Report"
    );

    XLSX.writeFile(
      workbook,
      `${fileName}.xlsx`
    );
  } catch (error) {
    console.error("Excel Export Error:", error);
  }
};

/* ==========================================================
   Export JSON Data to PDF
========================================================== */

export const exportToPDF = (
  data = [],
  fileName = "Report"
) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("No data available for PDF export.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(fileName, 14, 18);

    const headers = [Object.keys(data[0])];

    const rows = data.map((item) =>
      Object.values(item)
    );

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 28,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [0, 120, 212],
      },
    });

    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("PDF Export Error:", error);
  }
};

/* ==========================================================
   CSV Export
========================================================== */

export const exportToCSV = (
  data = [],
  fileName = "Report"
) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("No data available for CSV export.");
      return;
    }

    const headers = Object.keys(data[0]);

    const csvRows = [];

    csvRows.push(headers.join(","));

    data.forEach((row) => {
      csvRows.push(
        headers
          .map((header) =>
            JSON.stringify(row[header] ?? "")
          )
          .join(",")
      );
    });

    const blob = new Blob(
      [csvRows.join("\n")],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${fileName}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("CSV Export Error:", error);
  }
};