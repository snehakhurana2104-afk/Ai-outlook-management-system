/******************************************************************************
 * DashboardTableMetrics.jsx
 * Part 1
 * Imports + Component Skeleton
 ******************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  Mail,
  Filter,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const DashboardTableMetrics = ({ metrics }) => {
    /******************************************************************************
 * Part 2
 * Metrics Cards
 ******************************************************************************/

const cards = [
  {
    title: "Total Emails",
    value: metrics.totalEmails,
    icon: Mail,
    color: "text-blue-600",
  },
  {
    title: "Filtered",
    value: metrics.filteredEmails,
    icon: Filter,
    color: "text-green-600",
  },
  {
    title: "Selected",
    value: metrics.selectedEmails,
    icon: CheckSquare,
    color: "text-indigo-600",
  },
  {
    title: "High Priority",
    value: metrics.highPriority,
    icon: AlertTriangle,
    color: "text-red-600",
  },
  {
    title: "Response Rate",
    value: `${metrics.responseRate}%`,
    icon: TrendingUp,
    color: "text-emerald-600",
  },
];

return (

<div className="grid grid-cols-5 gap-4">

  {cards.map((card) => {

    const Icon = card.icon;

    return (

      <div
        key={card.title}
        className="
          rounded-xl
          border
          border-slate-200
          bg-white
          p-4
          shadow-sm
        "
      >

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs uppercase text-slate-500">
              {card.title}
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {card.value}
            </h3>

          </div>

          <Icon
            size={26}
            className={card.color}
          />

        </div>

      </div>

    );

  })}

</div>

);
/******************************************************************************
 * Part 3
 * PropTypes + Export
 ******************************************************************************/

DashboardTableMetrics.displayName =
  "DashboardTableMetrics";

DashboardTableMetrics.propTypes = {
  metrics: PropTypes.shape({
    totalEmails: PropTypes.number,
    filteredEmails: PropTypes.number,
    selectedEmails: PropTypes.number,
    highPriority: PropTypes.number,
    responseRate: PropTypes.number,
  }).isRequired,
};
}
export default memo(DashboardTableMetrics);