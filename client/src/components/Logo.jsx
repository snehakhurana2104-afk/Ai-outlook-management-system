// ===========================================================
// Logo.jsx
// SSDN Technologies Logo
// AI Outlook Email Intelligence Platform
// ===========================================================

import React from "react";
import { motion } from "framer-motion";

import { FaMicrosoft } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";

// -----------------------------------------------------------
// If you have an official SSDN logo, replace the placeholder
// below with:
// import logo from "../assets/ssdn-logo.png";
// -----------------------------------------------------------

const Logo = () => {
  return (
    <motion.div
      className="enterprise-logo"
      initial={{
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration: 0.6,
      }}
    >
      {/* ===================================================== */}
      {/* Logo Icon */}
      {/* ===================================================== */}

      <div className="enterprise-logo-icon">
        {/* Replace this with your company logo image later */}

        {/* <img
          src={logo}
          alt="SSDN Technologies"
          className="enterprise-logo-image"
        /> */}

        <FaMicrosoft className="logo-microsoft-icon" />

        <span className="logo-ai-badge">
          <HiSparkles />
        </span>
      </div>

      {/* ===================================================== */}
      {/* Company Name */}
      {/* ===================================================== */}

      <div className="enterprise-logo-content">
        <h2 className="company-name">
          SSDN Technologies
        </h2>

        <span className="company-tagline">
          AI Outlook Email Intelligence
        </span>
      </div>
    </motion.div>
  );
};

export default React.memo(Logo);