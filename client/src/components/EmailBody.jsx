function EmailBody({ email }) {
  return (
    <>
      <h3>{email.senderName}</h3>

      <p>{email.senderEmail}</p>

      <p>
        <b>Company :</b> {email.company}
      </p>

      <p>
        <b>Category :</b> {email.category}
      </p>

      <p>
        <b>Received :</b>{" "}
        {new Date(email.receivedDateTime).toLocaleString()}
      </p>

      <hr />

      <h3>Email Body</h3>

      <div
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.8,
          color: "#444",
        }}
      >
        {email.body || email.bodyPreview}
      </div>
    </>
  );
}

export default EmailBody;