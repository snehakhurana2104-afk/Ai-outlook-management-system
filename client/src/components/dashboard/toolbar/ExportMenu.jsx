/**************************************************************************
 * ExportMenu.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo, useState } from "react";
import PropTypes from "prop-types";

import {
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  ChevronDown,
} from "lucide-react";

const ExportMenu = memo(
  ({
    onExportCSV,
    onExportExcel,
    onExportPDF,
    onExportJSON,
    disabled,
  }) => {

    const [open, setOpen] =
      useState(false);

    const handleAction = (callback) => {

      setOpen(false);

      if (callback) {

        callback();

      }

    };

    return (

      <div className="relative">

        {/* Button */}

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            setOpen((prev) => !prev)
          }
          className={`
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            px-4
            py-2.5
            text-sm
            font-medium
            transition-all

            ${
              disabled
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            }
          `}
        >

          <Download size={16} />

          Export

          <ChevronDown size={16} />

        </button>

        {/* Menu */}

        {open && (

          <div
            className="
              absolute
              right-0
              z-50
              mt-2
              w-56
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-xl
            "
          >

            {/* CSV */}

            <button
              type="button"
              onClick={() =>
                handleAction(
                  onExportCSV
                )
              }
              className="
                flex
                w-full
                items-center
                gap-3
                px-4
                py-3
                text-sm
                text-slate-700
                transition
                hover:bg-slate-50
              "
            >

              <FileSpreadsheet
                size={16}
                className="text-green-600"
              />

              Export CSV

            </button>

            {/* Excel */}

            <button
              type="button"
              onClick={() =>
                handleAction(
                  onExportExcel
                )
              }
              className="
                flex
                w-full
                items-center
                gap-3
                px-4
                py-3
                text-sm
                text-slate-700
                transition
                hover:bg-slate-50
              "
            >

              <FileSpreadsheet
                size={16}
                className="text-emerald-600"
              />

              Export Excel

            </button>

            {/* PDF */}

            <button
              type="button"
              onClick={() =>
                handleAction(
                  onExportPDF
                )
              }
              className="
                flex
                w-full
                items-center
                gap-3
                px-4
                py-3
                text-sm
                text-slate-700
                transition
                hover:bg-slate-50
              "
            >

              <FileText
                size={16}
                className="text-red-600"
              />

              Export PDF

            </button>

            {/* JSON */}

            <button
              type="button"
              onClick={() =>
                handleAction(
                  onExportJSON
                )
              }
              className="
                flex
                w-full
                items-center
                gap-3
                px-4
                py-3
                text-sm
                text-slate-700
                transition
                hover:bg-slate-50
              "
            >

              <FileJson
                size={16}
                className="text-blue-600"
              />

              Export JSON

            </button>

          </div>

        )}

      </div>

    );

  }
);

ExportMenu.displayName =
  "ExportMenu";

ExportMenu.propTypes = {

  disabled: PropTypes.bool,

  onExportCSV: PropTypes.func,

  onExportExcel: PropTypes.func,

  onExportPDF: PropTypes.func,

  onExportJSON: PropTypes.func,

};

ExportMenu.defaultProps = {

  disabled: false,

  onExportCSV: () => {},

  onExportExcel: () => {},

  onExportPDF: () => {},

  onExportJSON: () => {},

};

export default ExportMenu;

/**************************************************************************
 * End ExportMenu.jsx
 **************************************************************************/