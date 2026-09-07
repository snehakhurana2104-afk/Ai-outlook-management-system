import React, { useEffect, useMemo, useState } from "react";
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiChevronRight,
  FiMail,
  FiMessageCircle,
  FiRefreshCw,
  FiUsers,
  FiX,
} from "react-icons/fi";

import {
  getInboxForRange,
  getSentForRange,
} from "../api/outlookApi";

import "./Teams Report.css";

const RANGE_OPTIONS = [
  {
    key: "today",
    label: "Today",
  },
  {
    key: "month",
    label: "This Month",
  },
];

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.emails)) return data.emails;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getSenderEmail(email) {
  return (
    email?.from?.emailAddress?.address ||
    email?.sender?.emailAddress?.address ||
    email?.fromEmail ||
    ""
  )
    .trim()
    .toLowerCase();
}

function getSenderName(email) {
  return (
    email?.from?.emailAddress?.name ||
    email?.sender?.emailAddress?.name ||
    email?.fromName ||
    getSenderEmail(email) ||
    "Unknown Person"
  ).trim();
}

function getReceiverEmail(email) {
  return (
    email?.toRecipients?.[0]?.emailAddress?.address ||
    email?.to?.[0]?.emailAddress?.address ||
    email?.toEmail ||
    ""
  )
    .trim()
    .toLowerCase();
}

function getReceiverName(email) {
  return (
    email?.toRecipients?.[0]?.emailAddress?.name ||
    email?.to?.[0]?.emailAddress?.name ||
    email?.toName ||
    getReceiverEmail(email) ||
    "Unknown Person"
  ).trim();
}

function getEmailDate(email, type) {
  if (type === "sent") {
    return (
      email?.sentDateTime ||
      email?.createdDateTime ||
      email?.date ||
      email?.receivedDateTime ||
      null
    );
  }

  return (
    email?.receivedDateTime ||
    email?.createdDateTime ||
    email?.date ||
    null
  );
}

function getSubject(email) {
  return email?.subject || "No subject";
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "P";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(value) {
  if (!value) return "No activity";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No activity";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function getRangeDates(range) {
  const now = new Date();
  const start = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    startDateTime: start.toISOString(),
    endDateTime: now.toISOString(),
  };
}

function createPeople(inbox, sent) {
  const map = new Map();

  inbox.forEach((email) => {
    const address = getSenderEmail(email);

    if (!address) return;

    if (!map.has(address)) {
      map.set(address, {
        email: address,
        name: getSenderName(email),
        incoming: 0,
        outgoing: 0,
        lastActivity: null,
        messages: [],
      });
    }

    const person = map.get(address);
    const date = getEmailDate(email, "received");

    person.incoming += 1;

    person.messages.push({
      type: "incoming",
      subject: getSubject(email),
      date,
    });

    if (
      date &&
      (!person.lastActivity ||
        new Date(date).getTime() >
          new Date(person.lastActivity).getTime())
    ) {
      person.lastActivity = date;
    }
  });

  sent.forEach((email) => {
    const address = getReceiverEmail(email);

    if (!address) return;

    if (!map.has(address)) {
      map.set(address, {
        email: address,
        name: getReceiverName(email),
        incoming: 0,
        outgoing: 0,
        lastActivity: null,
        messages: [],
      });
    }

    const person = map.get(address);
    const date = getEmailDate(email, "sent");

    person.outgoing += 1;

    person.messages.push({
      type: "outgoing",
      subject: getSubject(email),
      date,
    });

    if (
      date &&
      (!person.lastActivity ||
        new Date(date).getTime() >
          new Date(person.lastActivity).getTime())
    ) {
      person.lastActivity = date;
    }
  });

  return Array.from(map.values())
    .map((person) => {
      const messages = person.messages
        .filter((item) => item.date)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
        )
        .slice(0, 10);

      return {
        ...person,
        total: person.incoming + person.outgoing,
        messages,
      };
    })
    .sort((a, b) => {
      const activityDifference =
        new Date(b.lastActivity || 0).getTime() -
        new Date(a.lastActivity || 0).getTime();

      if (activityDifference !== 0) {
        return activityDifference;
      }

      return b.total - a.total;
    });
}

function TeamsReport() {
  const [range, setRange] = useState("today");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);

  async function loadReport(selectedRange = range, refresh = false) {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const {
        startDateTime,
        endDateTime,
      } = getRangeDates(selectedRange);

      const [inboxResult, sentResult] = await Promise.all([
        getInboxForRange({
          startDateTime,
          endDateTime,
        }),
        getSentForRange({
          startDateTime,
          endDateTime,
        }),
      ]);

      const inbox = getList(inboxResult);
      const sent = getList(sentResult);

      const result = createPeople(inbox, sent);

      setPeople(result);
    } catch (err) {
      setPeople([]);
      setError(
        err?.message ||
          "Unable to load real Outlook people data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadReport(range);
  }, [range]);

  const stats = useMemo(() => {
    const received = people.reduce(
      (sum, person) => sum + person.incoming,
      0
    );

    const sent = people.reduce(
      (sum, person) => sum + person.outgoing,
      0
    );

    return {
      people: people.length,
      received,
      sent,
      total: received + sent,
    };
  }, [people]);

  const periodLabel =
    range === "today"
      ? "Today's Outlook activity"
      : "This month's Outlook activity";

  return (
    <div className="teams-report-page">
      <div className="teams-report-container">

        <header className="teams-report-header">
          <div>
            <div className="teams-report-eyebrow">
              EXECUTIVE INTELLIGENCE
            </div>

            <h1>Teams Report</h1>

            <p>
              Monitor people and communication activity across
              your connected Microsoft 365 workspace.
            </p>
          </div>

          <button
            type="button"
            className="teams-refresh-button"
            onClick={() => loadReport(range, true)}
            disabled={refreshing}
          >
            <FiRefreshCw
              className={refreshing ? "teams-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="teams-period-card">
          <div className="teams-period-information">
            <span>REPORT PERIOD</span>
            <strong>{periodLabel}</strong>
          </div>

          <div className="teams-range-tabs">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={
                  range === option.key ? "active" : ""
                }
                onClick={() => {
                  setRange(option.key);
                  setSelectedPerson(null);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="teams-error">
            <div>
              <strong>Unable to load Outlook data</strong>
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => loadReport(range, true)}
            >
              Try again
            </button>
          </div>
        )}

        <section className="teams-summary-grid">

          <div className="teams-summary-card">
            <div className="teams-summary-icon blue">
              <FiUsers />
            </div>

            <div>
              <span>People</span>
              <strong>{stats.people}</strong>
              <small>
                Active Outlook contacts
              </small>
            </div>
          </div>

          <div className="teams-summary-card">
            <div className="teams-summary-icon green">
              <FiArrowDownLeft />
            </div>

            <div>
              <span>Received</span>
              <strong>{stats.received}</strong>
              <small>
                Incoming messages
              </small>
            </div>
          </div>

          <div className="teams-summary-card">
            <div className="teams-summary-icon purple">
              <FiArrowUpRight />
            </div>

            <div>
              <span>Sent</span>
              <strong>{stats.sent}</strong>
              <small>
                Outgoing messages
              </small>
            </div>
          </div>

          <div className="teams-summary-card">
            <div className="teams-summary-icon amber">
              <FiMail />
            </div>

            <div>
              <span>Total Activity</span>
              <strong>{stats.total}</strong>
              <small>
                Incoming + outgoing
              </small>
            </div>
          </div>

        </section>

        <section className="teams-directory-card">

          <div className="teams-directory-header">
            <div>
              <span>TEAM DIRECTORY</span>

              <h2>People & Relationships</h2>

              <p>
                People below are automatically derived from your
                real Outlook email communication.
              </p>
            </div>

            <div className="teams-people-count">
              {stats.people}{" "}
              {stats.people === 1 ? "person" : "people"}
            </div>
          </div>

          {loading ? (
            <div className="teams-loading">
              <div className="teams-loader" />

              <strong>
                Loading real Outlook people...
              </strong>

              <span>
                Reading connected Microsoft 365 communication.
              </span>
            </div>
          ) : people.length === 0 ? (
            <div className="teams-empty">
              <div className="teams-empty-icon">
                <FiUsers />
              </div>

              <h3>No Outlook people found</h3>

              <p>
                No email communication was found for the
                selected period.
              </p>

              <button
                type="button"
                onClick={() => loadReport(range, true)}
              >
                Refresh Outlook Data
              </button>
            </div>
          ) : (
            <div className="teams-people-grid">
              {people.map((person) => (
                <button
                  type="button"
                  key={person.email}
                  className="teams-person-card"
                  onClick={() =>
                    setSelectedPerson(person)
                  }
                >
                  <div className="teams-person-top">
                    <div className="teams-person-avatar">
                      {getInitials(person.name)}
                    </div>

                    <div className="teams-person-open">
                      <FiChevronRight />
                    </div>
                  </div>

                  <div className="teams-person-info">
                    <h3>{person.name}</h3>

                    <p>{person.email}</p>
                  </div>

                  <div className="teams-person-metrics">

                    <div>
                      <FiArrowDownLeft />
                      <strong>{person.incoming}</strong>
                      <span>Received</span>
                    </div>

                    <div>
                      <FiArrowUpRight />
                      <strong>{person.outgoing}</strong>
                      <span>Sent</span>
                    </div>

                    <div>
                      <FiMessageCircle />
                      <strong>{person.total}</strong>
                      <span>Total</span>
                    </div>

                  </div>

                  <div className="teams-person-footer">
                    <span>
                      Last activity{" "}
                      {formatDate(person.lastActivity)}
                    </span>

                    <span>
                      {formatTime(person.lastActivity)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

        </section>

        {selectedPerson && (
          <div
            className="teams-modal-overlay"
            onClick={() => setSelectedPerson(null)}
          >
            <div
              className="teams-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className="teams-modal-close"
                onClick={() =>
                  setSelectedPerson(null)
                }
              >
                <FiX />
              </button>

              <div className="teams-modal-profile">

                <div className="teams-modal-avatar">
                  {getInitials(selectedPerson.name)}
                </div>

                <div>
                  <span>PERSON PROFILE</span>

                  <h2>
                    {selectedPerson.name}
                  </h2>

                  <p>
                    {selectedPerson.email}
                  </p>
                </div>

              </div>

              <div className="teams-modal-stats">

                <div>
                  <span>Received</span>
                  <strong>
                    {selectedPerson.incoming}
                  </strong>
                </div>

                <div>
                  <span>Sent</span>
                  <strong>
                    {selectedPerson.outgoing}
                  </strong>
                </div>

                <div>
                  <span>Total</span>
                  <strong>
                    {selectedPerson.total}
                  </strong>
                </div>

                <div>
                  <span>Last Activity</span>
                  <strong>
                    {formatDate(
                      selectedPerson.lastActivity
                    )}
                  </strong>
                </div>

              </div>

              <div className="teams-recent-section">

                <div className="teams-recent-heading">
                  <div>
                    <span>
                      OUTLOOK COMMUNICATION
                    </span>

                    <h3>
                      Recent activity
                    </h3>
                  </div>

                  <small>
                    {selectedPerson.messages.length} messages
                  </small>
                </div>

                {selectedPerson.messages.length === 0 ? (
                  <div className="teams-no-messages">
                    No recent communication.
                  </div>
                ) : (
                  <div className="teams-message-list">
                    {selectedPerson.messages.map(
                      (message, index) => (
                        <div
                          className="teams-message-item"
                          key={`${message.date}-${index}`}
                        >
                          <div
                            className={
                              message.type === "incoming"
                                ? "teams-message-icon incoming"
                                : "teams-message-icon outgoing"
                            }
                          >
                            {message.type === "incoming" ? (
                              <FiArrowDownLeft />
                            ) : (
                              <FiArrowUpRight />
                            )}
                          </div>

                          <div className="teams-message-content">
                            <strong>
                              {message.subject}
                            </strong>

                            <span>
                              {message.type === "incoming"
                                ? "Received"
                                : "Sent"}
                              {" · "}
                              {formatDate(message.date)}
                              {" · "}
                              {formatTime(message.date)}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default TeamsReport;