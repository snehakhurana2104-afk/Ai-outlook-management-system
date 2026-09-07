/**
 * ============================================================================
 * AIReplyLoading.jsx
 * Part 1/4
 * Imports + Constants + Component Skeleton
 * ============================================================================
 */

import React, {
  memo,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Loader2,
  Sparkles,
} from "lucide-react";

/* ============================================================================
   Constants
   ============================================================================ */

const DEFAULT_MESSAGE =
  "Generating AI Reply...";

const DEFAULT_SUB_MESSAGE =
  "Please wait while AI prepares your response.";

/* ============================================================================
   Component
   ============================================================================ */

const AIReplyLoading = ({
  message = DEFAULT_MESSAGE,
  subMessage = DEFAULT_SUB_MESSAGE,
  className = "",
}) => {
    /* ==========================================================================
     Loading Container
     ========================================================================== */

  return (
    <div
      className={clsx(
        "flex min-h-[300px] flex-col",
        "items-center justify-center",
        "rounded-xl border border-slate-200",
        "bg-white px-6 py-12 shadow-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* ==================================================================
          Loading Icon
          ================================================================== */}

      <div
        className="
          mb-5
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-full
          bg-blue-50
        "
      >
        <Loader2
          size={32}
          className="animate-spin text-blue-600"
          aria-hidden="true"
        />
      </div>

      {/* ==================================================================
          Heading
          ================================================================== */}

      <div
        className="
          mb-2
          flex
          items-center
          gap-2
        "
      >
        <Sparkles
          size={18}
          className="text-blue-600"
          aria-hidden="true"
        />

        <h3
          className="
            text-lg
            font-semibold
            text-slate-800
          "
        >
          {message}
        </h3>
      </div>

      {/* ==================================================================
          Description
          ================================================================== */}

      <p
        className="
          max-w-md
          text-center
          text-sm
          leading-6
          text-slate-500
        "
      >
        {subMessage}
      </p>
            {/* ==================================================================
          Progress Indicator
          ================================================================== */}

      <div
        className="
          mt-6
          flex
          items-center
          gap-1.5
        "
        aria-hidden="true"
      >
        <span
          className="
            h-1.5
            w-1.5
            animate-pulse
            rounded-full
            bg-blue-500
          "
        />

        <span
          className="
            h-1.5
            w-1.5
            animate-pulse
            rounded-full
            bg-blue-500
            [animation-delay:150ms]
          "
        />

        <span
          className="
            h-1.5
            w-1.5
            animate-pulse
            rounded-full
            bg-blue-500
            [animation-delay:300ms]
          "
        />
      </div>
    </div>
  );
};
  /* ==========================================================================
     PropTypes
     ========================================================================== */

AIReplyLoading.propTypes = {
  message: PropTypes.string,

  subMessage: PropTypes.string,

  className: PropTypes.string,
};

/* ============================================================================
   Default Props
   ============================================================================ */

AIReplyLoading.defaultProps = {
  message: DEFAULT_MESSAGE,

  subMessage: DEFAULT_SUB_MESSAGE,

  className: "",
};

/* ============================================================================
   Display Name
   ============================================================================ */

AIReplyLoading.displayName =
  "AIReplyLoading";

/* ============================================================================
   Export
   ============================================================================ */

export default memo(
  AIReplyLoading
);

/**
 * ============================================================================
 * End AIReplyLoading.jsx
 * ============================================================================
 */