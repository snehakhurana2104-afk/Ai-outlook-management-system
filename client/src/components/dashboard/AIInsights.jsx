// ===========================================================
// AIInsights.jsx
// PHASE 4 - PART 6
// PART 1
// Enterprise AI Insights Panel
// ===========================================================

import React, { memo, useMemo } from "react";

import {
    Brain,
    Sparkles,
    AlertTriangle,
    TrendingUp,
    ArrowRight,
} from "lucide-react";

import "./AIInsights.css";

// ===========================================================
// Component
// ===========================================================

const AIInsights = ({
    insights = {},
    onViewRecommendations,
}) => {

    // =======================================================
    // Memoized Data
    // =======================================================

    const summary = useMemo(
        () => insights.summary || "",
        [insights]
    );

    const alerts = useMemo(
        () => insights.priorityAlerts || [],
        [insights]
    );

    const recommendations = useMemo(
        () => insights.recommendations || [],
        [insights]
    );

    return (

        <section className="ai-insights">

            {/* =====================================
                    Executive AI Summary
            ====================================== */}

            <div className="ai-card">

                <div className="ai-card-header">

                    <div className="ai-title">

                        <Brain size={20} />

                        <h3>Executive AI Summary</h3>

                    </div>

                </div>

                <div className="ai-summary">

                    <p>

                        {summary ||

                            "No AI summary available for the selected period."}

                    </p>

                </div>

            </div>

            {/* =====================================
                    High Priority Alerts
            ====================================== */}

            <div className="ai-card">

                <div className="ai-card-header">

                    <div className="ai-title">

                        <AlertTriangle size={20} />

                        <h3>Priority Alerts</h3>

                    </div>

                </div>

                <div className="alert-list">

                    {alerts.length === 0 ? (

                        <div className="ai-empty">

                            No active alerts.

                        </div>

                    ) : (

                        alerts.map((alert) => (

                            <div
                                key={alert.id}
                                className="alert-item"
                            >

                                <AlertTriangle
                                    size={18}
                                />

                                <div className="alert-content">

                                    <h4>

                                        {alert.title}

                                    </h4>

                                    <p>

                                        {alert.message}

                                    </p>

                                </div>

                            </div>

                        ))

                    )}

                </div>

            </div>

            {/* =====================================
                    AI Recommendations
            ====================================== */}

            <div className="ai-card">

                <div className="ai-card-header">

                    <div className="ai-title">

                        <Sparkles size={20} />

                        <h3>AI Recommendations</h3>

                    </div>

                </div>

                <div className="recommendation-list">

                    {recommendations.length === 0 ? (

                        <div className="ai-empty">

                            No recommendations available.

                        </div>

                    ) : (

                        recommendations.map((item) => (

                            <div
                                key={item.id}
                                className="recommendation-item"
                            >

                                <TrendingUp
                                    size={18}
                                />

                                <div className="recommendation-content">

                                    <h4>

                                        {item.title}

                                    </h4>

                                    <p>

                                        {item.description}

                                    </p>

                                </div>

                            </div>

                        ))

                    )}

                </div>

                <button
                    className="ai-view-btn"
                    onClick={onViewRecommendations}
                >

                    View All Recommendations

                    <ArrowRight size={18} />

                </button>

            </div>
                        {/* =====================================
                    Sentiment Analysis
            ====================================== */}

            <div className="ai-card">

                <div className="ai-card-header">

                    <div className="ai-title">

                        <TrendingUp size={20} />

                        <h3>Sentiment Analysis</h3>

                    </div>

                </div>

                <div className="sentiment-grid">

                    <div className="sentiment-item positive">

                        <span className="sentiment-label">
                            Positive
                        </span>

                        <strong>
                            {insights.sentiment?.positive ?? 0}%
                        </strong>

                    </div>

                    <div className="sentiment-item neutral">

                        <span className="sentiment-label">
                            Neutral
                        </span>

                        <strong>
                            {insights.sentiment?.neutral ?? 0}%
                        </strong>

                    </div>

                    <div className="sentiment-item negative">

                        <span className="sentiment-label">
                            Negative
                        </span>

                        <strong>
                            {insights.sentiment?.negative ?? 0}%
                        </strong>

                    </div>

                </div>

            </div>

            {/* =====================================
                    Response Risk
            ====================================== */}

            <div className="ai-card">

                <div className="ai-card-header">

                    <div className="ai-title">

                        <AlertTriangle size={20} />

                        <h3>Response Risk</h3>

                    </div>

                </div>

                <div className="risk-list">

                    {(insights.responseRisks || []).length === 0 ? (

                        <div className="ai-empty">
                            No response risks detected.
                        </div>

                    ) : (

                        insights.responseRisks.map((risk) => (

                            <div
                                key={risk.id}
                                className={`risk-item ${risk.level?.toLowerCase()}`}
                            >

                                <div className="risk-content">

                                    <h4>
                                        {risk.title}
                                    </h4>

                                    <p>
                                        {risk.description}
                                    </p>

                                </div>

                                <span className="risk-level">

                                    {risk.level}

                                </span>

                            </div>

                        ))

                    )}

                </div>

            </div>

            {/* =====================================
                    Follow-up Suggestions
            ====================================== */}

            <div className="ai-card">

                <div className="ai-card-header">

                    <div className="ai-title">

                        <Sparkles size={20} />

                        <h3>Follow-up Suggestions</h3>

                    </div>

                </div>

                <div className="followup-list">

                    {(insights.followUps || []).length === 0 ? (

                        <div className="ai-empty">
                            No follow-up suggestions available.
                        </div>

                    ) : (

                        insights.followUps.map((item) => (

                            <div
                                key={item.id}
                                className="followup-item"
                            >

                                <div className="followup-content">

                                    <h4>
                                        {item.title}
                                    </h4>

                                    <p>
                                        {item.description}
                                    </p>

                                </div>

                            </div>

                        ))

                    )}

                </div>

            </div>

            {/* =====================================
                    AI Confidence Score
            ====================================== */}

            <div className="ai-card">

                <div className="ai-card-header">

                    <div className="ai-title">

                        <Brain size={20} />

                        <h3>AI Confidence</h3>

                    </div>

                </div>

                <div className="confidence-wrapper">

                    <div className="confidence-score">

                        <h1>

                            {insights.confidence ?? 0}%

                        </h1>

                        <p>

                            Overall AI Confidence

                        </p>

                    </div>

                    <div className="confidence-bar">

                        <div
                            className="confidence-fill"
                            style={{
                                width: `${Math.min(
                                    insights.confidence ?? 0,
                                    100
                                )}%`,
                            }}
                        />

                    </div>

                </div>

            </div>

        </section>

    );

};

export default memo(AIInsights);