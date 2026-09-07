import React, { memo } from "react";
import "./ReportsComponents.css";

const ReportTable = ({ records = [] }) => {
  if (!records.length) {
    return (
      <div className="table-card">
        <p style={{ padding: 20 }}>No report data available.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Sender</th>
              <th>Subject</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {records.map((row, index) => (
              <tr key={row.messageId || index}>
                <td>
                  {row.receivedDateTime
                    ? new Date(row.receivedDateTime).toLocaleDateString()
                    : "-"}
                </td>

                <td>{row.senderName || row.sender || "-"}</td>

                <td>{row.subject || "-"}</td>

                <td>{row.priority || "-"}</td>

                <td>{row.status || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(ReportTable);