// ===========================================================
// ExportActions.jsx
// Enterprise Report Export Component
// ===========================================================

import React, { memo } from "react";
import {
  FileSpreadsheet,
  FileText,
  FileDown,
} from "lucide-react";

import "./ReportsComponents.css";

const ExportActions = ({
  onExport,
  disabled = false,
}) => {
  const exports = [
    {
      id: "excel",
      title: "Export Excel",
      icon: <FileSpreadsheet size={18} />,
    },
    {
      id: "pdf",
      title: "Export PDF",
      icon: <FileText size={18} />,
    },
    {
      id: "csv",
      title: "Export CSV",
      icon: <FileDown size={18} />,
    },
  ];

  return (
    <div className="export-buttons">
      {exports.map((item) => (
        <button
          key={item.id}
          type="button"
          className="export-btn"
          disabled={disabled}
          onClick={() => onExport?.(item.id)}
        >
          {item.icon}

          <span>{item.title}</span>
        </button>
      ))}
    </div>
  );
};

export default memo(ExportActions);