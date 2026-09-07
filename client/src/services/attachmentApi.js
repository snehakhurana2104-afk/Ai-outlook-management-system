import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// ==============================================
// Download Outlook Attachment
// ==============================================

export const downloadAttachment = async (
  emailId,
  attachmentId
) => {
  const response = await API.get(
    `/attachments/${emailId}/${attachmentId}`
  );

  return response.data;
};