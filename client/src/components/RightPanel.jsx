// ===========================================================
// RightPanel.jsx
// Enterprise Glass Login Card
// AI Outlook Email Intelligence Platform
// ===========================================================

import React from "react";
import { motion } from "framer-motion";

import Logo from "./Logo";
import MicrosoftButton from "./MicrosoftButton";
import SecurityBadge from "./SecurityBadge";

const cardAnimation = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.75,
      ease: "easeOut",
    },
  },
};

const RightPanel = ({ onMicrosoftLogin }) => {
  return (
    <div className="right-panel">
      <motion.div
        className="login-card"
        variants={cardAnimation}
        initial="hidden"
        animate="visible"
      >
        {/* ================================================= */}
        {/* SSDN Logo */}
        {/* ================================================= */}

        <div className="login-logo">
          <Logo />
        </div>

        {/* ================================================= */}
        {/* Heading */}
        {/* ================================================= */}

        <div className="login-header">
          <span className="platform-label">
            Enterprise Microsoft 365 Platform
          </span>

          <h2 className="login-title">
            AI Outlook
            <br />
            Email Intelligence
          </h2>

          <p className="login-subtitle">
            Securely connect your Microsoft 365 account to access
            Outlook, Calendar, Tasks and AI-powered email insights
            through Microsoft Graph API.
          </p>
        </div>

        {/* ================================================= */}
        {/* Microsoft Login Button */}
        {/* ================================================= */}

        <div className="login-action">
          <MicrosoftButton onClick={onMicrosoftLogin} />
        </div>

        {/* ================================================= */}
        {/* Security Section */}
        {/* ================================================= */}

        <div className="security-section">
          <p className="security-title">
            Enterprise Security & Technology
          </p>

          <div className="security-badges">
            <SecurityBadge title="Microsoft Entra ID" />
            <SecurityBadge title="OAuth 2.0" />
            <SecurityBadge title="Microsoft Graph" />
            <SecurityBadge title="Azure AI" />
          </div>
        </div>

        {/* ================================================= */}
        {/* Divider */}
        {/* ================================================= */}

        <div className="login-divider">
          <span></span>
        </div>

        {/* ================================================= */}
        {/* Enterprise Footer */}
        {/* ================================================= */}

        <div className="enterprise-footer">
          <p>
            Enterprise-grade AI platform built for secure Outlook
            intelligence, automation and analytics.
          </p>

          <small>
            © {new Date().getFullYear()} SSDN Technologies.
            All Rights Reserved.
          </small>
        </div>
      </motion.div>
    </div>
  );
};

export default RightPanel;