import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPaperPlane,
  FaRedo,
  FaSearch,
  FaSpinner,
  FaUser,
  FaEnvelope,
  FaChevronRight,
  FaRegCalendarAlt,
  FaTimesCircle
} from "react-icons/fa";
import {
  getInboxForRange,
  getSentForRange,
  getTodayRange,
  getMicrosoftAccount
} from "../api/outlookApi";
import "./FollowUpTracker.css";

const safeArray = (value) => {
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

const getAddress = (person) => {
  if (!person) {
    return "";
  }

  if (typeof person === "string") {
    return person.trim().toLowerCase();
  }

  return String(
    person?.emailAddress?.address ||
    person?.address ||
    person?.email ||
    person?.value ||
    ""
  )
    .trim()
    .toLowerCase();
};

const getName = (person) => {
  if (!person) {
    return "";
  }

  if (typeof person === "string") {
    return person;
  }

  return (
    person?.emailAddress?.name ||
    person?.name ||
    getAddress(person)
  );
};

const getRecipients = (message) => {
  const recipients = [
    ...(Array.isArray(message?.toRecipients)
      ? message.toRecipients
      : []),
    ...(Array.isArray(message?.ccRecipients)
      ? message.ccRecipients
      : [])
  ];

  return recipients
    .map((recipient) => ({
      address: getAddress(recipient),
      name: getName(recipient)
    }))
    .filter((recipient) => recipient.address);
};

const getMessageDate = (message) => {
  const raw =
    message?.sentDateTime ||
    message?.receivedDateTime ||
    message?.createdDateTime ||
    message?.date ||
    null;

  if (!raw) {
    return null;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const getMessageSubject = (message) => {
  const subject = String(message?.subject || "").trim();

  return subject || "(No subject)";
};

const normalizeText = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value?.content === "string") {
    return value.content;
  }

  return "";
};

const getAgeInHours = (date) => {
  if (!date) {
    return 0;
  }

  const difference =
    Date.now() - date.getTime();

  return Math.max(
    0,
    difference / (1000 * 60 * 60)
  );
};

const getAgeLabel = (date) => {
  if (!date) {
    return "Date unavailable";
  }

  const hours = getAgeInHours(date);

  if (hours < 1) {
    return "Just now";
  }

  if (hours < 24) {
    return `${Math.floor(hours)}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
};

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const formatShortDate = (date) => {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

const getLocalTodayRange = () => {
  return getTodayRange(new Date());
};

const getMonthRange = () => {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  );

  return {
    startDateTime: start.toISOString(),
    endDateTime: now.toISOString()
  };
};

const classifyFollowUp = ({
  sentMessage,
  replied,
  recipientCount
}) => {
  const date = getMessageDate(sentMessage);
  const hours = getAgeInHours(date);
  const importance = String(
    sentMessage?.importance || ""
  ).toLowerCase();

  const flagged =
    sentMessage?.flag?.flagStatus &&
    sentMessage.flag.flagStatus !== "notFlagged";

  if (replied) {
    return {
      status: "replied",
      label: "Replied",
      priority: "normal",
      score: 100
    };
  }

  if (
    flagged ||
    importance === "high" ||
    hours >= 72
  ) {
    return {
      status: "due",
      label: "Due",
      priority: "high",
      score: 90
    };
  }

  if (
    recipientCount > 0 &&
    hours >= 24
  ) {
    return {
      status: "waiting",
      label: "Waiting",
      priority: "medium",
      score: 65
    };
  }

  return {
    status: "waiting",
    label: "Waiting",
    priority: "low",
    score: 40
  };
};

const buildFollowUps = (
  sentMessages,
  inboxMessages,
  accountEmail
) => {
  const sent = safeArray(sentMessages);
  const inbox = safeArray(inboxMessages);

  const normalizedAccount =
    String(accountEmail || "")
      .trim()
      .toLowerCase();

  const repliesByConversation = new Map();

  inbox.forEach((message) => {
    const conversationId =
      message?.conversationId;

    if (!conversationId) {
      return;
    }

    const sender =
      getAddress(message?.from);

    if (
      normalizedAccount &&
      sender === normalizedAccount
    ) {
      return;
    }

    const date =
      message?.receivedDateTime
        ? new Date(message.receivedDateTime)
        : null;

    if (!date || Number.isNaN(date.getTime())) {
      return;
    }

    const existing =
      repliesByConversation.get(conversationId);

    if (
      !existing ||
      date.getTime() > existing.getTime()
    ) {
      repliesByConversation.set(
        conversationId,
        date
      );
    }
  });

  return sent
    .map((message) => {
      const conversationId =
        message?.conversationId || "";

      const sentDate =
        getMessageDate(message);

      const recipients =
        getRecipients(message);

      const replyDate =
        conversationId
          ? repliesByConversation.get(
              conversationId
            )
          : null;

      const replied =
        Boolean(
          replyDate &&
          sentDate &&
          replyDate.getTime() >
            sentDate.getTime()
        );

      const classification =
        classifyFollowUp({
          sentMessage: message,
          replied,
          recipientCount:
            recipients.length
        });

      return {
        id:
          message?.id ||
          `${conversationId}-${sentDate?.getTime() || Math.random()}`,
        conversationId,
        subject:
          getMessageSubject(message),
        recipients,
        sentDate,
        replyDate,
        replied,
        classification,
        ageLabel:
          getAgeLabel(sentDate),
        preview:
          normalizeText(
            message?.bodyPreview ||
            message?.body
          ),
        importance:
          String(
            message?.importance ||
            "normal"
          ).toLowerCase(),
        flagged:
          Boolean(
            message?.flag?.flagStatus &&
            message.flag.flagStatus !==
              "notFlagged"
          ),
        hasAttachments:
          message?.hasAttachments === true,
        webLink:
          message?.webLink ||
          ""
      };
    })
    .filter(
      (item) =>
        item.sentDate &&
        !Number.isNaN(
          item.sentDate.getTime()
        )
    )
    .sort(
      (a, b) =>
        b.sentDate.getTime() -
        a.sentDate.getTime()
    );
};

const StatCard = ({
  icon,
  label,
  value,
  description,
  tone
}) => {
  return (
    <div className={`followup-stat-card ${tone || ""}`}>
      <div className="followup-stat-icon">
        {icon}
      </div>

      <div className="followup-stat-content">
        <span className="followup-stat-label">
          {label}
        </span>

        <strong className="followup-stat-value">
          {value}
        </strong>

        <span className="followup-stat-description">
          {description}
        </span>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    due: {
      label: "Due",
      icon: <FaExclamationTriangle />
    },
    waiting: {
      label: "Waiting",
      icon: <FaClock />
    },
    replied: {
      label: "Replied",
      icon: <FaCheckCircle />
    }
  };

  const current =
    config[status] ||
    config.waiting;

  return (
    <span
      className={`followup-status-badge ${status}`}
    >
      {current.icon}
      {current.label}
    </span>
  );
};

const RecipientList = ({ recipients }) => {
  if (!recipients?.length) {
    return (
      <span className="followup-recipient-empty">
        No recipient
      </span>
    );
  }

  const visible =
    recipients.slice(0, 2);

  const remaining =
    recipients.length - visible.length;

  return (
    <div className="followup-recipient-list">
      {visible.map((recipient, index) => (
        <span
          key={`${recipient.address}-${index}`}
          className="followup-recipient"
          title={recipient.address}
        >
          <span className="followup-recipient-avatar">
            <FaUser />
          </span>

          <span className="followup-recipient-name">
            {recipient.name ||
              recipient.address}
          </span>
        </span>
      ))}

      {remaining > 0 && (
        <span className="followup-recipient-more">
          +{remaining}
        </span>
      )}
    </div>
  );
};

const FollowUpRow = ({
  item,
  onOpen
}) => {
  return (
    <button
      type="button"
      className="followup-row"
      onClick={() => onOpen(item)}
    >
      <div className="followup-row-main">
        <div className="followup-row-icon">
          {item.replied ? (
            <FaCheckCircle />
          ) : (
            <FaPaperPlane />
          )}
        </div>

        <div className="followup-row-copy">
          <div className="followup-row-topline">
            <h3>{item.subject}</h3>

            <StatusBadge
              status={
                item.classification.status
              }
            />
          </div>

          <RecipientList
            recipients={
              item.recipients
            }
          />

          {item.preview && (
            <p className="followup-row-preview">
              {item.preview}
            </p>
          )}

          <div className="followup-row-meta">
            <span>
              <FaRegCalendarAlt />
              {formatDate(item.sentDate)}
            </span>

            <span>
              {item.replied
                ? `Replied ${formatShortDate(
                    item.replyDate
                  )}`
                : item.ageLabel}
            </span>

            {item.flagged && (
              <span className="followup-meta-highlight">
                Flagged
              </span>
            )}

            {item.importance === "high" && (
              <span className="followup-meta-highlight">
                High priority
              </span>
            )}

            {item.hasAttachments && (
              <span>
                Attachment
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="followup-row-action">
        <FaChevronRight />
      </div>
    </button>
  );
};

const DetailModal = ({
  item,
  onClose
}) => {
  if (!item) {
    return null;
  }

  return (
    <div
      className="followup-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="followup-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="followup-modal-header">
          <div>
            <span className="followup-modal-eyebrow">
              FOLLOW-UP DETAIL
            </span>

            <h2>{item.subject}</h2>
          </div>

          <button
            type="button"
            className="followup-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimesCircle />
          </button>
        </div>

        <div className="followup-modal-status">
          <StatusBadge
            status={
              item.classification.status
            }
          />

          <span>
            Sent {formatDate(item.sentDate)}
          </span>
        </div>

        <div className="followup-detail-grid">
          <div className="followup-detail-block">
            <span>RECIPIENTS</span>

            <RecipientList
              recipients={
                item.recipients
              }
            />
          </div>

          <div className="followup-detail-block">
            <span>RESPONSE</span>

            <strong>
              {item.replied
                ? `Received ${formatDate(
                    item.replyDate
                  )}`
                : "No response detected"}
            </strong>
          </div>

          <div className="followup-detail-block">
            <span>PRIORITY</span>

            <strong>
              {item.importance === "high"
                ? "High"
                : "Normal"}
            </strong>
          </div>

          <div className="followup-detail-block">
            <span>FOLLOW-UP SIGNAL</span>

            <strong>
              {item.classification.status ===
              "due"
                ? "Requires attention"
                : item.classification.status ===
                  "waiting"
                ? "Awaiting response"
                : "Conversation answered"}
            </strong>
          </div>
        </div>

        {item.preview && (
          <div className="followup-preview-panel">
            <span>MESSAGE PREVIEW</span>
            <p>{item.preview}</p>
          </div>
        )}

        <div className="followup-modal-footer">
          <span>
            Microsoft Graph · Outlook Mail
          </span>

          {item.webLink && (
            <a
              href={item.webLink}
              target="_blank"
              rel="noreferrer"
              className="followup-open-mail"
            >
              Open in Outlook
              <FaChevronRight />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const FollowUpTracker = () => {
  const [period, setPeriod] =
    useState("month");

  const [messages, setMessages] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const loadData = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const range =
          period === "today"
            ? getLocalTodayRange()
            : getMonthRange();

        const account =
          await getMicrosoftAccount();

        const accountEmail =
          account?.username || "";

        const [
          inboxResponse,
          sentResponse
        ] = await Promise.all([
          getInboxForRange({
            ...range,
            top: 100
          }),
          getSentForRange({
            ...range,
            top: 100
          })
        ]);

        const inbox =
          safeArray(
            inboxResponse
          );

        const sent =
          safeArray(
            sentResponse
          );

        const followUps =
          buildFollowUps(
            sent,
            inbox,
            accountEmail
          );

        setMessages(
          followUps
        );

        setLastUpdated(
          new Date()
        );
      } catch (err) {
        setMessages([]);

        setError(
          err?.message ||
            "Outlook data could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    },
    [period]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMessages =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return messages.filter(
        (item) => {
          const matchesFilter =
            filter === "all" ||
            item.classification.status ===
              filter;

          if (!matchesFilter) {
            return false;
          }

          if (!query) {
            return true;
          }

          const recipientText =
            item.recipients
              .map(
                (recipient) =>
                  `${recipient.name} ${recipient.address}`
              )
              .join(" ");

          const searchable = [
            item.subject,
            item.preview,
            recipientText,
            item.classification.label
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      messages,
      search,
      filter
    ]);

  const stats = useMemo(() => {
    const outgoing =
      messages.length;

    const replied =
      messages.filter(
        (item) =>
          item.classification.status ===
          "replied"
      ).length;

    const due =
      messages.filter(
        (item) =>
          item.classification.status ===
          "due"
      ).length;

    const waiting =
      messages.filter(
        (item) =>
          item.classification.status ===
          "waiting"
      ).length;

    return {
      outgoing,
      due,
      waiting,
      replied
    };
  }, [messages]);

  const periodLabel =
    period === "today"
      ? "Today"
      : "This Month";

  return (
    <div className="followup-page">
      <div className="followup-container">
        <header className="followup-header">
          <div className="followup-header-copy">
            <span className="followup-eyebrow">
              EXECUTIVE INTELLIGENCE
            </span>

            <h1>Follow-up Tracker</h1>

            <p>
              Track outgoing Outlook conversations
              that are waiting for a response or may
              require executive follow-up.
            </p>

            <div className="followup-source">
              <span className="followup-live-dot" />
              <span>
                Microsoft Graph · Outlook Mail
              </span>

              <span className="followup-source-separator">
                ·
              </span>

              <span>{periodLabel}</span>
            </div>
          </div>

          <button
            type="button"
            className="followup-refresh"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="followup-spin" />
            ) : (
              <FaRedo />
            )}
            Refresh
          </button>
        </header>

        <section className="followup-toolbar">
          <div className="followup-period-tabs">
            <button
              type="button"
              className={
                period === "today"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setPeriod("today");
                setFilter("all");
              }}
            >
              Today
            </button>

            <button
              type="button"
              className={
                period === "month"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setPeriod("month");
                setFilter("all");
              }}
            >
              This Month
            </button>
          </div>

          <div className="followup-search">
            <FaSearch />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search subject or recipient..."
              aria-label="Search follow-ups"
            />

            {search && (
              <button
                type="button"
                className="followup-search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="followup-error">
            <div className="followup-error-icon">
              <FaExclamationTriangle />
            </div>

            <div className="followup-error-copy">
              <strong>
                Outlook data could not be loaded
              </strong>

              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={loadData}
            >
              Try again
            </button>
          </div>
        )}

        <section className="followup-stats">
          <StatCard
            icon={<FaPaperPlane />}
            label="OUTGOING"
            value={stats.outgoing}
            description="Sent conversations"
            tone="blue"
          />

          <StatCard
            icon={<FaExclamationTriangle />}
            label="NEEDS ATTENTION"
            value={stats.due}
            description="Follow-up signals"
            tone="orange"
          />

          <StatCard
            icon={<FaClock />}
            label="WAITING"
            value={stats.waiting}
            description="Awaiting response"
            tone="purple"
          />

          <StatCard
            icon={<FaCheckCircle />}
            label="REPLIED"
            value={stats.replied}
            description="Conversations answered"
            tone="green"
          />
        </section>

        <section className="followup-list-card">
          <div className="followup-list-header">
            <div>
              <span className="followup-section-eyebrow">
                FOLLOW-UP QUEUE
              </span>

              <h2>
                Communication requiring visibility
              </h2>

              <p>
                Real outgoing Outlook conversations
                from the selected period.
              </p>
            </div>

            <div className="followup-filter-tabs">
              <button
                type="button"
                className={
                  filter === "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("all")
                }
              >
                All
              </button>

              <button
                type="button"
                className={
                  filter === "due"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("due")
                }
              >
                Due
              </button>

              <button
                type="button"
                className={
                  filter === "waiting"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("waiting")
                }
              >
                Waiting
              </button>

              <button
                type="button"
                className={
                  filter === "replied"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("replied")
                }
              >
                Replied
              </button>
            </div>
          </div>

          <div className="followup-list-meta">
            <span>
              {filteredMessages.length}{" "}
              conversation
              {filteredMessages.length === 1
                ? ""
                : "s"}
            </span>

            {lastUpdated && (
              <span>
                Updated{" "}
                {lastUpdated.toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit"
                  }
                )}
              </span>
            )}
          </div>

          {loading ? (
            <div className="followup-loading">
              <div className="followup-loading-icon">
                <FaSpinner className="followup-spin" />
              </div>

              <h3>
                Loading Follow-up Tracker
              </h3>

              <p>
                Analyzing real Microsoft Outlook
                conversations and identifying
                follow-up signals.
              </p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="followup-empty">
              <div className="followup-empty-icon">
                <FaEnvelope />
              </div>

              <h3>
                No follow-up conversations found
              </h3>

              <p>
                There are no matching Outlook
                conversations for {periodLabel.toLowerCase()}
                with the current filters.
              </p>

              {(search || filter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="followup-list">
              {filteredMessages.map(
                (item) => (
                  <FollowUpRow
                    key={item.id}
                    item={item}
                    onOpen={
                      setSelectedItem
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        <div className="followup-footer-note">
          <span>
            Follow-up status is derived from real
            Outlook message timing, conversation
            replies, flags and priority signals.
          </span>

          <span>
            Microsoft Graph · Outlook Mail
          </span>
        </div>
      </div>

      <DetailModal
        item={selectedItem}
        onClose={() =>
          setSelectedItem(null)
        }
      />
    </div>
  );
};

export default FollowUpTracker;