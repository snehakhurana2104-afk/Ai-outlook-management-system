import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axios from "axios";

import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  Bell,
  Brain,
  Database,
  Mail,
  Server,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  Globe,
  Clock3,
  Activity,
  HardDrive,
  FileJson,
  Eye,
  EyeOff,
  LayoutDashboard,
  Languages,
  Palette,
  KeyRound,
} from "lucide-react";

import {
  useSettings as useSettingsContext,
} from "../context/SettingsContext";

import "./Settings.css";

const API =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000/api";

const SETTINGS_ENDPOINT =
  `${API}/settings`;

const DEFAULT_REFRESH_INTERVAL =
  60000;

const TOAST_DURATION =
  4000;
/* =========================================================
   Utility Helpers
========================================================= */

const cloneSettings = (value) => {
  if (value === undefined || value === null) {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

const safeValue = (value, fallback = "") => {
  return value === undefined || value === null
    ? fallback
    : value;
};

/* =========================================================
   Settings Normalizer
========================================================= */

const normalizeSettings = (value = {}) => {
  const source =
    value && typeof value === "object"
      ? value
      : {};

  return {
    general: {
      applicationName: safeValue(
        source.general?.applicationName,
        "Microsoft 365 Management"
      ),

      organizationName: safeValue(
        source.general?.organizationName,
        ""
      ),

      language: safeValue(
        source.general?.language,
        "en"
      ),

      timezone: safeValue(
        source.general?.timezone,
        "Asia/Kolkata"
      ),

      dateFormat: safeValue(
        source.general?.dateFormat,
        "DD/MM/YYYY"
      ),

      refreshInterval: Number(
        safeValue(
          source.general?.refreshInterval,
          60
        )
      ),

      theme: safeValue(
        source.general?.theme,
        "System"
      ),

      landingPage: safeValue(
        source.general?.landingPage,
        "Dashboard"
      ),
    },

    appearance: {
      theme: safeValue(
        source.appearance?.theme,
        source.general?.theme || "System"
      ),

      compactMode: Boolean(
        source.appearance?.compactMode
      ),

      animations:
        source.appearance?.animations !== false,

      highContrast: Boolean(
        source.appearance?.highContrast
      ),
    },

    localization: {
      language: safeValue(
        source.localization?.language,
        source.general?.language || "en"
      ),

      timezone: safeValue(
        source.localization?.timezone,
        source.general?.timezone ||
          "Asia/Kolkata"
      ),

      dateFormat: safeValue(
        source.localization?.dateFormat,
        source.general?.dateFormat ||
          "DD/MM/YYYY"
      ),

      region: safeValue(
        source.localization?.region,
        "IN"
      ),
    },

    ai: {
      model: safeValue(
        source.ai?.model,
        ""
      ),

      summaryLength: safeValue(
        source.ai?.summaryLength,
        "Medium"
      ),

      confidence: Number(
        safeValue(
          source.ai?.confidence,
          0.7
        )
      ),

      autoCategory: Boolean(
        source.ai?.autoCategory
      ),

      priorityDetection: Boolean(
        source.ai?.priorityDetection
      ),

      replySuggestions: Boolean(
        source.ai?.replySuggestions
      ),

      summarization: Boolean(
        source.ai?.summarization
      ),

      taskGeneration: Boolean(
        source.ai?.taskGeneration
      ),

      followUp: Boolean(
        source.ai?.followUp
      ),
    },

    notifications: {
      emailAlerts: Boolean(
        source.notifications?.emailAlerts
      ),

      desktopNotifications: Boolean(
        source.notifications
          ?.desktopNotifications
      ),

      highPriorityAlerts: Boolean(
        source.notifications
          ?.highPriorityAlerts
      ),

      browserNotifications: Boolean(
        source.notifications
          ?.browserNotifications
      ),

      dailySummary: Boolean(
        source.notifications?.dailySummary
      ),

      weeklyReport: Boolean(
        source.notifications?.weeklyReport
      ),

      monthlyReport: Boolean(
        source.notifications?.monthlyReport
      ),

      dndMode: Boolean(
        source.notifications?.dndMode
      ),

      frequency: safeValue(
        source.notifications?.frequency,
        "Immediately"
      ),
    },

    security: {
      sessionTimeout: Number(
        safeValue(
          source.security?.sessionTimeout,
          30
        )
      ),

      twoFactor: Boolean(
        source.security?.twoFactor
      ),

      passwordPolicy: safeValue(
        source.security?.passwordPolicy,
        "Configured"
      ),

      apiSecret: safeValue(
        source.security?.apiSecret,
        ""
      ),

      activeSessions: Number(
        safeValue(
          source.security?.activeSessions,
          0
        )
      ),
    },

    dashboard: {
      defaultPeriod: safeValue(
        source.dashboard?.defaultPeriod,
        "Month"
      ),

      showKPIs:
        source.dashboard?.showKPIs !== false,

      showCharts:
        source.dashboard?.showCharts !== false,

      showRecentActivity:
        source.dashboard?.showRecentActivity !==
        false,

      autoRefresh:
        source.dashboard?.autoRefresh !== false,
    },

    outlook: {
      syncEnabled:
        source.outlook?.syncEnabled !== false,

      syncInterval: Number(
        safeValue(
          source.outlook?.syncInterval,
          60
        )
      ),

      includeAttachments:
        source.outlook?.includeAttachments !==
        false,

      syncCalendar: Boolean(
        source.outlook?.syncCalendar
      ),

      syncContacts: Boolean(
        source.outlook?.syncContacts
      ),

      syncDeleted: Boolean(
        source.outlook?.syncDeleted
      ),
    },
  };
};

/* =========================================================
   Reusable Toggle Component
========================================================= */

const ToggleCard = ({
  label,
  checked,
  onChange,
}) => {
  return (
    <div className="toggle-card">
      <span>{label}</span>

      <label className="switch">
        <input
          type="checkbox"
          checked={Boolean(checked)}
          onChange={(event) =>
            onChange(event.target.checked)
          }
        />

        <span className="slider" />
      </label>
    </div>
  );
};

/* =========================================================
   Settings Component
========================================================= */

export default function Settings() {
  const settingsContext = useSettingsContext();

  const contextSettings =
    settingsContext?.settings || null;

  const contextLoading = Boolean(
    settingsContext?.loading
  );

  const contextSaving = Boolean(
    settingsContext?.saving
  );

  const [settings, setSettings] =
    useState(null);

  const [savedSettings, setSavedSettings] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("general");

  const [health, setHealth] =
    useState(null);

  const [toast, setToast] =
    useState({
      show: false,
      type: "",
      message: "",
    });

  const [showApiSecret, setShowApiSecret] =
    useState(false);

  const toastTimerRef =
    useRef(null);

  const saveInProgressRef =
    useRef(false);

  const importInputRef =
    useRef(null);

  /* =======================================================
     Context Synchronization
  ======================================================= */

  useEffect(() => {
    if (
      contextSettings &&
      !settings
    ) {
      const normalized =
        normalizeSettings(
          cloneSettings(
            contextSettings
          )
        );

      setSettings(normalized);

      setSavedSettings(
        cloneSettings(normalized)
      );
    }
  }, [
    contextSettings,
    settings,
  ]);

  /* =======================================================
     Toast
  ======================================================= */

  const showToast = useCallback(
    (type, message) => {
      if (toastTimerRef.current) {
        clearTimeout(
          toastTimerRef.current
        );
      }

      setToast({
        show: true,
        type,
        message,
      });

      toastTimerRef.current =
        setTimeout(() => {
          setToast({
            show: false,
            type: "",
            message: "",
          });
        }, TOAST_DURATION);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(
          toastTimerRef.current
        );
      }
    };
  }, []);

  /* =======================================================
     Fetch Settings
  ======================================================= */

  const fetchSettings = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const response =
          await axios.get(
            SETTINGS_ENDPOINT,
            {
              timeout: 15000,
            }
          );

        const serverSettings =
          response?.data?.data ||
          response?.data?.settings ||
          response?.data;

        if (
          !serverSettings ||
          typeof serverSettings !==
            "object"
        ) {
          throw new Error(
            "Invalid settings response."
          );
        }

        const normalized =
          normalizeSettings(
            serverSettings
          );

        setSettings(
          cloneSettings(normalized)
        );

        setSavedSettings(
          cloneSettings(normalized)
        );

        return normalized;
      } catch (err) {
        console.error(
          "Settings Load Error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load system settings."
        );

        return null;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  /* =======================================================
     Fetch Health
  ======================================================= */

  const fetchHealth = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setRefreshing(true);
        }

        const response =
          await axios.get(
            `${SETTINGS_ENDPOINT}/health`,
            {
              timeout: 10000,
            }
          );

        const data =
          response?.data?.data ||
          response?.data ||
          {};

        setHealth(data);

        return data;
      } catch (err) {
        console.error(
          "Settings Health Error:",
          err
        );

        return null;
      } finally {
        if (!silent) {
          setRefreshing(false);
        }
      }
    },
    []
  );

  /* =======================================================
     Initial Load
  ======================================================= */

  useEffect(() => {
    fetchSettings();
    fetchHealth();
  }, [
    fetchSettings,
    fetchHealth,
  ]);

  /* =======================================================
     Health Auto Refresh
  ======================================================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        fetchHealth(true);
      }, DEFAULT_REFRESH_INTERVAL);

    return () =>
      clearInterval(interval);
  }, [fetchHealth]);

  /* =======================================================
     Change Detection
  ======================================================= */

  const hasChanges = useMemo(() => {
    if (
      !settings ||
      !savedSettings
    ) {
      return false;
    }

    try {
      return (
        JSON.stringify(settings) !==
        JSON.stringify(savedSettings)
      );
    } catch {
      return false;
    }
  }, [
    settings,
    savedSettings,
  ]);

  /* =======================================================
     Update Setting
  ======================================================= */

  const updateSetting = useCallback(
    (
      section,
      key,
      value
    ) => {
      setSettings(
        (previous) => {
          const current =
            previous || {};

          return {
            ...current,

            [section]: {
              ...(current[section] ||
                {}),
              [key]: value,
            },
          };
        }
      );
    },
    []
  );

  /* =======================================================
     Save Settings
  ======================================================= */

  const saveSettings = useCallback(
    async () => {
      if (
        !settings ||
        !hasChanges ||
        saveInProgressRef.current
      ) {
        return;
      }

      try {
        saveInProgressRef.current =
          true;

        setSaving(true);

        const sections = [
          "general",
          "appearance",
          "localization",
          "notifications",
          "ai",
          "dashboard",
          "outlook",
          "security",
        ];

        for (
          const section of sections
        ) {
          const current =
            settings?.[section];

          const saved =
            savedSettings?.[section];

          if (
            JSON.stringify(current) !==
            JSON.stringify(saved)
          ) {
            await axios.put(
              `${SETTINGS_ENDPOINT}/${section}`,
              current,
              {
                timeout: 20000,
              }
            );
          }
        }

        await fetchSettings(true);

        showToast(
          "success",
          "All settings saved successfully."
        );
      } catch (err) {
        console.error(
          "Settings Save Error:",
          err
        );

        showToast(
          "error",
          err?.response?.data?.message ||
            "Settings save failed."
        );
      } finally {
        setSaving(false);
        saveInProgressRef.current =
          false;
      }
    },
    [
      settings,
      savedSettings,
      hasChanges,
      fetchSettings,
      showToast,
    ]
  );

  /* =======================================================
     Reset Unsaved Changes
  ======================================================= */

  const resetChanges = useCallback(() => {
    if (!savedSettings) {
      return;
    }

    setSettings(
      cloneSettings(savedSettings)
    );

    showToast(
      "success",
      "Unsaved changes were reset."
    );
  }, [
    savedSettings,
    showToast,
  ]);

  /* =======================================================
     Reset Server Settings
  ======================================================= */

  const resetServerSettings =
    useCallback(async () => {
      const confirmed =
        window.confirm(
          "Are you sure you want to restore enterprise default settings?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);

        const response =
          await axios.post(
            `${SETTINGS_ENDPOINT}/reset`,
            {},
            {
              timeout: 20000,
            }
          );

        const data =
          response?.data?.data ||
          response?.data?.settings ||
          response?.data;

        const normalized =
          normalizeSettings(data);

        setSettings(
          cloneSettings(normalized)
        );

        setSavedSettings(
          cloneSettings(normalized)
        );

        showToast(
          "success",
          "Settings restored to enterprise defaults."
        );
      } catch (err) {
        console.error(
          "Settings Reset Error:",
          err
        );

        showToast(
          "error",
          err?.response?.data?.message ||
            "Unable to reset settings."
        );
      } finally {
        setSaving(false);
      }
    }, [showToast]);

  /* =======================================================
     Refresh
  ======================================================= */

  const refreshAll = useCallback(
    async () => {
      try {
        setRefreshing(true);

        await Promise.all([
          fetchSettings(true),
          fetchHealth(true),
        ]);

        showToast(
          "success",
          "Settings and system health refreshed."
        );
      } catch {
        showToast(
          "error",
          "Refresh failed."
        );
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [
      fetchSettings,
      fetchHealth,
      showToast,
    ]
  );

  /* =======================================================
     Export
  ======================================================= */

  const exportConfiguration =
    useCallback(() => {
      try {
        if (!settings) {
          return;
        }

        const exportData =
          cloneSettings(settings);

        if (exportData?.security) {
          delete exportData.security
            .apiSecret;
        }

        const payload =
          JSON.stringify(
            exportData,
            null,
            2
          );

        const blob =
          new Blob(
            [payload],
            {
              type:
                "application/json",
            }
          );

        const url =
          window.URL.createObjectURL(
            blob
          );

        const anchor =
          document.createElement(
            "a"
          );

        anchor.href = url;

        anchor.download =
          `settings-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json`;

        document.body.appendChild(
          anchor
        );

        anchor.click();

        anchor.remove();

        window.URL.revokeObjectURL(
          url
        );

        showToast(
          "success",
          "Configuration exported successfully."
        );
      } catch (err) {
        console.error(
          "Configuration Export Error:",
          err
        );

        showToast(
          "error",
          "Configuration export failed."
        );
      }
    }, [
      settings,
      showToast,
    ]);

  /* =======================================================
     Import
  ======================================================= */

  const importConfiguration =
    useCallback(
      async (event) => {
        const file =
          event?.target?.files?.[0];

        if (!file) {
          return;
        }

        try {
          if (
            file.size >
            5 * 1024 * 1024
          ) {
            throw new Error(
              "Configuration file is too large."
            );
          }

          const text =
            await file.text();

          let imported;

          try {
            imported =
              JSON.parse(text);
          } catch {
            throw new Error(
              "Invalid JSON configuration file."
            );
          }

          if (
            !imported ||
            typeof imported !==
              "object" ||
            Array.isArray(imported)
          ) {
            throw new Error(
              "Invalid settings configuration."
            );
          }

          const confirmed =
            window.confirm(
              "Import this configuration? Review it before saving."
            );

          if (!confirmed) {
            return;
          }

          const normalized =
            normalizeSettings(
              imported
            );

          setSettings(normalized);

          showToast(
            "success",
            "Configuration imported. Review and save the changes."
          );
        } catch (err) {
          console.error(
            "Configuration Import Error:",
            err
          );

          showToast(
            "error",
            err?.message ||
              "Configuration import failed."
          );
        } finally {
          if (event?.target) {
            event.target.value = "";
          }
        }
      },
      [showToast]
    );

  /* =======================================================
     Loading
  ======================================================= */

  if (
    loading ||
    contextLoading
  ) {
    return (
      <div className="settings-loading">
        <div className="settings-loading-header">
          <div className="loading-circle" />
          <div>
            <div className="loading-line large" />
            <div className="loading-line small" />
          </div>
        </div>

        <div className="settings-loading-tabs">
          {Array.from({
            length: 8,
          }).map((_, index) => (
            <div
              className="loading-tab"
              key={index}
            />
          ))}
        </div>

        <div className="settings-skeleton-grid">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              className="settings-skeleton"
              key={index}
            />
          ))}
        </div>
      </div>
    );
  }

  /* =======================================================
     Error
  ======================================================= */

  if (
    error &&
    !settings
  ) {
    return (
      <div className="settings-error">
        <div className="error-icon">
          <AlertTriangle size={48} />
        </div>

        <h2>
          Settings Unavailable
        </h2>

        <p>{error}</p>

        <button
          className="primary-btn"
          onClick={refreshAll}
        >
          <RefreshCw size={17} />
          Retry
        </button>
      </div>
    );
  }

  /* =======================================================
     Section References
  ======================================================= */

  const general =
    settings?.general || {};

  const appearance =
    settings?.appearance || {};

  const localization =
    settings?.localization || {};

  const ai =
    settings?.ai || {};

  const notifications =
    settings?.notifications || {};

  const security =
    settings?.security || {};

  const dashboard =
    settings?.dashboard || {};

  const outlook =
    settings?.outlook || {};

  const serverHealth =
    health?.system?.server ||
    health?.server ||
    "N/A";

  const databaseHealth =
    health?.system?.database ||
    health?.database ||
    "N/A";

  const outlookHealth =
    health?.outlook?.health ||
    health?.outlook?.status ||
    "N/A";

  const aiHealth =
    health?.ai?.status ||
    "N/A";

  /* =======================================================
     Tabs
  ======================================================= */

  const tabs = [
    [
      "general",
      SettingsIcon,
      "General",
    ],
    [
      "appearance",
      Palette,
      "Appearance",
    ],
    [
      "localization",
      Languages,
      "Localization",
    ],
    [
      "ai",
      Brain,
      "AI Intelligence",
    ],
    [
      "notifications",
      Bell,
      "Notifications",
    ],
    [
      "dashboard",
      LayoutDashboard,
      "Dashboard",
    ],
    [
      "security",
      ShieldCheck,
      "Security",
    ],
    [
      "outlook",
      Mail,
      "Outlook",
    ],
    [
      "system",
      Server,
      "System Health",
    ],
  ];

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="settings-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="settings-header">

        <div className="settings-title">

          <div className="settings-logo">
            <SettingsIcon size={30} />
          </div>

          <div>
            <div className="eyebrow">
              ADMINISTRATION
            </div>

            <h1>
              Enterprise Settings
            </h1>

            <p>
              Microsoft 365 Outlook Management
              Configuration
            </p>
          </div>

        </div>

        <div className="settings-actions">

          {hasChanges && (
            <span className="unsaved-badge">
              <span className="unsaved-dot" />
              Unsaved Changes
            </span>
          )}

          <button
            className="secondary-btn"
            onClick={refreshAll}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            className="secondary-btn"
            onClick={resetChanges}
            disabled={
              !hasChanges ||
              saving
            }
          >
            <RotateCcw size={17} />
            Reset
          </button>

          <button
            className="primary-btn"
            onClick={saveSettings}
            disabled={
              saving ||
              contextSaving ||
              !hasChanges
            }
          >
            <Save size={17} />

            {saving ||
            contextSaving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </header>

      {/* ===================================================
          WARNING
      =================================================== */}

      {error && (
        <div className="warning-box">
          <AlertTriangle size={19} />
          <p>{error}</p>
        </div>
      )}

      {/* ===================================================
          TABS
      =================================================== */}

      <nav className="settings-tabs">

        {tabs.map(
          ([
            key,
            Icon,
            label,
          ]) => (
            <button
              key={key}
              className={
                activeTab === key
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(key)
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          )
        )}

      </nav>

      {/* ===================================================
          GENERAL
      =================================================== */}

      {activeTab === "general" && (
        <section className="settings-card">

          <div className="card-heading">
            <div>
              <span className="section-kicker">
                APPLICATION
              </span>

              <h2>
                General Configuration
              </h2>

              <p>
                Manage application-wide
                preferences.
              </p>
            </div>

            <SettingsIcon
              className="heading-icon"
              size={28}
            />
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>
                Application Name
              </label>

              <input
                type="text"
                value={safeValue(
                  general.applicationName
                )}
                onChange={(event) =>
                  updateSetting(
                    "general",
                    "applicationName",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label>
                Organization Name
              </label>

              <input
                type="text"
                value={safeValue(
                  general.organizationName
                )}
                onChange={(event) =>
                  updateSetting(
                    "general",
                    "organizationName",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label>
                Default Landing Page
              </label>

              <select
                value={safeValue(
                  general.landingPage,
                  "Dashboard"
                )}
                onChange={(event) =>
                  updateSetting(
                    "general",
                    "landingPage",
                    event.target.value
                  )
                }
              >
                <option>
                  Dashboard
                </option>
                <option>
                  Analytics
                </option>
                <option>
                  Operations
                </option>
                <option>
                  Inbox
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <Clock3 size={15} />
                Auto Refresh Interval
              </label>

              <div className="input-with-unit">
                <input
                  type="number"
                  min="10"
                  max="3600"
                  value={safeValue(
                    general.refreshInterval,
                    60
                  )}
                  onChange={(event) =>
                    updateSetting(
                      "general",
                      "refreshInterval",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

                <span>sec</span>
              </div>
            </div>

          </div>

        </section>
      )}

      {/* ===================================================
          APPEARANCE
      =================================================== */}

      {activeTab === "appearance" && (
        <section className="settings-card">

          <div className="card-heading">
            <div>
              <span className="section-kicker">
                EXPERIENCE
              </span>

              <h2>
                Appearance Settings
              </h2>

              <p>
                Configure the enterprise
                application interface.
              </p>
            </div>

            <Palette
              className="heading-icon"
              size={28}
            />
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>
                Theme
              </label>

              <select
                value={safeValue(
                  appearance.theme,
                  "System"
                )}
                onChange={(event) =>
                  updateSetting(
                    "appearance",
                    "theme",
                    event.target.value
                  )
                }
              >
                <option>
                  System
                </option>

                <option>
                  Light
                </option>

                <option>
                  Dark
                </option>
              </select>
            </div>

          </div>

          <div className="toggle-grid">

            <ToggleCard
              label="Compact Mode"
              checked={
                appearance.compactMode
              }
              onChange={(value) =>
                updateSetting(
                  "appearance",
                  "compactMode",
                  value
                )
              }
            />

            <ToggleCard
              label="Animations"
              checked={
                appearance.animations
              }
              onChange={(value) =>
                updateSetting(
                  "appearance",
                  "animations",
                  value
                )
              }
            />

            <ToggleCard
              label="High Contrast"
              checked={
                appearance.highContrast
              }
              onChange={(value) =>
                updateSetting(
                  "appearance",
                  "highContrast",
                  value
                )
              }
            />

          </div>

        </section>
      )}

      {/* ===================================================
          LOCALIZATION
      =================================================== */}

      {activeTab === "localization" && (
        <section className="settings-card">

          <div className="card-heading">
            <div>
              <span className="section-kicker">
                REGIONAL
              </span>

              <h2>
                Localization Settings
              </h2>

              <p>
                Manage language, timezone
                and regional preferences.
              </p>
            </div>

            <Languages
              className="heading-icon"
              size={28}
            />
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>
                Default Language
              </label>

              <select
                value={safeValue(
                  localization.language,
                  "en"
                )}
                onChange={(event) =>
                  updateSetting(
                    "localization",
                    "language",
                    event.target.value
                  )
                }
              >
                <option value="en">
                  English
                </option>

                <option value="hi">
                  Hindi
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <Globe size={15} />
                Time Zone
              </label>

              <select
                value={safeValue(
                  localization.timezone,
                  "Asia/Kolkata"
                )}
                onChange={(event) =>
                  updateSetting(
                    "localization",
                    "timezone",
                    event.target.value
                  )
                }
              >
                <option value="UTC">
                  UTC
                </option>

                <option value="Asia/Kolkata">
                  Asia/Kolkata
                </option>

                <option value="America/New_York">
                  America/New_York
                </option>

                <option value="Europe/London">
                  Europe/London
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Date Format
              </label>

              <select
                value={safeValue(
                  localization.dateFormat,
                  "DD/MM/YYYY"
                )}
                onChange={(event) =>
                  updateSetting(
                    "localization",
                    "dateFormat",
                    event.target.value
                  )
                }
              >
                <option>
                  DD/MM/YYYY
                </option>

                <option>
                  MM/DD/YYYY
                </option>

                <option>
                  YYYY-MM-DD
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Region
              </label>

              <select
                value={safeValue(
                  localization.region,
                  "IN"
                )}
                onChange={(event) =>
                  updateSetting(
                    "localization",
                    "region",
                    event.target.value
                  )
                }
              >
                <option value="IN">
                  India
                </option>

                <option value="US">
                  United States
                </option>

                <option value="GB">
                  United Kingdom
                </option>
              </select>
            </div>

          </div>

        </section>
      )}

      {/* ===================================================
          AI
      =================================================== */}

      {activeTab === "ai" && (
        <section className="settings-card">

          <div className="card-heading">
            <div>
              <span className="section-kicker">
                INTELLIGENCE
              </span>

              <h2>
                AI Intelligence Engine
              </h2>

              <p>
                Configure AI-powered Outlook
                automation.
              </p>
            </div>

            <Brain
              className="heading-icon"
              size={28}
            />
          </div>

          <div className="ai-status-card">

            <div>
              <span className="status-label">
                AI ENGINE STATUS
              </span>

              <h3>
                {safeValue(
                  aiHealth,
                  "Unknown"
                )}
              </h3>

              <span
                className={
                  aiHealth === "Online" ||
                  aiHealth === "Healthy"
                    ? "status-green"
                    : "status-orange"
                }
              >
                {aiHealth === "Online" ||
                aiHealth === "Healthy"
                  ? "Operational"
                  : "Needs Attention"}
              </span>
            </div>

            <div className="ai-icon-box">
              <Brain size={32} />
            </div>

          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>
                AI Model
              </label>

              <select
                value={safeValue(
                  ai.model
                )}
                onChange={(event) =>
                  updateSetting(
                    "ai",
                    "model",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select Model
                </option>

                <option value="enterprise">
                  Enterprise AI
                </option>

                <option value="gpt">
                  GPT
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Summary Length
              </label>

              <select
                value={safeValue(
                  ai.summaryLength,
                  "Medium"
                )}
                onChange={(event) =>
                  updateSetting(
                    "ai",
                    "summaryLength",
                    event.target.value
                  )
                }
              >
                <option>
                  Short
                </option>

                <option>
                  Medium
                </option>

                <option>
                  Detailed
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Confidence Threshold
              </label>

              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={safeValue(
                  ai.confidence,
                  0.7
                )}
                onChange={(event) =>
                  updateSetting(
                    "ai",
                    "confidence",
                    Number(
                      event.target.value
                    )
                  )
                }
              />
            </div>

          </div>

          <div className="toggle-grid">

            <ToggleCard
              label="Auto Email Categorization"
              checked={
                ai.autoCategory
              }
              onChange={(value) =>
                updateSetting(
                  "ai",
                  "autoCategory",
                  value
                )
              }
            />

            <ToggleCard
              label="Auto Priority Detection"
              checked={
                ai.priorityDetection
              }
              onChange={(value) =>
                updateSetting(
                  "ai",
                  "priorityDetection",
                  value
                )
              }
            />

            <ToggleCard
              label="AI Reply Suggestions"
              checked={
                ai.replySuggestions
              }
              onChange={(value) =>
                updateSetting(
                  "ai",
                  "replySuggestions",
                  value
                )
              }
            />

            <ToggleCard
              label="Email Summarization"
              checked={
                ai.summarization
              }
              onChange={(value) =>
                updateSetting(
                  "ai",
                  "summarization",
                  value
                )
              }
            />

            <ToggleCard
              label="Smart Task Generation"
              checked={
                ai.taskGeneration
              }
              onChange={(value) =>
                updateSetting(
                  "ai",
                  "taskGeneration",
                  value
                )
              }
            />

            <ToggleCard
              label="Follow-up Detection"
              checked={
                ai.followUp
              }
              onChange={(value) =>
                updateSetting(
                  "ai",
                  "followUp",
                  value
                )
              }
            />

          </div>

        </section>
      )}

      {/* ===================================================
          NOTIFICATIONS
      =================================================== */}

      {activeTab === "notifications" && (
        <section className="settings-card">

          <div className="card-heading">
            <div>
              <span className="section-kicker">
                ALERTING
              </span>

              <h2>
                Notification Management
              </h2>

              <p>
                Configure enterprise alerts
                and reports.
              </p>
            </div>

            <Bell
              className="heading-icon"
              size={28}
            />
          </div>

          <div className="toggle-grid">

            <ToggleCard
              label="Email Alerts"
              checked={
                notifications.emailAlerts
              }
              onChange={(value) =>
                updateSetting(
                  "notifications",
                  "emailAlerts",
                  value
                )
              }
            />

            <ToggleCard
              label="Desktop Notifications"
              checked={
                notifications.desktopNotifications
              }
              onChange={(value) =>
                updateSetting(
                  "notifications",
                  "desktopNotifications",
                  value
                )
              }
            />

            <ToggleCard
              label="High Priority Alerts"
              checked={
                notifications.highPriorityAlerts
              }
              onChange={(value) =>
                updateSetting(
                  "notifications",
                  "highPriorityAlerts",
                  value
                )
              }
            />

            <ToggleCard
              label="Browser Notifications"
              checked={
                notifications.browserNotifications
              }
              onChange={(value) =>
                updateSetting(
                  "notifications",
                  "browserNotifications",
                  value
                )
              }
            />

            <ToggleCard
              label="Daily Summary"
              checked={
                notifications.dailySummary
              }
              onChange={(value) =>
                updateSetting(
                  "notifications",
                  "dailySummary",
                  value
                )
              }
            />

            <ToggleCard
              label="Weekly Executive Report"
              checked={
                notifications.weeklyReport
              }
              onChange={(value) =>
                updateSetting(
                  "notifications",
                  "weeklyReport",
                  value
                )
              }
            />

            <ToggleCard
              label="Monthly Analytics Report"
              checked={
                notifications.monthlyReport
              }
              onChange={(value) =>
                updateSetting(
                  "notifications",
                  "monthlyReport",
                  value
                )
              }
            />

            <ToggleCard
              label="Do Not Disturb Mode"
              checked={
                notifications.dndMode
              }
              onChange={(value) =>
                updateSetting(
                  "notifications",
                  "dndMode",
                  value
                )
              }
            />

          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>
                Notification Frequency
              </label>

              <select
                value={safeValue(
                  notifications.frequency,
                  "Immediately"
                )}
                onChange={(event) =>
                  updateSetting(
                    "notifications",
                    "frequency",
                    event.target.value
                  )
                }
              >
                <option>
                  Immediately
                </option>

                <option>
                  Hourly
                </option>

                <option>
                  Daily
                </option>

                <option>
                  Weekly
                </option>
              </select>
            </div>

          </div>

        </section>
      )}

      {/* ===================================================
          DASHBOARD
      =================================================== */}

      {activeTab === "dashboard" && (
        <section className="settings-card">

          <div className="card-heading">
            <div>
              <span className="section-kicker">
                WORKSPACE
              </span>

              <h2>
                Dashboard Settings
              </h2>

              <p>
                Configure dashboard visibility
                and behavior.
              </p>
            </div>

            <LayoutDashboard
              className="heading-icon"
              size={28}
            />
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>
                Default Period
              </label>

              <select
                value={safeValue(
                  dashboard.defaultPeriod,
                  "Month"
                )}
                onChange={(event) =>
                  updateSetting(
                    "dashboard",
                    "defaultPeriod",
                    event.target.value
                  )
                }
              >
                <option>
                  Today
                </option>

                <option>
                  Week
                </option>

                <option>
                  Month
                </option>

                <option>
                  Quarter
                </option>

                <option>
                  Year
                </option>
              </select>
            </div>

          </div>

          <div className="toggle-grid">

            <ToggleCard
              label="Show KPI Cards"
              checked={
                dashboard.showKPIs
              }
              onChange={(value) =>
                updateSetting(
                  "dashboard",
                  "showKPIs",
                  value
                )
              }
            />

            <ToggleCard
              label="Show Analytics Charts"
              checked={
                dashboard.showCharts
              }
              onChange={(value) =>
                updateSetting(
                  "dashboard",
                  "showCharts",
                  value
                )
              }
            />

            <ToggleCard
              label="Show Recent Activity"
              checked={
                dashboard.showRecentActivity
              }
              onChange={(value) =>
                updateSetting(
                  "dashboard",
                  "showRecentActivity",
                  value
                )
              }
            />

            <ToggleCard
              label="Dashboard Auto Refresh"
              checked={
                dashboard.autoRefresh
              }
              onChange={(value) =>
                updateSetting(
                  "dashboard",
                  "autoRefresh",
                  value
                )
              }
            />

          </div>

        </section>
      )}

      {/* ===================================================
          SECURITY
      =================================================== */}

      {activeTab === "security" && (
        <section className="settings-card">

          <div className="card-heading">
            <div>
              <span className="section-kicker">
                PROTECTION
              </span>

              <h2>
                Security & Authentication
              </h2>

              <p>
                Enterprise identity and access
                management.
              </p>
            </div>

            <ShieldCheck
              className="heading-icon"
              size={28}
            />
          </div>

          <div className="security-grid">

            <div className="security-item">
              <div className="security-item-icon">
                <Lock size={22} />
              </div>

              <div>
                <h4>
                  Session Timeout
                </h4>

                <p>
                  {safeValue(
                    security.sessionTimeout,
                    "N/A"
                  )}{" "}
                  minutes
                </p>
              </div>
            </div>

            <div className="security-item">
              <div className="security-item-icon">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h4>
                  Two Factor Authentication
                </h4>

                <p
                  className={
                    security.twoFactor
                      ? "success-text"
                      : "danger-text"
                  }
                >
                  {security.twoFactor
                    ? "Enabled"
                    : "Disabled"}
                </p>
              </div>
            </div>

            <div className="security-item">
              <div className="security-item-icon">
                <KeyRound size={22} />
              </div>

              <div>
                <h4>
                  Password Policy
                </h4>

                <p>
                  {safeValue(
                    security.passwordPolicy,
                    "Configured"
                  )}
                </p>
              </div>
            </div>

            <div className="security-item">

              <div className="security-item-icon">
                <Database size={22} />
              </div>

              <div className="secret-content">
                <h4>
                  API Secret Key
                </h4>

                <p>
                  {showApiSecret
                    ? safeValue(
                        security.apiSecret,
                        "Not configured"
                      )
                    : "••••••••••••••"}
                </p>
              </div>

              <button
                className="icon-btn"
                onClick={() =>
                  setShowApiSecret(
                    (value) => !value
                  )
                }
                type="button"
                aria-label={
                  showApiSecret
                    ? "Hide API secret"
                    : "Show API secret"
                }
              >
                {showApiSecret ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>

          <div className="security-details">

            <div>
              <h4>
                Microsoft OAuth Status
              </h4>

              <span
                className={
                  health?.outlook?.connected
                    ? "status-green"
                    : "status-red"
                }
              >
                {health?.outlook?.connected
                  ? "Connected"
                  : "Disconnected"}
              </span>
            </div>

            <div>
              <h4>
                Active Login Sessions
              </h4>

              <p>
                {safeValue(
                  security.activeSessions,
                  0
                )}
              </p>
            </div>

            <div>
              <h4>
                Token Expiration
              </h4>

              <p>
                {safeValue(
                  health?.outlook?.tokenExpiry,
                  "N/A"
                )}
              </p>
            </div>

          </div>

          <div className="audit-card">

            <div className="audit-icon">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h4>
                Audit Logs
              </h4>

              <p>
                Administrator activities are
                securely recorded.
              </p>
            </div>

          </div>

        </section>
      )}

      {/* ===================================================
          OUTLOOK
      =================================================== */}

      {activeTab === "outlook" && (
        <section className="settings-card">

          <div className="card-heading">
            <div>
              <span className="section-kicker">
                MICROSOFT 365
              </span>

              <h2>
                Microsoft Outlook
                Configuration
              </h2>

              <p>
                Configure Microsoft Graph
                synchronization preferences.
              </p>
            </div>

            <Mail
              className="heading-icon"
              size={28}
            />
          </div>

          <div className="connection-card">

            <div className="connection-status">

              {health?.outlook?.connected ? (
                <div className="connection-icon connected">
                  <CheckCircle size={28} />
                </div>
              ) : (
                <div className="connection-icon disconnected">
                  <XCircle size={28} />
                </div>
              )}

              <div>
                <h3>
                  Microsoft Graph
                </h3>

                <span
                  className={
                    health?.outlook?.connected
                      ? "status-green"
                      : "status-red"
                  }
                >
                  {health?.outlook?.connected
                    ? "Connected"
                    : "Disconnected"}
                </span>
              </div>

            </div>

          </div>

          <div className="connection-grid">

            <div>
              <h4>
                Connected Account
              </h4>

              <p>
                {safeValue(
                  health?.outlook?.account,
                  "N/A"
                )}
              </p>
            </div>

            <div>
              <h4>
                Last Synchronization
              </h4>

              <p>
                {safeValue(
                  health?.outlook?.lastSync,
                  "N/A"
                )}
              </p>
            </div>

            <div>
              <h4>
                API Health
              </h4>

              <p>
                {safeValue(
                  outlookHealth,
                  "N/A"
                )}
              </p>
            </div>

            <div>
              <h4>
                Token Expiry
              </h4>

              <p>
                {safeValue(
                  health?.outlook?.tokenExpiry,
                  "N/A"
                )}
              </p>
            </div>

          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>
                Sync Interval
              </label>

              <div className="input-with-unit">
                <input
                  type="number"
                  min="10"
                  max="3600"
                  value={safeValue(
                    outlook.syncInterval,
                    60
                  )}
                  onChange={(event) =>
                    updateSetting(
                      "outlook",
                      "syncInterval",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

                <span>sec</span>
              </div>
            </div>

          </div>

          <div className="toggle-grid">

            <ToggleCard
              label="Enable Outlook Sync"
              checked={
                outlook.syncEnabled
              }
              onChange={(value) =>
                updateSetting(
                  "outlook",
                  "syncEnabled",
                  value
                )
              }
            />

            <ToggleCard
              label="Include Attachments"
              checked={
                outlook.includeAttachments
              }
              onChange={(value) =>
                updateSetting(
                  "outlook",
                  "includeAttachments",
                  value
                )
              }
            />

            <ToggleCard
              label="Synchronize Calendar"
              checked={
                outlook.syncCalendar
              }
              onChange={(value) =>
                updateSetting(
                  "outlook",
                  "syncCalendar",
                  value
                )
              }
            />

            <ToggleCard
              label="Synchronize Contacts"
              checked={
                outlook.syncContacts
              }
              onChange={(value) =>
                updateSetting(
                  "outlook",
                  "syncContacts",
                  value
                )
              }
            />

            <ToggleCard
              label="Synchronize Deleted Items"
              checked={
                outlook.syncDeleted
              }
              onChange={(value) =>
                updateSetting(
                  "outlook",
                  "syncDeleted",
                  value
                )
              }
            />

          </div>

        </section>
      )}

      {/* ===================================================
          SYSTEM HEALTH
      =================================================== */}

      {activeTab === "system" && (
        <section className="settings-card">

          <div className="card-heading">
            <div>
              <span className="section-kicker">
                MONITORING
              </span>

              <h2>
                System Health Monitoring
              </h2>

              <p>
                Live application and Microsoft
                services status.
              </p>
            </div>

            <Activity
              className="heading-icon"
              size={28}
            />
          </div>

          <div className="health-grid">

            <div className="health-card">
              <div className="health-icon">
                <Server size={23} />
              </div>

              <div>
                <h4>
                  Server Status
                </h4>

                <span
                  className={
                    serverHealth ===
                    "Healthy"
                      ? "status-green"
                      : "status-orange"
                  }
                >
                  {serverHealth}
                </span>
              </div>
            </div>

            <div className="health-card">
              <div className="health-icon">
                <Database size={23} />
              </div>

              <div>
                <h4>
                  Database Status
                </h4>

                <span
                  className={
                    databaseHealth ===
                    "Healthy"
                      ? "status-green"
                      : "status-orange"
                  }
                >
                  {databaseHealth}
                </span>
              </div>
            </div>

            <div className="health-card">
              <div className="health-icon">
                <Mail size={23} />
              </div>

              <div>
                <h4>
                  Microsoft Graph
                </h4>

                <span
                  className={
                    health?.outlook?.connected
                      ? "status-green"
                      : "status-red"
                  }
                >
                  {health?.outlook?.connected
                    ? "Healthy"
                    : "Error"}
                </span>
              </div>
            </div>

            <div className="health-card">
              <div className="health-icon">
                <Brain size={23} />
              </div>

              <div>
                <h4>
                  AI Engine
                </h4>

                <span className="status-green">
                  {safeValue(
                    aiHealth,
                    "N/A"
                  )}
                </span>
              </div>
            </div>

            <div className="health-card">
              <div className="health-icon">
                <Activity size={23} />
              </div>

              <div>
                <h4>
                  Background Services
                </h4>

                <span className="status-green">
                  {safeValue(
                    health?.system
                      ?.services,
                    "N/A"
                  )}
                </span>
              </div>
            </div>

            <div className="health-card">
              <div className="health-icon">
                <HardDrive size={23} />
              </div>

              <div>
                <h4>
                  Queue Status
                </h4>

                <span className="status-green">
                  {safeValue(
                    health?.system
                      ?.queue,
                    "N/A"
                  )}
                </span>
              </div>
            </div>

          </div>

          <div className="backup-info">

            <div>
              <span className="section-kicker">
                BACKUP
              </span>

              <h4>
                Last Backup Time
              </h4>
            </div>

            <p>
              {safeValue(
                health?.system
                  ?.lastBackup,
                "N/A"
              )}
            </p>

          </div>

        </section>
      )}

      {/* ===================================================
          DATA MANAGEMENT
      =================================================== */}

      <section className="settings-card data-management">

        <div className="card-heading">

          <div>
            <span className="section-kicker">
              CONFIGURATION
            </span>

            <h2>
              Data Management
            </h2>

            <p>
              Manage configuration backup
              and enterprise settings.
            </p>
          </div>

          <Database
            className="heading-icon"
            size={28}
          />

        </div>

        <div className="data-actions">

          <button
            className="secondary-btn"
            onClick={fetchHealth}
            disabled={refreshing}
          >
            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            Refresh Health
          </button>

          <button
            className="secondary-btn"
            onClick={
              exportConfiguration
            }
          >
            <Download size={18} />
            Export Configuration
          </button>

          <button
            className="secondary-btn"
            onClick={() =>
              importInputRef.current?.click()
            }
          >
            <Upload size={18} />
            Import Configuration
          </button>

          <button
            className="danger-btn"
            onClick={
              resetServerSettings
            }
            disabled={saving}
          >
            <RotateCcw size={18} />
            Restore Defaults
          </button>

          <input
            ref={importInputRef}
            type="file"
            hidden
            accept=".json,application/json"
            onChange={
              importConfiguration
            }
          />

        </div>

        <div className="warning-box data-warning">

          <FileJson size={21} />

          <p>
            Configuration imports should be
            reviewed before saving. Restoring
            enterprise defaults permanently
            replaces the current server-side
            configuration.
          </p>

        </div>

      </section>

      {/* ===================================================
          SAVE BAR
      =================================================== */}

      <div className="save-bar">

        <div className="save-status">

          <span
            className={
              hasChanges
                ? "save-dot unsaved"
                : "save-dot"
            }
          />

          <span>
            {hasChanges
              ? "You have unsaved changes."
              : "All settings are saved."}
          </span>

        </div>

        <div className="save-bar-actions">

          <button
            className="secondary-btn"
            onClick={resetChanges}
            disabled={
              !hasChanges ||
              saving
            }
          >
            <RotateCcw size={18} />
            Reset Changes
          </button>

          <button
            className="primary-btn"
            onClick={saveSettings}
            disabled={
              saving ||
              contextSaving ||
              !hasChanges
            }
          >
            <Save size={18} />

            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>

        </div>

      </div>

      {/* ===================================================
          TOAST
      =================================================== */}

      {toast.show && (
        <div
          className={`toast ${toast.type}`}
        >
          {toast.type ===
          "success" ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}

          <span>
            {toast.message}
          </span>
        </div>
      )}

    </div>
  );
}