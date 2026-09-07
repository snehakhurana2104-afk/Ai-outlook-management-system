import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  ExternalLink,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Video,
  X
} from "lucide-react";
import {
  getCalendar,
  createEvent,
  updateEvent,
  deleteEvent
} from "../api/outlookApi";
import "./Calendar.css";

const INDIA_TIME_ZONE = "Asia/Kolkata";
const GRAPH_TIME_ZONE = "India Standard Time";

const pad = (value) => String(value).padStart(2, "0");

const getLocalDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((item) => item.type === "year")?.value;
  const month = parts.find((item) => item.type === "month")?.value;
  const day = parts.find((item) => item.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

const formatDateInput = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return getLocalDateKey();
  }

  return getLocalDateKey(date);
};

const parseDateKey = (value) => {
  const [year, month, day] = String(value || "").split("-").map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day, 12, 0, 0);
};

const getDateParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return {
    year: Number(parts.find((item) => item.type === "year")?.value),
    month: Number(parts.find((item) => item.type === "month")?.value),
    day: Number(parts.find((item) => item.type === "day")?.value)
  };
};

const formatDisplayDate = (dateKey) => {
  const date = parseDateKey(dateKey);

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

const parseGraphDate = (value, sourceTimeZone) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();

  if (!raw) return null;

  const hasExplicitZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw);

  if (hasExplicitZone) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?$/
  );

  if (!match) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const second = Number(match[6] || 0);
  const millisecond = Number(
    (match[7] || "").slice(0, 3).padEnd(3, "0") || 0
  );

  const normalizedTimeZone = String(sourceTimeZone || "").toLowerCase();

  if (
    normalizedTimeZone.includes("utc") ||
    normalizedTimeZone === "gmt" ||
    normalizedTimeZone.includes("coordinated universal")
  ) {
    return new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        hour,
        minute,
        second,
        millisecond
      )
    );
  }

  if (
    normalizedTimeZone.includes("india") ||
    normalizedTimeZone.includes("kolkata") ||
    normalizedTimeZone.includes("calcutta")
  ) {
    return new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        hour - 5,
        minute - 30,
        second,
        millisecond
      )
    );
  }

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond
  );
};

const formatShortDate = (dateValue, sourceTimeZone) => {
  const date = parseGraphDate(dateValue, sourceTimeZone);

  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    day: "2-digit",
    month: "short"
  }).format(date);
};

const formatTime = (dateValue, sourceTimeZone) => {
  const date = parseGraphDate(dateValue, sourceTimeZone);

  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
};

const formatDateTimeForInput = (dateValue, sourceTimeZone) => {
  const date = parseGraphDate(dateValue, sourceTimeZone);

  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const get = (type) =>
    parts.find((item) => item.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}T${get(
    "hour"
  )}:${get("minute")}`;
};

const getEventId = (event) =>
  event?.id ||
  event?.eventId ||
  event?.["@odata.id"] ||
  "";

const getSubject = (event) =>
  String(
    event?.subject ||
      event?.title ||
      event?.name ||
      "Untitled event"
  );

const getOrganizerName = (event) =>
  String(
    event?.organizer?.emailAddress?.name ||
      event?.organizer?.name ||
      event?.organizerName ||
      event?.organizer?.displayName ||
      "Unknown organizer"
  );

const getOrganizerEmail = (event) =>
  String(
    event?.organizer?.emailAddress?.address ||
      event?.organizer?.email ||
      event?.organizerEmail ||
      ""
  );

const getLocation = (event) =>
  String(
    event?.location?.displayName ||
      event?.location?.address?.street ||
      event?.location ||
      "No location"
  );

const getStartObject = (event) => event?.start || {};
const getEndObject = (event) => event?.end || {};

const getStart = (event) =>
  getStartObject(event)?.dateTime ||
  event?.startDateTime ||
  event?.start ||
  null;

const getEnd = (event) =>
  getEndObject(event)?.dateTime ||
  event?.endDateTime ||
  event?.end ||
  null;

const getSourceTimeZone = (event) =>
  getStartObject(event)?.timeZone ||
  getEndObject(event)?.timeZone ||
  event?.timeZone ||
  GRAPH_TIME_ZONE;

const getAttendees = (event) => {
  if (!Array.isArray(event?.attendees)) return [];

  return event.attendees.map((attendee) => ({
    name:
      attendee?.emailAddress?.name ||
      attendee?.name ||
      attendee?.displayName ||
      attendee?.emailAddress?.address ||
      "Attendee",
    email:
      attendee?.emailAddress?.address ||
      attendee?.email ||
      "",
    status:
      attendee?.status?.response ||
      attendee?.responseStatus ||
      ""
  }));
};

const getTeamsUrl = (event) =>
  event?.onlineMeeting?.joinUrl ||
  event?.onlineMeetingUrl ||
  event?.teamsUrl ||
  "";

const getWebLink = (event) =>
  event?.webLink ||
  event?.webUrl ||
  "";

const getInitials = (name) => {
  const value = String(name || "").trim();

  if (!value) return "NA";

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getEventType = (event) => {
  const subject = getSubject(event).toLowerCase();

  if (
    subject.includes("training") ||
    subject.includes("academy") ||
    subject.includes("intune") ||
    subject.includes("prince 2") ||
    subject.includes("prince2")
  ) {
    return "Training";
  }

  if (
    subject.includes("call") ||
    subject.includes("sync") ||
    subject.includes("catch up") ||
    subject.includes("discussion")
  ) {
    return "Call";
  }

  if (
    event?.isOnlineMeeting ||
    event?.onlineMeeting?.joinUrl ||
    event?.onlineMeetingUrl
  ) {
    return "Meeting";
  }

  return "Meeting";
};

const getDurationMinutes = (event) => {
  const timeZone = getSourceTimeZone(event);
  const start = parseGraphDate(getStart(event), timeZone);
  const end = parseGraphDate(getEnd(event), timeZone);

  if (!start || !end) return 0;

  const minutes = Math.round(
    (end.getTime() - start.getTime()) / 60000
  );

  return minutes > 0 ? minutes : 0;
};

const formatDuration = (minutes) => {
  if (!minutes) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
};

const normalizeEvent = (event) => {
  if (!event) return null;

  const timeZone = getSourceTimeZone(event);

  return {
    ...event,
    id: getEventId(event),
    subject: getSubject(event),
    organizerName: getOrganizerName(event),
    organizerEmail: getOrganizerEmail(event),
    locationName: getLocation(event),
    startDateTime: getStart(event),
    endDateTime: getEnd(event),
    sourceTimeZone: timeZone,
    attendeesList: getAttendees(event),
    eventType: getEventType(event),
    teamsUrl: getTeamsUrl(event),
    webLink: getWebLink(event),
    durationMinutes: getDurationMinutes(event)
  };
};

const emptyForm = (dateKey) => ({
  subject: "",
  body: "",
  start: `${dateKey}T09:00`,
  end: `${dateKey}T10:00`,
  location: "",
  attendees: "",
  isOnlineMeeting: false
});

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getDateFromForm = (value) => {
  if (!value) return null;

  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if (!year || !month || !day) return null;

  return {
    year,
    month,
    day,
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0
  };
};

const buildEventPayload = (form) => {
  const start = getDateFromForm(form.start);
  const end = getDateFromForm(form.end);

  const attendees = String(form.attendees || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({
      emailAddress: {
        address: email
      },
      type: "required"
    }));

  const formatGraphDateTime = (date) => {
    if (!date) return null;

    return `${date.year}-${pad(date.month)}-${pad(date.day)}T${pad(
      date.hour
    )}:${pad(date.minute)}:00`;
  };

  return {
    subject: String(form.subject || "").trim(),
    body: {
      contentType: "HTML",
      content: escapeHtml(form.body || "").replace(/\n/g, "<br />")
    },
    start: {
      dateTime: formatGraphDateTime(start),
      timeZone: GRAPH_TIME_ZONE
    },
    end: {
      dateTime: formatGraphDateTime(end),
      timeZone: GRAPH_TIME_ZONE
    },
    location: {
      displayName: String(form.location || "").trim()
    },
    attendees,
    isOnlineMeeting: Boolean(form.isOnlineMeeting),
    onlineMeetingProvider: form.isOnlineMeeting
      ? "teamsForBusiness"
      : null
  };
};

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateKey()
  );

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(emptyForm(selectedDate));

  const loadCalendar = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccess("");

      const response = await getCalendar(selectedDate);

      const rawEvents =
        response?.events ||
        response?.value ||
        response?.data?.events ||
        response?.data?.value ||
        [];

      const normalized = Array.isArray(rawEvents)
        ? rawEvents.map(normalizeEvent).filter(Boolean)
        : [];

      normalized.sort((a, b) => {
        const aDate = parseGraphDate(
          a.startDateTime,
          a.sourceTimeZone
        );

        const bDate = parseGraphDate(
          b.startDateTime,
          b.sourceTimeZone
        );

        return (
          (aDate?.getTime() || 0) -
          (bDate?.getTime() || 0)
        );
      });

      setEvents(normalized);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load your Outlook calendar. Please reconnect Outlook and try again."
      );

      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCalendar(false);
  }, [selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadCalendar(true);
    }, 60000);

    return () => clearInterval(timer);
  }, [selectedDate]);

  const changeDate = (direction) => {
    const current = parseDateKey(selectedDate);

    current.setDate(current.getDate() + direction);

    setSelectedDate(formatDateInput(current));
    setSelectedEvent(null);
  };

  const goToday = () => {
    setSelectedDate(getLocalDateKey());
    setSelectedEvent(null);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setForm(emptyForm(selectedDate));
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);

    const sourceTimeZone =
      event.sourceTimeZone || GRAPH_TIME_ZONE;

    setForm({
      subject: event.subject || "",
      body: "",
      start:
        formatDateTimeForInput(
          event.startDateTime,
          sourceTimeZone
        ) || `${selectedDate}T09:00`,
      end:
        formatDateTimeForInput(
          event.endDateTime,
          sourceTimeZone
        ) || `${selectedDate}T10:00`,
      location:
        event.locationName === "No location"
          ? ""
          : event.locationName || "",
      attendees: (event.attendeesList || [])
        .map((item) => item.email)
        .filter(Boolean)
        .join(", "),
      isOnlineMeeting: Boolean(
        event.isOnlineMeeting ||
          event.onlineMeeting?.joinUrl ||
          event.onlineMeetingUrl
      )
    });

    setSelectedEvent(null);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.subject.trim()) {
      setError("Please enter an event subject.");
      return;
    }

    if (!form.start || !form.end) {
      setError("Please select both start and end time.");
      return;
    }

    const start = getDateFromForm(form.start);
    const end = getDateFromForm(form.end);

    if (!start || !end) {
      setError("Please enter a valid date and time.");
      return;
    }

    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;

    if (
      endMinutes <= startMinutes &&
      form.start.slice(0, 10) === form.end.slice(0, 10)
    ) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = buildEventPayload(form);

      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
        setSuccess("Event updated successfully.");
      } else {
        await createEvent(payload);
        setSuccess("Event created successfully.");
      }

      setModalOpen(false);
      setEditingEvent(null);

      await loadCalendar(true);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to save the event. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    const id = getEventId(event);

    if (!id) return;

    const confirmed = window.confirm(
      `Delete "${getSubject(event)}" from your Outlook calendar?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await deleteEvent(id);

      setSelectedEvent(null);
      setSuccess("Event deleted successfully.");

      await loadCalendar(true);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to delete the event. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesType =
        typeFilter === "all" ||
        event.eventType.toLowerCase() ===
          typeFilter.toLowerCase();

      if (!matchesType) return false;

      if (!query) return true;

      const searchable = [
        event.subject,
        event.organizerName,
        event.organizerEmail,
        event.locationName,
        event.eventType
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [events, search, typeFilter]);

  const stats = useMemo(() => {
    const total = events.length;

    const meetings = events.filter(
      (event) => event.eventType === "Meeting"
    ).length;

    const calls = events.filter(
      (event) => event.eventType === "Call"
    ).length;

    const totalMinutes = events.reduce(
      (sum, event) => sum + event.durationMinutes,
      0
    );

    return {
      total,
      meetings,
      calls,
      totalMinutes
    };
  }, [events]);

  const selectedEventData = selectedEvent
    ? events.find(
        (event) =>
          getEventId(event) === getEventId(selectedEvent)
      ) || normalizeEvent(selectedEvent)
    : null;

  return (
    <div className="calendar-page">
      <div className="calendar-toolbar">
        <div className="calendar-navigation">
          <button
            type="button"
            className="calendar-icon-button"
            onClick={() => changeDate(-1)}
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            className="calendar-icon-button"
            onClick={() => changeDate(1)}
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>

          <button
            type="button"
            className="calendar-today-button"
            onClick={goToday}
          >
            Today
          </button>

          <div className="calendar-date-field">
            <CalendarDays size={17} />

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSelectedEvent(null);
              }}
            />
          </div>
        </div>

        <div className="calendar-toolbar-right">
          <div className="calendar-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search events..."
            />
          </div>

          <select
            className="calendar-filter"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
          >
            <option value="all">All events</option>
            <option value="training">Training</option>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
          </select>

          <button
            type="button"
            className="calendar-sync-button"
            onClick={() => loadCalendar(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "calendar-spin" : ""
              }
            />
            Sync Outlook
          </button>

          <button
            type="button"
            className="calendar-add-button"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            New event
          </button>
        </div>
      </div>

      {error && (
        <div className="calendar-alert calendar-alert-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="calendar-alert calendar-alert-success">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Close success"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="calendar-stats-grid">
        <div className="calendar-stat-card">
          <div className="calendar-stat-icon">
            <CalendarDays size={19} />
          </div>

          <div>
            <span>Total events</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="calendar-stat-card">
          <div className="calendar-stat-icon">
            <Users size={19} />
          </div>

          <div>
            <span>Meetings</span>
            <strong>{stats.meetings}</strong>
          </div>
        </div>

        <div className="calendar-stat-card">
          <div className="calendar-stat-icon">
            <Video size={19} />
          </div>

          <div>
            <span>Calls</span>
            <strong>{stats.calls}</strong>
          </div>
        </div>

        <div className="calendar-stat-card">
          <div className="calendar-stat-icon">
            <Clock3 size={19} />
          </div>

          <div>
            <span>Calendar time</span>
            <strong>
              {formatDuration(stats.totalMinutes)}
            </strong>
          </div>
        </div>
      </div>

      <div className="calendar-content-card">
        <div className="calendar-content-header">
          <div>
            <h2>Executive schedule</h2>

            <p>
              {formatDisplayDate(selectedDate)} ·{" "}
              {filteredEvents.length} events shown
            </p>
          </div>

          <div className="calendar-header-date">
            {getDateParts(parseDateKey(selectedDate)).day}{" "}
            {new Intl.DateTimeFormat("en-IN", {
              month: "short"
            }).format(parseDateKey(selectedDate))}
          </div>
        </div>

        <div className="calendar-table-wrapper">
          <table className="calendar-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>ORGANIZER</th>
                <th>SUBJECT</th>
                <th>START TIME</th>
                <th>TYPE</th>
                <th>LOCATION</th>
                <th>END DATE</th>
                <th>END TIME</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">
                    <div className="calendar-loading">
                      <RefreshCw
                        size={20}
                        className="calendar-spin"
                      />

                      <span>
                        Loading Outlook calendar...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="calendar-empty">
                      <CalendarDays size={28} />

                      <strong>No events found</strong>

                      <span>
                        There are no Outlook events matching
                        this view.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr
                    key={
                      getEventId(event) ||
                      `${event.subject}-${event.startDateTime}`
                    }
                    onClick={() =>
                      setSelectedEvent(event)
                    }
                  >
                    <td>
                      <span className="calendar-date-cell">
                        {formatShortDate(
                          event.startDateTime,
                          event.sourceTimeZone
                        )}
                      </span>
                    </td>

                    <td>
                      <div className="calendar-organizer">
                        <div className="calendar-avatar">
                          {getInitials(
                            event.organizerName
                          )}
                        </div>

                        <div>
                          <strong>
                            {event.organizerName}
                          </strong>

                          <small>
                            {event.organizerEmail || "—"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="calendar-subject-button"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          setSelectedEvent(event);
                        }}
                      >
                        {event.subject}
                      </button>
                    </td>

                    <td>
                      <div className="calendar-time-cell">
                        <Clock3 size={15} />

                        <span>
                          {formatTime(
                            event.startDateTime,
                            event.sourceTimeZone
                          )}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`calendar-type-badge ${event.eventType
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {event.eventType}
                      </span>
                    </td>

                    <td>
                      <div className="calendar-location-cell">
                        <MapPin size={15} />

                        <span title={event.locationName}>
                          {event.locationName}
                        </span>
                      </div>
                    </td>

                    <td>
                      {formatShortDate(
                        event.endDateTime,
                        event.sourceTimeZone
                      )}
                    </td>

                    <td>
                      {formatTime(
                        event.endDateTime,
                        event.sourceTimeZone
                      )}
                    </td>

                    <td>
                      <div className="calendar-actions">
                        {event.webLink && (
                          <button
                            type="button"
                            className="calendar-action-button"
                            title="Open in Outlook"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();

                              window.open(
                                event.webLink,
                                "_blank",
                                "noopener,noreferrer"
                              );
                            }}
                          >
                            <ExternalLink size={15} />
                          </button>
                        )}

                        <button
                          type="button"
                          className="calendar-action-button"
                          title="Edit"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            openEditModal(event);
                          }}
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          type="button"
                          className="calendar-action-button danger"
                          title="Delete"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            handleDelete(event);
                          }}
                          disabled={deleting}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEventData && (
        <div
          className="calendar-drawer-overlay"
          onClick={() => setSelectedEvent(null)}
        >
          <aside
            className="calendar-drawer"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="calendar-drawer-header">
              <div>
                <span className="calendar-drawer-eyebrow">
                  {selectedEventData.eventType}
                </span>

                <h2>
                  {selectedEventData.subject}
                </h2>
              </div>

              <button
                type="button"
                className="calendar-close-button"
                onClick={() => setSelectedEvent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="calendar-drawer-body">
              <div className="calendar-detail-row">
                <CalendarDays size={18} />

                <div>
                  <span>Date</span>

                  <strong>
                    {formatDisplayDate(selectedDate)}
                  </strong>
                </div>
              </div>

              <div className="calendar-detail-row">
                <Clock3 size={18} />

                <div>
                  <span>India time</span>

                  <strong>
                    {formatTime(
                      selectedEventData.startDateTime,
                      selectedEventData.sourceTimeZone
                    )}{" "}
                    –{" "}
                    {formatTime(
                      selectedEventData.endDateTime,
                      selectedEventData.sourceTimeZone
                    )}
                  </strong>
                </div>
              </div>

              <div className="calendar-detail-row">
                <Users size={18} />

                <div>
                  <span>Organizer</span>

                  <strong>
                    {selectedEventData.organizerName}
                  </strong>

                  <small>
                    {selectedEventData.organizerEmail ||
                      "—"}
                  </small>
                </div>
              </div>

              <div className="calendar-detail-row">
                <MapPin size={18} />

                <div>
                  <span>Location</span>

                  <strong>
                    {selectedEventData.locationName}
                  </strong>
                </div>
              </div>

              {selectedEventData.attendeesList?.length >
                0 && (
                <div className="calendar-attendees-section">
                  <div className="calendar-section-label">
                    Attendees
                  </div>

                  <div className="calendar-attendees-list">
                    {selectedEventData.attendeesList.map(
                      (attendee, index) => (
                        <div
                          className="calendar-attendee"
                          key={`${attendee.email}-${index}`}
                        >
                          <div className="calendar-avatar small">
                            {getInitials(
                              attendee.name
                            )}
                          </div>

                          <div>
                            <strong>
                              {attendee.name}
                            </strong>

                            <span>
                              {attendee.email}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="calendar-drawer-footer">
              {selectedEventData.teamsUrl && (
                <button
                  type="button"
                  className="calendar-primary-link"
                  onClick={() =>
                    window.open(
                      selectedEventData.teamsUrl,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  <Video size={16} />
                  Join call
                </button>
              )}

              <button
                type="button"
                className="calendar-secondary-button"
                onClick={() =>
                  openEditModal(selectedEventData)
                }
              >
                <Edit3 size={16} />
                Edit
              </button>

              <button
                type="button"
                className="calendar-danger-button"
                onClick={() =>
                  handleDelete(selectedEventData)
                }
                disabled={deleting}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </aside>
        </div>
      )}

      {modalOpen && (
        <div
          className="calendar-modal-overlay"
          onClick={() =>
            !saving && setModalOpen(false)
          }
        >
          <div
            className="calendar-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="calendar-modal-header">
              <div>
                <span>
                  {editingEvent
                    ? "Update event"
                    : "Create event"}
                </span>

                <h2>
                  {editingEvent
                    ? "Edit Outlook event"
                    : "New Outlook event"}
                </h2>
              </div>

              <button
                type="button"
                className="calendar-close-button"
                onClick={() =>
                  !saving && setModalOpen(false)
                }
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="calendar-form"
              onSubmit={handleSave}
            >
              <label>
                <span>Subject</span>

                <input
                  type="text"
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subject: event.target.value
                    }))
                  }
                  placeholder="Enter event subject"
                />
              </label>

              <div className="calendar-form-grid">
                <label>
                  <span>Start</span>

                  <input
                    type="datetime-local"
                    value={form.start}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        start: event.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  <span>End</span>

                  <input
                    type="datetime-local"
                    value={form.end}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        end: event.target.value
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                <span>Location</span>

                <input
                  type="text"
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      location: event.target.value
                    }))
                  }
                  placeholder="Enter location"
                />
              </label>

              <label>
                <span>Attendees</span>

                <input
                  type="text"
                  value={form.attendees}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      attendees: event.target.value
                    }))
                  }
                  placeholder="email1@example.com, email2@example.com"
                />
              </label>

              <label>
                <span>Description</span>

                <textarea
                  rows="5"
                  value={form.body}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      body: event.target.value
                    }))
                  }
                  placeholder="Add event details..."
                />
              </label>

              <label className="calendar-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.isOnlineMeeting}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isOnlineMeeting:
                        event.target.checked
                    }))
                  }
                />

                <span>Create as online call</span>
              </label>

              <div className="calendar-modal-footer">
                <button
                  type="button"
                  className="calendar-secondary-button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="calendar-primary-link"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="calendar-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      {editingEvent
                        ? "Save changes"
                        : "Create event"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;