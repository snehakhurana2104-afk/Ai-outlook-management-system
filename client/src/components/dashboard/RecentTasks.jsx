import React, { memo } from "react";
import {
  ClipboardCheck,
  CalendarDays,
  User,
  ChevronRight,
} from "lucide-react";

const statusClasses = {
  Completed: "bg-green-100 text-green-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Overdue: "bg-red-100 text-red-700",
};

const priorityClasses = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

const RecentTasks = ({ tasks = [] }) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="mb-5 flex items-center justify-between">

        <div>

          <h2 className="text-xl font-semibold text-gray-900">
            Recent Tasks
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Latest AI-generated and assigned tasks
          </p>

        </div>

        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">

          View All

          <ChevronRight size={18} />

        </button>

      </div>

      <div className="space-y-4">

        {tasks.length === 0 ? (

          <div className="py-10 text-center text-gray-500">
            No recent tasks available.
          </div>

        ) : (

          tasks.map((task) => (

            <div
              key={task.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50 lg:flex-row lg:items-center lg:justify-between"
            >

              <div className="flex items-start gap-4">

                <div className="rounded-lg bg-indigo-100 p-3">

                  <ClipboardCheck
                    size={20}
                    className="text-indigo-600"
                  />

                </div>

                <div>

                  <h3 className="font-semibold text-gray-900">
                    {task.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">

                    <div className="flex items-center gap-1">
                      <User size={16} />
                      {task.assignedTo}
                    </div>

                    <div className="flex items-center gap-1">
                      <CalendarDays size={16} />
                      {task.dueDate}
                    </div>

                  </div>

                </div>

              </div>

              <div className="flex flex-wrap gap-2">

                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    priorityClasses[task.priority] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {task.priority}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    statusClasses[task.status] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {task.status}
                </span>

              </div>

            </div>

          ))

        )}

      </div>

    </section>
  );
};

RecentTasks.displayName = "RecentTasks";

export default memo(RecentTasks);