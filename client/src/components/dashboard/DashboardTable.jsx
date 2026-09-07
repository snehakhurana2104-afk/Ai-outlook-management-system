/******************************************************************************
 * DashboardTable.jsx
 * Part 1
 * Imports + Constants + Component Skeleton
 ******************************************************************************/

import React, {
  memo,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";
import DashboardTableToolbar from "./DashboardTableToolbar";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

/* ==========================================================================
   Toolbar Components
========================================================================== */

import SearchBar from "./SearchBar";
import FilterButton from "./FilterButton";
import RefreshButton from "./RefreshButton";
import DensitySwitcher from "./DensitySwitcher";
import ColumnManagerButton from "./ColumnManagerButton";
import ExportMenu from "./ExportMenu";

/* ==========================================================================
   Table Cell Components
========================================================================== */

import SenderCell from "./SenderCell";
import CompanyCell from "./CompanyCell";
import SubjectCell from "./SubjectCell";
import DateCell from "./DateCell";
import ActionCell from "./ActionCell";

/* ==========================================================================
   Badge Components
========================================================================== */

import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import CategoryBadge from "./CategoryBadge";
import AIConfidenceBadge from "./AIConfidenceBadge";

/* ==========================================================================
   State Components
========================================================================== */

import LoadingOverlay from "./LoadingOverlay";
import TableSkeleton from "./TableSkeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import NoSearchResults from "./NoSearchResults";

/* ==========================================================================
   Constants
========================================================================== */

const DEFAULT_FILTERS = {};

const DEFAULT_SORT = {
  key: "receivedAt",
  direction: "desc",
};

const DEFAULT_PAGE_SIZE = 20;

const DEFAULT_DENSITY = "comfortable";

/* ==========================================================================
   Component
========================================================================== */

const DashboardTable = ({
  rows = [],
  columns = [],
  loading = false,
  error = null,
  className = "",

  onRefresh,
  onReply,
  onArchive,
  onDelete,
  onView,

  onExportCSV,
  onExportExcel,
  onExportPDF,
  onExportJSON,
}) => {
  /******************************************************************************
 * DashboardTable.jsx
 * Part 2
 * Refs + State Management
 ******************************************************************************/

/* ==========================================================================
   Refs
========================================================================== */

const tableRef = useRef(null);
const scrollRef = useRef(null);

/* ==========================================================================
   Search
========================================================================== */

const [search, setSearch] = useState("");

/* ==========================================================================
   Filters
========================================================================== */

const [filters, setFilters] = useState(DEFAULT_FILTERS);

/* ==========================================================================
   Sorting
========================================================================== */

const [sort, setSort] = useState(DEFAULT_SORT);

/* ==========================================================================
   Pagination
========================================================================== */

const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

/* ==========================================================================
   Selection
========================================================================== */

const [selectedRows, setSelectedRows] = useState([]);

/* ==========================================================================
   Density
========================================================================== */

const [density, setDensity] = useState(DEFAULT_DENSITY);

/* ==========================================================================
   Visible Columns
========================================================================== */

const [visibleColumns, setVisibleColumns] = useState(
  () => columns.map((column) => column.key)
);

/* ==========================================================================
   UI State
========================================================================== */

const [refreshing, setRefreshing] = useState(false);
const [overlayLoading, setOverlayLoading] = useState(false);

const [filterOpen, setFilterOpen] = useState(false);
const [exportOpen, setExportOpen] = useState(false);
const [columnManagerOpen, setColumnManagerOpen] = useState(false);

/* ==========================================================================
   Row State
========================================================================== */

const [hoveredRow, setHoveredRow] = useState(null);
const [activeRow, setActiveRow] = useState(null);

/* ==========================================================================
   Layout
========================================================================== */

const [tableHeight, setTableHeight] = useState(650);

/* ==========================================================================
   Metrics
========================================================================== */

const [metrics, setMetrics] = useState({
  totalEmails: 0,
  filteredEmails: 0,
  selectedEmails: 0,
  replied: 0,
  pending: 0,
  responseRate: 0,
});

const [lastUpdated, setLastUpdated] = useState(new Date());

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * DashboardTable.jsx
 * Part 3
 * Derived Data (Search + Filter + Sort + Pagination)
 ******************************************************************************/

/* ==========================================================================
   Search
========================================================================== */

const searchedRows = useMemo(() => {
  if (!search.trim()) return rows;

  const keyword = search.toLowerCase().trim();

  return rows.filter((row) =>
    [
      row.subject,
      row.sender,
      row.senderEmail,
      row.company,
    ]
      .filter(Boolean)
      .some((value) =>
        value.toLowerCase().includes(keyword)
      )
  );
}, [rows, search]);

/* ==========================================================================
   Filters
========================================================================== */

const filteredRows = useMemo(() => {
  return searchedRows.filter((row) => {
    return Object.entries(filters).every(
      ([key, value]) => {
        if (
          !value ||
          value === "" ||
          value === "All"
        )
          return true;

        return row[key] === value;
      }
    );
  });
}, [searchedRows, filters]);

/* ==========================================================================
   Sorting
========================================================================== */

const sortedRows = useMemo(() => {
  const data = [...filteredRows];

  data.sort((a, b) => {
    const aValue = a?.[sort.key];
    const bValue = b?.[sort.key];

    if (aValue === bValue) return 0;

    if (sort.direction === "asc") {
      return aValue > bValue ? 1 : -1;
    }

    return aValue < bValue ? 1 : -1;
  });

  return data;
}, [filteredRows, sort]);

/* ==========================================================================
   Pagination
========================================================================== */

const totalRows = sortedRows.length;

const totalPages = Math.max(
  1,
  Math.ceil(totalRows / pageSize)
);

const startIndex =
  (currentPage - 1) * pageSize;

const endIndex =
  startIndex + pageSize;

const pageRows = useMemo(() => {
  return sortedRows.slice(
    startIndex,
    endIndex
  );
}, [
  sortedRows,
  startIndex,
  endIndex,
]);

/* ==========================================================================
   Visible Columns
========================================================================== */

const visibleColumnObjects = useMemo(() => {
  return columns.filter((column) =>
    visibleColumns.includes(column.key)
  );
}, [
  columns,
  visibleColumns,
]);

/* ==========================================================================
   Selected Rows
========================================================================== */

const selectedRowObjects = useMemo(() => {
  return sortedRows.filter((row) =>
    selectedRows.includes(row.id)
  );
}, [
  sortedRows,
  selectedRows,
]);

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * DashboardTable.jsx
 * Part 4
 * Metrics + Export Data + UI Derived Data
 ******************************************************************************/

/* ==========================================================================
   Export Rows
========================================================================== */

const exportRows = useMemo(() => {
  return selectedRows.length > 0
    ? selectedRowObjects
    : sortedRows;
}, [
  selectedRows,
  selectedRowObjects,
  sortedRows,
]);

/* ==========================================================================
   Dashboard Metrics
========================================================================== */

const dashboardMetrics = useMemo(() => {
  const replied = sortedRows.filter(
    (row) => row.status === "Replied"
  ).length;

  const pending = sortedRows.filter(
    (row) => row.status === "Pending"
  ).length;

  const highPriority = sortedRows.filter(
    (row) => row.priority === "High"
  ).length;

  const responseRate =
    sortedRows.length === 0
      ? 0
      : Math.round(
          (replied / sortedRows.length) * 100
        );

  return {
    totalEmails: rows.length,
    filteredEmails: sortedRows.length,
    selectedEmails: selectedRows.length,
    replied,
    pending,
    highPriority,
    responseRate,
  };
}, [
  rows,
  sortedRows,
  selectedRows,
]);

/* ==========================================================================
   Active Filter Chips
========================================================================== */

const filterChips = useMemo(() => {
  const chips = [];

  if (search.trim()) {
    chips.push({
      key: "search",
      label: `Search : ${search}`,
    });
  }

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (
        value &&
        value !== "" &&
        value !== "All"
      ) {
        chips.push({
          key,
          label: `${key} : ${value}`,
        });
      }
    }
  );

  return chips;
}, [
  search,
  filters,
]);

/* ==========================================================================
   Row Height
========================================================================== */

const rowHeight = useMemo(() => {
  switch (density) {
    case "compact":
      return 42;

    case "comfortable":
      return 56;

    case "spacious":
      return 72;

    default:
      return 56;
  }
}, [density]);

/* ==========================================================================
   Current Sort Column
========================================================================== */

const currentSortColumn = useMemo(() => {
  return columns.find(
    (column) => column.key === sort.key
  );
}, [
  columns,
  sort,
]);

/* ==========================================================================
   Pagination Info
========================================================================== */

const pagination = useMemo(() => ({
  currentPage,
  totalPages,
  totalRows,
  start:
    totalRows === 0
      ? 0
      : startIndex + 1,
  end: Math.min(endIndex, totalRows),
  hasPrevious: currentPage > 1,
  hasNext: currentPage < totalPages,
}), [
  currentPage,
  totalPages,
  totalRows,
  startIndex,
  endIndex,
]);

/******************************************************************************
 * End Part 4
 ******************************************************************************/
/******************************************************************************
 * DashboardTable.jsx
 * Part 5
 * Enterprise Handlers
 ******************************************************************************/

/* ==========================================================================
   Search
========================================================================== */

const handleSearch = useCallback((value) => {
  setSearch(value);
  setCurrentPage(1);
}, []);

const clearSearch = useCallback(() => {
  setSearch("");
  setCurrentPage(1);
}, []);

/* ==========================================================================
   Filters
========================================================================== */

const handleFilterChange = useCallback((key, value) => {
  setFilters((prev) => ({
    ...prev,
    [key]: value,
  }));

  setCurrentPage(1);
}, []);

const clearFilters = useCallback(() => {
  setFilters(DEFAULT_FILTERS);
  setCurrentPage(1);
}, []);

/* ==========================================================================
   Sorting
========================================================================== */

const handleSort = useCallback((columnKey) => {

  setSort((previous) => {

    if (previous.key === columnKey) {

      return {
        key: columnKey,
        direction:
          previous.direction === "asc"
            ? "desc"
            : "asc",
      };

    }

    return {
      key: columnKey,
      direction: "asc",
    };

  });

}, []);

/* ==========================================================================
   Pagination
========================================================================== */

const nextPage = useCallback(() => {
  if (currentPage < totalPages) {
    setCurrentPage((page) => page + 1);
  }
}, [currentPage, totalPages]);

const previousPage = useCallback(() => {
  if (currentPage > 1) {
    setCurrentPage((page) => page - 1);
  }
}, [currentPage]);

const firstPage = useCallback(() => {
  setCurrentPage(1);
}, []);

const lastPage = useCallback(() => {
  setCurrentPage(totalPages);
}, [totalPages]);

const changePageSize = useCallback((size) => {
  setPageSize(size);
  setCurrentPage(1);
}, []);

/* ==========================================================================
   Row Selection
========================================================================== */

const handleRowSelection = useCallback((id) => {

  setSelectedRows((previous) => {

    if (previous.includes(id)) {
      return previous.filter((item) => item !== id);
    }

    return [...previous, id];

  });

}, []);

const handleSelectAll = useCallback(() => {

  if (
    selectedRows.length === pageRows.length &&
    pageRows.length > 0
  ) {
    setSelectedRows([]);
    return;
  }

  setSelectedRows(
    pageRows.map((row) => row.id)
  );

}, [pageRows, selectedRows]);

/* ==========================================================================
   Density
========================================================================== */

const handleDensityChange = useCallback((value) => {
  setDensity(value);
}, []);

/* ==========================================================================
   Columns
========================================================================== */

const toggleColumn = useCallback((key) => {

  setVisibleColumns((previous) => {

    if (previous.includes(key)) {
      return previous.filter((item) => item !== key);
    }

    return [...previous, key];

  });

}, []);

/* ==========================================================================
   Refresh
========================================================================== */

const handleRefresh = useCallback(async () => {

  if (!onRefresh) return;

  try {

    setRefreshing(true);

    await onRefresh();

    setLastUpdated(new Date());

  } finally {

    setRefreshing(false);

  }

}, [onRefresh]);

/* ==========================================================================
   Export
========================================================================== */

const handleExportCSV = () =>
  onExportCSV?.(exportData);

const handleExportExcel = () =>
  onExportExcel?.(exportData);

const handleExportPDF = () =>
  onExportPDF?.(exportData);

const handleExportJSON = () =>
  onExportJSON?.(exportData);

/* ==========================================================================
   Row Actions
========================================================================== */

const handleView = (row) => onView?.(row);

const handleReply = (row) => onReply?.(row);

const handleArchive = (row) => onArchive?.(row);

const handleDelete = (row) => onDelete?.(row);

/******************************************************************************
 * End Part 5
 ******************************************************************************/
/******************************************************************************
 * DashboardTable.jsx
 * Part 6
 * Enterprise Effects
 ******************************************************************************/

/* ==========================================================================
   Sync Metrics
========================================================================== */

useEffect(() => {
  setMetrics(stats);
}, [stats]);

/* ==========================================================================
   Keep Current Page Valid
========================================================================== */

useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages || 1);
  }
}, [currentPage, totalPages]);

/* ==========================================================================
   Remove Deleted Selected Rows
========================================================================== */

useEffect(() => {
  setSelectedRows((previous) =>
    previous.filter((id) =>
      rows.some((row) => row.id === id)
    )
  );
}, [rows]);

/* ==========================================================================
   Auto Refresh
========================================================================== */

useEffect(() => {

  if (!onRefresh) return;

  const timer = setInterval(async () => {

    try {

      await onRefresh();

      setLastUpdated(new Date());

    } catch (error) {
      console.error(error);
    }

  }, 60000);

  return () => clearInterval(timer);

}, [onRefresh]);

/* ==========================================================================
   Responsive Table Height
========================================================================== */

useEffect(() => {

  const updateHeight = () => {

    if (!tableRef.current) return;

    const rect =
      tableRef.current.getBoundingClientRect();

    const availableHeight =
      window.innerHeight -
      rect.top -
      220;

    setTableHeight(
      Math.max(350, availableHeight)
    );

  };

  updateHeight();

  window.addEventListener(
    "resize",
    updateHeight
  );

  return () => {

    window.removeEventListener(
      "resize",
      updateHeight
    );

  };

}, []);

/* ==========================================================================
   Scroll To Top On Page Change
========================================================================== */

useEffect(() => {

  if (
    listRef.current &&
    typeof listRef.current.scrollTo === "function"
  ) {

    listRef.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  }

}, [
  currentPage,
  pageSize,
  search,
  filters,
  sort,
]);

/******************************************************************************
 * End Part 6
 ******************************************************************************/
/******************************************************************************
 * DashboardTable.jsx
 * Part 7
 * Return JSX (Toolbar + Table Container)
 ******************************************************************************/

return (
  <section
    ref={tableRef}
    className={clsx(
      "relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
      className
    )}
  >
    {/* ==========================================================
        Toolbar
    ========================================================== */}

    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">

      {/* Left */}

      <div className="flex flex-1 items-center gap-3">

        <SearchBar
          value={search}
          onChange={handleSearch}
          onClear={clearSearch}
          placeholder="Search emails..."
        />

        <FilterButton
          filters={filters}
          onChange={handleFilterChange}
          onClear={clearFilters}
        />

      </div>

      {/* Right */}

      <div className="flex items-center gap-2">

        <RefreshButton
          loading={refreshing}
          onClick={handleRefresh}
        />

        <DensitySwitcher
          value={density}
          onChange={handleDensityChange}
        />

        <ColumnManagerButton
          columns={columns}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
        />

        <ExportMenu
          onCSV={handleExportCSV}
          onExcel={handleExportExcel}
          onPDF={handleExportPDF}
          onJSON={handleExportJSON}
        />

      </div>

    </div>

    {/* ==========================================================
        Filter Chips
    ========================================================== */}

    {filterChips.length > 0 && (
      <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50 px-6 py-3">

        {filterChips.map((chip) => (
          <span
            key={chip.key}
            className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
          >
            {chip.label}
          </span>
        ))}

      </div>
    )}

    {/* ==========================================================
        Loading Overlay
    ========================================================== */}

    {overlayLoading && <LoadingOverlay />}

    {/* ==========================================================
        Error
    ========================================================== */}

    {!loading && error && (
      <ErrorState
        error={error}
        onRetry={handleRefresh}
      />
    )}

    {/* ==========================================================
        Empty
    ========================================================== */}

    {!loading &&
      !error &&
      rows.length === 0 && (
        <EmptyState
          title="No Emails Found"
          description="Your inbox is empty."
        />
      )}

    {/* ==========================================================
        Table Wrapper
    ========================================================== */}

    {!error && rows.length > 0 && (

      <div
        ref={listRef}
        className="flex-1 overflow-auto"
        style={{ maxHeight: tableHeight }}
      >

        <table className="min-w-full border-collapse">
       /******************************************************************************
 * DashboardTable.jsx
 * Part 8
 * Enterprise Table Header
 ******************************************************************************/

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
        onChange={handleSelectAll}
        className="
          h-4
          w-4
          rounded
          border-slate-300
          text-blue-600
          focus:ring-blue-500
        "
      />

    </th>

    {/* ==========================================================
        Dynamic Columns
    ========================================================== */}

    {visibleColumnObjects.map((column) => {

      const isSorted = sort.key === column.key;

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

          {column.sortable ? (

            <button
              type="button"
              onClick={() => handleSort(column.key)}
              className="
                flex
                items-center
                gap-2
                transition-colors
                hover:text-blue-600
              "
            >

              <span>{column.label}</span>

              {!isSorted && (
                <ArrowUpDown size={14} />
              )}

              {isSorted &&
                sort.direction === "asc" && (
                  <ArrowUp size={14} />
              )}

              {isSorted &&
                sort.direction === "desc" && (
                  <ArrowDown size={14} />
              )}

            </button>

          ) : (

            <span>{column.label}</span>

          )}

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
/******************************************************************************
 * DashboardTable.jsx
 * Part 9
 * Enterprise Table Body
 ******************************************************************************/

<tbody>

  {pageRows.map((row) => (

    <tr
      key={row.id}
      onMouseEnter={() => setHoveredRow(row.id)}
      onMouseLeave={() => setHoveredRow(null)}
      className={clsx(
        "border-b border-slate-100 transition-colors",
        hoveredRow === row.id
          ? "bg-slate-50"
          : "hover:bg-slate-50"
      )}
      style={{ height: rowHeight }}
    >

      {/* =======================================================
          Selection
      ======================================================= */}

      <td className="px-4 text-center">

        <input
          type="checkbox"
          checked={selectedRows.includes(row.id)}
          onChange={() => handleRowSelection(row.id)}
          className="h-4 w-4 rounded border-slate-300"
        />

      </td>

      {/* =======================================================
          Dynamic Cells
      ======================================================= */}

      {visibleColumnObjects.map((column) => {

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

      {/* =======================================================
          Actions
      ======================================================= */}

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
          onView={handleView}
          onReply={handleReply}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />

      </td>

    </tr>

  ))}

</tbody>
/******************************************************************************
 * DashboardTable.jsx
 * Part 10
 * Pagination + Closing Tags + Export
 ******************************************************************************/

        </table>

      </div>
    )}

      {loading && <TableSkeleton />}

      {/* ==========================================================
          No Search Result
      ========================================================== */}

      {!loading &&
        rows.length > 0 &&
        pageRows.length === 0 && (
          <NoSearchResults />
        )}

   

    {/* ==========================================================
        Pagination Footer
    ========================================================== */}

    {!loading &&
      totalRows > 0 && (

      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">

        <p className="text-sm text-slate-600">
          Showing <strong>{pagination.start}</strong> -
          <strong>{pagination.end}</strong> of{" "}
          <strong>{pagination.totalRows}</strong>
        </p>

        <div className="flex items-center gap-2">

          <button
            onClick={firstPage}
            disabled={!pagination.hasPrevious}
            className="rounded border p-2 disabled:opacity-40"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            onClick={previousPage}
            disabled={!pagination.hasPrevious}
            className="rounded border p-2 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="px-3 text-sm font-medium">
            {pagination.currentPage} / {pagination.totalPages}
          </span>

          <button
            onClick={nextPage}
            disabled={!pagination.hasNext}
            className="rounded border p-2 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={lastPage}
            disabled={!pagination.hasNext}
            className="rounded border p-2 disabled:opacity-40"
          >
            <ChevronsRight size={16} />
          </button>
            <DashboardTableToolbar
  search={search}
  onSearch={handleSearch}
  onClearSearch={clearSearch}

  filters={filters}
  onFilterChange={handleFilterChange}
  onClearFilters={clearFilters}

  refreshing={refreshing}
  onRefresh={handleRefresh}

  density={density}
  onDensityChange={handleDensityChange}

  columns={columns}
  visibleColumns={visibleColumns}
  onToggleColumn={toggleColumn}

  onExportCSV={handleExportCSV}
  onExportExcel={handleExportExcel}
  onExportPDF={handleExportPDF}
  onExportJSON={handleExportJSON}
/>
<DashboardTableToolbar />

<DashboardTableContent
    rows={pageRows}
    columns={columns}
    loading={loading}
/>
        </div>

      </div>

    )}

  </section>
);

/******************************************************************************
 * Component Configuration
 ******************************************************************************/

DashboardTable.displayName = "DashboardTable";

DashboardTable.defaultProps = DashboardTableDefaultProps;

DashboardTable.propTypes = DashboardTablePropTypes;

export default memo(DashboardTable);
}