import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/ai",
});

// ==============================================
// Generate AI Reply
// ==============================================

export const generateAIReply = async (emailId) => {
  const { data } = await API.get(`/generate-reply/${emailId}`);
  return data;
};

// ==============================================
// Send AI Reply
// ==============================================

export const sendReply = async (emailId) => {
  const { data } = await API.post(`/reply/${emailId}`);
  return data;
};

// ==============================================
// Reply All
// ==============================================

export const replyAll = async (emailId) => {
  const { data } = await API.post(`/reply-all/${emailId}`);
  return data;
};

// ==============================================
// Forward Email
// ==============================================

export const forwardMail = async (
  emailId,
  to,
  comment
) => {
  const { data } = await API.post(`/forward/${emailId}`, {
    to,
    comment,
  });

  return data;
};

// ==============================================
// Send New Mail
// ==============================================

export const sendMail = async (
  to,
  subject,
  body
) => {
  const { data } = await API.post("/send-mail", {
    to,
    subject,
    body,
  });

  return data;
};
export const deleteMail = async (emailId) => {
  const response = await axios.delete(
    `${API}/delete/${emailId}`
  );

  return response.data;
};