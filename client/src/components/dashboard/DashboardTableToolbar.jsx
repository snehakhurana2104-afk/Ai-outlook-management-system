import React, { memo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import {
  RefreshCw,
  Download,
  Columns3,
  Search,
  SlidersHorizontal,
} from "lucide-react";

const DashboardTableToolbar = ({
  search,
  onSearch,
  onRefresh,
  refreshing,
  density,
  onDensityChange,
  onExport,
  onToggleColumns,
  className,
}) => {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4",
        className
      )}
    >
      {/* Left */}
      <div className="flex flex-1 items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            placeholder="Search emails..."
            onChange={(e) => onSearch(e.target.value)}
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              py-2
              pl-10
              pr-4
              text-sm
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
          />
        </div>

        <button
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-300
            px-4
            py-2
            text-sm
            hover:bg-slate-50
          "
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-300
            px-4
            py-2
            text-sm
            hover:bg-slate-50
            disabled:opacity-50
          "
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>

        <select
          value={density}
          onChange={(e) => onDensityChange(e.target.value)}
          className="
            rounded-xl
            border
            border-slate-300
            px-3
            py-2
            text-sm
          "
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="spacious">Spacious</option>
        </select>

        <button
          onClick={onToggleColumns}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-300
            px-4
            py-2
            text-sm
            hover:bg-slate-50
          "
        >
          <Columns3 size={16} />
          Columns
        </button>

        <button
          onClick={onExport}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-blue-600
            px-4
            py-2
            text-sm
            font-medium
            text-white
            hover:bg-blue-700
          "
        >
          <Download size={16} />
          Export
        </button>
      </div>
    </div>
  );
};

DashboardTableToolbar.propTypes = {
  search: PropTypes.string,
  onSearch: PropTypes.func,
  onRefresh: PropTypes.func,
  refreshing: PropTypes.bool,
  density: PropTypes.string,
  onDensityChange: PropTypes.func,
  onExport: PropTypes.func,
  onToggleColumns: PropTypes.func,
  className: PropTypes.string,
};

DashboardTableToolbar.defaultProps = {
  search: "",
  refreshing: false,
  density: "comfortable",
  className: "",
};

export default memo(DashboardTableToolbar);