import React, { memo } from "react";
import {
  Mail,
  Clock3,
  Building2,
  ChevronRight,
} from "lucide-react";

const priorityClasses = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

const RecentActivity = ({ emails = [] }) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="mb-5 flex items-center justify-between">

        <div>

          <h2 className="text-xl font-semibold text-gray-900">
            Recent Emails
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Latest Outlook activity
          </p>

        </div>

        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">

          View All

          <ChevronRight size={18} />

        </button>

      </div>

      <div className="space-y-4">

        {emails.length === 0 ? (

          <div className="py-10 text-center text-gray-500">
            No recent emails found.
          </div>

        ) : (

          emails.map((email) => (

            <div
              key={email.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50 lg:flex-row lg:items-center lg:justify-between"
            >

              <div className="flex items-start gap-4">

                <div className="rounded-lg bg-blue-100 p-3">

                  <Mail
                    size={20}
                    className="text-blue-600"
                  />

                </div>

                <div>

                  <h3 className="font-semibold text-gray-900">
                    {email.subject}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {email.sender}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-4">

                    <div className="flex items-center gap-1 text-sm text-gray-500">

                      <Building2 size={16} />

                      {email.company}

                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-500">

                      <Clock3 size={16} />

                      {email.time}

                    </div>

                  </div>

                </div>

              </div>

              <div>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    priorityClasses[email.priority] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {email.priority}
                </span>

              </div>

            </div>

          ))

        )}

      </div>

    </section>
  );
};

RecentActivity.displayName = "RecentActivity";

export default memo(RecentActivity);