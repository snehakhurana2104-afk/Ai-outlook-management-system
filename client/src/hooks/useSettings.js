"use strict";

import {
    useSettings as useSettingsContext,
} from "../context/SettingsContext";

/* ============================================================================
 * useSettings.js
 * Phase 11.2 — Enterprise Settings Hook
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Central hook for accessing SettingsContext.
 *
 * Responsibilities:
 *
 * - Read current settings
 * - Read loading state
 * - Read saving state
 * - Read settings errors
 * - Refresh settings from backend
 * - Update individual settings
 * - Update multiple settings
 * - Reset settings
 *
 * Usage:
 *
 * const {
 *     settings,
 *     loading,
 *     saving,
 *     error,
 *     refreshSettings,
 *     updateSetting,
 *     updateSettingsBatch,
 *     resetSettings,
 * } = useSettings();
 *
 * ========================================================================== */

const useSettings = () => {
    const context = useSettingsContext();

    /*
     * SettingsProvider ke bahar hook use nahi hona chahiye.
     */
    if (!context) {
        throw new Error(
            "useSettings must be used inside a SettingsProvider."
        );
    }

    /*
     * Context API already saare settings operations
     * provide karta hai.
     *
     * Isliye yahan duplicate logic nahi rakhenge.
     */
    return context;
};

export default useSettings;