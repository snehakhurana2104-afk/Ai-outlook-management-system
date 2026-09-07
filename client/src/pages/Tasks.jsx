import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  Flag,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Target,
  X,
  Zap
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Tasks.css";

const RAW_API_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:5000";

const API_ROOT = RAW_API_URL
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const apiUrl = (path) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_ROOT}/api${cleanPath}`;
};

const localDateKey = (value) => {
  if (!value) return "";

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const todayKey = () => localDateKey(new Date());

const unwrapCollection = (result) => {
  if (Array.isArray(result)) return result;

  return (
    result?.value ||
    result?.items ||
    result?.tasks ||
    result?.lists ||
    result?.data ||
    []
  );
};

const normalizeList = (list) => ({
  ...list,
  id: list?.id || list?.listId,
  displayName: String(
    list?.displayName ||
      list?.name ||
      "My Tasks"
  )
});

const normalizeTask = (task, listMap = {}) => {
  if (!task) return null;

  const rawBody = task.body ?? task.content ?? "";

  const body =
    typeof rawBody === "string"
      ? rawBody
      : typeof rawBody?.content === "string"
        ? rawBody.content
        : Array.isArray(rawBody?.content)
          ? rawBody.content
              .map((item) => {
                if (typeof item === "string") return item;
                if (typeof item?.content === "string") {
                  return item.content;
                }
                return "";
              })
              .join(" ")
          : "";

  const listId =
    task.listId ||
    task.todoListId ||
    task.parentListId ||
    task.list?.id ||
    "";

  const listName =
    task.listName ||
    task.todoListName ||
    task.list?.displayName ||
    listMap[listId] ||
    "";

  const status = String(
    task.status ||
      task.taskStatus ||
      (task.completedDateTime
        ? "completed"
        : "notStarted")
  ).toLowerCase();

  const completed =
    task.completed === true ||
    status === "completed" ||
    status === "complete" ||
    Boolean(task.completedDateTime);

  const dueDateTime =
    task.dueDateTime ||
    task.dueDate ||
    null;

  const createdDateTime =
    task.createdDateTime ||
    task.createdAt ||
    task.created ||
    null;

  const importance = String(
    task.importance ||
      task.priority ||
      "normal"
  ).toLowerCase();

  const categories = Array.isArray(task.categories)
    ? task.categories.filter(Boolean)
    : [];

  return {
    ...task,
    id: task.id || task.taskId,
    title: String(
      task.title ||
        task.subject ||
        task.name ||
        "Untitled task"
    ),
    body,
    status,
    completed,
    listId,
    listName,
    dueDateTime,
    createdDateTime,
    importance,
    priority: importance,
    categories,
    hasAttachments:
      task.hasAttachments === true ||
      (Array.isArray(task.attachments) &&
        task.attachments.length > 0)
  };
};

const isTodayTask = (task) => {
  const today = todayKey();

  return (
    localDateKey(task.dueDateTime) === today ||
    localDateKey(task.createdDateTime) === today ||
    localDateKey(task.completedDateTime) === today
  );
};

const formatDueDate = (value) => {
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No due date";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const isOverdue = (task) => {
  if (!task.dueDateTime || task.completed) return false;

  return localDateKey(task.dueDateTime) < todayKey();
};

function Tasks() {
  const { getToken, graphConnected } = useAuth();

  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedList, setSelectedList] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionTaskId, setActionTaskId] = useState(null);

  const [newTask, setNewTask] = useState({
    title: "",
    body: "",
    dueDate: "",
    importance: "normal",
    listId: ""
  });

  const request = async (path, options = {}) => {
    const token = await getToken();

    if (!token) {
      throw new Error(
        "Microsoft connection is required to manage tasks."
      );
    }

    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Unable to complete this task action."
      );
    }

    return data;
  };

  const loadData = async (refresh = false) => {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const listsResult = await request(
        "/outlook/task-lists"
      );

      const normalizedLists = unwrapCollection(
        listsResult
      )
        .map(normalizeList)
        .filter((item) => item.id);

      const listMap = normalizedLists.reduce(
        (acc, item) => {
          acc[item.id] = item.displayName;
          return acc;
        },
        {}
      );

      const tasksResult = await request(
        "/outlook/tasks?top=500"
      );

      const normalizedTasks = unwrapCollection(
        tasksResult
      )
        .map((task) =>
          normalizeTask(task, listMap)
        )
        .filter(Boolean)
        .filter(isTodayTask);

      setLists(normalizedLists);
      setTasks(normalizedTasks);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load your Outlook tasks."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (graphConnected === false) {
      setLoading(false);
      return;
    }

    loadData();
  }, [graphConnected]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.body.toLowerCase().includes(query);

      const matchesList =
        selectedList === "all" ||
        task.listId === selectedList;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !task.completed) ||
        (statusFilter === "completed" && task.completed);

      const matchesPriority =
        priorityFilter === "all" ||
        task.importance === priorityFilter;

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "active" && !task.completed) ||
        (activeTab === "completed" && task.completed) ||
        (activeTab === "flagged" &&
          task.importance === "high");

      return (
        matchesSearch &&
        matchesList &&
        matchesStatus &&
        matchesPriority &&
        matchesTab
      );
    });
  }, [
    tasks,
    search,
    selectedList,
    statusFilter,
    priorityFilter,
    activeTab
  ]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.completed
    ).length;
    const active = total - completed;
    const overdue = tasks.filter(isOverdue).length;
    const highPriority = tasks.filter(
      (task) => task.importance === "high"
    ).length;

    return {
      total,
      completed,
      active,
      overdue,
      highPriority
    };
  }, [tasks]);

  const createTask = async (event) => {
    event.preventDefault();

    if (!newTask.title.trim()) return;

    try {
      setSaving(true);
      setError("");

      await request("/outlook/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTask.title.trim(),
          body: {
            content: newTask.body || "",
            contentType: "text"
          },
          dueDateTime: newTask.dueDate
            ? {
                dateTime: `${newTask.dueDate}T23:59:00`,
                timeZone: "Asia/Kolkata"
              }
            : null,
          importance: newTask.importance,
          listId: newTask.listId || undefined
        })
      });

      setShowCreateModal(false);

      setNewTask({
        title: "",
        body: "",
        dueDate: "",
        importance: "normal",
        listId: ""
      });

      await loadData(true);
    } catch (err) {
      setError(
        err?.message || "Unable to create task."
      );
    } finally {
      setSaving(false);
    }
  };

  const completeTask = async (task) => {
    try {
      setActionTaskId(task.id);

      await request(
        `/outlook/tasks/${task.id}/complete`,
        {
          method: "POST"
        }
      );

      setSelectedTask(null);
      await loadData(true);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to complete this task."
      );
    } finally {
      setActionTaskId(null);
    }
  };

  const reopenTask = async (task) => {
    try {
      setActionTaskId(task.id);

      await request(`/outlook/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "notStarted"
        })
      });

      await loadData(true);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to reopen this task."
      );
    } finally {
      setActionTaskId(null);
    }
  };

  const saveEdit = async (event) => {
    event.preventDefault();

    if (!editingTask?.title?.trim()) return;

    try {
      setSaving(true);

      await request(
        `/outlook/tasks/${editingTask.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editingTask.title.trim(),
            body: {
              content: editingTask.body || "",
              contentType: "text"
            },
            importance:
              editingTask.importance || "normal"
          })
        }
      );

      setEditingTask(null);
      setSelectedTask(null);

      await loadData(true);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update this task."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <div>
          <div className="tasks-eyebrow">
            <Target size={15} />
            Work Management
          </div>

          <h1>Tasks</h1>
          <p>
            Focus on what needs to get done today.
          </p>
        </div>

        <div className="tasks-header-actions">
          <button
            className="tasks-refresh"
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 size={17} className="tasks-spin" />
            ) : (
              <RefreshCw size={17} />
            )}
            Refresh
          </button>

          <button
            className="tasks-create"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={17} />
            New Task
          </button>
        </div>
      </div>

      <div className="task-stats">
        <div className="task-stat">
          <div className="task-stat-icon">
            <ListChecks size={18} />
          </div>
          <div>
            <span>Total today</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="task-stat">
          <div className="task-stat-icon">
            <Zap size={18} />
          </div>
          <div>
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>
        </div>

        <div className="task-stat">
          <div className="task-stat-icon">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{stats.completed}</strong>
          </div>
        </div>

        <div className="task-stat warning">
          <div className="task-stat-icon">
            <Clock3 size={18} />
          </div>
          <div>
            <span>Overdue</span>
            <strong>{stats.overdue}</strong>
          </div>
        </div>
      </div>

      <div className="tasks-toolbar">
        <div className="tasks-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search tasks..."
          />
        </div>

        <div className="tasks-select-wrap">
          <select
            value={selectedList}
            onChange={(event) =>
              setSelectedList(event.target.value)
            }
          >
            <option value="all">All lists</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.displayName}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </div>

        <div className="tasks-select-wrap">
          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
          >
            <option value="all">All priority</option>
            <option value="high">High priority</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <ChevronDown size={15} />
        </div>
      </div>

      <div className="tasks-tabs">
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>

        <button
          className={activeTab === "active" ? "active" : ""}
          onClick={() => setActiveTab("active")}
        >
          Active
        </button>

        <button
          className={
            activeTab === "completed" ? "active" : ""
          }
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>

        <button
          className={
            activeTab === "flagged" ? "active" : ""
          }
          onClick={() => setActiveTab("flagged")}
        >
          High priority
        </button>
      </div>

      {error && (
        <div className="tasks-error">
          <span>{error}</span>
          <button onClick={() => loadData(true)}>
            Try again
          </button>
        </div>
      )}

      <div className="tasks-card">
        <div className="tasks-card-header">
          <div>
            <strong>Today</strong>
            <span>
              {filteredTasks.length} tasks
            </span>
          </div>

          <span className="today-label">
            {new Date().toLocaleDateString([], {
              weekday: "long",
              day: "numeric",
              month: "long"
            })}
          </span>
        </div>

        {loading ? (
          <div className="tasks-empty">
            <Loader2 size={28} className="tasks-spin" />
            <span>Loading your tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="tasks-empty">
            <CheckCircle2 size={38} />
            <strong>No tasks found</strong>
            <span>
              Your task list is clear for this view.
            </span>
          </div>
        ) : (
          <div className="task-list">
            {filteredTasks.map((task) => (
              <div
                className={`task-row ${
                  task.completed ? "completed" : ""
                }`}
                key={task.id}
              >
                <button
                  className="task-check"
                  onClick={() =>
                    task.completed
                      ? reopenTask(task)
                      : completeTask(task)
                  }
                  disabled={actionTaskId === task.id}
                >
                  {actionTaskId === task.id ? (
                    <Loader2
                      size={16}
                      className="tasks-spin"
                    />
                  ) : task.completed ? (
                    <Check size={16} />
                  ) : null}
                </button>

                <button
                  className="task-main"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="task-title-line">
                    <strong>{task.title}</strong>

                    {task.importance === "high" && (
                      <Flag size={14} />
                    )}
                  </div>

                  <span>
                    {task.body
                      ? task.body
                          .replace(/<[^>]*>/g, "")
                          .replace(/\s+/g, " ")
                          .slice(0, 110)
                      : "No description"}
                  </span>
                </button>

                <div className="task-due">
                  <CalendarDays size={14} />
                  {formatDueDate(task.dueDateTime)}
                </div>

                <button
                  className="task-edit"
                  onClick={() => setEditingTask(task)}
                >
                  <Edit3 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="task-overlay">
          <div className="task-modal">
            <div className="task-modal-header">
              <div>
                <span>Task details</span>
                <h2>{selectedTask.title}</h2>
              </div>

              <button
                onClick={() => setSelectedTask(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="task-detail-grid">
              <div>
                <span>Due date</span>
                <strong>
                  {formatDueDate(
                    selectedTask.dueDateTime
                  )}
                </strong>
              </div>

              <div>
                <span>Priority</span>
                <strong>
                  {selectedTask.importance}
                </strong>
              </div>

              <div>
                <span>List</span>
                <strong>
                  {selectedTask.listName || "My Tasks"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {selectedTask.completed
                    ? "Completed"
                    : "Active"}
                </strong>
              </div>
            </div>

            <div className="task-description">
              {selectedTask.body || "No description available."}
            </div>

            <div className="task-modal-footer">
              <button
                className="secondary-task-button"
                onClick={() => {
                  setEditingTask(selectedTask);
                  setSelectedTask(null);
                }}
              >
                <Edit3 size={16} />
                Edit
              </button>

              <button
                className="primary-task-button"
                onClick={() =>
                  selectedTask.completed
                    ? reopenTask(selectedTask)
                    : completeTask(selectedTask)
                }
              >
                {selectedTask.completed ? (
                  <>
                    <RefreshCw size={16} />
                    Reopen
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Complete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="task-overlay">
          <form
            className="task-modal create-modal"
            onSubmit={createTask}
          >
            <div className="task-modal-header">
              <div>
                <span>New task</span>
                <h2>Create a task</h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
              >
                <X size={18} />
              </button>
            </div>

            <label>
              Task title
              <input
                value={newTask.title}
                onChange={(event) =>
                  setNewTask({
                    ...newTask,
                    title: event.target.value
                  })
                }
                placeholder="What needs to be done?"
                autoFocus
              />
            </label>

            <label>
              Description
              <textarea
                value={newTask.body}
                onChange={(event) =>
                  setNewTask({
                    ...newTask,
                    body: event.target.value
                  })
                }
                placeholder="Add a short description..."
              />
            </label>

            <div className="create-fields">
              <label>
                Due date
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(event) =>
                    setNewTask({
                      ...newTask,
                      dueDate: event.target.value
                    })
                  }
                />
              </label>

              <label>
                Priority
                <select
                  value={newTask.importance}
                  onChange={(event) =>
                    setNewTask({
                      ...newTask,
                      importance: event.target.value
                    })
                  }
                >
                  <option value="normal">
                    Normal
                  </option>
                  <option value="high">
                    High
                  </option>
                  <option value="low">
                    Low
                  </option>
                </select>
              </label>
            </div>

            <label>
              Task list
              <select
                value={newTask.listId}
                onChange={(event) =>
                  setNewTask({
                    ...newTask,
                    listId: event.target.value
                  })
                }
              >
                <option value="">Default list</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.displayName}
                  </option>
                ))}
              </select>
            </label>

            <div className="task-modal-footer">
              <button
                type="button"
                className="secondary-task-button"
                onClick={() =>
                  setShowCreateModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-task-button"
                disabled={saving}
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="tasks-spin"
                  />
                ) : (
                  <Plus size={16} />
                )}
                Create task
              </button>
            </div>
          </form>
        </div>
      )}

      {editingTask && (
        <div className="task-overlay">
          <form
            className="task-modal create-modal"
            onSubmit={saveEdit}
          >
            <div className="task-modal-header">
              <div>
                <span>Task</span>
                <h2>Edit task</h2>
              </div>

              <button
                type="button"
                onClick={() => setEditingTask(null)}
              >
                <X size={18} />
              </button>
            </div>

            <label>
              Task title
              <input
                value={editingTask.title}
                onChange={(event) =>
                  setEditingTask({
                    ...editingTask,
                    title: event.target.value
                  })
                }
              />
            </label>

            <label>
              Description
              <textarea
                value={editingTask.body || ""}
                onChange={(event) =>
                  setEditingTask({
                    ...editingTask,
                    body: event.target.value
                  })
                }
              />
            </label>

            <label>
              Priority
              <select
                value={editingTask.importance || "normal"}
                onChange={(event) =>
                  setEditingTask({
                    ...editingTask,
                    importance: event.target.value
                  })
                }
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
            </label>

            <div className="task-modal-footer">
              <button
                type="button"
                className="secondary-task-button"
                onClick={() => setEditingTask(null)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-task-button"
                disabled={saving}
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="tasks-spin"
                  />
                ) : (
                  <Check size={16} />
                )}
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Tasks;