import React, {
  memo,
  useCallback,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  ArrowLeft,
  Edit3,
} from "lucide-react";

/* ==========================================================================
   Task Details Header
========================================================================== */

const TaskDetailsHeader = ({
  onBack,
  onEdit,
  showEdit = true,
  loading = false,
}) => {
  /* ==========================================================================
     Handlers
  ========================================================================== */

  const handleBack = useCallback(() => {
    if (loading) {
      return;
    }

    onBack?.();
  }, [
    loading,
    onBack,
  ]);

  const handleEdit = useCallback(() => {
    if (loading || !showEdit) {
      return;
    }

    onEdit?.();
  }, [
    loading,
    showEdit,
    onEdit,
  ]);

  /* ==========================================================================
     Render
  ========================================================================== */

  return (
    <header
      className="
        flex
        items-start
        justify-between
        gap-4
        border-b
        border-slate-200
        px-6
        py-5
      "
    >
      {/* ====================================================================
          Left
      ==================================================================== */}

      <div className="min-w-0">
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            px-2
            py-1.5
            text-xs
            font-semibold
            text-slate-600
            transition
            hover:bg-slate-100
            hover:text-slate-900
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
          aria-label="Back to task list"
        >
          <ArrowLeft size={15} />

          Back
        </button>

        <div className="mt-2 px-2">
          <h2
            className="
              text-sm
              font-bold
              text-slate-900
            "
          >
            Task Details
          </h2>

          <p
            className="
              mt-0.5
              text-[11px]
              text-slate-500
            "
          >
            View and manage task information
          </p>
        </div>
      </div>

      {/* ====================================================================
          Edit Action
      ==================================================================== */}

      {showEdit && (
        <button
          type="button"
          onClick={handleEdit}
          disabled={loading}
          className={clsx(
            "inline-flex",
            "shrink-0",
            "items-center",
            "gap-1.5",
            "rounded-lg",
            "border",
            "border-slate-300",
            "bg-white",
            "px-3",
            "py-2",
            "text-xs",
            "font-semibold",
            "text-slate-700",
            "transition",
            "hover:border-blue-300",
            "hover:bg-blue-50",
            "hover:text-blue-700",
            "disabled:cursor-not-allowed",
            "disabled:opacity-50"
          )}
        >
          <Edit3 size={14} />

          Edit
        </button>
      )}
    </header>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

TaskDetailsHeader.propTypes = {
  onBack: PropTypes.func,

  onEdit: PropTypes.func,

  showEdit: PropTypes.bool,

  loading: PropTypes.bool,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskDetailsHeader.defaultProps = {
  onBack: undefined,

  onEdit: undefined,

  showEdit: true,

  loading: false,
};

/* ==========================================================================
   Display Name
========================================================================== */

TaskDetailsHeader.displayName =
  "TaskDetailsHeader";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedTaskDetailsHeader =
  memo(TaskDetailsHeader);

MemoizedTaskDetailsHeader.displayName =
  "MemoizedTaskDetailsHeader";

/* ==========================================================================
   Default Export
========================================================================== */

export default MemoizedTaskDetailsHeader;