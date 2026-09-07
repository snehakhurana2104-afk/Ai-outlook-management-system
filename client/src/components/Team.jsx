import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import "./Team.css";

import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Briefcase,
  X,
  Save,
  RefreshCw,
} from "lucide-react";

/* ============================================================
   API
============================================================ */

const API_URL =
  "http://localhost:5000/api/team";

/* ============================================================
   DEFAULT FORM
============================================================ */

const EMPTY_FORM = {
  name: "",
  role: "",
  department: "",
  email: "",
  phone: "",
  status: "Active",
  assignedTasks: 0,
};

/* ============================================================
   TEAM COMPONENT
============================================================ */

function Team() {
  /* ==========================================================
     STATES
  ========================================================== */

  const [members, setMembers] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showModal, setShowModal] =
    useState(false);

  const [editingMember, setEditingMember] =
    useState(null);

  const [formData, setFormData] =
    useState(EMPTY_FORM);

  /* ==========================================================
     LOAD TEAM
  ========================================================== */

  const loadTeam = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await axios.get(API_URL);

      const data =
        response?.data?.data ||
        response?.data?.members ||
        response?.data ||
        [];

      setMembers(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Team loading error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load team members."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadTeam();
  }, []);

  /* ==========================================================
     NORMALIZE MEMBER
  ========================================================== */

  const normalizeMember = (
    member
  ) => {
    return {
      ...member,

      id:
        member.id ||
        member._id,

      name:
        member.name ||
        member.fullName ||
        "",

      role:
        member.role ||
        member.designation ||
        "",

      department:
        member.department ||
        "",

      email:
        member.email ||
        "",

      phone:
        member.phone ||
        "",

      status:
        member.status ||
        "Active",

      assignedTasks:
        Number(
          member.assignedTasks ||
            member.taskCount ||
            0
        ),
    };
  };

  /* ==========================================================
     NORMALIZED MEMBERS
  ========================================================== */

  const normalizedMembers =
    useMemo(() => {
      return members.map(
        normalizeMember
      );
    }, [members]);

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const totalMembers =
    normalizedMembers.length;

  const activeMembers =
    normalizedMembers.filter(
      (member) =>
        String(
          member.status
        ).toLowerCase() ===
        "active"
    ).length;

  const inactiveMembers =
    normalizedMembers.filter(
      (member) =>
        String(
          member.status
        ).toLowerCase() ===
        "inactive"
    ).length;

  const totalTasks =
    normalizedMembers.reduce(
      (sum, member) =>
        sum +
        Number(
          member.assignedTasks || 0
        ),
      0
    );

  /* ==========================================================
     ROLES
  ========================================================== */

  const roles = useMemo(() => {
    const roleSet =
      new Set();

    normalizedMembers.forEach(
      (member) => {
        if (member.role) {
          roleSet.add(
            member.role
          );
        }
      }
    );

    return [
      "All",
      ...Array.from(
        roleSet
      ).sort(),
    ];
  }, [normalizedMembers]);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredMembers =
    useMemo(() => {
      const searchText =
        search
          .toLowerCase()
          .trim();

      return normalizedMembers.filter(
        (member) => {
          const name =
            String(
              member.name || ""
            ).toLowerCase();

          const email =
            String(
              member.email || ""
            ).toLowerCase();

          const role =
            String(
              member.role || ""
            ).toLowerCase();

          const department =
            String(
              member.department || ""
            ).toLowerCase();

          const searchMatch =
            !searchText ||
            name.includes(
              searchText
            ) ||
            email.includes(
              searchText
            ) ||
            role.includes(
              searchText
            ) ||
            department.includes(
              searchText
            );

          const roleMatch =
            roleFilter === "All" ||
            member.role ===
              roleFilter;

          const statusMatch =
            statusFilter === "All" ||
            member.status ===
              statusFilter;

          return (
            searchMatch &&
            roleMatch &&
            statusMatch
          );
        }
      );
    }, [
      normalizedMembers,
      search,
      roleFilter,
      statusFilter,
    ]);

  /* ==========================================================
     OPEN ADD MODAL
  ========================================================== */

  const openAddModal = () => {
    setEditingMember(null);

    setFormData({
      ...EMPTY_FORM,
    });

    setError("");

    setShowModal(true);
  };

  /* ==========================================================
     OPEN EDIT MODAL
  ========================================================== */

  const openEditModal = (
    member
  ) => {
    setEditingMember(member);

    setFormData({
      name:
        member.name || "",

      role:
        member.role || "",

      department:
        member.department ||
        "",

      email:
        member.email || "",

      phone:
        member.phone || "",

      status:
        member.status ||
        "Active",

      assignedTasks:
        Number(
          member.assignedTasks ||
            0
        ),
    });

    setError("");

    setShowModal(true);
  };

  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingMember(null);

    setFormData({
      ...EMPTY_FORM,
    });
  };

  /* ==========================================================
     FORM CHANGE
  ========================================================== */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]:
          name ===
          "assignedTasks"
            ? Number(value)
            : value,
      })
    );
  };

  /* ==========================================================
     SAVE MEMBER
  ========================================================== */

  const handleSave = async () => {
    if (
      !formData.name.trim() ||
      !formData.role.trim() ||
      !formData.email.trim()
    ) {
      setError(
        "Name, role and email are required."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name:
          formData.name.trim(),

        role:
          formData.role.trim(),

        department:
          formData.department.trim(),

        email:
          formData.email
            .trim()
            .toLowerCase(),

        phone:
          formData.phone.trim(),

        status:
          formData.status,

        assignedTasks:
          Number(
            formData.assignedTasks ||
              0
          ),
      };

      /* UPDATE */

      if (editingMember) {
        const memberId =
          editingMember.id ||
          editingMember._id;

        await axios.put(
          `${API_URL}/${memberId}`,
          payload
        );
      }

      /* CREATE */

      else {
        await axios.post(
          API_URL,
          payload
        );
      }

      await loadTeam();

      closeModal();
    } catch (err) {
      console.error(
        "Save team member error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to save team member."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     DELETE MEMBER
  ========================================================== */

  const handleDelete = async (
    member
  ) => {
    const memberId =
      member.id ||
      member._id;

    if (!memberId) {
      setError(
        "Team member ID is missing."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${member.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await axios.delete(
        `${API_URL}/${memberId}`
      );

      await loadTeam();
    } catch (err) {
      console.error(
        "Delete team member error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to delete team member."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="team-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="team-header">

        <div>
          <h1>
            👥 Team Management
          </h1>

          <p>
            Manage your employees
            and assigned tasks.
          </p>
        </div>

        <div className="team-header-actions">

          <button
            type="button"
            className="refresh-team-btn"
            onClick={loadTeam}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            className="add-member-btn"
            onClick={
              openAddModal
            }
          >
            <Plus size={18} />

            Add Member
          </button>

        </div>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="team-error">
          {error}

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="team-stats">

        <div className="team-card">

          <div className="team-card-icon blue">
            <Users size={28} />
          </div>

          <div>
            <h2>
              {totalMembers}
            </h2>

            <p>
              Total Members
            </p>
          </div>

        </div>

        <div className="team-card">

          <div className="team-card-icon green">
            <UserCheck size={28} />
          </div>

          <div>
            <h2>
              {activeMembers}
            </h2>

            <p>
              Active Members
            </p>
          </div>

        </div>

        <div className="team-card">

          <div className="team-card-icon red">
            <UserX size={28} />
          </div>

          <div>
            <h2>
              {inactiveMembers}
            </h2>

            <p>
              Inactive Members
            </p>
          </div>

        </div>

        <div className="team-card">

          <div className="team-card-icon orange">
            <Briefcase size={28} />
          </div>

          <div>
            <h2>
              {totalTasks}
            </h2>

            <p>
              Assigned Tasks
            </p>
          </div>

        </div>

      </div>

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="team-toolbar">

        <div className="team-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search member..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>

        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(
              event.target.value
            )
          }
        >
          {roles.map(
            (role) => (
              <option
                key={role}
                value={role}
              >
                {role ===
                "All"
                  ? "All Roles"
                  : role}
              </option>
            )
          )}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="All">
            All Status
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Inactive">
            Inactive
          </option>
        </select>

      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="team-table-container">

        <table className="team-table">

          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Tasks</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading &&
            filteredMembers.length ===
              0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="no-data"
                >
                  Loading team members...
                </td>
              </tr>
            ) : filteredMembers.length ===
              0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="no-data"
                >
                  No team members found.
                </td>
              </tr>
            ) : (
              filteredMembers.map(
                (member) => (
                  <tr
                    key={
                      member.id ||
                      member._id
                    }
                  >

                    <td>
                      <strong>
                        {member.name ||
                          "—"}
                      </strong>
                    </td>

                    <td>
                      {member.role ||
                        "—"}
                    </td>

                    <td>
                      {member.department ||
                        "—"}
                    </td>

                    <td>
                      {member.email ||
                        "—"}
                    </td>

                    <td>
                      {member.phone ||
                        "—"}
                    </td>

                    <td>
                      <span
                        className={
                          String(
                            member.status
                          ).toLowerCase() ===
                          "active"
                            ? "status active"
                            : "status inactive"
                        }
                      >
                        {member.status ||
                          "Inactive"}
                      </span>
                    </td>

                    <td>
                      {Number(
                        member.assignedTasks ||
                          0
                      )}
                    </td>

                    <td className="action-buttons">

                      <button
                        type="button"
                        className="edit-btn"
                        title="Edit"
                        onClick={() =>
                          openEditModal(
                            member
                          )
                        }
                      >
                        <Edit
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        title="Delete"
                        onClick={() =>
                          handleDelete(
                            member
                          )
                        }
                      >
                        <Trash2
                          size={16}
                        />
                      </button>

                    </td>

                  </tr>
                )
              )
            )}

          </tbody>

        </table>

      </div>

      {/* ======================================================
          MODAL
      ====================================================== */}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="team-modal">

            {/* MODAL HEADER */}

            <div className="modal-header">

              <h2>
                {editingMember
                  ? "Edit Team Member"
                  : "Add Team Member"}
              </h2>

              <button
                type="button"
                className="close-btn"
                onClick={
                  closeModal
                }
                disabled={saving}
              >
                <X size={20} />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="modal-body">

              <div className="form-grid">

                {/* NAME */}

                <div className="form-group">

                  <label>
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter full name"
                  />

                </div>

                {/* ROLE */}

                <div className="form-group">

                  <label>
                    Role *
                  </label>

                  <select
                    name="role"
                    value={
                      formData.role
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select Role
                    </option>

                    <option value="Frontend Developer">
                      Frontend Developer
                    </option>

                    <option value="Backend Developer">
                      Backend Developer
                    </option>

                    <option value="Full Stack Developer">
                      Full Stack Developer
                    </option>

                    <option value="Project Manager">
                      Project Manager
                    </option>

                    <option value="UI/UX Designer">
                      UI/UX Designer
                    </option>

                    <option value="QA Engineer">
                      QA Engineer
                    </option>

                    <option value="HR">
                      HR
                    </option>

                    <option value="Operations">
                      Operations
                    </option>

                    <option value="Sales">
                      Sales
                    </option>

                  </select>

                </div>

                {/* DEPARTMENT */}

                <div className="form-group">

                  <label>
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={
                      formData.department
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Development"
                  />

                </div>

                {/* EMAIL */}

                <div className="form-group">

                  <label>
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="abc@company.com"
                  />

                </div>

                {/* PHONE */}

                <div className="form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="+91 9876543210"
                  />

                </div>

                {/* STATUS */}

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

                {/* ASSIGNED TASKS */}

                <div className="form-group full-width">

                  <label>
                    Assigned Tasks
                  </label>

                  <input
                    type="number"
                    name="assignedTasks"
                    value={
                      formData.assignedTasks
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                  />

                </div>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="modal-footer">

              <button
                type="button"
                className="cancel-btn"
                onClick={
                  closeModal
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-btn"
                onClick={
                  handleSave
                }
                disabled={saving}
              >

                {saving ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />

                    {editingMember
                      ? "Update Member"
                      : "Save Member"}
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Team;