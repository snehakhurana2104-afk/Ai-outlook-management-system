import { useEffect } from "react";
import socket from "../services/socket";

export default function useDashboardSocket({
  onStatsUpdate,
  onTrendUpdate,
  onPriorityUpdate,
  onCompanyUpdate,
  onRecentEmails,
  onRecentTasks,
  onProductivityUpdate,
}) {
  useEffect(() => {
    socket.connect();

    socket.on("dashboard:stats", onStatsUpdate);

    socket.on("dashboard:trend", onTrendUpdate);

    socket.on("dashboard:priority", onPriorityUpdate);

    socket.on("dashboard:companies", onCompanyUpdate);

    socket.on("dashboard:recentEmails", onRecentEmails);

    socket.on("dashboard:recentTasks", onRecentTasks);

    socket.on("dashboard:productivity", onProductivityUpdate);

    return () => {
      socket.off("dashboard:stats", onStatsUpdate);

      socket.off("dashboard:trend", onTrendUpdate);

      socket.off("dashboard:priority", onPriorityUpdate);

      socket.off("dashboard:companies", onCompanyUpdate);

      socket.off("dashboard:recentEmails", onRecentEmails);

      socket.off("dashboard:recentTasks", onRecentTasks);

      socket.off("dashboard:productivity", onProductivityUpdate);

      socket.disconnect();
    };
  }, [
    onStatsUpdate,
    onTrendUpdate,
    onPriorityUpdate,
    onCompanyUpdate,
    onRecentEmails,
    onRecentTasks,
    onProductivityUpdate,
  ]);
}