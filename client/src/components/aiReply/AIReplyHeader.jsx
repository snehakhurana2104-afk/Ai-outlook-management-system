/**
 * ============================================================================
 * AIReplyHeader.jsx
 * Part 1/4
 *
 * Enterprise AI Reply Header
 * ============================================================================
 */

import React, {
  memo,
  useMemo,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Sparkles,
  Mail,
  Building2,
  Clock,
} from "lucide-react";

/* ============================================================================
   Constants
   ============================================================================ */

const DEFAULT_SENDER =
  "Unknown Sender";

const DEFAULT_SUBJECT =
  "No Subject";

const DEFAULT_COMPANY =
  "Unknown Company";

const DEFAULT_PRIORITY =
  "Normal";

const DEFAULT_STATUS =
  "Pending";

/* ============================================================================
   Component
   ============================================================================ */

const AIReplyHeader = ({
  email = null,
  generatedAt = null,
  className = "",
}) => {
  /* ==========================================================================
     Normalized Email Data
     ========================================================================== */

  const emailData = useMemo(() => {
    return {
      sender:
        email?.sender ||
        email?.senderName ||
        DEFAULT_SENDER,

      senderEmail:
        email?.senderEmail ||
        email?.email ||
        email?.from ||
        "",

      subject:
        email?.subject ||
        DEFAULT_SUBJECT,

      company:
        email?.company ||
        email?.companyName ||
        DEFAULT_COMPANY,

      priority:
        email?.priority ||
        DEFAULT_PRIORITY,

      status:
        email?.status ||
        DEFAULT_STATUS,
    };
  }, [email]);

  /* ==========================================================================
     Generated Time
     ========================================================================== */

  const generatedTime = useMemo(() => {
    if (!generatedAt) {
      return "--";
    }

    const date =
      generatedAt instanceof Date
        ? generatedAt
        : new Date(generatedAt);

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [generatedAt]);
    /* ==========================================================================
     Priority Configuration
     ========================================================================== */

  const priorityClassName = useMemo(() => {
    switch (emailData.priority) {
      case "High":
        return "bg-red-100 text-red-700";

      case "Medium":
        return "bg-amber-100 text-amber-700";

      case "Low":
        return "bg-emerald-100 text-emerald-700";

      case "Normal":
      default:
        return "bg-slate-100 text-slate-700";
    }
  }, [emailData.priority]);

  /* ==========================================================================
     Status Configuration
     ========================================================================== */

  const statusClassName = useMemo(() => {
    switch (emailData.status) {
      case "Replied":
        return "bg-emerald-100 text-emerald-700";

      case "Draft":
        return "bg-blue-100 text-blue-700";

      case "Pending":
        return "bg-amber-100 text-amber-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }, [emailData.status]);

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <header
      className={clsx(
        "flex flex-col gap-4",
        "border-b border-slate-200",
        "bg-white px-5 py-4",
        "sm:px-6 sm:py-5",
        "lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      {/* ==================================================================
          Left Section
          ================================================================== */}

      <div
        className="
          flex
          min-w-0
          items-start
          gap-3
          sm:gap-4
        "
      >
        {/* AI Icon */}

        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-gradient-to-br
            from-blue-600
            to-indigo-600
            text-white
            shadow-sm
            sm:h-12
            sm:w-12
          "
          aria-hidden="true"
        >
          <Sparkles
            size={21}
            strokeWidth={2}
          />
        </div>

        {/* Email Information */}

        <div className="min-w-0 flex-1">
          <h2
            className="
              flex
              items-center
              gap-2
              text-base
              font-semibold
              text-slate-900
              sm:text-lg
            "
          >
            AI Reply Assistant
          </h2>

          {/* Subject */}

          <p
            className="
              mt-1
              truncate
              text-sm
              font-medium
              text-slate-700
              sm:text-[15px]
            "
            title={emailData.subject}
          >
            {emailData.subject}
          </p>

          {/* Sender + Company */}

          <div
            className="
              mt-2
              flex
              flex-wrap
              items-center
              gap-x-4
              gap-y-2
              text-xs
              text-slate-500
              sm:text-sm
            "
          >
            {/* Sender */}

            <span
              className="
                flex
                min-w-0
                max-w-full
                items-center
                gap-1.5
              "
            >
              <Mail
                size={14}
                className="shrink-0 text-slate-400"
              />

              <strong
                className="
                  truncate
                  font-medium
                  text-slate-700
                "
              >
                {emailData.sender}
              </strong>

              {emailData.senderEmail && (
                <span
                  className="
                    hidden
                    truncate
                    max-w-[260px]
                    text-slate-500
                    md:inline
                  "
                  title={emailData.senderEmail}
                >
                  ({emailData.senderEmail})
                </span>
              )}
            </span>

            {/* Company */}

            <span
              className="
                flex
                min-w-0
                items-center
                gap-1.5
              "
            >
              <Building2
                size={14}
                className="shrink-0 text-slate-400"
              />

              <span
                className="
                  truncate
                  max-w-[220px]
                "
                title={emailData.company}
              >
                {emailData.company}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================
          Right Section
          ================================================================== */}

      <div
        className="
          flex
          shrink-0
          flex-col
          items-start
          gap-2
          sm:items-end
          sm:gap-3
        "
      >
        {/* Priority + Status */}

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-2
          "
        >
          <span
            className={clsx(
              "rounded-full px-3 py-1",
              "text-xs font-semibold",
              priorityClassName
            )}
          >
            {emailData.priority}
          </span>

          <span
            className={clsx(
              "rounded-full px-3 py-1",
              "text-xs font-semibold",
              statusClassName
            )}
          >
            {emailData.status}
          </span>
        </div>

        {/* Generated Information */}

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-3
            text-xs
            text-slate-500
          "
        >
          <span
            className="
              flex
              items-center
              gap-1.5
            "
          >
            <Clock
              size={13}
              className="text-slate-400"
            />

            <span>Generated</span>

            <strong
              className="
                font-medium
                text-slate-700
              "
            >
              {generatedTime}
            </strong>
          </span>

          <span
            className="
              rounded-md
              bg-indigo-50
              px-2
              py-1
              font-medium
              text-indigo-700
            "
          >
            AI v1.0
          </span>
        </div>
      </div>
    </header>
  );
  };

/* ============================================================================
   PropTypes
   ============================================================================ */

AIReplyHeader.propTypes = {
  email: PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    _id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    sender: PropTypes.string,

    senderName: PropTypes.string,

    senderEmail: PropTypes.string,

    email: PropTypes.string,

    from: PropTypes.string,

    subject: PropTypes.string,

    company: PropTypes.string,

    companyName: PropTypes.string,

    priority: PropTypes.oneOf([
      "High",
      "Medium",
      "Low",
      "Normal",
    ]),

    status: PropTypes.oneOf([
      "Pending",
      "Replied",
      "Draft",
    ]),
  }),

  generatedAt: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.number,
  ]),

  className: PropTypes.string,
};
/* ============================================================================
   Display Name
   ============================================================================ */

AIReplyHeader.displayName =
  "AIReplyHeader";

/* ============================================================================
   Memoized Export
   ============================================================================ */

const MemoizedAIReplyHeader = memo(
  AIReplyHeader
);

MemoizedAIReplyHeader.displayName =
  "MemoizedAIReplyHeader";

/* ============================================================================
   Default Export
   ============================================================================ */

export default MemoizedAIReplyHeader;

/* ============================================================================
   End AIReplyHeader.jsx
   ============================================================================ */