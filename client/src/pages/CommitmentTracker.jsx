import React, { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiList,
  FiRefreshCw,
  FiSearch,
  FiTarget,
  FiX
} from "react-icons/fi";

import * as outlookApi from "../api/outlookApi";

import "./CommitmentTracker.css";

function getArray(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.value)) {
    return data.value;
  }

  if (Array.isArray(data?.tasks)) {
    return data.tasks;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getTaskTitle(task) {
  return (
    task?.title ||
    task?.subject ||
    task?.name ||
    "Untitled commitment"
  );
}

function getTaskBody(task) {
  const body = task?.body ?? task?.content ?? "";

  if (typeof body === "string") {
    return body;
  }

  if (typeof body?.content === "string") {
    return body.content;
  }

  return "";
}

function getDueDate(task) {
  return (
    task?.dueDateTime?.dateTime ||
    task?.dueDateTime ||
    task?.dueDate ||
    task?.due_date ||
    task?.deadline ||
    null
  );
}

function getTaskId(task, index) {
  return (
    task?.id ||
    task?.taskId ||
    task?._id ||
    `commitment-${index}`
  );
}

function isCompleted(task) {
  const status = String(
    task?.status ||
      task?.taskStatus ||
      task?.state ||
      ""
  ).toLowerCase();

  return (
    status === "completed" ||
    status === "complete" ||
    task?.completed === true ||
    task?.isCompleted === true
  );
}

function getPriority(task) {
  const value = String(
    task?.importance ||
      task?.priority ||
      task?.priorityLevel ||
      ""
  ).toLowerCase();

  if (
    value === "high" ||
    value === "urgent" ||
    value === "1"
  ) {
    return "High";
  }

  if (
    value === "low" ||
    value === "3"
  ) {
    return "Low";
  }

  return "Normal";
}

function formatDate(value) {
  if (!value) {
    return "No due date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No due date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  });
}

function getDateKey(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getTodayKey() {
  return getDateKey(new Date());
}

function isOverdue(task) {
  if (isCompleted(task)) {
    return false;
  }

  const due = getDueDate(task);

  if (!due) {
    return false;
  }

  return getDateKey(due) < getTodayKey();
}

function isDueToday(task) {
  if (isCompleted(task)) {
    return false;
  }

  const due = getDueDate(task);

  if (!due) {
    return false;
  }

  return getDateKey(due) === getTodayKey();
}

function getStatus(task) {
  if (isCompleted(task)) {
    return {
      label: "Completed",
      className: "completed"
    };
  }

  if (isOverdue(task)) {
    return {
      label: "Overdue",
      className: "overdue"
    };
  }

  if (isDueToday(task)) {
    return {
      label: "Due today",
      className: "today"
    };
  }

  return {
    label: "Open",
    className: "open"
  };
}

function normalizeTask(task, index) {
  return {
    ...task,
    localId: getTaskId(task, index),
    title: getTaskTitle(task),
    bodyText: getTaskBody(task),
    dueDate: getDueDate(task),
    priority: getPriority(task),
    completed: isCompleted(task)
  };
}

async function getTasksFromApi() {
  const candidates = [
    "getOutlookTasks",
    "getTasks",
    "getMicrosoftTasks",
    "getTodoTasks",
    "getOutlookToDoTasks"
  ];

  for (const name of candidates) {
    if (typeof outlookApi[name] === "function") {
      return outlookApi[name]();
    }
  }

  throw new Error(
    "No Outlook Tasks API function was found in outlookApi.js."
  );
}

function CommitmentTracker() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedTask, setSelectedTask] = useState(null);

  async function loadTasks(refresh = false) {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getTasksFromApi();
      const data = getArray(response);

      setTasks(
        data.map((task, index) =>
          normalizeTask(task, index)
        )
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load commitments from Outlook."
      );
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;

    const completed = tasks.filter(
      (task) => task.completed
    ).length;

    const overdue = tasks.filter(
      (task) => isOverdue(task)
    ).length;

    const today = tasks.filter(
      (task) => isDueToday(task)
    ).length;

    const open = tasks.filter(
      (task) => !task.completed
    ).length;

    return {
      total,
      completed,
      overdue,
      today,
      open
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.bodyText.toLowerCase().includes(query);

      const status = getStatus(task);

      let matchesFilter = true;

      if (filter === "Open") {
        matchesFilter = status.label === "Open";
      }

      if (filter === "Due Today") {
        matchesFilter = status.label === "Due today";
      }

      if (filter === "Overdue") {
        matchesFilter = status.label === "Overdue";
      }

      if (filter === "Completed") {
        matchesFilter = status.label === "Completed";
      }

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  return (
    <div className="commitment-page">

      <header className="commitment-header">

        <div>
          <span className="commitment-eyebrow">
            EXECUTIVE INTELLIGENCE
          </span>

          <h1>Commitment & Follow-ups</h1>

          <p>
            Keep track of important commitments,
            deadlines and follow-up actions.
          </p>
        </div>

        <button
          className="commitment-refresh"
          onClick={() => loadTasks(true)}
          disabled={refreshing}
        >
          <FiRefreshCw
            className={
              refreshing ? "commitment-spin" : ""
            }
          />

          {refreshing ? "Refreshing" : "Refresh"}
        </button>

      </header>

      <section className="commitment-stats">

        <div className="commitment-stat-card">
          <div className="commitment-stat-icon blue">
            <FiList />
          </div>

          <div>
            <span>Total Commitments</span>
            <strong>{stats.total}</strong>
            <small>All Outlook commitments</small>
          </div>
        </div>

        <div className="commitment-stat-card">
          <div className="commitment-stat-icon amber">
            <FiClock />
          </div>

          <div>
            <span>Due Today</span>
            <strong>{stats.today}</strong>
            <small>Needs action today</small>
          </div>
        </div>

        <div className="commitment-stat-card">
          <div className="commitment-stat-icon red">
            <FiAlertCircle />
          </div>

          <div>
            <span>Overdue</span>
            <strong>{stats.overdue}</strong>
            <small>Follow-up required</small>
          </div>
        </div>

        <div className="commitment-stat-card">
          <div className="commitment-stat-icon green">
            <FiCheckCircle />
          </div>

          <div>
            <span>Completed</span>
            <strong>{stats.completed}</strong>
            <small>Successfully closed</small>
          </div>
        </div>

      </section>

      <section className="commitment-focus">

        <div className="focus-icon">
          <FiTarget />
        </div>

        <div className="focus-content">
          <span>FOLLOW-UP SIGNAL</span>

          <h2>
            {stats.open} open commitments need attention
          </h2>

          <p>
            Review due and overdue commitments to keep
            important work moving forward.
          </p>
        </div>

        <div className="focus-number">
          <strong>{stats.open}</strong>
          <span>open</span>
        </div>

      </section>

      <section className="commitment-panel">

        <div className="commitment-panel-header">

          <div>
            <span>COMMITMENT REGISTER</span>

            <h2>
              Your commitments & follow-ups
            </h2>
          </div>

          <strong>
            {filteredTasks.length} items
          </strong>

        </div>

        <div className="commitment-toolbar">

          <div className="commitment-search">
            <FiSearch />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search commitments..."
            />
          </div>

          <div className="commitment-filters">

            {[
              "All",
              "Open",
              "Due Today",
              "Overdue",
              "Completed"
            ].map((item) => (
              <button
                key={item}
                className={
                  filter === item ? "active" : ""
                }
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}

          </div>

        </div>

        {error && (
          <div className="commitment-error">
            <FiAlertCircle />

            <div>
              <strong>
                Unable to load commitments
              </strong>

              <span>{error}</span>
            </div>

            <button onClick={() => loadTasks()}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="commitment-loading">
            <div className="commitment-loader" />

            <strong>
              Loading Outlook commitments...
            </strong>

            <span>
              Connecting to your Microsoft To Do data
            </span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="commitment-empty">

            <div className="commitment-empty-icon">
              <FiCheckCircle />
            </div>

            <h3>
              No commitments found
            </h3>

            <p>
              There are no commitments matching
              your current filter.
            </p>

          </div>
        ) : (
          <div className="commitment-list">

            {filteredTasks.map((task) => {
              const status = getStatus(task);

              return (
                <button
                  key={task.localId}
                  className="commitment-row"
                  onClick={() =>
                    setSelectedTask(task)
                  }
                >

                  <div
                    className={`commitment-status-icon ${status.className}`}
                  >
                    {status.label === "Completed" ? (
                      <FiCheck />
                    ) : status.label === "Overdue" ? (
                      <FiAlertCircle />
                    ) : status.label === "Due today" ? (
                      <FiClock />
                    ) : (
                      <FiTarget />
                    )}
                  </div>

                  <div className="commitment-main">

                    <div className="commitment-title-line">

                      <strong>
                        {task.title}
                      </strong>

                      <span
                        className={`commitment-status ${status.className}`}
                      >
                        {status.label}
                      </span>

                    </div>

                    {task.bodyText && (
                      <p>
                        {task.bodyText.slice(0, 150)}
                      </p>
                    )}

                    <div className="commitment-meta">

                      <span>
                        <FiClock />
                        {task.dueDate
                          ? formatDate(task.dueDate)
                          : "No due date"}
                      </span>

                      <span
                        className={`priority ${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>

                    </div>

                  </div>

                  <FiChevronRight className="commitment-arrow" />

                </button>
              );
            })}

          </div>
        )}

      </section>

      {selectedTask && (
        <div
          className="commitment-modal-overlay"
          onClick={() => setSelectedTask(null)}
        >

          <div
            className="commitment-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="commitment-modal-close"
              onClick={() =>
                setSelectedTask(null)
              }
            >
              <FiX />
            </button>

            <div className="commitment-modal-icon">
              <FiTarget />
            </div>

            <span className="commitment-modal-eyebrow">
              COMMITMENT DETAILS
            </span>

            <h2>{selectedTask.title}</h2>

            <div className="commitment-modal-status">

              <span
                className={`commitment-status ${
                  getStatus(selectedTask).className
                }`}
              >
                {getStatus(selectedTask).label}
              </span>

              <span
                className={`priority ${selectedTask.priority.toLowerCase()}`}
              >
                {selectedTask.priority} Priority
              </span>

            </div>

            <div className="commitment-detail-grid">

              <div>
                <span>Due Date</span>
                <strong>
                  {selectedTask.dueDate
                    ? formatDate(
                        selectedTask.dueDate
                      )
                    : "No due date"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {getStatus(selectedTask).label}
                </strong>
              </div>

            </div>

            <div className="commitment-description">

              <span>DESCRIPTION</span>

              <p>
                {selectedTask.bodyText ||
                  "No additional description available."}
              </p>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default CommitmentTracker;