const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const Email = require("../models/Email");

// ======================================
// MongoDB Connection
// ======================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
    updateEmployees();
  })
  .catch((err) => {
    console.log("Mongo Error:", err);
  });

// ======================================
// Update Existing Emails
// ======================================

async function updateEmployees() {
  try {
    const emails = await Email.find();

    console.log("Total Emails:", emails.length);

    for (const email of emails) {
      let assignedTo = "Sunaina";

      const technology = (email.technology || "").toLowerCase();
      const category = (email.category || "").toLowerCase();
      const subject = (email.subject || "").toLowerCase();

      // ============================
      // Employee Assignment Rules
      // ============================

      if (
        technology.includes("azure") ||
        subject.includes("azure")
      ) {
        assignedTo = "Sunaina";
      } else if (
        technology.includes("aws") ||
        subject.includes("aws")
      ) {
        assignedTo = "Srishti Gambhir";
      } else if (
        technology.includes("java") ||
        technology.includes("spring") ||
        subject.includes("java")
      ) {
        assignedTo = "Kamal Kumar Khanna";
      } else if (
        category.includes("support")
      ) {
        assignedTo = "Syeda Asfiya";
      }

      // ============================
      // Status
      // ============================

      let status = "Pending";

      if (email.priority === "Low") {
        status = "Completed";
      } else if (email.priority === "Medium") {
        status = "Pending";
      } else {
        status = "Not Completed";
      }

      email.assignedTo = assignedTo;
      email.status = status;

      await email.save();
    }

    console.log("✅ All Emails Updated Successfully");

    mongoose.connection.close();
  } catch (err) {
    console.log(err);
    mongoose.connection.close();
  }
}