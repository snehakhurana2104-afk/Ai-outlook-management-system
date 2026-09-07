/* ============================================================
   GET CALENDAR EVENTS
   GET /outlook/calendar
============================================================ */

const getCalendarEvents = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const now = new Date();

    let startDateTime =
      req.query.startDateTime;

    let endDateTime =
      req.query.endDateTime;


    if (!startDateTime) {
      const start =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
          0,
          0,
          0
        );

      startDateTime =
        start.toISOString();
    }


    if (!endDateTime) {
      const end =
        new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );

      endDateTime =
        end.toISOString();
    }


    const result =
      await graphService.getCalendarEvents(
        token,
        {
          startDateTime,
          endDateTime,

          top:
            req.query.top || 100,
        }
      );


    const events =
      Array.isArray(
        result?.value
      )
        ? result.value
        : [];


    return res.status(200).json({
      success: true,

      connected: true,

      source:
        "Microsoft Graph",

      data: events,

      events,

      value: events,

      totalEvents:
        events.length,

      count:
        events.length,

      range: {
        startDateTime,
        endDateTime,
      },

      fetchedAt:
        new Date().toISOString(),
    });

  } catch (error) {

    console.error(
      "[OutlookController] getCalendarEvents:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to load Outlook Calendar."
    );
  }
};


/* ============================================================
   GET SINGLE EVENT
   GET /outlook/calendar/:eventId
============================================================ */

const getCalendarEventById =
  async (
    req,
    res
  ) => {
    try {
      const token =
        getToken(req);

      const {
        eventId,
      } = req.params;

      if (!eventId) {
        return res.status(400).json({
          success: false,
          message:
            "Event ID is required.",
          code:
            "EVENT_ID_REQUIRED",
        });
      }


      const event =
        await graphService.getCalendarEventById(
          token,
          eventId
        );


      return res.status(200).json({
        success: true,

        connected: true,

        source:
          "Microsoft Graph",

        data: event,

        event,
      });

    } catch (error) {

      console.error(
        "[OutlookController] getCalendarEventById:",
        error?.response?.data ||
          error
      );

      return sendGraphError(
        res,
        error,
        "Failed to load calendar event."
      );
    }
  };


/* ============================================================
   CREATE CALENDAR EVENT
   POST /outlook/calendar
============================================================ */

const createCalendarEvent =
  async (
    req,
    res
  ) => {
    try {
      const token =
        getToken(req);

      const {
        subject,
        body,
        startDateTime,
        endDateTime,
        start,
        end,
        timeZone,
        location,
        attendees,
        isAllDay,
      } = req.body || {};


      if (
        !subject ||
        !String(subject).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Event subject is required.",
          code:
            "EVENT_SUBJECT_REQUIRED",
        });
      }


      const finalStart =
        startDateTime ||
        start;

      const finalEnd =
        endDateTime ||
        end;


      if (
        !finalStart ||
        !finalEnd
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Event start and end are required.",
          code:
            "EVENT_DATES_REQUIRED",
        });
      }


      const event =
        await graphService.createCalendarEvent(
          token,
          {
            subject,
            body,

            startDateTime:
              finalStart,

            endDateTime:
              finalEnd,

            timeZone:
              timeZone ||
              "India Standard Time",

            location,

            attendees:
              Array.isArray(attendees)
                ? attendees
                : [],

            isAllDay:
              Boolean(isAllDay),
          }
        );


      return res.status(201).json({
        success: true,

        connected: true,

        source:
          "Microsoft Graph",

        message:
          "Calendar event created successfully.",

        data: event,

        event,

        timestamp:
          new Date().toISOString(),
      });

    } catch (error) {

      console.error(
        "[OutlookController] createCalendarEvent:",
        error?.response?.data ||
          error
      );

      return sendGraphError(
        res,
        error,
        "Failed to create Outlook Calendar event."
      );
    }
  };


/* ============================================================
   UPDATE CALENDAR EVENT
   PATCH /outlook/calendar/:eventId
============================================================ */

const updateCalendarEvent =
  async (
    req,
    res
  ) => {
    try {
      const token =
        getToken(req);

      const {
        eventId,
      } = req.params;


      if (!eventId) {
        return res.status(400).json({
          success: false,
          message:
            "Event ID is required.",
          code:
            "EVENT_ID_REQUIRED",
        });
      }


      const updatedEvent =
        await graphService.updateCalendarEvent(
          token,
          eventId,
          req.body || {}
        );


      return res.status(200).json({
        success: true,

        connected: true,

        source:
          "Microsoft Graph",

        message:
          "Calendar event updated successfully.",

        data:
          updatedEvent,

        event:
          updatedEvent,

        timestamp:
          new Date().toISOString(),
      });

    } catch (error) {

      console.error(
        "[OutlookController] updateCalendarEvent:",
        error?.response?.data ||
          error
      );

      return sendGraphError(
        res,
        error,
        "Failed to update Outlook Calendar event."
      );
    }
  };


/* ============================================================
   DELETE CALENDAR EVENT
   DELETE /outlook/calendar/:eventId
============================================================ */

const deleteCalendarEvent =
  async (
    req,
    res
  ) => {
    try {
      const token =
        getToken(req);

      const {
        eventId,
      } = req.params;


      if (!eventId) {
        return res.status(400).json({
          success: false,
          message:
            "Event ID is required.",
          code:
            "EVENT_ID_REQUIRED",
        });
      }


      await graphService.deleteCalendarEvent(
        token,
        eventId
      );


      return res.status(200).json({
        success: true,

        connected: true,

        source:
          "Microsoft Graph",

        message:
          "Calendar event deleted successfully.",

        eventId,

        timestamp:
          new Date().toISOString(),
      });

    } catch (error) {

      console.error(
        "[OutlookController] deleteCalendarEvent:",
        error?.response?.data ||
          error
      );

      return sendGraphError(
        res,
        error,
        "Failed to delete Outlook Calendar event."
      );
    }
  };