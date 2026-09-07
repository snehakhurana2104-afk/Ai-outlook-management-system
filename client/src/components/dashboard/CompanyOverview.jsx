import React, { memo } from "react";
import {
  Building2,
  Mail,
  CheckCircle2,
  Clock3,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const CompanyOverview = ({ companies = [] }) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-xl font-semibold text-gray-900">
            Company Overview
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Outlook email statistics grouped by company
          </p>

        </div>

        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">

          View All

          <ChevronRight size={18} />

        </button>

      </div>

      {/* Empty */}

      {companies.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          No company data available.
        </div>
      ) : (
        <div className="space-y-4">

          {companies.map((company) => (

            <div
              key={company.id}
              className="rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:border-blue-200 hover:shadow-md"
            >

              {/* Company Name */}

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-blue-100 p-3">

                    <Building2
                      size={22}
                      className="text-blue-600"
                    />

                  </div>

                  <div>

                    <h3 className="font-semibold text-gray-900">
                      {company.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {company.industry}
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1">

                  <TrendingUp
                    size={16}
                    className="text-green-600"
                  />

                  <span className="text-sm font-medium text-green-700">
                    {company.responseRate}%
                  </span>

                </div>

              </div>

              {/* Stats */}

              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">

                <div className="rounded-xl bg-gray-50 p-4">

                  <div className="flex items-center gap-2">

                    <Mail
                      size={18}
                      className="text-blue-600"
                    />

                    <span className="text-sm text-gray-500">
                      Emails
                    </span>

                  </div>

                  <p className="mt-2 text-2xl font-bold">
                    {company.totalEmails}
                  </p>

                </div>

                <div className="rounded-xl bg-gray-50 p-4">

                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={18}
                      className="text-green-600"
                    />

                    <span className="text-sm text-gray-500">
                      Completed
                    </span>

                  </div>

                  <p className="mt-2 text-2xl font-bold">
                    {company.completed}
                  </p>

                </div>

                <div className="rounded-xl bg-gray-50 p-4">

                  <div className="flex items-center gap-2">

                    <Clock3
                      size={18}
                      className="text-yellow-600"
                    />

                    <span className="text-sm text-gray-500">
                      Pending
                    </span>

                  </div>

                  <p className="mt-2 text-2xl font-bold">
                    {company.pending}
                  </p>

                </div>

                <div className="rounded-xl bg-gray-50 p-4">

                  <div className="flex items-center gap-2">

                    <TrendingUp
                      size={18}
                      className="text-purple-600"
                    />

                    <span className="text-sm text-gray-500">
                      Avg Response
                    </span>

                  </div>

                  <p className="mt-2 text-2xl font-bold">
                    {company.avgResponseTime}
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>
      )}

    </section>
  );
};

CompanyOverview.displayName = "CompanyOverview";

export default memo(CompanyOverview);