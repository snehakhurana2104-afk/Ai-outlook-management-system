const axios = require("axios");
const { getAccessToken } = require("./graphService");

// ==============================================
// Reply All using Microsoft Graph API
// ==============================================

const replyAll = async (messageId, replyText) => {
  try {
    const accessToken = await getAccessToken();

    const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}/replyAll`;

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
      message: "Reply All sent successfully.",
    };
  } catch (error) {
    console.error(
      "Reply All Error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.error?.message ||
      "Unable to send Reply All."
    );
  }
};

module.exports = {
  replyAll,
};