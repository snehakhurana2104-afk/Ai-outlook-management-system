/**
 * ============================================================================
 * AIReplyError.jsx
 * Part 1/4
 * Imports + Component Skeleton
 * ============================================================================
 */

import React, {
  memo,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

/* ============================================================================
   Constants
   ============================================================================ */

const DEFAULT_TITLE =
  "AI Reply Generation Failed";

const DEFAULT_MESSAGE =
  "Something went wrong while generating the AI reply.";

/* ============================================================================
   Component
   ============================================================================ */

const AIReplyError = ({
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
  onRetry,
  className = "",
}) => {
    /* ==========================================================================
     Enterprise Error UI
     ========================================================================== */

  return (
    <div
      className={clsx(
        "rounded-xl border border-red-200",
        "bg-red-50 p-8 shadow-sm",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-4">

        {/* ==================================================================
            Error Icon
            ================================================================== */}

        <div
          className="
            flex
            h-14
            w-14
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-red-100
          "
        >
          <AlertTriangle
            size={28}
            className="text-red-600"
            aria-hidden="true"
          />
        </div>

        {/* ==================================================================
            Content
            ================================================================== */}

        <div className="min-w-0 flex-1">

          <h3
            className="
              mb-2
              text-lg
              font-semibold
              text-red-700
            "
          >
            {title}
          </h3>

          <p
            className="
              mb-6
              text-sm
              leading-6
              text-red-600
            "
          >
            {message}
          </p>
                    {/* ================================================================
              Retry Action
              ================================================================ */}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-red-600
                px-5
                py-2.5
                text-sm
                font-medium
                text-white
                transition
                hover:bg-red-700
                focus:outline-none
                focus:ring-2
                focus:ring-red-500
                focus:ring-offset-2
                active:bg-red-800
              "
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
              />

              Retry AI Reply
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
/* ============================================================================
   PropTypes
   ============================================================================ */

AIReplyError.propTypes = {
  title: PropTypes.string,

  message: PropTypes.string,

  onRetry: PropTypes.func,

  className: PropTypes.string,
};

/* ============================================================================
   Default Props
   ============================================================================ */

AIReplyError.defaultProps = {
  title: DEFAULT_TITLE,

  message: DEFAULT_MESSAGE,

  onRetry: undefined,

  className: "",
};

/* ============================================================================
   Display Name
   ============================================================================ */

AIReplyError.displayName =
  "AIReplyError";

/* ============================================================================
   Export
   ============================================================================ */

export default memo(
  AIReplyError
);

/**
 * ============================================================================
 * End AIReplyError.jsx
 * ============================================================================
 */