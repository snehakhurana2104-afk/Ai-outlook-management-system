/**
 * ============================================================================
 * services/settingsApi.js
 * Phase 11.6 — Enterprise Settings API Service
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 *
 * - Centralize all Settings API requests
 * - Connect SettingsContext / useSettings with backend
 * - Read complete settings
 * - Update individual settings sections
 * - Reset settings
 * - Check Settings API health
 * - Test Outlook-related settings through backend
 * - Provide consistent Axios handling
 *
 * ============================================================================
 */

"use strict";

import axios from "axios";

/* ============================================================================
   API CONFIGURATION
   ============================================================================ */

const API_BASE_URL =
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000/api";

/* ============================================================================
   AXIOS INSTANCE
   ============================================================================ */

const settingsApi = axios.create({
    baseURL: `${API_BASE_URL}/settings`,

    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },

    timeout: 30000,
});

/* ============================================================================
   REQUEST INTERCEPTOR
   ============================================================================ */

settingsApi.interceptors.request.use(
    (config) => {
        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

/* ============================================================================
   RESPONSE INTERCEPTOR
   ============================================================================ */

settingsApi.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        if (error.response) {
            console.error(
                "[Settings API]",
                error.response.status,
                error.response.data
            );
        } else if (error.request) {
            console.error(
                "[Settings API] Server unavailable."
            );
        } else {
            console.error(
                "[Settings API]",
                error.message
            );
        }

        return Promise.reject(error);
    }
);

/* ============================================================================
   RESPONSE DATA HELPER
   ============================================================================ */

const extractData = (response) => {
    return response?.data?.data ?? response?.data ?? null;
};

/* ============================================================================
   ERROR MESSAGE HELPER
   ============================================================================ */

const getApiErrorMessage = (error) => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        "Settings API request failed."
    );
};

/* ============================================================================
   GET COMPLETE SETTINGS
   ============================================================================ */

/**
 * GET /settings
 *
 * Returns complete settings configuration.
 */

export const getSettings = async () => {
    try {
        const response = await settingsApi.get("/");

        return extractData(response);
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   UPDATE APPEARANCE SETTINGS
   ============================================================================ */

/**
 * PUT /settings/appearance
 */

export const updateAppearanceSettings = async (
    appearance
) => {
    try {
        const response =
            await settingsApi.put(
                "/appearance",
                {
                    theme:
                        appearance?.theme,

                    accentColor:
                        appearance?.accentColor,

                    density:
                        appearance?.density,
                }
            );

        return extractData(response);
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   UPDATE LOCALIZATION SETTINGS
   ============================================================================ */

/**
 * PUT /settings/localization
 */

export const updateLocalizationSettings = async (
    localization
) => {
    try {
        const response =
            await settingsApi.put(
                "/localization",
                {
                    language:
                        localization?.language,

                    timezone:
                        localization?.timezone,

                    dateFormat:
                        localization?.dateFormat,

                    timeFormat:
                        localization?.timeFormat,
                }
            );

        return extractData(response);
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   UPDATE NOTIFICATION SETTINGS
   ============================================================================ */

/**
 * PUT /settings/notifications
 */

export const updateNotificationSettings = async (
    notifications
) => {
    try {
        const response =
            await settingsApi.put(
                "/notifications",
                {
                    desktop:
                        notifications?.desktop,

                    email:
                        notifications?.email,

                    sound:
                        notifications?.sound,

                    highPriorityOnly:
                        notifications?.highPriorityOnly,
                }
            );

        return extractData(response);
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   UPDATE AI SETTINGS
   ============================================================================ */

/**
 * PUT /settings/ai
 */

export const updateAISettings = async (
    ai
) => {
    try {
        const response =
            await settingsApi.put(
                "/ai",
                {
                    autoReply:
                        ai?.autoReply,

                    smartClassification:
                        ai?.smartClassification,

                    priorityPrediction:
                        ai?.priorityPrediction,

                    slaPrediction:
                        ai?.slaPrediction,

                    confidenceThreshold:
                        ai?.confidenceThreshold,
                }
            );

        return extractData(response);
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   UPDATE DASHBOARD SETTINGS
   ============================================================================ */

/**
 * PUT /settings/dashboard
 */

export const updateDashboardSettings = async (
    dashboard
) => {
    try {
        const response =
            await settingsApi.put(
                "/dashboard",
                {
                    autoRefresh:
                        dashboard?.autoRefresh,

                    refreshInterval:
                        dashboard?.refreshInterval,

                    defaultView:
                        dashboard?.defaultView,

                    showCharts:
                        dashboard?.showCharts,

                    showKPIs:
                        dashboard?.showKPIs,
                }
            );

        return extractData(response);
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   UPDATE OUTLOOK SETTINGS
   ============================================================================ */

/**
 * PUT /settings/outlook
 */

export const updateOutlookSettings = async (
    outlook
) => {
    try {
        const response =
            await settingsApi.put(
                "/outlook",
                {
                    autoSync:
                        outlook?.autoSync,

                    syncInterval:
                        outlook?.syncInterval,

                    signature:
                        outlook?.signature,
                }
            );

        return extractData(response);
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   UPDATE SECURITY SETTINGS
   ============================================================================ */

/**
 * PUT /settings/security
 */

export const updateSecuritySettings = async (
    security
) => {
    try {
        const response =
            await settingsApi.put(
                "/security",
                {
                    sessionTimeout:
                        security?.sessionTimeout,

                    loginAlerts:
                        security?.loginAlerts,

                    deviceTracking:
                        security?.deviceTracking,
                }
            );

        return extractData(response);
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   RESET SETTINGS
   ============================================================================ */

/**
 * POST /settings/reset
 */

export const resetSettings = async () => {
    try {
        const response =
            await settingsApi.post("/reset");

        return extractData(response);
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   SETTINGS HEALTH
   ============================================================================ */

/**
 * GET /settings/health
 */

export const getSettingsHealth = async () => {
    try {
        const response =
            await settingsApi.get("/health");

        return extractData(response);
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   UPDATE MULTIPLE SETTINGS SECTIONS
   ============================================================================ */

/**
 * Convenience helper.
 *
 * Sends only the sections supplied by the caller.
 */

export const updateSettingsSections = async (
    settings
) => {
    try {
        const results = {};

        if (settings?.appearance) {
            results.appearance =
                await updateAppearanceSettings(
                    settings.appearance
                );
        }

        if (settings?.localization) {
            results.localization =
                await updateLocalizationSettings(
                    settings.localization
                );
        }

        if (settings?.notifications) {
            results.notifications =
                await updateNotificationSettings(
                    settings.notifications
                );
        }

        if (settings?.ai) {
            results.ai =
                await updateAISettings(
                    settings.ai
                );
        }

        if (settings?.dashboard) {
            results.dashboard =
                await updateDashboardSettings(
                    settings.dashboard
                );
        }

        if (settings?.outlook) {
            results.outlook =
                await updateOutlookSettings(
                    settings.outlook
                );
        }

        if (settings?.security) {
            results.security =
                await updateSecuritySettings(
                    settings.security
                );
        }

        return results;
    } catch (error) {
        throw new Error(
            getApiErrorMessage(error)
        );
    }
};

/* ============================================================================
   DEFAULT EXPORT
   ============================================================================ */

export default {
    getSettings,

    updateAppearanceSettings,

    updateLocalizationSettings,

    updateNotificationSettings,

    updateAISettings,

    updateDashboardSettings,

    updateOutlookSettings,

    updateSecuritySettings,

    updateSettingsSections,

    resetSettings,

    getSettingsHealth,
};

/**
 * ============================================================================
 * END services/settingsApi.js
 * ============================================================================
 */