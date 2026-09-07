import React, { useEffect, useState } from "react";
import socket from "../services/socketService";

function MailNotification() {

  const [notification, setNotification] = useState(null);

  useEffect(() => {

    const handleNewEmail = (email) => {

      setNotification(email);

      // Hide after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);

    };

    socket.on("new-email", handleNewEmail);

    return () => {
      socket.off("new-email", handleNewEmail);
    };

  }, []);

  if (!notification) return null;

  return (

    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        width: 330,
        background: "#2563EB",
        color: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 10px 25px rgba(0,0,0,.25)",
        zIndex: 9999,
      }}
    >

      <h3 style={{ marginTop: 0 }}>
        📧 New Outlook Email
      </h3>

      <p>
        <strong>Subject:</strong><br />
        {notification.subject}
      </p>

      <p>
        <strong>Sender:</strong><br />
        {notification.senderName}
      </p>

      <p>
        <strong>Company:</strong><br />
        {notification.company}
      </p>

      <p>
        <strong>Priority:</strong><br />
        {notification.priority}
      </p>

    </div>

  );

}

export default MailNotification;