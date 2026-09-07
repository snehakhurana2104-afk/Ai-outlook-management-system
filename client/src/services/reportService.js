import axios from "axios";

const API = "http://localhost:5000/api/reports";

// =======================================
// Download PDF
// =======================================

export const downloadPDF = async (fromDate, toDate) => {
  let fd = fromDate;
  let td = toDate;
  if (!fd || !td) {
    const now = new Date();
    fd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    td = now.toISOString().slice(0, 10);
  }

  window.open(`${API}/pdf?fromDate=${fd}&toDate=${td}`, "_blank");
};

// =======================================
// Download Excel
// =======================================

export const downloadExcel = async (fromDate, toDate) => {
  let fd = fromDate;
  let td = toDate;
  if (!fd || !td) {
    const now = new Date();
    fd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    td = now.toISOString().slice(0, 10);
  }
  window.open(`${API}/excel?fromDate=${fd}&toDate=${td}`, "_blank");
};

// =======================================
// Download CSV
// =======================================

export const downloadCSV = async (fromDate, toDate) => {
  let fd = fromDate;
  let td = toDate;
  if (!fd || !td) {
    const now = new Date();
    fd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    td = now.toISOString().slice(0, 10);
  }

  window.open(`${API}/csv?fromDate=${fd}&toDate=${td}`, "_blank");
};

// =======================================
// Get Report Statistics
// =======================================

export const getReportStats = async () => {
  const response = await axios.get(
    "http://localhost:5000/api/reports/stats"
  );

  return response.data;
};