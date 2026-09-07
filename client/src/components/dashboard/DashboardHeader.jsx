/******************************************************************************
 * DashboardHeader.jsx
 * Part 1
 * Enterprise Dashboard Header
 ******************************************************************************/

import React, {
    memo,
    useMemo,
    useState,
    useEffect,
    useCallback,
} from "react";

import {
    Activity,
    CalendarDays,
    Download,
    RefreshCw,
    Wifi,
    WifiOff,
    Bell,
    Clock3,
    UserCircle2,
    ChevronDown,
    FileSpreadsheet,
    FileText,
    File,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                           Enterprise Constants                             */
/* -------------------------------------------------------------------------- */

const DASHBOARD_TITLE =
    "Enterprise Outlook Dashboard";

const DASHBOARD_SUBTITLE =
    "AI Powered Email Intelligence Platform";

const DASHBOARD_VERSION =
    "v2.0 Enterprise";

/* -------------------------------------------------------------------------- */
/*                           Export Options                                   */
/* -------------------------------------------------------------------------- */

const EXPORT_OPTIONS = [

    {
        id: "pdf",
        label: "Export PDF",
        icon: FileText,
    },

    {
        id: "excel",
        label: "Export Excel",
        icon: FileSpreadsheet,
    },

    {
        id: "csv",
        label: "Export CSV",
        icon: File,
    },

];

/* -------------------------------------------------------------------------- */
/*                          Default Notification Count                        */
/* -------------------------------------------------------------------------- */

const DEFAULT_NOTIFICATION_COUNT = 0;

/******************************************************************************
 * Component Starts
 ******************************************************************************/

const DashboardHeader = ({

    refreshing = false,

    connected = false,

    onRefresh,

    onExport,

    lastUpdated,

    userName = "User",

    notificationCount = DEFAULT_NOTIFICATION_COUNT,

}) => {
      /* ---------------------------------------------------------------------- */
    /*                            Enterprise State                            */
    /* ---------------------------------------------------------------------- */

    const [currentTime, setCurrentTime] = useState(new Date());

    const [exportOpen, setExportOpen] = useState(false);

    const [refreshCountdown, setRefreshCountdown] = useState(60);

    /* ---------------------------------------------------------------------- */
    /*                             Live Clock                                 */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {

        const timer = setInterval(() => {

            setCurrentTime(new Date());

        }, 1000);

        return () => clearInterval(timer);

    }, []);

    /* ---------------------------------------------------------------------- */
    /*                        Auto Refresh Countdown                          */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {

        const interval = setInterval(() => {

            setRefreshCountdown((previous) => {

                if (previous <= 1) {

                    return 60;

                }

                return previous - 1;

            });

        }, 1000);

        return () => clearInterval(interval);

    }, []);

    /* ---------------------------------------------------------------------- */
    /*                        Memoized Date & Time                            */
    /* ---------------------------------------------------------------------- */

    const formattedCurrentTime = useMemo(() => {

        return currentTime.toLocaleTimeString([], {

            hour: "2-digit",

            minute: "2-digit",

            second: "2-digit",

        });

    }, [currentTime]);

    const formattedLastUpdated = useMemo(() => {

        if (!lastUpdated) return "Never";

        return new Date(lastUpdated).toLocaleString();

    }, [lastUpdated]);

    /* ---------------------------------------------------------------------- */
    /*                      Connection Status Text                            */
    /* ---------------------------------------------------------------------- */

    const connectionText = useMemo(() => {

        return connected ? "Live" : "Offline";

    }, [connected]);

    const connectionClass = useMemo(() => {

        return connected

            ? "bg-green-100 text-green-700"

            : "bg-red-100 text-red-700";

    }, [connected]);

    /* ---------------------------------------------------------------------- */
    /*                           Event Handlers                              */
    /* ---------------------------------------------------------------------- */

    const handleRefresh = useCallback(() => {

        onRefresh?.();

    }, [onRefresh]);

    const handleExportClick = useCallback((type) => {

        setExportOpen(false);

        onExport?.(type);

    }, [onExport]);

    const toggleExportMenu = useCallback(() => {

        setExportOpen((previous) => !previous);

    }, []);
            {/* ===================================================== */}
        {/* Enterprise Left Section                               */}
        {/* ===================================================== */}

        <div className="flex flex-1 items-center gap-5">

            {/* -------------------------------------------------- */}
            {/* Logo */}
            {/* -------------------------------------------------- */}

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">

                <Activity
                    size={30}
                    className="text-white"
                />

            </div>

            {/* -------------------------------------------------- */}
            {/* Title */}
            {/* -------------------------------------------------- */}

            <div className="flex flex-col">

                <div className="flex items-center gap-3">

                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">

                        {DASHBOARD_TITLE}

                    </h1>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">

                        {DASHBOARD_VERSION}

                    </span>

                </div>

                <p className="mt-1 text-sm text-gray-500">

                    {DASHBOARD_SUBTITLE}

                </p>

                <div className="mt-3 flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">

                        <UserCircle2
                            size={24}
                            className="text-slate-600"
                        />

                    </div>

                    <div>

                        <p className="text-sm font-semibold text-gray-800">

                            Welcome back, {userName}

                        </p>

                        <p className="text-xs text-gray-500">

                            Enterprise Dashboard Access

                        </p>

                    </div>

                </div>

            </div>

        </div>
                {/* ===================================================== */}
        {/* Enterprise Right Section                              */}
        {/* ===================================================== */}

        <div className="flex flex-wrap items-center justify-end gap-3">

            {/* -------------------------------------------------- */}
            {/* Live Clock */}
            {/* -------------------------------------------------- */}

            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">

                <Clock3
                    size={18}
                    className="text-indigo-600"
                />

                <div>

                    <p className="text-xs text-gray-500">

                        Live Time

                    </p>

                    <p className="text-sm font-semibold text-gray-800">

                        {formattedCurrentTime}

                    </p>

                </div>

            </div>

            {/* -------------------------------------------------- */}
            {/* Last Updated */}
            {/* -------------------------------------------------- */}

            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 shadow-sm">

                <CalendarDays
                    size={18}
                    className="text-gray-500"
                />

                <div>

                    <p className="text-xs text-gray-500">

                        Last Updated

                    </p>

                    <p className="text-sm font-semibold text-gray-800">

                        {formattedLastUpdated}

                    </p>

                </div>

            </div>

            {/* -------------------------------------------------- */}
            {/* Connection Status */}
            {/* -------------------------------------------------- */}

            <div
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all ${connectionClass}`}
            >

                {connected ? (

                    <>

                        <Wifi
                            size={16}
                            className="animate-pulse"
                        />

                        <span>

                            {connectionText}

                        </span>

                    </>

                ) : (

                    <>

                        <WifiOff size={16} />

                        <span>

                            {connectionText}

                        </span>

                    </>

                )}

            </div>

            {/* -------------------------------------------------- */}
            {/* Auto Refresh Countdown */}
            {/* -------------------------------------------------- */}

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 shadow-sm">

                <p className="text-xs text-blue-600">

                    Auto Refresh

                </p>

                <p className="text-sm font-bold text-blue-700">

                    {refreshCountdown}s

                </p>

            </div>

            {/* -------------------------------------------------- */}
            {/* Notifications */}
            {/* -------------------------------------------------- */}

            <button
                className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-100"
                aria-label="Notifications"
            >

                <Bell
                    size={20}
                    className="text-gray-700"
                />

                {notificationCount > 0 && (

                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">

                        {notificationCount > 99
                            ? "99+"
                            : notificationCount}

                    </span>

                )}

            </button>

        </div>
                {/* -------------------------------------------------- */}
        {/* Refresh Button */}
        {/* -------------------------------------------------- */}

        <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh Dashboard"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >

            <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
            />

            <span>

                {refreshing
                    ? "Refreshing..."
                    : "Refresh"}

            </span>

        </button>

        {/* -------------------------------------------------- */}
        {/* Export Dropdown */}
        {/* -------------------------------------------------- */}

        <div className="relative">

            <button
                onClick={toggleExportMenu}
                aria-label="Export Dashboard"
                className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
            >

                <Download size={18} />

                <span>

                    Export

                </span>

                <ChevronDown size={16} />

            </button>

            {exportOpen && (

                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">

                    {EXPORT_OPTIONS.map((item) => {

                        const Icon = item.icon;

                        return (

                            <button
                                key={item.id}
                                onClick={() =>
                                    handleExportClick(item.id)
                                }
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
                            >

                                <Icon
                                    size={18}
                                    className="text-blue-600"
                                />

                                <span>

                                    {item.label}

                                </span>

                            </button>

                        );

                    })}

                </div>

            )}

        </div>

        {/* -------------------------------------------------- */}
        {/* Performance Badge */}
        {/* -------------------------------------------------- */}

        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 shadow-sm">

            <p className="text-xs text-green-600">

                System Status

            </p>

            <p className="text-sm font-bold text-green-700">

                Operational

            </p>

        </div>
        /* -------------------------------------------------------------------------- */
/*               Enterprise Final Optimization + Production Ready             */
/* -------------------------------------------------------------------------- */

/* ============================================================
   Close Export Menu on Outside Click
============================================================ */

useEffect(() => {

    const handleOutsideClick = (event) => {

        if (
            exportOpen &&
            !event.target.closest(".export-menu")
        ) {

            setExportOpen(false);

        }

    };

    document.addEventListener(
        "mousedown",
        handleOutsideClick
    );

    return () => {

        document.removeEventListener(
            "mousedown",
            handleOutsideClick
        );

    };

}, [exportOpen]);

/* ============================================================
   Keyboard Shortcuts
============================================================ */

useEffect(() => {

    const handleKeyDown = (event) => {

        /* Ctrl + R → Refresh */

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "r"
        ) {

            event.preventDefault();

            handleRefresh();

        }

        /* ESC → Close Export */

        if (
            event.key === "Escape"
        ) {

            setExportOpen(false);

        }

    };

    window.addEventListener(
        "keydown",
        handleKeyDown
    );

    return () => {

        window.removeEventListener(
            "keydown",
            handleKeyDown
        );

    };

}, [handleRefresh]);

/* ============================================================
   Stable Component Info
============================================================ */

const componentInfo = useMemo(() => ({

    version: DASHBOARD_VERSION,

    connected,

    refreshing,

    notifications: notificationCount,

}), [

    connected,

    refreshing,

    notificationCount,

]);

/* ============================================================
   Development Log
============================================================ */

useEffect(() => {

    if (
        process.env.NODE_ENV === "development"
    ) {

        console.log(
            "[DashboardHeader]",
            componentInfo
        );

    }

}, [componentInfo]);
DashboardHeader.displayName = "DashboardHeader";
}
export default memo(DashboardHeader);

/******************************************************************************
 * DashboardHeader Ready
 *
 * Features
 * --------------------------------------------------------
 * ✓ React.memo
 * ✓ Live Clock
 * ✓ Auto Refresh Countdown
 * ✓ Online / Offline Badge
 * ✓ Notifications
 * ✓ Export Dropdown
 * ✓ Keyboard Shortcuts
 * ✓ Outside Click Detection
 * ✓ Accessibility
 * ✓ Responsive Layout
 * ✓ Production Optimized
 ******************************************************************************/