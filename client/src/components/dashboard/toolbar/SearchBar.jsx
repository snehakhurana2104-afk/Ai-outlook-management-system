/**************************************************************************
 * SearchBar.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  Search,
  X,
} from "lucide-react";

const SearchBar = memo(
  ({
    value,
    placeholder,
    onChange,
    onClear,
    disabled,
    autoFocus,
  }) => {
    return (
      <div
        className="
          relative
          w-full
          max-w-md
        "
      >
        {/* Search Icon */}

        <Search
          size={18}
          className="
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-slate-400
            pointer-events-none
          "
        />

        {/* Input */}

        <input
          type="text"
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            py-2.5
            pl-10
            pr-10
            text-sm
            text-slate-800
            placeholder:text-slate-400
            outline-none
            transition-all
            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-100
            disabled:cursor-not-allowed
            disabled:bg-slate-100
          "
        />

        {/* Clear Button */}

        {value && (
          <button
            type="button"
            onClick={onClear}
            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              rounded-full
              p-1
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";

SearchBar.propTypes = {
  value: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  onClear: PropTypes.func,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
};

SearchBar.defaultProps = {
  value: "",
  placeholder: "Search emails, sender, company...",
  onChange: () => {},
  onClear: () => {},
  disabled: false,
  autoFocus: false,
};

export default SearchBar;
