/******************************************************************************
 * aiReplyApi.js
 * Part 1
 * Imports + Base Configuration
 ******************************************************************************/

import axiosInstance from "./axiosInstance";

/* ==========================================================================
   Base Endpoint
========================================================================== */

const BASE_URL = "/ai/reply";

/* ==========================================================================
   API Endpoints
========================================================================== */

const ENDPOINTS = {

  /* --------------------------------------------------------
     AI Reply
  -------------------------------------------------------- */

  generate: `${BASE_URL}/generate`,

  regenerate: `${BASE_URL}/regenerate`,

  rewrite: `${BASE_URL}/rewrite`,

  grammar: `${BASE_URL}/grammar`,

  summarize: `${BASE_URL}/summarize`,

  send: `${BASE_URL}/send`,

  saveDraft: `${BASE_URL}/draft`,

  copy: `${BASE_URL}/copy`,

  /* --------------------------------------------------------
     Reply History
  -------------------------------------------------------- */

  history: (emailId) =>
    `${BASE_URL}/history/${emailId}`,

  deleteHistory: (historyId) =>
    `${BASE_URL}/history/${historyId}`,

};

/******************************************************************************
 * End Part 1
 ******************************************************************************/
/******************************************************************************
 * aiReplyApi.js
 * Part 2
 * Safe Request Wrapper + Generate APIs
 ******************************************************************************/

/* ==========================================================================
   Enterprise Safe Request Wrapper
========================================================================== */

const safeRequest = async (request) => {

  try {

    return await request();

  } catch (error) {

    console.error(
      "AI Reply API Error:",
      error
    );

    throw (
      error?.response?.data ||
      error?.message ||
      "Unexpected API Error"
    );

  }

};

/* ==========================================================================
   Generate AI Reply
========================================================================== */

export const generateReply = async (payload) => {

  return safeRequest(async () => {

    const { data } = await axiosInstance.post(

      ENDPOINTS.generate,

      payload

    );

    return data;

  });

};

/* ==========================================================================
   Regenerate AI Reply
========================================================================== */

export const regenerateReply = async (payload) => {

  return safeRequest(async () => {

    const { data } = await axiosInstance.post(

      ENDPOINTS.regenerate,

      payload

    );

    return data;

  });

};

/* ==========================================================================
   Rewrite Reply
========================================================================== */

export const rewriteReply = async (payload) => {

  return safeRequest(async () => {

    const { data } = await axiosInstance.post(

      ENDPOINTS.rewrite,

      payload

    );

    return data;

  });

};

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * aiReplyApi.js
 * Part 3
 * Enterprise AI APIs
 ******************************************************************************/

/* ==========================================================================
   Grammar Fix
========================================================================== */

export const grammarReply = async (payload) => {

  return safeRequest(async () => {

    const { data } = await axiosInstance.post(

      ENDPOINTS.grammar,

      payload

    );

    return data;

  });

};

/* ==========================================================================
   Summarize Reply
========================================================================== */

export const summarizeReply = async (payload) => {

  return safeRequest(async () => {

    const { data } = await axiosInstance.post(

      ENDPOINTS.summarize,

      payload

    );

    return data;

  });

};

/* ==========================================================================
   Send Reply
========================================================================== */

export const sendReply = async (payload) => {

  return safeRequest(async () => {

    const { data } = await axiosInstance.post(

      ENDPOINTS.send,

      payload

    );

    return data;

  });

};

/* ==========================================================================
   Save Draft
========================================================================== */

export const saveDraft = async (payload) => {

  return safeRequest(async () => {

    const { data } = await axiosInstance.post(

      ENDPOINTS.saveDraft,

      payload

    );

    return data;

  });

};

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * aiReplyApi.js
 * Part 4
 * Copy + Reply History + Export
 ******************************************************************************/

/* ==========================================================================
   Copy Reply
========================================================================== */

export const copyReply = async (payload) => {

  return safeRequest(async () => {

    const { data } = await axiosInstance.post(

      ENDPOINTS.copy,

      payload

    );

    return data;

  });

};

/* ==========================================================================
   Get Reply History
========================================================================== */

export const getReplyHistory = async (emailId) => {

  if (!emailId) {

    throw new Error("Email ID is required");

  }

  return safeRequest(async () => {

    const { data } = await axiosInstance.get(

      ENDPOINTS.history(emailId)

    );

    return data;

  });

};

/* ==========================================================================
   Delete Reply History
========================================================================== */

export const deleteReplyHistory = async (historyId) => {

  if (!historyId) {

    throw new Error("History ID is required");

  }

  return safeRequest(async () => {

    const { data } = await axiosInstance.delete(

      ENDPOINTS.deleteHistory(historyId)

    );

    return data;

  });

};

/* ==========================================================================
   Enterprise Service Export
========================================================================== */

const AIReplyAPI = {

  generateReply,

  regenerateReply,

  rewriteReply,

  grammarReply,

  summarizeReply,

  sendReply,

  saveDraft,

  copyReply,

  getReplyHistory,

  deleteReplyHistory,

};

export default AIReplyAPI;

/******************************************************************************
 * End aiReplyApi.js
 ******************************************************************************/