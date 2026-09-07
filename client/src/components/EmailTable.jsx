import React, {
  useState,
  useEffect,
  useMemo,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaSearch,
  FaEye,
  FaTrash,
  FaArchive,
  FaRobot,
  FaEnvelope,
  FaEnvelopeOpen,
  FaSyncAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

import AiReplyModal from "./AiReplyModal";

import {
  markAsRead,
  markAsUnread,
  archiveEmail,
  deleteEmail,
  getAISummary,
  generateAIReply,
} from "../services/emailApi";

import {
  formatDate,
  formatTime,
} from "../utils/dateFormatter";

import "./EmailTable.css";

function EmailTable({
  emails = [],
  loading = false,
  refreshEmails,
}) {

  const navigate = useNavigate();

  // =====================================
  // Search
  // =====================================

  const [search, setSearch] = useState("");

  // =====================================
  // Filters
  // =====================================

  const [priorityFilter, setPriorityFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [companyFilter, setCompanyFilter] = useState("");

  // =====================================
  // Sorting
  // =====================================

  const [sortField, setSortField] =
    useState("receivedDateTime");

  const [sortOrder, setSortOrder] =
    useState("desc");

  // =====================================
  // Pagination
  // =====================================

  const rowsPerPage = 10;

  const [currentPage, setCurrentPage] =
    useState(1);

  // =====================================
  // Selection
  // =====================================

  const [selectedEmails, setSelectedEmails] =
    useState([]);

  const [selectAll, setSelectAll] =
    useState(false);

  // =====================================
  // AI Reply Modal
  // =====================================

  const [selectedEmail, setSelectedEmail] =
    useState(null);

  // =====================================
  // Refresh Time
  // =====================================

  const [lastRefresh, setLastRefresh] =
    useState(new Date());

  useEffect(() => {
    setLastRefresh(new Date());
  }, [emails]);

  // =====================================
  // Filter Emails
  // =====================================

  const filteredEmails = useMemo(() => {

    let data = [...emails];

    if (search.trim()) {

      const keyword = search.toLowerCase();

      data = data.filter((email) =>

        email.subject?.toLowerCase().includes(keyword) ||

        email.senderName?.toLowerCase().includes(keyword) ||

        email.senderEmail?.toLowerCase().includes(keyword) ||

        email.company?.toLowerCase().includes(keyword) ||

        email.technology?.toLowerCase().includes(keyword) ||

        email.category?.toLowerCase().includes(keyword)

      );

    }

    if (priorityFilter) {

      data = data.filter(
        (email) =>
          email.priority === priorityFilter
      );

    }

    if (statusFilter) {

      data = data.filter(
        (email) =>
          email.status === statusFilter
      );

    }

    if (companyFilter) {

      data = data.filter(
        (email) =>
          email.company === companyFilter
      );

    }

    return data;

  }, [

    emails,

    search,

    priorityFilter,

    statusFilter,

    companyFilter,

  ]);
    // =====================================
  // Sorting
  // =====================================

  const sortedEmails = useMemo(() => {

    const data = [...filteredEmails];

    data.sort((a, b) => {

      const first = a[sortField];
      const second = b[sortField];

      if (first < second)
        return sortOrder === "asc" ? -1 : 1;

      if (first > second)
        return sortOrder === "asc" ? 1 : -1;

      return 0;

    });

    return data;

  }, [
    filteredEmails,
    sortField,
    sortOrder,
  ]);

  // =====================================
  // Pagination
  // =====================================

  const totalPages = Math.ceil(
    sortedEmails.length / rowsPerPage
  );

  const indexOfLastRow =
    currentPage * rowsPerPage;

  const indexOfFirstRow =
    indexOfLastRow - rowsPerPage;

  const currentEmails =
    sortedEmails.slice(
      indexOfFirstRow,
      indexOfLastRow
    );

  // =====================================
  // Handle Sorting
  // =====================================

  const handleSort = (field) => {

    if (sortField === field) {

      setSortOrder(
        sortOrder === "asc"
          ? "desc"
          : "asc"
      );

    } else {

      setSortField(field);
      setSortOrder("asc");

    }

  };

  // =====================================
  // View Email
  // =====================================

  const handleView = (id) => {

    navigate(`/email/${id}`);

  };

  // =====================================
  // Mark Read
  // =====================================

  const handleMarkRead = async (id) => {

    try {

      await markAsRead(id);

      refreshEmails && refreshEmails();

    } catch (err) {

      console.error(err);

    }

  };

  // =====================================
  // Mark Unread
  // =====================================

  const handleMarkUnread = async (id) => {

    try {

      await markAsUnread(id);

      refreshEmails && refreshEmails();

    } catch (err) {

      console.error(err);

    }

  };

  // =====================================
  // Archive
  // =====================================

  const handleArchive = async (id) => {

    try {

      await archiveEmail(id);

      refreshEmails && refreshEmails();

    } catch (err) {

      console.error(err);

    }

  };

  // =====================================
  // Delete
  // =====================================

  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this email?"
    );

    if (!confirmDelete) return;

    try {

      await deleteEmail(id);

      refreshEmails && refreshEmails();

    } catch (err) {

      console.error(err);

    }

  };

  // =====================================
  // AI Summary
  // =====================================

  const handleSummary = async (id) => {

    try {

      const res = await getAISummary(id);

      alert(res.data.summary);

    } catch (err) {

      console.error(err);

    }

  };

  // =====================================
  // Generate AI Reply
  // =====================================

  const handleReply = async (id) => {

    try {

      const res = await generateAIReply(id);

      alert(res.data.reply);

      refreshEmails && refreshEmails();

    } catch (err) {

      console.error(err);

    }

  };

  // =====================================
  // Select Email
  // =====================================

  const handleSelectEmail = (id) => {

    if (selectedEmails.includes(id)) {

      setSelectedEmails(
        selectedEmails.filter(
          (item) => item !== id
        )
      );

    } else {

      setSelectedEmails([
        ...selectedEmails,
        id,
      ]);

    }

  };

  // =====================================
  // Select All
  // =====================================

  const handleSelectAll = () => {

    if (selectAll) {

      setSelectedEmails([]);

    } else {

      setSelectedEmails(
        currentEmails.map(
          (email) => email._id
        )
      );

    }

    setSelectAll(!selectAll);

  };

  // =====================================
  // AI Reply Modal
  // =====================================

  const openReplyModal = (email) => {

    setSelectedEmail(email);

  };

  const closeReplyModal = () => {

    setSelectedEmail(null);

  };
    // =====================================
  // RETURN
  // =====================================

  return (

    <div className="email-table-container">

      {/* ================= Header ================= */}

      <div className="email-table-header">

        <div>

          <h2>Inbox</h2>

          <p>AI Powered Outlook Management</p>

          <small>
            Last Sync : {formatTime(lastRefresh)}
          </small>

        </div>

        <button
          className="refresh-btn"
          onClick={refreshEmails}
        >
          <FaSyncAlt />
          Refresh
        </button>

      </div>

      {/* ================= Toolbar ================= */}

      <div className="email-toolbar">

        <div className="search-box">

          <FaSearch />

          <input
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />

        </div>

        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
          <option value="Normal">Normal</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>

      </div>

      {/* ================= Loading ================= */}

      {loading ? (

        <div className="loading-state">

          <div className="loader"></div>

          <h3>Loading Emails...</h3>

        </div>

      ) : currentEmails.length === 0 ? (

        <div className="empty-state">

          <h2>📭</h2>

          <h3>No Emails Found</h3>

          <p>
            Try syncing Outlook or changing filters.
          </p>

          <button
            className="refresh-btn"
            onClick={refreshEmails}
          >
            <FaSyncAlt />
            Sync Outlook
          </button>

        </div>

      ) : (

        <div className="table-wrapper">

          <table className="email-table">

            <thead>

              <tr>

                <th>

                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />

                </th>

                <th
                  onClick={() =>
                    handleSort("subject")
                  }
                >
                  Subject

                  {
                    sortField === "subject"

                      ? (
                          sortOrder === "asc"

                            ? <FaSortUp />

                            : <FaSortDown />
                        )

                      : <FaSort />
                  }

                </th>

                <th>Sender</th>

                <th>Company</th>

                <th>Priority</th>

                <th>Status</th>

                <th>Received</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>
                            {currentEmails.map((email) => {

                const initials = (
                  email.senderName || "Unknown"
                )
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                return (

                  <tr
                    key={email._id}
                    className={
                      !email.isRead
                        ? "unread-row"
                        : ""
                    }
                  >

                    {/* Checkbox */}

                    <td>

                      <input
                        type="checkbox"
                        checked={selectedEmails.includes(email._id)}
                        onChange={() =>
                          handleSelectEmail(email._id)
                        }
                      />

                    </td>

                    {/* Subject */}

                    <td>

                      <div className="subject-cell">

                        {!email.isRead && (
                          <span className="unread-dot"></span>
                        )}

                        <div>

                          <h4 className="subject">
                            {email.subject || "No Subject"}
                          </h4>

                          <p className="preview">
                            {email.bodyPreview
                              ? email.bodyPreview.substring(0, 90)
                              : "No Preview Available"}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* Sender */}

                    <td>

                      <div className="sender-info">

                        <div className="sender-avatar">
                          {initials}
                        </div>

                        <div>

                          <h4>
                            {email.senderName || "Unknown"}
                          </h4>

                          <small>
                            {email.senderEmail}
                          </small>

                        </div>

                      </div>

                    </td>

                    {/* Company */}

                    <td>

                      <span className="company-chip">
                        {email.company ||
                          email.companyName ||
                          "N/A"}
                      </span>

                    </td>

                    {/* Priority */}

                    <td>

                      <span
                        className={`priority-badge ${(
                          email.priority || "Normal"
                        ).toLowerCase()}`}
                      >
                        {email.priority || "Normal"}
                      </span>

                    </td>

                    {/* Status */}

                    <td>

                      <span
                        className={`status-badge ${(
                          email.status || "Pending"
                        )
                          .toLowerCase()
                          .replace(/\s/g, "-")}`}
                      >
                        {email.status || "Pending"}
                      </span>

                    </td>

                    {/* Date */}

                    <td>

                      <div className="received-date">

                        <strong>
                          {formatDate(email.receivedDateTime)}
                        </strong>

                        <small>
                          {formatTime(email.receivedDateTime)}
                        </small>

                      </div>

                    </td>

                    {/* Actions */}

                    <td>

                      <div className="action-buttons">

                        {/* View */}

                        <button
                          className="action-btn view"
                          title="View Email"
                          onClick={() =>
                            handleView(email._id)
                          }
                        >
                          <FaEye />
                        </button>

                        {/* Read / Unread */}

                        {email.isRead ? (

                          <button
                            className="action-btn"
                            title="Mark Unread"
                            onClick={() =>
                              handleMarkUnread(email._id)
                            }
                          >
                            <FaEnvelope />
                          </button>

                        ) : (

                          <button
                            className="action-btn"
                            title="Mark Read"
                            onClick={() =>
                              handleMarkRead(email._id)
                            }
                          >
                            <FaEnvelopeOpen />
                          </button>

                        )}

                        {/* Archive */}

                        <button
                          className="action-btn archive"
                          title="Archive Email"
                          onClick={() =>
                            handleArchive(email._id)
                          }
                        >
                          <FaArchive />
                        </button>

                        {/* AI Summary */}

                        <button
                          className="action-btn summary"
                          title="AI Summary"
                          onClick={() =>
                            handleSummary(email._id)
                          }
                        >
                          📄
                        </button>

                        {/* AI Reply */}

                        <button
                          className="action-btn reply"
                          title="Generate AI Reply"
                          onClick={() =>
                            openReplyModal(email)
                          }
                        >
                          <FaRobot />
                        </button>

                        {/* Delete */}

                        <button
                          className="action-btn delete"
                          title="Delete Email"
                          onClick={() =>
                            handleDelete(email._id)
                          }
                        >
                          <FaTrash />
                        </button>

                      </div>

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      )}
            {/* ================= Pagination ================= */}

      {totalPages > 1 && (

        <div className="pagination">

          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((prev) => prev - 1)
            }
          >
            Previous
          </button>

          <div className="page-info">

            <span>Page</span>

            <strong>{currentPage}</strong>

            <span>of</span>

            <strong>{totalPages}</strong>

          </div>

          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => prev + 1)
            }
          >
            Next
          </button>

        </div>

      )}

      {/* ================= Footer ================= */}

      <div className="email-table-footer">

        <div className="footer-left">

          Showing

          <strong>

            {" "}
            {sortedEmails.length === 0
              ? 0
              : indexOfFirstRow + 1}

            {" "}

            -

            {" "}

            {Math.min(
              indexOfLastRow,
              sortedEmails.length
            )}

            {" "}

          </strong>

          of

          <strong>

            {" "}

            {sortedEmails.length}

            {" "}

          </strong>

          emails

        </div>

        <div className="footer-right">

          Selected :

          <strong>

            {" "}

            {selectedEmails.length}

            {" "}

          </strong>

        </div>

      </div>

      {/* ================= AI Reply Modal ================= */}

      

     
  
    </div>

  );

}

export default EmailTable;
    