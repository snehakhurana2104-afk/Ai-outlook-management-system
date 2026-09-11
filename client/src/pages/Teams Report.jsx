import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Teams Report.css";

const DEPARTMENTS = [
  {
    id: "solution",
    name: "Solution Team",
    subtitle: "Solutions & Client Support",
    icon: "◈",
    teams: [
      {
        id: "solution",
        name: "Solution",
        subtitle: "Solutions & Client Support",
        icon: "◈",
        members: [
          {
            name: "Piyush",
            role: "Solution Executive",
            status: "Active",
          },
          {
            name: "Shubham",
            role: "Solution Executive",
            status: "Active",
          },
          {
            name: "Tushar",
            role: "Solution Executive",
            status: "Active",
          },
        ],
      },
    ],
  },

  {
    id: "achievers",
    name: "Achievers Team",
    subtitle: "Sales & Operations",
    icon: "★",
    teams: [
      {
        id: "sales",
        name: "Sales",
        subtitle: "Sales & Client Relations",
        icon: "↗",
        members: [
          {
            name: "Mukesh",
            role: "Sales Executive",
            status: "Active",
          },
          {
            name: "Sristi",
            role: "Sales Executive",
            status: "Active",
          },
          {
            name: "Kamal",
            role: "Business Development",
            status: "Active",
          },
          {
            name: "Amit",
            role: "Sales Executive",
            status: "Active",
          },
        ],
      },

      {
        id: "operations",
        name: "Operations",
        subtitle: "Operations & Delivery",
        icon: "◆",
        members: [
          {
            name: "Kanika",
            role: "Operations Executive",
            status: "Active",
          },
          {
            name: "Tisha",
            role: "Operations Executive",
            status: "Active",
          },
          {
            name: "Shivam",
            role: "Operations Executive",
            status: "Active",
          },
        ],
      },
    ],
  },

  {
    id: "hr",
    name: "HR Team",
    subtitle: "People & Human Resources",
    icon: "●",
  },

  {
    id: "dm",
    name: "DM Team",
    subtitle: "Digital Marketing",
    icon: "◇",
  },

  {
    id: "elite",
    name: "Elite Team",
    subtitle: "Strategy & Key Accounts",
    icon: "✦",
  },
];

const TeamsReport = () => {
  const navigate = useNavigate();

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const selectedDepartmentData = useMemo(() => {
    return DEPARTMENTS.find(
      (department) => department.id === selectedDepartment
    );
  }, [selectedDepartment]);

  const selectedTeamData = useMemo(() => {
    return selectedDepartmentData?.teams?.find(
      (team) => team.id === selectedTeam
    );
  }, [selectedDepartmentData, selectedTeam]);

  const totalOrganizationTeams = useMemo(() => {
    return DEPARTMENTS.reduce(
      (total, department) =>
        total + (department.teams?.length || 0),
      0
    );
  }, []);

  const totalOrganizationMembers = useMemo(() => {
    return DEPARTMENTS.reduce((total, department) => {
      if (!department.teams) {
        return total;
      }

      return (
        total +
        department.teams.reduce(
          (teamTotal, team) =>
            teamTotal + team.members.length,
          0
        )
      );
    }, 0);
  }, []);

  const departmentMemberCount = selectedDepartmentData?.teams
    ? selectedDepartmentData.teams.reduce(
        (total, team) =>
          total + team.members.length,
        0
      )
    : 0;

  const handleDepartmentSelect = (departmentId) => {
    setSelectedDepartment(departmentId);
    setSelectedTeam(null);
  };

  const handleTeamSelect = (teamId) => {
    setSelectedTeam((current) =>
      current === teamId ? null : teamId
    );
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
    setSelectedTeam(null);
  };

  const handleMemberClick = (member) => {
    const memberPath = encodeURIComponent(member.name);

    navigate(
      `/executive-intelligence/member/${memberPath}`
    );
  };

  return (
    <div className="teams-report-page">
      <div className="teams-report-container">

        {!selectedDepartmentData && (
          <section className="department-selection-screen">

            <div className="selection-header">

              

              <h1>
                Which department are you from?
              </h1>

              <p>
                Select your department to continue to your
                team and member information.
              </p>

            </div>

            <div className="selection-stats">

              <div className="selection-stat">
                <span>DEPARTMENTS</span>

                <strong>
                  {String(DEPARTMENTS.length).padStart(2, "0")}
                </strong>
              </div>

              <div className="selection-stat-divider" />

              <div className="selection-stat">
                <span>ACTIVE TEAMS</span>

                <strong>
                  {totalOrganizationTeams}
                </strong>
              </div>

              <div className="selection-stat-divider" />

              <div className="selection-stat">
                <span>MEMBERS</span>

                <strong>
                  {totalOrganizationMembers}
                </strong>
              </div>

            </div>

            <div className="department-selection-grid">

              {DEPARTMENTS.map((department) => (
                <button
                  key={department.id}
                  type="button"
                  className="department-selection-card"
                  onClick={() =>
                    handleDepartmentSelect(department.id)
                  }
                >

                  <div className="selection-card-top">

                    <div className="selection-department-icon">
                      {department.icon}
                    </div>

                    <span className="selection-arrow">
                      →
                    </span>

                  </div>

                  <div className="selection-card-content">

                    <span className="selection-card-label">
                      DEPARTMENT
                    </span>

                    <h2>
                      {department.name}
                    </h2>

                    <p>
                      {department.subtitle}
                    </p>

                  </div>

                  <div className="selection-card-bottom">

                    <span>
                      {department.teams
                        ? `${department.teams.length} Teams`
                        : "Department"}
                    </span>

                    <span>
                      Select →
                    </span>

                  </div>

                </button>
              ))}

            </div>

            <div className="department-selection-note">

              <span className="note-icon">
                +
              </span>

              <span>
                Choose your department to continue
              </span>

            </div>

          </section>
        )}

        {selectedDepartmentData && (
          <section className="department-workspace">

            <div className="workspace-header">

              <div className="workspace-header-left">

                <button
                  type="button"
                  className="back-department-button"
                  onClick={handleBackToDepartments}
                >
                  ← Departments
                </button>

                <div className="workspace-eyebrow">
                  SELECTED DEPARTMENT
                </div>

                <h1>
                  {selectedDepartmentData.name}
                </h1>

                <p>
                  {selectedDepartmentData.subtitle}
                </p>

              </div>

              <div className="workspace-summary">

                <div>
                  <span>TEAMS</span>

                  <strong>
                    {selectedDepartmentData.teams?.length || 0}
                  </strong>
                </div>

                <div>
                  <span>MEMBERS</span>

                  <strong>
                    {departmentMemberCount}
                  </strong>
                </div>

              </div>

            </div>

            {selectedDepartmentData.teams ? (
              <>

                <div className="workspace-section-heading">

                  <div>

                    <span>
                      SELECT TEAM
                    </span>

                    <h2>
                      Choose your team
                    </h2>

                  </div>

                  <p>
                    Select a team to view its members.
                  </p>

                </div>

                <div className="workspace-team-grid">

                  {selectedDepartmentData.teams.map((team) => {

                    const isSelected =
                      selectedTeam === team.id;

                    const activeMembers =
                      team.members.filter(
                        (member) =>
                          member.status === "Active"
                      ).length;

                    return (
                      <button
                        key={team.id}
                        type="button"
                        className={`workspace-team-card ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() =>
                          handleTeamSelect(team.id)
                        }
                      >

                        <div className="workspace-team-top">

                          <div className="workspace-team-icon">
                            {team.icon}
                          </div>

                          <span
                            className={`workspace-team-arrow ${
                              isSelected ? "open" : ""
                            }`}
                          >
                            →
                          </span>

                        </div>

                        <div className="workspace-team-content">

                          <span>
                            TEAM
                          </span>

                          <h3>
                            {team.name}
                          </h3>

                          <p>
                            {team.subtitle}
                          </p>

                        </div>

                        <div className="workspace-team-footer">

                          <span>
                            {team.members.length} Members
                          </span>

                          <span className="team-active">

                            <i />

                            {activeMembers} Active

                          </span>

                          <strong>
                            {isSelected
                              ? "Hide Members"
                              : "View Members"}
                          </strong>

                        </div>

                      </button>
                    );
                  })}

                </div>

                {selectedTeamData && (
                  <div className="team-members-workspace">

                    <div className="members-workspace-header">

                      <div>

                        <span>
                          {selectedTeamData.name.toUpperCase()}
                        </span>

                        <h2>
                          Team Members
                        </h2>

                        <p>
                          Select a member to open their
                          Executive Intelligence report.
                        </p>

                      </div>

                      <button
                        type="button"
                        className="close-team-button"
                        onClick={() =>
                          setSelectedTeam(null)
                        }
                        aria-label="Close team members"
                      >
                        ×
                      </button>

                    </div>

                    <div className="member-list">

                      {selectedTeamData.members.map(
                        (member, index) => (
                          <button
                            key={member.name}
                            type="button"
                            className="member-row"
                            onClick={() =>
                              handleMemberClick(member)
                            }
                          >

                            <div className="member-index">
                              {String(index + 1).padStart(
                                2,
                                "0"
                              )}
                            </div>

                            <div className="member-avatar">
                              {member.name.charAt(0)}
                            </div>

                            <div className="member-details">

                              <h3>
                                {member.name}
                              </h3>

                              <p>
                                {member.role}
                              </p>

                            </div>

                            <div className="member-status">

                              <span className="status-dot" />

                              {member.status}

                            </div>

                            <div className="member-action">
                              View Report →
                            </div>

                          </button>
                        )
                      )}

                    </div>

                  </div>
                )}

              </>
            ) : (

              <div className="department-empty-state">

                <div className="department-empty-icon">
                  {selectedDepartmentData.icon}
                </div>

                <span>
                  DEPARTMENT SELECTED
                </span>

                <h2>
                  {selectedDepartmentData.name}
                </h2>

                <p>
                  Team and member details for this department
                  can be added here.
                </p>

                <button
                  type="button"
                  onClick={handleBackToDepartments}
                >
                  ← Choose Another Department
                </button>

              </div>
            )}

          </section>
        )}

      </div>
    </div>
  );
};

export default TeamsReport;