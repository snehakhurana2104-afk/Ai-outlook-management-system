/******************************************************************************
 * AIReplyActions.jsx
 * Part 1
 * Imports + Enterprise Constants + Component Skeleton
 ******************************************************************************/

import React, {
  memo,
  forwardRef,
  useMemo,
  useCallback,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Send,
  Save,
  Trash2,
  Loader2,
} from "lucide-react";

/* ==========================================================================
   Enterprise Constants
   ========================================================================== */

const DEFAULT_BUTTON_TEXT = "Send Reply";
const DEFAULT_DRAFT_TEXT = "Save Draft";

const BUTTON_SIZE = "h-11 px-5";

const TRANSITION =
  "transition-all duration-200";

/* ==========================================================================
   AI Reply Actions
   ========================================================================== */

const AIReplyActions = forwardRef(
  (
    {
      canSend = false,
      loading = false,
      isEdited = false,

      onSend,
      onSaveDraft,
      onDiscard,

      className = "",
    },

    ref
  ) => {
        /* ==========================================================
       Derived State
    ========================================================== */

    const disableButtons = useMemo(() => {
      return loading;
    }, [loading]);

    const disableSend = useMemo(() => {
      return loading || !canSend;
    }, [
      loading,
      canSend,
    ]);

    const showDraftButton = useMemo(() => {
      return isEdited;
    }, [isEdited]);

    /* ==========================================================
       Send Button Class
    ========================================================== */

    const sendButtonClass = useMemo(() => {
      return clsx(
        "inline-flex items-center justify-center gap-2",
        BUTTON_SIZE,
        "rounded-lg",
        "font-semibold text-sm",
        TRANSITION,

        disableSend
          ? "cursor-not-allowed bg-slate-300 text-slate-500"
          : "bg-blue-600 text-white hover:bg-blue-700"
      );
    }, [disableSend]);

    /* ==========================================================
       Draft Button Class
    ========================================================== */

    const draftButtonClass = useMemo(() => {
      return clsx(
        "inline-flex items-center justify-center gap-2",
        BUTTON_SIZE,
        "rounded-lg border border-slate-300",
        "bg-white",
        "font-medium text-sm text-slate-700",
        "hover:border-blue-500 hover:text-blue-600",
        TRANSITION,

        (disableButtons || !showDraftButton) &&
          "cursor-not-allowed opacity-50"
      );
    }, [
      disableButtons,
      showDraftButton,
    ]);

    /* ==========================================================
       Discard Button Class
    ========================================================== */

    const discardButtonClass = useMemo(() => {
      return clsx(
        "inline-flex items-center justify-center gap-2",
        BUTTON_SIZE,
        "rounded-lg border border-red-300",
        "bg-white",
        "font-medium text-sm text-red-600",
        "hover:bg-red-50",
        TRANSITION,

        disableButtons &&
          "cursor-not-allowed opacity-50"
      );
    }, [disableButtons]);
        /* ==========================================================
       Handle Send
    ========================================================== */

    const handleSend = useCallback(() => {
      if (loading || !canSend) return;

      onSend?.();
    }, [
      loading,
      canSend,
      onSend,
    ]);

    /* ==========================================================
       Handle Save Draft
    ========================================================== */

    const handleSaveDraft = useCallback(() => {
      if (loading) return;

      onSaveDraft?.();
    }, [
      loading,
      onSaveDraft,
    ]);

    /* ==========================================================
       Handle Discard
    ========================================================== */

    const handleDiscard = useCallback(() => {
      if (loading) return;

      onDiscard?.();
    }, [
      loading,
      onDiscard,
    ]);

    /* ==========================================================
       Labels
    ========================================================== */

    const sendLabel = useMemo(() => {
      if (loading) {
        return "Sending...";
      }

      return DEFAULT_BUTTON_TEXT;
    }, [loading]);

    const draftLabel = useMemo(() => {
      return isEdited
        ? DEFAULT_DRAFT_TEXT
        : "Saved";
    }, [isEdited]);
        /* ==========================================================
       Render
    ========================================================== */

    return (
      <div
        ref={ref}
        className={clsx(
          "flex items-center justify-between",
          "border-t border-slate-200",
          "bg-white",
          "px-6 py-4",
          className
        )}
      >

        {/* ==========================================
            Left Actions
        ========================================== */}

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={handleDiscard}
            disabled={loading}
            className={discardButtonClass}
          >
            <Trash2 size={16} />

            <span>
              Discard
            </span>
          </button>

        </div>

        {/* ==========================================
            Right Actions
        ========================================== */}

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={
              loading ||
              !isEdited
            }
            className={draftButtonClass}
          >
            <Save size={16} />

            <span>
              {draftLabel}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={
              loading ||
              !canSend
            }
            className={sendButtonClass}
          >

            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Send size={16} />
            )}

            <span>
              {sendLabel}
            </span>

          </button>

        </div>

      </div>
    );
  }
);

/* ==========================================================================
   PropTypes
   ========================================================================== */

AIReplyActions.propTypes = {
  canSend: PropTypes.bool,

  loading: PropTypes.bool,

  isEdited: PropTypes.bool,

  onSend: PropTypes.func,

  onSaveDraft: PropTypes.func,

  onDiscard: PropTypes.func,

  className: PropTypes.string,
};

/* ==========================================================================
   Default Props
   ========================================================================== */

AIReplyActions.defaultProps = {
  canSend: false,

  loading: false,

  isEdited: false,

  onSend: undefined,

  onSaveDraft: undefined,

  onDiscard: undefined,

  className: "",
};

/* ==========================================================================
   Display Name
   ========================================================================== */

AIReplyActions.displayName =
  "AIReplyActions";

/* ==========================================================================
   Export
   ========================================================================== */

export default memo(
  AIReplyActions
);

/******************************************************************************
 * End AIReplyActions.jsx
 ******************************************************************************/