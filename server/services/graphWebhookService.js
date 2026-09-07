/******************************************************************************
 * services/graphWebhookService.js
 * Part 1
 * Imports + Configuration + Helpers
 ******************************************************************************/

/* ==========================================================================
   Imports
========================================================================== */

const axios = require("axios");

const authService =
    require("./authService");

/* ==========================================================================
   Environment
========================================================================== */

const GRAPH_BASE_URL =
    "https://graph.microsoft.com/v1.0";

const CLIENT_URL =
    process.env.CLIENT_URL ||
    "http://localhost:3000";

const WEBHOOK_URL =
    process.env.WEBHOOK_URL ||
    `${CLIENT_URL}/api/webhooks/outlook`;

/* ==========================================================================
   Microsoft Graph Resources
========================================================================== */

const RESOURCE = "/me/messages";

const CHANGE_TYPES =

    "created,updated,deleted";

/* ==========================================================================
   Subscription Expiry
   Microsoft Graph allows only limited duration.
========================================================================== */

const getExpirationDate = () => {

    const expiry = new Date();

    expiry.setHours(

        expiry.getHours() + 23

    );

    return expiry.toISOString();

};

/* ==========================================================================
   Get Graph Headers
========================================================================== */

const getHeaders = async () => {

    const token =

        await authService.getAccessToken();

    return {

        Authorization:

            `Bearer ${token}`,

        "Content-Type":

            "application/json",

    };

};

/******************************************************************************
 * Helper
 ******************************************************************************/

const now = () =>
    new Date().toISOString();

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Create Microsoft Graph Subscription
 ******************************************************************************/

const createSubscription = async () => {

    try {

        const headers =

            await getHeaders();

        const body = {

            changeType:

                CHANGE_TYPES,

            notificationUrl:

                WEBHOOK_URL,

            resource:

                RESOURCE,

            expirationDateTime:

                getExpirationDate(),

            clientState:

                process.env.GRAPH_CLIENT_STATE ||

                "AI_OUTLOOK_SECRET",

        };

        const response =

            await axios.post(

                `${GRAPH_BASE_URL}/subscriptions`,

                body,

                { headers }

            );

        console.log(

            "[Graph Subscription Created]",

            response.data.id

        );

        return {

            success: true,

            subscription:

                response.data,

            timestamp:

                now(),

        };

    }

    catch (error) {

        console.error(

            "[Create Subscription]",

            error.response?.data ||

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Renew Microsoft Graph Subscription
 ******************************************************************************/

const renewSubscription = async (

    subscriptionId

) => {

    try {

        const headers =

            await getHeaders();

        const response =

            await axios.patch(

                `${GRAPH_BASE_URL}/subscriptions/${subscriptionId}`,

                {

                    expirationDateTime:

                        getExpirationDate(),

                },

                {

                    headers,

                }

            );

        console.log(

            "[Subscription Renewed]",

            subscriptionId

        );

        return {

            success: true,

            subscription:

                response.data,

            timestamp:

                now(),

        };

    }

    catch (error) {

        console.error(

            "[Renew Subscription]",

            error.response?.data ||

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Get Subscription Details
 ******************************************************************************/

const getSubscription = async (

    subscriptionId

) => {

    try {

        const headers =

            await getHeaders();

        const response =

            await axios.get(

                `${GRAPH_BASE_URL}/subscriptions/${subscriptionId}`,

                {

                    headers,

                }

            );

        return {

            success: true,

            subscription:

                response.data,

            timestamp:

                now(),

        };

    }

    catch (error) {

        console.error(

            "[Get Subscription]",

            error.response?.data ||

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Delete Microsoft Graph Subscription
 ******************************************************************************/

const deleteSubscription = async (

    subscriptionId

) => {

    try {

        const headers =

            await getHeaders();

        await axios.delete(

            `${GRAPH_BASE_URL}/subscriptions/${subscriptionId}`,

            {

                headers,

            }

        );

        console.log(

            "[Subscription Deleted]",

            subscriptionId

        );

        return {

            success: true,

            subscriptionId,

            timestamp:

                now(),

        };

    }

    catch (error) {

        console.error(

            "[Delete Subscription]",

            error.response?.data ||

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * List All Microsoft Graph Subscriptions
 ******************************************************************************/

const listSubscriptions = async () => {

    try {

        const headers =

            await getHeaders();

        const response =

            await axios.get(

                `${GRAPH_BASE_URL}/subscriptions`,

                {

                    headers,

                }

            );

        return {

            success: true,

            total:

                response.data.value?.length || 0,

            subscriptions:

                response.data.value || [],

            timestamp:

                now(),

        };

    }

    catch (error) {

        console.error(

            "[List Subscriptions]",

            error.response?.data ||

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Validate Subscription
 ******************************************************************************/

const validateSubscription = async (

    subscriptionId

) => {

    try {

        const result =

            await getSubscription(

                subscriptionId

            );

        const subscription =

            result.subscription;

        const expiry =

            new Date(

                subscription.expirationDateTime

            );

        const remainingMinutes =

            Math.floor(

                (expiry - new Date()) /

                (1000 * 60)

            );

        return {

            success: true,

            valid:

                remainingMinutes > 0,

            subscriptionId,

            expiresAt:

                subscription.expirationDateTime,

            remainingMinutes,

            timestamp:

                now(),

        };

    }

    catch (error) {

        return {

            success: false,

            valid: false,

            error:

                error.message,

            timestamp:

                now(),

        };

    }

};


/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Renew All Expiring Subscriptions
 ******************************************************************************/

const renewExpiringSubscriptions = async (

    thresholdMinutes = 60

) => {

    try {

        const result =

            await listSubscriptions();

        const renewed = [];

        const skipped = [];

        for (const subscription of result.subscriptions) {

            const expiry =

                new Date(

                    subscription.expirationDateTime

                );

            const remainingMinutes =

                Math.floor(

                    (expiry - new Date()) /

                    (1000 * 60)

                );

            if (

                remainingMinutes <= thresholdMinutes

            ) {

                const renewedSubscription =

                    await renewSubscription(

                        subscription.id

                    );

                renewed.push(

                    renewedSubscription.subscription

                );

            }

            else {

                skipped.push({

                    id: subscription.id,

                    remainingMinutes,

                });

            }

        }

        return {

            success: true,

            renewed,

            skipped,

            renewedCount:

                renewed.length,

            skippedCount:

                skipped.length,

            timestamp:

                now(),

        };

    }

    catch (error) {

        console.error(

            "[Renew Expiring Subscriptions]",

            error.response?.data ||

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Graph Webhook Health Check
 ******************************************************************************/

const webhookHealth = async () => {

    try {

        const result =

            await listSubscriptions();

        return {

            success: true,

            service:

                "Microsoft Graph Webhook",

            status: "healthy",

            totalSubscriptions:

                result.total,

            subscriptions:

                result.subscriptions,

            timestamp:

                now(),

        };

    }

    catch (error) {

        return {

            success: false,

            service:

                "Microsoft Graph Webhook",

            status: "unhealthy",

            error:

                error.message,

            timestamp:

                now(),

        };

    }

};


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    createSubscription,

    renewSubscription,

    getSubscription,

    deleteSubscription,

    listSubscriptions,

    validateSubscription,

    renewExpiringSubscriptions,

    webhookHealth,

};

/******************************************************************************
 * End graphWebhookService.js
 ******************************************************************************/