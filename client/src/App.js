import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Compose from "./pages/Compose";

import ExecutiveOverview from "./pages/ExecutiveOverview";
import TeamsReport from "./pages/Teams Report";
import MemberWorkReport from "./pages/MemberWorkReport";
import FollowUpTracker from "./pages/FollowUpTracker";

import "./styles/responsive.css";

const ExecutiveBriefing = () => {
  return (
    <div className="executive-briefing-page">
      <div className="executive-briefing-container">
        <div className="executive-briefing-header">
          <div>
            <div className="executive-briefing-eyebrow">
              EXECUTIVE INTELLIGENCE
            </div>

            <h1>Executive Briefing</h1>

            <p>
              A concise view of your Outlook communication
              and executive priorities.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="executive-briefing-main-card">
          <span>TODAY'S BRIEFING</span>

          <h2>Your executive workspace is ready</h2>

          <p>
            Review communication, follow-ups, relationships
            and meetings from the Executive Intelligence workspace.
          </p>
        </div>

        <div className="executive-briefing-grid">
          <div className="executive-briefing-card">
            <span>COMMUNICATION</span>

            <h3>Outlook Activity</h3>

            <p>
              Review recent incoming and outgoing communication.
            </p>
          </div>

          <div className="executive-briefing-card">
            <span>TEAM</span>

            <h3>Teams Report</h3>

            <p>
              Understand people, relationships and team communication.
            </p>
          </div>

          <div className="executive-briefing-card">
            <span>FOLLOW-UPS</span>

            <h3>Follow-up Tracker</h3>

            <p>
              Keep visibility over important follow-ups and pending actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthLoadingScreen = ({
  title = "Loading AI Outlook...",
  subtitle = "Please wait",
}) => {
  return (
    <div className="app-loading-screen">
      <div className="app-loading-card">
        <div className="app-loading-logo">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="app-loading-spinner" />

        <strong>{title}</strong>

        <span>{subtitle}</span>
      </div>

      <style>
        {`
          .app-loading-screen {
            min-height: 100vh;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(
                circle at top left,
                rgba(37, 99, 235, 0.08),
                transparent 35%
              ),
              #f8fafc;
            font-family: "Times New Roman", Times, serif;
            color: #0f172a;
          }

          .app-loading-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 36px;
          }

          .app-loading-logo {
            width: 48px;
            height: 48px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 3px;
            margin-bottom: 8px;
          }

          .app-loading-logo span:nth-child(1) {
            background: #f25022;
          }

          .app-loading-logo span:nth-child(2) {
            background: #7fba00;
          }

          .app-loading-logo span:nth-child(3) {
            background: #00a4ef;
          }

          .app-loading-logo span:nth-child(4) {
            background: #ffb900;
          }

          .app-loading-logo span {
            border-radius: 2px;
          }

          .app-loading-spinner {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 3px solid #e2e8f0;
            border-top-color: #2563eb;
            animation: appSpin 0.8s linear infinite;
          }

          .app-loading-card strong {
            font-size: 15px;
            font-weight: 700;
          }

          .app-loading-card span:last-child {
            color: #64748b;
            font-size: 13px;
          }

          @keyframes appSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

const LoginRoute = () => {
  const {
    isAuthenticated,
    authReady,
    loading,
  } = useAuth();

  if (!authReady || loading) {
    return (
      <AuthLoadingScreen
        title="Checking Microsoft 365 session..."
        subtitle="Please wait"
      />
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Login />;
};

const RootRoute = () => {
  const {
    isAuthenticated,
    authReady,
    loading,
  } = useAuth();

  if (!authReady || loading) {
    return (
      <AuthLoadingScreen
        title="Loading AI Outlook..."
        subtitle="Preparing your Microsoft 365 workspace"
      />
    );
  }

  return (
    <Navigate
      to={isAuthenticated ? "/dashboard" : "/login"}
      replace
    />
  );
};

const ProtectedPage = ({ children }) => {
  return (
    <ProtectedRoute>
      <MainLayout>
        {children}
      </MainLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={<LoginRoute />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedPage>
                <Dashboard />
              </ProtectedPage>
            }
          />

          <Route
            path="/inbox"
            element={
              <ProtectedPage>
                <Inbox />
              </ProtectedPage>
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedPage>
                <Tasks />
              </ProtectedPage>
            }
          />

          <Route
            path="/calendar"
            element={
              <ProtectedPage>
                <Calendar />
              </ProtectedPage>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedPage>
                <Analytics />
              </ProtectedPage>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedPage>
                <Reports />
              </ProtectedPage>
            }
          />

          <Route
            path="/compose"
            element={
              <ProtectedPage>
                <Compose />
              </ProtectedPage>
            }
          />

          <Route
            path="/executive-intelligence"
            element={
              <ProtectedPage>
                <ExecutiveOverview />
              </ProtectedPage>
            }
          />

          <Route
            path="/executive-intelligence/people"
            element={
              <ProtectedPage>
                <TeamsReport />
              </ProtectedPage>
            }
          />

          <Route
            path="/executive-intelligence/teams-report"
            element={
              <ProtectedPage>
                <TeamsReport />
              </ProtectedPage>
            }
          />

          <Route
            path="/executive-intelligence/member/:memberName"
            element={
              <ProtectedPage>
                <MemberWorkReport />
              </ProtectedPage>
            }
          />

          <Route
            path="/executive-intelligence/commitments"
            element={
              <ProtectedPage>
                <FollowUpTracker />
              </ProtectedPage>
            }
          />

          <Route
            path="/executive-intelligence/follow-up-tracker"
            element={
              <ProtectedPage>
                <FollowUpTracker />
              </ProtectedPage>
            }
          />

          <Route
            path="/executive-intelligence/meeting-preparation"
            element={
              <ProtectedPage>
                <ExecutiveBriefing />
              </ProtectedPage>
            }
          />

          <Route
            path="/executive-intelligence/brief"
            element={
              <ProtectedPage>
                <ExecutiveBriefing />
              </ProtectedPage>
            }
          />

          <Route
            path="/"
            element={<RootRoute />}
          />

          <Route
            path="*"
            element={<RootRoute />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;