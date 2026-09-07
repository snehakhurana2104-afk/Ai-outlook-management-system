/**************************************************************************
 * LoadingOverlay.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  Loader2,
  Database,
  Brain,
} from "lucide-react";

const LoadingOverlay = memo(
  ({
    visible,
    title,
    description,
    fullscreen,
  }) => {

    if (!visible) return null;

    return (

      <div
        className={`
          ${
            fullscreen
              ? "fixed inset-0 z-[9999]"
              : "absolute inset-0 z-50 rounded-2xl"
          }
          flex
          items-center
          justify-center
          bg-white/80
          backdrop-blur-sm
        `}
      >

        <div
          className="
            flex
            w-[360px]
            flex-col
            items-center
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-8
            shadow-2xl
          "
        >

          {/* Animated Loader */}

          <div className="relative">

            <Loader2
              size={48}
              className="
                animate-spin
                text-blue-600
              "
            />

            <div
              className="
                absolute
                -bottom-1
                -right-1
                rounded-full
                bg-white
                p-1
              "
            >
              <Database
                size={16}
                className="text-slate-500"
              />
            </div>

          </div>

          {/* Title */}

          <h3
            className="
              mt-6
              text-lg
              font-bold
              text-slate-900
            "
          >
            {title}
          </h3>

          {/* Description */}

          <p
            className="
              mt-2
              text-center
              text-sm
              leading-6
              text-slate-500
            "
          >
            {description}
          </p>

          {/* Progress Indicator */}

          <div
            className="
              mt-6
              h-2
              w-full
              overflow-hidden
              rounded-full
              bg-slate-200
            "
          >

            <div
              className="
                h-full
                w-1/3
                animate-pulse
                rounded-full
                bg-blue-600
              "
            />

          </div>

          {/* AI Processing */}

          <div
            className="
              mt-6
              flex
              items-center
              gap-2
              rounded-full
              bg-violet-50
              px-4
              py-2
            "
          >

            <Brain
              size={16}
              className="
                text-violet-600
                animate-pulse
              "
            />

            <span
              className="
                text-xs
                font-medium
                text-violet-700
              "
            >
              AI is analyzing Outlook data...
            </span>

          </div>

        </div>

      </div>

    );

  }
);

LoadingOverlay.displayName =
  "LoadingOverlay";

LoadingOverlay.propTypes = {

  visible: PropTypes.bool,

  title: PropTypes.string,

  description: PropTypes.string,

  fullscreen: PropTypes.bool,

};

LoadingOverlay.defaultProps = {

  visible: false,

  title: "Loading Dashboard",

  description:
    "Fetching Microsoft Outlook emails and preparing enterprise analytics.",

  fullscreen: false,

};

export default LoadingOverlay;

/**************************************************************************
 * End LoadingOverlay.jsx
 *
 * ✅ Part 2C (Enterprise Loading Components) Complete
 **************************************************************************/