import React, { useEffect, useMemo, useState } from "react";
import * as outlookApi from "../api/outlookApi";
import "./Dashboard.css";

const STATUS_CONFIG = {
  "Pending Client": {
    key: "pending-client",
    label: "Pending Client",
    icon: "◷",
    description: "Waiting for client response or action"
  },
  "Pending Self": {
    key: "pending-self",
    label: "Pending Self",
    icon: "◌",
    description: "Action required from you"
  },
  "In Progress": {
    key: "in-progress",
    label: "In Progress",
    icon: "↻",
    description: "Currently being worked on"
  },
  Complete: {
    key: "complete",
    label: "Complete",
    icon: "✓",
    description: "Completed or closed"
  }
};

function extractArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  if (!data || typeof data !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }

  if (Array.isArray(data.data)) return data.data;

  if (data.data && typeof data.data === "object") {
    for (const key of keys) {
      if (Array.isArray(data.data[key])) return data.data[key];
    }
  }

  if (Array.isArray(data.result)) return data.result;

  if (data.result && typeof data.result === "object") {
    for (const key of keys) {
      if (Array.isArray(data.result[key])) {
        return data.result[key];
      }
    }
  }

  if (Array.isArray(data.metrics)) return data.metrics;

  return [];
}

function getTodayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function getIndiaDateString(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getIndiaStartOfToday() {
  return `${getTodayString()}T00:00:00+05:30`;
}

function getIndiaEndOfToday() {
  return `${getTodayString()}T23:59:59.999+05:30`;
}

function isTodayReceivedEmail(email) {
  const value =
    email?.receivedDateTime ||
    email?.receivedAt ||
    email?.createdDateTime;

  return getIndiaDateString(value) === getTodayString();
}

function isTodaySentEmail(email) {
  const value =
    email?.sentDateTime ||
    email?.sentAt ||
    email?.createdDateTime;

  return getIndiaDateString(value) === getTodayString();
}

function getSenderName(email) {
  return (
    email?.from?.emailAddress?.name ||
    email?.sender?.emailAddress?.name ||
    email?.fromName ||
    email?.senderName ||
    email?.author ||
    email?.displayName ||
    "Unknown Sender"
  );
}

function getSenderEmail(email) {
  return (
    email?.from?.emailAddress?.address ||
    email?.sender?.emailAddress?.address ||
    email?.fromEmail ||
    email?.senderEmail ||
    email?.email ||
    ""
  );
}

function getInitials(name) {
  if (!name) return "?";

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function getEmailText(email) {
  const categories = Array.isArray(email?.categories)
    ? email.categories.join(" ")
    : "";

  const bodyContent =
    typeof email?.body?.content === "string"
      ? email.body.content
      : "";

  return [
    email?.subject,
    email?.bodyPreview,
    bodyContent,
    email?.status,
    email?.taskStatus,
    email?.projectStatus,
    email?.workStatus,
    email?.emailStatus,
    email?.category,
    email?.label,
    categories
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function normalizeStatus(value) {
  if (!value) return null;

  const text = String(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (
    text.includes("pending client") ||
    text.includes("client pending") ||
    text.includes("awaiting client") ||
    text.includes("waiting client") ||
    text.includes("wait client") ||
    text.includes("client response") ||
    text.includes("client action")
  ) {
    return "Pending Client";
  }

  if (
    text.includes("pending self") ||
    text.includes("self pending") ||
    text.includes("action required") ||
    text.includes("my action") ||
    text.includes("action from me") ||
    text.includes("waiting on me") ||
    text === "todo" ||
    text === "to do"
  ) {
    return "Pending Self";
  }

  if (
    text.includes("in progress") ||
    text.includes("ongoing") ||
    text.includes("working") ||
    text.includes("processing") ||
    text.includes("under progress") ||
    text.includes("being worked")
  ) {
    return "In Progress";
  }

  if (
    text.includes("complete") ||
    text.includes("completed") ||
    text.includes("closed") ||
    text.includes("resolved") ||
    text.includes("done") ||
    text.includes("finished")
  ) {
    return "Complete";
  }

  return null;
}

function classifyEmail(email) {
  const explicitValues = [
    email?.status,
    email?.taskStatus,
    email?.projectStatus,
    email?.workStatus,
    email?.emailStatus,
    email?.state,
    email?.label,
    email?.category
  ];

  for (const value of explicitValues) {
    const status = normalizeStatus(value);

    if (status) return status;
  }

  if (Array.isArray(email?.categories)) {
    for (const category of email.categories) {
      const status = normalizeStatus(category);

      if (status) return status;
    }
  }

  const text = getEmailText(email);

  const pendingClientPatterns = [
    "pending client",
    "client pending",
    "awaiting client",
    "waiting for client",
    "waiting on client",
    "awaiting customer",
    "customer response",
    "client response awaited",
    "client confirmation",
    "client approval",
    "client action required",
    "waiting for your response",
    "please confirm",
    "please share your feedback",
    "waiting for feedback",
    "awaiting approval from client"
  ];

  const pendingSelfPatterns = [
    "pending self",
    "action required from me",
    "my action",
    "i need to",
    "i will",
    "i'll",
    "need to send",
    "need to review",
    "need to check",
    "need to confirm",
    "need to follow up",
    "follow up required",
    "reminder to me",
    "my pending",
    "to do",
    "todo",
    "action item for me"
  ];

  const inProgressPatterns = [
    "in progress",
    "currently working",
    "working on",
    "under progress",
    "being worked",
    "processing",
    "ongoing",
    "work has started",
    "we are working",
    "team is working",
    "development in progress",
    "implementation in progress"
  ];

  const completePatterns = [
    "completed",
    "complete",
    "closed",
    "resolved",
    "done",
    "finished",
    "successfully completed",
    "task completed",
    "issue resolved",
    "case closed",
    "work completed",
    "project completed",
    "implementation completed"
  ];

  if (
    pendingClientPatterns.some((pattern) =>
      text.includes(pattern)
    )
  ) {
    return "Pending Client";
  }

  if (
    pendingSelfPatterns.some((pattern) =>
      text.includes(pattern)
    )
  ) {
    return "Pending Self";
  }

  if (
    inProgressPatterns.some((pattern) =>
      text.includes(pattern)
    )
  ) {
    return "In Progress";
  }

  if (
    completePatterns.some((pattern) =>
      text.includes(pattern)
    )
  ) {
    return "Complete";
  }

  return "Unassigned";
}

function getReceivedDate(email) {
  return (
    email?.receivedDateTime ||
    email?.receivedAt ||
    email?.createdDateTime ||
    email?.date ||
    email?.createdAt
  );
}

function formatDateOnly(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  });
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });
}

function formatLongDate(value) {
  if (!value) return "";

  const date = new Date(
    `${value}T00:00:00+05:30`
  );

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  });
}

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata"
    }).format(new Date())
  );

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";

  return "Good Evening";
}

function hasAttachment(email) {
  if (email?.hasAttachments === true) return true;
  if (email?.hasAttachment === true) return true;

  if (
    Array.isArray(email?.attachments) &&
    email.attachments.length > 0
  ) {
    return true;
  }

  return false;
}

function getAttachmentText(email) {
  if (
    Array.isArray(email?.attachments) &&
    email.attachments.length > 0
  ) {
    return `${email.attachments.length} Attachment${
      email.attachments.length > 1 ? "s" : ""
    }`;
  }

  if (hasAttachment(email)) return "Attachment";

  return "";
}

function isEmailUnread(email) {
  if (email?.isRead === false) return true;
  if (email?.isRead === true) return false;
  if (email?.read === false) return true;
  if (email?.read === true) return false;
  if (email?.is_read === false) return true;

  return false;
}

function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizeSentArray(data) {
  return extractArray(data, [
    "emails",
    "messages",
    "value",
    "items",
    "sent",
    "sentEmails",
    "sentItems"
  ]);
}

function getSentApiFunction() {
  const candidates = [
    "getOutlookSentEmails",
    "getOutlookSentItems",
    "getOutlookSent",
    "getOutlookSentMail"
  ];

  for (const name of candidates) {
    if (typeof outlookApi[name] === "function") {
      return outlookApi[name];
    }
  }

  return null;
}

function Dashboard() {
  const [emails, setEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    getTodayString
  );

  async function loadDashboard(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const today = getTodayString();
      const startDateTime = getIndiaStartOfToday();
      const endDateTime = getIndiaEndOfToday();

      const sentFunction = getSentApiFunction();

      const inboxRequest =
        typeof outlookApi.getInboxForRange === "function"
          ? outlookApi.getInboxForRange({
              startDateTime,
              endDateTime,
              top: 100
            })
          : typeof outlookApi.getOutlookInbox === "function"
            ? outlookApi.getOutlookInbox({
                date: today,
                top: 250
              })
            : Promise.resolve([]);

      const sentRequest =
        typeof outlookApi.getSentForRange === "function"
          ? outlookApi.getSentForRange({
              startDateTime,
              endDateTime,
              top: 100
            })
          : sentFunction
            ? sentFunction({
                date: today,
                top: 250
              })
            : Promise.resolve([]);

      const requests = [
        inboxRequest,
        typeof outlookApi.getOutlookDashboardMetrics ===
        "function"
          ? outlookApi.getOutlookDashboardMetrics({
              date: today
            })
          : Promise.resolve(null),
        typeof outlookApi.getOutlookProfile === "function"
          ? outlookApi.getOutlookProfile()
          : Promise.resolve(null),
        typeof outlookApi.getOutlookHealth === "function"
          ? outlookApi.getOutlookHealth()
          : Promise.resolve(null),
        sentRequest
      ];

      const results =
        await Promise.allSettled(requests);

      const inboxResult = results[0];
      const metricsResult = results[1];
      const profileResult = results[2];
      const healthResult = results[3];
      const sentResult = results[4];

      let nextEmails = [];
      let nextSentEmails = [];
      let nextMetrics = {};
      let nextProfile = null;
      let nextConnected = false;

      if (inboxResult.status === "fulfilled") {
        const rawEmails = extractArray(
          inboxResult.value,
          [
            "emails",
            "messages",
            "value",
            "items"
          ]
        );

        nextEmails = rawEmails
          .filter(isTodayReceivedEmail)
          .map((email) => ({
            ...email,
            workStatus: classifyEmail(email)
          }));
      }

      if (metricsResult.status === "fulfilled") {
        nextMetrics =
          metricsResult.value || {};
      }

      if (profileResult.status === "fulfilled") {
        nextProfile =
          profileResult.value || null;
      }

      if (healthResult.status === "fulfilled") {
        const healthData =
          healthResult.value || {};

        nextConnected =
          healthData?.connected === true ||
          healthData?.healthy === true ||
          healthData?.graphConnected === true ||
          healthData?.success === true ||
          healthData?.data?.connected === true ||
          healthData?.data?.healthy === true ||
          healthData?.data?.graphConnected === true;
      }

      if (sentResult.status === "fulfilled") {
        const rawSent = normalizeSentArray(
          sentResult.value
        );

        nextSentEmails =
          rawSent.filter(isTodaySentEmail);
      }

      setEmails(nextEmails);
      setMetrics(nextMetrics);
      setProfile(nextProfile);
      setConnected(nextConnected);
      setSentEmails(nextSentEmails);
      setSelectedDate(today);

      if (
        inboxResult.status === "rejected" &&
        sentResult.status === "rejected" &&
        profileResult.status === "rejected"
      ) {
        setError(
          inboxResult.reason?.message ||
            sentResult.reason?.message ||
            "Unable to load Outlook data."
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load Outlook data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard(false);

    const timer = setInterval(() => {
      const currentToday = getTodayString();

      setSelectedDate((previous) => {
        if (previous !== currentToday) {
          return currentToday;
        }

        return previous;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedDate === getTodayString()) {
      return;
    }

    setSelectedDate(getTodayString());
  }, [selectedDate]);

  const receivedCount = emails.length;

  const unreadCount = emails.filter(
    isEmailUnread
  ).length;

  const sentCount = sentEmails.length;

  const attachmentCount = emails.filter(
    hasAttachment
  ).length;

  const readCount = Math.max(
    receivedCount - unreadCount,
    0
  );

  const statusCounts = useMemo(
    () => ({
      "Pending Client": emails.filter(
        (email) =>
          email.workStatus ===
          "Pending Client"
      ).length,

      "Pending Self": emails.filter(
        (email) =>
          email.workStatus ===
          "Pending Self"
      ).length,

      "In Progress": emails.filter(
        (email) =>
          email.workStatus ===
          "In Progress"
      ).length,

      Complete: emails.filter(
        (email) =>
          email.workStatus ===
          "Complete"
      ).length
    }),
    [emails]
  );

  const filteredEmails =
    selectedStatus === "All"
      ? emails
      : emails.filter(
          (email) =>
            email.workStatus ===
            selectedStatus
        );

  const displayName =
    profile?.displayName ||
    profile?.givenName ||
    profile?.data?.displayName ||
    "Admin";

  function handleStatusClick(status) {
    setSelectedStatus((current) =>
      current === status ? "All" : status
    );
  }

  if (loading) {
    return (
      <div className="dashboard-page dashboard-loading">
        <div className="dashboard-loader">
          <div className="loader-ring" />

          <div className="loader-copy">
            <strong>
              Loading your Outlook workspace
            </strong>

            <span>
              Synchronizing today’s Outlook data
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-title-block">
          <span className="dashboard-eyebrow">
            OUTLOOK INTELLIGENCE
          </span>

          <h1>
            {getGreeting()}, {displayName}
          </h1>

          <p>
            Here’s your Outlook workspace for today.
          </p>
        </div>

       
      </header>

      {error && (
        <div className="dashboard-error">
          <div className="dashboard-error-icon">
            !
          </div>

          <div>
            <strong>
              Unable to load some Outlook data
            </strong>

            <small>{error}</small>
          </div>

          <button
            onClick={() =>
              loadDashboard(true)
            }
          >
            Retry
          </button>
        </div>
      )}

      <section className="kpi-grid">
        <button
          className="kpi-card kpi-blue"
          onClick={() =>
            setSelectedStatus("All")
          }
        >
          <div className="kpi-top">
            <span className="kpi-icon">
              ✉
            </span>

            <span className="kpi-arrow">
              ↗
            </span>
          </div>

          <strong>{receivedCount}</strong>

          <span>Received Emails</span>

          <small>
            Today’s inbox activity
          </small>
        </button>

        <button
          className="kpi-card kpi-orange"
          onClick={() =>
            setSelectedStatus("All")
          }
        >
          <div className="kpi-top">
            <span className="kpi-icon">
              ●
            </span>

            <span className="kpi-arrow">
              ↗
            </span>
          </div>

          <strong>{unreadCount}</strong>

          <span>Unread</span>

          <small>
            Needs your attention
          </small>
        </button>

        <div className="kpi-card kpi-purple">
          <div className="kpi-top">
            <span className="kpi-icon">
              ➤
            </span>

            <span className="kpi-arrow">
              ↗
            </span>
          </div>

          <strong>{sentCount}</strong>

          <span>Sent Emails</span>

          <small>
            Today’s outgoing communication
          </small>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <span className="kpi-icon">
              ✓
            </span>

            <span className="kpi-arrow">
              ↗
            </span>
          </div>

          <strong>{readCount}</strong>

          <span>Read Emails</span>

          <small>
            Emails already reviewed today
          </small>
        </div>

        <div className="kpi-card kpi-teal">
          <div className="kpi-top">
            <span className="kpi-icon">
              ⌁
            </span>

            <span className="kpi-arrow">
              ↗
            </span>
          </div>

          <strong>{attachmentCount}</strong>

          <span>Documents</span>

          <small>
            Emails with attachments today
          </small>
        </div>
      </section>

      <section className="work-status-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">
              WORK STATUS
            </span>

            <h2>Email workflow</h2>

            <p>
              Track the current state of today’s
              communication.
            </p>
          </div>

          <span className="section-count">
            {emails.length} emails
          </span>
        </div>

        <div className="work-status-grid">
          {Object.keys(STATUS_CONFIG).map(
            (status) => {
              const config =
                STATUS_CONFIG[status];

              const count =
                statusCounts[status];

              const active =
                selectedStatus === status;

              return (
                <button
                  key={status}
                  className={`work-status-card ${
                    config.key
                  } ${
                    active ? "active" : ""
                  }`}
                  onClick={() =>
                    handleStatusClick(status)
                  }
                >
                  <div className="work-status-icon">
                    {config.icon}
                  </div>

                  <div className="work-status-content">
                    <strong>{count}</strong>

                    <span>
                      {config.label}
                    </span>

                    <small>
                      {config.description}
                    </small>
                  </div>

                  <span className="status-chevron">
                    ›
                  </span>
                </button>
              );
            }
          )}
        </div>
      </section>

      <section className="messages-section">
        <div className="messages-heading">
          <div>
            <span className="section-eyebrow">
              TODAY’S MESSAGES
            </span>

            <h2>
              {selectedStatus === "All"
                ? "Today’s Outlook emails"
                : selectedStatus}
            </h2>

            <p>
              {selectedStatus === "All"
                ? `${filteredEmails.length} messages received today`
                : `${filteredEmails.length} messages in this workflow today`}
            </p>
          </div>

          <div className="message-filters">
            <button
              className={
                selectedStatus === "All"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedStatus("All")
              }
            >
              All
            </button>

            {Object.keys(
              STATUS_CONFIG
            ).map((status) => (
              <button
                key={status}
                className={
                  selectedStatus === status
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedStatus(status)
                }
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="email-list">
          {filteredEmails.length === 0 ? (
            <div className="empty-email-state">
              <div className="empty-icon">
                ✉
              </div>

              <strong>
                No emails received today
              </strong>

              <span>
                There is no Outlook inbox activity
                for today in this workflow.
              </span>

              {selectedStatus !== "All" && (
                <button
                  onClick={() =>
                    setSelectedStatus("All")
                  }
                >
                  View all today’s emails
                </button>
              )}
            </div>
          ) : (
            filteredEmails.map(
              (email, index) => {
                const sender =
                  getSenderName(email);

                const senderEmail =
                  getSenderEmail(email);

                const receivedDate =
                  getReceivedDate(email);

                const status =
                  email.workStatus;

                const attachment =
                  getAttachmentText(email);

                const unread =
                  isEmailUnread(email);

                return (
                  <button
                    key={
                      email.id ||
                      `${email.subject}-${receivedDate}-${index}`
                    }
                    className={`email-row ${
                      unread
                        ? "email-row-unread"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedEmail(email)
                    }
                  >
                    <div className="email-avatar">
                      {getInitials(sender)}
                    </div>

                    <div className="email-main">
                      <div className="email-sender-line">
                        <strong>
                          {sender}
                        </strong>

                        {unread && (
                          <span className="new-badge">
                            NEW
                          </span>
                        )}

                        {attachment && (
                          <span className="email-mini-badge attachment">
                            {attachment}
                          </span>
                        )}
                      </div>

                      <h3>
                        {email.subject ||
                          "(No subject)"}
                      </h3>

                      <p>
                        {email.bodyPreview ||
                          email.preview ||
                          "No preview available for this email."}
                      </p>

                      <div className="email-meta">
                        <span>
                          {senderEmail}
                        </span>
                      </div>
                    </div>

                    <div className="email-right">
                      {status &&
                        status !==
                          "Unassigned" && (
                          <span
                            className={`email-status ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        )}

                      <div className="email-date">
                        <strong>
                          {formatDateOnly(
                            receivedDate
                          )}
                        </strong>

                        <span>
                          {formatTime(
                            receivedDate
                          )}
                        </span>
                      </div>

                      <span className="email-chevron">
                        ›
                      </span>
                    </div>
                  </button>
                );
              }
            )
          )}
        </div>
      </section>

      <footer className="dashboard-footer">
        <div>
          <span className="footer-dot" />

          <span>
            Microsoft Outlook
          </span>
        </div>

        <span>
          {emails.length} today’s emails loaded
        </span>
      </footer>

      {selectedEmail && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setSelectedEmail(null)
          }
        >
          <div
            className="email-detail-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="detail-header">
              <div>
                <span className="section-eyebrow">
                  EMAIL DETAILS
                </span>

                <h2>
                  {selectedEmail.subject ||
                    "(No subject)"}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedEmail(null)
                }
              >
                ×
              </button>
            </div>

            <div className="detail-status-row">
              {selectedEmail.workStatus &&
                selectedEmail.workStatus !==
                  "Unassigned" && (
                  <span
                    className={`email-status ${getStatusClass(
                      selectedEmail.workStatus
                    )}`}
                  >
                    {selectedEmail.workStatus}
                  </span>
                )}

              {isEmailUnread(
                selectedEmail
              ) && (
                <span className="new-badge">
                  NEW
                </span>
              )}
            </div>

            <div className="detail-sender">
              <div className="detail-avatar">
                {getInitials(
                  getSenderName(
                    selectedEmail
                  )
                )}
              </div>

              <div>
                <strong>
                  {getSenderName(
                    selectedEmail
                  )}
                </strong>

                <span>
                  {getSenderEmail(
                    selectedEmail
                  )}
                </span>
              </div>
            </div>

            <div className="detail-grid">
              <div>
                <span>Date</span>

                <strong>
                  {formatDateOnly(
                    getReceivedDate(
                      selectedEmail
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>Time</span>

                <strong>
                  {formatTime(
                    getReceivedDate(
                      selectedEmail
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>Attachments</span>

                <strong>
                  {hasAttachment(
                    selectedEmail
                  )
                    ? "Yes"
                    : "No"}
                </strong>
              </div>
            </div>

            <div className="detail-preview">
              <span>
                Message Preview
              </span>

              <p>
                {selectedEmail.bodyPreview ||
                  selectedEmail.preview ||
                  "No preview available."}
              </p>
            </div>

            {selectedEmail.webLink && (
              <a
                href={
                  selectedEmail.webLink
                }
                target="_blank"
                rel="noreferrer"
                className="open-outlook-button"
              >
                Open in Outlook
                <span>↗</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;