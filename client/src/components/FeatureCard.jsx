// ===========================================================
// FeatureCard.jsx
// Enterprise Feature Card
// AI Outlook Email Intelligence Platform
// ===========================================================

import React from "react";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut",
    },
  },
};

const FeatureCard = ({
  icon,
  title,
  description,
}) => {
  return (
    <motion.div
      className="feature-card"
      variants={cardVariants}
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      transition={{
        duration: 0.25,
      }}
    >
      {/* Glow */}
      <div className="feature-card-glow" />

      {/* Icon */}
      <div className="feature-icon-wrapper">
        <div className="feature-icon">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="feature-content">
        <h3 className="feature-title">
          {title}
        </h3>

        <p className="feature-description">
          {description}
        </p>
      </div>

      {/* Hover Border */}
      <div className="feature-border" />
    </motion.div>
  );
};

export default React.memo(FeatureCard);