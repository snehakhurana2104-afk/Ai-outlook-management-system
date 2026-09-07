/******************************************************************************
 * ToneButton.jsx
 * Enterprise Component
 ******************************************************************************/

import React, {
  memo,
  useMemo,
  useCallback,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

const ToneButton = ({
  tone,
  active = false,
  disabled = false,
  loading = false,
  onClick,
}) => {
      /* =======================================================================
   * Derived State
   * ===================================================================== */

  const Icon = useMemo(
    () => tone.icon,
    [tone]
  );

  const isDisabled = useMemo(
    () => disabled || loading,
    [disabled, loading]
  );

  /* =======================================================================
   * Click Handler
   * ===================================================================== */

  const handleClick = useCallback(() => {
    if (isDisabled) return;

    onClick?.(tone.id);
  }, [
    isDisabled,
    onClick,
    tone,
  ]);
    return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-pressed={active}
      className={clsx(
        "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200",

        active
          ? "border-blue-600 bg-blue-600 text-white shadow-md"
          : "border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600",

        isDisabled &&
          "cursor-not-allowed opacity-60"
      )}
    >
      <Icon size={16} />

      <span>{tone.label}</span>
    </button>
  );
ToneButton.propTypes = {
  tone: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
  }).isRequired,

  active: PropTypes.bool,

  disabled: PropTypes.bool,

  loading: PropTypes.bool,

  onClick: PropTypes.func,
};

ToneButton.displayName =
  "ToneButton";
}
export default memo(ToneButton);