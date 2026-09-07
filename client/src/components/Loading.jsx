import React from "react";
import "../pages/Reports.css";

const Loading = () => {
  return (
    <div className="reports-loading">

      <div className="reports-loading-wrapper">

        <div className="reports-loader" />

        <h2>
          Loading Executive Analytics...
        </h2>

        <p>
          Synchronizing Microsoft Outlook data from Microsoft Graph API
        </p>

      </div>

    </div>
  );
};

export default Loading;