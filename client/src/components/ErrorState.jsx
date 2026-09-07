import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import "../pages/Reports.css";
const ErrorState = ({
  message = "Something went wrong while loading analytics.",
  onRetry,
}) => {
  return (
    <div className="reports-error-state">

      <div className="reports-error-card">

        <div className="reports-error-icon">
          <AlertCircle size={56} />
        </div>

        <h2 className="reports-error-title">
          Unable to Load Analytics
        </h2>

        <p className="reports-error-message">
          {message}
        </p>

        {onRetry && (
          <button
            className="reports-error-button"
            onClick={onRetry}
          >
            <RefreshCw size={18} />
            Retry
          </button>
        )}

      </div>

    </div>
  );
};

export default ErrorState;