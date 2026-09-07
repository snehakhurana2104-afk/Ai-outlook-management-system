// ======================================
// analyticsApi.js
// ======================================

import axios from "axios";

// ======================================
// API Base URL
// ======================================

const API_URL = "http://localhost:5000/api/analytics";

// ======================================
// Get Dashboard Analytics
// ======================================

export const getAnalytics = async () => {

  try {

    const response = await axios.get(API_URL);

    return response.data;

  }

  catch (error) {

    console.error(
      "Analytics API Error:",
      error.message
    );

    return {

      success: false,

      data: {

        totalEmails: 0,

        completedTasks: 0,

        pendingTasks: 0,

        notCompletedTasks: 0,

        highPriority: 0,

        mediumPriority: 0,

        lowPriority: 0,

        training: 0,

        support: 0,

        sales: 0,

        companies: [],

        dailyEmails: [],

      },

    };

  }

};

// ======================================
// Refresh Dashboard Analytics
// ======================================

export const refreshAnalytics = async () => {

  return await getAnalytics();

};