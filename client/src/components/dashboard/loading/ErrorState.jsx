/**************************************************************************
 * ErrorState.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  AlertTriangle,
  RefreshCw,
  Bug,
} from "lucide-react";

const ErrorState = memo(
  ({
    title,
    description,
    error,
    onRetry,
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
          border-red-200
          bg-red-50
          px-8
          py-20
          text-center
        "
      >

        {/* Error Icon */}

        <div
          className="
            flex
            h-20
            w-20
            items-center
            justify-center
            rounded-full
            bg-red-100
            text-red-600
          "
        >
          <AlertTriangle size={40} />
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
          {title}
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
          {description}
        </p>

        {/* Technical Error */}

        {error && (

          <div
            className="
              mt-6
              flex
              max-w-2xl
              items-start
              gap-3
              rounded-xl
              border
              border-red-200
              bg-white
              p-4
              text-left
            "
          >

            <Bug
              size={18}
              className="
                mt-0.5
                flex-shrink-0
                text-red-500
              "
            />

            <pre
              className="
                overflow-x-auto
                whitespace-pre-wrap
                break-all
                text-xs
                text-slate-700
              "
            >
              {typeof error === "string"
                ? error
                : JSON.stringify(
                    error,
                    null,
                    2
                  )}
            </pre>

          </div>

        )}

        {/* Retry */}

        <button
          type="button"
          onClick={onRetry}
          className="
            mt-8
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-red-600
            px-5
            py-3
            text-sm
            font-semibold
            text-white
            transition-all
            hover:bg-red-700
          "
        >

          <RefreshCw size={16} />

          Retry

        </button>

      </div>

    );

  }
);

ErrorState.displayName = "ErrorState";

ErrorState.propTypes = {

  title: PropTypes.string,

  description: PropTypes.string,

  error: PropTypes.oneOfType([

    PropTypes.string,

    PropTypes.object,

  ]),

  onRetry: PropTypes.func,

};

ErrorState.defaultProps = {

  title: "Unable to Load Dashboard",

  description:
    "Something went wrong while loading Outlook emails. Please try again.",

  error: null,

  onRetry: () => {},

};

export default ErrorState;

/**************************************************************************
 * End ErrorState.jsx
 **************************************************************************/
