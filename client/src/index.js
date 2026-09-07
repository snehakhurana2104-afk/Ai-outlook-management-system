// ===========================================================
// index.js
// AI Outlook Email Intelligence Platform
// Microsoft Entra ID + Microsoft Graph
// ===========================================================

import React from "react";
import ReactDOM from "react-dom/client";

import {
  MsalProvider,
} from "@azure/msal-react";

import {
  msalInstance,
} from "./config/msalConfig";

import App from "./App";

import "./index.css";

import reportWebVitals from "./reportWebVitals";

// ===========================================================
// ROOT ELEMENT
// ===========================================================

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element #root was not found."
  );
}

// ===========================================================
// START APPLICATION
// IMPORTANT:
// MSAL MUST BE INITIALIZED BEFORE ANY
// MSAL API IS USED.
// ===========================================================

const startApplication = async () => {
  try {
    console.log(
      "[MSAL] Initializing Microsoft authentication..."
    );

    await msalInstance.initialize();

    console.log(
      "[MSAL] Microsoft authentication initialized."
    );

    // -------------------------------------------------------
    // Handle redirect response if any
    // -------------------------------------------------------

    try {
      const redirectResponse =
        await msalInstance.handleRedirectPromise();

      if (redirectResponse?.account) {
        msalInstance.setActiveAccount(
          redirectResponse.account
        );

        console.log(
          "[MSAL] Active account restored:",
          redirectResponse.account.username
        );
      }
    } catch (redirectError) {
      console.error(
        "[MSAL] Redirect handling failed:",
        redirectError
      );
    }

    // -------------------------------------------------------
    // Restore existing account
    // -------------------------------------------------------

    const accounts =
      msalInstance.getAllAccounts();

    if (
      !msalInstance.getActiveAccount() &&
      accounts.length > 0
    ) {
      msalInstance.setActiveAccount(
        accounts[0]
      );

      console.log(
        "[MSAL] Existing account restored:",
        accounts[0].username
      );
    }

    // =======================================================
    // REACT ROOT
    // =======================================================

    const root =
      ReactDOM.createRoot(
        rootElement
      );

    // =======================================================
    // APPLICATION
    // =======================================================

    root.render(
      <React.StrictMode>
        <MsalProvider
          instance={msalInstance}
        >
          <App />
        </MsalProvider>
      </React.StrictMode>
    );

    // =======================================================
    // PERFORMANCE
    // =======================================================

    reportWebVitals();

  } catch (error) {
    console.error(
      "[MSAL] Application initialization failed:",
      error
    );

    rootElement.innerHTML = `
      <div
        style="
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#f8fafc;
          font-family:Segoe UI,Arial,sans-serif;
          padding:24px;
        "
      >
        <div
          style="
            max-width:520px;
            width:100%;
            background:white;
            border:1px solid #e2e8f0;
            border-radius:18px;
            padding:32px;
            box-shadow:0 20px 50px rgba(15,23,42,.08);
          "
        >
          <h2
            style="
              margin:0 0 10px;
              color:#dc2626;
            "
          >
            Microsoft Authentication Error
          </h2>

          <p
            style="
              margin:0 0 16px;
              color:#475569;
              line-height:1.6;
            "
          >
            Microsoft authentication could not be initialized.
            Please check your Azure configuration and restart
            the application.
          </p>

          <pre
            style="
              white-space:pre-wrap;
              background:#f8fafc;
              padding:14px;
              border-radius:10px;
              color:#334155;
              font-size:12px;
              overflow:auto;
            "
          >${error?.message || error}</pre>
        </div>
      </div>
    `;
  }
};

// ===========================================================
// START
// ===========================================================

startApplication();