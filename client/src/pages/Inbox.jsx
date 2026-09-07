import React, { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ChevronRight,
  FileText,
  Flag,
  Inbox as InboxIcon,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  RefreshCw,
  Search,
  Star,
  X
} from "lucide-react";
import * as outlookApi from "../api/outlookApi";
import "./Inbox.css";

const getValue = (obj, paths, fallback = "") => {
  for (const path of paths) {
    const parts = path.split(".");
    let value = obj;

    for (const part of parts) {
      value = value?.[part];
    }

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
};

const toText = (value) => {
  if (typeof value === "string") return value;

  if (typeof value?.content === "string") {
    return value.content;
  }

  if (Array.isArray(value?.content)) {
    return value.content
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item?.content === "string") return item.content;
        return "";
      })
      .join(" ");
  }

  return "";
};

const cleanText = (value) => {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeEmail = (email, direction = "received") => {
  const senderName = getValue(
    email,
    [
      "from.emailAddress.name",
      "sender.emailAddress.name",
      "from.name",
      "sender.name"
    ],
    "Unknown sender"
  );

  const senderEmail = getValue(
    email,
    [
      "from.emailAddress.address",
      "sender.emailAddress.address",
      "from.address",
      "sender.address"
    ],
    ""
  );

  const subject = String(
    getValue(email, ["subject", "title"], "(No subject)")
  );

  const rawBody = getValue(
    email,
    ["body", "bodyPreview", "content"],
    ""
  );

  const body = toText(rawBody);

  const receivedAt = getValue(
    email,
    [
      "receivedDateTime",
      "receivedAt",
      "createdDateTime",
      "date"
    ],
    null
  );

  const sentAt = getValue(
    email,
    [
      "sentDateTime",
      "sentAt",
      "createdDateTime",
      "date"
    ],
    null
  );

  const categories = Array.isArray(email.categories)
    ? email.categories.filter(Boolean)
    : [];

  const importance = String(
    getValue(email, ["importance", "priority"], "normal")
  ).toLowerCase();

  const isRead =
    email.isRead === true ||
    email.read === true;

  const hasAttachments =
    email.hasAttachments === true ||
    (Array.isArray(email.attachments) &&
      email.attachments.length > 0);

  return {
    ...email,
    id: email.id || email.messageId,
    direction,
    senderName: String(senderName),
    senderEmail: String(senderEmail),
    subject,
    body,
    preview: cleanText(
      email.bodyPreview ||
        body ||
        "No message preview available."
    ),
    receivedAt,
    sentAt,
    importance,
    isRead,
    hasAttachments,
    categories
  };
};

const getMonthStart = () => {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
};

const getNextMonthStart = () => {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  );
};

const isInCurrentMonth = (value) => {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const start = getMonthStart();
  const end = getNextMonthStart();

  return date >= start && date < end;
};

const formatMonth = () => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(new Date());
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short"
  });
};

const formatFullDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getInitials = (name) => {
  const parts = String(name || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "U";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const unwrapCollection = (result) => {
  if (Array.isArray(result)) {
    return result;
  }

  return (
    result?.emails ||
    result?.messages ||
    result?.value ||
    result?.data ||
    result?.items ||
    []
  );
};

const getNextLink = (result) => {
  return (
    result?.["@odata.nextLink"] ||
    result?.nextLink ||
    result?.next ||
    result?.pagination?.nextLink ||
    result?.pagination?.next ||
    null
  );
};

const getInboxData = async (options = {}) => {
  const candidates = [
    "getOutlookInbox",
    "getInbox",
    "getOutlookEmails"
  ];

  for (const name of candidates) {
    if (typeof outlookApi[name] === "function") {
      return await outlookApi[name](options);
    }
  }

  throw new Error("Inbox API is not available.");
};

const getSentData = async (options = {}) => {
  const candidates = [
    "getOutlookSentEmails",
    "getOutlookSentItems",
    "getOutlookSent",
    "getOutlookSentMail"
  ];

  for (const name of candidates) {
    if (typeof outlookApi[name] === "function") {
      return await outlookApi[name](options);
    }
  }

  return null;
};

const getRangeInboxData = async (startDateTime, endDateTime) => {
  if (typeof outlookApi.getInboxForRange === "function") {
    try {
      return await outlookApi.getInboxForRange({
        startDateTime,
        endDateTime
      });
    } catch {
      try {
        return await outlookApi.getInboxForRange(
          startDateTime,
          endDateTime
        );
      } catch {}
    }
  }

  return getInboxData({
    top: 1000,
    startDateTime,
    endDateTime
  });
};

const getRangeSentData = async (startDateTime, endDateTime) => {
  if (typeof outlookApi.getSentForRange === "function") {
    try {
      return await outlookApi.getSentForRange({
        startDateTime,
        endDateTime
      });
    } catch {
      try {
        return await outlookApi.getSentForRange(
          startDateTime,
          endDateTime
        );
      } catch {}
    }
  }

  return getSentData({
    top: 1000,
    startDateTime,
    endDateTime
  });
};

const getDashboardMetrics = async () => {
  if (
    typeof outlookApi.getOutlookDashboardMetrics ===
    "function"
  ) {
    try {
      return await outlookApi.getOutlookDashboardMetrics();
    } catch {
      return null;
    }
  }

  return null;
};

const extractMetric = (source, keys) => {
  if (!source || typeof source !== "object") {
    return null;
  }

  const visited = new Set();

  const walk = (value) => {
    if (!value || typeof value !== "object") {
      return null;
    }

    if (visited.has(value)) {
      return null;
    }

    visited.add(value);

    for (const key of keys) {
      if (
        Object.prototype.hasOwnProperty.call(value, key) &&
        value[key] !== undefined &&
        value[key] !== null
      ) {
        const raw = value[key];

        if (typeof raw === "number") {
          return raw;
        }

        const parsed = Number(
          String(raw).replace("%", "").trim()
        );

        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    for (const child of Object.values(value)) {
      const found = walk(child);

      if (found !== null) {
        return found;
      }
    }

    return null;
  };

  return walk(source);
};

function Inbox() {
  const [emails, setEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const monthName = formatMonth();

  const loadInbox = async (refresh = false) => {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const monthStart = getMonthStart().toISOString();
      const monthEnd = getNextMonthStart().toISOString();

      const [
        inboxResult,
        sentResult,
        metricsResult
      ] = await Promise.all([
        getRangeInboxData(monthStart, monthEnd),
        getRangeSentData(monthStart, monthEnd),
        getDashboardMetrics()
      ]);

      let rawInbox = unwrapCollection(inboxResult);

      const inboxNextLink = getNextLink(inboxResult);

      if (inboxNextLink) {
        try {
          const secondPage = await getInboxData({
            nextLink: inboxNextLink
          });

          rawInbox = [
            ...rawInbox,
            ...unwrapCollection(secondPage)
          ];
        } catch {}
      }

      let rawSent = unwrapCollection(sentResult);

      const sentNextLink = getNextLink(sentResult);

      if (sentNextLink) {
        try {
          const secondSentPage = await getSentData({
            nextLink: sentNextLink
          });

          rawSent = [
            ...rawSent,
            ...unwrapCollection(secondSentPage)
          ];
        } catch {}
      }

      const normalizedEmails = rawInbox
        .map((email) =>
          normalizeEmail(email, "received")
        )
        .filter((email) => email.id)
        .filter((email) =>
          isInCurrentMonth(email.receivedAt)
        )
        .sort((a, b) => {
          const first = new Date(
            a.receivedAt || 0
          ).getTime();

          const second = new Date(
            b.receivedAt || 0
          ).getTime();

          return second - first;
        });

      const normalizedSent = rawSent
        .map((email) =>
          normalizeEmail(email, "sent")
        )
        .filter((email) => email.id)
        .filter((email) =>
          isInCurrentMonth(email.sentAt)
        )
        .sort((a, b) => {
          const first = new Date(
            a.sentAt || 0
          ).getTime();

          const second = new Date(
            b.sentAt || 0
          ).getTime();

          return second - first;
        });

      setEmails(normalizedEmails);
      setSentEmails(normalizedSent);
      setMetrics(metricsResult);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load your Outlook mailbox."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const monthStats = useMemo(() => {
    const received = emails.length;

    const unread = emails.filter(
      (email) => !email.isRead
    ).length;

    const important = emails.filter(
      (email) =>
        email.importance === "high" ||
        email.importance === "important"
    ).length;

    const documents = emails.filter(
      (email) => email.hasAttachments
    ).length;

    const sent = sentEmails.length;

    const metricResponse = extractMetric(metrics, [
      "responseRate",
      "replyRate",
      "responsePercentage",
      "responsePercent"
    ]);

    const responseRate =
      Number.isFinite(metricResponse)
        ? Math.max(
            0,
            Math.min(100, metricResponse)
          )
        : sent > 0
          ? Math.min(
              100,
              Math.round(
                (Math.min(sent, received) /
                  Math.max(received, 1)) *
                  100
              )
            )
          : 0;

    return {
      received,
      unread,
      sent,
      important,
      documents,
      responseRate
    };
  }, [emails, sentEmails, metrics]);

  const filteredEmails = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return emails;
    }

    return emails.filter((email) => {
      return (
        email.subject
          .toLowerCase()
          .includes(query) ||
        email.senderName
          .toLowerCase()
          .includes(query) ||
        email.senderEmail
          .toLowerCase()
          .includes(query) ||
        email.preview
          .toLowerCase()
          .includes(query)
      );
    });
  }, [emails, search]);

  const cards = [
    {
      label: "Received Emails",
      value: monthStats.received,
      description: "Current month inbox",
      icon: Mail,
      type: "blue"
    },
    {
      label: "Unread",
      value: monthStats.unread,
      description: "Needs your attention",
      icon: MailOpen,
      type: "orange"
    },
    {
      label: "Sent Emails",
      value: monthStats.sent,
      description: "Current month outgoing",
      icon: RefreshCw,
      type: "purple"
    },
    {
      label: "Priority",
      value: monthStats.important,
      description: "High importance emails",
      icon: Flag,
      type: "red"
    },
    {
      label: "Documents",
      value: monthStats.documents,
      description: "Emails with attachments",
      icon: Paperclip,
      type: "green"
    },
    {
      label: "Response Rate",
      value: `${monthStats.responseRate}%`,
      description: "Communication efficiency",
      icon: FileText,
      type: "teal"
    }
  ];

  return (
    <div className="inbox-page">
      <div className="inbox-header">
        <div className="inbox-title-area">
          <div className="inbox-eyebrow">
            <InboxIcon size={14} />
            OUTLOOK MAIL
          </div>

          <h1>Inbox</h1>

          <p>
            Your Outlook conversations and
            communication activity for {monthName}.
          </p>
        </div>

        <button
          className="inbox-refresh"
          onClick={() => loadInbox(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2
              size={16}
              className="spin"
            />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </div>

      <div className="inbox-month-banner">
        <div className="month-icon">
          <Mail size={19} />
        </div>

        <div>
          <strong>{monthName}</strong>

          <span>
            Showing Outlook conversations and
            outgoing communication for the current
            month
          </span>
        </div>

        <div className="month-banner-status">
          <span className="status-dot" />
          Live Outlook data
        </div>
      </div>

      <div className="inbox-kpi-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              className={`inbox-kpi-card ${card.type}`}
              key={card.label}
            >
              <div className="kpi-top">
                <div className="kpi-icon">
                  <Icon size={17} />
                </div>

                <ChevronRight size={15} />
              </div>

              <div className="kpi-value">
                {card.value}
              </div>

              <div className="kpi-label">
                {card.label}
              </div>

              <div className="kpi-description">
                {card.description}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="inbox-error">
          <Mail size={17} />

          <span>{error}</span>

          <button
            onClick={() => loadInbox(true)}
          >
            Try again
          </button>
        </div>
      )}

      <div className="monthly-mail-card">
        <div className="monthly-mail-header">
          <div>
            <div className="section-eyebrow">
              RECENT MESSAGES
            </div>

            <h2>Monthly Outlook emails</h2>

            <p>
              Messages received in your mailbox
              during {monthName}.
            </p>
          </div>

          <div className="monthly-total">
            <strong>{emails.length}</strong>
            <span>conversations</span>
          </div>
        </div>

        <div className="mail-search-row">
          <div className="inbox-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search conversations, senders or subjects..."
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {search && (
            <span className="search-result-count">
              {filteredEmails.length} results
            </span>
          )}
        </div>

        <div className="email-list">
          {loading ? (
            <div className="inbox-state">
              <Loader2
                size={28}
                className="spin"
              />

              <strong>
                Loading monthly emails
              </strong>

              <span>
                Fetching your Outlook conversations
                for {monthName}.
              </span>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="inbox-state">
              <MailOpen size={36} />

              <strong>
                {search
                  ? "No matching emails"
                  : "No emails received this month"}
              </strong>

              <span>
                {search
                  ? "Try a different sender, subject or keyword."
                  : `There are no Outlook conversations available for ${monthName}.`}
              </span>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <button
                key={email.id}
                className={`email-row ${
                  !email.isRead ? "unread" : ""
                } ${
                  selectedEmail?.id === email.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedEmail(email)
                }
              >
                <div className="sender-avatar">
                  {getInitials(
                    email.senderName
                  )}
                </div>

                <div className="email-main">
                  <div className="email-top">
                    <div className="sender-line">
                      <strong>
                        {email.senderName}
                      </strong>

                      {!email.isRead && (
                        <span className="new-badge">
                          NEW
                        </span>
                      )}

                      {email.hasAttachments && (
                        <span className="attachment-badge">
                          <Paperclip size={11} />
                          Attachment
                        </span>
                      )}
                    </div>

                    <div className="email-meta">
                      {email.importance ===
                        "high" && (
                        <Flag size={13} />
                      )}

                      <span>
                        {formatDate(
                          email.receivedAt
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="email-subject">
                    {email.subject}
                  </div>

                  <div className="email-preview">
                    {email.preview}
                  </div>

                  <div className="email-address">
                    {email.senderEmail}
                  </div>
                </div>

                <ChevronRight
                  size={17}
                  className="email-arrow"
                />
              </button>
            ))
          )}
        </div>
      </div>

      {selectedEmail && (
        <div
          className="email-detail-overlay"
          onClick={() =>
            setSelectedEmail(null)
          }
        >
          <aside
            className="email-detail"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="detail-header">
              <div>
                <span>
                  Email conversation
                </span>

                <h2>
                  {selectedEmail.subject}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedEmail(null)
                }
                aria-label="Close email"
              >
                <X size={18} />
              </button>
            </div>

            <div className="detail-sender">
              <div className="sender-avatar large">
                {getInitials(
                  selectedEmail.senderName
                )}
              </div>

              <div>
                <strong>
                  {selectedEmail.senderName}
                </strong>

                <span>
                  {selectedEmail.senderEmail ||
                    "Email address unavailable"}
                </span>
              </div>
            </div>

            <div className="detail-date">
              {formatFullDate(
                selectedEmail.receivedAt
              )}
            </div>

            <div className="detail-body">
              {selectedEmail.body ? (
                <div>
                  {cleanText(
                    selectedEmail.body
                  )}
                </div>
              ) : (
                <span>
                  No message content available.
                </span>
              )}
            </div>

            {selectedEmail.hasAttachments && (
              <div className="attachment-note">
                <Paperclip size={15} />
                This email contains
                attachments.
              </div>
            )}

            <div className="detail-footer">
              <button>
                <Star size={15} />
                Important
              </button>

              <button>
                <Archive size={15} />
                Archive
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Inbox;