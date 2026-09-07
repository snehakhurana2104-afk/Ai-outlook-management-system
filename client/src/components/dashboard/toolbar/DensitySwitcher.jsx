/**************************************************************************
 * DensitySwitcher.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo, useState } from "react";
import PropTypes from "prop-types";

import {
  Rows3,
  Check,
  ChevronDown,
} from "lucide-react";

/**************************************************************************
 * Density Options
 **************************************************************************/

const DENSITY_OPTIONS = [
  {
    value: "compact",
    label: "Compact",
    description: "Maximum rows",
  },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "Balanced spacing",
  },
  {
    value: "spacious",
    label: "Spacious",
    description: "Large row height",
  },
];

const DensitySwitcher = memo(
  ({
    value,
    onChange,
    disabled,
  }) => {

    const [open, setOpen] =
      useState(false);

    const handleSelect = (density) => {

      onChange(density);

      setOpen(false);

    };

    const selected =
      DENSITY_OPTIONS.find(
        (item) =>
          item.value === value
      ) || DENSITY_OPTIONS[1];

    return (

      <div className="relative">

        {/* Button */}

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            setOpen((prev) => !prev)
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
              disabled
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            }
          `}
        >

          <Rows3 size={16} />

          {selected.label}

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
              w-64
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-xl
            "
          >

            {DENSITY_OPTIONS.map(
              (option) => {

                const active =
                  option.value ===
                  value;

                return (

                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={() =>
                      handleSelect(
                        option.value
                      )
                    }
                    className="
                      flex
                      w-full
                      items-start
                      justify-between
                      px-4
                      py-3
                      text-left
                      transition
                      hover:bg-slate-50
                    "
                  >

                    <div>

                      <div
                        className="
                          text-sm
                          font-medium
                          text-slate-800
                        "
                      >
                        {option.label}
                      </div>

                      <div
                        className="
                          mt-1
                          text-xs
                          text-slate-500
                        "
                      >
                        {
                          option.description
                        }
                      </div>

                    </div>

                    {active && (

                      <Check
                        size={16}
                        className="
                          mt-1
                          text-blue-600
                        "
                      />

                    )}

                  </button>

                );

              }
            )}

          </div>

        )}

      </div>

    );

  }
);

DensitySwitcher.displayName =
  "DensitySwitcher";

DensitySwitcher.propTypes = {

  value: PropTypes.oneOf([

    "compact",

    "comfortable",

    "spacious",

  ]),

  onChange:
    PropTypes.func,

  disabled:
    PropTypes.bool,

};

DensitySwitcher.defaultProps = {

  value:
    "comfortable",

  onChange:
    () => {},

  disabled:
    false,

};

export default DensitySwitcher;

/**************************************************************************
 * End DensitySwitcher.jsx
 **************************************************************************/