/**************************************************************************
 * SenderCell.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";

import {
  User,
  Mail,
} from "lucide-react";

const SenderCell = memo(
  ({
    sender,
    email,
    avatar,
  }) => {
    return (
      <div className="flex items-center gap-3 min-w-0">

        {/* Avatar */}

        <div className="flex-shrink-0">

          {avatar ? (

            <img
              src={avatar}
              alt={sender}
              className="
                h-10
                w-10
                rounded-full
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
                rounded-full
                bg-blue-100
                text-blue-600
              "
            >
              <User size={18} />
            </div>

          )}

        </div>

        {/* Sender Details */}

        <div className="min-w-0 flex-1">

          <p
            className="
              truncate
              text-sm
              font-semibold
              text-slate-900
            "
          >
            {sender || "Unknown Sender"}
          </p>

          <div
            className="
              mt-1
              flex
              items-center
              gap-1
            "
          >
            <Mail
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
              {email || "No Email"}
            </span>

          </div>

        </div>

      </div>
    );
  }
);

SenderCell.displayName = "SenderCell";

SenderCell.propTypes = {

  sender: PropTypes.string,

  email: PropTypes.string,

  avatar: PropTypes.string,

};

SenderCell.defaultProps = {

  sender: "",

  email: "",

  avatar: "",

};

export default SenderCell;