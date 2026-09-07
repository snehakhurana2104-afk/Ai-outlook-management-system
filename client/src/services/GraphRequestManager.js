/* ==========================================================
   GraphRequestManager.js
   Enterprise Microsoft Graph Request Manager
========================================================== */

import { Client } from "@microsoft/microsoft-graph-client";

class GraphRequestManager {

    constructor(authProvider) {

        this.client = Client.initWithMiddleware({

            authProvider

        });

        this.pendingRequests = new Map();

        this.abortControllers = new Map();

    }

    /* ======================================================
       Create Unique Request Key
    ====================================================== */

    createKey(endpoint, query = {}) {

        return JSON.stringify({

            endpoint,

            query

        });

    }

    /* ======================================================
       Cancel Existing Request
    ====================================================== */

    cancel(key) {

        const controller = this.abortControllers.get(key);

        if (controller) {

            controller.abort();

            this.abortControllers.delete(key);

            this.pendingRequests.delete(key);

        }

    }

    /* ======================================================
       GET Request
    ====================================================== */

    async get(endpoint, query = {}) {

        const key = this.createKey(endpoint, query);

        /* Prevent duplicate requests */

        if (this.pendingRequests.has(key)) {

            return this.pendingRequests.get(key);

        }

        /* Cancel previous identical request */

        this.cancel(key);

        const controller = new AbortController();

        this.abortControllers.set(

            key,

            controller

        );

        const requestPromise = this.execute(

            endpoint,

            query,

            controller,

            key

        );

        this.pendingRequests.set(

            key,

            requestPromise

        );

        return requestPromise;

    }

    /* ======================================================
       Execute Graph Request
    ====================================================== */

    async execute(

        endpoint,

        query,

        controller,

        key

    ) {

        try {

            let request =

                this.client

                    .api(endpoint);

            Object.entries(query)

                .forEach(

                    ([name, value]) => {

                        if (

                            value !== undefined &&

                            value !== null

                        ) {

                            request =

                                request.query({

                                    [name]: value

                                });

                        }

                    }

                );

            const response =

                await request.get({

                    signal:

                        controller.signal

                });

            return response;

        }

        finally {

            this.pendingRequests.delete(key);

            this.abortControllers.delete(key);

        }

    }

    /* ======================================================
       Cancel All
    ====================================================== */

    cancelAll() {

        this.abortControllers.forEach(

            controller =>

                controller.abort()

        );

        this.pendingRequests.clear();

        this.abortControllers.clear();

    }

}

export default GraphRequestManager;