"use strict";

const express = require("express");

const router =
  express.Router();

const outlookController =
  require("../controllers/outlookController");


/* ============================================================
   EMAIL
============================================================ */

router.get(
  "/inbox",
  outlookController.getInbox
);

router.get(
  "/mail",
  outlookController.getAllMail
);

router.get(
  "/profile",
  outlookController.getProfile
);

router.get(
  "/messages/:messageId",
  outlookController.getMessageById
);

router.patch(
  "/:messageId/read",
  outlookController.markAsRead
);

router.patch(
  "/:messageId/unread",
  outlookController.markAsUnread
);

router.post(
  "/send",
  outlookController.sendMail
);

router.post(
  "/:messageId/reply",
  outlookController.reply
);

router.post(
  "/:messageId/reply-all",
  outlookController.replyAll
);

router.post(
  "/:messageId/forward",
  outlookController.forward
);

router.delete(
  "/:messageId",
  outlookController.deleteMessage
);

router.patch(
  "/:messageId/archive",
  outlookController.archive
);

router.get(
  "/search",
  outlookController.search
);

router.get(
  "/sync",
  outlookController.sync
);


/* ============================================================
   TASKS
============================================================ */

router.get(
  "/tasks",
  outlookController.getTasks
);

router.post(
  "/tasks",
  outlookController.createTask
);

router.patch(
  "/tasks/:taskId",
  outlookController.updateTask
);

router.delete(
  "/tasks/:taskId",
  outlookController.deleteTask
);


/* ============================================================
   CALENDAR
============================================================ */

/*
 GET
 /api/outlook/calendar
*/

router.get(
  "/calendar",
  outlookController.getCalendarEvents
);


/*
 GET SINGLE EVENT
 /api/outlook/calendar/:eventId
*/

router.get(
  "/calendar/:eventId",
  outlookController.getCalendarEventById
);


/*
 CREATE
 POST
 /api/outlook/calendar
*/

router.post(
  "/calendar",
  outlookController.createCalendarEvent
);


/*
 UPDATE
 PATCH
 /api/outlook/calendar/:eventId
*/

router.patch(
  "/calendar/:eventId",
  outlookController.updateCalendarEvent
);


/*
 DELETE
 DELETE
 /api/outlook/calendar/:eventId
*/

router.delete(
  "/calendar/:eventId",
  outlookController.deleteCalendarEvent
);


module.exports = router;