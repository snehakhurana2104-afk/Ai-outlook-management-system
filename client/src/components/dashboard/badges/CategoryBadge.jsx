/**************************************************************************
 * CategoryBadge.jsx
 * Enterprise Production Component
 **************************************************************************/

import React, { memo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Briefcase,
  DollarSign,
  LifeBuoy,
  Megaphone,
  Users,
  Cog,
  Tag,
} from "lucide-react";

import { getCategoryColor } from "../../utils/dashboardTableHelpers";

const CategoryBadge = memo(({ category }) => {

  const badgeClass = getCategoryColor(category);

  const Icon = (() => {

    switch ((category || "").toLowerCase()) {

      case "finance":
        return DollarSign;

      case "sales":
        return Briefcase;

      case "support":
        return LifeBuoy;

      case "marketing":
        return Megaphone;

      case "hr":
        return Users;

      case "operations":
        return Cog;

      default:
        return Tag;

    }

  })();

  return (

    <span
      className={clsx(

        "inline-flex",

        "items-center",

        "gap-2",

        "rounded-full",

        "border",

        "px-3",

        "py-1.5",

        "text-xs",

        "font-semibold",

        badgeClass

      )}
    >

      <Icon size={14} />

      {category || "Other"}

    </span>

  );

});

CategoryBadge.displayName = "CategoryBadge";

CategoryBadge.propTypes = {

  category: PropTypes.string,

};

CategoryBadge.defaultProps = {

  category: "Other",

};

export default CategoryBadge;

/**************************************************************************
 * End CategoryBadge.jsx
 **************************************************************************/