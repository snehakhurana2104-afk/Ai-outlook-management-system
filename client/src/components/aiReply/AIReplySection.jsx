/**
 * ============================================================================
 * AIReplySection.jsx
 * Part 1/3
 *
 * Enterprise AI Reply Section
 * ============================================================================
 */

import React, {
  memo,
  useCallback,
  useMemo,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

/* ============================================================================
   Components
   ============================================================================ */

import AIReplyContainer from "./AIReplyContainer";

/* ============================================================================
   Constants
   ============================================================================ */

const DEFAULT_TITLE = "AI Reply";

const DEFAULT_DESCRIPTION =
  "Generate, edit, review, and send an AI-powered reply.";

/* ============================================================================
   Component
   ============================================================================ */

const AIReplySection = ({
  email = null,
  className = "",
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  onReplySent,
}) => {
  /* ==========================================================================
     Derived State
     ========================================================================== */

  const hasEmail = useMemo(() => {
    return Boolean(email);
  }, [email]);

  /* ==========================================================================
     Reply Sent Handler
     ========================================================================== */

  const handleReplySent = useCallback(() => {
    onReplySent?.();
  }, [onReplySent]);
  /* ============================================================================
   Part 2/3 — Header + Empty State + AI Reply Container
   ============================================================================ */

/* ============================================================================
   Main Render
   ============================================================================ */

  return (
    <section
      className={clsx(
        "flex w-full min-h-0 flex-col",
        "overflow-hidden rounded-2xl",
        "border border-slate-200 bg-white",
        "shadow-sm",
        className
      )}
      aria-label="AI reply section"
    >
      {/* ==================================================================
          Section Header
          ================================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          border-b
          border-slate-200
          bg-slate-50
          px-6
          py-4
        "
      >
        <div className="min-w-0">
          <h2
            className="
              truncate
              text-base
              font-semibold
              text-slate-900
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-1
              text-sm
              leading-5
              text-slate-500
            "
          >
            {description}
          </p>
        </div>

        <div
          className={clsx(
            "shrink-0 rounded-full px-3 py-1",
            "text-xs font-medium",
            hasEmail
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          )}
        >
          {hasEmail
            ? "Email Selected"
            : "No Email Selected"}
        </div>
      </div>

      {/* ==================================================================
          Content
          ================================================================== */}

      <div
        className="
          min-h-0
          flex-1
          p-4
          sm:p-5
          lg:p-6
        "
      >
        {hasEmail ? (
          <AIReplyContainer
            email={email}
            onReplySent={handleReplySent}
          />
        ) : (
          <div
            className="
              flex
              min-h-[360px]
              items-center
              justify-center
              rounded-xl
              border
              border-dashed
              border-slate-300
              bg-slate-50
              px-6
              py-10
              text-center
            "
          >
            <div className="max-w-md">
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-200
                  text-slate-500
                "
                aria-hidden="true"
              >
                <span className="text-2xl">
                  ✉
                </span>
              </div>

              <h3
                className="
                  mt-4
                  text-base
                  font-semibold
                  text-slate-800
                "
              >
                Select an email to continue
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Choose an email from your inbox
                to generate and manage an
                AI-powered reply.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
  /* ============================================================================
   Part 3/3 — PropTypes + Display Name + Memoized Export
   ============================================================================ */

/* ============================================================================
   PropTypes
   ============================================================================ */

AIReplySection.propTypes = {
  /**
   * Currently selected email.
   */
  email: PropTypes.object,

  /**
   * Additional Tailwind/CSS classes.
   */
  className: PropTypes.string,

  /**
   * Section heading.
   */
  title: PropTypes.string,

  /**
   * Section description.
   */
  description: PropTypes.string,

  /**
   * Called after an AI reply is successfully sent.
   */
  onReplySent: PropTypes.func,
};

/* ============================================================================
   Display Name
   ============================================================================ */

AIReplySection.displayName =
  "AIReplySection";

/* ============================================================================
   Memoized Export
   ============================================================================ */

const MemoizedAIReplySection = memo(
  AIReplySection
);

MemoizedAIReplySection.displayName =
  "MemoizedAIReplySection";

/* ============================================================================
   Default Export
   ============================================================================ */
}
export default MemoizedAIReplySection;

/* ============================================================================
   End AIReplySection.jsx
   ============================================================================ */