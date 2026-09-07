// ===========================================================
// controllers/emailController.js
// Microsoft Graph Outlook Email Controller
// ===========================================================

const axios = require("axios");
const Email = require("../models/Email");

const GRAPH_URL =
  "https://graph.microsoft.com/v1.0";

// ===========================================================
// GET TOKEN
// ===========================================================

function getGraphToken(req) {
  const auth =
    req.headers.authorization || "";

  if (!auth.startsWith("Bearer ")) {
    return null;
  }

  return auth.substring(7);
}

// ===========================================================
// GRAPH REQUEST
// ===========================================================

async function graphGet(url, token) {
  return axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    timeout: 30000,
  });
}

// ===========================================================
// GET INBOX
// ===========================================================

exports.getEmails = async (req, res) => {
  try {
    const emails = await Email.find({
      archived: false,
    })
      .sort({
        receivedDateTime: -1,
      })
      .lean();

    return res.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error(
      "GET EMAILS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load emails from database.",
    });
  }
};

// ===========================================================
// SYNC OUTLOOK
// ===========================================================

exports.syncOutlookEmails = async (
  req,
  res
) => {
  const token = getGraphToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Microsoft Graph access token missing. Please login again.",
    });
  }

  try {
    let nextUrl =
      `${GRAPH_URL}/me/mailFolders/Inbox/messages` +
      `?$top=50` +
      `&$select=` +
      [
        "id",
        "subject",
        "bodyPreview",
        "body",
        "sender",
        "from",
        "receivedDateTime",
        "isRead",
        "importance",
        "categories",
        "internetMessageId",
        "conversationId",
        "hasAttachments",
      ].join(",") +
      `&$orderby=receivedDateTime desc`;

    let totalSynced = 0;

    let pages = 0;

    // Safety limit
    const MAX_PAGES = 10;

    while (nextUrl && pages < MAX_PAGES) {
      pages++;

      console.log(
        `Microsoft Graph Inbox page ${pages}`
      );

      const response =
        await graphGet(
          nextUrl,
          token
        );

      const messages =
        response.data?.value || [];

      console.log(
        `Graph returned ${messages.length} messages`
      );

      for (const message of messages) {
        try {
          const senderName =
            message.sender?.emailAddress
              ?.name ||
            message.from?.emailAddress
              ?.name ||
            "Unknown Sender";

          const senderEmail =
            message.sender?.emailAddress
              ?.address ||
            message.from?.emailAddress
              ?.address ||
            "";

          const company =
            extractCompany(
              senderEmail
            );

          const priority =
            mapImportance(
              message.importance
            );

          const bodyText =
            extractBodyText(
              message.body
            );

          let attachments = [];

          // -------------------------------------------------
          // ATTACHMENTS
          // -------------------------------------------------

          if (message.hasAttachments) {
            try {
              const attachmentResponse =
                await graphGet(
                  `${GRAPH_URL}/me/messages/${message.id}/attachments`,
                  token
                );

              attachments =
                (
                  attachmentResponse.data
                    ?.value || []
                ).map(
                  (attachment) => ({
                    id: attachment.id,
                    name:
                      attachment.name ||
                      "Attachment",
                    size:
                      attachment.size ||
                      0,
                    contentType:
                      attachment.contentType ||
                      "",
                    isInline:
                      attachment.isInline ||
                      false,
                  })
                );
            } catch (attachmentError) {
              console.warn(
                "Attachment fetch failed:",
                attachmentError.response
                  ?.data ||
                  attachmentError.message
              );
            }
          }

          // -------------------------------------------------
          // UPSERT
          // -------------------------------------------------

          await Email.findOneAndUpdate(
            {
              graphId: message.id,
            },
            {
              $set: {
                graphId: message.id,

                internetMessageId:
                  message.internetMessageId ||
                  "",

                conversationId:
                  message.conversationId ||
                  "",

                subject:
                  message.subject ||
                  "(No subject)",

                senderName,

                senderEmail,

                company,

                body: bodyText,

                bodyPreview:
                  message.bodyPreview ||
                  "",

                receivedDateTime:
                  message.receivedDateTime
                    ? new Date(
                        message.receivedDateTime
                      )
                    : null,

                isRead:
                  Boolean(
                    message.isRead
                  ),

                priority,

                category:
                  message.categories
                    ?.length
                    ? message.categories[0]
                    : "General",

                attachments,

                lastGraphSync:
                  new Date(),
              },
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            }
          );

          totalSynced++;
        } catch (messageError) {
          console.error(
            "MESSAGE SYNC ERROR:",
            messageError
          );
        }
      }

      nextUrl =
        response.data?.["@odata.nextLink"] ||
        null;
    }

    console.log(
      `Outlook sync completed. ${totalSynced} emails processed.`
    );

    // -------------------------------------------------------
    // SOCKET EVENT
    // -------------------------------------------------------

    const io = req.app.get("io");

    if (io) {
      io.emit("email-updated");
      io.emit("stats-updated");
    }

    return res.json({
      success: true,
      synced: totalSynced,
      message:
        "Outlook synchronization completed.",
    });
  } catch (error) {
    console.error(
      "OUTLOOK SYNC ERROR:"
    );

    console.error(
      error.response?.data ||
        error.message
    );

    const status =
      error.response?.status || 500;

    // -------------------------------------------------------
    // GRAPH AUTH ERROR
    // -------------------------------------------------------

    if (
      status === 401 ||
      status === 403
    ) {
      return res.status(status).json({
        success: false,
        message:
          "Microsoft Graph rejected the access token. Please login again and make sure Mail.Read permission is granted.",
        graphError:
          error.response?.data?.error
            ?.message || null,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to synchronize Outlook emails.",
      error:
        error.response?.data ||
        error.message,
    });
  }
};

// ===========================================================
// MARK READ
// ===========================================================

exports.markRead = async (
  req,
  res
) => {
  const token = getGraphToken(req);

  if (!token) {
    return res.status(401).json({
      message: "Graph token missing.",
    });
  }

  try {
    const email =
      await Email.findById(
        req.params.id
      );

    if (!email) {
      return res.status(404).json({
        message: "Email not found.",
      });
    }

    await axios.patch(
      `${GRAPH_URL}/me/messages/${email.graphId}`,
      {
        isRead: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
      }
    );

    email.isRead = true;

    await email.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("email-updated");
    }

    res.json({
      success: true,
      email,
    });
  } catch (error) {
    console.error(
      "MARK READ ERROR:",
      error.response?.data ||
        error.message
    );

    res.status(
      error.response?.status || 500
    ).json({
      success: false,
      message:
        "Unable to mark email as read.",
    });
  }
};

// ===========================================================
// TOGGLE READ
// ===========================================================

exports.toggleRead = async (
  req,
  res
) => {
  const token = getGraphToken(req);

  if (!token) {
    return res.status(401).json({
      message: "Graph token missing.",
    });
  }

  try {
    const email =
      await Email.findById(
        req.params.id
      );

    if (!email) {
      return res.status(404).json({
        message: "Email not found.",
      });
    }

    const newValue =
      !email.isRead;

    await axios.patch(
      `${GRAPH_URL}/me/messages/${email.graphId}`,
      {
        isRead: newValue,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
      }
    );

    email.isRead = newValue;

    await email.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("email-updated");
    }

    res.json({
      success: true,
      isRead: newValue,
    });
  } catch (error) {
    console.error(
      "TOGGLE READ ERROR:",
      error.response?.data ||
        error.message
    );

    res.status(
      error.response?.status || 500
    ).json({
      success: false,
      message:
        "Unable to update read status.",
    });
  }
};

// ===========================================================
// ARCHIVE
// ===========================================================

exports.archiveEmail = async (
  req,
  res
) => {
  const token = getGraphToken(req);

  if (!token) {
    return res.status(401).json({
      message: "Graph token missing.",
    });
  }

  try {
    const email =
      await Email.findById(
        req.params.id
      );

    if (!email) {
      return res.status(404).json({
        message: "Email not found.",
      });
    }

    // -------------------------------------------------------
    // Move Outlook email to Archive
    // -------------------------------------------------------

    await axios.post(
      `${GRAPH_URL}/me/messages/${email.graphId}/move`,
      {
        destinationId: "archive",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
      }
    );

    email.archived = true;

    await email.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("email-updated");
    }

    res.json({
      success: true,
      message: "Email archived.",
    });
  } catch (error) {
    console.error(
      "ARCHIVE ERROR:",
      error.response?.data ||
        error.message
    );

    res.status(
      error.response?.status || 500
    ).json({
      success: false,
      message:
        "Unable to archive Outlook email.",
    });
  }
};

// ===========================================================
// DELETE
// ===========================================================

exports.deleteEmail = async (
  req,
  res
) => {
  const token = getGraphToken(req);

  if (!token) {
    return res.status(401).json({
      message: "Graph token missing.",
    });
  }

  try {
    const email =
      await Email.findById(
        req.params.id
      );

    if (!email) {
      return res.status(404).json({
        message: "Email not found.",
      });
    }

    await axios.delete(
      `${GRAPH_URL}/me/messages/${email.graphId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    await Email.deleteOne({
      _id: email._id,
    });

    const io = req.app.get("io");

    if (io) {
      io.emit("email-deleted");
    }

    res.json({
      success: true,
      message: "Email deleted.",
    });
  } catch (error) {
    console.error(
      "DELETE ERROR:",
      error.response?.data ||
        error.message
    );

    res.status(
      error.response?.status || 500
    ).json({
      success: false,
      message:
        "Unable to delete Outlook email.",
    });
  }
};

// ===========================================================
// ASSIGN
// ===========================================================

exports.assignEmail = async (
  req,
  res
) => {
  try {
    const email =
      await Email.findByIdAndUpdate(
        req.params.id,
        {
          assignedTo:
            req.body.assignedTo || "",
        },
        {
          new: true,
        }
      );

    if (!email) {
      return res.status(404).json({
        message: "Email not found.",
      });
    }

    res.json({
      success: true,
      email,
    });
  } catch (error) {
    console.error(
      "ASSIGN ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to assign email.",
    });
  }
};

// ===========================================================
// HELPERS
// ===========================================================

function extractBodyText(body) {
  if (!body) {
    return "";
  }

  const content =
    body.content || "";

  if (
    body.contentType === "html"
  ) {
    return stripHtml(content);
  }

  return content;
}

function stripHtml(html) {
  return String(html)
    .replace(
      /<style[^>]*>[\s\S]*?<\/style>/gi,
      ""
    )
    .replace(
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      ""
    )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(
      /&#39;/gi,
      "'"
    )
    .replace(
      /&quot;/gi,
      '"'
    )
    .replace(
      /\n\s*\n\s*\n/g,
      "\n\n"
    )
    .trim();
}

function mapImportance(importance) {
  if (
    importance === "high"
  ) {
    return "High";
  }

  if (
    importance === "normal"
  ) {
    return "Medium";
  }

  return "Low";
}

function extractCompany(email) {
  if (!email || !email.includes("@")) {
    return "Unknown";
  }

  const domain =
    email.split("@")[1];

  if (!domain) {
    return "Unknown";
  }

  return domain
    .split(".")[0]
    .replace(
      /^./,
      (letter) =>
        letter.toUpperCase()
    );
}