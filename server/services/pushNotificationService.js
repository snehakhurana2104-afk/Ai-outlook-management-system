/******************************************************************************
 * services/pushNotificationService.js
 * Part 1
 * Imports + Web Push Initialization + Configuration
 ******************************************************************************/

/* ==========================================================================
   Imports
========================================================================== */

const webpush = require("web-push");

/* ==========================================================================
   Models
========================================================================== */

const NotificationPreference =
    require("../models/NotificationPreference");

/* ==========================================================================
   Environment Variables
========================================================================== */

const PUBLIC_KEY =
    process.env.VAPID_PUBLIC_KEY;

const PRIVATE_KEY =
    process.env.VAPID_PRIVATE_KEY;

const CONTACT_EMAIL =
    process.env.VAPID_CONTACT ||
    "mailto:admin@example.com";

/* ==========================================================================
   Configure Web Push
========================================================================== */

webpush.setVapidDetails(

    CONTACT_EMAIL,

    PUBLIC_KEY,

    PRIVATE_KEY

);

/* ==========================================================================
   Push Configuration
========================================================================== */

const PUSH_CONFIG = {

    ttl: 60 * 60,

    urgency: "normal",

    topic: "enterprise-notification",

};

/* ==========================================================================
   Helper
========================================================================== */

const now = () =>
    new Date().toISOString();

/******************************************************************************
 * Validate Subscription
 ******************************************************************************/

const isValidSubscription = (

    subscription

) => {

    if (!subscription) {

        return false;

    }

    if (!subscription.endpoint) {

        return false;

    }

    if (!subscription.keys) {

        return false;

    }

    if (!subscription.keys.p256dh) {

        return false;

    }

    if (!subscription.keys.auth) {

        return false;

    }

    return true;

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Subscribe User
 ******************************************************************************/

const subscribeUser = async (

    userId,

    subscription

) => {

    try {

        if (

            !isValidSubscription(subscription)

        ) {

            throw new Error(

                "Invalid Push Subscription."

            );

        }

        const preference =

            await NotificationPreference.findOneAndUpdate(

                {

                    userId,

                },

                {

                    $set: {

                        "push.enabled": true,

                        "push.subscription":

                            subscription,

                        "push.subscriptionId":

                            subscription.endpoint,

                        "push.updatedAt":

                            new Date(),

                    },

                },

                {

                    new: true,

                    upsert: true,

                }

            );

        return {

            success: true,

            preference,

            subscribedAt: now(),

        };

    }

    catch (error) {

        console.error(

            "[Push Subscribe Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Save Subscription
 ******************************************************************************/

const saveSubscription = async (

    userId,

    subscription

) => {

    try {

        return await subscribeUser(

            userId,

            subscription

        );

    }

    catch (error) {

        console.error(

            "[Save Subscription Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Remove Subscription
 ******************************************************************************/

const removeSubscription = async (

    userId

) => {

    try {

        const preference =

            await NotificationPreference.findOneAndUpdate(

                {

                    userId,

                },

                {

                    $set: {

                        "push.enabled": false,

                        "push.subscription": null,

                        "push.subscriptionId": "",

                        "push.updatedAt":

                            new Date(),

                    },

                },

                {

                    new: true,

                }

            );

        return {

            success: true,

            preference,

            removedAt: now(),

        };

    }

    catch (error) {

        console.error(

            "[Remove Subscription Error]",

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Send Push Notification
 ******************************************************************************/

const sendPushNotification = async (

    subscription,

    payload = {}

) => {

    try {

        if (

            !isValidSubscription(subscription)

        ) {

            throw new Error(

                "Invalid push subscription."

            );

        }

        const message = JSON.stringify({

            title:

                payload.title ||

                "AI Outlook",

            body:

                payload.body ||

                "You have a new notification.",

            icon:

                payload.icon ||

                "/logo192.png",

            badge:

                payload.badge ||

                "/badge.png",

            image:

                payload.image ||

                null,

            url:

                payload.url ||

                "/",

            priority:

                payload.priority ||

                "normal",

            data:

                payload.data ||

                {},

            timestamp:

                now(),

        });

        await webpush.sendNotification(

            subscription,

            message,

            PUSH_CONFIG

        );

        return {

            success: true,

            deliveredAt: now(),

        };

    }

    catch (error) {

        console.error(

            "[Push Notification Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Send Bulk Push Notifications
 ******************************************************************************/

const sendBulkPushNotifications = async (

    subscriptions = [],

    payload = {}

) => {

    try {

        const results = [];

        for (const subscription of subscriptions) {

            try {

                const result =

                    await sendPushNotification(

                        subscription,

                        payload

                    );

                results.push(result);

            }

            catch (error) {

                results.push({

                    success: false,

                    error: error.message,

                });

            }

        }

        return {

            success: true,

            total:

                subscriptions.length,

            delivered:

                results.filter(

                    (x) => x.success

                ).length,

            failed:

                results.filter(

                    (x) => !x.success

                ).length,

            results,

            completedAt: now(),

        };

    }

    catch (error) {

        console.error(

            "[Bulk Push Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Send High Priority Push
 ******************************************************************************/

const sendPriorityPush = async (

    subscription,

    payload = {}

) => {

    try {

        const priorityPayload = {

            ...payload,

            priority: "high",

            badge:

                payload.badge ||

                "/badge.png",

        };

        return await sendPushNotification(

            subscription,

            priorityPayload

        );

    }

    catch (error) {

        console.error(

            "[Priority Push Error]",

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Retry Push Notification
 ******************************************************************************/

const retryPushNotification = async (

    subscription,

    payload,

    retries = 3

) => {

    let attempt = 0;

    while (attempt < retries) {

        try {

            await sendPushNotification(

                subscription,

                payload

            );

            return {

                success: true,

                attempts: attempt + 1,

                deliveredAt: now(),

            };

        }

        catch (error) {

            attempt++;

            console.warn(

                `[Push Retry ${attempt}]`,

                error.message

            );

            if (attempt >= retries) {

                return {

                    success: false,

                    attempts: attempt,

                    error: error.message,

                };

            }

            await new Promise(

                (resolve) =>

                    setTimeout(

                        resolve,

                        attempt * 1000

                    )

            );

        }

    }

};


/******************************************************************************
 * Validate User Subscription
 ******************************************************************************/

const validateUserSubscription = async (

    userId

) => {

    const preference =

        await NotificationPreference.findOne({

            userId,

        });

    if (

        !preference ||

        !preference.push ||

        !preference.push.enabled ||

        !preference.push.subscription

    ) {

        return {

            success: false,

            valid: false,

        };

    }

    return {

        success: true,

        valid: true,

        subscription:

            preference.push.subscription,

    };

};


/******************************************************************************
 * Push Notification Health
 ******************************************************************************/

const pushNotificationHealth = async () => {

    try {

        const totalSubscriptions =

            await NotificationPreference.countDocuments({

                "push.enabled": true,

            });

        return {

            success: true,

            service: "Push Notification Service",

            status: "healthy",

            activeSubscriptions:

                totalSubscriptions,

            timestamp: now(),

        };

    }

    catch (error) {

        return {

            success: false,

            status: "unhealthy",

            error: error.message,

            timestamp: now(),

        };

    }

};


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    subscribeUser,

    saveSubscription,

    removeSubscription,

    sendPushNotification,

    sendBulkPushNotifications,

    sendPriorityPush,

    retryPushNotification,

    validateUserSubscription,

    pushNotificationHealth,

};

/******************************************************************************
 * End services/pushNotificationService.js
 ******************************************************************************/