const axios = require("axios");
const { getAccessToken } = require("./graphService");

// ==============================================
// Send AI Reply using Microsoft Graph
// ==============================================

const sendAIReply = async (messageId, replyText) => {
  try {
    const accessToken = await getAccessToken();

    const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}/reply`;

    await axios.post(
      url,
      {
        comment: replyText,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      message: "AI Reply sent successfully.",
    };
  } catch (error) {
    console.error(
      "Send AI Reply Error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.error?.message ||
        "Unable to send AI reply."
    );
  }
};

// ==============================================
// Send New Mail using Microsoft Graph
// ==============================================

const sendMail = async ({ to, subject, body }) => {
  try {
    const accessToken = await getAccessToken();

    const url = "https://graph.microsoft.com/v1.0/me/sendMail";

    await axios.post(
      url,
      {
        message: {
          subject: subject,

          body: {
            contentType: "Text",
            content: body,
          },

          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
        },

        saveToSentItems: true,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      message: "Mail sent successfully.",
    };
  } catch (error) {
    console.error(
      "Send Mail Error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.error?.message ||
        "Unable to send email."
    );
  }
};

// ==============================================
// Forward Email
// ==============================================

const forwardMail = async ({
  messageId,
  to,
  comment = "",
}) => {
  try {
    const accessToken = await getAccessToken();

    const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}/forward`;

    await axios.post(
      url,
      {
        comment,

        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      message: "Email forwarded successfully.",
    };
  } catch (error) {
    console.error(
      "Forward Mail Error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.error?.message ||
        "Unable to forward email."
    );
  }
};

// ==============================================
// Export
// ==============================================

module.exports = {
  sendAIReply,
  sendMail,
  forwardMail,
};