/**
 * ============================================================================
 * AIReplyPanel.jsx
 * Part 1/6
 *
 * Enterprise AI Reply Panel
 * ============================================================================
 */

import React, {
  memo,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

/* ============================================================================
   Services
   ============================================================================ */

import AIReplyAPI from "../../services/aiReplyApi";

/* ============================================================================
   Components
   ============================================================================ */

import AIReplyHeader from "./AIReplyHeader";
import ToneSelector from "./ToneSelector";
import AIReplyToolbar from "./AIReplyToolbar";
import AIReplyEditor from "./AIReplyEditor";
import AIReplyPreview from "./AIReplyPreview";
import AIReplyActions from "./AIReplyActions";
import ReplyHistory from "./ReplyHistory";
import AIReplyLoading from "./AIReplyLoading";
import AIReplyError from "./AIReplyError";

/* ============================================================================
   Constants
   ============================================================================ */

const DEFAULT_TONE = "Professional";

/* ============================================================================
   Component
   ============================================================================ */

const AIReplyPanel = ({
  email = null,
  className = "",
  onReplySent,
}) => {
  /* ============================================================================
   Part 2/6 — State + Derived State
   ============================================================================ */

/* ============================================================================
   State
   ============================================================================ */

  const [reply, setReply] = useState("");

  const [tone, setTone] =
    useState(DEFAULT_TONE);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [generatedAt, setGeneratedAt] =
    useState(null);

  const [isEdited, setIsEdited] =
    useState(false);

  const [isCopied, setIsCopied] =
    useState(false);

/* ============================================================================
   Derived State
   ============================================================================ */

  const canGenerate = useMemo(() => {
    return Boolean(email) && !loading;
  }, [
    email,
    loading,
  ]);

  const canRegenerate = useMemo(() => {
    return (
      Boolean(email) &&
      !loading &&
      reply.trim().length > 0
    );
  }, [
    email,
    loading,
    reply,
  ]);

  const canSend = useMemo(() => {
    return (
      Boolean(email) &&
      reply.trim().length > 0 &&
      !loading
    );
  }, [
    email,
    reply,
    loading,
  ]);

  const characterCount = useMemo(() => {
    return reply.length;
  }, [
    reply,
  ]);

  const wordCount = useMemo(() => {
    if (!reply.trim()) {
      return 0;
    }

    return reply
      .trim()
      .split(/\s+/)
      .length;
  }, [
    reply,
  ]);

  const hasReply = useMemo(() => {
    return reply.trim().length > 0;
  }, [
    reply,
  ]);
  /* ============================================================================
   Part 3/6 — Generate + Regenerate API Handlers
   ============================================================================ */

/* ============================================================================
   Generate Reply
   ============================================================================ */

  const handleGenerate = useCallback(
    async () => {
      if (!email || loading) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setIsCopied(false);

        const result =
          await AIReplyAPI.generateReply({
            emailId: email._id,
            tone,
          });

        const generatedReply =
          result?.reply || "";

        setReply(generatedReply);

        setGeneratedAt(new Date());

        setIsEdited(false);

        if (generatedReply) {
          setHistory((previousHistory) => [
            {
              id: `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

              reply: generatedReply,

              tone,

              createdAt: new Date(),
            },

            ...previousHistory,
          ]);
        }
      } catch (err) {
        console.error(
          "AI reply generation failed:",
          err
        );

        setError(
          err instanceof Error
            ? err
            : new Error(
                "Failed to generate AI reply."
              )
        );
      } finally {
        setLoading(false);
      }
    },
    [
      email,
      loading,
      tone,
    ]
  );

/* ============================================================================
   Regenerate Reply
   ============================================================================ */

  const handleRegenerate =
    useCallback(
      async () => {
        if (
          !email ||
          loading ||
          !reply.trim()
        ) {
          return;
        }

        try {
          setLoading(true);
          setError(null);
          setIsCopied(false);

          const result =
            await AIReplyAPI.regenerateReply({
              emailId: email._id,

              tone,

              previousReply: reply,
            });

          const regeneratedReply =
            result?.reply || "";

          setReply(regeneratedReply);

          setGeneratedAt(new Date());

          setIsEdited(false);

          if (regeneratedReply) {
            setHistory(
              (previousHistory) => [
                {
                  id: `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

                  reply: regeneratedReply,

                  tone,

                  createdAt: new Date(),
                },

                ...previousHistory,
              ]
            );
          }
        } catch (err) {
          console.error(
            "AI reply regeneration failed:",
            err
          );

          setError(
            err instanceof Error
              ? err
              : new Error(
                  "Failed to regenerate AI reply."
                )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        email,
        loading,
        reply,
        tone,
      ]
    );
    /* ============================================================================
   Part 4/6 — Send + Editor + Tone + Copy + History Handlers
   ============================================================================ */

/* ============================================================================
   Send Reply
   ============================================================================ */

  const handleSend = useCallback(
    async () => {
      if (
        !email ||
        !reply.trim() ||
        loading
      ) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        await AIReplyAPI.sendReply({
          emailId: email._id,
          content: reply.trim(),
        });

        setIsEdited(false);

        onReplySent?.();
      } catch (err) {
        console.error(
          "AI reply send failed:",
          err
        );

        setError(
          err instanceof Error
            ? err
            : new Error(
                "Failed to send AI reply."
              )
        );
      } finally {
        setLoading(false);
      }
    },
    [
      email,
      reply,
      loading,
      onReplySent,
    ]
  );

/* ============================================================================
   Reply Change
   ============================================================================ */

  const handleReplyChange =
    useCallback((value) => {
      setReply(value);
      setIsEdited(true);
      setIsCopied(false);
      setError(null);
    }, []);

/* ============================================================================
   Tone Change
   ============================================================================ */

  const handleToneChange =
    useCallback((value) => {
      setTone(
        value || DEFAULT_TONE
      );

      setError(null);
    }, []);

/* ============================================================================
   Copy Reply
   ============================================================================ */

  const handleCopy = useCallback(
    async () => {
      if (!hasReply) {
        return;
      }

      try {
        if (
          !navigator?.clipboard?.writeText
        ) {
          throw new Error(
            "Clipboard API is not available."
          );
        }

        await navigator.clipboard.writeText(
          reply
        );

        setIsCopied(true);
        setError(null);
      } catch (err) {
        console.error(
          "AI reply copy failed:",
          err
        );

        setIsCopied(false);

        setError(
          err instanceof Error
            ? err
            : new Error(
                "Failed to copy AI reply."
              )
        );
      }
    },
    [
      hasReply,
      reply,
    ]
  );

/* ============================================================================
   Restore History
   ============================================================================ */

  const handleRestore =
    useCallback((item) => {
      if (!item) {
        return;
      }

      const restoredReply =
        item.reply || "";

      setReply(restoredReply);

      setTone(
        item.tone || DEFAULT_TONE
      );

      setGeneratedAt(
        item.createdAt
          ? new Date(item.createdAt)
          : new Date()
      );

      setIsEdited(true);
      setIsCopied(false);
      setError(null);
    }, []);

/* ============================================================================
   Delete History Item
   ============================================================================ */

  const handleDeleteHistory =
    useCallback((item) => {
      if (!item?.id) {
        return;
      }

      setHistory(
        (previousHistory) =>
          previousHistory.filter(
            (historyItem) =>
              historyItem.id !== item.id
          )
      );
    }, []);

/* ============================================================================
   Clear Reply
   ============================================================================ */

  const handleClear =
    useCallback(() => {
      if (loading) {
        return;
      }

      setReply("");
      setIsEdited(false);
      setIsCopied(false);
      setError(null);
    }, [loading]);
    /* ============================================================================
   Part 5/6 — Effects + Loading/Error States + Main Render
   ============================================================================ */

/* ============================================================================
   Reset When Email Changes
   ============================================================================ */

  useEffect(() => {
    setReply("");
    setGeneratedAt(null);
    setIsEdited(false);
    setIsCopied(false);
    setError(null);
    setHistory([]);
  }, [email]);

/* ============================================================================
   Reset Copy Status
   ============================================================================ */

  useEffect(() => {
    if (!isCopied) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isCopied]);

/* ============================================================================
   Loading State
   ============================================================================ */

  if (loading) {
    return (
      <div
        className={clsx(
          "flex h-full min-h-[500px] flex-col overflow-hidden",
          "rounded-2xl border border-slate-200 bg-white shadow-sm",
          className
        )}
      >
        <AIReplyLoading />
      </div>
    );
  }

/* ============================================================================
   Error State
   ============================================================================ */

  if (error) {
    return (
      <div
        className={clsx(
          "flex h-full min-h-[500px] flex-col overflow-hidden",
          "rounded-2xl border border-slate-200 bg-white shadow-sm",
          className
        )}
      >
        <AIReplyError
          title="AI Reply Error"
          message={
            error?.message ||
            "Something went wrong while processing the AI reply."
          }
          onRetry={handleGenerate}
        />
      </div>
    );
  }

/* ============================================================================
   Main Render
   ============================================================================ */

  return (
    <div
      className={clsx(
        "flex h-full min-h-0 flex-col overflow-hidden",
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      {/* ==================================================================
          Header
          ================================================================== */}

      <AIReplyHeader
        email={email}
        generatedAt={generatedAt}
      />

      {/* ==================================================================
          Tone Selector
          ================================================================== */}

     <ToneSelector
  value={tone}
  onChange={handleToneChange}
/>
      {/* ==================================================================
          Toolbar
          ================================================================== */}

      <AIReplyToolbar
        canGenerate={canGenerate}
        isGenerating={loading}
        isCopied={isCopied}
        onGenerate={handleGenerate}
        onRegenerate={handleRegenerate}
        onCopy={handleCopy}
        onClear={handleClear}
        onRetry={handleGenerate}
      />

      {/* ==================================================================
          Main Content
          ================================================================== */}

      <div
        className="
          flex
          min-h-0
          flex-1
          flex-col
          gap-6
          overflow-y-auto
          p-6
        "
      >
        {/* --------------------------------------------------------------
            Editor
            -------------------------------------------------------------- */}

        <section
          className="flex min-h-[320px] flex-col"
          aria-label="AI reply editor"
        >
          <AIReplyEditor
            value={reply}
            onChange={handleReplyChange}
            disabled={loading}
          />
        </section>

        {/* --------------------------------------------------------------
            Preview
            -------------------------------------------------------------- */}

        <section
          className="overflow-hidden rounded-xl border border-slate-200"
          aria-label="AI reply preview"
        >
          <AIReplyPreview
            value={reply}
            copied={isCopied}
            onCopy={handleCopy}
          />
        </section>

        {/* --------------------------------------------------------------
            Reply History
            -------------------------------------------------------------- */}

        {history.length > 0 && (
          <section
            className="overflow-hidden rounded-xl border border-slate-200"
            aria-label="Reply history"
          >
            <ReplyHistory
  history={history}
  onRestore={handleRestore}
  onDelete={handleDeleteHistory}
/>
          </section>
        )}
      </div>

      {/* ==================================================================
          Actions
          ================================================================== */}

      <AIReplyActions
        canSend={canSend}
        isEdited={isEdited}
        loading={loading}
        onSend={handleSend}
        onDiscard={handleClear}
      />
    </div>
  );
  /* ============================================================================
   Part 6/6 — PropTypes + Display Name + Memoized Export
   ============================================================================ */

/* ============================================================================
   PropTypes
   ============================================================================ */

AIReplyPanel.propTypes = {
  /**
   * Currently selected email.
   */
  email: PropTypes.object,

  /**
   * Additional Tailwind/CSS classes.
   */
  className: PropTypes.string,

  /**
   * Called after the reply has been successfully sent.
   */
  onReplySent: PropTypes.func,
};

/* ============================================================================
   Display Name
   ============================================================================ */

AIReplyPanel.displayName =
  "AIReplyPanel";

/* ============================================================================
   Memoized Export
   ============================================================================ */

const MemoizedAIReplyPanel = memo(
  AIReplyPanel
);

MemoizedAIReplyPanel.displayName =
  "MemoizedAIReplyPanel";

/* ============================================================================
   Default Export
   ============================================================================ */
}
export default MemoizedAIReplyPanel;

/* ============================================================================
   End AIReplyPanel.jsx
   ============================================================================ */