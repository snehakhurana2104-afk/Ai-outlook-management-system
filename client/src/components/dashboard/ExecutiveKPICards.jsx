import React, { memo, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

import "./ExecutiveKPICards.css";

const ExecutiveKPICards = ({
  title,
  value,
  icon: Icon,

  color = "blue",

  change,
  subtitle,

  trendPositive = true,

  loading = false,

  onClick,

  prefix = "",
  suffix = "",

  badge,

  description,

  className = "",
}) => {
  /* =========================================================
     COLOR THEMES
  ========================================================= */

  const themes = {
    blue: {
      accent: "#2563eb",
      accentDark: "#1d4ed8",
      soft: "#eff6ff",
      border: "#dbeafe",
      glow: "rgba(37, 99, 235, 0.16)",
    },

    green: {
      accent: "#16a34a",
      accentDark: "#15803d",
      soft: "#f0fdf4",
      border: "#dcfce7",
      glow: "rgba(22, 163, 74, 0.16)",
    },

    red: {
      accent: "#dc2626",
      accentDark: "#b91c1c",
      soft: "#fef2f2",
      border: "#fee2e2",
      glow: "rgba(220, 38, 38, 0.16)",
    },

    yellow: {
      accent: "#d97706",
      accentDark: "#b45309",
      soft: "#fffbeb",
      border: "#fef3c7",
      glow: "rgba(217, 119, 6, 0.16)",
    },

    purple: {
      accent: "#7c3aed",
      accentDark: "#6d28d9",
      soft: "#f5f3ff",
      border: "#ede9fe",
      glow: "rgba(124, 58, 237, 0.16)",
    },

    indigo: {
      accent: "#4f46e5",
      accentDark: "#4338ca",
      soft: "#eef2ff",
      border: "#e0e7ff",
      glow: "rgba(79, 70, 229, 0.16)",
    },

    pink: {
      accent: "#db2777",
      accentDark: "#be185d",
      soft: "#fdf2f8",
      border: "#fce7f3",
      glow: "rgba(219, 39, 119, 0.16)",
    },

    cyan: {
      accent: "#0891b2",
      accentDark: "#0e7490",
      soft: "#ecfeff",
      border: "#cffafe",
      glow: "rgba(8, 145, 178, 0.16)",
    },

    orange: {
      accent: "#ea580c",
      accentDark: "#c2410c",
      soft: "#fff7ed",
      border: "#ffedd5",
      glow: "rgba(234, 88, 12, 0.16)",
    },
  };

  const theme = themes[color] || themes.blue;

  /* =========================================================
     CHANGE TYPE
  ========================================================= */

  const hasChange =
    change !== undefined &&
    change !== null &&
    change !== "";

  const TrendIcon = useMemo(() => {
    if (!hasChange) return null;

    if (trendPositive === true) {
      return TrendingUp;
    }

    if (trendPositive === false) {
      return TrendingDown;
    }

    return Minus;
  }, [hasChange, trendPositive]);

  /* =========================================================
     CARD STYLE
  ========================================================= */

  const cardStyle = {
    "--kpi-accent": theme.accent,
    "--kpi-accent-dark": theme.accentDark,
    "--kpi-soft": theme.soft,
    "--kpi-border": theme.border,
    "--kpi-glow": theme.glow,
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <article
        className={[
          "executive-kpi-card",
          "executive-kpi-loading",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={cardStyle}
        aria-busy="true"
      >
        <div className="kpi-skeleton-top">
          <div className="kpi-skeleton kpi-skeleton-title" />

          <div className="kpi-skeleton kpi-skeleton-icon" />
        </div>

        <div className="kpi-skeleton kpi-skeleton-value" />

        <div className="kpi-skeleton kpi-skeleton-subtitle" />
      </article>
    );
  }

  /* =========================================================
     CARD
  ========================================================= */

  return (
    <article
      className={[
        "executive-kpi-card",
        onClick ? "executive-kpi-clickable" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={cardStyle}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onClick(event);
        }
      }}
    >
      {/* =====================================================
          TOP ACCENT
      ===================================================== */}

      <div className="kpi-top-accent" />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="kpi-header">
        <div className="kpi-title-wrapper">
          <p className="kpi-title">
            {title}
          </p>

          {badge && (
            <span className="kpi-badge">
              {badge}
            </span>
          )}
        </div>

        {/* ICON */}
        <div className="kpi-icon-wrapper">
          <div className="kpi-icon">
            {Icon ? (
              <Icon
                size={22}
                strokeWidth={2}
              />
            ) : (
              <TrendingUp
                size={22}
                strokeWidth={2}
              />
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          VALUE
      ===================================================== */}

      <div className="kpi-value-row">
        {prefix && (
          <span className="kpi-prefix">
            {prefix}
          </span>
        )}

        <h2 className="kpi-value">
          {value}
        </h2>

        {suffix && (
          <span className="kpi-suffix">
            {suffix}
          </span>
        )}
      </div>

      {/* =====================================================
          SUBTITLE
      ===================================================== */}

      {subtitle && (
        <p className="kpi-subtitle">
          {subtitle}
        </p>
      )}

      {/* =====================================================
          DESCRIPTION
      ===================================================== */}

      {description && (
        <p className="kpi-description">
          {description}
        </p>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      {hasChange && (
        <div className="kpi-footer">
          <div
            className={[
              "kpi-trend",
              trendPositive === true
                ? "trend-positive"
                : trendPositive === false
                ? "trend-negative"
                : "trend-neutral",
            ].join(" ")}
          >
            {TrendIcon && (
              <TrendIcon
                size={14}
                strokeWidth={2.5}
              />
            )}

            <span>
              {change}
            </span>
          </div>

          <span className="kpi-period">
            vs. previous period
          </span>
        </div>
      )}

      {/* =====================================================
          DECORATIVE GLOW
      ===================================================== */}

      <div className="kpi-background-glow" />
    </article>
  );
};

ExecutiveKPICards.displayName =
  "ExecutiveKPICards";

export default memo(ExecutiveKPICards);