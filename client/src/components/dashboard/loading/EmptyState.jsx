/**************************************************************************
 * EmptyState.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  Inbox,
  RefreshCw,
  MailPlus,
} from "lucide-react";

const EmptyState = memo(
  ({
    title,
    description,
    buttonText,
    onRefresh,
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
            bg-blue-50
            text-blue-600
          "
        >
          <Inbox size={38} />
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
            max-w-md
            text-sm
            leading-6
            text-slate-500
          "
        >
          {description}
        </p>

        {/* Actions */}

        <div
          className="
            mt-8
            flex
            items-center
            gap-3
          "
        >

          <button
            type="button"
            onClick={onRefresh}
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
            <RefreshCw size={16} />

            {buttonText}

          </button>

          <button
            type="button"
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
            <MailPlus size={16} />

            Compose

          </button>

        </div>

      </div>

    );

  }
);

EmptyState.displayName =
  "EmptyState";

EmptyState.propTypes = {

  title: PropTypes.string,

  description: PropTypes.string,

  buttonText: PropTypes.string,

  onRefresh: PropTypes.func,

};

EmptyState.defaultProps = {

  title: "No Emails Found",

  description:
    "Your Outlook inbox doesn't contain any emails matching the current view.",

  buttonText: "Refresh Inbox",

  onRefresh: () => {},

};

export default EmptyState;