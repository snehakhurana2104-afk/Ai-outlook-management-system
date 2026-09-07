"use strict";

const axios = require("axios");

const Email = require("../models/Email");

const {
  getAccessToken,
} = require("./authService");

let graphService = null;

try {
  graphService = require("./graphService");
} catch (error) {
  console.warn(
    "[EmailSyncService] graphService not available."
  );
}

let gateway = null;

try {
  gateway = require("../gateway/eventGateway");
} catch (error) {
  console.warn(
    "[EmailSyncService] Socket gateway not available."
  );
}

const getGraphEndpoint = (accessToken) => {
  if (
    graphService &&
    typeof graphService.determineMessageEndpoint ===
      "function"
  ) {
    const result =
      graphService.determineMessageEndpoint(
        accessToken,
        process.env.OUTLOOK_USER_EMAIL
      );

    if (result?.endpoint) {
      return result.endpoint;
    }
  }

  const user =
    process.env.OUTLOOK_USER_EMAIL;

  if (!user) {
    throw new Error(
      "OUTLOOK_USER_EMAIL is not configured."
    );
  }

  return `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    user
  )}/mailFolders/inbox/messages`;
};

const detectStatus = (subject = "") => {
  const value =
    String(subject).toLowerCase();

  if (
    value.includes("approval") ||
    value.includes("approve")
  ) {
    return "Approval Pending";
  }

  if (
    value.includes("meeting") ||
    value.includes("invite") ||
    value.includes("calendar")
  ) {
    return "Meeting Pending";
  }

  if (
    value.includes("follow") ||
    value.includes("reminder")
  ) {
    return "Follow-up Pending";
  }

  if (
    value.includes("reply") ||
    value.startsWith("re:")
  ) {
    return "Reply Pending";
  }

  return "Pending";
};

const normalizeEmail = (mail) => {
  const senderName =
    mail?.from?.emailAddress?.name ||
    "Unknown";

  const senderEmail =
    mail?.from?.emailAddress?.address ||
    "";

  const importance =
    String(
      mail?.importance || "normal"
    ).toLowerCase();

  let priority = "Medium";

  if (importance === "high") {
    priority = "High";
  } else if (importance === "low") {
    priority = "Low";
  }

  return {
    messageId: mail?.id,

    subject:
      mail?.subject ||
      "No Subject",

    senderName,

    senderEmail,

    body:
      mail?.body?.content ||
      "",

    bodyPreview:
      mail?.bodyPreview ||
      "",

    receivedDateTime:
      mail?.receivedDateTime
        ? new Date(
            mail.receivedDateTime
          )
        : new Date(),

    priority,

    isRead:
      Boolean(mail?.isRead),

    hasAttachments:
      Boolean(mail?.hasAttachments),

    category: "General",

    status: detectStatus(
      mail?.subject
    ),

    updatedAt:
      new Date(),
  };
};

const syncEmails = async (
  limit = 500
) => {
  try {
    console.log(
      "================================="
    );

    console.log(
      "Microsoft Outlook Email Sync"
    );

    console.log(
      "================================="
    );

    const accessToken =
      await getAccessToken();

    if (!accessToken) {
      throw new Error(
        "Microsoft Graph access token unavailable."
      );
    }

    const endpoint =
      getGraphEndpoint(
        accessToken
      );

    const selectFields = [
      "id",
      "subject",
      "bodyPreview",
      "body",
      "from",
      "toRecipients",
      "receivedDateTime",
      "isRead",
      "importance",
      "hasAttachments",
      "flag",
    ].join(",");

    let nextLink =
      `${endpoint}?$top=100` +
      `&$orderby=receivedDateTime DESC` +
      `&$select=${selectFields}`;

    const allEmails = [];

    while (
      nextLink &&
      allEmails.length < limit
    ) {
      const response =
        await axios.get(
          nextLink,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              Prefer:
                'outlook.body-content-type="text"',
            },

            timeout: 30000,
          }
        );

      const data =
        response?.data || {};

      const messages =
        Array.isArray(data.value)
          ? data.value
          : [];

      allEmails.push(
        ...messages
      );

      if (
        allEmails.length >=
        limit
      ) {
        break;
      }

      nextLink =
        data["@odata.nextLink"] ||
        null;
    }

    const emailsToSave =
      allEmails.slice(
        0,
        limit
      );

    let inserted = 0;
    let updated = 0;

    for (
      const mail of emailsToSave
    ) {
      if (!mail?.id) {
        continue;
      }

      const emailData =
        normalizeEmail(mail);

      const existingEmail =
        await Email.findOne({
          messageId:
            mail.id,
        });

      if (existingEmail) {
        await Email.updateOne(
          {
            messageId:
              mail.id,
          },
          {
            $set:
              emailData,
          }
        );

        updated++;
      } else {
        await Email.create(
          emailData
        );

        inserted++;
      }
    }

    const result = {
      success: true,

      totalSynced:
        emailsToSave.length,

      inserted,

      updated,

      message:
        "Microsoft Outlook synchronized successfully.",

      syncTime:
        new Date(),
    };

    try {
      if (
        gateway &&
        typeof gateway.emitNewEmail ===
          "function"
      ) {
        gateway.emitNewEmail(
          result
        );
      }
    } catch (socketError) {
      console.warn(
        "[EmailSyncService] Socket error:",
        socketError.message
      );
    }

    console.log(
      `Total Emails : ${emailsToSave.length}`
    );

    console.log(
      `Inserted     : ${inserted}`
    );

    console.log(
      `Updated      : ${updated}`
    );

    console.log(
      "Outlook synchronization completed."
    );

    return result;
  } catch (error) {
    const message =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Microsoft Outlook synchronization failed.";

    console.error(
      "[EmailSyncService]",
      message
    );

    return {
      success: false,

      totalSynced: 0,

      inserted: 0,

      updated: 0,

      message,
    };
  }
};

module.exports = {
  syncEmails,
};