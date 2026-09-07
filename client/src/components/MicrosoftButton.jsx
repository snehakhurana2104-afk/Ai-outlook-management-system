// ===========================================================
// MicrosoftButton.jsx
// Premium Microsoft Login Button
// Future Ready for MSAL Authentication
// ===========================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaMicrosoft } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";

const MicrosoftButton = ({ onClick }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);

    try {
      // =====================================================
      // CURRENT PHASE
      // =====================================================
      // Only navigate("/dashboard")
      //
      // FUTURE
      // await loginPopup(loginRequest);
      // OR
      // await loginRedirect(loginRequest);
      // =====================================================

      await Promise.resolve(onClick?.());
    } finally {
      // Small delay so the loading animation is visible
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  return (
    <motion.button
      type="button"
      className={`microsoft-login-btn ${loading ? "loading" : ""}`}
      whileHover={{
        scale: 1.02,
        y: -2,
      }}
      whileTap={{
        scale: 0.98,
      }}
      onClick={handleClick}
      disabled={loading}
    >
      {/* Ripple Layer */}
      <span className="btn-ripple"></span>

      {/* Content */}
      <span className="btn-content">
        {loading ? (
          <>
            <ImSpinner8 className="btn-spinner" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <span className="microsoft-icon">
              <FaMicrosoft />
            </span>

            <span className="btn-text">
              Continue with Microsoft
            </span>

            <span className="btn-arrow">→</span>
          </>
        )}
      </span>
    </motion.button>
  );
};

export default MicrosoftButton;