import React, { memo, useEffect, useMemo, useState } from "react";
import { FaBars } from "react-icons/fa";
import { Wifi, WifiOff } from "lucide-react";
import logo from "../assets/images/ssdn.png";
import "./Navbar.css";

const Navbar = ({
  onMenuToggle,
  graphConnected = true,
  connectionStatus,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(currentTime);
  }, [currentTime]);

  const formattedTime = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(currentTime);
  }, [currentTime]);

  const isConnected = Boolean(graphConnected);

  const connectionDetail = isConnected
    ? "Live Outlook data"
    : connectionStatus || "Connection unavailable";

  const handleMenuClick = () => {
    if (typeof onMenuToggle === "function") {
      onMenuToggle();
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={handleMenuClick}
          aria-label="Open navigation menu"
          title="Open navigation menu"
        >
          <FaBars size={16} />
        </button>

        <div className="navbar-brand">
          <div className="navbar-brand-mark">
            <div className="navbar-brand-logo">
              <span className="brand-square brand-square-one" />
              <span className="brand-square brand-square-two" />
              <span className="brand-square brand-square-three" />
              <span className="brand-square brand-square-four" />
            </div>
          </div>

          <div className="navbar-heading">
            <div className="navbar-product-line">
              <span className="navbar-product-name">
                OUTLOOK REPORT
              </span>

              
            </div>

           
          </div>
        </div>
      </div>

      <div className="navbar-right">
        <div
          className={`navbar-connection ${
            isConnected
              ? "connection-online"
              : "connection-offline"
          }`}
        >
          <div className="navbar-connection-icon">
            {isConnected ? (
              <Wifi size={16} strokeWidth={2} />
            ) : (
              <WifiOff size={16} strokeWidth={2} />
            )}
          </div>

          <div className="navbar-connection-copy">
            <strong>Microsoft 365</strong>
            <span>{connectionDetail}</span>
          </div>

          <div className="navbar-connection-status">
            <span className="connection-status-dot" />
            <span>
              {isConnected ? "Connected" : "Offline"}
            </span>
          </div>
        </div>

        <div className="navbar-divider" />

        <div className="navbar-datetime">
          <span className="datetime-date">
            {formattedDate}
          </span>

          <span className="datetime-separator">•</span>

          <span className="datetime-time">
            {formattedTime}
          </span>
        </div>

        <div
          className="navbar-logo-wrapper"
          title="SSDN Technologies"
        >
          <img
            src={logo}
            alt="SSDN Technologies"
            className="navbar-logo-image"
          />
        </div>
      </div>
    </header>
  );
};

Navbar.displayName = "Navbar";

export default memo(Navbar);