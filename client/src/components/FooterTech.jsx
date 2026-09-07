// ===========================================================
// FooterTech.jsx
// Enterprise Technology Footer
// ===========================================================

import React from "react";
import { motion } from "framer-motion";
import {
  FaMicrosoft,
  FaCloud,
  FaBuilding,
} from "react-icons/fa";

const technologies = [
  {
    id: 1,
    title: "Microsoft Graph",
    icon: <FaMicrosoft />,
  },
  {
    id: 2,
    title: "Azure AI",
    icon: <FaCloud />,
  },
  {
    id: 3,
    title: "Microsoft 365",
    icon: <FaMicrosoft />,
  },
  {
    id: 4,
    title: "SSDN Technologies",
    icon: <FaBuilding />,
  },
];

const FooterTech = () => {
  return (
    <motion.div
      className="footer-tech"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <p className="footer-tech-label">
        Powered By
      </p>

      <div className="footer-tech-grid">
        {technologies.map((tech, index) => (
          <motion.div
            key={tech.id}
            className="footer-tech-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              duration: 0.4,
            }}
            whileHover={{
              scale: 1.05,
              y: -5,
            }}
            whileTap={{
              scale: 0.98,
            }}
          >
            <div className="footer-tech-icon">
              {tech.icon}
            </div>

            <span className="footer-tech-title">
              {tech.title}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default React.memo(FooterTech);