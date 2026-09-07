/**
 * ============================================================================
 * AIReplyPreview.jsx
 * Part 1/6
 *
 * Enterprise AI Reply Preview
 * ============================================================================
 */

import React, {
  memo,
  useCallback,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  FileText,
  Copy,
  Check,
} from "lucide-react";

/* ============================================================================
   Enterprise Constants
   ============================================================================ */

const DEFAULT_TITLE =
  "AI Reply Preview";

const EMPTY_MESSAGE =
  "No reply generated yet.";

/* ============================================================================
   Component
   ============================================================================ */

const AIReplyPreview = ({
  value = "",
  copied = false,
  className = "",
  title = DEFAULT_TITLE,
  onCopy,
}) => {
  /* ============================================================================
   Part 2/6 — Derived State
   ============================================================================ */

/**
 * Determines whether the preview contains
 * meaningful reply content.
 */
const hasContent =
  typeof value === "string" &&
  value.trim().length > 0;

/**
 * Total number of lines in the reply.
 */
const lineCount = hasContent
  ? value.split("\n").length
  : 0;

/**
 * Total number of words in the reply.
 */
const wordCount = hasContent
  ? value.trim().split(/\s+/).length
  : 0;

/**
 * Total number of characters.
 */
const characterCount =
  typeof value === "string"
    ? value.length
    : 0;

/* ============================================================================
   Part 2/6 — Copy Handler
   ============================================================================ */

const handleCopy = useCallback(
  async () => {
    if (!hasContent) {
      return;
    }

    try {
      if (
        navigator?.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(
          value
        );

        if (
          typeof onCopy === "function"
        ) {
          onCopy(value);
        }

        return;
      }

      /**
       * Fallback for environments where
       * Clipboard API is unavailable.
       */
      const textArea =
        document.createElement("textarea");

      textArea.value = value;

      textArea.setAttribute(
        "readonly",
        ""
      );

      textArea.style.position =
        "fixed";

      textArea.style.opacity = "0";

      document.body.appendChild(
        textArea
      );

      textArea.select();

      const copiedSuccessfully =
        document.execCommand("copy");

      document.body.removeChild(
        textArea
      );

      if (
        copiedSuccessfully &&
        typeof onCopy === "function"
      ) {
        onCopy(value);
      }
    } catch (error) {
      console.error(
        "Failed to copy AI reply:",
        error
      );
    }
  },
  [
    hasContent,
    value,
    onCopy,
  ]
);
/* ============================================================================
   Part 3/6 — Main Container + Header
   ============================================================================ */

  return (
    <div
      className={clsx(
        "flex flex-col overflow-hidden rounded-xl",
        "border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      {/* ==================================================================
          Header
          ================================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-200
          bg-slate-50
          px-5
          py-4
        "
      >
        {/* --------------------------------------------------------------
            Header Information
            -------------------------------------------------------------- */}

        <div className="min-w-0">
          <h3
            className="
              flex
              items-center
              gap-2
              text-base
              font-semibold
              text-slate-900
            "
          >
            <FileText
              size={18}
              className="shrink-0 text-blue-600"
              aria-hidden="true"
            />

            <span className="truncate">
              {title}
            </span>
          </h3>

          <p
            className="
              mt-1
              text-sm
              leading-5
              text-slate-500
            "
          >
            Review the AI-generated reply
            before inserting or sending.
          </p>
        </div>

        {/* --------------------------------------------------------------
            Copy Button
            -------------------------------------------------------------- */}

        <button
          type="button"
          onClick={handleCopy}
          disabled={!hasContent}
          aria-label={
            copied
              ? "Reply copied"
              : "Copy AI reply"
          }
          className={clsx(
            "ml-4 flex shrink-0 items-center gap-2",
            "rounded-lg border px-4 py-2",
            "text-sm font-medium transition-all duration-200",
            "focus:outline-none focus:ring-2",
            "focus:ring-blue-500 focus:ring-offset-1",

            hasContent
              ? [
                  "border-slate-300",
                  "bg-white",
                  "text-slate-700",
                  "hover:border-blue-500",
                  "hover:text-blue-600",
                  "hover:shadow-sm",
                ]
              : [
                  "cursor-not-allowed",
                  "border-slate-200",
                  "bg-slate-100",
                  "text-slate-400",
                ]
          )}
        >
          {copied ? (
            <Check
              size={16}
              aria-hidden="true"
            />
          ) : (
            <Copy
              size={16}
              aria-hidden="true"
            />
          )}

          <span>
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      </div>
      /* ============================================================================
   Part 4/6 — Preview Body
   ============================================================================ */

      {/* ==================================================================
          Preview Body
          ================================================================== */}

      <div
        className="
          min-h-[300px]
          flex-1
          overflow-y-auto
          bg-white
        "
      >
        {hasContent ? (
          /* --------------------------------------------------------------
             Generated Reply
             -------------------------------------------------------------- */

          <div
            className="
              whitespace-pre-wrap
              break-words
              px-6
              py-5
              text-[15px]
              leading-7
              text-slate-700
            "
            role="region"
            aria-label="AI generated reply"
          >
            {value}
          </div>
        ) : (
          /* --------------------------------------------------------------
             Empty Preview State
             -------------------------------------------------------------- */

          <div
            className="
              flex
              min-h-[300px]
              flex-col
              items-center
              justify-center
              px-8
              py-10
              text-center
            "
            role="status"
            aria-live="polite"
          >
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-slate-100
              "
            >
              <FileText
                size={28}
                className="text-slate-300"
                aria-hidden="true"
              />
            </div>

            <h4
              className="
                mt-4
                text-base
                font-semibold
                text-slate-700
              "
            >
              Nothing to Preview
            </h4>

            <p
              className="
                mt-2
                max-w-md
                text-sm
                leading-6
                text-slate-500
              "
            >
              {EMPTY_MESSAGE}
            </p>
          </div>
        )}
      </div>
      /* ============================================================================
   Part 5/6 — Footer Statistics
   ============================================================================ */

      {/* ==================================================================
          Footer
          ================================================================== */}

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          border-t
          border-slate-200
          bg-slate-50
          px-6
          py-3
        "
      >
        {/* --------------------------------------------------------------
            Left Statistics
            -------------------------------------------------------------- */}

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-x-5
            gap-y-2
            text-xs
            text-slate-500
          "
        >
          {/* Words */}

          <span>
            Words
            <strong
              className="
                ml-1
                font-semibold
                text-slate-700
              "
            >
              {wordCount}
            </strong>
          </span>

          {/* Lines */}

          <span>
            Lines
            <strong
              className="
                ml-1
                font-semibold
                text-slate-700
              "
            >
              {lineCount}
            </strong>
          </span>
        </div>

        {/* --------------------------------------------------------------
            Right Statistics
            -------------------------------------------------------------- */}

        <div
          className="
            flex
            items-center
            gap-2
            text-xs
            text-slate-500
          "
        >
          <span>
            Characters
          </span>

          <strong
            className="
              font-semibold
              text-slate-700
            "
          >
            {characterCount}
          </strong>
        </div>
      </div>
      /* ============================================================================
   Part 6/6 — Component Closing + PropTypes + Export
   ============================================================================ */

    </div>
  );
};

/* ============================================================================
   PropTypes
   ============================================================================ */

AIReplyPreview.propTypes = {
  /**
   * AI-generated reply content.
   */
  value: PropTypes.string,

  /**
   * Indicates whether the reply was successfully copied.
   */
  copied: PropTypes.bool,

  /**
   * Additional CSS/Tailwind classes.
   */
  className: PropTypes.string,

  /**
   * Preview heading.
   */
  title: PropTypes.string,

  /**
   * Called after a successful copy operation.
   *
   * Receives the copied reply text.
   */
  onCopy: PropTypes.func,
};

/* ============================================================================
   Default Props
   ============================================================================ */

AIReplyPreview.defaultProps = {
  value: "",
  copied: false,
  className: "",
  title: DEFAULT_TITLE,
  onCopy: undefined,
};

/* ============================================================================
   Display Name
   ============================================================================ */

AIReplyPreview.displayName =
  "AIReplyPreview";

/* ============================================================================
   Memoized Export
   ============================================================================ */

const MemoizedAIReplyPreview = memo(
  AIReplyPreview
);

MemoizedAIReplyPreview.displayName =
  "MemoizedAIReplyPreview";

/* ============================================================================
   Default Export
   ============================================================================ */

export default MemoizedAIReplyPreview;