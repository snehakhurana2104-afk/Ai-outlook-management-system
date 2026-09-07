import React from "react";

import ReactDOM from "react-dom/client";

import {
  MsalProvider,
} from "@azure/msal-react";

import {
  msalInstance,
} from "./authConfig";

import App from "./App";

import "./index.css";

/* =========================================================
   BOOTSTRAP APPLICATION
========================================================= */

async function bootstrap() {
  try {
    /* =======================================================
       INITIALIZE MSAL
    ======================================================= */

    await msalInstance.initialize();

    /* =======================================================
       HANDLE REDIRECT
    ======================================================= */

    const response =
      await msalInstance.handleRedirectPromise();

    if (response?.account) {
      msalInstance.setActiveAccount(
        response.account
      );
    }

    /* =======================================================
       RESTORE ACCOUNT
    ======================================================= */

    const accounts =
      msalInstance.getAllAccounts();

    if (
      !msalInstance.getActiveAccount() &&
      accounts.length > 0
    ) {
      msalInstance.setActiveAccount(
        accounts[0]
      );
    }

    /* =======================================================
       RENDER
    ======================================================= */

    const rootElement =
      document.getElementById(
        "root"
      );

    if (!rootElement) {
      throw new Error(
        "Root element #root was not found."
      );
    }

    ReactDOM.createRoot(
      rootElement
    ).render(
      <React.StrictMode>
        <MsalProvider
          instance={msalInstance}
        >
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error(
      "[MSAL] Initialization failed:",
      error
    );

    const root =
      document.getElementById(
        "root"
      );

    if (root) {
      root.innerHTML = `
        <div
          style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:30px;
            box-sizing:border-box;
            background:#f5f7fb;
            font-family:Arial,sans-serif;
            color:#111827;
          "
        >
          <div
            style="
              max-width:650px;
              width:100%;
              background:#ffffff;
              border:1px solid #e5e7eb;
              border-radius:14px;
              padding:28px;
              box-shadow:0 10px 30px rgba(0,0,0,.06);
            "
          >
            <h2>
              Microsoft Authentication Error
            </h2>

            <p>
              Unable to initialize Microsoft login.
            </p>

            <pre
              style="
                background:#f3f4f6;
                padding:16px;
                border-radius:8px;
                overflow:auto;
                white-space:pre-wrap;
                word-break:break-word;
              "
            >${error?.message || String(error)}</pre>
          </div>
        </div>
      `;
    }
  }
}

bootstrap();