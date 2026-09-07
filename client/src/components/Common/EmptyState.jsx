import React, { memo } from "react";
import {
  Inbox,
  SearchX,
  FolderOpen,
  Mail,
  ClipboardList,
  Building2,
  BarChart3,
  Plus,
} from "lucide-react";

const iconMap = {
  inbox: Inbox,
  search: SearchX,
  folder: FolderOpen,
  mail: Mail,
  task: ClipboardList,
  company: Building2,
  analytics: BarChart3,
};

const EmptyState = ({
  title = "Nothing to Display",
  description = "No data is available at the moment.",
  type = "folder",

  actionLabel,
  onAction,

  icon,

  compact = false,
}) => {
  const Icon = icon || iconMap[type] || FolderOpen;

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white text-center shadow-sm ${
        compact ? "p-8" : "min-h-[380px] p-10"
      }`}
    >
      {/* Icon */}

      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">

        <Icon
          size={46}
          className="text-blue-600"
        />

      </div>

      {/* Title */}

      <h2 className="text-2xl font-semibold text-gray-900">
        {title}
      </h2>

      {/* Description */}

      <p className="mt-3 max-w-md text-gray-500 leading-7">
        {description}
      </p>

      {/* Action */}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-8 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />

          {actionLabel}
        </button>
      )}
    </div>
  );
};

EmptyState.displayName = "EmptyState";

export default memo(EmptyState);