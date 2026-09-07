// ======================================
// AI EMAIL ANALYZER
// Enterprise Rule Based Version
// ======================================

function analyzeEmail(email) {

  const subject = (email.subject || "").toLowerCase();

  const body = (email.body || "").toLowerCase();

  const senderEmail = (email.senderEmail || "").toLowerCase();

  const senderName = (email.senderName || "").toLowerCase();

  const text = `${subject} ${body} ${senderName}`;

  // ======================================
  // Company Detection
  // ======================================

  let company = "Unknown";

  if (senderEmail.includes("microsoft"))
    company = "Microsoft";

  else if (senderEmail.includes("amazon"))
    company = "Amazon";

  else if (senderEmail.includes("google"))
    company = "Google";

  else if (senderEmail.includes("oracle"))
    company = "Oracle";

  else if (senderEmail.includes("ibm"))
    company = "IBM";

  else if (senderEmail.includes("infosys"))
    company = "Infosys";

  else if (senderEmail.includes("tcs"))
    company = "TCS";

  else if (senderEmail.includes("accenture"))
    company = "Accenture";

  else if (senderEmail.includes("wipro"))
    company = "Wipro";

  else if (senderEmail.includes("ssdn"))
    company = "SSDN Technologies";

  // ======================================
  // Technology Detection
  // ======================================

  let technology = "General";

  if (text.includes("azure"))
    technology = "Microsoft Azure";

  else if (text.includes("aws"))
    technology = "AWS";

  else if (text.includes("gcp"))
    technology = "Google Cloud";

  else if (text.includes("java"))
    technology = "Java";

  else if (text.includes("python"))
    technology = "Python";

  else if (text.includes("react"))
    technology = "React";

  else if (text.includes("node"))
    technology = "Node.js";

  else if (text.includes("devops"))
    technology = "DevOps";

  else if (text.includes("docker"))
    technology = "Docker";

  else if (text.includes("kubernetes"))
    technology = "Kubernetes";

  else if (
    text.includes("ai") ||
    text.includes("artificial intelligence") ||
    text.includes("machine learning")
  )
    technology = "Artificial Intelligence";

  // ======================================
  // Category Detection
  // ======================================

  let category = "General";

  switch (technology) {

    case "Microsoft Azure":
    case "AWS":
    case "Google Cloud":
      category = "Cloud";
      break;

    case "Java":
    case "Python":
    case "React":
    case "Node.js":
      category = "Programming";
      break;

    case "DevOps":
    case "Docker":
    case "Kubernetes":
      category = "DevOps";
      break;

    case "Artificial Intelligence":
      category = "Artificial Intelligence";
      break;

    default:
      category = "General";
  }

  // ======================================
  // Training Type
  // ======================================

  let trainingType = "General";

  if (text.includes("corporate"))
    trainingType = "Corporate";

  else if (text.includes("online"))
    trainingType = "Online";

  else if (text.includes("classroom"))
    trainingType = "Classroom";

  else if (text.includes("bootcamp"))
    trainingType = "Bootcamp";

  // ======================================
  // Customer Type
  // ======================================

  let customerType = "Unknown";

  if (
    senderEmail.includes(".edu") ||
    text.includes("college") ||
    text.includes("student")
  ) {

    customerType = "Student";

  }

  else if (
    text.includes("company") ||
    text.includes("corporate") ||
    text.includes("organization")
  ) {

    customerType = "Corporate";

  }

  else {

    customerType = "Individual";

  }
    // ======================================
  // Requirements Detection
  // ======================================

  const requirements = [];

  if (text.includes("training"))
    requirements.push("Training");

  if (text.includes("certificate"))
    requirements.push("Certificate");

  if (text.includes("invoice"))
    requirements.push("Invoice");

  if (text.includes("quotation"))
    requirements.push("Quotation");

  if (text.includes("meeting"))
    requirements.push("Meeting");

  if (text.includes("exam"))
    requirements.push("Exam");

  if (text.includes("payment"))
    requirements.push("Payment");

  if (text.includes("demo"))
    requirements.push("Demo");

  // ======================================
  // Priority Detection
  // ======================================

  let priority = "Low";

  if (
    text.includes("urgent") ||
    text.includes("critical") ||
    text.includes("immediately") ||
    text.includes("asap") ||
    text.includes("high priority") ||
    text.includes("today itself")
  ) {

    priority = "High";

  }

  else if (
    text.includes("today") ||
    text.includes("tomorrow") ||
    text.includes("meeting") ||
    text.includes("schedule") ||
    text.includes("important") ||
    text.includes("follow up")
  ) {

    priority = "Medium";

  }

  // ======================================
  // Status Detection
  // ======================================

  let status = "Not Completed";

  // Pending

  if (
    text.includes("training") ||
    text.includes("reply") ||
    text.includes("respond") ||
    text.includes("action required") ||
    text.includes("follow up") ||
    text.includes("meeting") ||
    text.includes("please confirm") ||
    text.includes("kindly confirm") ||
    text.includes("register") ||
    text.includes("pending")
  ) {

    status = "Pending";

  }

  // Completed

  if (
    text.includes("completed") ||
    text.includes("reply sent") ||
    text.includes("resolved") ||
    text.includes("closed") ||
    text.includes("done") ||
    text.includes("certificate issued") ||
    text.includes("successfully completed")
  ) {

    status = "Completed";

  }

  // ======================================
  // AI Summary
  // ======================================

  const aiSummary =
    body.length > 250
      ? body.substring(0, 250) + "..."
      : body;

  // ======================================
  // Task Detection
  // ======================================

  let task = "No Action Required";

  if (text.includes("training")) {

    task = "Attend Training";

  }

  else if (text.includes("meeting")) {

    task = "Attend Meeting";

  }

  else if (text.includes("reply")) {

    task = "Reply to Email";

  }

  else if (text.includes("follow up")) {

    task = "Follow Up";

  }

  else if (text.includes("certificate")) {

    task = "Issue Certificate";

  }

  else if (text.includes("invoice")) {

    task = "Send Invoice";

  }

  else if (text.includes("quotation")) {

    task = "Send Quotation";

  }

  else if (text.includes("payment")) {

    task = "Verify Payment";

  }

  else if (text.includes("exam")) {

    task = "Schedule Exam";

  }
    // ======================================
  // Requirements Detection
  // ======================================

 

  // ======================================
  // Priority Detection
  // ======================================




  // ======================================
  // Status Detection
  // ======================================


  // Completed



  // ======================================
  // AI Summary
  // ======================================

  
  // ======================================
  // Task Detection
  // ======================================

 




  return {
  company,
  technology,
  category,
  trainingType,
  customerType,
  requirements,
  priority,
  status,
  aiSummary,
  task,
  tasks: [task],
  suggestedReply: "",
  actionRequired: status === "Pending",
  dueStatus: priority === "High" ? "Today" : "Normal",
  score: priority === "High" ? 95 : priority === "Medium" ? 70 : 40,
  tags: [technology, category],
};
}
module.exports = {
  analyzeEmail,
};