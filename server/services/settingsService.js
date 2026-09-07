"use strict";

import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const settingsApi = axios.create({
    baseURL: `${API_BASE_URL}/settings`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

settingsApi.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("accessToken") ||
            localStorage.getItem("token");

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },
    (error) =>
        Promise.reject(error)
);

settingsApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error?.response?.data?.message ||
            error?.message ||
            "Settings API request failed.";

        return Promise.reject(
            new Error(message)
        );
    }
);

const unwrapResponse = (response) => {
    return response?.data?.data ?? response?.data;
};

export const getSettings = async () => {
    const response =
        await settingsApi.get("/");

    return unwrapResponse(response);
};

export const updateGeneralSettings = async (
    data
) => {
    const response =
        await settingsApi.put(
            "/general",
            data
        );

    return unwrapResponse(response);
};

export const updateAppearanceSettings = async (
    data
) => {
    const response =
        await settingsApi.put(
            "/appearance",
            data
        );

    return unwrapResponse(response);
};

export const updateLocalizationSettings = async (
    data
) => {
    const response =
        await settingsApi.put(
            "/localization",
            data
        );

    return unwrapResponse(response);
};

export const updateNotificationSettings =
    async (data) => {
        const response =
            await settingsApi.put(
                "/notifications",
                data
            );

        return unwrapResponse(response);
    };

export const updateAISettings = async (
    data
) => {
    const response =
        await settingsApi.put(
            "/ai",
            data
        );

    return unwrapResponse(response);
};

export const updateDashboardSettings =
    async (data) => {
        const response =
            await settingsApi.put(
                "/dashboard",
                data
            );

        return unwrapResponse(response);
    };

export const updateOutlookSettings = async (
    data
) => {
    const response =
        await settingsApi.put(
            "/outlook",
            data
        );

    return unwrapResponse(response);
};

export const updateSecuritySettings = async (
    data
) => {
    const response =
        await settingsApi.put(
            "/security",
            data
        );

    return unwrapResponse(response);
};

export const resetSettings = async () => {
    const response =
        await settingsApi.post("/reset");

    return unwrapResponse(response);
};

export const exportSettings = async () => {
    const response =
        await settingsApi.get(
            "/export",
            {
                responseType: "blob",
            }
        );

    return response.data;
};

export const testOutlookConnection =
    async () => {
        const response =
            await settingsApi.post(
                "/test-connection"
            );

        return unwrapResponse(response);
    };

export const reconnectOutlook = async () => {
    const response =
        await settingsApi.post(
            "/reconnect"
        );

    return unwrapResponse(response);
};

export const disconnectOutlook = async () => {
    const response =
        await settingsApi.post(
            "/disconnect"
        );

    return unwrapResponse(response);
};

export const refreshOutlookData =
    async () => {
        const response =
            await settingsApi.post(
                "/refresh-outlook"
            );

        return unwrapResponse(response);
    };

export const clearCache = async () => {
    const response =
        await settingsApi.post(
            "/clear-cache"
        );

    return unwrapResponse(response);
};

export const getSettingsHealth =
    async () => {
        const response =
            await settingsApi.get(
                "/health"
            );

        return unwrapResponse(response);
    };

export default {
    getSettings,
    updateGeneralSettings,
    updateAppearanceSettings,
    updateLocalizationSettings,
    updateNotificationSettings,
    updateAISettings,
    updateDashboardSettings,
    updateOutlookSettings,
    updateSecuritySettings,
    resetSettings,
    exportSettings,
    testOutlookConnection,
    reconnectOutlook,
    disconnectOutlook,
    refreshOutlookData,
    clearCache,
    getSettingsHealth,
};