/******************************************************************************
 * AIReplyToolbar.jsx
 * Part 1/6
 *
 * Enterprise AI Reply Toolbar
 ******************************************************************************/

import React, {
  memo,
  useCallback,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Wand2,
  RefreshCcw,
  Copy,
  Trash2,
  RotateCcw,
} from "lucide-react";

/* ============================================================================
   Component
============================================================================ */

const AIReplyToolbar = ({
  canGenerate = true,
  isGenerating = false,
  isCopied = false,

  onGenerate,
  onRegenerate,
  onCopy,
  onClear,
  onRetry,

  className = "",
}) => {
    /* ==========================================================================
     Derived State
  ========================================================================== */

  /**
   * Disable the main Generate action when:
   * - generation is already running, or
   * - generation is not currently allowed.
   */
  const disableGenerate =
    !canGenerate || isGenerating;

  /**
   * Secondary actions remain disabled while
   * an AI generation request is running.
   */
  const disableActions =
    isGenerating;

  /* ==========================================================================
     Handler: Generate
  ========================================================================== */

  const handleGenerate = useCallback(() => {
    if (disableGenerate) {
      return;
    }

    if (typeof onGenerate === "function") {
      onGenerate();
    }
  }, [
    disableGenerate,
    onGenerate,
  ]);

  /* ==========================================================================
     Handler: Regenerate
  ========================================================================== */

  const handleRegenerate = useCallback(() => {
    if (disableActions) {
      return;
    }

    if (typeof onRegenerate === "function") {
      onRegenerate();
    }
  }, [
    disableActions,
    onRegenerate,
  ]);

  /* ==========================================================================
     Handler: Copy
  ========================================================================== */

  const handleCopy = useCallback(() => {
    if (disableActions) {
      return;
    }

    if (typeof onCopy === "function") {
      onCopy();
    }
  }, [
    disableActions,
    onCopy,
  ]);

  /* ==========================================================================
     Handler: Clear
  ========================================================================== */

  const handleClear = useCallback(() => {
    if (disableActions) {
      return;
    }

    if (typeof onClear === "function") {
      onClear();
    }
  }, [
    disableActions,
    onClear,
  ]);

  /* ==========================================================================
     Handler: Retry
  ========================================================================== */

  const handleRetry = useCallback(() => {
    if (disableActions) {
      return;
    }

    if (typeof onRetry === "function") {
      onRetry();
    }
  }, [
    disableActions,
    onRetry,
  ]);
    /* ==========================================================================
     Render — Left Actions
  ========================================================================== */

  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4",
        "border-b border-slate-200",
        "bg-white px-6 py-4",
        className
      )}
    >
      {/* ==========================================================
          Left Actions
      ========================================================== */}

      <div className="flex items-center gap-2">

        {/* Generate */}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={disableGenerate}
          aria-label={
            isGenerating
              ? "Generating AI reply"
              : "Generate AI reply"
          }
          className={clsx(
            "flex items-center gap-2",
            "rounded-lg px-4 py-2",
            "text-sm font-medium",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2",
            "focus:ring-blue-500 focus:ring-offset-2",

            disableGenerate
              ? [
                  "cursor-not-allowed",
                  "bg-slate-200",
                  "text-slate-500",
                ]
              : [
                  "bg-blue-600",
                  "text-white",
                  "hover:bg-blue-700",
                  "active:bg-blue-800",
                ]
          )}
        >
          <Wand2
            size={16}
            aria-hidden="true"
          />

          <span>
            {isGenerating
              ? "Generating..."
              : "Generate"}
          </span>
        </button>

        {/* Regenerate */}

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={disableActions}
          aria-label="Regenerate AI reply"
          className={clsx(
            "flex items-center gap-2",
            "rounded-lg border",
            "px-4 py-2",
            "text-sm font-medium",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2",
            "focus:ring-blue-500 focus:ring-offset-2",

            disableActions
              ? [
                  "cursor-not-allowed",
                  "border-slate-200",
                  "bg-slate-50",
                  "text-slate-400",
                ]
              : [
                  "border-slate-300",
                  "bg-white",
                  "text-slate-700",
                  "hover:border-blue-500",
                  "hover:text-blue-600",
                  "active:bg-slate-50",
                ]
          )}
        >
          <RefreshCcw
            size={16}
            aria-hidden="true"
          />

          <span>
            Regenerate
          </span>
        </button>

      </div>
            {/* ==========================================================
          Right Actions
      ========================================================== */}

      <div className="flex items-center gap-2">

        {/* Copy */}

        <button
          type="button"
          onClick={handleCopy}
          disabled={disableActions}
          aria-label={
            isCopied
              ? "Reply copied"
              : "Copy AI reply"
          }
          className={clsx(
            "flex items-center gap-2",
            "rounded-lg border",
            "px-3 py-2",
            "text-sm font-medium",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2",
            "focus:ring-blue-500 focus:ring-offset-2",

            disableActions
              ? [
                  "cursor-not-allowed",
                  "border-slate-200",
                  "bg-slate-50",
                  "text-slate-400",
                ]
              : [
                  "border-slate-300",
                  "bg-white",
                  "text-slate-700",
                  "hover:border-blue-500",
                  "hover:text-blue-600",
                  "active:bg-slate-50",
                ]
          )}
        >
          <Copy
            size={15}
            aria-hidden="true"
          />

          <span>
            {isCopied ? "Copied" : "Copy"}
          </span>
        </button>

        {/* Clear */}

        <button
          type="button"
          onClick={handleClear}
          disabled={disableActions}
          aria-label="Clear AI reply"
          className={clsx(
            "flex items-center gap-2",
            "rounded-lg border",
            "px-3 py-2",
            "text-sm font-medium",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2",
            "focus:ring-red-500 focus:ring-offset-2",

            disableActions
              ? [
                  "cursor-not-allowed",
                  "border-slate-200",
                  "bg-slate-50",
                  "text-slate-400",
                ]
              : [
                  "border-red-300",
                  "bg-white",
                  "text-red-600",
                  "hover:bg-red-50",
                  "hover:border-red-400",
                  "active:bg-red-100",
                ]
          )}
        >
          <Trash2
            size={15}
            aria-hidden="true"
          />

          <span>
            Clear
          </span>
        </button>

        {/* Retry */}

        <button
          type="button"
          onClick={handleRetry}
          disabled={disableActions}
          aria-label="Retry AI reply"
          className={clsx(
            "flex items-center gap-2",
            "rounded-lg border",
            "px-3 py-2",
            "text-sm font-medium",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2",
            "focus:ring-blue-500 focus:ring-offset-2",

            disableActions
              ? [
                  "cursor-not-allowed",
                  "border-slate-200",
                  "bg-slate-50",
                  "text-slate-400",
                ]
              : [
                  "border-slate-300",
                  "bg-white",
                  "text-slate-700",
                  "hover:border-blue-500",
                  "hover:text-blue-600",
                  "active:bg-slate-50",
                ]
          )}
        >
          <RotateCcw
            size={15}
            aria-hidden="true"
          />

          <span>
            Retry
          </span>
        </button>

      </div>
          </div>
  );
};

/* ============================================================================
   PropTypes
============================================================================ */

AIReplyToolbar.propTypes = {
  /**
   * Controls whether a new AI reply can be generated.
   */
  canGenerate: PropTypes.bool,

  /**
   * Indicates that an AI reply is currently being generated.
   */
  isGenerating: PropTypes.bool,

  /**
   * Controls the Copy button label/state.
   */
  isCopied: PropTypes.bool,

  /**
   * Generate a new AI reply.
   */
  onGenerate: PropTypes.func,

  /**
   * Regenerate the current AI reply.
   */
  onRegenerate: PropTypes.func,

  /**
   * Copy the current AI reply.
   */
  onCopy: PropTypes.func,

  /**
   * Clear the current AI reply.
   */
  onClear: PropTypes.func,

  /**
   * Retry the previous AI reply operation.
   */
  onRetry: PropTypes.func,

  /**
   * Additional Tailwind/CSS classes.
   */
  className: PropTypes.string,
};
/* ============================================================================
   React Configuration
============================================================================ */

AIReplyToolbar.displayName =
  "AIReplyToolbar";

/* ============================================================================
   Memoized Export
============================================================================ */

const MemoizedAIReplyToolbar = memo(
  AIReplyToolbar
);

MemoizedAIReplyToolbar.displayName =
  "MemoizedAIReplyToolbar";

/* ============================================================================
   Default Export
============================================================================ */

export default MemoizedAIReplyToolbar;

/******************************************************************************
 * End AIReplyToolbar.jsx
 ******************************************************************************/