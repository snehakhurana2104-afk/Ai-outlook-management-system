import React from "react";
import "./EmailSkeleton.css";

function EmailSkeleton({ rows = 8 }) {
  return (
    <div className="email-skeleton">

      {Array.from({ length: rows }).map((_, index) => (

        <div
          className="skeleton-row"
          key={index}
        >

          <div className="skeleton-avatar" />

          <div className="skeleton-content">

            <div className="skeleton-line skeleton-title" />

            <div className="skeleton-line skeleton-text" />

          </div>

          <div className="skeleton-badge" />

          <div className="skeleton-badge" />

          <div className="skeleton-date" />

        </div>

      ))}

    </div>
  );
}

export default EmailSkeleton;