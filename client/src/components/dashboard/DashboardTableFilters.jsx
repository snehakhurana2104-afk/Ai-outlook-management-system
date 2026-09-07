/******************************************************************************
 * DashboardTableFilters.jsx
 * Part 1
 * Imports + Component Skeleton
 ******************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

const DashboardTableFilters = ({
  filters,
  filterOptions,
  onFilterChange,
  onClearFilters,
}) => {
    /******************************************************************************
 * Part 2
 * Filter Controls
 ******************************************************************************/

return (

<div className="flex flex-wrap items-center gap-3">

    {Object.keys(filterOptions).map((key) => (

        <select
            key={key}
            value={filters[key] || "All"}
            onChange={(e) =>
                onFilterChange(key, e.target.value)
            }
            className="
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                py-2
                text-sm
                focus:border-blue-500
                outline-none
            "
        >

            <option value="All">
                All {key}
            </option>

            {filterOptions[key].map((option) => (

                <option
                    key={option}
                    value={option}
                >
                    {option}
                </option>

            ))}

        </select>

    ))}
        <button
        type="button"
        onClick={onClearFilters}
        className="
            rounded-lg
            bg-red-50
            px-4
            py-2
            text-sm
            font-medium
            text-red-600
            transition
            hover:bg-red-100
        "
    >
        Clear Filters
    </button>

</div>

);
/******************************************************************************
 * Part 4
 * PropTypes + Export
 ******************************************************************************/

DashboardTableFilters.displayName =
    "DashboardTableFilters";

DashboardTableFilters.propTypes = {

    filters: PropTypes.object.isRequired,

    filterOptions: PropTypes.object.isRequired,

    onFilterChange: PropTypes.func.isRequired,

    onClearFilters: PropTypes.func.isRequired,

};
}
export default memo(DashboardTableFilters);