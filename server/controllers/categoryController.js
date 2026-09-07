// ======================================
// Category Controller
// ======================================

const Email = require("../models/Email");

// ======================================
// Get Categories
// ======================================

const getCategories = async (req, res) => {

  try {

    // ======================================
    // Date range: current month (1st → today)
    // ======================================

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const emails = await Email.find({
      receivedDateTime: { $gte: monthStart, $lte: new Date() },
    }).sort({
      receivedDateTime: -1,
    });

    // ======================================
    // Employee Map
    // ======================================

    const employeeMap = {};

    emails.forEach((email) => {

      const employee =

        email.senderName ||

        email.senderEmail ||

        "Unknown";

      if (!employeeMap[employee]) {

        employeeMap[employee] = {

          name: employee,

          totalEmails: 0,

          completed: 0,

          pending: 0,

          notCompleted: 0,

          high: 0,

          medium: 0,

          low: 0,

        };

      }

      employeeMap[employee].totalEmails++;

      // ======================================
      // Status
      // ======================================

      const status =

        (email.status || "").toLowerCase();

      const priority =

        (email.priority || "").toLowerCase();
              // ======================================
      // Status Count
      // ======================================

      if (status === "completed") {

        employeeMap[employee].completed++;

      }

      else if (status === "pending") {

        employeeMap[employee].pending++;

      }

      else {

        employeeMap[employee].notCompleted++;

      }

      // ======================================
      // Priority Count
      // ======================================

      if (priority === "high") {

        employeeMap[employee].high++;

      }

      else if (priority === "medium") {

        employeeMap[employee].medium++;

      }

      else {

        employeeMap[employee].low++;

      }

    });

    // ======================================
    // Convert Object → Array
    // ======================================

    const data = Object.values(employeeMap).sort(

      (a, b) => b.totalEmails - a.totalEmails

    );
        // ======================================
    // Dashboard Summary
    // ======================================

    const summary = {

      totalEmails: emails.length,

      completed: data.reduce(

        (sum, item) => sum + item.completed,

        0

      ),

      pending: data.reduce(

        (sum, item) => sum + item.pending,

        0

      ),

      notCompleted: data.reduce(

        (sum, item) => sum + item.notCompleted,

        0

      ),

      highPriority: data.reduce(

        (sum, item) => sum + item.high,

        0

      ),

      mediumPriority: data.reduce(

        (sum, item) => sum + item.medium,

        0

      ),

      lowPriority: data.reduce(

        (sum, item) => sum + item.low,

        0

      ),

    };

    // ======================================
    // Response
    // ======================================

    return res.status(200).json({

      success: true,

      summary,

      data,

    });

  }

  catch (error) {

    console.error("Category Error :", error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
// ======================================
// Export
// ======================================

module.exports = {

  getCategories,

};