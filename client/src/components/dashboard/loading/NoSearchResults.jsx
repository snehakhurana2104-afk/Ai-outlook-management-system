/**************************************************************************
 * NoSearchResults.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  SearchX,
  RotateCcw,
  FilterX,
} from "lucide-react";

const NoSearchResults = memo(
  ({
    searchTerm,
    onClearSearch,
    onClearFilters,
  }) => {

    return (

      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-slate-300
          bg-white
          px-8
          py-20
          text-center
        "
      >

        {/* Icon */}

        <div
          className="
            flex
            h-20
            w-20
            items-center
            justify-center
            rounded-full
            bg-amber-50
            text-amber-600
          "
        >
          <SearchX size={40} />
        </div>

        {/* Title */}

        <h2
          className="
            mt-6
            text-2xl
            font-bold
            text-slate-900
          "
        >
          No Matching Emails
        </h2>

        {/* Description */}

        <p
          className="
            mt-3
            max-w-lg
            text-sm
            leading-6
            text-slate-600
          "
        >

          {searchTerm ? (
            <>
              No emails matched
              <span className="font-semibold text-slate-900">
                {" "}
                "{searchTerm}"
              </span>.
              Try another keyword or clear the filters.
            </>
          ) : (
            <>
              No emails match the current filters.
              Try clearing filters to see more results.
            </>
          )}

        </p>

        {/* Actions */}

        <div
          className="
            mt-8
            flex
            flex-wrap
            items-center
            justify-center
            gap-3
          "
        >

          <button
            type="button"
            onClick={onClearSearch}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-blue-600
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition-all
              hover:bg-blue-700
            "
          >
            <RotateCcw size={16} />

            Clear Search

          </button>

          <button
            type="button"
            onClick={onClearFilters}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-slate-200
              px-5
              py-3
              text-sm
              font-medium
              text-slate-700
              transition-all
              hover:bg-slate-100
            "
          >
            <FilterX size={16} />

            Clear Filters

          </button>

        </div>

      </div>

    );

  }
);

NoSearchResults.displayName =
  "NoSearchResults";

NoSearchResults.propTypes = {

  searchTerm: PropTypes.string,

  onClearSearch: PropTypes.func,

  onClearFilters: PropTypes.func,

};

NoSearchResults.defaultProps = {

  searchTerm: "",

  onClearSearch: () => {},

  onClearFilters: () => {},

};

export default NoSearchResults;

/**************************************************************************
 * End NoSearchResults.jsx
 **************************************************************************/