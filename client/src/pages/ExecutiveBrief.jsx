import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  RefreshCw,
  Send,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  getInboxForRange,
  getSentForRange,
} from "../api/outlookApi";
import "./ExecutiveBriefing.css";

const getItems = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.messages)) {
    return response.messages;
  }

  if (Array.isArray(response?.emails)) {
    return response.emails;
  }

  return [];
};

const getSender = (item) => {
  return (
    item?.from?.emailAddress?.name ||
    item?.sender?.emailAddress?.name ||
    item?.from?.name ||
    item?.sender?.name ||
    "Unknown sender"
  );
};

const getSenderEmail = (item) => {
  return (
    item?.from?.emailAddress?.address ||
    item?.sender?.emailAddress?.address ||
    item?.from?.address ||
    item?.sender?.address ||
    ""
  );
};

const getSubject = (item) => {
  return item?.subject || "No subject";
};

const getReceivedDate = (item) => {
  return (
    item?.receivedDateTime ||
    item?.sentDateTime ||
    item?.createdDateTime ||
    item?.lastModifiedDateTime ||
    null
  );
};

const getRecipients = (item) => {
  const recipients =
    item?.toRecipients ||
    item?.to ||
    [];

  if (!Array.isArray(recipients)) return [];

  return recipients
    .map(
      (recipient) =>
        recipient?.emailAddress?.address ||
        recipient?.address ||
        recipient?.email ||
        ""
    )
    .filter(Boolean);
};

const getPriority = (item) => {
  return (
    item?.importance === "high" ||
    item?.priority === "high" ||
    item?.isImportant === true
  );
};

const getUnread = (item) => {
  return item?.isRead === false;
};

const getAttachment = (item) => {
  return (
    item?.hasAttachments === true ||
    Array.isArray(item?.attachments) && item.attachments.length > 0
  );
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Unknown date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
};

const formatTime = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
};

const formatPeriod = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(startDate)} – ${new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(endDate)}`;
};

const ExecutiveBriefing = () => {
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  const loadBriefing = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const end = new Date();
      const start = new Date();

      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const endDate = end.toISOString();
      const startDate = start.toISOString();

      const [inboxResponse, sentResponse] = await Promise.all([
        getInboxForRange(startDate, endDate),
        getSentForRange(startDate, endDate),
      ]);

      const inboxItems = getItems(inboxResponse);
      const sentItems = getItems(sentResponse);

      setInbox(inboxItems);
      setSent(sentItems);
    } catch (err) {
      console.error(err);

      setInbox([]);
      setSent([]);

      setError(
        err?.message ||
          "Unable to load Outlook data. Please refresh and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  const metrics = useMemo(() => {
    const received = inbox.length;
    const outgoing = sent.length;

    const unread = inbox.filter(getUnread).length;
    const priority = inbox.filter(getPriority).length;
    const documents = inbox.filter(getAttachment).length;

    const responseRate =
      received > 0
        ? Math.min(100, Math.round((outgoing / received) * 100))
        : 0;

    const totalActivity = received + outgoing;

    return {
      received,
      outgoing,
      unread,
      priority,
      documents,
      responseRate,
      totalActivity,
    };
  }, [inbox, sent]);

  const senderData = useMemo(() => {
    const map = {};

    inbox.forEach((item) => {
      const email = getSenderEmail(item);
      const name = getSender(item);

      if (!email && name === "Unknown sender") return;

      const key = email || name;

      if (!map[key]) {
        map[key] = {
          name,
          email,
          count: 0,
          latest: getReceivedDate(item),
        };
      }

      map[key].count += 1;

      const currentDate = new Date(getReceivedDate(item) || 0);
      const latestDate = new Date(map[key].latest || 0);

      if (currentDate > latestDate) {
        map[key].latest = getReceivedDate(item);
      }
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [inbox]);

  const priorityMessages = useMemo(() => {
    return inbox
      .filter((item) => getPriority(item))
      .sort(
        (a, b) =>
          new Date(getReceivedDate(b) || 0) -
          new Date(getReceivedDate(a) || 0)
      )
      .slice(0, 5);
  }, [inbox]);

  const latestMessages = useMemo(() => {
    const all = [
      ...inbox.map((item) => ({
        ...item,
        messageType: "Received",
      })),
      ...sent.map((item) => ({
        ...item,
        messageType: "Sent",
      })),
    ];

    return all
      .sort(
        (a, b) =>
          new Date(getReceivedDate(b) || 0) -
          new Date(getReceivedDate(a) || 0)
      )
      .slice(0, 6);
  }, [inbox, sent]);

  const executiveSignal = useMemo(() => {
    if (metrics.totalActivity === 0) {
      return {
        title: "No Outlook activity in the selected period",
        text: "There is no recent incoming or outgoing communication available for this briefing.",
        type: "neutral",
      };
    }

    if (metrics.priority > 0 && metrics.unread > 0) {
      return {
        title: "Priority communication needs review",
        text: `${metrics.priority} high-priority email${metrics.priority === 1 ? "" : "s"} and ${metrics.unread} unread message${metrics.unread === 1 ? "" : "s"} are currently visible.`,
        type: "attention",
      };
    }

    if (metrics.unread > 0) {
      return {
        title: "Unread communication requires review",
        text: `${metrics.unread} unread message${metrics.unread === 1 ? "" : "s"} remain in the selected period.`,
        type: "attention",
      };
    }

    if (metrics.outgoing > metrics.received) {
      return {
        title: "Outbound communication is active",
        text: "Your outgoing communication is higher than incoming communication during this period.",
        type: "positive",
      };
    }

    return {
      title: "Communication activity is active",
      text: `${metrics.totalActivity} Outlook message${metrics.totalActivity === 1 ? "" : "s"} were found across incoming and outgoing communication.`,
      type: "positive",
    };
  }, [metrics]);

  const periodStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const periodEnd = useMemo(() => new Date(), []);

  return (
    <div className="executive-briefing-page">
      <div className="executive-briefing-container">
        <header className="briefing-header">
          <div>
            <div className="briefing-eyebrow">
              EXECUTIVE INTELLIGENCE
            </div>

            <h1>Executive Briefing</h1>

            <p>
              A real-time summary of your Outlook communication,
              priorities and key relationships.
            </p>
          </div>

          <button
            type="button"
            className="briefing-refresh"
            onClick={() => loadBriefing(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "briefing-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="briefing-period-card">
          <div className="briefing-period-icon">
            <Clock3 size={21} />
          </div>

          <div>
            <span>Briefing period</span>
            <strong>
              {formatPeriod(periodStart, periodEnd)}
            </strong>
          </div>

          <div className="briefing-period-total">
            <strong>{metrics.totalActivity}</strong>
            <span>total messages</span>
          </div>
        </section>

        {error && (
          <div className="briefing-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <section className={`executive-signal ${executiveSignal.type}`}>
          <div className="signal-icon">
            {executiveSignal.type === "attention" ? (
              <ShieldAlert size={22} />
            ) : executiveSignal.type === "positive" ? (
              <CheckCircle2 size={22} />
            ) : (
              <Activity size={22} />
            )}
          </div>

          <div className="signal-content">
            <span>EXECUTIVE SIGNAL</span>
            <h2>{executiveSignal.title}</h2>
            <p>{executiveSignal.text}</p>
          </div>

          <div className="signal-score">
            <strong>{metrics.responseRate}%</strong>
            <span>response activity</span>
          </div>
        </section>

        <section className="briefing-kpi-grid">
          <div className="briefing-kpi">
            <div className="kpi-icon blue">
              <Mail size={20} />
            </div>
            <div>
              <span>Received</span>
              <strong>{metrics.received}</strong>
              <small>Incoming communication</small>
            </div>
          </div>

          <div className="briefing-kpi">
            <div className="kpi-icon amber">
              <AlertCircle size={20} />
            </div>
            <div>
              <span>Unread</span>
              <strong>{metrics.unread}</strong>
              <small>Requires review</small>
            </div>
          </div>

          <div className="briefing-kpi">
            <div className="kpi-icon red">
              <ShieldAlert size={20} />
            </div>
            <div>
              <span>Priority</span>
              <strong>{metrics.priority}</strong>
              <small>High importance emails</small>
            </div>
          </div>

          <div className="briefing-kpi">
            <div className="kpi-icon green">
              <Send size={20} />
            </div>
            <div>
              <span>Sent</span>
              <strong>{metrics.outgoing}</strong>
              <small>Outgoing communication</small>
            </div>
          </div>

          <div className="briefing-kpi">
            <div className="kpi-icon purple">
              <FileText size={20} />
            </div>
            <div>
              <span>Documents</span>
              <strong>{metrics.documents}</strong>
              <small>Emails with attachments</small>
            </div>
          </div>

          <div className="briefing-kpi">
            <div className="kpi-icon teal">
              <BarChart3 size={20} />
            </div>
            <div>
              <span>Response Activity</span>
              <strong>{metrics.responseRate}%</strong>
              <small>Sent vs received</small>
            </div>
          </div>
        </section>

        <div className="briefing-main-grid">
          <section className="briefing-card priority-card">
            <div className="briefing-card-header">
              <div>
                <span className="card-eyebrow">
                  PRIORITY COMMUNICATION
                </span>
                <h2>What needs your attention</h2>
              </div>

              <ShieldAlert size={19} />
            </div>

            {loading ? (
              <div className="briefing-empty">
                Loading Outlook priorities...
              </div>
            ) : priorityMessages.length === 0 ? (
              <div className="briefing-empty">
                <CheckCircle2 size={22} />
                <strong>No high-priority emails</strong>
                <span>
                  No high-importance communication was found in
                  the selected period.
                </span>
              </div>
            ) : (
              <div className="briefing-message-list">
                {priorityMessages.map((message, index) => (
                  <button
                    type="button"
                    className="briefing-message"
                    key={message?.id || index}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="message-avatar">
                      {getSender(message)
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div className="message-info">
                      <strong>{getSender(message)}</strong>
                      <span>{getSubject(message)}</span>
                    </div>

                    <div className="message-date">
                      {formatDate(getReceivedDate(message))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="briefing-card relationships-card">
            <div className="briefing-card-header">
              <div>
                <span className="card-eyebrow">
                  KEY RELATIONSHIPS
                </span>
                <h2>Most active contacts</h2>
              </div>

              <Users size={19} />
            </div>

            {loading ? (
              <div className="briefing-empty">
                Loading Outlook relationships...
              </div>
            ) : senderData.length === 0 ? (
              <div className="briefing-empty">
                <Users size={22} />
                <strong>No contacts found</strong>
                <span>
                  No incoming Outlook communication was found in
                  the selected period.
                </span>
              </div>
            ) : (
              <div className="relationship-list">
                {senderData.map((person, index) => (
                  <div
                    className="relationship-row"
                    key={person.email || index}
                  >
                    <div className="relationship-avatar">
                      {person.name
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="relationship-info">
                      <strong>{person.name}</strong>
                      <span>{person.email}</span>
                    </div>

                    <div className="relationship-count">
                      <strong>{person.count}</strong>
                      <span>emails</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="briefing-card activity-card">
          <div className="briefing-card-header">
            <div>
              <span className="card-eyebrow">
                RECENT OUTLOOK ACTIVITY
              </span>
              <h2>Latest communication</h2>
            </div>

            <Activity size={19} />
          </div>

          {loading ? (
            <div className="briefing-loading">
              <div className="loading-line" />
              <div className="loading-line" />
              <div className="loading-line" />
            </div>
          ) : latestMessages.length === 0 ? (
            <div className="briefing-empty large">
              <Mail size={25} />
              <strong>No Outlook messages found</strong>
              <span>
                There is no incoming or outgoing email activity
                available for the selected period.
              </span>
            </div>
          ) : (
            <div className="activity-table">
              <div className="activity-table-head">
                <span>TYPE</span>
                <span>CONTACT</span>
                <span>SUBJECT</span>
                <span>DATE</span>
                <span>TIME</span>
              </div>

              {latestMessages.map((message, index) => (
                <button
                  type="button"
                  className="activity-row"
                  key={`${message?.id || "message"}-${index}`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <span>
                    <b
                      className={
                        message.messageType === "Sent"
                          ? "activity-type sent"
                          : "activity-type received"
                      }
                    >
                      {message.messageType}
                    </b>
                  </span>

                  <span className="activity-contact">
                    {message.messageType === "Sent"
                      ? getRecipients(message)[0] ||
                        "Recipient"
                      : getSender(message)}
                  </span>

                  <span className="activity-subject">
                    {getSubject(message)}
                  </span>

                  <span>
                    {formatDate(getReceivedDate(message))}
                  </span>

                  <span>
                    {formatTime(getReceivedDate(message))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedMessage && (
        <div
          className="briefing-modal-backdrop"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="briefing-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="briefing-modal-header">
              <div>
                <span>
                  {selectedMessage.messageType || "Received"}
                </span>
                <h2>
                  {getSubject(selectedMessage)}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
              >
                ×
              </button>
            </div>

            <div className="briefing-modal-details">
              <div>
                <span>Contact</span>
                <strong>
                  {selectedMessage.messageType === "Sent"
                    ? getRecipients(selectedMessage)[0] ||
                      "Recipient"
                    : getSender(selectedMessage)}
                </strong>
              </div>

              <div>
                <span>Date</span>
                <strong>
                  {formatDate(
                    getReceivedDate(selectedMessage)
                  )}
                </strong>
              </div>

              <div>
                <span>Time</span>
                <strong>
                  {formatTime(
                    getReceivedDate(selectedMessage)
                  )}
                </strong>
              </div>

              <div>
                <span>Importance</span>
                <strong>
                  {getPriority(selectedMessage)
                    ? "High"
                    : "Normal"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveBriefing;