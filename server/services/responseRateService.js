// ===========================================================
// responseRateService.js
// REAL MICROSOFT 365 RESPONSE RATE
// ===========================================================

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

// -----------------------------------------------------------
// GRAPH GET WITH PAGINATION
// -----------------------------------------------------------

const graphGetAll = async (url, accessToken) => {
  const results = [];

  let nextUrl = url;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Microsoft Graph request failed (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();

    if (Array.isArray(data.value)) {
      results.push(...data.value);
    }

    nextUrl = data["@odata.nextLink"] || null;
  }

  return results;
};

// -----------------------------------------------------------
// NORMALIZE MESSAGE ID
// -----------------------------------------------------------

const normalizeMessageId = (value) => {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/^<|>$/g, "")
    .toLowerCase();
};

// -----------------------------------------------------------
// GET HEADER
// -----------------------------------------------------------

const getHeader = (message, headerName) => {
  const headers = Array.isArray(
    message?.internetMessageHeaders
  )
    ? message.internetMessageHeaders
    : [];

  const target = headerName.toLowerCase();

  const header = headers.find(
    (item) =>
      String(item?.name || "").toLowerCase() === target
  );

  return header?.value || "";
};

// -----------------------------------------------------------
// DATE CHECK
// -----------------------------------------------------------

const isValidDate = (value) => {
  const date = new Date(value);

  return !Number.isNaN(date.getTime());
};

// -----------------------------------------------------------
// GET MONTH RANGE
// -----------------------------------------------------------

const getMonthRange = (year, month) => {
  const start = new Date(
    Date.UTC(year, month - 1, 1, 0, 0, 0)
  );

  const end = new Date(
    Date.UTC(year, month, 1, 0, 0, 0)
  );

  return {
    start,
    end,
  };
};

// -----------------------------------------------------------
// REAL RESPONSE RATE
// -----------------------------------------------------------

const calculateResponseRate = async ({
  accessToken,
  year,
  month,
}) => {
  if (!accessToken) {
    throw new Error(
      "Microsoft Graph access token is required."
    );
  }

  const {
    start,
    end,
  } = getMonthRange(year, month);

  const startISO = start.toISOString();
  const endISO = end.toISOString();

  // =========================================================
  // INCOMING MAIL
  // =========================================================

  const incomingUrl =
    `${GRAPH_BASE_URL}/me/mailFolders/inbox/messages` +
    `?$select=id,subject,conversationId,internetMessageId,` +
    `receivedDateTime,from,toRecipients,ccRecipients,` +
    `isDraft,isRead,internetMessageHeaders` +
    `&$filter=receivedDateTime ge ${startISO} and receivedDateTime lt ${endISO}` +
    `&$orderby=receivedDateTime asc` +
    `&$top=1000`;

  // =========================================================
  // SENT MAIL
  // =========================================================

  const sentUrl =
    `${GRAPH_BASE_URL}/me/mailFolders/sentitems/messages` +
    `?$select=id,subject,conversationId,internetMessageId,` +
    `sentDateTime,toRecipients,ccRecipients,` +
    `isDraft,internetMessageHeaders` +
    `&$filter=sentDateTime ge ${startISO} and sentDateTime lt ${endISO}` +
    `&$orderby=sentDateTime asc` +
    `&$top=1000`;

  const [
    incomingMessages,
    sentMessages,
  ] = await Promise.all([
    graphGetAll(
      incomingUrl,
      accessToken
    ),
    graphGetAll(
      sentUrl,
      accessToken
    ),
  ]);

  // =========================================================
  // REMOVE DUPLICATES
  // =========================================================

  const incoming = Array.from(
    new Map(
      incomingMessages
        .filter((mail) => mail?.id)
        .map((mail) => [
          mail.id,
          mail,
        ])
    ).values()
  );

  const sent = Array.from(
    new Map(
      sentMessages
        .filter((mail) => mail?.id)
        .map((mail) => [
          mail.id,
          mail,
        ])
    ).values()
  );

  // =========================================================
  // BUILD INDEXES
  // =========================================================

  const sentByConversation = new Map();

  const sentByInReplyTo = new Map();

  sent.forEach((mail) => {
    const conversationId =
      String(
        mail?.conversationId || ""
      ).trim();

    if (conversationId) {
      if (
        !sentByConversation.has(
          conversationId
        )
      ) {
        sentByConversation.set(
          conversationId,
          []
        );
      }

      sentByConversation
        .get(conversationId)
        .push(mail);
    }

    // -------------------------------------------------------
    // RFC In-Reply-To
    // -------------------------------------------------------

    const inReplyTo = normalizeMessageId(
      getHeader(
        mail,
        "In-Reply-To"
      )
    );

    if (inReplyTo) {
      if (
        !sentByInReplyTo.has(
          inReplyTo
        )
      ) {
        sentByInReplyTo.set(
          inReplyTo,
          []
        );
      }

      sentByInReplyTo
        .get(inReplyTo)
        .push(mail);
    }
  });

  // =========================================================
  // DETERMINE REPLIED EMAILS
  // =========================================================

  let repliedCount = 0;

  let eligibleCount = 0;

  const responseDetails = [];

  incoming.forEach((incomingMail) => {
    if (
      !incomingMail?.receivedDateTime ||
      !isValidDate(
        incomingMail.receivedDateTime
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // Skip drafts / invalid messages
    // -------------------------------------------------------

    if (
      incomingMail.isDraft === true
    ) {
      return;
    }

    eligibleCount += 1;

    const receivedTime =
      new Date(
        incomingMail.receivedDateTime
      ).getTime();

    const originalMessageId =
      normalizeMessageId(
        incomingMail.internetMessageId
      );

    let reply = null;

    // =======================================================
    // METHOD 1
    // Exact In-Reply-To match
    // =======================================================

    if (originalMessageId) {
      const exactReplies =
        sentByInReplyTo.get(
          originalMessageId
        ) || [];

      reply =
        exactReplies.find(
          (sentMail) => {
            if (
              !sentMail?.sentDateTime
            ) {
              return false;
            }

            return (
              new Date(
                sentMail.sentDateTime
              ).getTime() >
              receivedTime
            );
          }
        ) || null;
    }

    // =======================================================
    // METHOD 2
    // Conversation fallback
    // =======================================================

    if (!reply) {
      const conversationId =
        String(
          incomingMail?.conversationId ||
            ""
        ).trim();

      if (conversationId) {
        const conversationReplies =
          sentByConversation.get(
            conversationId
          ) || [];

        reply =
          conversationReplies.find(
            (sentMail) => {
              if (
                !sentMail?.sentDateTime
              ) {
                return false;
              }

              return (
                new Date(
                  sentMail.sentDateTime
                ).getTime() >
                receivedTime
              );
            }
          ) || null;
      }
    }

    if (reply) {
      repliedCount += 1;

      responseDetails.push({
        incomingId:
          incomingMail.id,

        subject:
          incomingMail.subject ||
          "(No subject)",

        receivedAt:
          incomingMail.receivedDateTime,

        repliedAt:
          reply.sentDateTime,

        conversationId:
          incomingMail.conversationId ||
          null,
      });
    }
  });

  // =========================================================
  // CALCULATE
  // =========================================================

  const responseRate =
    eligibleCount > 0
      ? Number(
          (
            (repliedCount /
              eligibleCount) *
            100
          ).toFixed(1)
        )
      : null;

  return {
    responseRate,

    repliedCount,

    eligibleCount,

    incomingCount:
      incoming.length,

    sentCount:
      sent.length,

    period: {
      year,
      month,
      start:
        startISO,
      end:
        endISO,
    },

    // Useful for debugging / analytics
    responseDetails,
  };
};

module.exports = {
  calculateResponseRate,
};