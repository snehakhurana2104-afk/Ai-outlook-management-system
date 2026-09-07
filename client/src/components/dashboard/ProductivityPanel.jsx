// ===========================================================
// ProductivityPanel.jsx
// PHASE 4 - PART 7
// PART 1
// Enterprise Productivity Dashboard
// ===========================================================

import React, { memo, useMemo } from "react";

import {
    Timer,
    CheckCircle2,
    ShieldCheck,
    Users,
    Building2,
    TrendingUp,
} from "lucide-react";

import "./ProductivityPanel.css";

// ===========================================================
// Component
// ===========================================================

const ProductivityPanel = ({
    productivity = {},
}) => {

    // =======================================================
    // Memoized Values
    // =======================================================

    const metrics = useMemo(() => ({

        averageResponseTime:
            productivity.averageResponseTime ?? "--",

        completionRate:
            productivity.completionRate ?? 0,

        slaCompliance:
            productivity.slaCompliance ?? 0,

        teamProductivity:
            productivity.teamProductivity ?? 0,

        companyEfficiency:
            productivity.companyEfficiency ?? 0,

        productivityScore:
            productivity.productivityScore ?? 0,

    }), [productivity]);

    return (

        <section className="productivity-panel">

            {/* =====================================
                    Average Response Time
            ====================================== */}

            <div className="productivity-card">

                <div className="productivity-header">

                    <Timer size={22} />

                    <h3>Average Response Time</h3>

                </div>

                <div className="productivity-value">

                    <h2>

                        {metrics.averageResponseTime}

                    </h2>

                    <span>

                        Average time to respond

                    </span>

                </div>

            </div>

            {/* =====================================
                    Completion Rate
            ====================================== */}

            <div className="productivity-card">

                <div className="productivity-header">

                    <CheckCircle2 size={22} />

                    <h3>Completion Rate</h3>

                </div>

                <div className="productivity-value">

                    <h2>

                        {metrics.completionRate}%

                    </h2>

                </div>

                <div className="progress-bar">

                    <div
                        className="progress-fill"
                        style={{
                            width: `${metrics.completionRate}%`,
                        }}
                    />

                </div>

            </div>

            {/* =====================================
                    SLA Compliance
            ====================================== */}

            <div className="productivity-card">

                <div className="productivity-header">

                    <ShieldCheck size={22} />

                    <h3>SLA Compliance</h3>

                </div>

                <div className="productivity-value">

                    <h2>

                        {metrics.slaCompliance}%

                    </h2>

                </div>

                <div className="progress-bar">

                    <div
                        className="progress-fill"
                        style={{
                            width: `${metrics.slaCompliance}%`,
                        }}
                    />

                </div>

            </div>

            {/* =====================================
                    Team Productivity
            ====================================== */}

            <div className="productivity-card">

                <div className="productivity-header">

                    <Users size={22} />

                    <h3>Team Productivity</h3>

                </div>

                <div className="productivity-value">

                    <h2>

                        {metrics.teamProductivity}%

                    </h2>

                </div>

                <div className="progress-bar">

                    <div
                        className="progress-fill"
                        style={{
                            width: `${metrics.teamProductivity}%`,
                        }}
                    />

                </div>

            </div>
                        {/* =====================================
                    Company Efficiency
            ====================================== */}

            <div className="productivity-card">

                <div className="productivity-header">

                    <Building2 size={22} />

                    <h3>Company Efficiency</h3>

                </div>

                <div className="productivity-value">

                    <h2>

                        {metrics.companyEfficiency}%

                    </h2>

                </div>

                <div className="progress-bar">

                    <div
                        className="progress-fill"
                        style={{
                            width: `${Math.min(
                                metrics.companyEfficiency,
                                100
                            )}%`,
                        }}
                    />

                </div>

            </div>

            {/* =====================================
                    Overall Productivity Score
            ====================================== */}

            <div className="productivity-card productivity-highlight">

                <div className="productivity-header">

                    <TrendingUp size={22} />

                    <h3>Overall Productivity Score</h3>

                </div>

                <div className="productivity-score">

                    <h1>

                        {metrics.productivityScore}%

                    </h1>

                    <span>

                        Enterprise Performance

                    </span>

                </div>

                <div className="score-progress">

                    <div
                        className="score-progress-fill"
                        style={{
                            width: `${Math.min(
                                metrics.productivityScore,
                                100
                            )}%`,
                        }}
                    />

                </div>

            </div>

            {/* =====================================
                    Executive Summary
            ====================================== */}

            <div className="productivity-summary">

                <h3>

                    Executive Productivity Summary

                </h3>

                <p>

                    {productivity.summary ||

                        "No productivity summary is available for the selected period."}

                </p>

            </div>

        </section>

    );

};

export default memo(ProductivityPanel);