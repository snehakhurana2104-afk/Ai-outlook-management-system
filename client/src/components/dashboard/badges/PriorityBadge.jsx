/**************************************************************************
 * PriorityBadge.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

import {
  AlertTriangle,
  AlertCircle,
  MinusCircle,
  CheckCircle2,
} from "lucide-react";

import { getPriorityColor } from "../../utils/dashboardTableHelpers";

const PriorityBadge = memo(({ priority }) => {
  const colors = getPriorityColor(priority);

  const Icon =
    priority === "Critical"
      ? AlertCircle
      : priority === "High"
      ? AlertTriangle
      : priority === "Medium"
      ? MinusCircle
      : CheckCircle2;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2",
        "rounded-full",
        "border",
        "px-3 py-1.5",
        "text-xs font-semibold",
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      <span
        className={clsx(
          "h-2 w-2 rounded-full",
          colors.dot
        )}
      />

      <Icon size={14} />

      {priority || "Unknown"}
    </span>
  );
});

PriorityBadge.displayName = "PriorityBadge";

PriorityBadge.propTypes = {
  priority: PropTypes.string,
};

PriorityBadge.defaultProps = {
  priority: "Low",
};

export default PriorityBadge;