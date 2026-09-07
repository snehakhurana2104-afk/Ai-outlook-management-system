/**************************************************************************
 * TableSkeleton.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

const TableSkeleton = memo(
  ({
    rows = 8,
    columns = 8,
  }) => {

    return (

      <div className="w-full animate-pulse">

        {/* Header */}

        <div
          className="
            grid
            border-b
            border-slate-200
            bg-slate-50
            py-4
          "
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
          }}
        >

          {Array.from({
            length: columns,
          }).map((_, index) => (

            <div
              key={index}
              className="px-4"
            >

              <div
                className="
                  h-4
                  w-24
                  rounded
                  bg-slate-200
                "
              />

            </div>

          ))}

        </div>

        {/* Rows */}

        {Array.from({
          length: rows,
        }).map((_, rowIndex) => (

          <div
            key={rowIndex}
            className="
              grid
              border-b
              border-slate-100
              py-4
            "
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
            }}
          >

            {Array.from({
              length: columns,
            }).map((_, columnIndex) => (

              <div
                key={columnIndex}
                className="px-4"
              >

                <div
                  className="
                    h-4
                    rounded
                    bg-slate-200
                  "
                  style={{
                    width: `${
                      50 +
                      ((columnIndex * 17) % 40)
                    }%`,
                  }}
                />

              </div>

            ))}

          </div>

        ))}

      </div>

    );

  }
);

TableSkeleton.displayName =
  "TableSkeleton";

TableSkeleton.propTypes = {

  rows: PropTypes.number,

  columns: PropTypes.number,

};

TableSkeleton.defaultProps = {

  rows: 8,

  columns: 8,

};

export default TableSkeleton;