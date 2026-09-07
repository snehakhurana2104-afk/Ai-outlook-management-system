/******************************************************************************
 * DashboardTablePagination.jsx
 * Part 1
 * Imports + Component Skeleton
 ******************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const DashboardTablePagination = ({
  pagination,
  pageSize,

  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
  onPageSizeChange,
}) => {
  /******************************************************************************
 * DashboardTablePagination.jsx
 * Part 2
 * Pagination Layout
 ******************************************************************************/

return (
  <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">

    {/* ===========================================================
        Left Section
    =========================================================== */}

    <div className="flex items-center gap-6">

      <p className="text-sm text-slate-600">

        Showing

        <span className="mx-1 font-semibold">
          {pagination.start}
        </span>

        -

        <span className="mx-1 font-semibold">
          {pagination.end}
        </span>

        of

        <span className="ml-1 font-semibold">
          {pagination.totalRows}
        </span>

        emails

      </p>

      <div className="flex items-center gap-2">

        <span className="text-sm text-slate-500">
          Rows
        </span>

        <select
          value={pageSize}
          onChange={(e) =>
            onPageSizeChange(Number(e.target.value))
          }
          className="
            rounded-lg
            border
            border-slate-300
            bg-white
            px-3
            py-2
            text-sm
            outline-none
            focus:border-blue-500
          "
        >
          {[10, 20, 50, 100].map((size) => (
            <option
              key={size}
              value={size}
            >
              {size} / page
            </option>
          ))}
        </select>

      </div>

    </div>

    {/* Right Section */}
    {/* Part 3 */}

  </div>
);

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * DashboardTablePagination.jsx
 * Part 3
 * Navigation Controls
 ******************************************************************************/

    {/* ===========================================================
        Right Section
    =========================================================== */}

    <div className="flex items-center gap-2">

      {/* First */}

      <button
        type="button"
        onClick={onFirstPage}
        disabled={!pagination.hasPrevious}
        className="
          flex h-9 w-9 items-center justify-center
          rounded-lg border border-slate-300 bg-white
          transition hover:bg-slate-100
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronsLeft size={16} />
      </button>

      {/* Previous */}

      <button
        type="button"
        onClick={onPreviousPage}
        disabled={!pagination.hasPrevious}
        className="
          flex h-9 w-9 items-center justify-center
          rounded-lg border border-slate-300 bg-white
          transition hover:bg-slate-100
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page Number */}

      <div
        className="
          min-w-[110px]
          rounded-lg
          border border-slate-200
          bg-slate-50
          px-4
          py-2
          text-center
          text-sm
          font-semibold
          text-slate-700
        "
      >
        Page {pagination.currentPage} of {pagination.totalPages}
      </div>

      {/* Next */}

      <button
        type="button"
        onClick={onNextPage}
        disabled={!pagination.hasNext}
        className="
          flex h-9 w-9 items-center justify-center
          rounded-lg border border-slate-300 bg-white
          transition hover:bg-slate-100
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronRight size={16} />
      </button>

      {/* Last */}

      <button
        type="button"
        onClick={onLastPage}
        disabled={!pagination.hasNext}
        className="
          flex h-9 w-9 items-center justify-center
          rounded-lg border border-slate-300 bg-white
          transition hover:bg-slate-100
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
      >
        <ChevronsRight size={16} />
      </button>

    </div>
    /******************************************************************************
 * DashboardTablePagination.jsx
 * Part 4
 * PropTypes + DisplayName + Export
 ******************************************************************************/

DashboardTablePagination.displayName =
  "DashboardTablePagination";

DashboardTablePagination.propTypes = {
  pagination: PropTypes.shape({
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    totalRows: PropTypes.number.isRequired,
    start: PropTypes.number.isRequired,
    end: PropTypes.number.isRequired,
    hasPrevious: PropTypes.bool.isRequired,
    hasNext: PropTypes.bool.isRequired,
  }).isRequired,

  pageSize: PropTypes.number.isRequired,

  onFirstPage: PropTypes.func.isRequired,
  onPreviousPage: PropTypes.func.isRequired,
  onNextPage: PropTypes.func.isRequired,
  onLastPage: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
};

export default memo(DashboardTablePagination);
}
/******************************************************************************
 * End DashboardTablePagination.jsx
 ******************************************************************************/