function EmailSidebar({ email }) {
  const color =
    email.priority === "High"
      ? "#EF4444"
      : email.priority === "Medium"
      ? "#F59E0B"
      : "#10B981";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 15,
        padding: 25,
        boxShadow: "0 10px 25px rgba(0,0,0,.08)",
        height: "fit-content",
      }}
    >
      <h2>🤖 AI Intelligence</h2>

      <hr />

      <h3>AI Summary</h3>

      <p>{email.aiSummary}</p>

      <hr />

      <h3>Detected Task</h3>

      <p>{email.task}</p>

      <hr />

      <h3>Category</h3>

      <span style={badge}>
        {email.category}
      </span>

      <hr />

      <h3>Priority</h3>

      <span
        style={{
          ...badge,
          background: color,
          color: "#fff",
        }}
      >
        {email.priority}
      </span>

      <hr />

      <h3>Tags</h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {email.tags?.map((tag, i) => (
          <span key={i} style={badge}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

const badge = {
  background: "#EEF2FF",
  color: "#2563EB",
  padding: "7px 14px",
  borderRadius: 20,
};

export default EmailSidebar;