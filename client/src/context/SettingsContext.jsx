/**
 * ============================================================================
 * context/SettingsContext.jsx
 * Phase 11.8 — Enterprise Settings Context
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 *
 * - Maintain global settings state
 * - Load settings from backend
 * - Track loading state
 * - Track saving state
 * - Track settings errors
 * - Update individual settings
 * - Update complete settings sections
 * - Update complete settings object
 * - Save settings to backend
 * - Reset local changes
 * - Reset settings on backend
 * - Refresh settings
 * - Check Settings API health
 * - Detect unsaved changes
 * - Expose settings through React Context
 *
 * ============================================================================
 */

"use strict";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getSettings,
    updateSettingsSections,
    resetSettings as resetSettingsApi,
    getSettingsHealth,
} from "../services/settingsApi";

/* ============================================================================
   CONTEXT
============================================================================ */

const SettingsContext = createContext(null);

/* ============================================================================
   DEFAULT SETTINGS
============================================================================ */

const DEFAULT_SETTINGS = {
    appearance: {
        theme: "system",
        accentColor: "#2563eb",
        density: "comfortable",
    },

    localization: {
        language: "en",
        timezone: "Asia/Kolkata",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "12h",
    },

    notifications: {
        desktop: true,
        email: true,
        sound: true,
        highPriorityOnly: false,
    },

    ai: {
        autoReply: true,
        smartClassification: true,
        priorityPrediction: true,
        slaPrediction: true,
        confidenceThreshold: 80,
    },

    dashboard: {
        autoRefresh: true,
        refreshInterval: 60,
        defaultView: "executive",
        showCharts: true,
        showKPIs: true,
    },

    outlook: {
        syncInterval: 5,
        autoSync: true,
        signature: "",
    },

    security: {
        sessionTimeout: 30,
        loginAlerts: true,
        deviceTracking: true,
    },
};

/* ============================================================================
   DEEP CLONE
============================================================================ */

const cloneSettings = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return value;
    }

    return JSON.parse(
        JSON.stringify(value)
    );
};

/* ============================================================================
   MERGE SETTINGS
============================================================================ */

const mergeSettings = (
    defaults,
    incoming
) => {
    const source =
        incoming || {};

    return {
        ...defaults,
        ...source,

        appearance: {
            ...defaults.appearance,
            ...(source.appearance || {}),
        },

        localization: {
            ...defaults.localization,
            ...(source.localization || {}),
        },

        notifications: {
            ...defaults.notifications,
            ...(source.notifications || {}),
        },

        ai: {
            ...defaults.ai,
            ...(source.ai || {}),
        },

        dashboard: {
            ...defaults.dashboard,
            ...(source.dashboard || {}),
        },

        outlook: {
            ...defaults.outlook,
            ...(source.outlook || {}),
        },

        security: {
            ...defaults.security,
            ...(source.security || {}),
        },
    };
};

/* ============================================================================
   NORMALIZE SETTINGS
============================================================================ */

const normalizeSettings = (
    incoming
) => {
    return mergeSettings(
        DEFAULT_SETTINGS,
        incoming
    );
};

/* ============================================================================
   SETTINGS PROVIDER
============================================================================ */

export const SettingsProvider = ({
    children,
}) => {

    /* ========================================================================
       SETTINGS STATE
    ======================================================================== */

    const [
        settings,
        setSettings,
    ] = useState(
        () =>
            cloneSettings(
                DEFAULT_SETTINGS
            )
    );

    /* ========================================================================
       SAVED SETTINGS
    ======================================================================== */

    const [
        savedSettings,
        setSavedSettings,
    ] = useState(
        () =>
            cloneSettings(
                DEFAULT_SETTINGS
            )
    );

    /* ========================================================================
       LOADING STATE
    ======================================================================== */

    const [
        loading,
        setLoading,
    ] = useState(true);

    /* ========================================================================
       SAVING STATE
    ======================================================================== */

    const [
        saving,
        setSaving,
    ] = useState(false);

    /* ========================================================================
       ERROR STATE
    ======================================================================== */

    const [
        error,
        setError,
    ] = useState("");

    /* ========================================================================
       HEALTH STATE
    ======================================================================== */

    const [
        health,
        setHealth,
    ] = useState(null);

    /* ========================================================================
       HEALTH LOADING
    ======================================================================== */

    const [
        healthLoading,
        setHealthLoading,
    ] = useState(false);

    /* ========================================================================
       LOAD SETTINGS
    ======================================================================== */

    const refreshSettings =
        useCallback(async () => {

            try {

                setLoading(true);
                setError("");

                const response =
                    await getSettings();

                const normalized =
                    normalizeSettings(
                        response
                    );

                const cloned =
                    cloneSettings(
                        normalized
                    );

                setSettings(
                    cloned
                );

                setSavedSettings(
                    cloneSettings(
                        cloned
                    )
                );

                return cloned;

            } catch (err) {

                console.error(
                    "[SettingsContext] Load Error:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to load settings."
                );

                throw err;

            } finally {

                setLoading(false);

            }

        }, []);

    /* ========================================================================
       INITIAL SETTINGS LOAD
    ======================================================================== */

    useEffect(() => {

        refreshSettings()
            .catch(() => {});

    }, [
        refreshSettings,
    ]);

    /* ========================================================================
       UPDATE SINGLE SETTING
    ======================================================================== */

    const updateSetting =
        useCallback(
            (
                section,
                key,
                value
            ) => {

                if (
                    !section ||
                    !key
                ) {
                    return;
                }

                setSettings(
                    (previous) => {

                        const currentSection =
                            previous?.[section] ||
                            {};

                        return {
                            ...previous,

                            [section]: {
                                ...currentSection,
                                [key]: value,
                            },
                        };
                    }
                );

                setError("");

            },
            []
        );

    /* ========================================================================
       UPDATE COMPLETE SECTION
    ======================================================================== */

    const updateSection =
        useCallback(
            (
                section,
                values
            ) => {

                if (!section) {
                    return;
                }

                setSettings(
                    (previous) => {

                        const currentSection =
                            previous?.[section] ||
                            {};

                        return {
                            ...previous,

                            [section]: {
                                ...currentSection,
                                ...(values || {}),
                            },
                        };
                    }
                );

                setError("");

            },
            []
        );

    /* ========================================================================
       UPDATE COMPLETE SETTINGS OBJECT
    ======================================================================== */

    const updateSettings =
        useCallback(
            (values) => {

                setSettings(
                    (previous) => {

                        const merged =
                            mergeSettings(
                                previous,
                                values
                            );

                        return cloneSettings(
                            merged
                        );
                    }
                );

                setError("");

            },
            []
        );

    /* ========================================================================
       UNSAVED CHANGES
    ======================================================================== */

    const hasChanges =
        useMemo(() => {

            return (
                JSON.stringify(
                    settings
                ) !==
                JSON.stringify(
                    savedSettings
                )
            );

        }, [
            settings,
            savedSettings,
        ]);

    /* ========================================================================
       SAVE SETTINGS
    ======================================================================== */

    const saveSettings =
        useCallback(async () => {

            try {

                setSaving(true);
                setError("");

                const currentSettings =
                    cloneSettings(
                        settings
                    );

                /*
                 * Send every configured section
                 * through the centralized API service.
                 */

                const response =
                    await updateSettingsSections(
                        currentSettings
                    );

                /*
                 * Re-fetch settings after saving.
                 *
                 * This guarantees that frontend state
                 * represents the actual backend state.
                 */

                const refreshed =
                    await getSettings();

                const normalized =
                    normalizeSettings(
                        refreshed
                    );

                const cloned =
                    cloneSettings(
                        normalized
                    );

                setSettings(
                    cloned
                );

                setSavedSettings(
                    cloneSettings(
                        cloned
                    )
                );

                return {
                    success: true,
                    data: cloned,
                    sections:
                        response,
                };

            } catch (err) {

                console.error(
                    "[SettingsContext] Save Error:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to save settings."
                );

                throw err;

            } finally {

                setSaving(false);

            }

        }, [
            settings,
        ]);

    /* ========================================================================
       RESET LOCAL CHANGES
    ======================================================================== */

    const resetChanges =
        useCallback(() => {

            setSettings(
                cloneSettings(
                    savedSettings
                )
            );

            setError("");

        }, [
            savedSettings,
        ]);

    /* ========================================================================
       RESET SETTINGS ON BACKEND
    ======================================================================== */

    const resetSettings =
        useCallback(async () => {

            try {

                setSaving(true);
                setError("");

                /*
                 * IMPORTANT:
                 *
                 * resetSettingsApi is the imported
                 * API function.
                 *
                 * This avoids recursion caused by
                 * using the same name for the local
                 * context function.
                 */

                const response =
                    await resetSettingsApi();

                const normalized =
                    normalizeSettings(
                        response
                    );

                const cloned =
                    cloneSettings(
                        normalized
                    );

                setSettings(
                    cloned
                );

                setSavedSettings(
                    cloneSettings(
                        cloned
                    )
                );

                return cloned;

            } catch (err) {

                console.error(
                    "[SettingsContext] Reset Error:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to reset settings."
                );

                throw err;

            } finally {

                setSaving(false);

            }

        }, []);

    /* ========================================================================
       SETTINGS API HEALTH
    ======================================================================== */

    const refreshHealth =
        useCallback(async () => {

            try {

                setHealthLoading(
                    true
                );

                const response =
                    await getSettingsHealth();

                setHealth(
                    response
                );

                return response;

            } catch (err) {

                console.error(
                    "[SettingsContext] Health Error:",
                    err
                );

                const unavailableHealth = {
                    service:
                        "Settings API",

                    status:
                        "Unavailable",

                    error:
                        err?.message ||
                        "Health check failed.",

                    timestamp:
                        new Date().toISOString(),
                };

                setHealth(
                    unavailableHealth
                );

                return null;

            } finally {

                setHealthLoading(
                    false
                );

            }

        }, []);

    /* ========================================================================
       CLEAR ERROR
    ======================================================================== */

    const clearError =
        useCallback(() => {

            setError("");

        }, []);

    /* ========================================================================
       REFRESH SETTINGS + HEALTH
    ======================================================================== */

    const refreshAll =
        useCallback(async () => {

            const results = {
                settings: null,
                health: null,
            };

            try {

                results.settings =
                    await refreshSettings();

            } catch (err) {

                console.error(
                    "[SettingsContext] Refresh Settings Error:",
                    err
                );

            }

            try {

                results.health =
                    await refreshHealth();

            } catch (err) {

                console.error(
                    "[SettingsContext] Refresh Health Error:",
                    err
                );

            }

            return results;

        }, [
            refreshSettings,
            refreshHealth,
        ]);

    /* ========================================================================
       CONTEXT VALUE
    ======================================================================== */

    const contextValue =
        useMemo(() => ({

            /* ================================================================
               SETTINGS STATE
            ================================================================ */

            settings,

            savedSettings,

            loading,

            saving,

            error,

            hasChanges,

            /* ================================================================
               HEALTH STATE
            ================================================================ */

            health,

            healthLoading,

            /* ================================================================
               SETTINGS OPERATIONS
            ================================================================ */

            updateSetting,

            updateSection,

            updateSettings,

            saveSettings,

            resetChanges,

            resetSettings,

            refreshSettings,

            /* ================================================================
               HEALTH OPERATIONS
            ================================================================ */

            refreshHealth,

            refreshAll,

            /* ================================================================
               ERROR OPERATIONS
            ================================================================ */

            clearError,

        }), [
            settings,
            savedSettings,
            loading,
            saving,
            error,
            hasChanges,
            health,
            healthLoading,
            updateSetting,
            updateSection,
            updateSettings,
            saveSettings,
            resetChanges,
            resetSettings,
            refreshSettings,
            refreshHealth,
            refreshAll,
            clearError,
        ]);

    /* ========================================================================
       PROVIDER
    ======================================================================== */

    return (
        <SettingsContext.Provider
            value={contextValue}
        >
            {children}
        </SettingsContext.Provider>
    );
};

/* ============================================================================
   CONTEXT HOOK
============================================================================ */

export const useSettings = () => {

    const context =
        useContext(
            SettingsContext
        );

    if (!context) {

        throw new Error(
            "useSettings must be used inside a SettingsProvider."
        );

    }

    return context;
};

/* ============================================================================
   DEFAULT EXPORT
============================================================================ */

export default SettingsContext;

/**
 * ============================================================================
 * END context/SettingsContext.jsx
 * ============================================================================
 */