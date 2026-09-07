import React from "react";

import {
  useMsal,
  useIsAuthenticated,
} from "@azure/msal-react";

import {
  InteractionStatus,
} from "@azure/msal-browser";

import {
  loginRequest,
} from "../authConfig";

import "./OutlookConnectButton.css";

export default function OutlookConnectButton({
  onConnected,
}) {
  const {
    instance,
    accounts,
    inProgress,
  } = useMsal();

  const isAuthenticated =
    useIsAuthenticated();

  const [loading, setLoading] =
    React.useState(false);

  const account =
    accounts?.[0];

  const connectOutlook =
    async () => {
      if (
        inProgress !==
        InteractionStatus.None
      ) {
        return;
      }

      try {
        setLoading(true);

        /*
        |--------------------------------------------------------------------------
        | Login
        |--------------------------------------------------------------------------
        */

        const response =
          await instance.loginRedirect(
            loginRequest
          );

        /*
        |--------------------------------------------------------------------------
        | Redirect flow does not normally
        | continue here because browser navigates.
        |--------------------------------------------------------------------------
        */

        if (response?.account) {
          instance.setActiveAccount(
            response.account
          );
        }

        if (onConnected) {
          onConnected();
        }
      } catch (error) {
        console.error(
          "Microsoft login failed:",
          error
        );

        alert(
          error?.message ||
            "Microsoft Outlook connection failed."
        );

        setLoading(false);
      }
    };

  const logoutOutlook =
    async () => {
      try {
        setLoading(true);

        await instance.logoutRedirect({
          account:
            account || undefined,

          postLogoutRedirectUri:
            window.location.origin,
        });
      } catch (error) {
        console.error(
          "Microsoft logout failed:",
          error
        );

        setLoading(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Authenticated
  |--------------------------------------------------------------------------
  */

  if (isAuthenticated) {
    return (
      <div className="outlook-user-box">
        <div className="outlook-user-info">
          <div className="outlook-user-avatar">
            {(account?.name ||
              account?.username ||
              "M")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <div className="outlook-user-name">
              {account?.name ||
                "Microsoft User"}
            </div>

            <div className="outlook-user-email">
              {account?.username || ""}
            </div>
          </div>
        </div>

        <div className="outlook-connected-badge">
          <span />
          Outlook Connected
        </div>

        <button
          type="button"
          className="outlook-disconnect-btn"
          onClick={logoutOutlook}
          disabled={loading}
        >
          {loading
            ? "Disconnecting..."
            : "Disconnect"}
        </button>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Not authenticated
  |--------------------------------------------------------------------------
  */

  return (
    <button
      type="button"
      className="outlook-connect-btn"
      onClick={connectOutlook}
      disabled={
        loading ||
        inProgress !==
          InteractionStatus.None
      }
    >
      <span className="outlook-logo">
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13Zm3 .5v12l6-3.8L18 18V6l-6 3.8L6 6Z"
          />
        </svg>
      </span>

      <span>
        {loading ||
        inProgress !==
          InteractionStatus.None
          ? "Connecting..."
          : "Connect Outlook"}
      </span>
    </button>
  );
}