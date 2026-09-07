/******************************************************************************
 * DashboardTableHeader.jsx
 * Part 1
 * Imports + Component Skeleton + Props
 ******************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

/* ==========================================================================
   Component
========================================================================== */

const DashboardTableHeader = ({
  columns,
  visibleColumns,

  pageRows,
  selectedRows,

  sort,

  onSort,
  onSelectAll,
}) => {

  // Part 2 starts here

};

/******************************************************************************
 * End Part 1
 ******************************************************************************/
/******************************************************************************
 * DashboardTableHeader.jsx
 * Part 2
 * Select All Checkbox + Header Layout
 ******************************************************************************/

return (
  <thead className="sticky top-0 z-20 bg-slate-50">

    <tr className="border-b border-slate-200">

      {/* ==========================================================
          Select All
      ========================================================== */}

      <th className="w-14 px-4 py-3 text-center">

        <input
          type="checkbox"
          checked={
            pageRows.length > 0 &&
            selectedRows.length === pageRows.length
          }
          onChange={onSelectAll}
          className="
            h-4
            w-4
            rounded
            border-slate-300
            text-blue-600
            focus:ring-2
            focus:ring-blue-500
          "
        />

      </th>

      {/* ==========================================================
          Dynamic Header Columns
      ========================================================== */}

      {visibleColumns.map((column) => {

        const isSorted =
          sort.key === column.key;

        return (

          <th
            key={column.key}
            style={{
              width: column.width || 180,
              minWidth: column.width || 180,
            }}
            className="
              whitespace-nowrap
              px-5
              py-3
              text-left
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-600
            "
          >

            {/* Part 3 → Sortable Header */}

          </th>

        );

      })}

      {/* ==========================================================
          Sticky Action Column
      ========================================================== */}

      <th
        className="
          sticky
          right-0
          z-30
          w-32
          min-w-[120px]
          border-l
          border-slate-200
          bg-slate-50
          px-4
          py-3
          text-center
          text-xs
          font-semibold
          uppercase
          tracking-wider
          text-slate-600
        "
      >
        Actions
      </th>

    </tr>

  </thead>
);

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * DashboardTableHeader.jsx
 * Part 3
 * Sortable Columns + Sort Icons + Header Buttons
 ******************************************************************************/

{column.sortable ? (

  <button
    type="button"
    onClick={() => onSort(column.key)}
    className="
      flex
      items-center
      gap-2
      transition-colors
      duration-200
      hover:text-blue-600
      focus:outline-none
      focus:text-blue-600
    "
  >

    {/* Column Title */}

    <span>{column.label}</span>

    {/* Sort Icons */}

    {!isSorted && (
      <ArrowUpDown
        size={14}
        className="text-slate-400"
      />
    )}

    {isSorted &&
      sort.direction === "asc" && (
        <ArrowUp
          size={14}
          className="text-blue-600"
        />
    )}

    {isSorted &&
      sort.direction === "desc" && (
        <ArrowDown
          size={14}
          className="text-blue-600"
        />
    )}

  </button>

) : (

  <span>{column.label}</span>

)}

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * DashboardTableHeader.jsx
 * Part 4
 * PropTypes + Display Name + Export
 ******************************************************************************/

DashboardTableHeader.displayName = "DashboardTableHeader";

DashboardTableHeader.propTypes = {
  /* Columns */
  columns: PropTypes.array.isRequired,
  visibleColumns: PropTypes.array.isRequired,

  /* Selection */
  pageRows: PropTypes.array.isRequired,
  selectedRows: PropTypes.array.isRequired,

  /* Sorting */
  sort: PropTypes.shape({
    key: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(["asc", "desc"]).isRequired,
  }).isRequired,

  /* Events */
  onSort: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func.isRequired,
};

DashboardTableHeader.defaultProps = {
  columns: [],
  visibleColumns: [],
  pageRows: [],
  selectedRows: [],
};

export default memo(DashboardTableHeader);

/******************************************************************************
 * End Part 4
 ******************************************************************************/