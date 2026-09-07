/******************************************************************************
 * DashboardTableBody.jsx
 * Part 1
 * Imports + Component Skeleton + Props
 ******************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

/* ==========================================================================
   Cell Components
========================================================================== */

import SenderCell from "./SenderCell";
import CompanyCell from "./CompanyCell";
import SubjectCell from "./SubjectCell";
import DateCell from "./DateCell";
import ActionCell from "./ActionCell";

import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import CategoryBadge from "./CategoryBadge";
import AIConfidenceBadge from "./AIConfidenceBadge";

/* ==========================================================================
   Component
========================================================================== */

const DashboardTableBody = ({
  pageRows,
  visibleColumns,

  selectedRows,
  hoveredRow,
  density,

  onSelectRow,
  onHoverRow,

  onView,
  onReply,
  onArchive,
  onDelete,
}) => {

  /******************************************************************************
 * DashboardTableBody.jsx
 * Part 2
 * <tbody> + Row Loop
 ******************************************************************************/

const rowHeight =
  density === "compact"
    ? 42
    : density === "spacious"
    ? 72
    : 56;

return (
  <tbody>

    {pageRows.map((row) => (

      <tr
        key={row.id}
        style={{ height: rowHeight }}
        onMouseEnter={() => onHoverRow(row.id)}
        onMouseLeave={() => onHoverRow(null)}
        className={clsx(
          "border-b border-slate-100 transition-colors duration-150",
          hoveredRow === row.id
            ? "bg-slate-50"
            : "hover:bg-slate-50"
        )}
      >

        {/* ================================================
            Row Selection
        ================================================= */}

        <td className="px-4 text-center">

          <input
            type="checkbox"
            checked={selectedRows.includes(row.id)}
            onChange={() => onSelectRow(row.id)}
            className="h-4 w-4 rounded border-slate-300"
          />

        </td>

        {/* Dynamic Cells */}
        {/* Part 3 */}

      </tr>

    ))}

  </tbody>
);

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * DashboardTableBody.jsx
 * Part 3
 * Dynamic Cell Rendering
 ******************************************************************************/

        {visibleColumns.map((column) => {

          switch (column.key) {

            case "sender":
              return (
                <td key={column.key} className="px-5 py-3">
                  <SenderCell row={row} />
                </td>
              );

            case "company":
              return (
                <td key={column.key} className="px-5 py-3">
                  <CompanyCell row={row} />
                </td>
              );

            case "subject":
              return (
                <td key={column.key} className="px-5 py-3">
                  <SubjectCell row={row} />
                </td>
              );

            case "priority":
              return (
                <td key={column.key} className="px-5 py-3">
                  <PriorityBadge value={row.priority} />
                </td>
              );

            case "status":
              return (
                <td key={column.key} className="px-5 py-3">
                  <StatusBadge value={row.status} />
                </td>
              );

            case "category":
              return (
                <td key={column.key} className="px-5 py-3">
                  <CategoryBadge value={row.category} />
                </td>
              );

            case "confidence":
              return (
                <td key={column.key} className="px-5 py-3">
                  <AIConfidenceBadge
                    value={row.aiConfidence}
                  />
                </td>
              );

            case "receivedAt":
              return (
                <td key={column.key} className="px-5 py-3">
                  <DateCell value={row.receivedAt} />
                </td>
              );

            default:
              return (
                <td
                  key={column.key}
                  className="px-5 py-3 text-sm text-slate-700"
                >
                  {row[column.key]}
                </td>
              );

          }

        })}

        /******************************************************************************
 * DashboardTableBody.jsx
 * Part 4
 * Action Cell + PropTypes + Export
 ******************************************************************************/

        <td
          className="
            sticky
            right-0
            border-l
            border-slate-200
            bg-white
            px-4
            py-3
          "
        >
          <ActionCell
            row={row}
            onView={onView}
            onReply={onReply}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        </td>

/******************************************************************************
 * Component Configuration
 ******************************************************************************/

DashboardTableBody.displayName = "DashboardTableBody";

DashboardTableBody.propTypes = {
  pageRows: PropTypes.array.isRequired,
  visibleColumns: PropTypes.array.isRequired,
  selectedRows: PropTypes.array.isRequired,
  hoveredRow: PropTypes.any,
  density: PropTypes.string,

  onSelectRow: PropTypes.func.isRequired,
  onHoverRow: PropTypes.func.isRequired,

  onView: PropTypes.func,
  onReply: PropTypes.func,
  onArchive: PropTypes.func,
  onDelete: PropTypes.func,
};

DashboardTableBody.defaultProps = {
  density: "comfortable",
  hoveredRow: null,
};

export default memo(DashboardTableBody);

/******************************************************************************
 * End Part 4
 ******************************************************************************/
};