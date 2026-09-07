import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function InboxAlert() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {

    socket.on("notification", (data) => {

      setNotifications((prev) => [
        data,
        ...prev,
      ]);

    });

    return () => {

      socket.off("notification");

    };

  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        width: 320,
        zIndex: 9999,
      }}
    >
      {notifications.map((item, index) => (
        <div
          key={index}
          style={{
            background: "#2563EB",
            color: "#FFFFFF",
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
            boxShadow: "0 10px 20px rgba(0,0,0,.2)",
          }}
        >
          <strong>{item.title}</strong>

          <p
            style={{
              marginTop: 8,
              fontSize: 14,
            }}
          >
            {item.message}
          </p>
        </div>
      ))}
    </div>
  );
}

export default InboxAlert;