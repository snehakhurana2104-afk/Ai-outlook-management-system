// ===========================================================
// AuthCallback.jsx
// Microsoft Entra ID Authentication Callback
// ===========================================================

import React, {
  useEffect,
  useRef,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useMsal,
} from "@azure/msal-react";

import {
  InteractionStatus,
} from "@azure/msal-browser";

import "./AuthCallback.css";

const AuthCallback = () => {

  const {
    instance,
    accounts,
    inProgress,
  } = useMsal();

  const navigate =
    useNavigate();

  const redirected =
    useRef(false);

  useEffect(() => {

    // -------------------------------------------------------
    // MSAL IS STILL PROCESSING REDIRECT
    // -------------------------------------------------------

    if (
      inProgress !==
      InteractionStatus.None
    ) {
      return;
    }

    // -------------------------------------------------------
    // PREVENT MULTIPLE REDIRECTS
    // -------------------------------------------------------

    if (redirected.current) {
      return;
    }

    // -------------------------------------------------------
    // GET ACTIVE ACCOUNT
    // -------------------------------------------------------

    let account =
      instance.getActiveAccount();

    if (
      !account &&
      accounts &&
      accounts.length > 0
    ) {

      account =
        accounts[0];

      instance.setActiveAccount(
        account
      );
    }

    // -------------------------------------------------------
    // AUTH SUCCESS
    // -------------------------------------------------------

    if (account) {

      console.log(
        "[CALLBACK] Microsoft authentication successful."
      );

      console.log(
        "[CALLBACK] User:",
        account.username
      );

      redirected.current =
        true;

      // Go to dashboard
      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );

      return;
    }

    // -------------------------------------------------------
    // NO ACCOUNT
    // -------------------------------------------------------

    console.warn(
      "[CALLBACK] No Microsoft account found."
    );

    redirected.current =
      true;

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  }, [
    inProgress,
    accounts,
    instance,
    navigate,
  ]);

  return (

    <div
      className="auth-callback-page"
    >

      <div
        className="auth-callback-card"
      >

        <div
          className="auth-spinner"
        />

        <h2>
          Signing you in...
        </h2>

        <p>
          Connecting to Microsoft 365
        </p>

        <span>
          Please wait while we prepare
          your Outlook workspace.
        </span>

      </div>

    </div>
  );
};

export default AuthCallback;