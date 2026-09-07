import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function EmailHeader({ email }) {
  const navigate = useNavigate();

  const color =
    email.priority === "High"
      ? "#EF4444"
      : email.priority === "Medium"
      ? "#F59E0B"
      : "#10B981";

  return (
    <>
      <button
        onClick={() => navigate(-1)}
        style={{
          border: "none",
          background: "#2563EB",
          color: "#fff",
          padding: "10px 18px",
          borderRadius: 8,
          cursor: "pointer",
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <FaArrowLeft />
        Back
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>{email.subject}</h2>

        <span
          style={{
            background: color,
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 20,
          }}
        >
          {email.priority}
        </span>
      </div>

      <hr />
    </>
  );
}

export default EmailHeader;