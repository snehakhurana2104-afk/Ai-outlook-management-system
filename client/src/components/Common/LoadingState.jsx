import React, { memo } from "react";

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
  />
);

const LoadingState = ({
  variant = "cards",
  rows = 4,
  columns = 4,
}) => {
  // =====================================================
  // KPI Cards
  // =====================================================

  if (variant === "cards") {
    return (
      <div className={`grid gap-6 grid-cols-${columns}`}>
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">

              <div className="flex-1">

                <Skeleton className="mb-3 h-4 w-28" />

                <Skeleton className="h-8 w-20" />

              </div>

              <Skeleton className="h-14 w-14 rounded-xl" />

            </div>
          </div>
        ))}
      </div>
    );
  }

  // =====================================================
  // Chart
  // =====================================================

  if (variant === "chart") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        <Skeleton className="mb-6 h-6 w-56" />

        <Skeleton className="h-80 w-full rounded-xl" />

      </div>
    );
  }

  // =====================================================
  // List
  // =====================================================

  if (variant === "list") {
    return (
      <div className="space-y-4">

        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex gap-4">

              <Skeleton className="h-12 w-12 rounded-xl" />

              <div className="flex-1">

                <Skeleton className="mb-3 h-5 w-56" />

                <Skeleton className="mb-2 h-4 w-40" />

                <Skeleton className="h-4 w-72" />

              </div>

            </div>
          </div>
        ))}

      </div>
    );
  }

  // =====================================================
  // Table
  // =====================================================

  if (variant === "table") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        <Skeleton className="mb-6 h-6 w-48" />

        <div className="space-y-4">

          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-6 gap-4"
            >
              {Array.from({ length: 6 }).map((__, cell) => (
                <Skeleton
                  key={cell}
                  className="h-5 w-full"
                />
              ))}
            </div>
          ))}

        </div>

      </div>
    );
  }

  // =====================================================
  // Dashboard Section
  // =====================================================

  if (variant === "dashboard") {
    return (
      <div className="space-y-6">

        <Skeleton className="h-16 w-full rounded-2xl" />

        <div className="grid grid-cols-4 gap-6">

          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-36 rounded-2xl"
            />
          ))}

        </div>

        <Skeleton className="h-96 rounded-2xl" />

      </div>
    );
  }

  // =====================================================
  // Default
  // =====================================================

  return (
    <div className="flex items-center justify-center py-20">
      <Skeleton className="h-12 w-64" />
    </div>
  );
};

LoadingState.displayName = "LoadingState";

export default memo(LoadingState);