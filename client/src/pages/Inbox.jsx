import React, { useEffect, useMemo, useState } from "react";

import {
  Archive,
  ChevronRight,
  Inbox as InboxIcon,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import * as outlookApi from "../api/outlookApi";
import "./Inbox.css";

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

const getSenderName = (email) => {
  return (
    email?.from?.emailAddress?.name ||
    email?.sender?.emailAddress?.name ||
    email?.from?.name ||
    email?.sender?.name ||
    "Unknown sender"
  );
};

const getSenderEmail = (email) => {
  return (
    email?.from?.emailAddress?.address ||
    email?.sender?.emailAddress?.address ||
    email?.from?.address ||
    email?.sender?.address ||
    ""
  );
};

const getBodyText = (email) => {
  const body = email?.body;

  if (typeof body === "string") {
    return cleanText(body);
  }

  if (typeof body?.content === "string") {
    return cleanText(body.content);
  }

  return cleanText(
    email?.bodyPreview ||
      "No message content available."
  );
};

const normalizeEmail = (email) => {
  const senderName = getSenderName(email);
  const senderEmail = getSenderEmail(email);

  const subject =
    email?.subject ||
    "(No subject)";

  const body = getBodyText(email);

  const preview = cleanText(
    email?.bodyPreview ||
      body ||
      "No message preview available."
  );

  const isRead =
    email?.isRead === true;

  const hasAttachments =
    email?.hasAttachments === true ||
    (Array.isArray(email?.attachments) &&
      email.attachments.length > 0);

  return {
    ...email,

    id:
      email?.id ||
      email?.messageId ||
      "",

    senderName: String(senderName),

    senderEmail: String(senderEmail),

    subject: String(subject),

    body,

    preview,

    receivedAt:
      email?.receivedDateTime ||
      email?.receivedAt ||
      null,

    sentAt:
      email?.sentDateTime ||
      email?.sentAt ||
      null,

    isRead,

    hasAttachments,
  };
};

const formatMonth = () => {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  ).format(new Date());
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

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
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
};

const formatFullDate = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name) => {
  const parts = String(name || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const normalizeCollection = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  if (Array.isArray(response?.emails)) {
    return response.emails;
  }

  if (Array.isArray(response?.messages)) {
    return response.messages;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
};

function Inbox() {
  const [emails, setEmails] = useState([]);
  const [sentEmails, setSentEmails] =
    useState([]);

  const [selectedEmail, setSelectedEmail] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const monthName = formatMonth();

  const loadInbox = async (
    refresh = false
  ) => {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      /*
       * These are the correct existing API
       * functions from outlookApi.js.
       *
       * They already use Microsoft Graph and
       * the current-month date range.
       */
      const [
        inboxResult,
        sentResult,
      ] = await Promise.all([
        outlookApi.getThisMonthInbox(),
        outlookApi.getThisMonthSent(),
      ]);

      const rawInbox =
        normalizeCollection(
          inboxResult
        );

      const rawSent =
        normalizeCollection(
          sentResult
        );

      const normalizedInbox =
        rawInbox
          .map(normalizeEmail)
          .filter(
            (email) => email.id
          )
          .sort((a, b) => {
            const first =
              new Date(
                a.receivedAt || 0
              ).getTime();

            const second =
              new Date(
                b.receivedAt || 0
              ).getTime();

            return second - first;
          });

      const normalizedSent =
        rawSent
          .map(normalizeEmail)
          .filter(
            (email) => email.id
          )
          .sort((a, b) => {
            const first =
              new Date(
                a.sentAt || 0
              ).getTime();

            const second =
              new Date(
                b.sentAt || 0
              ).getTime();

            return second - first;
          });

      setEmails(normalizedInbox);
      setSentEmails(normalizedSent);
    } catch (err) {
      console.error(
        "Inbox loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load your Outlook mailbox."
      );

      setEmails([]);
      setSentEmails([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  /*
   * Only the required Inbox statistics.
   *
   * No Priority.
   * No Response Rate.
   * No Dashboard Metrics API.
   */
  const monthStats = useMemo(() => {
    const received =
      emails.length;

    const unread =
      emails.filter(
        (email) =>
          email.isRead !== true
      ).length;

    const read =
      Math.max(
        received - unread,
        0
      );

    const sent =
      sentEmails.length;

    const documents =
      emails.filter(
        (email) =>
          email.hasAttachments === true
      ).length;

    return {
      received,
      unread,
      read,
      sent,
      documents,
    };
  }, [emails, sentEmails]);

  const filteredEmails = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return emails;
    }

    return emails.filter(
      (email) => {
        const subject =
          String(
            email.subject || ""
          ).toLowerCase();

        const senderName =
          String(
            email.senderName || ""
          ).toLowerCase();

        const senderEmail =
          String(
            email.senderEmail || ""
          ).toLowerCase();

        const preview =
          String(
            email.preview || ""
          ).toLowerCase();

        return (
          subject.includes(query) ||
          senderName.includes(query) ||
          senderEmail.includes(query) ||
          preview.includes(query)
        );
      }
    );
  }, [emails, search]);

  const cards = [
    {
      label: "Received Emails",
      value:
        monthStats.received,
      description:
        "Current month inbox",
      icon: Mail,
      type: "blue",
    },

    {
      label: "Unread",
      value:
        monthStats.unread,
      description:
        "Needs your attention",
      icon: MailOpen,
      type: "orange",
    },

    {
      label: "Sent Emails",
      value:
        monthStats.sent,
      description:
        "Current month outgoing",
      icon: RefreshCw,
      type: "purple",
    },

    {
      label: "Read Emails",
      value:
        monthStats.read,
      description:
        "Emails already reviewed",
      icon: MailOpen,
      type: "green",
    },

    {
      label: "Documents",
      value:
        monthStats.documents,
      description:
        "Emails with attachments",
      icon: Paperclip,
      type: "teal",
    },
  ];

  return (
    <div className="inbox-page">

      {/* HEADER */}

      <div className="inbox-header">

        <div className="inbox-title-area">

          <div className="inbox-eyebrow">
            <InboxIcon size={14} />
            OUTLOOK MAIL
          </div>

          <h1>
            Inbox
          </h1>

          <p>
            Your Outlook conversations and
            communication activity for{" "}
            {monthName}.
          </p>

        </div>

        <button
          className="inbox-refresh"
          onClick={() =>
            loadInbox(true)
          }
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2
              size={16}
              className="spin"
            />
          ) : (
            <RefreshCw
              size={16}
            />
          )}

          Refresh
        </button>

      </div>

      {/* MONTH BANNER */}

      <div className="inbox-month-banner">

        <div className="month-icon">
          <Mail size={19} />
        </div>

        <div>
          <strong>
            {monthName}
          </strong>

          <span>
            Showing Outlook conversations and
            outgoing communication for the
            current month
          </span>
        </div>

        <div className="month-banner-status">
          <span className="status-dot" />
          Live Outlook data
        </div>

      </div>

      {/* KPI CARDS */}

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

                <ChevronRight
                  size={15}
                />

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

      {/* ERROR */}

      {error && (
        <div className="inbox-error">

          <Mail size={17} />

          <span>
            {error}
          </span>

          <button
            onClick={() =>
              loadInbox(true)
            }
          >
            Try again
          </button>

        </div>
      )}

      {/* EMAIL CARD */}

      <div className="monthly-mail-card">

        <div className="monthly-mail-header">

          <div>

            <div className="section-eyebrow">
              RECENT MESSAGES
            </div>

            <h2>
              Monthly Outlook emails
            </h2>

            <p>
              Messages received in your
              mailbox during {monthName}.
            </p>

          </div>

          <div className="monthly-total">

            <strong>
              {emails.length}
            </strong>

            <span>
              conversations
            </span>

          </div>

        </div>

        {/* SEARCH */}

        <div className="mail-search-row">

          <div className="inbox-search">

            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search conversations, senders or subjects..."
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
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

        {/* EMAIL LIST */}

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
                Fetching your Outlook
                conversations for{" "}
                {monthName}.
              </span>

            </div>

          ) : filteredEmails.length === 0 ? (

            <div className="inbox-state">

              <MailOpen
                size={36}
              />

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

            filteredEmails.map(
              (email) => (

                <button
                  key={email.id}
                  className={`email-row ${
                    !email.isRead
                      ? "unread"
                      : ""
                  } ${
                    selectedEmail?.id ===
                    email.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedEmail(
                      email
                    )
                  }
                >

                  {/* AVATAR */}

                  <div className="sender-avatar">
                    {getInitials(
                      email.senderName
                    )}
                  </div>

                  {/* EMAIL CONTENT */}

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

                            <Paperclip
                              size={11}
                            />

                            Attachment

                          </span>
                        )}

                      </div>

                      <div className="email-meta">

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

              )
            )

          )}

        </div>

      </div>

      {/* EMAIL DETAIL */}

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

            {/* DETAIL HEADER */}

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

            {/* SENDER */}

            <div className="detail-sender">

              <div className="sender-avatar large">

                {getInitials(
                  selectedEmail.senderName
                )}

              </div>

              <div>

                <strong>
                  {
                    selectedEmail.senderName
                  }
                </strong>

                <span>
                  {selectedEmail.senderEmail ||
                    "Email address unavailable"}
                </span>

              </div>

            </div>

            {/* DATE */}

            <div className="detail-date">

              {formatFullDate(
                selectedEmail.receivedAt
              )}

            </div>

            {/* BODY */}

            <div className="detail-body">

              {selectedEmail.body ? (

                <div>
                  {selectedEmail.body}
                </div>

              ) : (

                <span>
                  No message content
                  available.
                </span>

              )}

            </div>

            {/* ATTACHMENT */}

            {selectedEmail.hasAttachments && (

              <div className="attachment-note">

                <Paperclip size={15} />

                This email contains
                attachments.

              </div>

            )}

            {/* FOOTER */}

            <div className="detail-footer">

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