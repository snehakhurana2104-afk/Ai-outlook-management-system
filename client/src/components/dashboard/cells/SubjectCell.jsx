/**************************************************************************
 * SubjectCell.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  Mail,
  Sparkles,
  Paperclip,
} from "lucide-react";

const SubjectCell = memo(
  ({
    subject,
    preview,
    hasAttachment,
    isUnread,
    aiSummaryAvailable,
  }) => {

    return (

      <div className="min-w-0">

        {/* Subject */}

        <div className="flex items-center gap-2">

          {isUnread && (
            <span
              className="
                h-2
                w-2
                rounded-full
                bg-blue-500
                flex-shrink-0
              "
            />
          )}

          <Mail
            size={15}
            className="
              text-slate-400
              flex-shrink-0
            "
          />

          <p
            className={`
              truncate
              text-sm
              ${
                isUnread
                  ? "font-semibold text-slate-900"
                  : "font-medium text-slate-700"
              }
            `}
          >
            {subject || "No Subject"}
          </p>

        </div>

        {/* Preview */}

        <div
          className="
            mt-1
            flex
            items-center
            gap-2
            min-w-0
          "
        >

          <p
            className="
              truncate
              text-xs
              text-slate-500
              flex-1
            "
          >
            {preview || "No preview available"}
          </p>

          {/* Attachment */}

          {hasAttachment && (

            <Paperclip
              size={14}
              className="
                text-slate-400
                flex-shrink-0
              "
            />

          )}

          {/* AI Summary */}

          {aiSummaryAvailable && (

            <Sparkles
              size={14}
              className="
                text-violet-500
                flex-shrink-0
              "
            />

          )}

        </div>

      </div>

    );

  }
);

SubjectCell.displayName = "SubjectCell";

SubjectCell.propTypes = {

  subject: PropTypes.string,

  preview: PropTypes.string,

  hasAttachment: PropTypes.bool,

  isUnread: PropTypes.bool,

  aiSummaryAvailable: PropTypes.bool,

};

SubjectCell.defaultProps = {

  subject: "",

  preview: "",

  hasAttachment: false,

  isUnread: false,

  aiSummaryAvailable: false,

};

export default SubjectCell;