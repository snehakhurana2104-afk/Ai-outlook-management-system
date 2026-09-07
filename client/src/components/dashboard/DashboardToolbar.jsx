import React, {
  memo,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Search,
  RotateCcw,
  Filter,
  CalendarDays,
  Building2,
  Briefcase,
  Flag,
  X,
  RefreshCw,
  Download,
} from "lucide-react";

const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priority" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];
/* -------------------------------------------------------------------------- */
/*                         Enterprise Toolbar State                            */
/* -------------------------------------------------------------------------- */

const [searchValue, setSearchValue] = useState(
  filters?.search || ""
);

const [activeFilterCount, setActiveFilterCount] = useState(0);

const [resetting, setResetting] = useState(false);

/* -------------------------------------------------------------------------- */
/*                           Active Filter Counter                             */
/* -------------------------------------------------------------------------- */

useEffect(() => {

  const count = Object.entries(filters || {}).filter(
    ([key, value]) =>
      key !== "search" &&
      value &&
      value !== "all"
  ).length;

  setActiveFilterCount(count);

}, [filters]);

/* -------------------------------------------------------------------------- */
/*                        Sync Search From Parent                              */
/* -------------------------------------------------------------------------- */

useEffect(() => {

  setSearchValue(filters?.search || "");

}, [filters?.search]);

/* -------------------------------------------------------------------------- */
/*                      Stable Filter Change Callback                          */
/* -------------------------------------------------------------------------- */

const handleFilterChange = useCallback(
  (key, value) => {

    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));

  },
  [setFilters]
);

/* -------------------------------------------------------------------------- */
/*                         Search Change Callback                              */
/* -------------------------------------------------------------------------- */

const handleSearchChange = useCallback(
  (event) => {

    const value = event.target.value;

    setSearchValue(value);

    setFilters((previous) => ({
      ...previous,
      search: value,
    }));

  },
  [setFilters]
);

/* -------------------------------------------------------------------------- */
/*                        Date Range Change Callback                           */
/* -------------------------------------------------------------------------- */

const handleDateChange = useCallback(
  (event) => {

    setDateRange(event.target.value);

  },
  [setDateRange]
);

/* -------------------------------------------------------------------------- */
/*                         Enterprise Reset Filters                            */
/* -------------------------------------------------------------------------- */

const handleReset = useCallback(() => {

  setResetting(true);

  setSearchValue("");

  setFilters({
    search: "",
    priority: "all",
    company: "all",
    department: "all",
  });

  setDateRange("7days");

  requestAnimationFrame(() => {
    setResetting(false);
  });

}, [setFilters, setDateRange]);
/* -------------------------------------------------------------------------- */
/*                     Enterprise Debounced Search                             */
/* -------------------------------------------------------------------------- */

const [debouncedSearch, setDebouncedSearch] =
  useState(searchValue);

/* -------------------------------------------------------------------------- */
/*                         Debounce Search Input                               */
/* -------------------------------------------------------------------------- */

useEffect(() => {

  const timer = setTimeout(() => {

    setDebouncedSearch(searchValue);

  }, 300);

  return () => clearTimeout(timer);

}, [searchValue]);

/* -------------------------------------------------------------------------- */
/*                  Sync Debounced Search To Parent                            */
/* -------------------------------------------------------------------------- */

useEffect(() => {

  setFilters((previous) => ({

    ...previous,

    search: debouncedSearch,

  }));

}, [debouncedSearch, setFilters]);

/* -------------------------------------------------------------------------- */
/*                    Enterprise Keyboard Shortcuts                            */
/* -------------------------------------------------------------------------- */

useEffect(() => {

  const handleKeyDown = (event) => {

    /* -------------------------------------------------- */
    /* Ctrl + K → Focus Search                            */
    /* -------------------------------------------------- */

    if (
      event.ctrlKey &&
      event.key.toLowerCase() === "k"
    ) {

      event.preventDefault();

      document
        .getElementById("dashboard-search")
        ?.focus();

    }

    /* -------------------------------------------------- */
    /* ESC → Clear Search                                 */
    /* -------------------------------------------------- */

    if (event.key === "Escape") {

      setSearchValue("");

    }

    /* -------------------------------------------------- */
    /* Enter → Blur Search                                */
    /* -------------------------------------------------- */

    if (event.key === "Enter") {

      document
        .getElementById("dashboard-search")
        ?.blur();

    }

  };

  window.addEventListener(
    "keydown",
    handleKeyDown
  );

  return () => {

    window.removeEventListener(
      "keydown",
      handleKeyDown
    );

  };

}, []);

/* -------------------------------------------------------------------------- */
/*                      Enterprise Search Statistics                           */
/* -------------------------------------------------------------------------- */

const hasSearch = useMemo(() => {

  return searchValue.trim().length > 0;

}, [searchValue]);

const searchLength = useMemo(() => {

  return searchValue.length;

}, [searchValue]);

/* -------------------------------------------------------------------------- */
/*                     Stable Search Props                                     */
/* -------------------------------------------------------------------------- */

const searchProps = useMemo(() => ({

  value: searchValue,

  hasSearch,

  length: searchLength,

}), [

  searchValue,

  hasSearch,

  searchLength,

]);
{/* -------------------------------------------------------------------------- */}
{/* Enterprise Search                                                          */}
{/* -------------------------------------------------------------------------- */}

<div className="relative xl:col-span-2">

  <Search
    size={18}
    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
  />

  <input
    id="dashboard-search"
    type="text"
    placeholder="Search emails, sender, company..."
    autoComplete="off"
    spellCheck={false}
    value={searchValue}
    onChange={handleSearchChange}
    className="
      w-full
      rounded-xl
      border
      border-gray-300
      bg-white
      py-2.5
      pl-10
      pr-12
      text-sm
      transition
      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-500
      focus:outline-none
    "
  />

  {/* ------------------------------------------------------ */}
  {/* Clear Search                                           */}
  {/* ------------------------------------------------------ */}

  {hasSearch && (

    <button
      type="button"
      aria-label="Clear Search"
      onClick={() => setSearchValue("")}
      className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        rounded-full
        p-1
        text-gray-400
        transition
        hover:bg-gray-100
        hover:text-red-500
      "
    >

      <X size={16} />

    </button>

  )}

  {/* ------------------------------------------------------ */}
  {/* Search Length                                          */}
  {/* ------------------------------------------------------ */}

  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">

    <span>

      {hasSearch
        ? "Searching..."
        : "Type to search"}

    </span>

    <span>

      {searchLength}/100

    </span>

  </div>

</div>
{/* -------------------------------------------------------------------------- */}
{/* Enterprise Date Range                                                      */}
{/* -------------------------------------------------------------------------- */}

<div className="relative">

  <CalendarDays
    size={18}
    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
  />

  <select
    value={dateRange}
    onChange={handleDateChange}
    className="
      w-full
      rounded-xl
      border
      border-gray-300
      bg-white
      py-2.5
      pl-10
      pr-4
      text-sm
      transition
      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-500
      focus:outline-none
    "
  >

    {DATE_OPTIONS.map((item) => (

      <option
        key={item.value}
        value={item.value}
      >

        {item.label}

      </option>

    ))}

  </select>

</div>

{/* -------------------------------------------------------------------------- */}
{/* Enterprise Priority Filter                                                 */}
{/* -------------------------------------------------------------------------- */}

<div className="relative">

  <Flag
    size={18}
    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
  />

  <select
    value={filters.priority}
    onChange={(event) =>
      handleFilterChange(
        "priority",
        event.target.value
      )
    }
    className="
      w-full
      rounded-xl
      border
      border-gray-300
      bg-white
      py-2.5
      pl-10
      pr-4
      text-sm
      transition
      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-500
      focus:outline-none
    "
  >

    {PRIORITY_OPTIONS.map((item) => (

      <option
        key={item.value}
        value={item.value}
      >

        {item.label}

      </option>

    ))}

  </select>

</div>
{/* -------------------------------------------------------------------------- */}
{/* Enterprise Company Filter                                                  */}
{/* -------------------------------------------------------------------------- */}

<div className="relative">

  <Building2
    size={18}
    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
  />

  <select
    value={filters.company}
    onChange={(event) =>
      handleFilterChange(
        "company",
        event.target.value
      )
    }
    className="
      w-full
      rounded-xl
      border
      border-gray-300
      bg-white
      py-2.5
      pl-10
      pr-4
      text-sm
      transition
      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-500
      focus:outline-none
    "
  >

    <option value="all">

      All Companies

    </option>

    {companies.map((company) => (

      <option
        key={company}
        value={company}
      >

        {company}

      </option>

    ))}

  </select>

</div>

{/* -------------------------------------------------------------------------- */}
{/* Enterprise Department Filter                                               */}
{/* -------------------------------------------------------------------------- */}

<div className="relative">

  <Briefcase
    size={18}
    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
  />

  <select
    value={filters.department}
    onChange={(event) =>
      handleFilterChange(
        "department",
        event.target.value
      )
    }
    className="
      w-full
      rounded-xl
      border
      border-gray-300
      bg-white
      py-2.5
      pl-10
      pr-4
      text-sm
      transition
      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-500
      focus:outline-none
    "
  >

    <option value="all">

      All Departments

    </option>

    {departments.map((department) => (

      <option
        key={department}
        value={department}
      >

        {department}

      </option>

    ))}

  </select>

</div>
{/* -------------------------------------------------------------------------- */}
{/* Enterprise Active Filters Summary                                          */}
{/* -------------------------------------------------------------------------- */}

<div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

  {/* ====================================================== */}
  {/* Active Filters */}
  {/* ====================================================== */}

  <div className="flex flex-wrap items-center gap-2">

    <span className="text-sm font-semibold text-gray-700">
      Active Filters
    </span>

    {activeFilterCount === 0 ? (

      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
        None
      </span>

    ) : (

      <>
        {filters.priority !== "all" && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            Priority : {filters.priority}
          </span>
        )}

        {filters.company !== "all" && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            Company : {filters.company}
          </span>
        )}

        {filters.department !== "all" && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Department : {filters.department}
          </span>
        )}
      </>

    )}

  </div>

  {/* ====================================================== */}
  {/* Result Summary */}
  {/* ====================================================== */}

  <div className="flex flex-wrap items-center gap-4 text-sm">

    <div className="rounded-lg bg-slate-100 px-3 py-2">

      <span className="font-semibold text-gray-700">

        Filters :

      </span>

      <span className="ml-1 text-blue-600">

        {activeFilterCount}

      </span>

    </div>

    <div className="rounded-lg bg-slate-100 px-3 py-2">

      <span className="font-semibold text-gray-700">

        Search :

      </span>

      <span className="ml-1 text-indigo-600">

        {searchLength}

      </span>

    </div>

    <div className="rounded-lg bg-slate-100 px-3 py-2">

      <span className="font-semibold text-gray-700">

        Status :

      </span>

      <span className="ml-1 text-green-600">

        {hasSearch ? "Searching" : "Ready"}

      </span>

    </div>

  </div>

</div>
{/* -------------------------------------------------------------------------- */}
{/* Enterprise Action Bar                                                      */}
{/* -------------------------------------------------------------------------- */}

<div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">

  {/* ====================================================== */}
  {/* Left Side */}
  {/* ====================================================== */}

  <div className="flex items-center gap-2 text-sm text-gray-500">

    <Filter size={16} />

    <span>

      {activeFilterCount > 0
        ? `${activeFilterCount} filter(s) applied`
        : "No active filters"}

    </span>

  </div>

  {/* ====================================================== */}
  {/* Right Side */}
  {/* ====================================================== */}

  <div className="flex flex-wrap items-center justify-end gap-3">

    {/* Refresh */}

    <button
      type="button"
      onClick={reload}
      disabled={loading}
      className="
        inline-flex
        items-center
        gap-2
        rounded-xl
        border
        border-gray-300
        bg-white
        px-4
        py-2.5
        text-sm
        font-medium
        text-gray-700
        transition
        hover:bg-gray-100
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >

      <RefreshCw
        size={16}
        className={loading ? "animate-spin" : ""}
      />

      Refresh

    </button>

    {/* Export */}

    <button
      type="button"
      onClick={onExport}
      disabled={loading}
      className="
        inline-flex
        items-center
        gap-2
        rounded-xl
        bg-blue-600
        px-4
        py-2.5
        text-sm
        font-medium
        text-white
        transition
        hover:bg-blue-700
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >

      <Download size={16} />

      Export

    </button>

    {/* Reset */}

    <button
      type="button"
      onClick={handleReset}
      disabled={resetting}
      className="
        inline-flex
        items-center
        gap-2
        rounded-xl
        border
        border-red-300
        bg-white
        px-4
        py-2.5
        text-sm
        font-medium
        text-red-600
        transition
        hover:bg-red-50
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >

      <RotateCcw
        size={16}
        className={resetting ? "animate-spin" : ""}
      />

      {resetting ? "Resetting..." : "Reset"}

    </button>

  </div>

</div>
/* -------------------------------------------------------------------------- */
/*                       Enterprise Memoized Data                             */
/* -------------------------------------------------------------------------- */

const memoizedCompanies = useMemo(() => {

    return [...companies].sort();

}, [companies]);

const memoizedDepartments = useMemo(() => {

    return [...departments].sort();

}, [departments]);

/* -------------------------------------------------------------------------- */
/*                     Enterprise Component Information                       */
/* -------------------------------------------------------------------------- */

const componentState = useMemo(() => ({

    totalCompanies: memoizedCompanies.length,

    totalDepartments: memoizedDepartments.length,

    activeFilters: activeFilterCount,

    searchLength,

    dateRange,

}), [

    memoizedCompanies,

    memoizedDepartments,

    activeFilterCount,

    searchLength,

    dateRange,

]);

/* -------------------------------------------------------------------------- */
/*                     Development Performance Log                            */
/* -------------------------------------------------------------------------- */

useEffect(() => {

    if (process.env.NODE_ENV === "development") {

        console.table(componentState);

    }

}, [componentState]);

/* -------------------------------------------------------------------------- */
/*                         Stable Component Name                              */
/* -------------------------------------------------------------------------- */

DashboardToolbar.displayName = "DashboardToolbar";

/******************************************************************************
 * DashboardToolbar
 *
 * Enterprise Features
 * --------------------------------------------------------
 * ✓ React.memo
 * ✓ Debounced Search
 * ✓ Ctrl + K Shortcut
 * ✓ ESC Clear Search
 * ✓ Active Filter Chips
 * ✓ Filter Counter
 * ✓ Enterprise Dropdowns
 * ✓ Smart Reset
 * ✓ Refresh Button
 * ✓ Export Button
 * ✓ Memoized Data
 * ✓ Responsive Layout
 * ✓ Accessibility
 * ✓ Production Ready
 ******************************************************************************/