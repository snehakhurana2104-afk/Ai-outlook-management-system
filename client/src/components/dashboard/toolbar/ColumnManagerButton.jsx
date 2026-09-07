/**************************************************************************
 * ColumnManagerButton.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo, useState } from "react";
import PropTypes from "prop-types";

import {
  Columns3,
  ChevronDown,
  Check,
  RotateCcw,
} from "lucide-react";

const ColumnManagerButton = memo(
  ({
    columns,
    visibleColumns,
    onToggleColumn,
    onReset,
    disabled,
  }) => {

    const [open, setOpen] =
      useState(false);

    const isVisible = (key) =>
      visibleColumns.includes(key);

    return (

      <div className="relative">

        {/* Trigger */}

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

          <Columns3 size={16} />

          Columns

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
              w-72
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-xl
            "
          >

            {/* Header */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-200
                px-4
                py-3
              "
            >

              <span
                className="
                  text-sm
                  font-semibold
                  text-slate-800
                "
              >
                Visible Columns
              </span>

              <button
                type="button"
                onClick={onReset}
                className="
                  inline-flex
                  items-center
                  gap-1
                  text-xs
                  font-medium
                  text-blue-600
                  hover:text-blue-700
                "
              >

                <RotateCcw size={14} />

                Reset

              </button>

            </div>

            {/* Column List */}

            <div
              className="
                max-h-80
                overflow-y-auto
              "
            >

              {columns.map(
                (column) => {

                  const checked =
                    isVisible(
                      column.key
                    );

                  return (

                    <button
                      key={
                        column.key
                      }
                      type="button"
                      onClick={() =>
                        onToggleColumn(
                          column.key
                        )
                      }
                      className="
                        flex
                        w-full
                        items-center
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
                          {
                            column.label
                          }
                        </div>

                        <div
                          className="
                            mt-1
                            text-xs
                            text-slate-500
                          "
                        >
                          Key:{" "}
                          {
                            column.key
                          }
                        </div>

                      </div>

                      {checked && (

                        <Check
                          size={16}
                          className="
                            text-blue-600
                          "
                        />

                      )}

                    </button>

                  );

                }
              )}

            </div>

          </div>

        )}

      </div>

    );

  }
);

ColumnManagerButton.displayName =
  "ColumnManagerButton";

ColumnManagerButton.propTypes = {

  columns: PropTypes.arrayOf(

    PropTypes.shape({

      key: PropTypes.string
        .isRequired,

      label:
        PropTypes.string
          .isRequired,

    })

  ),

  visibleColumns:
    PropTypes.arrayOf(
      PropTypes.string
    ),

  onToggleColumn:
    PropTypes.func,

  onReset:
    PropTypes.func,

  disabled:
    PropTypes.bool,

};

ColumnManagerButton.defaultProps = {

  columns: [],

  visibleColumns: [],

  onToggleColumn:
    () => {},

  onReset:
    () => {},

  disabled: false,

};

export default ColumnManagerButton;

/**************************************************************************
 * End ColumnManagerButton.jsx.
 **************************************************************************/