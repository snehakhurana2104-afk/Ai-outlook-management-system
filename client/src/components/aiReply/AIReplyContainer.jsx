/**
 * ============================================================================
 * AIReplyContainer.jsx
 * Part 1/4
 *
 * Enterprise AI Reply Container
 * ============================================================================
 */

import React, {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

/* ============================================================================
   Components
   ============================================================================ */

import AIReplyPanel from "./AIReplyPanel";

/* ============================================================================
   Constants
   ============================================================================ */

const DEFAULT_EMAIL = null;

/* ============================================================================
   Component
   ============================================================================ */

const AIReplyContainer = ({
  email = DEFAULT_EMAIL,
  className = "",
  onReplySent,
}) => {
  /* ==========================================================================
     State
     ========================================================================== */

  const [isOpen, setIsOpen] = useState(true);

  const [selectedEmail, setSelectedEmail] =
    useState(email);

  /* ==========================================================================
     Derived State
     ========================================================================== */

  const hasEmail = useMemo(() => {
    return Boolean(selectedEmail);
  }, [selectedEmail]);

  /* ==========================================================================
     Email Selection
     ========================================================================== */

  const handleEmailChange = useCallback(
    (nextEmail) => {
      setSelectedEmail(
        nextEmail || null
      );
    },
    []
  );

  /* ==========================================================================
     Toggle Panel
     ========================================================================== */

  const handleToggle = useCallback(() => {
    setIsOpen((previousValue) => !previousValue);
  }, []);
     /* ==========================================================================
     Sync External Email
     ========================================================================== */

  React.useEffect(() => {
    setSelectedEmail(
      email || null
    );
  }, [email]);

  /* ==========================================================================
     Reply Sent Handler
     ========================================================================== */

  const handleReplySent = useCallback(() => {
    onReplySent?.();
  }, [onReplySent]);

  /* ==========================================================================
     Empty State
     ========================================================================== */

  const emptyState = useMemo(() => {
    if (hasEmail) {
      return null;
    }

    return (
      <div
        className="
          flex
          min-h-[400px]
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-slate-300
          bg-slate-50
          p-8
          text-center
        "
      >
        <div className="max-w-md">
          <div
            className="
              mx-auto
              mb-4
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-slate-200
              text-slate-500
            "
          >
            <span
              className="text-xl"
              aria-hidden="true"
            >
              ✉
            </span>
          </div>

          <h3
            className="
              text-base
              font-semibold
              text-slate-800
            "
          >
            Select an email
          </h3>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-slate-500
            "
          >
            Select an email to generate,
            edit, preview, and send an AI
            powered reply.
          </p>
        </div>
      </div>
    );
  }, [hasEmail]);

  /* ==========================================================================
     Part 2 Complete
     ========================================================================== */
       /* ==========================================================================
     Main Render
     ========================================================================== */

  return (
    <section
      className={clsx(
        "flex min-h-0 flex-col",
        "w-full",
        className
      )}
      aria-label="AI reply container"
    >
      {/* ==================================================================
          Container Header
          ================================================================== */}

      <div
        className="
          mb-4
          flex
          items-center
          justify-between
          rounded-xl
          border
          border-slate-200
          bg-white
          px-5
          py-3
          shadow-sm
        "
      >
        <div>
          <h2
            className="
              text-base
              font-semibold
              text-slate-900
            "
          >
            AI Reply
          </h2>

          <p
            className="
              mt-0.5
              text-xs
              text-slate-500
            "
          >
            Generate and manage your email
            response.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-controls="ai-reply-panel"
          className="
            rounded-lg
            border
            border-slate-300
            bg-white
            px-3
            py-2
            text-sm
            font-medium
            text-slate-700
            transition
            hover:border-blue-500
            hover:text-blue-600
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500/20
          "
        >
          {isOpen
            ? "Collapse"
            : "Expand"}
        </button>
      </div>

      {/* ==================================================================
          Panel
          ================================================================== */}

      {isOpen && (
        <div
          id="ai-reply-panel"
          className="
            min-h-0
            w-full
          "
        >
          {emptyState}

          {!emptyState && (
            <AIReplyPanel
              email={selectedEmail}
              onReplySent={
                handleReplySent
              }
            />
          )}
        </div>
      )}
    </section>
  );
  /* ============================================================================
   Part 4/4 — PropTypes + Display Name + Memoized Export
   ============================================================================ */

/* ============================================================================
   PropTypes
   ============================================================================ */

AIReplyContainer.propTypes = {
  /**
   * Currently selected email.
   */
  email: PropTypes.object,

  /**
   * Additional Tailwind/CSS classes.
   */
  className: PropTypes.string,

  /**
   * Called after the reply is successfully sent.
   */
  onReplySent: PropTypes.func,
};

/* ============================================================================
   Display Name
   ============================================================================ */

AIReplyContainer.displayName =
  "AIReplyContainer";

/* ============================================================================
   Memoized Export
   ============================================================================ */

const MemoizedAIReplyContainer = memo(
  AIReplyContainer
);

MemoizedAIReplyContainer.displayName =
  "MemoizedAIReplyContainer";

/* ============================================================================
   Default Export
   ============================================================================ */
}
export default MemoizedAIReplyContainer;

/* ============================================================================
   End AIReplyContainer.jsx
   ============================================================================ */