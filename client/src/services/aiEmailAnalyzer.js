// =========================================
// AI Email Analyzer
// =========================================

function detectCategory(text) {
  text = text.toLowerCase();

  const categories = [
    {
      name: "Cloud",
      keywords: [
        "azure",
        "aws",
        "gcp",
        "cloud",
        "microsoft azure"
      ]
    },

    {
      name: "Cyber Security",
      keywords: [
        "ceh",
        "security",
        "ethical hacking",
        "soc",
        "siem",
        "fortinet",
        "firewall"
      ]
    },

    {
      name: "Networking",
      keywords: [
        "ccna",
        "ccnp",
        "network",
        "cisco",
        "routing",
        "switching"
      ]
    },

    {
      name: "DevOps",
      keywords: [
        "docker",
        "kubernetes",
        "jenkins",
        "terraform",
        "devops"
      ]
    },

    {
      name: "Programming",
      keywords: [
        "python",
        "java",
        "react",
        "node",
        "javascript"
      ]
    },

    {
      name: "Database",
      keywords: [
        "sql",
        "mysql",
        "mongodb",
        "oracle"
      ]
    },

    {
      name: "Training",
      keywords: [
        "training",
        "trainer",
        "batch",
        "course",
        "lab",
        "participant"
      ]
    },

    {
      name: "HR",
      keywords: [
        "leadership",
        "employee",
        "hr",
        "hiring"
      ]
    }
  ];

  for (const category of categories) {
    for (const keyword of category.keywords) {

      if (text.includes(keyword)) {
        return category.name;
      }

    }
  }

  return "General";
}

function detectPriority(text) {

  text = text.toLowerCase();

  if (
    text.includes("urgent") ||
    text.includes("asap") ||
    text.includes("immediately") ||
    text.includes("today") ||
    text.includes("deadline") ||
    text.includes("eod")
  ) {
    return "High";
  }

  if (
    text.includes("tomorrow") ||
    text.includes("soon")
  ) {
    return "Medium";
  }

  return "Low";
}

function generateSummary(body) {

  if (!body)
    return "";

  const lines = body
    .replace(/\r/g, "")
    .split("\n")
    .filter(line => line.trim() !== "");

  return lines.slice(0,3).join(" ");
}

function extractTasks(body){

  if(!body)
    return [];

  const tasks=[];

  const keywords=[
    "please",
    "kindly",
    "share",
    "send",
    "provide",
    "submit"
  ];

  const lines=body.split("\n");

  lines.forEach(line=>{

    const lower=line.toLowerCase();

    if(
      keywords.some(word=>lower.includes(word))
    ){
      tasks.push(line.trim());
    }

  });

  return tasks;
}

function analyzeEmail(subject,body){

  const text=(subject+" "+body);

  return{

    category:detectCategory(text),

    priority:detectPriority(text),

    aiSummary:generateSummary(body),

    tasks:extractTasks(body)

  };

}

module.exports={
  analyzeEmail
};