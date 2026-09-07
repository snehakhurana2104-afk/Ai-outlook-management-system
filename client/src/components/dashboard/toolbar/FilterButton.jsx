/**************************************************************************
 * FilterButton.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo, useState } from "react";
import PropTypes from "prop-types";

import {
  Filter,
  Check,
  ChevronDown,
} from "lucide-react";

const FilterButton = memo(
  ({
    filters,
    activeFilters,
    onChange,
    label,
  }) => {

    const [open, setOpen] =
      useState(false);

    const handleSelect = (value) => {

      onChange(value);

      setOpen(false);

    };

    return (

      <div className="relative">

        {/* Button */}

        <button
          type="button"
          onClick={() =>
            setOpen(!open)
          }
          className={`
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            px-4
            py-2.5
            text-sm
            font-medium
            transition-all

            ${
              activeFilters.length
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }
          `}
        >

          <Filter size={16} />

          {label}

          {activeFilters.length > 0 && (

            <span
              className="
                rounded-full
                bg-blue-600
                px-2
                py-0.5
                text-xs
                font-semibold
                text-white
              "
            >
              {activeFilters.length}
            </span>

          )}

          <ChevronDown size={16} />

        </button>

        {/* Dropdown */}

        {open && (

          <div
            className="
              absolute
              right-0
              z-50
              mt-2
              w-60
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-xl
            "
          >

            {filters.map((item) => {

              const selected =
                activeFilters.includes(item.value);

              return (

                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    handleSelect(item.value)
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    px-4
                    py-3
                    text-sm
                    text-slate-700
                    transition
                    hover:bg-slate-50
                  "
                >

                  <span>

                    {item.label}

                  </span>

                  {selected && (

                    <Check
                      size={16}
                      className="
                        text-blue-600
                      "
                    />

                  )}

                </button>

              );

            })}

          </div>

        )}

      </div>

    );

  }
);

FilterButton.displayName =
  "FilterButton";

FilterButton.propTypes = {

  filters: PropTypes.arrayOf(

    PropTypes.shape({

      label: PropTypes.string,

      value: PropTypes.string,

    })

  ),

  activeFilters:
    PropTypes.arrayOf(
      PropTypes.string
    ),

  onChange: PropTypes.func,

  label: PropTypes.string,

};

FilterButton.defaultProps = {

  filters: [],

  activeFilters: [],

  onChange: () => {},

  label: "Filters",

};

export default FilterButton;

/**************************************************************************
 * End FilterButton.jsx
 **************************************************************************/