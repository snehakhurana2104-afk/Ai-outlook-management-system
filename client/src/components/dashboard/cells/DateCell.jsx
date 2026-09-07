/**************************************************************************
 * DateCell.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  Calendar,
  Clock3,
} from "lucide-react";

import {
  formatDate,
  formatTime,
  formatRelativeTime,
} from "../../utils/dashboardTableHelpers";

const DateCell = memo(
  ({
    receivedAt,
    showRelative = true,
  }) => {

    if (!receivedAt) {

      return (
        <span className="text-sm text-slate-400">
          —
        </span>
      );

    }

    return (

      <div className="min-w-0">

        {/* Date */}

        <div className="flex items-center gap-2">

          <Calendar
            size={14}
            className="text-slate-400 flex-shrink-0"
          />

          <span
            className="
              text-sm
              font-medium
              text-slate-800
              truncate
            "
          >
            {formatDate(receivedAt)}
          </span>

        </div>

        {/* Time + Relative */}

        <div
          className="
            mt-1
            flex
            items-center
            gap-2
            text-xs
            text-slate-500
          "
        >

          <Clock3
            size={12}
            className="text-slate-400"
          />

          <span>
            {formatTime(receivedAt)}
          </span>

          {showRelative && (

            <>
              <span>•</span>

              <span>
                {formatRelativeTime(receivedAt)}
              </span>
            </>

          )}

        </div>

      </div>

    );

  }
);

DateCell.displayName = "DateCell";

DateCell.propTypes = {

  receivedAt: PropTypes.oneOfType([

    PropTypes.string,

    PropTypes.instanceOf(Date),

  ]),

  showRelative: PropTypes.bool,

};

DateCell.defaultProps = {

  receivedAt: null,

  showRelative: true,

};

export default DateCell;

/**************************************************************************
 * End DateCell.jsx
 **************************************************************************/
