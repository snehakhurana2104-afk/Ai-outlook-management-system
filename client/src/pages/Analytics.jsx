import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getInboxForRange,
  getSentForRange,
  getTodayRange,
  getCurrentMonthRange,
  calculateEmailMetrics,
  calculateResponseRate,
} from "../api/outlookApi";
import "./Analytics.css";

const RANGE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "last7", label: "Last 7 Days" },
  { key: "month", label: "This Month" },
];

const createLastSevenDaysRange = () => {
  const now = new Date();

  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return {
    startDateTime: start.toISOString(),
    endDateTime: now.toISOString(),
  };
};

const getRange = (range) => {
  if (range === "today") {
    return getTodayRange();
  }

  if (range === "last7") {
    return createLastSevenDaysRange();
  }

  return getCurrentMonthRange();
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.value)) {
    return value.value;
  }

  if (Array.isArray(value?.emails)) {
    return value.emails;
  }

  if (Array.isArray(value?.messages)) {
    return value.messages;
  }

  return [];
};

const getSenderAddress = (email) => {
  return (
    email?.from?.emailAddress?.address ||
    email?.sender?.emailAddress?.address ||
    email?.from?.address ||
    email?.sender?.address ||
    ""
  );
};

const getSenderName = (email) => {
  return (
    email?.from?.emailAddress?.name ||
    email?.sender?.emailAddress?.name ||
    getSenderAddress(email) ||
    "Unknown sender"
  );
};

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
};

const formatDateRange = (range) => {
  if (!range?.startDateTime || !range?.endDateTime) {
    return "";
  }

  const start = new Date(range.startDateTime);
  const end = new Date(range.endDateTime);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return "";
  }

  return `${start.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} — ${end.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
};

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
};

const Analytics = () => {
  const [selectedRange, setSelectedRange] = useState("today");
  const [receivedEmails, setReceivedEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const range = getRange(selectedRange);

      const [receivedResponse, sentResponse] = await Promise.all([
        getInboxForRange({
          ...range,
          top: 100,
        }),
        getSentForRange({
          ...range,
          top: 100,
        }),
      ]);

      const received = normalizeArray(receivedResponse);
      const sent = normalizeArray(sentResponse);

      setReceivedEmails(received);
      setSentEmails(sent);
    } catch (loadError) {
      setReceivedEmails([]);
      setSentEmails([]);
      setError(
        loadError?.message ||
          "Unable to load Outlook analytics data."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const metrics = useMemo(() => {
    const calculated = calculateEmailMetrics(receivedEmails);

    const received = Number(calculated?.totalEmails || 0);
    const unread = Number(calculated?.unreadEmails || 0);
    const highPriority = Number(
      calculated?.highPriorityEmails || 0
    );
    const attachments = Number(
      calculated?.attachmentEmails || 0
    );
    const flagged = Number(calculated?.flaggedEmails || 0);
    const read = Math.max(received - unread, 0);
    const sent = sentEmails.length;
    const activity = received + sent;

    const responseRate = calculateResponseRate({
      received,
      sent,
    });

    return {
      received,
      sent,
      unread,
      highPriority,
      read,
      attachments,
      flagged,
      activity,
      responseRate,
    };
  }, [receivedEmails, sentEmails]);

  const topSenders = useMemo(() => {
    const senderMap = new Map();

    receivedEmails.forEach((email) => {
      const address = getSenderAddress(email);

      if (!address) {
        return;
      }

      const normalizedAddress = address.toLowerCase();
      const name = getSenderName(email);

      if (!senderMap.has(normalizedAddress)) {
        senderMap.set(normalizedAddress, {
          address,
          name,
          count: 0,
        });
      }

      const sender = senderMap.get(normalizedAddress);

      sender.count += 1;

      if (
        (!sender.name || sender.name === sender.address) &&
        name
      ) {
        sender.name = name;
      }
    });

    return Array.from(senderMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [receivedEmails]);

  const inboxHealth = useMemo(() => {
    const total = metrics.received;

    if (!total) {
      return {
        readPercent: 0,
        unreadPercent: 0,
        priorityPercent: 0,
        attachmentPercent: 0,
      };
    }

    return {
      readPercent: Math.round(
        (metrics.read / total) * 100
      ),
      unreadPercent: Math.round(
        (metrics.unread / total) * 100
      ),
      priorityPercent: Math.round(
        (metrics.highPriority / total) * 100
      ),
      attachmentPercent: Math.round(
        (metrics.attachments / total) * 100
      ),
    };
  }, [metrics]);

  const range = useMemo(
    () => getRange(selectedRange),
    [selectedRange]
  );

  const selectedLabel =
    RANGE_OPTIONS.find(
      (item) => item.key === selectedRange
    )?.label || "Today";

  const cards = [
    {
      key: "received",
      label: "Received",
      value: metrics.received,
      detail: "Incoming Outlook emails",
      icon: "↙",
      tone: "blue",
    },
    {
      key: "sent",
      label: "Sent",
      value: metrics.sent,
      detail: "Outgoing Outlook emails",
      icon: "↗",
      tone: "violet",
    },
    {
      key: "unread",
      label: "Unread",
      value: metrics.unread,
      detail: "Awaiting your attention",
      icon: "●",
      tone: "orange",
    },
    {
      key: "priority",
      label: "High Priority",
      value: metrics.highPriority,
      detail: "Marked as important",
      icon: "!",
      tone: "red",
    },
    {
      key: "read",
      label: "Read",
      value: metrics.read,
      detail: "Already reviewed",
      icon: "✓",
      tone: "green",
    },
    {
      key: "attachments",
      label: "Attachments",
      value: metrics.attachments,
      detail: "Emails with files",
      icon: "⌕",
      tone: "cyan",
    },
    {
      key: "response",
      label: "Response Rate",
      value: `${metrics.responseRate}%`,
      detail: "Sent vs received activity",
      icon: "%",
      tone: "purple",
      isPercentage: true,
    },
    {
      key: "activity",
      label: "Email Activity",
      value: metrics.activity,
      detail: "Received + sent",
      icon: "↔",
      tone: "dark",
    },
  ];

  return (
    <div className="analytics-page">
      <main className="analytics-container">
        <header className="analytics-header">
          <div className="analytics-header-copy">
            <span className="analytics-eyebrow">
              OUTLOOK INTELLIGENCE
            </span>

            <h1>Analytics</h1>

            <p>
              Real-time communication performance from your
              Microsoft Outlook mailbox.
            </p>
          </div>

          <div className="analytics-header-meta">
            <div className="analytics-live-status">
              <span className="analytics-live-dot" />
              <span>Live Outlook Data</span>
            </div>

            <div className="analytics-date-range">
              {formatDateRange(range)}
            </div>
          </div>
        </header>

        <section className="analytics-toolbar">
          <div className="analytics-range-tabs">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={
                  selectedRange === option.key
                    ? "analytics-range-button active"
                    : "analytics-range-button"
                }
                onClick={() =>
                  setSelectedRange(option.key)
                }
                disabled={loading}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="analytics-refresh-button"
            onClick={loadAnalytics}
            disabled={loading}
          >
            <span
              className={
                loading
                  ? "refresh-icon spinning"
                  : "refresh-icon"
              }
            >
              ↻
            </span>
            <span>
              {loading ? "Refreshing" : "Refresh"}
            </span>
          </button>
        </section>

        {error && (
          <section className="analytics-error">
            <div className="analytics-error-icon">!</div>

            <div className="analytics-error-copy">
              <strong>Unable to load analytics</strong>
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={loadAnalytics}
            >
              Try Again
            </button>
          </section>
        )}

        <section className="analytics-performance-section">
          <div className="analytics-section-heading">
            <div>
              <span className="analytics-section-kicker">
                PERFORMANCE
              </span>

              <h2>Email Performance</h2>
            </div>

            <span className="analytics-section-period">
              {selectedLabel}
            </span>
          </div>

          <div className="analytics-kpi-grid">
            {cards.map((card) => (
              <article
                className="analytics-kpi-card"
                key={card.key}
              >
                <div className="analytics-kpi-top">
                  <div
                    className={`analytics-kpi-icon ${card.tone}`}
                  >
                    {card.icon}
                  </div>

                  <span className="analytics-kpi-arrow">
                    ›
                  </span>
                </div>

                <div className="analytics-kpi-value">
                  {loading ? (
                    <span className="analytics-skeleton-value" />
                  ) : card.isPercentage ? (
                    card.value
                  ) : (
                    formatNumber(card.value)
                  )}
                </div>

                <div className="analytics-kpi-label">
                  {card.label}
                </div>

                <div className="analytics-kpi-detail">
                  {card.detail}
                </div>

                <div className="analytics-kpi-glow" />
              </article>
            ))}
          </div>
        </section>

        <div className="analytics-lower-grid">
          <section className="analytics-panel inbox-health-panel">
            <div className="analytics-panel-header">
              <div>
                <span className="analytics-panel-kicker">
                  MAILBOX QUALITY
                </span>

                <h2>Inbox Health</h2>
              </div>

              <div className="analytics-panel-total">
                <strong>
                  {loading
                    ? "—"
                    : formatNumber(metrics.received)}
                </strong>

                <span>received</span>
              </div>
            </div>

            <div className="analytics-health-content">
              <div
                className="analytics-health-ring"
                style={{
                  "--health-progress": `${loading ? 0 : inboxHealth.readPercent * 3.6}deg`,
                }}
              >
                <div className="analytics-health-ring-inner">
                  <strong>
                    {loading
                      ? "—"
                      : `${inboxHealth.readPercent}%`}
                  </strong>

                  <span>Read</span>
                </div>
              </div>

              <div className="analytics-health-list">
                <div className="analytics-health-row">
                  <div className="analytics-health-label">
                    <span className="health-dot read" />
                    <span>Read</span>
                  </div>

                  <strong>
                    {loading
                      ? "—"
                      : `${formatNumber(metrics.read)} · ${inboxHealth.readPercent}%`}
                  </strong>
                </div>

                <div className="analytics-health-row">
                  <div className="analytics-health-label">
                    <span className="health-dot unread" />
                    <span>Unread</span>
                  </div>

                  <strong>
                    {loading
                      ? "—"
                      : `${formatNumber(metrics.unread)} · ${inboxHealth.unreadPercent}%`}
                  </strong>
                </div>

                <div className="analytics-health-row">
                  <div className="analytics-health-label">
                    <span className="health-dot priority" />
                    <span>High Priority</span>
                  </div>

                  <strong>
                    {loading
                      ? "—"
                      : `${formatNumber(metrics.highPriority)} · ${inboxHealth.priorityPercent}%`}
                  </strong>
                </div>

                <div className="analytics-health-row">
                  <div className="analytics-health-label">
                    <span className="health-dot attachments" />
                    <span>Attachments</span>
                  </div>

                  <strong>
                    {loading
                      ? "—"
                      : `${formatNumber(metrics.attachments)} · ${inboxHealth.attachmentPercent}%`}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="analytics-panel senders-panel">
            <div className="analytics-panel-header">
              <div>
                <span className="analytics-panel-kicker">
                  COMMUNICATION
                </span>

                <h2>Top Senders</h2>
              </div>

              <span className="analytics-panel-caption">
                Most frequent
              </span>
            </div>

            {loading ? (
              <div className="analytics-sender-loading">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    className="sender-skeleton"
                    key={index}
                  />
                ))}
              </div>
            ) : topSenders.length === 0 ? (
              <div className="analytics-empty-state">
                <div className="analytics-empty-icon">
                  ✉
                </div>

                <strong>No sender activity</strong>

                <span>
                  No received Outlook emails were found for
                  this period.
                </span>
              </div>
            ) : (
              <div className="analytics-sender-list">
                {topSenders.map((sender, index) => {
                  const percentage =
                    metrics.received > 0
                      ? Math.round(
                          (sender.count /
                            metrics.received) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      className="analytics-sender-row"
                      key={sender.address}
                    >
                      <div className="analytics-sender-rank">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="analytics-sender-avatar">
                        {getInitials(sender.name)}
                      </div>

                      <div className="analytics-sender-info">
                        <strong>{sender.name}</strong>
                        <span>{sender.address}</span>
                      </div>

                      <div className="analytics-sender-stats">
                        <strong>
                          {formatNumber(sender.count)}
                        </strong>

                        <span>{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Analytics;