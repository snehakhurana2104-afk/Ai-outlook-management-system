/******************************************************************************
 * AIReplyEditor.jsx
 * Part 1/6
 *
 * Enterprise AI Reply Editor
 ******************************************************************************/

import React, {
  memo,
  forwardRef,
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Undo2,
  Redo2,
  Type,
  FileText,
} from "lucide-react";

/* ============================================================================
   Enterprise Constants
============================================================================ */

const MAX_HISTORY = 100;
const DEFAULT_MAX_LENGTH = 5000;

const MIN_HEIGHT = 260;
const MAX_HEIGHT = 700;

/* ============================================================================
   AI Reply Editor
============================================================================ */

const AIReplyEditor = forwardRef(
  (
    {
      value = "",
      placeholder = "Start typing your AI reply...",
      disabled = false,
      maxLength = DEFAULT_MAX_LENGTH,
      className = "",
      onChange,
    },
    forwardedRef
  ) => {
        /* ========================================================================
       Refs
    ======================================================================== */

    const localTextareaRef = useRef(null);

    const textareaRef =
      forwardedRef || localTextareaRef;

    /* ========================================================================
       State
    ======================================================================== */

    const [editorValue, setEditorValue] =
      useState(value);

    const [history, setHistory] =
      useState([value]);

    const [historyIndex, setHistoryIndex] =
      useState(0);

    /* ========================================================================
       Derived State
    ======================================================================== */

    const characterCount = useMemo(() => {
      return editorValue.length;
    }, [editorValue]);

    const wordCount = useMemo(() => {
      if (!editorValue.trim()) return 0;

      return editorValue
        .trim()
        .split(/\s+/)
        .length;
    }, [editorValue]);

    const remainingCharacters = useMemo(() => {
      return maxLength - characterCount;
    }, [
      maxLength,
      characterCount,
    ]);

    const progress = useMemo(() => {
      return Math.min(
        (characterCount / maxLength) * 100,
        100
      );
    }, [
      characterCount,
      maxLength,
    ]);

    const canUndo = useMemo(() => {
      return historyIndex > 0;
    }, [historyIndex]);

    const canRedo = useMemo(() => {
      return (
        historyIndex <
        history.length - 1
      );
    }, [
      history,
      historyIndex,
    ]);

    const isLimitReached = useMemo(() => {
      return characterCount >= maxLength;
    }, [
      characterCount,
      maxLength,
    ]);
        /* ========================================================================
       Change Handler
    ======================================================================== */

    const handleEditorChange = useCallback(
      (event) => {
        const nextValue =
          event.target.value;

        setEditorValue(nextValue);

        onChange?.(nextValue);

        setHistory((previousHistory) => {
          const updatedHistory =
            previousHistory.slice(
              0,
              historyIndex + 1
            );

          updatedHistory.push(nextValue);

          if (
            updatedHistory.length >
            MAX_HISTORY
          ) {
            updatedHistory.shift();
          }

          setHistoryIndex(
            updatedHistory.length - 1
          );

          return updatedHistory;
        });
      },
      [
        historyIndex,
        onChange,
      ]
    );

    /* ========================================================================
       Undo
    ======================================================================== */

    const handleUndo = useCallback(() => {
      if (!canUndo) return;

      const previousIndex =
        historyIndex - 1;

      const previousValue =
        history[previousIndex];

      setHistoryIndex(previousIndex);

      setEditorValue(previousValue);

      onChange?.(previousValue);
    }, [
      canUndo,
      history,
      historyIndex,
      onChange,
    ]);

    /* ========================================================================
       Redo
    ======================================================================== */

    const handleRedo = useCallback(() => {
      if (!canRedo) return;

      const nextIndex =
        historyIndex + 1;

      const nextValue =
        history[nextIndex];

      setHistoryIndex(nextIndex);

      setEditorValue(nextValue);

      onChange?.(nextValue);
    }, [
      canRedo,
      history,
      historyIndex,
      onChange,
    ]);
        /* ========================================================================
       Keyboard Shortcuts
    ======================================================================== */

    const handleKeyDown = useCallback(
      (event) => {
        const ctrl =
          event.ctrlKey ||
          event.metaKey;

        if (!ctrl) return;

        switch (
          event.key.toLowerCase()
        ) {
          case "z":
            event.preventDefault();

            if (event.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }

            break;

          case "y":
            event.preventDefault();

            handleRedo();

            break;

          case "a":
            if (textareaRef.current) {
              textareaRef.current.select();
            }

            break;

          default:
            break;
        }
      },
      [
        handleUndo,
        handleRedo,
      ]
    );

    /* ========================================================================
       Auto Resize
    ======================================================================== */

    useEffect(() => {
      const textarea =
        textareaRef.current;

      if (!textarea) return;

      textarea.style.height = "auto";

      const height = Math.min(
        textarea.scrollHeight,
        MAX_HEIGHT
      );

      textarea.style.height =
        `${Math.max(
          height,
          MIN_HEIGHT
        )}px`;
    }, [editorValue]);

    /* ========================================================================
       Sync External Value
    ======================================================================== */

    useEffect(() => {
      if (value === editorValue) {
        return;
      }

      setEditorValue(value);
    }, [
      value,
      editorValue,
    ]);

    /* ========================================================================
       Initial Focus
    ======================================================================== */

    useEffect(() => {
      if (disabled) return;

      textareaRef.current?.focus();
    }, [disabled]);
        /* ========================================================================
       Render
    ======================================================================== */

    return (
      <div
        className={clsx(
          "flex flex-col overflow-hidden rounded-xl",
          "border border-slate-200 bg-white shadow-sm",
          className
        )}
      >

        {/* ================================================================
            Toolbar
        ================================================================ */}

        <div
          className="
            flex items-center justify-between
            border-b border-slate-200
            bg-slate-50
            px-5 py-3
          "
        >

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              aria-label="Undo"
              className={clsx(
                "rounded-lg border p-2",
                "transition-all",

                canUndo
                  ? "border-slate-300 bg-white hover:border-blue-500 hover:text-blue-600"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
              )}
            >
              <Undo2 size={16} />
            </button>

            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              aria-label="Redo"
              className={clsx(
                "rounded-lg border p-2",
                "transition-all",

                canRedo
                  ? "border-slate-300 bg-white hover:border-blue-500 hover:text-blue-600"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
              )}
            >
              <Redo2 size={16} />
            </button>

          </div>

          <div
            className="
              flex items-center gap-6
              text-xs text-slate-500
            "
          >

            <span>
              Words

              <strong className="ml-1 text-slate-700">
                {wordCount}
              </strong>
            </span>

            <span>
              Characters

              <strong className="ml-1 text-slate-700">
                {characterCount}
              </strong>
            </span>

          </div>

        </div>

        {/* ================================================================
            Editor
        ================================================================ */}

        <div
          className={clsx(
            "relative flex-1 overflow-hidden",
            disabled && "bg-slate-50"
          )}
        >

          <textarea
            ref={textareaRef}
            value={editorValue}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            spellCheck
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            onChange={handleEditorChange}
            onKeyDown={handleKeyDown}
            className={clsx(
              "w-full resize-none border-0 bg-transparent",
              "px-6 py-5",
              "text-[15px] leading-7 text-slate-700",
              "outline-none placeholder:text-slate-400",
              disabled &&
                "cursor-not-allowed opacity-60"
            )}
          />

        </div>

        {/* ================================================================
            Footer
        ================================================================ */}

        <div
          className="
            flex items-center justify-between
            border-t border-slate-200
            bg-slate-50
            px-6 py-3
          "
        >

          <div
            className="
              flex items-center gap-5
              text-xs text-slate-500
            "
          >

            <div className="flex items-center gap-2">

              <Type size={14} />

              <span>
                AI Reply Editor
              </span>

            </div>

            <span>
              Auto Resize Enabled
            </span>

          </div>

          <div className="flex items-center gap-6">

            <span
              className={clsx(
                "text-xs font-medium",

                isLimitReached
                  ? "text-red-600"
                  : characterCount >
                    maxLength * 0.8
                  ? "text-amber-600"
                  : "text-slate-600"
              )}
            >
              {characterCount} / {maxLength}
            </span>

            <div
              className="
                h-2 w-32
                overflow-hidden
                rounded-full
                bg-slate-200
              "
            >

              <div
                className={clsx(
                  "h-full rounded-full",
                  "transition-all duration-300",

                  progress < 80
                    ? "bg-green-500"
                    : progress < 100
                    ? "bg-amber-500"
                    : "bg-red-500"
                )}
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>

        </div>

      </div>
    );
  }
);
/* ============================================================================
   PropTypes
============================================================================ */

AIReplyEditor.propTypes = {
  value: PropTypes.string,

  placeholder: PropTypes.string,

  disabled: PropTypes.bool,

  maxLength: PropTypes.number,

  className: PropTypes.string,

  onChange: PropTypes.func,
};

/* ============================================================================
   Default Props
============================================================================ */

AIReplyEditor.defaultProps = {
  value: "",

  placeholder:
    "Start typing your AI reply...",

  disabled: false,

  maxLength: DEFAULT_MAX_LENGTH,

  className: "",

  onChange: undefined,
};

/* ============================================================================
   Display Name
============================================================================ */

AIReplyEditor.displayName =
  "AIReplyEditor";

/* ============================================================================
   Export
============================================================================ */

export default memo(
  AIReplyEditor
);

/******************************************************************************
 * End AIReplyEditor.jsx
 ******************************************************************************/