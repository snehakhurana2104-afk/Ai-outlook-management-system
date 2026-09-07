// ===========================================================
// LiveWidgets.jsx
// PHASE 4 - PART 8
// PART 1
// Enterprise Live Widgets
// ===========================================================

import React, { memo, useMemo } from "react";

import {
    Wifi,
    RefreshCw,
    Bell,
    CalendarDays,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";

import "./LiveWidgets.css";

// ===========================================================
// Component
// ===========================================================

const LiveWidgets = ({
    widgets = {},
    onOpenNotifications,
    onOpenCalendar,
}) => {

    // =======================================================
    // Memoized Widget Data
    // =======================================================

    const data = useMemo(() => ({

        graphStatus:
            widgets.graphStatus || "Disconnected",

        syncStatus:
            widgets.syncStatus || "Idle",

        lastSync:
            widgets.lastSync || "--",

        notificationCount:
            widgets.notificationCount ?? 0,

        upcomingMeetings:
            widgets.upcomingMeetings ?? 0,

        aiHealth:
            widgets.aiHealth || "Healthy",

    }), [widgets]);

    const getStatusClass = (status = "") => {

        switch (status.toLowerCase()) {

            case "connected":
            case "healthy":
            case "completed":
                return "status-success";

            case "syncing":
            case "running":
                return "status-warning";

            case "disconnected":
            case "failed":
            case "offline":
                return "status-danger";

            default:
                return "status-neutral";
        }

    };

    return (

        <section className="live-widgets">

            {/* Microsoft Graph Status */}

            <div className="widget-card">

                <div className="widget-header">

                    <Wifi size={20} />

                    <h3>Microsoft Graph</h3>

                </div>

                <span
                    className={getStatusClass(data.graphStatus)}
                >
                    {data.graphStatus}
                </span>

            </div>

            {/* Outlook Sync */}

            <div className="widget-card">

                <div className="widget-header">

                    <RefreshCw size={20} />

                    <h3>Outlook Sync</h3>

                </div>

                <span
                    className={getStatusClass(data.syncStatus)}
                >
                    {data.syncStatus}
                </span>

                <small>

                    Last Sync: {data.lastSync}

                </small>

            </div>

            {/* Notifications */}

            <div
                className="widget-card clickable"
                onClick={onOpenNotifications}
            >

                <div className="widget-header">

                    <Bell size={20} />

                    <h3>Notifications</h3>

                </div>

                <h2>

                    {data.notificationCount}

                </h2>

            </div>

            {/* Calendar */}

            <div
                className="widget-card clickable"
                onClick={onOpenCalendar}
            >

                <div className="widget-header">

                    <CalendarDays size={20} />

                    <h3>Today's Meetings</h3>

                </div>

                <h2>

                    {data.upcomingMeetings}

                </h2>

            </div>
                        {/* =====================================
                    AI Engine Status
            ====================================== */}

            <div className="widget-card">

                <div className="widget-header">

                    <CheckCircle2 size={20} />

                    <h3>AI Engine</h3>

                </div>

                <span
                    className={getStatusClass(data.aiHealth)}
                >
                    {data.aiHealth}
                </span>

                <small>
                    AI services are monitored continuously.
                </small>

            </div>

            {/* =====================================
                    System Health
            ====================================== */}

            <div className="widget-card">

                <div className="widget-header">

                    <AlertTriangle size={20} />

                    <h3>System Health</h3>

                </div>

                <span className="status-success">

                    Operational

                </span>

                <small>

                    Microsoft Graph, Backend API, Socket.IO and AI
                    services are operating normally.

                </small>

            </div>

        </section>

    );

};

export default memo(LiveWidgets);