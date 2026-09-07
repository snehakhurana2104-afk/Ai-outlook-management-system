const { syncEmails } = require("../services/emailSyncService");

const syncOutlookEmails = async (req, res) => {
  try {
    const result = await syncEmails();

    res.status(200).json({
      success: true,
      message: "Emails synchronized successfully",
      count: result?.count || 0,
      data: result,
    });
  } catch (error) {
    console.error("Email Sync Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to synchronize emails.",
      error: error.message,
    });
  }
};

module.exports = {
  syncOutlookEmails,
};