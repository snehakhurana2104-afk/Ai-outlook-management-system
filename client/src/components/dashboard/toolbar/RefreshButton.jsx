/**************************************************************************
 * RefreshButton.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const RefreshButton = memo(
  ({
    loading,
    lastUpdated,
    onRefresh,
    disabled,
    success,
  }) => {

    const formatLastUpdated = (date) => {

      if (!date) return "Never";

      try {

        return new Intl.DateTimeFormat(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        ).format(new Date(date));

      } catch {

        return "Unknown";

      }

    };

    return (

      <div className="flex items-center gap-3">

        {/* Refresh Button */}

        <button
          type="button"
          disabled={loading || disabled}
          onClick={onRefresh}
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
              loading
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            }
          `}
        >

          <RefreshCw
            size={16}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}

        </button>

        {/* Status */}

        <div
          className="
            flex
            flex-col
            text-xs
          "
        >

          <div
            className="
              flex
              items-center
              gap-1
            "
          >

            {success ? (

              <CheckCircle2
                size={14}
                className="
                  text-emerald-500
                "
              />

            ) : (

              <AlertCircle
                size={14}
                className="
                  text-slate-400
                "
              />

            )}

            <span
              className="
                text-slate-600
              "
            >
              Last Sync
            </span>

          </div>

          <span
            className="
              font-medium
              text-slate-800
            "
          >
            {formatLastUpdated(lastUpdated)}
          </span>

        </div>

      </div>

    );

  }
);

RefreshButton.displayName =
  "RefreshButton";

RefreshButton.propTypes = {

  loading: PropTypes.bool,

  disabled: PropTypes.bool,

  success: PropTypes.bool,

  lastUpdated: PropTypes.oneOfType([

    PropTypes.string,

    PropTypes.instanceOf(Date),

  ]),

  onRefresh: PropTypes.func,

};

RefreshButton.defaultProps = {

  loading: false,

  disabled: false,

  success: true,

  lastUpdated: null,

  onRefresh: () => {},

};

export default RefreshButton;

/**************************************************************************
 * End RefreshButton.jsx
 **************************************************************************/