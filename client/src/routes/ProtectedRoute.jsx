// ===========================================================
// ProtectedRoute.jsx
// AI Outlook Email Intelligence Platform
// ===========================================================

import React from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

// ===========================================================
// COMPONENT
// ===========================================================

const ProtectedRoute = ({
  children,
}) => {

  const {
    isAuthenticated,
    authReady,
    loading,
  } = useAuth();

  const location =
    useLocation();

  // =========================================================
  // WAIT FOR AUTHENTICATION
  // =========================================================

  if (
    !authReady ||
    loading
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          background: "#f8fafc",
          fontFamily:
            "Segoe UI, Arial, sans-serif",
        }}
      >

        <div
          style={{
            width: "44px",
            height: "44px",
            border:
              "4px solid #e2e8f0",
            borderTopColor:
              "#2563eb",
            borderRadius: "50%",
            animation:
              "spin 0.8s linear infinite",
          }}
        />

        <strong>
          Connecting to Microsoft 365...
        </strong>

        <span
          style={{
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Loading your Outlook workspace
        </span>

      </div>
    );
  }

  // =========================================================
  // NOT AUTHENTICATED
  // =========================================================

  if (!isAuthenticated) {

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search,
        }}
      />
    );
  }

  // =========================================================
  // AUTHENTICATED
  // =========================================================

  return children;
};

export default ProtectedRoute;