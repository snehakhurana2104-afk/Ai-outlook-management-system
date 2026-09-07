/**
 * ============================================================================
 * ToneSelector.jsx
 * Part 1/4
 *
 * Enterprise AI Reply Tone Selector
 * ============================================================================
 */

import React, {
  memo,
  useCallback,
  useMemo,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import ToneButton from "./ToneButton";
import { TONES } from "./constants";

/* ============================================================================
   Constants
   ============================================================================ */

const DEFAULT_TONE = "professional";

/* ============================================================================
   Component
   ============================================================================ */

const ToneSelector = ({
  selectedTone,
  value,

  onToneChange,
  onChange,

  disabled = false,
  loading = false,

  className = "",
}) => {
  /* ==========================================================================
     Normalized Selected Tone
     ========================================================================== */

  const currentToneId = useMemo(() => {
    return (
      selectedTone ||
      value ||
      DEFAULT_TONE
    );
  }, [
    selectedTone,
    value,
  ]);

  /* ==========================================================================
     Tone Collection Safety
     ========================================================================== */

  const tones = useMemo(() => {
    return Array.isArray(TONES)
      ? TONES
      : [];
  }, []);

  /* ==========================================================================
     Active Tone Index
     ========================================================================== */

  const activeIndex = useMemo(() => {
    const index = tones.findIndex(
      (tone) =>
        tone?.id === currentToneId
    );

    return index >= 0 ? index : 0;
  }, [
    tones,
    currentToneId,
  ]);

  /* ==========================================================================
     Total Tones
     ========================================================================== */

  const totalTones = tones.length;

  /* ==========================================================================
     Active Tone
     ========================================================================== */

  const activeTone = useMemo(() => {
    return (
      tones[activeIndex] || {
        id: DEFAULT_TONE,
        label: "Professional",
      }
    );
  }, [
    tones,
    activeIndex,
  ]);

  /* ==========================================================================
     Interaction State
     ========================================================================== */

  const canNavigate = useMemo(() => {
    return (
      !disabled &&
      !loading &&
      totalTones > 1
    );
  }, [
    disabled,
    loading,
    totalTones,
  ]);
    /* ==========================================================================
     Tone Change Dispatcher
     ========================================================================== */

  const emitToneChange = useCallback(
    (toneId) => {
      if (!toneId) return;

      if (onToneChange) {
        onToneChange(toneId);
        return;
      }

      onChange?.(toneId);
    },
    [
      onToneChange,
      onChange,
    ]
  );

  /* ==========================================================================
     Tone Selection
     ========================================================================== */

  const handleToneSelect = useCallback(
    (toneId) => {
      if (!canNavigate) return;

      if (!toneId) return;

      if (toneId === currentToneId) {
        return;
      }

      emitToneChange(toneId);
    },
    [
      canNavigate,
      currentToneId,
      emitToneChange,
    ]
  );

  /* ==========================================================================
     Next Tone
     ========================================================================== */

  const handleNext = useCallback(() => {
    if (!canNavigate) return;

    if (totalTones === 0) return;

    const nextIndex =
      (activeIndex + 1) % totalTones;

    const nextTone =
      tones[nextIndex];

    if (!nextTone?.id) return;

    emitToneChange(nextTone.id);
  }, [
    canNavigate,
    activeIndex,
    totalTones,
    tones,
    emitToneChange,
  ]);

  /* ==========================================================================
     Previous Tone
     ========================================================================== */

  const handlePrevious =
    useCallback(() => {
      if (!canNavigate) return;

      if (totalTones === 0) return;

      const previousIndex =
        activeIndex <= 0
          ? totalTones - 1
          : activeIndex - 1;

      const previousTone =
        tones[previousIndex];

      if (!previousTone?.id) return;

      emitToneChange(
        previousTone.id
      );
    }, [
      canNavigate,
      activeIndex,
      totalTones,
      tones,
      emitToneChange,
    ]);

  /* ==========================================================================
     Keyboard Navigation
     ========================================================================== */

  const handleKeyDown = useCallback(
    (event) => {
      if (!canNavigate) return;

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          handleNext();
          break;

        case "ArrowLeft":
          event.preventDefault();
          handlePrevious();
          break;

        case "Home":
          event.preventDefault();

          if (tones[0]?.id) {
            emitToneChange(
              tones[0].id
            );
          }

          break;

        case "End":
          event.preventDefault();

          if (
            tones[totalTones - 1]?.id
          ) {
            emitToneChange(
              tones[
                totalTones - 1
              ].id
            );
          }

          break;

        default:
          break;
      }
    },
    [
      canNavigate,
      handleNext,
      handlePrevious,
      emitToneChange,
      tones,
      totalTones,
    ]
  );

  /* ==========================================================================
     Part 2 Complete
     ========================================================================== */
       /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <div
      className={clsx(
        "flex flex-col gap-4",
        "rounded-xl border border-slate-200",
        "bg-white p-4 shadow-sm",
        className
      )}
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
        "
      >
        <div className="min-w-0">
          <h3
            className="
              text-sm
              font-semibold
              text-slate-900
            "
          >
            Reply Tone
          </h3>

          <p
            className="
              mt-1
              text-xs
              leading-5
              text-slate-500
            "
          >
            Select the tone for
            AI-generated replies.
          </p>
        </div>

        <span
          className="
            shrink-0
            rounded-md
            bg-slate-100
            px-3
            py-1
            text-xs
            font-semibold
            text-slate-600
          "
        >
          {totalTones > 0
            ? `${activeIndex + 1} / ${totalTones}`
            : "0 / 0"}
        </span>
      </div>

      {/* ==================================================================
          Tone Buttons
          ================================================================== */}

      {totalTones > 0 ? (
        <div
          className="
            flex
            flex-wrap
            gap-3
          "
          role="radiogroup"
          aria-label="AI Reply Tone"
          onKeyDown={handleKeyDown}
        >
          {tones.map((tone) => {
            if (!tone?.id) {
              return null;
            }

            return (
              <ToneButton
                key={tone.id}
                tone={tone}
                active={
                  tone.id ===
                  currentToneId
                }
                disabled={disabled}
                loading={loading}
                onClick={
                  handleToneSelect
                }
              />
            );
          })}
        </div>
      ) : (
        <div
          className="
            rounded-lg
            border
            border-dashed
            border-slate-300
            bg-slate-50
            px-4
            py-6
            text-center
          "
        >
          <p
            className="
              text-sm
              font-medium
              text-slate-600
            "
          >
            No reply tones available.
          </p>
        </div>
      )}

      {/* ==================================================================
          Footer Navigation
          ================================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          border-t
          border-slate-200
          pt-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* Previous */}

        <button
          type="button"
          onClick={handlePrevious}
          disabled={!canNavigate}
          aria-label="Previous reply tone"
          className={clsx(
            "rounded-lg border",
            "px-4 py-2",
            "text-sm font-medium",
            "transition-all duration-200",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-blue-500/20",
            canNavigate
              ? [
                  "border-slate-300",
                  "bg-white",
                  "text-slate-700",
                  "hover:border-blue-500",
                  "hover:text-blue-600",
                ].join(" ")
              : [
                  "cursor-not-allowed",
                  "border-slate-200",
                  "bg-slate-100",
                  "text-slate-400",
                ].join(" ")
          )}
        >
          Previous
        </button>

        {/* Current Tone */}

        <div
          className="
            min-w-0
            flex-1
            text-center
          "
        >
          <p
            className="
              truncate
              text-sm
              font-semibold
              text-slate-900
            "
          >
            {activeTone?.label ||
              "Professional"}
          </p>

          <p
            className="
              mt-0.5
              text-xs
              text-slate-500
            "
          >
            Current AI reply tone
          </p>
        </div>

        {/* Next */}

        <button
          type="button"
          onClick={handleNext}
          disabled={!canNavigate}
          aria-label="Next reply tone"
          className={clsx(
            "rounded-lg px-4 py-2",
            "text-sm font-medium",
            "transition-all duration-200",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-blue-500/20",
            canNavigate
              ? [
                  "bg-blue-600",
                  "text-white",
                  "hover:bg-blue-700",
                ].join(" ")
              : [
                  "cursor-not-allowed",
                  "bg-slate-300",
                  "text-white",
                ].join(" ")
          )}
        >
          Next
        </button>
      </div>
    </div>
  );/* ============================================================================
   PropTypes
   ============================================================================ */

ToneSelector.propTypes = {
  /**
   * Selected tone using the primary API.
   */
  selectedTone: PropTypes.string,

  /**
   * Backward-compatible value prop.
   */
  value: PropTypes.string,

  /**
   * Primary tone-change callback.
   */
  onToneChange: PropTypes.func,

  /**
   * Backward-compatible change callback.
   */
  onChange: PropTypes.func,

  /**
   * Disable user interaction.
   */
  disabled: PropTypes.bool,

  /**
   * Loading state.
   */
  loading: PropTypes.bool,

  /**
   * Additional Tailwind/CSS classes.
   */
  className: PropTypes.string,
};

/* ============================================================================
   Display Name
   ============================================================================ */

ToneSelector.displayName =
  "ToneSelector";

/* ============================================================================
   Memoized Export
   ============================================================================ */

const MemoizedToneSelector = memo(
  ToneSelector
);

MemoizedToneSelector.displayName =
  "MemoizedToneSelector";

/* ============================================================================
   Default Export
   ============================================================================ */
}
export default MemoizedToneSelector;

/* ============================================================================
   End ToneSelector.jsx
   ============================================================================ */