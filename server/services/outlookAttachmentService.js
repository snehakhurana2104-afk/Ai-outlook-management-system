const axios = require("axios");
const { getAccessToken } = require("./graphService");

// ==============================================
// Download Attachment
// ==============================================

const downloadAttachment = async (
  messageId,
  attachmentId
) => {
  try {
    const accessToken = await getAccessToken();

    const url =
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments/${attachmentId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const attachment = response.data;

    return {
      id: attachment.id,
      name: attachment.name,
      contentType: attachment.contentType,
      size: attachment.size,
      isInline: attachment.isInline,
      contentBytes: attachment.contentBytes,
    };
  } catch (error) {
    console.error(
      "Download Attachment Error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.error?.message ||
        "Unable to download attachment."
    );
  }
};

module.exports = {
  downloadAttachment,
};