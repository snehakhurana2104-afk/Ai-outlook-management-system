import React, {
  memo,
  useCallback,
} from "react";

import PropTypes from "prop-types";

import {
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

/* ==========================================================================
   Task Details Empty
========================================================================== */

const TaskDetailsEmpty = ({
  onBack,
  loading = false,
}) => {
  /* ==========================================================================
     Handler
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

  /* ==========================================================================
     Render
  ========================================================================== */

  return (
    <div
      className="
        flex
        min-h-[420px]
        flex-col
        items-center
        justify-center
        px-6
        py-14
        text-center
      "
    >
      {/* ====================================================================
          Empty State Container
      ==================================================================== */}

      <div
        className="
          flex
          max-w-md
          flex-col
          items-center
        "
      >
        {/* ==================================================================
            Icon
        ================================================================== */}

        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-slate-100
            text-slate-500
          "
        >
          <ClipboardList size={26} />
        </div>

        {/* ==================================================================
            Heading
        ================================================================== */}

        <h3
          className="
            mt-4
            text-base
            font-bold
            text-slate-900
          "
        >
          No Task Selected
        </h3>

        {/* ==================================================================
            Description
        ================================================================== */}

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-slate-500
          "
        >
          Select a task from the list to
          view its details, update
          information, or manage its
          status.
        </p>

        {/* ==================================================================
            Back Button
        ================================================================== */}

        {onBack && (
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="
              mt-5
              inline-flex
              items-center
              gap-1.5
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4
              py-2.5
              text-xs
              font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              hover:border-slate-400
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <ArrowLeft size={14} />

            Back to Tasks
          </button>
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

TaskDetailsEmpty.propTypes = {
  onBack: PropTypes.func,

  loading: PropTypes.bool,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskDetailsEmpty.defaultProps = {
  onBack: undefined,

  loading: false,
};

/* ==========================================================================
   Display Name
========================================================================== */

TaskDetailsEmpty.displayName =
  "TaskDetailsEmpty";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedTaskDetailsEmpty =
  memo(TaskDetailsEmpty);

MemoizedTaskDetailsEmpty.displayName =
  "MemoizedTaskDetailsEmpty";

/* ==========================================================================
   Default Export
========================================================================== */

export default MemoizedTaskDetailsEmpty;