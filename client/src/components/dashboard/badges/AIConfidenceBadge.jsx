/**************************************************************************
 * AIConfidenceBadge.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Brain,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import { getAIConfidenceColor } from "../../utils/dashboardTableHelpers";

const AIConfidenceBadge = memo(({ confidence }) => {

  const score = Number(confidence ?? 0);

  const colors = getAIConfidenceColor(score);

  const Icon = (() => {

    if (score >= 90) return ShieldCheck;

    if (score >= 75) return CheckCircle2;

    if (score >= 50) return AlertTriangle;

    return XCircle;

  })();

  return (

    <div
      className="
        flex
        items-center
        gap-3
      "
    >

      {/* Badge */}

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

          colors.color,

          colors.border

        )}
      >

        <Brain
          size={14}
          className="opacity-80"
        />

        <Icon size={14} />

        {score}%

      </span>

      {/* Progress */}

      <div
        className="
          h-2
          w-20
          overflow-hidden
          rounded-full
          bg-slate-200
        "
      >

        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            colors.progress
          )}
          style={{
            width: `${Math.min(Math.max(score, 0), 100)}%`,
          }}
        />

      </div>

      {/* Label */}

      <span
        className={clsx(
          "text-xs font-medium",
          colors.color
        )}
      >
        {colors.label}
      </span>

    </div>

  );

});

AIConfidenceBadge.displayName = "AIConfidenceBadge";

AIConfidenceBadge.propTypes = {

  confidence: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]),

};

AIConfidenceBadge.defaultProps = {

  confidence: 0,

};

export default AIConfidenceBadge;

/**************************************************************************
 * End AIConfidenceBadge.jsx
 **************************************************************************/