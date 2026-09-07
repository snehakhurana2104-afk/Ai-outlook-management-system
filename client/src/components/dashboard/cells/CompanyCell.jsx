/**************************************************************************
 * CompanyCell.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  Building2,
  Globe,
} from "lucide-react";

const CompanyCell = memo(
  ({
    company,
    domain,
    logo,
  }) => {
    return (
      <div className="flex items-center gap-3 min-w-0">

        {/* Company Logo */}

        <div className="flex-shrink-0">

          {logo ? (

            <img
              src={logo}
              alt={company}
              className="
                h-10
                w-10
                rounded-lg
                object-cover
                border
                border-slate-200
              "
            />

          ) : (

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-lg
                bg-indigo-100
                text-indigo-600
              "
            >
              <Building2 size={18} />
            </div>

          )}

        </div>

        {/* Company Details */}

        <div className="min-w-0 flex-1">

          <p
            className="
              truncate
              text-sm
              font-semibold
              text-slate-900
            "
          >
            {company || "Unknown Company"}
          </p>

          <div
            className="
              mt-1
              flex
              items-center
              gap-1
            "
          >

            <Globe
              size={12}
              className="text-slate-400"
            />

            <span
              className="
                truncate
                text-xs
                text-slate-500
              "
            >
              {domain || "No Domain"}
            </span>

          </div>

        </div>

      </div>
    );
  }
);

CompanyCell.displayName = "CompanyCell";

CompanyCell.propTypes = {

  company: PropTypes.string,

  domain: PropTypes.string,

  logo: PropTypes.string,

};

CompanyCell.defaultProps = {

  company: "",

  domain: "",

  logo: "",

};

export default CompanyCell;