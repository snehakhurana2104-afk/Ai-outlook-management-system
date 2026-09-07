import { useState, useEffect, useCallback } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskApi";

const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================
  // Load Tasks
  // ======================================

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getTasks();

      if (response.success) {
        setTasks(response.data || []);
      } else {
        setError(response.message || "Unable to load tasks");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================================
  // Create Task
  // ======================================

  const addTask = async (taskData) => {
    try {
      const response = await createTask(taskData);

      if (response.success) {
        await fetchTasks();
      }

      return response;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // ======================================
  // Update Task
  // ======================================

  const editTask = async (id, taskData) => {
    try {
      const response = await updateTask(id, taskData);

      if (response.success) {
        await fetchTasks();
      }

      return response;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // ======================================
  // Delete Task
  // ======================================

  const removeTask = async (id) => {
    try {
      const response = await deleteTask(id);

      if (response.success) {
        await fetchTasks();
      }

      return response;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // ======================================
  // Initial Load
  // ======================================

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,

    refreshTasks: fetchTasks,

    addTask,
    editTask,
    removeTask,
  };
};

export default useTasks;