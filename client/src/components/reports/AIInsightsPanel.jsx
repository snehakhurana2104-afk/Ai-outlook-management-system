// ===========================================================
// AIInsightsPanel.jsx
// Enterprise Executive AI Insights
// ===========================================================

import React, { memo } from "react";
import {
  Trophy,
  Building2,
  AlertTriangle,
  Flame,
  TrendingUp,
  Clock,
  TimerReset,
  Flag,
} from "lucide-react";

import "./ReportsComponents.css";

const AIInsightsPanel = ({ data = {} }) => {
  const insights = [
    {
      title: "Top Performing Employee",
      value: data.topEmployee || "N/A",
      icon: <Trophy size={22} />,
    },
    {
      title: "Top Performing Company",
      value: data.topCompany || "N/A",
      icon: <Building2 size={22} />,
    },
    {
      title: "Highest Pending Workload",
      value: data.highestPendingWorkload || "N/A",
      icon: <AlertTriangle size={22} />,
    },
    {
      title: "Highest Email Volume",
      value: data.highestEmailVolume || "N/A",
      icon: <Flame size={22} />,
    },
    {
      title: "Organization Response Rate",
      value: data.organizationResponseRate || "N/A",
      icon: <TrendingUp size={22} />,
    },
    {
      title: "Average Resolution Time",
      value: data.averageResolutionTime || "N/A",
      icon: <Clock size={22} />,
    },
    {
      title: "Oldest Pending Email",
      value: data.oldestPendingEmail || "N/A",
      icon: <TimerReset size={22} />,
    },
    {
      title: "Critical High Priority Emails",
      value: data.criticalHighPriorityEmails || "N/A",
      icon: <Flag size={22} />,
    },
  ];

  return (
    <section className="ai-insights-grid">
      {insights.map((item, index) => (
        <div className="insight-card" key={index}>
          <div className="summary-icon">
            {item.icon}
          </div>

          <div className="insight-content">
            <p className="insight-title">
              {item.title}
            </p>

            <h3 className="insight-value">
              {item.value}
            </h3>
          </div>
        </div>
      ))}
    </section>
  );
};

export default memo(AIInsightsPanel);