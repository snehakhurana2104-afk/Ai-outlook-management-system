import React, { memo } from "react";
import {
  Timer,
  Target,
  TrendingUp,
  CheckCircle2,
  Activity,
  BrainCircuit,
} from "lucide-react";

const metrics = [
  {
    key: "averageResponseTime",
    title: "Avg Response Time",
    icon: Timer,
    color: "blue",
    suffix: " hrs",
  },
  {
    key: "completionRate",
    title: "Completion Rate",
    icon: CheckCircle2,
    color: "green",
    suffix: "%",
  },
  {
    key: "slaCompliance",
    title: "SLA Compliance",
    icon: Target,
    color: "purple",
    suffix: "%",
  },
  {
    key: "productivityScore",
    title: "Productivity Score",
    icon: TrendingUp,
    color: "yellow",
    suffix: "%",
  },
  {
    key: "activeTasks",
    title: "Active Tasks",
    icon: Activity,
    color: "red",
    suffix: "",
  },
  {
    key: "aiAccuracy",
    title: "AI Accuracy",
    icon: BrainCircuit,
    color: "indigo",
    suffix: "%",
  },
];

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
  },
};

const ProductivityCard = ({ productivity = {} }) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-semibold text-gray-900">
          Productivity Overview
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Live performance and AI productivity metrics
        </p>

      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {metrics.map((metric) => {
          const Icon = metric.icon;
          const theme = colorMap[metric.color];

          return (
            <div
              key={metric.key}
              className="rounded-xl border border-gray-100 p-4 transition-all duration-300 hover:shadow-md hover:border-blue-200"
            >
              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    {metric.title}
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-gray-900">
                    {productivity[metric.key] ?? 0}
                    {metric.suffix}
                  </h3>

                </div>

                <div
                  className={`rounded-xl p-3 ${theme.bg}`}
                >
                  <Icon
                    size={24}
                    className={theme.text}
                  />
                </div>

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
};

ProductivityCard.displayName = "ProductivityCard";

export default memo(ProductivityCard);