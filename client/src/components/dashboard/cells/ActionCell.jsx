/**************************************************************************
 * ActionCell.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo, useState } from "react";
import PropTypes from "prop-types";

import {
  Reply,
  Sparkles,
  Archive,
  Trash2,
  MoreHorizontal,
  Eye,
  Copy,
  ExternalLink,
} from "lucide-react";

const ActionCell = memo(
  ({
    row,
    onReply,
    onAISummary,
    onArchive,
    onDelete,
    onView,
  }) => {

    const [menuOpen, setMenuOpen] =
      useState(false);

    const handleCopySubject = async () => {

      if (!row?.subject) return;

      await navigator.clipboard.writeText(
        row.subject
      );

      setMenuOpen(false);

    };

    return (

      <div
        className="
          relative
          flex
          items-center
          justify-end
          gap-1
        "
      >

        {/* View */}

        <button
          type="button"
          title="Open Email"
          onClick={() => onView(row)}
          className="
            rounded-lg
            p-2
            text-slate-500
            transition-all
            hover:bg-slate-100
            hover:text-slate-700
          "
        >
          <Eye size={16} />
        </button>

        {/* Reply */}

        <button
          type="button"
          title="Reply"
          onClick={() => onReply(row)}
          className="
            rounded-lg
            p-2
            text-blue-600
            transition-all
            hover:bg-blue-50
          "
        >
          <Reply size={16} />
        </button>

        {/* AI Summary */}

        <button
          type="button"
          title="AI Summary"
          onClick={() => onAISummary(row)}
          className="
            rounded-lg
            p-2
            text-violet-600
            transition-all
            hover:bg-violet-50
          "
        >
          <Sparkles size={16} />
        </button>

        {/* Archive */}

        <button
          type="button"
          title="Archive"
          onClick={() => onArchive(row)}
          className="
            rounded-lg
            p-2
            text-amber-600
            transition-all
            hover:bg-amber-50
          "
        >
          <Archive size={16} />
        </button>

        {/* Delete */}

        <button
          type="button"
          title="Delete"
          onClick={() => onDelete(row)}
          className="
            rounded-lg
            p-2
            text-red-600
            transition-all
            hover:bg-red-50
          "
        >
          <Trash2 size={16} />
        </button>

        {/* More */}

        <button
          type="button"
          title="More Actions"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          className="
            rounded-lg
            p-2
            text-slate-500
            transition-all
            hover:bg-slate-100
          "
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Dropdown */}

        {menuOpen && (

          <div
            className="
              absolute
              right-0
              top-11
              z-50
              w-52
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-xl
            "
          >

            <button
              type="button"
              onClick={() => {

                onView(row);

                setMenuOpen(false);

              }}
              className="
                flex
                w-full
                items-center
                gap-3
                px-4
                py-3
                text-sm
                hover:bg-slate-50
              "
            >
              <Eye size={16} />
              View Email
            </button>

            <button
              type="button"
              onClick={handleCopySubject}
              className="
                flex
                w-full
                items-center
                gap-3
                px-4
                py-3
                text-sm
                hover:bg-slate-50
              "
            >
              <Copy size={16} />
              Copy Subject
            </button>

            <button
              type="button"
              onClick={() => {

                window.open(
                  row?.webLink,
                  "_blank"
                );

                setMenuOpen(false);

              }}
              className="
                flex
                w-full
                items-center
                gap-3
                px-4
                py-3
                text-sm
                hover:bg-slate-50
              "
            >
              <ExternalLink size={16} />
              Open in Outlook
            </button>

          </div>

        )}

      </div>

    );

  }
);

ActionCell.displayName = "ActionCell";

ActionCell.propTypes = {

  row: PropTypes.object.isRequired,

  onReply: PropTypes.func,

  onAISummary: PropTypes.func,

  onArchive: PropTypes.func,

  onDelete: PropTypes.func,

  onView: PropTypes.func,

};

ActionCell.defaultProps = {

  onReply: () => {},

  onAISummary: () => {},

  onArchive: () => {},

  onDelete: () => {},

  onView: () => {},

};

export default ActionCell;

/**************************************************************************
 * End ActionCell.jsx
 **************************************************************************/