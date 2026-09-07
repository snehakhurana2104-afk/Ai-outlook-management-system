// ===========================================================
// SecurityBadge.jsx
// Enterprise Security Badge
// ===========================================================

import React from "react";
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaMicrosoft,
  FaLock,
  FaCloud,
  FaBrain,
} from "react-icons/fa";

const iconMap = {
  "Microsoft Entra ID": <FaMicrosoft />,
  "OAuth 2.0": <FaLock />,
  "Microsoft Graph": <FaShieldAlt />,
  "Azure AI": <FaCloud />,
};

const SecurityBadge = ({ title }) => {
  const icon = iconMap[title] || <FaBrain />;

  return (
    <motion.div
      className="security-badge"
      whileHover={{
        y: -4,
        scale: 1.03,
      }}
      transition={{
        duration: 0.25,
      }}
    >
      <div className="security-badge-glow" />

      <div className="security-badge-icon">
        {icon}
      </div>

      <span className="security-badge-title">
        {title}
      </span>
    </motion.div>
  );
};

export default React.memo(SecurityBadge);