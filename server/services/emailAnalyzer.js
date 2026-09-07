// ======================================
// AI Email Analyzer (Rule Based)
// ======================================

function analyzeEmail(email) {
  const subject = (email.subject || "").toLowerCase();
  const body = (email.body || "").toLowerCase();
  const senderEmail = (email.senderEmail || "").toLowerCase();

  const text = `${subject} ${body}`;

  // ======================
  // Company Detection
  // ======================

  let company = "Unknown";

  if (senderEmail.includes("microsoft")) company = "Microsoft";
  else if (senderEmail.includes("amazon")) company = "Amazon";
  else if (senderEmail.includes("google")) company = "Google";
  else if (senderEmail.includes("oracle")) company = "Oracle";
  else if (senderEmail.includes("ssdn")) company = "SSDN Technologies";

  // ======================
  // Category
  // ======================

  let category = "General";

  if (text.includes("azure")) category = "Microsoft Azure";
  else if (text.includes("aws")) category = "AWS";
  else if (text.includes("java")) category = "Java";
  else if (text.includes("python")) category = "Python";
  else if (text.includes("react")) category = "React";
  else if (text.includes("ai")) category = "Artificial Intelligence";

  // ======================
  // Priority
  // ======================

  let status = "Normal";

  if (
    text.includes("urgent") ||
    text.includes("immediately") ||
    text.includes("asap")
  ) {
    status = "High";
  }

  // ======================
  // Tags
  // ======================

  const tags = [];

  if (text.includes("training")) tags.push("Training");
  if (text.includes("meeting")) tags.push("Meeting");
  if (text.includes("invoice")) tags.push("Invoice");
  if (text.includes("certificate")) tags.push("Certificate");

  // ======================
  // Summary
  // ======================

  const summary =
    body.length > 150
      ? body.substring(0, 150) + "..."
      : body;

  // ======================
  // Task
  // ======================

  const task =
    text.includes("training")
      ? "Attend Training"
      : text.includes("meeting")
      ? "Attend Meeting"
      : "No Task";

  return {
    company,
    category,
    status,
    tags,
    summary,
    task,
  };
}

module.exports = analyzeEmail;