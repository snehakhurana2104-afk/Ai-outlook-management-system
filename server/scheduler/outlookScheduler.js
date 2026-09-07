const cron = require("node-cron");
const { syncEmails } = require("../services/emailSyncService");

const startOutlookScheduler = () => {

  console.log("=================================");
  console.log("📅 Outlook Scheduler Started");
  console.log("=================================");

  // First Sync Immediately

  syncEmails()
    .then((result) => {

      console.log("✅ Initial Outlook Sync");
      console.log(result);

    })
    .catch((err) => {

      console.error("❌ Initial Sync Failed");
      console.error(err.message);

    });

  // Every 2 Minutes

  cron.schedule("*/2 * * * *", async () => {

    console.log("🔄 Checking Outlook for new emails...");

    try {

      const result = await syncEmails();

      console.log("✅ Outlook Sync Completed");

      console.log(result);

    }

    catch (error) {

      console.error("❌ Outlook Scheduler Error");

      console.error(error.message);

    }

  });

};

module.exports = startOutlookScheduler;