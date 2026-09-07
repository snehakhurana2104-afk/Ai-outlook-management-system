import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Compose.css";

const Compose = () => {
  const navigate = useNavigate();

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setSending(true);

      const response = await axios.post(
        "http://127.0.0.1:5000/api/outlook/send",
        {
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
        }
      );

      if (response.status === 200 || response.status === 201) {
        alert("Email sent successfully!");

        setTo("");
        setSubject("");
        setBody("");

        navigate("/inbox");
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to send email. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="compose-page">
      <div className="compose-card">
        <h2 className="compose-title">Compose Email</h2>

        <p className="compose-subtitle">
          Draft and send a new Outlook email using the AI Email Intelligence
          System.
        </p>

        <div className="compose-group">
          <label className="compose-label">To</label>

          <input
            type="email"
            className="compose-input"
            placeholder="recipient@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="compose-group">
          <label className="compose-label">Subject</label>

          <input
            type="text"
            className="compose-input"
            placeholder="Enter subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="compose-group">
          <label className="compose-label">Message</label>

          <textarea
            className="compose-textarea"
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="compose-actions">
          <button
            type="button"
            className="compose-btn compose-btn-secondary"
            onClick={() => navigate(-1)}
            disabled={sending}
          >
            Cancel
          </button>

          <button
            type="button"
            className="compose-btn compose-btn-primary"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Compose;