const StatCard = ({ title, value, color }) => {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "15px",
        padding: "25px",
        boxShadow: "0 10px 25px rgba(0,0,0,.08)",
        borderLeft: `6px solid ${color}`,
      }}
    >
      <h4
        style={{
          color: "#6b7280",
          marginBottom: "15px",
        }}
      >
        {title}
      </h4>

      <h1
        style={{
          fontSize: "38px",
          color,
          margin: 0,
        }}
      >
        {value}
      </h1>
    </div>
  );
};

export default StatCard;