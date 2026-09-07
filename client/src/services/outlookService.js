"use strict";

import axiosClient from "../api/axiosClient";

/*
|--------------------------------------------------------------------------
| GET INBOX
|--------------------------------------------------------------------------
*/

export const getInboxEmails = async ({
  top = 100,
  maxMessages = 1000,
} = {}) => {
  try {
    const response =
      await axiosClient.get(
        "/outlook/inbox",
        {
          params: {
            top,
            maxMessages,
          },
        }
      );

    const data =
      response?.data || {};

    return {
      success:
        data?.success !== false,

      data:
        Array.isArray(
          data?.data
        )
          ? data.data
          : Array.isArray(
              data?.value
            )
          ? data.value
          : [],

      nextLink:
        data?.nextLink ||
        data?.["@odata.nextLink"] ||
        null,

      count:
        data?.count || 0,

      total:
        data?.total || 0,

      message:
        data?.message || "",
    };
  } catch (error) {
    console.error(
      "[Outlook] Get inbox error:",
      error
    );

    return {
      success: false,

      data: [],

      nextLink: null,

      count: 0,

      total: 0,

      message:
        error?.response?.data
          ?.message ||
        error?.message ||
        "Unable to fetch Outlook inbox.",
    };
  }
};

/*
|--------------------------------------------------------------------------
| SYNC INBOX
|--------------------------------------------------------------------------
*/

export const syncInbox =
  async () => {
    try {
      const response =
        await axiosClient.post(
          "/outlook/sync"
        );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        "[Outlook] Sync error:",
        error
      );

      return {
        success: false,

        message:
          error?.response?.data
            ?.message ||
          error?.message ||
          "Sync failed.",
      };
    }
  };

/*
|--------------------------------------------------------------------------
| GET SINGLE EMAIL
|--------------------------------------------------------------------------
*/

export const getEmailById =
  async (id) => {
    if (!id) {
      throw new Error(
        "Email ID is required."
      );
    }

    const response =
      await axiosClient.get(
        `/outlook/${encodeURIComponent(
          id
        )}`
      );

    return {
      success: true,
      data:
        response?.data?.data ||
        response?.data ||
        null,
    };
  };

/*
|--------------------------------------------------------------------------
| DELETE EMAIL
|--------------------------------------------------------------------------
*/

export const deleteEmail =
  async (id) => {
    if (!id) {
      throw new Error(
        "Email ID is required."
      );
    }

    const response =
      await axiosClient.delete(
        `/outlook/${encodeURIComponent(
          id
        )}`
      );

    return {
      success: true,
      data: response.data,
    };
  };

/*
|--------------------------------------------------------------------------
| MARK READ
|--------------------------------------------------------------------------
*/

export const markEmailAsRead =
  async (id) => {
    if (!id) {
      throw new Error(
        "Email ID is required."
      );
    }

    const response =
      await axiosClient.patch(
        `/outlook/${encodeURIComponent(
          id
        )}/read`
      );

    return {
      success: true,
      data: response.data,
    };
  };

/*
|--------------------------------------------------------------------------
| MARK UNREAD
|--------------------------------------------------------------------------
*/

export const markEmailAsUnread =
  async (id) => {
    if (!id) {
      throw new Error(
        "Email ID is required."
      );
    }

    const response =
      await axiosClient.patch(
        `/outlook/${encodeURIComponent(
          id
        )}/unread`
      );

    return {
      success: true,
      data: response.data,
    };
  };

/*
|--------------------------------------------------------------------------
| ARCHIVE
|--------------------------------------------------------------------------
*/

export const archiveEmail =
  async (id) => {
    if (!id) {
      throw new Error(
        "Email ID is required."
      );
    }

    const response =
      await axiosClient.patch(
        `/outlook/${encodeURIComponent(
          id
        )}/archive`
      );

    return {
      success: true,
      data: response.data,
    };
  };

/*
|--------------------------------------------------------------------------
| STAR
|--------------------------------------------------------------------------
*/

export const toggleStar =
  async (id, starred) => {
    try {
      const response =
        await axiosClient.patch(
          `/outlook/${encodeURIComponent(
            id
          )}/star`,
          {
            starred,
          }
        );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        "[Outlook] Toggle star error:",
        error
      );

      throw error;
    }
  };

/*
|--------------------------------------------------------------------------
| PROFILE PHOTO
|--------------------------------------------------------------------------
*/

export const getProfilePhoto =
  async () => {
    try {
      const response =
        await axiosClient.get(
          "/outlook/profile-photo",
          {
            responseType:
              "blob",
          }
        );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        "[Outlook] Profile photo error:",
        error
      );

      return {
        success: false,
        data: null,
      };
    }
  };