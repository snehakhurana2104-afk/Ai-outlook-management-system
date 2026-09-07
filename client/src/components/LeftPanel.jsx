// ===========================================================
// LeftPanel.jsx
// Enterprise Hero Panel
// ===========================================================

import React from "react";
import { motion } from "framer-motion";

import {
  FaBrain,
  FaShieldAlt,
  FaSyncAlt,
  FaBolt,
  FaMicrosoft,
  FaCloud,
} from "react-icons/fa";

import FeatureCard from "./FeatureCard";
import FooterTech from "./FooterTech";

const features = [
  {
    icon: <FaBrain />,
    title: "AI Summary",
    description:
      "Generate AI-powered summaries for Outlook emails in seconds.",
  },
  {
    icon: <FaBolt />,
    title: "Smart Priority Detection",
    description:
      "Automatically identify important emails using AI intelligence.",
  },
  {
    icon: <FaSyncAlt />,
    title: "Outlook Synchronization",
    description:
      "Secure synchronization using Microsoft Graph API.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Enterprise Security",
    description:
      "Built for Microsoft Entra ID, OAuth 2.0 and enterprise compliance.",
  },
];

const LeftPanel = () => {
  return (
    <div className="left-panel">

      {/* Hero Illustration */}

      <motion.div
        className="hero-illustration"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-circle">

          <FaMicrosoft className="hero-main-icon" />

          <div className="floating floating-1">
            <FaCloud />
          </div>

          <div className="floating floating-2">
            <FaBrain />
          </div>

          <div className="floating floating-3">
            <FaShieldAlt />
          </div>

        </div>
      </motion.div>

      {/* Hero Content */}

      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="hero-tag">
          Microsoft 365 Enterprise Platform
        </span>

        <h1 className="hero-title">
          AI Outlook
          <br />
          Email Intelligence
        </h1>

        <p className="hero-description">
          Secure enterprise platform for intelligent Outlook email
          analysis powered by Microsoft Graph, Azure AI and Microsoft
          365 technologies.
        </p>
      </motion.div>

      {/* Feature Cards */}

      <motion.div
        className="feature-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </motion.div>

      {/* Footer */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <FooterTech />
      </motion.div>

    </div>
  );
};

export default LeftPanel;