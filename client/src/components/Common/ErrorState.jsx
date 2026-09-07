import React, { memo } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
} from "lucide-react";

const ErrorState = ({
  title = "Something went wrong",
  message = "We couldn't load the requested data. Please try again.",
  onRetry,
  onGoHome,
  retryLabel = "Retry",
  homeLabel = "Go Home",
  showHomeButton = false,
  icon = AlertTriangle,
}) => {
  const Icon = icon;

  return (
    <div className="flex min-h-[350px] w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8">

      <div className="max-w-lg text-center">

        {/* Icon */}

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">

          <Icon
            size={42}
            className="text-red-600"
          />

        </div>

        {/* Title */}

        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>

        {/* Message */}

        <p className="mt-3 text-gray-600 leading-7">
          {message}
        </p>

        {/* Buttons */}

        <div className="mt-8 flex flex-wrap justify-center gap-4">

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-all hover:bg-blue-700"
            >
              <RefreshCw size={18} />

              {retryLabel}
            </button>
          )}

          {showHomeButton && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-all hover:bg-gray-100"
            >
              <Home size={18} />

              {homeLabel}
            </button>
          )}

        </div>

      </div>

    </div>
  );
};

ErrorState.displayName = "ErrorState";

export default memo(ErrorState);