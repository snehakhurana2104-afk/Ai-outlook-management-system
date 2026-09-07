/******************************************************************************
 * DashboardTableContent.jsx
 * Part 1
 * Imports + Component Skeleton + Props
 ******************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

/* ==========================================================================
   Components
========================================================================== */

import LoadingOverlay from "./LoadingOverlay";
import TableSkeleton from "./TableSkeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import NoSearchResults from "./NoSearchResults";

import DashboardTableHeader from "./DashboardTableHeader";
import DashboardTableBody from "./DashboardTableBody";
import DashboardTablePagination from "./DashboardTablePagination";

/* ==========================================================================
   Component
========================================================================== */

const DashboardTableContent = ({
  rows = [],
  columns = [],
  loading = false,
  error = null,

  className = "",

  tableRef,
  scrollRef,

  tableHeight = 650,

  pageRows = [],
  pagination = {},

  selectedRows = [],
  visibleColumns = [],

  density = "comfortable",

  onRefresh,
  onSort,
  onSelectRow,
  onSelectAll,

  onView,
  onReply,
  onArchive,
  onDelete,
}) => {

  // Part 2 starts here...
};

/* ==========================================================================
   PropTypes
========================================================================== */

DashboardTableContent.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.any,

  className: PropTypes.string,

  tableRef: PropTypes.object,
  scrollRef: PropTypes.object,

  tableHeight: PropTypes.number,

  pageRows: PropTypes.array,
  pagination: PropTypes.object,

  selectedRows: PropTypes.array,
  visibleColumns: PropTypes.array,

  density: PropTypes.string,

  onRefresh: PropTypes.func,
  onSort: PropTypes.func,
  onSelectRow: PropTypes.func,
  onSelectAll: PropTypes.func,

  onView: PropTypes.func,
  onReply: PropTypes.func,
  onArchive: PropTypes.func,
  onDelete: PropTypes.func,
};

DashboardTableContent.displayName =
  "DashboardTableContent";

export default memo(DashboardTableContent);

/******************************************************************************
 * End Part 1
 ******************************************************************************/
/******************************************************************************
 * DashboardTableContent.jsx
 * Part 2
 * Loading / Error / Empty States
 ******************************************************************************/

/* ==========================================================================
   Loading State
========================================================================== */

if (loading) {
  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <LoadingOverlay />

      <div className="p-6">
        <TableSkeleton rows={pageRows.length || 10} />
      </div>
    </section>
  );
}

/* ==========================================================================
   Error State
========================================================================== */

if (error) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-red-200 bg-white shadow-sm",
        className
      )}
    >
      <ErrorState
        error={error}
        onRetry={onRefresh}
      />
    </section>
  );
}

/* ==========================================================================
   Empty Dashboard
========================================================================== */

if (!rows.length) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <EmptyState
        title="No Emails Found"
        description="No Outlook emails are available."
      />
    </section>
  );
}

/* ==========================================================================
   No Search / Filter Result
========================================================================== */

if (rows.length > 0 && pageRows.length === 0) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <NoSearchResults />
    </section>
  );
}

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * DashboardTableContent.jsx
 * Part 3
 * Table Wrapper + <table> Container
 ******************************************************************************/

return (
  <section
    className={clsx(
      "relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
      className
    )}
  >
    {/* ==========================================================
        Scrollable Table Container
    ========================================================== */}

    <div
      ref={scrollRef}
      className="
        relative
        w-full
        overflow-x-auto
        overflow-y-auto
      "
      style={{
        maxHeight: tableHeight,
      }}
    >
      {/* ==========================================================
          Enterprise Table
      ========================================================== */}

      <table
        ref={tableRef}
        className="
          min-w-full
          border-collapse
          table-auto
          text-sm
        "
      >

        {/* ======================================================
            Part 4
            DashboardTableHeader
        ====================================================== */}

        <DashboardTableHeader
          columns={columns}
          visibleColumns={visibleColumns}
          selectedRows={selectedRows}
          pageRows={pageRows}
          onSort={onSort}
          onSelectAll={onSelectAll}
        />

        {/* ======================================================
            Part 5
            DashboardTableBody
        ====================================================== */}

        <DashboardTableBody
          rows={pageRows}
          visibleColumns={visibleColumns}
          density={density}
          selectedRows={selectedRows}
          onSelectRow={onSelectRow}
          onView={onView}
          onReply={onReply}
          onArchive={onArchive}
          onDelete={onDelete}
        />

      </table>
    </div>

    {/* ==========================================================
        Part 6
        Pagination
    ========================================================== */}

    <DashboardTablePagination
      pagination={pagination}
    />

  </section>
);

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * DashboardTableContent.jsx
 * Part 4
 * Header + Body Integration
 ******************************************************************************/

      <table
        ref={tableRef}
        className="
          min-w-full
          border-collapse
          table-auto
          text-sm
        "
      >
        {/* ==========================================================
            Enterprise Header
        ========================================================== */}

        <DashboardTableHeader
          columns={columns}
          visibleColumns={visibleColumns}
          pageRows={pageRows}
          selectedRows={selectedRows}
          sort={sort}
          onSort={onSort}
          onSelectAll={onSelectAll}
        />

        {/* ==========================================================
            Enterprise Body
        ========================================================== */}

        <DashboardTableBody
          rows={pageRows}
          columns={columns}
          visibleColumns={visibleColumns}
          density={density}
          selectedRows={selectedRows}
          hoveredRow={hoveredRow}
          activeRow={activeRow}
          onHoverRow={setHoveredRow}
          onActiveRow={setActiveRow}
          onSelectRow={onSelectRow}
          onView={onView}
          onReply={onReply}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      </table>

/******************************************************************************
 * End Part 4
 ******************************************************************************/
/******************************************************************************
 * DashboardTableContent.jsx
 * Part 5
 * Pagination Integration + Closing Layout
 ******************************************************************************/

      {/* ==========================================================
          Pagination Footer
      ========================================================== */}

      <DashboardTablePagination
        pagination={pagination}
        pageSize={pageSize}
        onPageSizeChange={changePageSize}
        onFirstPage={firstPage}
        onPreviousPage={previousPage}
        onNextPage={nextPage}
        onLastPage={lastPage}
      />

/******************************************************************************
 * Component Configuration
 ******************************************************************************/

DashboardTableContent.displayName = "DashboardTableContent";

DashboardTableContent.propTypes = {
  rows: PropTypes.array.isRequired,
  pageRows: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  visibleColumns: PropTypes.array.isRequired,

  loading: PropTypes.bool,
  error: PropTypes.any,
  className: PropTypes.string,

  density: PropTypes.string,
  tableHeight: PropTypes.number,

  selectedRows: PropTypes.array,
  hoveredRow: PropTypes.any,
  activeRow: PropTypes.any,

  sort: PropTypes.object,
  pagination: PropTypes.object,

  tableRef: PropTypes.object,
  scrollRef: PropTypes.object,

  onSort: PropTypes.func,
  onSelectAll: PropTypes.func,
  onSelectRow: PropTypes.func,

  onHoverRow: PropTypes.func,
  onActiveRow: PropTypes.func,

  onView: PropTypes.func,
  onReply: PropTypes.func,
  onArchive: PropTypes.func,
  onDelete: PropTypes.func,

  onRefresh: PropTypes.func,

  firstPage: PropTypes.func,
  previousPage: PropTypes.func,
  nextPage: PropTypes.func,
  lastPage: PropTypes.func,
  changePageSize: PropTypes.func,
};

DashboardTableContent.defaultProps = {
  loading: false,
  error: null,
  className: "",
  density: "comfortable",
  tableHeight: 650,
  selectedRows: [],
};

export default memo(DashboardTableContent);

/******************************************************************************
 * End Part 5
 ******************************************************************************/