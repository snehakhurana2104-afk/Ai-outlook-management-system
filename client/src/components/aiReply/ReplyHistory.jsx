/**
 * ============================================================================
 * ReplyHistory.jsx
 * Part 1/6
 *
 * Enterprise AI Reply History
 * ============================================================================
 */

import React, {
  memo,
  useCallback,
  useMemo,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  History,
  RotateCcw,
  Clock3,
  Trash2,
} from "lucide-react";

/* ============================================================================
 * Constants
 * ========================================================================== */

const DEFAULT_TONE = "Professional";

const EMPTY_MESSAGE = "No previous AI replies available.";

const MAX_PREVIEW_LENGTH = 500;

/* ============================================================================
 * Component
 * ========================================================================== */

const ReplyHistory = ({
  history = [],
  onRestore,
  onDelete,
  className = "",
  disabled = false,
}) => {
    /* ==========================================================================
     Normalize History
     ========================================================================== */

  const normalizedHistory = useMemo(() => {
    if (!Array.isArray(history)) {
      return [];
    }

    return history.filter(
      (item) =>
        item &&
        typeof item === "object"
    );
  }, [history]);

  /* ==========================================================================
     Sort History — Newest First
     ========================================================================== */

  const sortedHistory = useMemo(() => {
    return [...normalizedHistory].sort(
      (a, b) => {
        const dateA = new Date(
          a.createdAt || 0
        ).getTime();

        const dateB = new Date(
          b.createdAt || 0
        ).getTime();

        const safeA = Number.isNaN(dateA)
          ? 0
          : dateA;

        const safeB = Number.isNaN(dateB)
          ? 0
          : dateB;

        return safeB - safeA;
      }
    );
  }, [normalizedHistory]);

  /* ==========================================================================
     Total Replies
     ========================================================================== */

  const totalReplies = useMemo(() => {
    return sortedHistory.length;
  }, [sortedHistory]);

  /* ==========================================================================
     Date Formatter
     ========================================================================== */

  const formatDate = useCallback((date) => {
    if (!date) {
      return "--";
    }

    const parsedDate =
      date instanceof Date
        ? date
        : new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "--";
    }

    return parsedDate.toLocaleString(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }, []);

  /* ==========================================================================
     Reply Preview Formatter
     ========================================================================== */

  const getReplyPreview = useCallback(
    (reply) => {
      if (
        typeof reply !== "string" ||
        !reply.trim()
      ) {
        return "No reply available";
      }

      const cleanReply =
        reply.trim();

      if (
        cleanReply.length <=
        MAX_PREVIEW_LENGTH
      ) {
        return cleanReply;
      }

      return `${cleanReply.slice(
        0,
        MAX_PREVIEW_LENGTH
      )}…`;
    },
    []
  );

  /* ==========================================================================
     Empty State
     ========================================================================== */

  if (totalReplies === 0) {
    return (
      <section
        className={clsx(
          "border-t border-slate-200",
          "bg-slate-50 px-5 py-5",
          className
        )}
        aria-label="Reply history"
      >
        <div
          className="
            flex
            min-h-[120px]
            flex-col
            items-center
            justify-center
            rounded-xl
            border
            border-dashed
            border-slate-300
            bg-white
            px-6
            py-8
            text-center
          "
        >
          <History
            size={24}
            className="mb-2 text-slate-300"
            aria-hidden="true"
          />

          <p
            className="
              text-sm
              font-medium
              text-slate-600
            "
          >
            No Reply History
          </p>

          <p
            className="
              mt-1
              max-w-sm
              text-xs
              leading-5
              text-slate-500
            "
          >
            {EMPTY_MESSAGE}
          </p>
        </div>
      </section>
    );
  }
     /* ==========================================================================
     Restore Handler
     ========================================================================== */

  const handleRestore = useCallback(
    (item) => {
      if (disabled) return;

      if (
        typeof onRestore !== "function"
      ) {
        return;
      }

      onRestore(item);
    },
    [
      disabled,
      onRestore,
    ]
  );

  /* ==========================================================================
     Delete Handler
     ========================================================================== */

  const handleDelete = useCallback(
    (item) => {
      if (disabled) return;

      if (
        typeof onDelete !== "function"
      ) {
        return;
      }

      onDelete(item);
    },
    [
      disabled,
      onDelete,
    ]
  );

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <section
      className={clsx(
        "border-t border-slate-200",
        "bg-slate-50",
        className
      )}
      aria-label="Reply history"
    >
      {/* ==================================================================
          Header
          ================================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          border-b
          border-slate-200
          px-5
          py-3
          sm:px-6
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-2
          "
        >
          <History
            size={18}
            className="shrink-0 text-blue-600"
            aria-hidden="true"
          />

          <h3
            className="
              truncate
              text-sm
              font-semibold
              text-slate-900
            "
          >
            Reply History
          </h3>
        </div>

        <span
          className="
            shrink-0
            rounded-full
            bg-blue-50
            px-3
            py-1
            text-xs
            font-semibold
            text-blue-700
          "
        >
          {totalReplies}{" "}
          {totalReplies === 1
            ? "Reply"
            : "Replies"}
        </span>
      </div>

      {/* ==================================================================
          History List
          ================================================================== */}

      <div
        className="
          max-h-[360px]
          space-y-3
          overflow-y-auto
          p-4
          sm:p-5
        "
      >
        {sortedHistory.map(
          (item, index) => {
            const historyId =
              item.id ||
              item._id ||
              `reply-history-${index}`;

            const tone =
              item.tone ||
              DEFAULT_TONE;

            const replyPreview =
              getReplyPreview(
                item.reply
              );

            const hasRestore =
              typeof onRestore ===
              "function";

            const hasDelete =
              typeof onDelete ===
              "function";

            return (
              <article
                key={historyId}
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-sm
                  transition-shadow
                  hover:shadow-md
                "
              >
                {/* ======================================================
                    Meta
                    ====================================================== */}

                <div
                  className="
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      gap-2
                    "
                  >
                    <span
                      className="
                        rounded-full
                        bg-indigo-50
                        px-2.5
                        py-1
                        text-xs
                        font-semibold
                        text-indigo-700
                      "
                    >
                      {tone}
                    </span>

                    <span
                      className="
                        flex
                        items-center
                        gap-1.5
                        text-xs
                        text-slate-500
                      "
                    >
                      <Clock3
                        size={13}
                        className="shrink-0"
                        aria-hidden="true"
                      />

                      {formatDate(
                        item.createdAt
                      )}
                    </span>
                  </div>
                </div>
                                {/* ======================================================
                    Reply Preview
                    ====================================================== */}

                <p
                  className="
                    mt-3
                    whitespace-pre-wrap
                    break-words
                    text-sm
                    leading-6
                    text-slate-700
                  "
                  title={
                    typeof item.reply ===
                    "string"
                      ? item.reply
                      : undefined
                  }
                >
                  {replyPreview}
                </p>

                {/* ======================================================
                    Actions
                    ====================================================== */}

                {(hasRestore ||
                  hasDelete) && (
                  <div
                    className="
                      mt-4
                      flex
                      items-center
                      justify-end
                      gap-2
                      border-t
                      border-slate-100
                      pt-3
                    "
                  >
                    {/* Restore */}

                    {hasRestore && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRestore(
                            item
                          )
                        }
                        disabled={
                          disabled
                        }
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-lg
                          border
                          border-slate-300
                          bg-white
                          px-3
                          py-2
                          text-xs
                          font-medium
                          text-slate-700
                          transition
                          hover:border-blue-500
                          hover:text-blue-600
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-500/20
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                        aria-label={`Restore ${tone} reply`}
                      >
                        <RotateCcw
                          size={14}
                          aria-hidden="true"
                        />

                        Restore
                      </button>
                    )}

                    {/* Delete */}

                    {hasDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            item
                          )
                        }
                        disabled={
                          disabled
                        }
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-lg
                          border
                          border-red-200
                          bg-white
                          p-2
                          text-red-600
                          transition
                          hover:bg-red-50
                          hover:border-red-300
                          focus:outline-none
                          focus:ring-2
                          focus:ring-red-500/20
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                        aria-label={`Delete ${tone} reply from history`}
                        title="Delete reply"
                      >
                        <Trash2
                          size={14}
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          }
        )}
      </div>
    </section>
  );
    /* ==========================================================================
     PropTypes
     ========================================================================== */

  ReplyHistory.propTypes = {
    history: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
        ]),

        _id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
        ]),

        reply: PropTypes.string,

        tone: PropTypes.string,

        createdAt: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
          PropTypes.instanceOf(Date),
        ]),
      })
    ),

    onRestore: PropTypes.func,

    onDelete: PropTypes.func,

    className: PropTypes.string,

    disabled: PropTypes.bool,
  };
    /* ==========================================================================
     Default Props
     ========================================================================== */

  ReplyHistory.defaultProps = {
    history: [],
    onRestore: undefined,
    onDelete: undefined,
    className: "",
    disabled: false,
  };

  /* ==========================================================================
     Display Name
     ========================================================================== */

  ReplyHistory.displayName =
    "ReplyHistory";

  /* ==========================================================================
     Export
     ========================================================================== */
}
  export default memo(
    ReplyHistory
  );

  /**
   * ==========================================================================
   * End ReplyHistory.jsx
   * ==========================================================================
   */
