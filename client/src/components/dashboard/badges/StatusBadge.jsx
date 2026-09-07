/**************************************************************************
 * StatusBadge.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Clock3,
  CheckCircle2,
  Archive,
  Trash2,
  Loader2,
} from "lucide-react";

import { getStatusColor } from "../../utils/dashboardTableHelpers";

const StatusBadge = memo(({ status }) => {

  const colors = getStatusColor(status);

  const Icon = (() => {

    switch ((status || "").toLowerCase()) {

      case "pending":
        return Clock3;

      case "replied":
        return CheckCircle2;

      case "in progress":
        return Loader2;

      case "archived":
        return Archive;

      case "deleted":
        return Trash2;

      default:
        return Clock3;

    }

  })();

  return (

    <span
      className={clsx(

        "inline-flex",

        "items-center",

        "gap-2",

        "rounded-full",

        "border",

        "px-3",

        "py-1.5",

        "text-xs",

        "font-semibold",

        colors.bg,

        colors.text,

        colors.border

      )}
    >

      <Icon
        size={14}
        className={clsx(
          status === "In Progress" &&
            "animate-spin"
        )}
      />

      {status || "Unknown"}

    </span>

  );

});

StatusBadge.displayName = "StatusBadge";

StatusBadge.propTypes = {

  status: PropTypes.string,

};

StatusBadge.defaultProps = {

  status: "Pending",

};

export default StatusBadge;