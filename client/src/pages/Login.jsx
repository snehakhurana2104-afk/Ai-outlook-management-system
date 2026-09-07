import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState("");

  const handleLogin = async () => {
    try {
      setLocalError("");

      const response = await login();

      if (response?.account) {
        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      console.error("[Login] Microsoft login failed:", err);

      setLocalError(
        err?.message || "Unable to connect Microsoft Outlook."
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-grid-pattern" />
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />
        <div className="login-orb login-orb-three" />
      </div>

      <main className="login-shell">
        <section className="login-showcase">
          <div className="showcase-top">
            <div className="showcase-brand">
              <div className="ms-logo-large">
                <span className="ms-red" />
                <span className="ms-green" />
                <span className="ms-blue" />
                <span className="ms-yellow" />
              </div>

              <div className="showcase-brand-text">
                <h1>AI Outlook</h1>
                <p>Email Intelligence Platform</p>
              </div>
            </div>

            <div className="brand-status">
              <span className="status-dot" />
              Microsoft 365 Ready
            </div>
          </div>

          <div className="showcase-content">
            <div className="showcase-eyebrow">
              <span />
              INTELLIGENT WORKSPACE
            </div>

            <div className="showcase-heading">
              <h2>
                Smarter email.
                <br />
                Better <span>productivity.</span>
              </h2>

              <p>
                Connect your Microsoft 365 account and bring your
                Outlook emails, calendar and productivity data into
                one intelligent workspace.
              </p>
            </div>

            <div className="outlook-visual">
              <div className="visual-shadow" />

              <div className="visual-ring visual-ring-one" />
              <div className="visual-ring visual-ring-two" />

              <div className="outlook-envelope">
                <div className="outlook-envelope-back" />

                <div className="outlook-card">
                  <div className="outlook-letter">O</div>

                  <div className="outlook-card-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className="outlook-envelope-front" />
              </div>

              <span className="visual-star star-one">✦</span>
              <span className="visual-star star-two">✦</span>
              <span className="visual-star star-three">✦</span>

              <div className="floating-data-card floating-card-one">
                <div className="floating-icon">✉</div>
                <div>
                  <strong>Outlook Mail</strong>
                  <span>Real-time sync</span>
                </div>
              </div>

              <div className="floating-data-card floating-card-two">
                <div className="floating-icon purple">✦</div>
                <div>
                  <strong>AI Insights</strong>
                  <span>Productivity intelligence</span>
                </div>
              </div>
            </div>

            <div className="showcase-features">
              <div className="showcase-feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Enterprise Grade</strong>
                  <span>Security</span>
                </div>
              </div>

              <div className="feature-separator" />

              <div className="showcase-feature">
                <div className="feature-icon">⚡</div>
                <div>
                  <strong>Real-time</strong>
                  <span>Sync</span>
                </div>
              </div>

              <div className="feature-separator" />

              <div className="showcase-feature">
                <div className="feature-icon">●●●</div>
                <div>
                  <strong>Privacy</strong>
                  <span>First</span>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <span>SSDN Technologies</span>
            <span className="footer-dot">•</span>
            <span>AI Outlook Intelligence</span>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-inner">
            <div className="login-panel-top">
              <div className="secure-badge">
                <span>✓</span>
                Secure Sign In
              </div>

              <div className="microsoft-mini-brand">
                <span className="mini-ms-logo">
                  <i className="ms-red" />
                  <i className="ms-green" />
                  <i className="ms-blue" />
                  <i className="ms-yellow" />
                </span>
                Microsoft 365
              </div>
            </div>

            <div className="login-heading">
              <span className="login-eyebrow">
                WELCOME BACK
              </span>

              <h2>Connect your Outlook</h2>

              <div className="heading-line" />

              <p>
                Sign in with your Microsoft 365 account to access
                your real Outlook emails, calendar and productivity
                data.
              </p>
            </div>

            {(error || localError) && (
              <div className="login-error">
                <div className="login-error-icon">!</div>

                <div className="login-error-content">
                  <strong>Authentication failed</strong>
                  <p>{localError || error}</p>
                </div>
              </div>
            )}

            <div className="login-action-area">
              <button
                type="button"
                className="microsoft-login-button"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner" />

                    <span className="button-text">
                      Connecting to Microsoft...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="button-ms-logo">
                      <span className="ms-red" />
                      <span className="ms-green" />
                      <span className="ms-blue" />
                      <span className="ms-yellow" />
                    </span>

                    <span className="button-text">
                      Connect Microsoft Outlook
                    </span>

                    <span className="button-arrow">→</span>
                  </>
                )}
              </button>

              <div className="login-or">
                <span />
                <strong>OR</strong>
                <span />
              </div>

              <div className="login-security">
                <div className="security-icon">
                  <span>🔒</span>
                </div>

                <div className="security-content">
                  <strong>
                    Secure Microsoft authentication
                  </strong>

                  <p>
                    Your password is never stored by this
                    application.
                  </p>
                </div>

                <div className="security-check">✓</div>
              </div>
            </div>

            <div className="login-services">
              <div className="login-service">
                <span className="service-icon">▦</span>
                <span>Microsoft 365</span>
              </div>

              <div className="service-divider" />

              <div className="login-service">
                <span className="service-outlook-icon">O</span>
                <span>Outlook</span>
              </div>

              <div className="service-divider" />

              <div className="login-service">
                <span className="graph-icon">△</span>
                <span>Microsoft Graph</span>
              </div>
            </div>
          </div>

          <div className="login-panel-footer">
            <div className="footer-shield">✓</div>

            <div>
              <strong>Trusted Microsoft 365 experience</strong>
              <span>
                Secure access to your productivity workspace
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}