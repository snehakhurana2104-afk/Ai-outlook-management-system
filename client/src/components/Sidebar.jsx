import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaInbox,
  FaCalendarAlt,
  FaChartLine,
  FaMinus,
  FaPlus,
  FaMicrosoft,
  FaUsers,
  FaTasks
} from "react-icons/fa";
import logo from "../assets/images/ssdn.png";
import "./Sidebar.css";

const Sidebar = ({
  collapsed = false,
  onToggle
}) => {
  const navigation = useMemo(
    () => [
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: FaHome,
        end: true
      },
      {
        title: "Teams Report",
        path: "/executive-intelligence/people",
        icon: FaUsers,
        end: true
      },
      {
        title: "Inbox",
        path: "/inbox",
        icon: FaInbox,
        end: true
      },
      {
        title: "Calendar",
        path: "/calendar",
        icon: FaCalendarAlt,
        end: true
      },
      {
        title: "Analytics",
        path: "/analytics",
        icon: FaChartLine,
        end: true
      },
      // {
      //   title: "Teams Members",
      //   path: "/executive-intelligence/people",
      //   icon: FaUsers,
      //   end: true
      // },
      {
        title: "Follow-up Tracker",
        path: "/executive-intelligence/commitments",
        icon: FaTasks,
        end: true
      }
    ],
    []
  );

  return (
    <aside
      className={`sidebar ${
        collapsed ? "sidebar-collapsed" : ""
      }`}
      aria-label="AI Outlook Intelligence navigation"
    >
      <div className="sidebar-main">
        <div className="sidebar-brand-section">
          <NavLink
            to="/dashboard"
            className="sidebar-brand"
            aria-label="Go to Dashboard"
          >
            <div className="sidebar-logo-wrapper">
              <img
                src={logo}
                alt="SSDN Technologies"
                className="sidebar-logo-image"
              />
            </div>

            {!collapsed && (
              <div className="sidebar-brand-content">
                <div className="sidebar-brand-name">
                  SSDN Technologies
                </div>
              </div>
            )}
          </NavLink>

          {onToggle && (
            <button
              type="button"
              className="sidebar-toggle"
              onClick={onToggle}
              aria-label={
                collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              title={
                collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              <span className="sidebar-toggle-icon">
                {collapsed ? (
                  <FaPlus />
                ) : (
                  <FaMinus />
                )}
              </span>
            </button>
          )}
        </div>

        <nav
          className="sidebar-nav"
          aria-label="Main navigation"
        >
          <div className="sidebar-menu">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.title}
                  to={item.path}
                  end={item.end}
                  title={
                    collapsed
                      ? item.title
                      : undefined
                  }
                  className={({ isActive }) =>
                    `sidebar-item ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <span className="sidebar-active-bar" />

                  <span className="sidebar-icon-wrap">
                    <Icon className="sidebar-icon" />
                  </span>

                  {!collapsed && (
                    <span className="sidebar-text">
                      {item.title}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;