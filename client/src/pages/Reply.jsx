import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaPaperPlane,
  FaRobot,
  FaCopy,
} from "react-icons/fa";

import {
  getEmailDetails,
  generateReply,
  replyEmail,
} from "../services/emailDetailsService";

import "./Reply.css";

function Reply() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =====================================
  // States
  // =====================================

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [email, setEmail] = useState(null);

  const [replyText, setReplyText] = useState("");

  const [error, setError] = useState("");

  // =====================================
  // Load Email
  // =====================================

  const loadEmail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getEmailDetails(id);

      if (response.success) {
        setEmail(response.data);
      } else {
        setError("Unable to load email.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load email.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEmail();
  }, [loadEmail]);

  // =====================================
  // Generate AI Reply
  // =====================================

  const handleGenerateReply = async () => {
    try {
      setAiLoading(true);

      const response = await generateReply(id);

      if (response.success) {
        setReplyText(response.data.aiReply || "");
      } else {
        alert(response.message || "Unable to generate AI Reply");
      }
    } catch (err) {
      console.error(err);
      alert("AI Reply Generation Failed");
    } finally {
      setAiLoading(false);
    }
  };

  // =====================================
  // Copy Reply
  // =====================================

  const handleCopy = () => {
    if (!replyText.trim()) {
      alert("Nothing to copy.");
      return;
    }

    navigator.clipboard.writeText(replyText);
    alert("Reply copied.");
  };

  // =====================================
  // Send Reply
  // =====================================

  const handleSend = async () => {
    if (!replyText.trim()) {
      alert("Please enter reply.");
      return;
    }

    try {
      setSending(true);

      const response = await replyEmail(id, replyText);

      if (response.success) {
        alert("Reply sent successfully.");
        navigate("/inbox");
      } else {
        alert(response.message || "Reply failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Reply failed.");
    } finally {
      setSending(false);
    }
  };

  // =====================================
  // Loading
  // =====================================

  if (loading) {
    return (
      <div className="reply-loading">
        Loading Email...
      </div>
    );
  }

  if (error) {
    return (
      <div className="reply-loading">
        {error}
      </div>
    );
  }
    return (
    <div className="reply-page">

      <div className="reply-card">

        {/* ================= Header ================= */}

        <div className="reply-header">

          <button
            className="reply-back-btn"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            Back
          </button>

          <div>

            <h2 className="reply-title">
              Reply Email
            </h2>

            <p className="reply-subtitle">
              Review the original message and send your reply.
            </p>

          </div>

        </div>

        {/* ================= Original Email ================= */}

        <div className="reply-section">

          <label className="reply-label">
            To
          </label>

          <input
            className="reply-input"
            type="email"
            value={email?.senderEmail || ""}
            readOnly
          />

        </div>

        <div className="reply-section">

          <label className="reply-label">
            Subject
          </label>

          <input
            className="reply-input"
            type="text"
            value={`Re: ${email?.subject || ""}`}
            readOnly
          />

        </div>

        <div className="reply-section">

          <label className="reply-label">
            Original Message
          </label>

          <div className="original-message">

            {email?.body || "No email content available."}

          </div>

        </div>

        {/* ================= Reply ================= */}

        <div className="reply-section">

          <div className="reply-toolbar">

            <label className="reply-label">
              Reply Message
            </label>

            <button
              type="button"
              className="reply-ai-btn"
              onClick={handleGenerateReply}
              disabled={aiLoading}
            >
              <FaRobot />

              {aiLoading
                ? "Generating..."
                : "Generate AI Reply"}

            </button>

          </div>

          <textarea
            className="reply-textarea"
            placeholder="Write your reply..."
            value={replyText}
            onChange={(e) =>
              setReplyText(e.target.value)
            }
          />

        </div>

        {/* ================= Footer ================= */}

        <div className="reply-actions">

          <button
            type="button"
            className="reply-copy-btn"
            onClick={handleCopy}
          >
            <FaCopy />
            Copy
          </button>

          <button
            type="button"
            className="reply-send-btn"
            onClick={handleSend}
            disabled={sending}
          >
            <FaPaperPlane />

            {sending
              ? "Sending..."
              : "Send Reply"}

          </button>

        </div>

      </div>

    </div>
  );

}

export default Reply;