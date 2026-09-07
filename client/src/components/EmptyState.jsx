import React from "react";
import { Inbox } from "lucide-react";
import "../pages/Reports.css";

const EmptyState = ({
  title = "No Analytics Available",
  message = "No Outlook analytics data is available for the selected filter. Try changing the filters or synchronize Outlook."
}) => {
  return (
    <div className="reports-empty-state">

      <div className="reports-empty-card">

        <div className="reports-empty-icon">
          <Inbox size={60} />
        </div>

        <h2 className="reports-empty-title">
          {title}
        </h2>

        <p className="reports-empty-message">
          {message}
        </p>

      </div>

    </div>
  );
};

export default EmptyState;