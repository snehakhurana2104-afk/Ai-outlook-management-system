import React, {
  memo,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Sparkles,
  Send,
  Copy,
  RefreshCw,
  Check,
  Loader2,
  Languages,
  Eye,
  EyeOff,
  AlertCircle,
  FileText,
} from "lucide-react";

import ToneSelector from "./ToneSelector";
import AIReplyEditor from "./AIReplyEditor";

import {
  DEFAULT_TONE,
  DEFAULT_LANGUAGE,
  MAX_REPLY_LENGTH,
  MIN_REPLY_LENGTH,
  COPY_TIMEOUT,
  AI_REPLY_CONFIG,
  REPLY_STATUS,
} from "./constants";

/* ========================================================================== */
/*                           Enterprise Constants                             */
/* ========================================================================== */

const STATUS_COLORS = {
  idle: "bg-slate-100 text-slate-700",
  generating: "bg-blue-100 text-blue-700",
  sending: "bg-amber-100 text-amber-700",
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

const PROGRESS_COLORS = {
  normal: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
};

/* ========================================================================== */
/*                           AIReplyBox Component                             */
/* ========================================================================== */

const AIReplyBox = ({
  email = null,
  initialReply = "",
  onInsert,
  onSend,
  className = "",
}) => {
      /* ======================================================================== */
  /*                               State Management                           */
  /* ======================================================================== */

  /* ------------------------- Tone ------------------------- */

  const [selectedTone, setSelectedTone] =
    useState(DEFAULT_TONE);

  /* ------------------------- Reply ------------------------ */

  const [reply, setReply] =
    useState(initialReply);

  const [originalReply, setOriginalReply] =
    useState(initialReply);

  /* ----------------------- Language ----------------------- */

  const [language, setLanguage] =
    useState(DEFAULT_LANGUAGE);

  /* ------------------------- Status ----------------------- */

  const [status, setStatus] =
    useState(REPLY_STATUS.IDLE);

  const [error, setError] =
    useState(null);

  /* -------------------------- UI -------------------------- */

  const [copied, setCopied] =
    useState(false);

  const [showPreview, setShowPreview] =
    useState(false);

  const [isDirty, setIsDirty] =
    useState(false);

  /* ----------------------- References --------------------- */

  const editorRef =
    useRef(null);

  const copyTimeoutRef =
    useRef(null);

  const abortControllerRef =
    useRef(null);

  const mountedRef =
    useRef(false);

  /* -------------------- Future AI Hook -------------------- */

  // const {
  //   generateReply,
  //   translateReply,
  //   rewriteReply,
  // } = useAIReply();
  /* ======================================================================== */
  /*                               State Management                           */
  /* ======================================================================== */

  /* ------------------------- Tone ------------------------- */

  const [selectedTone, setSelectedTone] =
    useState(DEFAULT_TONE);

  /* ------------------------- Reply ------------------------ */

  const [reply, setReply] =
    useState(initialReply);

  const [originalReply, setOriginalReply] =
    useState(initialReply);

  /* ----------------------- Language ----------------------- */

  const [language, setLanguage] =
    useState(DEFAULT_LANGUAGE);

  /* ------------------------- Status ----------------------- */

  const [status, setStatus] =
    useState(REPLY_STATUS.IDLE);

  const [error, setError] =
    useState(null);

  /* -------------------------- UI -------------------------- */

  const [copied, setCopied] =
    useState(false);

  const [showPreview, setShowPreview] =
    useState(false);

  const [isDirty, setIsDirty] =
    useState(false);

  /* ----------------------- References --------------------- */

  const editorRef =
    useRef(null);

  const copyTimeoutRef =
    useRef(null);

  const abortControllerRef =
    useRef(null);

  const mountedRef =
    useRef(false);

  /* -------------------- Future AI Hook -------------------- */

  // const {
  //   generateReply,
  //   translateReply,
  //   rewriteReply,
  // } = useAIReply();
    /* ======================================================================== */
  /*                           Enterprise Handlers                            */
  /* ======================================================================== */

  /* ------------------------ Tone Change ------------------------ */

  const handleToneChange = useCallback((tone) => {
    setSelectedTone(tone);
  }, []);

  /* ------------------------ Reply Change ----------------------- */

  const handleReplyChange = useCallback(
    (value) => {
      setReply(value);

      setIsDirty(
        value !== originalReply
      );

      if (error) {
        setError(null);
      }
    },
    [originalReply, error]
  );

  /* ----------------------- Language Change --------------------- */

  const handleLanguageChange =
    useCallback((value) => {
      setLanguage(value);
    }, []);

  /* --------------------- Generate AI Reply --------------------- */

  const handleGenerate =
    useCallback(async () => {
      if (!canGenerate) return;

      try {
        abortControllerRef.current?.abort();

        abortControllerRef.current =
          new AbortController();

        setStatus(
          REPLY_STATUS.GENERATING
        );

        setError(null);

        /*
        =======================================================
        Future AI Service
        =======================================================

        const result =
          await generateReply({
            email,
            tone: selectedTone,
            language,
            prompt: currentPrompt,
            signal:
              abortControllerRef.current
                .signal,
          });

        setReply(result.reply);
        setOriginalReply(result.reply);

        */

        setStatus(
          REPLY_STATUS.SUCCESS
        );
      } catch (err) {
        if (
          err?.name === "AbortError" ||
          err?.code ===
            "ERR_CANCELED"
        ) {
          return;
        }

        setStatus(
          REPLY_STATUS.ERROR
        );

        setError(
          err?.message ||
            "Unable to generate AI reply."
        );
      }
    }, [
      canGenerate,
      email,
      selectedTone,
      language,
      currentPrompt,
    ]);

  /* ------------------------- Copy ------------------------- */

  const handleCopy =
    useCallback(async () => {
      if (!canCopy) return;

      try {
        await navigator.clipboard.writeText(
          reply
        );

        setCopied(true);

        clearTimeout(
          copyTimeoutRef.current
        );

        copyTimeoutRef.current =
          setTimeout(() => {
            setCopied(false);
          }, COPY_TIMEOUT);
      } catch {
        setError(
          "Unable to copy reply."
        );
      }
    }, [canCopy, reply]);

  /* ------------------------- Insert ------------------------ */

  const handleInsert =
    useCallback(() => {
      if (!canInsert) return;

      onInsert?.(reply);
    }, [
      canInsert,
      onInsert,
      reply,
    ]);

  /* -------------------------- Send ------------------------- */

  const handleSend =
    useCallback(async () => {
      if (!canSend) return;

      try {
        setStatus(
          REPLY_STATUS.SENDING
        );

        await onSend?.({
          reply,
          tone: selectedTone,
          language,
        });

        setStatus(
          REPLY_STATUS.SUCCESS
        );
      } catch (err) {
        setStatus(
          REPLY_STATUS.ERROR
        );

        setError(
          err?.message ||
            "Unable to send reply."
        );
      }
    }, [
      canSend,
      onSend,
      reply,
      selectedTone,
      language,
    ]);

  /* -------------------------- Reset ------------------------ */

  const handleReset =
    useCallback(() => {
      abortControllerRef.current?.abort();

      setReply(originalReply);

      setSelectedTone(
        DEFAULT_TONE
      );

      setLanguage(
        DEFAULT_LANGUAGE
      );

      setStatus(
        REPLY_STATUS.IDLE
      );

      setCopied(false);

      setError(null);

      setShowPreview(false);

      setIsDirty(false);
    }, [originalReply]);
      /* ======================================================================== */
  /*                           Enterprise Effects                             */
  /* ======================================================================== */

  /* ------------------------ Component Mount ------------------------ */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      abortControllerRef.current?.abort();

      clearTimeout(
        copyTimeoutRef.current
      );
    };
  }, []);

  /* -------------------- Sync Initial Reply -------------------- */

  useEffect(() => {
    setReply(initialReply);

    setOriginalReply(initialReply);

    setIsDirty(false);
  }, [initialReply]);

  /* -------------------- Clear Error on Success -------------------- */

  useEffect(() => {
    if (
      status === REPLY_STATUS.SUCCESS
    ) {
      setError(null);
    }
  }, [status]);

  /* -------------------- Auto Focus Editor -------------------- */

  useEffect(() => {
    if (
      editorRef.current &&
      !loading
    ) {
      editorRef.current.focus();
    }
  }, [loading]);

  /* ---------------- Character Limit Protection ---------------- */

  useEffect(() => {
    if (
      reply.length >
      MAX_REPLY_LENGTH
    ) {
      setReply(
        reply.slice(
          0,
          MAX_REPLY_LENGTH
        )
      );
    }
  }, [reply]);

  /* ---------------- ESC Cancels AI Generation ---------------- */

  useEffect(() => {
    const handleEscape = (
      event
    ) => {
      if (event.key !== "Escape") {
        return;
      }

      if (
        status ===
        REPLY_STATUS.GENERATING
      ) {
        abortControllerRef.current?.abort();

        setStatus(
          REPLY_STATUS.IDLE
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [status]);

  /* ---------------- Auto Scroll Preview ---------------- */

  useEffect(() => {
    if (!showPreview) {
      return;
    }

    editorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [showPreview]);

  /* ---------------- Reset Copy Badge ---------------- */

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => {
      setCopied(false);
    }, COPY_TIMEOUT);

    return () => clearTimeout(timer);
  }, [copied]);

  /* ---------------- Clear Dirty After Reset ---------------- */

  useEffect(() => {
    if (reply === originalReply) {
      setIsDirty(false);
    }
  }, [
    reply,
    originalReply,
  ]);
    /* ======================================================================== */
  /*                        Enterprise Toolbar Section                         */
  /* ======================================================================== */

  const toolbarSection = useMemo(() => {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ================================================================
            Header
        ================================================================= */}

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">

          <div>

            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">

              <Sparkles
                size={20}
                className="text-blue-600"
              />

              AI Reply Assistant

            </h2>

            <p className="mt-1 text-sm text-slate-500">

              Generate intelligent Outlook replies using AI.

            </p>

          </div>

          <div className="flex items-center gap-3">

            <span
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-semibold",
                statusColor
              )}
            >
              {status}
            </span>

            {loading && (
              <Loader2
                size={18}
                className="animate-spin text-blue-600"
              />
            )}

          </div>

        </div>

        {/* ================================================================
            Tone Selector
        ================================================================= */}

        <ToneSelector
          value={selectedTone}
          onChange={handleToneChange}
        />

        {/* ================================================================
            Toolbar Buttons
        ================================================================= */}

        <div className="flex flex-wrap items-center justify-between gap-5 border-t border-slate-200 bg-slate-50 px-6 py-5">

          <div className="flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200",

                canGenerate
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-300 text-white"
              )}
            >

              {loading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Sparkles size={17} />
              )}

              Generate AI Reply

            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <RefreshCw size={16} />

              Reset

            </button>

          </div>

          {/* ================================================================
              Character Counter
          ================================================================= */}

          <div className="flex items-center gap-4">

            <div className="text-right">

              <p className="text-xs font-medium text-slate-500">

                Characters

              </p>

              <p className="text-sm font-semibold text-slate-700">

                {replyLength} / {MAX_REPLY_LENGTH}

              </p>

            </div>

            <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">

              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-300",
                  progressColor
                )}
                style={{
                  width: `${Math.min(
                    (replyLength /
                      MAX_REPLY_LENGTH) *
                      100,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

        </div>

      </div>
    );
  }, [
    status,
    statusColor,
    loading,
    selectedTone,
    handleToneChange,
    handleGenerate,
    handleReset,
    canGenerate,
    replyLength,
    progressColor,
  ]);
    /* ======================================================================== */
  /*                         Enterprise Editor Section                         */
  /* ======================================================================== */

  const editorSection = useMemo(() => {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ===============================================================
            Header
        =============================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">

          <div>

            <h3 className="text-lg font-semibold text-slate-900">
              AI Generated Reply
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Review, edit and personalize your AI generated response before
              inserting or sending.
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-2">

            {isDirty && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Modified
              </span>
            )}

            {loading && (
              <span className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">

                <Loader2
                  size={14}
                  className="animate-spin"
                />

                Generating...

              </span>
            )}

            {!loading &&
              isValidReply &&
              replyLength > 0 && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Ready
                </span>
              )}

          </div>

        </div>

        {/* ===============================================================
            Editor
        =============================================================== */}

        <div className="px-6 py-5">

          <AIReplyEditor
            ref={editorRef}
            value={reply}
            onChange={handleReplyChange}
            language={language}
            disabled={loading}
            maxLength={MAX_REPLY_LENGTH}
            placeholder="AI generated reply will appear here..."
          />

        </div>

        {/* ===============================================================
            Footer
        =============================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-5 border-t border-slate-200 bg-slate-50 px-6 py-4">

          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500">

            <span>
              Tone:
              <strong className="ml-1 text-slate-700">
                {activeTone.label}
              </strong>
            </span>

            <span>
              Language:
              <strong className="ml-1 uppercase text-slate-700">
                {language}
              </strong>
            </span>

            <span>
              Characters:
              <strong className="ml-1 text-slate-700">
                {replyLength}
              </strong>
            </span>

            <span>
              Remaining:
              <strong className="ml-1 text-slate-700">
                {remainingCharacters}
              </strong>
            </span>

          </div>

          <button
            type="button"
            onClick={() =>
              setShowPreview((previous) => !previous)
            }
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-blue-500 hover:text-blue-600"
          >

            {showPreview ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}

            {showPreview
              ? "Hide Preview"
              : "Show Preview"}

          </button>

        </div>

      </div>
    );
  }, [
    activeTone,
    reply,
    replyLength,
    remainingCharacters,
    language,
    loading,
    isDirty,
    isValidReply,
    showPreview,
    handleReplyChange,
  ]);
    /* ======================================================================== */
  /*                         Enterprise Preview Section                        */
  /* ======================================================================== */

  const previewSection = useMemo(() => {
    if (!showPreview) {
      return null;
    }

    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ==========================================================
            Preview Header
        ========================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">

          <div>

            <h3 className="text-lg font-semibold text-slate-900">
              Reply Preview
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Review the final reply before inserting or sending.
            </p>

          </div>

          <span
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-semibold",
              isValidReply
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {isValidReply
              ? "Ready"
              : "Invalid Reply"}
          </span>

        </div>

        {/* ==========================================================
            Preview Body
        ========================================================== */}

        <div className="max-h-[450px] overflow-y-auto whitespace-pre-wrap px-6 py-6 text-sm leading-7 text-slate-700">

          {reply ? (
            reply
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">

              <FileText
                size={48}
                className="mb-4 text-slate-300"
              />

              <p className="text-slate-500">
                No AI reply generated yet.
              </p>

            </div>
          )}

        </div>

        {/* ==========================================================
            Preview Footer
        ========================================================== */}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">

          {/* Copy */}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!canCopy}
            className={clsx(
              "flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all",

              canCopy
                ? "border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-600"
                : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
            )}
          >

            {copied ? (
              <Check size={16} />
            ) : (
              <Copy size={16} />
            )}

            {copied ? "Copied" : "Copy"}

          </button>

          {/* Insert */}

          <button
            type="button"
            onClick={handleInsert}
            disabled={!canInsert}
            className={clsx(
              "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",

              canInsert
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "cursor-not-allowed bg-slate-300 text-white"
            )}
          >
            Insert Reply
          </button>

          {/* Send */}

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={clsx(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",

              canSend
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-slate-300 text-white"
            )}
          >

            {status === REPLY_STATUS.SENDING ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Send size={16} />
            )}

            Send

          </button>

        </div>

      </section>
    );
  }, [
    showPreview,
    reply,
    copied,
    canCopy,
    canInsert,
    canSend,
    isValidReply,
    status,
    handleCopy,
    handleInsert,
    handleSend,
  ]);
    /* ======================================================================== */
  /*                          Error State Section                             */
  /* ======================================================================== */

  const errorSection = useMemo(() => {
    if (status !== REPLY_STATUS.ERROR) {
      return null;
    }

    return (
      <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">

        <div className="flex items-start gap-5 p-6">

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">

            <FileText
              size={22}
              className="text-red-600"
            />

          </div>

          <div className="flex-1">

            <h3 className="text-base font-semibold text-red-700">
              AI Reply Generation Failed
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-600">

              {error ||
                "Something went wrong while generating the AI reply. Please try again."}

            </p>

            <div className="mt-5 flex flex-wrap gap-3">

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={clsx(
                  "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",

                  canGenerate
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "cursor-not-allowed bg-red-300 text-white"
                )}
              >

                Try Again

              </button>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-700 transition-all hover:bg-red-50"
              >

                Reset

              </button>

            </div>

          </div>

        </div>

      </section>
    );
  }, [
    status,
    error,
    canGenerate,
    handleGenerate,
    handleReset,
  ]);

  /* ======================================================================== */
  /*                          Empty State Section                             */
  /* ======================================================================== */

  const emptyStateSection = useMemo(() => {
    if (
      status !== REPLY_STATUS.IDLE ||
      loading ||
      replyLength > 0
    ) {
      return null;
    }

    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">

          <Sparkles
            size={56}
            className="mb-5 text-slate-300"
          />

          <h3 className="text-xl font-semibold text-slate-900">
            AI Reply Ready
          </h3>

          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">

            Choose your preferred tone and click

            <span className="mx-1 font-semibold text-slate-700">
              Generate Reply
            </span>

            to create a professional Outlook response powered by AI.

          </p>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={clsx(
              "mt-8 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",

              canGenerate
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-slate-300 text-white"
            )}
          >

            <Sparkles size={18} />

            Generate AI Reply

          </button>

        </div>

      </section>
    );
  }, [
    status,
    loading,
    replyLength,
    canGenerate,
    handleGenerate,
  ]);
    /* ======================================================================== */
  /*                             Final Component                              */
  /* ======================================================================== */

  return (
    <div
      className={clsx(
        "space-y-6",
        className
      )}
    >
      {/* Toolbar */}
      {toolbarSection}

      {/* Editor */}
      {editorSection}

      {/* Preview */}
      {previewSection}

      {/* Error */}
      {errorSection}

      {/* Empty State */}
      {emptyStateSection}
    </div>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

AIReplyBox.propTypes = {
  email: PropTypes.shape({
    id: PropTypes.string,
    subject: PropTypes.string,
    body: PropTypes.string,
    sender: PropTypes.string,
    company: PropTypes.string,
  }),

  initialReply: PropTypes.string,

  onInsert: PropTypes.func,

  onSend: PropTypes.func,

  className: PropTypes.string,
};

/* ==========================================================================
   Default Props
========================================================================== */

AIReplyBox.defaultProps = {
  email: null,
  initialReply: "",
  onInsert: undefined,
  onSend: undefined,
  className: "",
};

/* ==========================================================================
   Display Name
========================================================================== */

AIReplyBox.displayName = "AIReplyBox";

/* ==========================================================================
   Export
========================================================================== */

export default memo(AIReplyBox);