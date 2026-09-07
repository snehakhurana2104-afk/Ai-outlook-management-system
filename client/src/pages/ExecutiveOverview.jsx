import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import {
  getOutlookInbox,
  getSentForRange,
  getCalendar
} from "../api/outlookApi";
import "./ExecutiveOverview.css";

const cleanText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;

  if (typeof value === "object") {
    if (typeof value.content === "string") return value.content;
    if (typeof value.text === "string") return value.text;
    if (typeof value.body === "string") return value.body;
  }

  return String(value);
};

const getEmailAddress = (message) =>
  message?.from?.emailAddress?.address ||
  message?.sender?.emailAddress?.address ||
  message?.from?.address ||
  message?.sender?.address ||
  "";

const getSenderName = (message) =>
  message?.from?.emailAddress?.name ||
  message?.sender?.emailAddress?.name ||
  message?.from?.name ||
  message?.sender?.name ||
  getEmailAddress(message).split("@")[0] ||
  "Unknown contact";

const getSubject = (message) =>
  cleanText(message?.subject || message?.title || "No subject");

const getBody = (message) =>
  cleanText(
    message?.bodyPreview ||
      message?.preview ||
      message?.body ||
      message?.content ||
      ""
  );

const isUnread = (message) =>
  message?.isRead === false ||
  message?.read === false ||
  message?.status === "unread";

const isImportant = (message) =>
  String(message?.importance || "").toLowerCase() === "high" ||
  String(message?.priority || "").toLowerCase() === "high";

const getDateValue = (message) =>
  message?.receivedDateTime ||
  message?.sentDateTime ||
  message?.createdDateTime ||
  message?.lastModifiedDateTime ||
  null;

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const daysSince = (value) => {
  const date = parseDate(value);

  if (!date) return 0;

  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86400000)
  );
};

const getInitials = (name) => {
  const parts = String(name || "Unknown")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${
    parts[parts.length - 1][0] || ""
  }`.toUpperCase();
};

const unwrap = (response) => {
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

  if (Array.isArray(response?.events)) {
    return response.events;
  }

  return [];
};

const getTodayLabel = () =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(new Date());

const formatTime = (value) => {
  const date = parseDate(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).format(date);
};

const classifyPriority = (message) => {
  const subject = getSubject(message).toLowerCase();
  const body = getBody(message).toLowerCase();
  const combined = `${subject} ${body}`;

  if (
    isImportant(message) ||
    /urgent|critical|escalat|immediate|asap|complaint|issue|problem|payment overdue|deadline/i.test(
      combined
    )
  ) {
    return "critical";
  }

  if (
    /follow.?up|reminder|pending|waiting|approval|action required|response required|quote|proposal|decision/i.test(
      combined
    )
  ) {
    return "attention";
  }

  return "normal";
};

const buildPriorityItems = (emails) =>
  emails
    .map((email, index) => {
      const priority = classifyPriority(email);
      const unread = isUnread(email);
      const age = daysSince(getDateValue(email));
      const subject = getSubject(email);
      const sender = getSenderName(email);
      const body = getBody(email);

      let score = 0;
      let reason = "Requires executive review";

      if (priority === "critical") score += 70;
      if (priority === "attention") score += 40;
      if (unread) score += 15;
      if (age >= 2) score += 10;

      if (
        /follow.?up|reminder|pending|waiting/i.test(
          `${subject} ${body}`
        )
      ) {
        score += 15;
        reason = "Follow-up or response appears pending";
      }

      if (
        /urgent|critical|escalat|immediate|complaint|issue|problem/i.test(
          `${subject} ${body}`
        )
      ) {
        score += 25;
        reason = "Potential business risk detected";
      }

      if (isImportant(email)) {
        score += 20;
        reason = "Marked high importance";
      }

      return {
        id: email?.id || `${sender}-${subject}-${index}`,
        sender,
        subject,
        body,
        date: getDateValue(email),
        score,
        priority,
        reason
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

const buildRelationships = (emails) => {
  const map = new Map();

  emails.forEach((email) => {
    const emailAddress = getEmailAddress(email);
    const name = getSenderName(email);

    if (!emailAddress && !name) return;

    const key =
      emailAddress.toLowerCase() ||
      name.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        name,
        email: emailAddress,
        count: 0,
        unread: 0,
        latest: getDateValue(email)
      });
    }

    const item = map.get(key);

    item.count += 1;

    if (isUnread(email)) {
      item.unread += 1;
    }

    const date = parseDate(getDateValue(email));
    const latest = parseDate(item.latest);

    if (date && (!latest || date > latest)) {
      item.latest = getDateValue(email);
    }
  });

  return [...map.values()]
    .map((item) => {
      const silence = daysSince(item.latest);

      let status = "healthy";
      let label = "Healthy communication";

      if (item.unread >= 3 || silence >= 4) {
        status = "risk";
        label =
          silence >= 4
            ? "Communication going quiet"
            : "Needs attention";
      } else if (item.unread >= 1 || silence >= 2) {
        status = "watch";
        label = "Worth monitoring";
      }

      return {
        ...item,
        silence,
        status,
        label
      };
    })
    .sort((a, b) => {
      const rank = {
        risk: 3,
        watch: 2,
        healthy: 1
      };

      return (
        rank[b.status] - rank[a.status] ||
        b.count - a.count
      );
    })
    .slice(0, 6);
};

const ExecutiveOverview = () => {
  const [emails, setEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    try {
      setError("");

      const now = new Date();

      const start = new Date(now);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      const startDateTime = start.toISOString();
      const endDateTime = end.toISOString();

      const calendarDate = now
        .toISOString()
        .slice(0, 10);

      const [inboxResult, sentResult, calendarResult] =
        await Promise.allSettled([
          getOutlookInbox({
            top: 100,
            startDateTime,
            endDateTime
          }),
          getSentForRange(
            startDateTime,
            endDateTime
          ),
          getCalendar({
            date: calendarDate
          })
        ]);

      if (inboxResult.status === "fulfilled") {
        setEmails(unwrap(inboxResult.value));
      } else {
        setEmails([]);
      }

      if (sentResult.status === "fulfilled") {
        setSentEmails(unwrap(sentResult.value));
      } else {
        setSentEmails([]);
      }

      if (calendarResult.status === "fulfilled") {
        setEvents(unwrap(calendarResult.value));
      } else {
        setEvents([]);
      }

      if (
        inboxResult.status === "rejected" &&
        sentResult.status === "rejected" &&
        calendarResult.status === "rejected"
      ) {
        throw new Error(
          "Unable to load Executive Overview data."
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load Executive Overview."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const priorities = useMemo(
    () => buildPriorityItems(emails),
    [emails]
  );

  const relationships = useMemo(
    () => buildRelationships(emails),
    [emails]
  );

  const insights = useMemo(() => {
    const critical = emails.filter(
      (email) =>
        classifyPriority(email) === "critical"
    ).length;

    const pending = emails.filter((email) =>
      /follow.?up|pending|waiting|approval|action required|response required|reminder/i.test(
        `${getSubject(email)} ${getBody(email)}`
      )
    ).length;

    const silentRelationships =
      relationships.filter(
        (item) => item.status === "risk"
      ).length;

    return {
      critical,
      pending,
      silentRelationships
    };
  }, [emails, relationships]);

  const changeSignals = useMemo(() => {
    const recent = emails.filter((email) => {
      const date = parseDate(
        getDateValue(email)
      );

      if (!date) return false;

      return (
        Date.now() - date.getTime() <=
        86400000
      );
    });

    const followUps = emails.filter((email) =>
      /follow.?up|reminder|pending|waiting|action required|response required/i.test(
        `${getSubject(email)} ${getBody(email)}`
      )
    ).length;

    const highPriority = emails.filter(
      isImportant
    ).length;

    const outgoingToday = sentEmails.filter(
      (email) => {
        const date = parseDate(
          getDateValue(email)
        );

        if (!date) return false;

        return (
          Date.now() - date.getTime() <=
          86400000
        );
      }
    ).length;

    return {
      recent: recent.length,
      followUps,
      highPriority,
      outgoingToday
    };
  }, [emails, sentEmails]);

  const executiveMessage = useMemo(() => {
    if (!emails.length) {
      return "No significant communication signals were detected today. Your executive workspace is currently clear.";
    }

    if (insights.critical > 0) {
      return `${insights.critical} communication ${
        insights.critical === 1
          ? "item requires"
          : "items require"
      } immediate attention. Review the priority queue before routine work.`;
    }

    if (insights.pending > 0) {
      return `${insights.pending} conversations show signs of pending follow-up or action. These should be reviewed before the end of the day.`;
    }

    if (insights.silentRelationships > 0) {
      return `${insights.silentRelationships} relationship${
        insights.silentRelationships === 1
          ? " is"
          : "s are"
      } showing reduced communication activity. Consider a proactive follow-up.`;
    }

    return "Communication is stable today. Focus on the highest-value conversations and scheduled meetings.";
  }, [emails, insights]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOverview();
  };

  return (
    <div className="executive-page">
      <div className="executive-shell">
        <header className="executive-header">
          <div>
            <div className="executive-eyebrow">
              <Sparkles size={14} />
              EXECUTIVE WORKSPACE
            </div>

            <h1>Executive Overview</h1>

            <p>
              Decision intelligence for communication,
              relationships and priorities.
            </p>
          </div>

          <div className="executive-header-actions">
            <div className="executive-date">
              <CalendarDays size={16} />
              {getTodayLabel()}
            </div>

            <button
              className="executive-refresh"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "spin-icon" : ""
                }
              />

              {refreshing
                ? "Refreshing"
                : "Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="executive-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <section className="ai-brief-card">
          <div className="ai-brief-icon">
            <Sparkles size={23} />
          </div>

          <div className="ai-brief-content">
            <div className="section-kicker">
              AI EXECUTIVE RADAR
            </div>

            <h2>
              What deserves your attention today?
            </h2>

            <p>
              {loading
                ? "Analysing your Outlook activity..."
                : executiveMessage}
            </p>
          </div>

          <div className="ai-brief-status">
            <span className="status-dot" />
            Live analysis
          </div>
        </section>

        <section className="signal-grid">
          <div className="signal-card signal-critical">
            <div className="signal-card-top">
              <div className="signal-icon">
                <ShieldAlert size={19} />
              </div>
              <span>Immediate</span>
            </div>

            <strong>
              {loading ? "—" : insights.critical}
            </strong>

            <h3>Critical Signals</h3>

            <p>
              Potential business risks detected
            </p>
          </div>

          <div className="signal-card signal-attention">
            <div className="signal-card-top">
              <div className="signal-icon">
                <Clock3 size={19} />
              </div>
              <span>Review</span>
            </div>

            <strong>
              {loading ? "—" : insights.pending}
            </strong>

            <h3>Action Signals</h3>

            <p>
              Follow-ups or responses may be pending
            </p>
          </div>

          <div className="signal-card signal-relationship">
            <div className="signal-card-top">
              <div className="signal-icon">
                <Users size={19} />
              </div>
              <span>Monitor</span>
            </div>

            <strong>
              {loading
                ? "—"
                : insights.silentRelationships}
            </strong>

            <h3>Relationship Risks</h3>

            <p>
              Communication activity needs attention
            </p>
          </div>

          <div className="signal-card signal-focus">
            <div className="signal-card-top">
              <div className="signal-icon">
                <Target size={19} />
              </div>
              <span>Focus</span>
            </div>

            <strong>
              {loading ? "—" : priorities.length}
            </strong>

            <h3>Top Priorities</h3>

            <p>
              Highest-value conversations to review
            </p>
          </div>
        </section>

        <div className="executive-main-grid">
          <section className="executive-card priority-card">
            <div className="card-header">
              <div>
                <div className="section-kicker">
                  FOCUS NOW
                </div>

                <h2>Top Priorities</h2>

                <p>
                  Conversations with the strongest
                  executive signals.
                </p>
              </div>

              <div className="card-header-icon">
                <Flame size={18} />
              </div>
            </div>

            <div className="priority-list">
              {loading ? (
                <div className="empty-state">
                  Analysing communication...
                </div>
              ) : priorities.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 size={28} />
                  <strong>
                    No priority items detected
                  </strong>
                  <span>
                    Your communication looks clear
                    for now.
                  </span>
                </div>
              ) : (
                priorities.map((item, index) => (
                  <div
                    className="priority-row"
                    key={item.id}
                  >
                    <div className="priority-number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div className="priority-avatar">
                      {getInitials(item.sender)}
                    </div>

                    <div className="priority-info">
                      <div className="priority-meta">
                        <span>
                          {item.sender}
                        </span>

                        {item.date && (
                          <time>
                            {formatTime(item.date)}
                          </time>
                        )}
                      </div>

                      <h3>{item.subject}</h3>

                      <p>{item.reason}</p>
                    </div>

                    <div
                      className={`priority-level priority-${item.priority}`}
                    >
                      {item.priority ===
                      "critical"
                        ? "High risk"
                        : item.priority ===
                          "attention"
                        ? "Review"
                        : "Monitor"}
                    </div>

                    <ArrowRight
                      size={16}
                      className="priority-arrow"
                    />
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="executive-card change-card">
            <div className="card-header">
              <div>
                <div className="section-kicker">
                  24-HOUR SIGNALS
                </div>

                <h2>What Changed</h2>

                <p>
                  Meaningful movement in your
                  communication.
                </p>
              </div>

              <div className="card-header-icon">
                <Zap size={18} />
              </div>
            </div>

            <div className="change-list">
              <div className="change-item">
                <div className="change-icon positive">
                  <TrendingUp size={17} />
                </div>

                <div>
                  <strong>
                    {changeSignals.recent}
                  </strong>
                  <span>
                    new conversations today
                  </span>
                </div>

                <ArrowUpRight size={15} />
              </div>

              <div className="change-item">
                <div className="change-icon warning">
                  <Clock3 size={17} />
                </div>

                <div>
                  <strong>
                    {changeSignals.followUps}
                  </strong>
                  <span>
                    follow-up signals detected
                  </span>
                </div>

                <ArrowRight size={15} />
              </div>

              <div className="change-item">
                <div className="change-icon danger">
                  <ShieldAlert size={17} />
                </div>

                <div>
                  <strong>
                    {changeSignals.highPriority}
                  </strong>
                  <span>
                    high-importance messages
                  </span>
                </div>

                <ArrowUpRight size={15} />
              </div>

              <div className="change-item">
                <div className="change-icon success">
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <strong>
                    {changeSignals.outgoingToday}
                  </strong>
                  <span>
                    outgoing responses today
                  </span>
                </div>

                <ArrowDownRight size={15} />
              </div>
            </div>
          </section>
        </div>

        <div className="executive-lower-grid">
          <section className="executive-card relationship-card">
            <div className="card-header">
              <div>
                <div className="section-kicker">
                  RELATIONSHIP PULSE
                </div>

                <h2>
                  People & Relationships
                </h2>

                <p>
                  Contacts showing the strongest
                  communication signals.
                </p>
              </div>

              <Users size={19} />
            </div>

            <div className="relationship-list">
              {loading ? (
                <div className="empty-state">
                  Loading relationships...
                </div>
              ) : relationships.length === 0 ? (
                <div className="empty-state">
                  <MessageCircle size={27} />

                  <strong>
                    No relationship data yet
                  </strong>

                  <span>
                    New communication will appear
                    here.
                  </span>
                </div>
              ) : (
                relationships.map((person) => (
                  <div
                    className="relationship-row"
                    key={
                      person.email ||
                      person.name
                    }
                  >
                    <div className="relationship-avatar">
                      {getInitials(person.name)}
                    </div>

                    <div className="relationship-info">
                      <strong>
                        {person.name}
                      </strong>

                      <span>
                        {person.count} conversation
                        {person.count === 1
                          ? ""
                          : "s"}{" "}
                        · {person.unread} unread
                      </span>
                    </div>

                    <div
                      className={`relationship-status ${person.status}`}
                    >
                      <span />

                      {person.status ===
                      "risk"
                        ? "At risk"
                        : person.status ===
                          "watch"
                        ? "Watch"
                        : "Healthy"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="executive-card meeting-card">
            <div className="card-header">
              <div>
                <div className="section-kicker">
                  TODAY'S FOCUS
                </div>

                <h2>
                  Executive Schedule
                </h2>

                <p>
                  Meetings that may require
                  preparation.
                </p>
              </div>

              <CalendarDays size={19} />
            </div>

            <div className="meeting-list">
              {loading ? (
                <div className="empty-state">
                  Loading schedule...
                </div>
              ) : events.length === 0 ? (
                <div className="empty-state meeting-empty">
                  <CalendarDays size={30} />

                  <strong>
                    No meetings scheduled
                  </strong>

                  <span>
                    Your calendar is clear for
                    today.
                  </span>
                </div>
              ) : (
                events
                  .slice(0, 5)
                  .map((event, index) => (
                    <div
                      className="meeting-row"
                      key={
                        event?.id || index
                      }
                    >
                      <div className="meeting-time">
                        {formatTime(
                          event?.start
                            ?.dateTime ||
                            event?.startDateTime ||
                            event?.start
                        )}
                      </div>

                      <div className="meeting-line" />

                      <div className="meeting-info">
                        <strong>
                          {cleanText(
                            event?.subject ||
                              event?.title ||
                              "Untitled meeting"
                          )}
                        </strong>

                        <span>
                          {cleanText(
                            event?.location
                              ?.displayName ||
                              event?.location ||
                              "No location"
                          )}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>
        </div>

        <section className="executive-focus-strip">
          <div className="focus-strip-icon">
            <Target size={20} />
          </div>

          <div className="focus-strip-content">
            <span className="section-kicker">
              RECOMMENDED EXECUTIVE FOCUS
            </span>

            <h2>
              {insights.critical > 0
                ? "Resolve critical communication before routine work."
                : insights.pending > 0
                ? "Clear pending commitments and follow-ups first."
                : insights.silentRelationships >
                  0
                ? "Reconnect with relationships showing reduced activity."
                : "Protect time for high-value conversations and strategic work."}
            </h2>
          </div>

          <div className="focus-strip-arrow">
            <ArrowRight size={19} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExecutiveOverview;