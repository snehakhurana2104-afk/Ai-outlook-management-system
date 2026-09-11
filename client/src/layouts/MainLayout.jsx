import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./MainLayout.css";

const MOBILE_BREAKPOINT = 992;

const MainLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;

      setIsMobile(mobile);

      if (mobile) {
        setSidebarCollapsed(false);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSidebarToggle = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((previous) => !previous);
    } else {
      setSidebarCollapsed((previous) => !previous);
    }
  }, [isMobile]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div
      className={[
        "main-layout",
        sidebarCollapsed ? "sidebar-is-collapsed" : "",
      ].join(" ")}
    >
      {isMobile && sidebarOpen && (
        <div
          className="main-layout-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "main-layout-sidebar",
          isMobile
            ? sidebarOpen
              ? "mobile-open"
              : "mobile-closed"
            : "",
        ].join(" ")}
      >
        <Sidebar
          collapsed={!isMobile && sidebarCollapsed}
          onToggle={handleSidebarToggle}
          onClose={closeSidebar}
        />
      </aside>

      <div className="main-layout-main">
        <Navbar onMenuToggle={handleSidebarToggle} />

        <main className="main-layout-content">
          <div className="main-layout-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;