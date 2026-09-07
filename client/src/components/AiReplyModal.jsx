import React, { useEffect, useState } from "react";
import { generateAIReply } from "../services/emailApi";
import "./AiReplyModal.css";

function AiReplyModal({
  email,
  onClose,
  onRefresh,
}) {
  const [loading, setLoading] = useState(true);

  const [reply, setReply] = useState("");

  useEffect(() => {
    if (email) {
      loadReply();
    }
  }, [email]);

  const loadReply = async () => {
    try {
      setLoading(true);

      const res = await generateAIReply(email._id);

      console.log("AI Reply Response :", res);

      const aiReply =
        res?.data?.reply ||
        res?.reply ||
        res?.data ||
        "";

      setReply(aiReply);
    } catch (err) {
      console.error(err);
      setReply("Unable to generate AI Reply.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reply-overlay">
      <div className="reply-modal">

        <div className="reply-header">
          <h2>AI Reply Generator</h2>

          <button
            className="close-icon"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="reply-body">

          <div className="reply-info">
            <p>
              <strong>To :</strong>{" "}
              {email.senderEmail}
            </p>

            <p>
              <strong>Subject :</strong>{" "}
              {email.subject}
            </p>
          </div>

          {loading ? (
            <div className="reply-loading">
              <h3>Generating AI Reply...</h3>
            </div>
          ) : (
            <textarea
              rows={14}
              value={reply}
              onChange={(e) =>
                setReply(e.target.value)
              }
            />
          )}
        </div>

        <div className="reply-footer">

          <button
            className="close-btn"
            onClick={onClose}
          >
            Close
          </button>

          <button
            className="refresh-btn"
            onClick={() => {
              if (onRefresh) {
                onRefresh();
              }

              onClose();
            }}
          >
            Done
          </button>

        </div>

      </div>
    </div>
  );
}

export default AiReplyModal;