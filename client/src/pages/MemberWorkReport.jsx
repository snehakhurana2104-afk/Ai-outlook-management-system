import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as outlookApi from "../api/outlookApi";
import "./MemberWorkReport.css";

/* =========================================================
   MEMBERS

   IMPORTANT:
   Put the real Microsoft/Outlook email address of each
   team member here for accurate attribution.

   Example:
   email: "mukesh@yourcompany.com"
========================================================= */

const MEMBERS = {
  Mukesh: {
    name: "Mukesh",
    role: "Sales Executive",
    team: "Sales",
    initials: "M",
    email: "",
  },

  Sristi: {
    name: "Sristi",
    role: "Sales Executive",
    team: "Sales",
    initials: "S",
    email: "",
  },

  Kamal: {
    name: "Kamal",
    role: "Business Development",
    team: "Sales",
    initials: "K",
    email: "",
  },

  Amit: {
    name: "Amit",
    role: "Sales Executive",
    team: "Sales",
    initials: "A",
    email: "",
  },

  Kanika: {
    name: "Kanika",
    role: "Operations Executive",
    team: "Operations",
    initials: "K",
    email: "",
  },

  Tisha: {
    name: "Tisha",
    role: "Operations Executive",
    team: "Operations",
    initials: "T",
    email: "",
  },

  Shivam: {
    name: "Shivam",
    role: "Operations Executive",
    team: "Operations",
    initials: "S",
    email: "",
  },
};

const FILTERS = [
  {
    id: "today",
    label: "Today",
  },
  {
    id: "last5",
    label: "Last 5 Days",
  },
  {
    id: "month",
    label: "This Month",
  },
];

/* =========================================================
   BASIC HELPERS
========================================================= */

const cleanText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const stripHtml = (value) => {
  const text = cleanText(value);

  if (!text) {
    return "";
  }

  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeText = (value) => {
  return stripHtml(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeEmail = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }

  return String(
    value?.emailAddress?.address ||
      value?.address ||
      value?.email ||
      value?.userPrincipalName ||
      value?.value ||
      ""
  )
    .trim()
    .toLowerCase();
};

const getPersonName = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value?.emailAddress) {
    return (
      value.emailAddress.name ||
      value.emailAddress.address ||
      ""
    );
  }

  return (
    value?.name ||
    value?.displayName ||
    value?.address ||
    value?.email ||
    value?.userPrincipalName ||
    ""
  );
};

const getArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  const keys = [
    "value",
    "emails",
    "messages",
    "data",
    "items",
    "results",
  ];

  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  return [];
};

/* =========================================================
   DATE
========================================================= */

const getEmailDate = (email) => {
  const values = [
    email?.sentDateTime,
    email?.receivedDateTime,
    email?.createdDateTime,
    email?.lastModifiedDateTime,
  ];

  for (const value of values) {
    if (!value) {
      continue;
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};

const getEmailTime = (email) => {
  const date = getEmailDate(email);

  return date ? date.getTime() : 0;
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const isDateInFilter = (email, filter) => {
  const date = getEmailDate(email);

  if (!date) {
    return false;
  }

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );

  if (filter === "today") {
    return date >= todayStart && date <= now;
  }

  if (filter === "last5") {
    const start = new Date(todayStart);

    start.setDate(start.getDate() - 4);

    return date >= start && date <= now;
  }

  if (filter === "month") {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    return date >= start && date <= now;
  }

  return true;
};

/* =========================================================
   PEOPLE
========================================================= */

const getSender = (email) => {
  return email?.from || email?.sender || null;
};

const getSenderEmail = (email) => {
  return normalizeEmail(getSender(email));
};

const getSenderName = (email) => {
  return getPersonName(getSender(email)) || "Unknown";
};

const getRecipients = (email) => {
  return [
    ...(Array.isArray(email?.toRecipients)
      ? email.toRecipients
      : []),

    ...(Array.isArray(email?.ccRecipients)
      ? email.ccRecipients
      : []),

    ...(Array.isArray(email?.bccRecipients)
      ? email.bccRecipients
      : []),
  ];
};

const getRecipientEmails = (email) => {
  return getRecipients(email)
    .map(normalizeEmail)
    .filter(Boolean);
};

const getRecipientNames = (email) => {
  return getRecipients(email)
    .map(getPersonName)
    .filter(Boolean);
};

const getSubject = (email) => {
  return (
    email?.subject ||
    email?.title ||
    "No Subject"
  );
};

const getPreview = (email) => {
  return (
    email?.bodyPreview ||
    email?.preview ||
    stripHtml(email?.body?.content) ||
    ""
  );
};

const getEmailText = (email) => {
  return normalizeText(
    [
      email?.subject,
      email?.bodyPreview,
      email?.body?.content,
    ]
      .filter(Boolean)
      .join(" ")
  );
};

/* =========================================================
   MEMBER MATCHING

   We ONLY check actual people/assignment fields.

   We DO NOT search the whole email body for the member name.
   This prevents false matches.
========================================================= */

const memberMatchesEmail = (email, member) => {
  if (!email || !member) {
    return false;
  }

  const memberEmail = normalizeEmail(
    member.email
  );

  const memberName = normalizeText(
    member.name
  );

  const senderEmail = getSenderEmail(email);

  const senderName = normalizeText(
    getSenderName(email)
  );

  const recipientEmails =
    getRecipientEmails(email);

  const recipientNames =
    getRecipientNames(email).map(
      normalizeText
    );

  /* Exact email match */
  if (
    memberEmail &&
    (
      senderEmail === memberEmail ||
      recipientEmails.includes(memberEmail)
    )
  ) {
    return true;
  }

  /* Exact sender name */
  if (
    memberName &&
    senderName === memberName
  ) {
    return true;
  }

  /* Exact recipient name */
  if (
    memberName &&
    recipientNames.some(
      (name) => name === memberName
    )
  ) {
    return true;
  }

  /* Backend assignment fields */
  const assignmentFields = [
    email?.assignedTo,
    email?.assignee,
    email?.assigneeName,
    email?.assignedUser,
    email?.assignedUserName,
    email?.owner,
    email?.ownerName,
    email?.member,
    email?.memberName,
    email?.employee,
    email?.employeeName,
    email?.userName,
  ];

  const assignmentText = normalizeText(
    assignmentFields
      .filter(Boolean)
      .map(cleanText)
      .join(" ")
  );

  if (
    memberName &&
    assignmentText
      .split(/\s+/)
      .join(" ")
      .includes(memberName)
  ) {
    return true;
  }

  if (
    memberEmail &&
    assignmentText.includes(memberEmail)
  ) {
    return true;
  }

  return false;
};

/* =========================================================
   SENT / RECEIVED

   _reportSource is deliberately added when loading the
   Inbox and Sent folders. This is more reliable than
   guessing from sentDateTime.
========================================================= */

const isSentEmail = (email) => {
  if (email?._reportSource === "sent") {
    return true;
  }

  return false;
};

/* =========================================================
   WORK REQUEST SIGNALS
========================================================= */

const PENDING_REQUEST_SIGNALS = [
  "please send",
  "please share",
  "please provide",
  "please forward",
  "please confirm",
  "please update",
  "please submit",
  "please arrange",
  "please prepare",
  "please complete",

  "kindly send",
  "kindly share",
  "kindly provide",
  "kindly confirm",
  "kindly update",
  "kindly submit",

  "can you send",
  "can you share",
  "can you provide",
  "could you send",
  "could you share",
  "could you provide",

  "would you send",
  "would you share",
  "would you provide",

  "need the document",
  "need the documents",
  "need the pdf",
  "need pdf",
  "need information",
  "need details",

  "send the pdf",
  "send pdf",
  "send the document",
  "send document",
  "send documents",

  "share the pdf",
  "share pdf",
  "share the document",
  "share documents",

  "provide information",
  "provide details",

  "information required",
  "details required",
  "document required",
  "documents required",
  "pdf required",

  "required from your side",
  "required from your end",

  "action required",
  "response required",
  "reply required",

  "please advise",
  "let me know",
  "please let me know",

  "awaiting your response",
  "waiting for your response",
  "awaiting your confirmation",
  "waiting for your confirmation",

  "your response",
  "your confirmation",
  "your feedback",
];

/* =========================================================
   DOCUMENT SIGNALS
========================================================= */

const DOCUMENT_SIGNALS = [
  "pdf",
  "document",
  "documents",
  "attachment",
  "attachments",
  "file",
  "files",
  "quotation",
  "quote",
  "proposal",
  "invoice",
  "agreement",
  "certificate",
  "report",
  "brochure",
  "form",
  "details",
  "information",
];

/* =========================================================
   COMPLETION
========================================================= */

const COMPLETION_SIGNALS = [
  "successfully completed",
  "work completed",
  "task completed",
  "project completed",
  "process completed",
  "completed successfully",

  "issue resolved",
  "case resolved",
  "case closed",
  "closed successfully",

  "all done",
  "done from our side",
  "completed from our side",

  "work is complete",
  "work has been completed",

  "no further action",
  "nothing further required",
  "nothing else required",
  "no further requirement",
  "no further requirements",

  "final confirmation",
  "final approval",
  "approved and closed",

  "delivered successfully",
  "submitted successfully",

  "received with thanks",
  "thank you, received",
  "thanks, received",
];

/* =========================================================
   SIGNAL HELPERS
========================================================= */

const hasSignal = (email, signals) => {
  const text = getEmailText(email);

  return signals.some((signal) =>
    text.includes(signal)
  );
};

const hasRequestSignal = (email) => {
  const text = getEmailText(email);

  if (
    PENDING_REQUEST_SIGNALS.some(
      (signal) => text.includes(signal)
    )
  ) {
    return true;
  }

  /*
   A question is also considered a request.
   */
  if (
    text.includes("?")
  ) {
    return true;
  }

  return false;
};

const hasDocumentSignal = (email) => {
  const text = getEmailText(email);

  return (
    email?.hasAttachments === true ||
    DOCUMENT_SIGNALS.some((signal) =>
      text.includes(signal)
    )
  );
};

const hasCompletionSignal = (email) => {
  return hasSignal(
    email,
    COMPLETION_SIGNALS
  );
};

/* =========================================================
   CONVERSATION KEY
========================================================= */

const normalizeSubject = (subject) => {
  return String(subject || "")
    .replace(
      /^\s*((re|fw|fwd)\s*:\s*)+/gi,
      ""
    )
    .trim()
    .toLowerCase();
};

const getConversationKey = (
  email,
  index
) => {
  const conversationId = String(
    email?.conversationId || ""
  ).trim();

  if (conversationId) {
    return `conversation:${conversationId}`;
  }

  const subject = normalizeSubject(
    email?.subject
  );

  if (subject) {
    /*
     If Graph does not expose conversationId,
     subject becomes fallback.
     */
    return `subject:${subject}`;
  }

  const id =
    email?.id ||
    email?._id ||
    `email-${index}`;

  return `message:${id}`;
};

/* =========================================================
   CLIENT INFORMATION
========================================================= */

const getClientInfo = (
  emails,
  member
) => {
  const memberEmail = normalizeEmail(
    member?.email
  );

  const memberName = normalizeText(
    member?.name
  );

  const participants = [];

  emails.forEach((email) => {
    const sender = getSender(email);

    if (sender) {
      participants.push({
        name: getSenderName(email),
        email: getSenderEmail(email),
      });
    }

    getRecipients(email).forEach(
      (recipient) => {
        participants.push({
          name:
            getPersonName(recipient),
          email:
            normalizeEmail(recipient),
        });
      }
    );
  });

  const unique = new Map();

  participants.forEach(
    (participant) => {
      const email =
        participant.email;

      const name =
        normalizeText(
          participant.name
        );

      if (
        memberEmail &&
        email === memberEmail
      ) {
        return;
      }

      if (
        memberName &&
        name === memberName
      ) {
        return;
      }

      const key =
        email ||
        name;

      if (!key) {
        return;
      }

      if (!unique.has(key)) {
        unique.set(
          key,
          participant
        );
      }
    }
  );

  const people = Array.from(
    unique.values()
  );

  return (
    people[0] || {
      name: "Client",
      email: "",
    }
  );
};

/* =========================================================
   CONVERSATION STATUS

   IMPORTANT:
   Status is calculated from the WHOLE conversation,
   not from a single random email.
========================================================= */

const getConversationStatus = (
  conversationEmails,
  member
) => {
  if (
    !Array.isArray(
      conversationEmails
    ) ||
    conversationEmails.length === 0
  ) {
    return "In Progress";
  }

  const sorted = [
    ...conversationEmails,
  ].sort(
    (a, b) =>
      getEmailTime(a) -
      getEmailTime(b)
  );

  const latest =
    sorted[sorted.length - 1];

  const latestIsSent =
    isSentEmail(latest);

  const latestIsIncoming =
    !latestIsSent;

  const latestHasRequest =
    hasRequestSignal(latest);

  const latestHasDocument =
    hasDocumentSignal(latest);

  const latestComplete =
    hasCompletionSignal(latest);

  /*
   ========================================================
   COMPLETE
   ========================================================
  */

  if (
    latestComplete &&
    !latestHasRequest
  ) {
    return "Complete";
  }

  /*
   ========================================================
   PENDING CLIENT
   ========================================================
   Member sent the latest message and is waiting
   for client response/action.
   */

  if (
    latestIsSent &&
    latestHasRequest
  ) {
    return "Pending Client";
  }

  /*
   ========================================================
   PENDING SELF
   ========================================================
   Client sent latest message and member needs to
   send/provide/do something.
   */

  if (
    latestIsIncoming &&
    (
      latestHasRequest ||
      latestHasDocument
    )
  ) {
    return "Pending Self";
  }

  /*
   ========================================================
   IN PROGRESS
   ========================================================
   3+ messages means ongoing client conversation.
   */

  if (
    conversationEmails.length >= 3
  ) {
    return "In Progress";
  }

  /*
   Two-way communication is also active work.
   */

  const hasIncoming =
    conversationEmails.some(
      (email) =>
        !isSentEmail(email)
    );

  const hasOutgoing =
    conversationEmails.some(
      (email) =>
        isSentEmail(email)
    );

  if (
    hasIncoming &&
    hasOutgoing
  ) {
    return "In Progress";
  }

  /*
   Single outgoing message without a clear request:
   treat as active work, not automatically pending.
   */

  if (latestIsSent) {
    return "In Progress";
  }

  /*
   Single incoming message without request:
   still active client communication.
   */

  return "In Progress";
};

/* =========================================================
   BUILD CONVERSATIONS
========================================================= */

const buildConversationItems = (
  emails,
  member
) => {
  const groups = new Map();

  emails.forEach(
    (email, index) => {
      const key =
        getConversationKey(
          email,
          index
        );

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups
        .get(key)
        .push(email);
    }
  );

  const items = [];

  groups.forEach(
    (
      conversationEmails,
      conversationKey
    ) => {
      const sorted = [
        ...conversationEmails,
      ].sort(
        (a, b) =>
          getEmailTime(a) -
          getEmailTime(b)
      );

      const latest =
        sorted[
          sorted.length - 1
        ];

      const status =
        getConversationStatus(
          sorted,
          member
        );

      const client =
        getClientInfo(
          sorted,
          member
        );

      items.push({
        ...latest,

        conversationEmails:
          sorted,

        conversationKey,

        reportStatus:
          status,

        messageCount:
          sorted.length,

        clientName:
          client.name ||
          "Client",

        clientEmail:
          client.email ||
          "",
      });
    }
  );

  return items.sort(
    (a, b) =>
      getEmailTime(b) -
      getEmailTime(a)
  );
};

/* =========================================================
   OUTLOOK LINK
========================================================= */

const getOutlookWebLink = (
  email
) => {
  const links = [
    email?.webLink,
    email?.webUrl,
    email?.outlookWebLink,
    email?.outlookUrl,
    email?.url,
  ];

  for (const link of links) {
    if (
      typeof link === "string" &&
      /^https?:\/\//i.test(link)
    ) {
      return link;
    }
  }

  return "";
};

/* =========================================================
   COMPONENT
========================================================= */

const MemberWorkReport = () => {
  const { memberName } =
    useParams();

  const navigate =
    useNavigate();

  const decodedName =
    decodeURIComponent(
      memberName || "Mukesh"
    );

  const member =
    MEMBERS[decodedName] || {
      name: decodedName,
      role: "Team Member",
      team: "Sales",
      initials:
        decodedName
          .charAt(0)
          .toUpperCase(),
      email: "",
    };

  const [filter, setFilter] =
    useState("today");

  const [emails, setEmails] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD REAL GRAPH DATA
  ======================================================= */

  const loadData = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      /*
       IMPORTANT:
       Do NOT use getWorkflowMessages here.

       getWorkflowMessages returns today's workflow
       messages, while this page needs current-month
       conversation history.
      */

      const [
        inboxResponse,
        sentResponse,
      ] = await Promise.all([
        outlookApi.getThisMonthInbox(
          new Date()
        ),
        outlookApi.getThisMonthSent(
          new Date()
        ),
      ]);

      const inbox =
        getArray(inboxResponse);

      const sent =
        getArray(sentResponse);

      /*
       Mark source explicitly.
      */

      const inboxWithSource =
        inbox.map((email) => ({
          ...email,
          _reportSource: "inbox",
        }));

      const sentWithSource =
        sent.map((email) => ({
          ...email,
          _reportSource: "sent",
        }));

      /*
       Deduplicate.
      */

      const map = new Map();

      [
        ...inboxWithSource,
        ...sentWithSource,
      ].forEach(
        (email, index) => {
          const id =
            email?.id ||
            email?._id ||
            `${getConversationKey(
              email,
              index
            )}-${index}`;

          /*
           If the same ID exists, preserve the
           explicitly known folder source.
          */

          if (!map.has(id)) {
            map.set(
              id,
              email
            );
          }
        }
      );

      const allEmails =
        Array.from(
          map.values()
        );

      setEmails(allEmails);

      /*
       If Graph returned no data at all, show useful
       error instead of silently looking broken.
      */

      if (
        allEmails.length === 0
      ) {
        setError(
          "No Outlook emails were returned for this month."
        );
      }
    } catch (err) {
      console.error(
        "Member Work Report Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load Outlook data."
      );

      setEmails([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [member.name]);

  /* =======================================================
     MEMBER EMAILS
  ======================================================= */

  const memberEmails =
    useMemo(() => {
      return emails.filter(
        (email) => {
          return memberMatchesEmail(
            email,
            member
          );
        }
      );
    }, [
      emails,
      member,
    ]);

  /* =======================================================
     BUILD CONVERSATIONS

     We build from the whole month first.
     Then filter conversations based on whether
     they have activity in the selected period.
  ======================================================= */

  const allWorkflowItems =
    useMemo(() => {
      return buildConversationItems(
        memberEmails,
        member
      );
    }, [
      memberEmails,
      member,
    ]);

  const workflowItems =
    useMemo(() => {
      return allWorkflowItems.filter(
        (item) => {
          const conversationEmails =
            item.conversationEmails ||
            [];

          return conversationEmails.some(
            (email) =>
              isDateInFilter(
                email,
                filter
              )
          );
        }
      );
    }, [
      allWorkflowItems,
      filter,
    ]);

  /* =======================================================
     STATUS GROUPS
  ======================================================= */

  const pendingClient =
    useMemo(() => {
      return workflowItems.filter(
        (item) =>
          item.reportStatus ===
          "Pending Client"
      );
    }, [workflowItems]);

  const pendingSelf =
    useMemo(() => {
      return workflowItems.filter(
        (item) =>
          item.reportStatus ===
          "Pending Self"
      );
    }, [workflowItems]);

  const inProgress =
    useMemo(() => {
      return workflowItems.filter(
        (item) =>
          item.reportStatus ===
          "In Progress"
      );
    }, [workflowItems]);

  const completed =
    useMemo(() => {
      return workflowItems.filter(
        (item) =>
          item.reportStatus ===
          "Complete"
      );
    }, [workflowItems]);

  const totalItems =
    pendingClient.length +
    pendingSelf.length +
    inProgress.length +
    completed.length;

  /* =======================================================
     OPEN EMAIL
  ======================================================= */

  const openEmail = (item) => {
    if (!item) {
      return;
    }

    const link =
      getOutlookWebLink(item);

    if (link) {
      window.open(
        link,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    const id =
      item?.id ||
      item?._id;

    if (id) {
      navigate(
        `/inbox/${id}`
      );
    }
  };

  /* =======================================================
     PERIOD
  ======================================================= */

  const periodTitle =
    filter === "today"
      ? "Today"
      : filter === "last5"
      ? "Last 5 Days"
      : "This Month";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="member-report-page">
      <div className="member-report-container">

        {/* HEADER */}

        <header className="member-report-header">
          <div className="member-header-left">

            <button
              className="member-back-button"
              type="button"
              onClick={() =>
                navigate(
                  "/executive-intelligence/teams-report"
                )
              }
              aria-label="Back"
            >
              ←
            </button>

            <div className="member-avatar-large">
              {member.initials}
            </div>

            <div>
              <span className="member-header-label">
                {member.team.toUpperCase()} · TEAM MEMBER
              </span>

              <h1>
                {member.name}
              </h1>

              <p>
                {member.role}
              </p>
            </div>
          </div>

          <button
            className="member-refresh-button"
            type="button"
            onClick={() =>
              loadData(true)
            }
            disabled={refreshing}
          >
            ↻
            {refreshing
              ? " Refreshing"
              : " Refresh"}
          </button>
        </header>

        {/* PERIOD */}

        <div className="member-period-bar">
          <div>
            <span>
              WORK PERIOD
            </span>

            <h2>
              {periodTitle}
            </h2>
          </div>

          <div className="member-period-buttons">
            {FILTERS.map(
              (item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    filter === item.id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(
                      item.id
                    )
                  }
                >
                  {item.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* SUMMARY */}

        <div className="member-summary">

          <SummaryCard
            value={
              pendingClient.length
            }
            title="Pending Client"
            description="Waiting for client response"
            type="client"
          />

          <SummaryCard
            value={
              pendingSelf.length
            }
            title="Pending Self"
            description="Member action is required"
            type="self"
          />

          <SummaryCard
            value={
              inProgress.length
            }
            title="In Progress"
            description="Active client communication"
            type="progress"
          />

          <SummaryCard
            value={
              completed.length
            }
            title="Complete"
            description="Completed client work"
            type="complete"
          />

        </div>

        {/* ERROR */}

        {error && (
          <div className="member-error">
            <span>!</span>
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="member-loading">
            <div className="member-spinner" />

            <span>
              Loading {member.name}'s report...
            </span>
          </div>
        ) : (
          <>
            {/* PENDING CLIENT */}

            <ReportSection
              eyebrow="CLIENT RESPONSE"
              title="Pending Client"
              description="Emails sent by the member where the client needs to respond, confirm, provide information, or send something."
              count={
                pendingClient.length
              }
              type="client"
            >
              {pendingClient.length >
              0 ? (
                pendingClient.map(
                  (
                    item,
                    index
                  ) => (
                    <EmailRow
                      key={
                        item.conversationKey ||
                        item.id ||
                        index
                      }
                      email={item}
                      badge="CLIENT WAITING"
                      onClick={() =>
                        openEmail(
                          item
                        )
                      }
                    />
                  )
                )
              ) : (
                <EmptyRow
                  text={`No pending client work for ${member.name}.`}
                />
              )}
            </ReportSection>

            {/* PENDING SELF */}

            <ReportSection
              eyebrow="ACTION REQUIRED"
              title="Pending Self"
              description="Client emails where the member needs to send information, documents, PDF files, confirmation, or another response."
              count={
                pendingSelf.length
              }
              type="self"
            >
              {pendingSelf.length >
              0 ? (
                pendingSelf.map(
                  (
                    item,
                    index
                  ) => (
                    <EmailRow
                      key={
                        item.conversationKey ||
                        item.id ||
                        index
                      }
                      email={item}
                      badge="ACTION REQUIRED"
                      onClick={() =>
                        openEmail(
                          item
                        )
                      }
                    />
                  )
                )
              ) : (
                <EmptyRow
                  text={`No pending self work for ${member.name}.`}
                />
              )}
            </ReportSection>

            {/* IN PROGRESS */}

            <ReportSection
              eyebrow="ACTIVE WORK"
              title="In Progress"
              description="Ongoing client conversations and active work."
              count={
                inProgress.length
              }
              type="progress"
            >
              {inProgress.length >
              0 ? (
                inProgress.map(
                  (
                    item,
                    index
                  ) => (
                    <EmailRow
                      key={
                        item.conversationKey ||
                        item.id ||
                        index
                      }
                      email={item}
                      badge="IN PROGRESS"
                      onClick={() =>
                        openEmail(
                          item
                        )
                      }
                    />
                  )
                )
              ) : (
                <EmptyRow
                  text={`No active work for ${member.name}.`}
                />
              )}
            </ReportSection>

            {/* COMPLETE */}

            <ReportSection
              eyebrow="FINISHED"
              title="Complete"
              description="Client work where no further action is currently required."
              count={
                completed.length
              }
              type="complete"
            >
              {completed.length >
              0 ? (
                completed.map(
                  (
                    item,
                    index
                  ) => (
                    <EmailRow
                      key={
                        item.conversationKey ||
                        item.id ||
                        index
                      }
                      email={item}
                      badge="COMPLETE"
                      complete
                      onClick={() =>
                        openEmail(
                          item
                        )
                      }
                    />
                  )
                )
              ) : (
                <EmptyRow
                  text={`No completed work for ${member.name}.`}
                />
              )}
            </ReportSection>
          </>
        )}

        {/* FOOTER */}

        <footer className="member-report-footer">
          <span>
            Showing client work associated with{" "}
            {member.name}.
          </span>

          <strong>
            {totalItems} items
          </strong>
        </footer>

      </div>
    </div>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  value,
  title,
  description,
  type = "",
}) => {
  return (
    <div
      className={`member-summary-card ${type}`}
    >
      <strong className="summary-value">
        {value}
      </strong>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>
    </div>
  );
};

/* =========================================================
   REPORT SECTION
========================================================= */

const ReportSection = ({
  eyebrow,
  title,
  description,
  count,
  children,
  type = "",
}) => {
  return (
    <section
      className={`member-report-section ${type}`}
    >
      <div className="report-section-header">
        <div>
          <span>
            {eyebrow}
          </span>

          <h2>
            {title}
          </h2>

          <p>
            {description}
          </p>
        </div>

        <div className="report-section-count">
          {count}
        </div>
      </div>

      <div className="report-list">
        {children}
      </div>
    </section>
  );
};

/* =========================================================
   EMAIL ROW
========================================================= */

const EmailRow = ({
  email,
  badge,
  complete = false,
  onClick,
}) => {
  const messageCount =
    Number(
      email?.messageCount || 1
    );

  const latestIsSent =
    isSentEmail(email);

  return (
    <div
      className={`report-row ${
        complete
          ? "complete-row"
          : ""
      }`}
      onClick={onClick}
      role={
        onClick
          ? "button"
          : undefined
      }
      tabIndex={
        onClick
          ? 0
          : undefined
      }
      onKeyDown={(event) => {
        if (
          onClick &&
          (
            event.key ===
              "Enter" ||
            event.key === " "
          )
        ) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="row-icon email-row-icon">
        ✉
      </div>

      <div className="row-content">

        <div className="row-title-line">
          <h3>
            {getSubject(email)}
          </h3>

          <span>
            {formatDate(
              email?.sentDateTime ||
                email?.receivedDateTime
            )}
          </span>
        </div>

        <div className="client-line">
          <strong>
            {email?.clientName ||
              getSenderName(email)}
          </strong>

          {email?.clientEmail && (
            <span>
              {email.clientEmail}
            </span>
          )}
        </div>

        <p>
          {stripHtml(
            getPreview(email)
          ).slice(0, 220)}
          {stripHtml(
            getPreview(email)
          ).length > 220
            ? "..."
            : ""}
        </p>

        <div className="row-meta">

          <span
            className={
              latestIsSent
                ? "direction sent"
                : "direction received"
            }
          >
            {latestIsSent
              ? "Last message sent"
              : "Last message received"}
          </span>

          {messageCount > 1 && (
            <span className="conversation-info">
              <span className="conversation-dot" />
              {messageCount} messages
            </span>
          )}

        </div>
      </div>

      <span
        className={`row-badge ${
          complete
            ? "complete-badge"
            : badge ===
              "CLIENT WAITING"
            ? "client-badge"
            : badge ===
              "ACTION REQUIRED"
            ? "self-badge"
            : "progress-badge"
        }`}
      >
        {badge}
      </span>
    </div>
  );
};

/* =========================================================
   EMPTY
========================================================= */

const EmptyRow = ({
  text,
}) => {
  return (
    <div className="empty-row">
      <div className="empty-row-icon">
        ✓
      </div>

      <span>
        {text}
      </span>
    </div>
  );
};

export default MemberWorkReport;