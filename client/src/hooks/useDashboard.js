/******************************************************************************
 * useDashboard.js
 * Part 1
 * Enterprise Dashboard Hook
 ******************************************************************************/

import {

    useState,

    useEffect,

    useCallback,

    useMemo,

    useRef,

} from "react";

import socket from "../services/socket";

import dashboardApi from "../services/dashboardApi";

/* ==========================================================================
   Configuration
========================================================================== */

const AUTO_REFRESH_INTERVAL = 60 * 1000;

const DEFAULT_ERROR =
    "Unable to load dashboard.";

/* ==========================================================================
   Default Dashboard State
========================================================================== */

const DEFAULT_DASHBOARD = {

    overview: {},

    summary: {},

    kpis: {},

    charts: {},

    activity: {},

    companies: {},

    productivity: {},

};

/* ==========================================================================
   Enterprise Dashboard Hook
========================================================================== */

export default function useDashboard(

    filters = {},

    dateRange = null

) {

    /* ======================================================================
       Connection
    ====================================================================== */

    const [

        connected,

        setConnected,

    ] = useState(false);

    /* ======================================================================
       Loading State
    ====================================================================== */

    const [

        loading,

        setLoading,

    ] = useState(true);

    const [

        refreshing,

        setRefreshing,

    ] = useState(false);

    const [

        error,

        setError,

    ] = useState(null);

    /* ======================================================================
       Dashboard State
    ====================================================================== */

    const [

        dashboard,

        setDashboard,

    ] = useState(DEFAULT_DASHBOARD);

    const [

        lastUpdated,

        setLastUpdated,

    ] = useState(null);

    /* ======================================================================
       Internal References
    ====================================================================== */

    const mountedRef = useRef(true);

    const refreshTimerRef = useRef(null);

    const abortControllerRef = useRef(null);

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Dashboard Loader
 ******************************************************************************/

const loadDashboard = useCallback(

    async (

        options = {}

    ) => {

        try {

            if (!options.silent) {

                setLoading(true);

            }

            setError(null);

            /* --------------------------------------------------------------
               Cancel Previous Request
            -------------------------------------------------------------- */

            if (abortControllerRef.current) {

                abortControllerRef.current.abort();

            }

            abortControllerRef.current =

                new AbortController();

            const signal =

                abortControllerRef.current.signal;

            /* --------------------------------------------------------------
               Load Dashboard APIs
            -------------------------------------------------------------- */

            const [

                overviewRes,

                summaryRes,

                kpisRes,

                chartsRes,

                activityRes,

                companiesRes,

                productivityRes,

            ] = await Promise.all([

                dashboardApi.getDashboardOverview(

                    filters,

                    signal

                ),

                dashboardApi.getSummary(

                    filters,

                    signal

                ),

                dashboardApi.getKPIs(

                    filters,

                    signal

                ),

                dashboardApi.getCharts(

                    filters,

                    signal

                ),

                dashboardApi.getRecentActivity(

                    filters,

                    signal

                ),

                dashboardApi.getCompanyInsights(

                    filters,

                    signal

                ),

                dashboardApi.getProductivity(

                    filters,

                    signal

                ),

            ]);

            if (

                !mountedRef.current ||

                signal.aborted

            ) {

                return;

            }

            setDashboard({

                overview:

                    overviewRes?.data ||

                    {},

                summary:

                    summaryRes?.data ||

                    {},

                kpis:

                    kpisRes?.data ||

                    {},

                charts:

                    chartsRes?.data ||

                    {},

                activity:

                    activityRes?.data ||

                    {},

                companies:

                    companiesRes?.data ||

                    {},

                productivity:

                    productivityRes?.data ||

                    {},

            });

            setLastUpdated(

                new Date().toISOString()

            );

        }

        catch (error) {

            if (

                error.name === "AbortError" ||

                error.code === "ERR_CANCELED"

            ) {

                return;

            }

            console.error(

                "[Dashboard Loader]",

                error

            );

            if (mountedRef.current) {

                setError(

                    error?.response?.data?.message ||

                    error.message ||

                    DEFAULT_ERROR

                );

            }

        }

        finally {

            if (

                mountedRef.current

            ) {

                setLoading(false);

            }

        }

    },

    [

        filters,

        dateRange,

    ]

);

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Dashboard Refresh
 ******************************************************************************/

const refreshDashboard = useCallback(

    async () => {

        try {

            setRefreshing(true);

            await loadDashboard({

                silent: true,

            });

        }

        finally {

            if (

                mountedRef.current

            ) {

                setRefreshing(false);

            }

        }

    },

    [loadDashboard]

);

/******************************************************************************
 * Manual Reload
 ******************************************************************************/

const reload = useCallback(

    async () => {

        await refreshDashboard();

    },

    [refreshDashboard]

);

/******************************************************************************
 * Retry Dashboard
 ******************************************************************************/

const retryDashboard = useCallback(

    async () => {

        setError(null);

        await loadDashboard();

    },

    [loadDashboard]

);

/******************************************************************************
 * Initial Dashboard Load
 ******************************************************************************/

useEffect(() => {

    mountedRef.current = true;

    loadDashboard();

    return () => {

        mountedRef.current = false;

        if (

            abortControllerRef.current

        ) {

            abortControllerRef.current.abort();

        }

    };

}, [loadDashboard]);

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Enterprise Socket.IO Integration
 ******************************************************************************/

useEffect(() => {

    socket.connect();

    /* ----------------------------------------------------------------------
       Connected
    ---------------------------------------------------------------------- */

    const onConnect = () => {

        setConnected(true);

        console.log(

            "[Dashboard Socket] Connected"

        );

    };

    /* ----------------------------------------------------------------------
       Disconnected
    ---------------------------------------------------------------------- */

    const onDisconnect = () => {

        setConnected(false);

        console.log(

            "[Dashboard Socket] Disconnected"

        );

    };

    /* ----------------------------------------------------------------------
       Dashboard Live Update
    ---------------------------------------------------------------------- */

    const onDashboardUpdate = (payload = {}) => {

        if (!mountedRef.current) {

            return;

        }

        setDashboard((previous) => ({

            ...previous,

            ...(payload.overview && {
                overview: payload.overview,
            }),

            ...(payload.summary && {
                summary: payload.summary,
            }),

            ...(payload.kpis && {
                kpis: payload.kpis,
            }),

            ...(payload.charts && {
                charts: payload.charts,
            }),

            ...(payload.activity && {
                activity: payload.activity,
            }),

            ...(payload.companies && {
                companies: payload.companies,
            }),

            ...(payload.productivity && {
                productivity: payload.productivity,
            }),

        }));

        setLastUpdated(

            new Date().toISOString()

        );

    };

    /* ----------------------------------------------------------------------
       Register Events
    ---------------------------------------------------------------------- */

    socket.on(

        "connect",

        onConnect

    );

    socket.on(

        "disconnect",

        onDisconnect

    );

    socket.on(

        "dashboard:update",

        onDashboardUpdate

    );

    /* ----------------------------------------------------------------------
       Cleanup
    ---------------------------------------------------------------------- */

    return () => {

        socket.off(

            "connect",

            onConnect

        );

        socket.off(

            "disconnect",

            onDisconnect

        );

        socket.off(

            "dashboard:update",

            onDashboardUpdate

        );

        // Don't disconnect globally.
        // Other modules (Inbox, Analytics, Notifications)
        // may still be using the same socket instance.

    };

}, []);

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Enterprise Auto Refresh
 ******************************************************************************/

useEffect(() => {

    if (refreshTimerRef.current) {

        clearInterval(

            refreshTimerRef.current

        );

    }

    refreshTimerRef.current = setInterval(

        async () => {

            if (

                document.hidden ||

                !mountedRef.current

            ) {

                return;

            }

            try {

                await refreshDashboard();

            }

            catch (error) {

                console.error(

                    "[Auto Refresh]",

                    error

                );

            }

        },

        AUTO_REFRESH_INTERVAL

    );

    return () => {

        if (

            refreshTimerRef.current

        ) {

            clearInterval(

                refreshTimerRef.current

            );

        }

    };

}, [refreshDashboard]);

/******************************************************************************
 * Retry Handler
 ******************************************************************************/

const retry = useCallback(

    async () => {

        try {

            setError(null);

            await loadDashboard();

        }

        catch (error) {

            console.error(

                "[Dashboard Retry]",

                error

            );

        }

    },

    [loadDashboard]

);

/******************************************************************************
 * Refresh Helper
 ******************************************************************************/

const forceRefresh = useCallback(

    async () => {

        await refreshDashboard();

    },

    [refreshDashboard]

);

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
/******************************************************************************
 * Enterprise Memoized Selectors
 ******************************************************************************/

/* --------------------------------------------------------------------------
   Dashboard Sections
-------------------------------------------------------------------------- */

const overview = useMemo(

    () => dashboard?.overview || {},

    [dashboard.overview]

);

const summary = useMemo(

    () => dashboard?.summary || {},

    [dashboard.summary]

);

const kpis = useMemo(

    () => dashboard?.kpis || {},

    [dashboard.kpis]

);

const charts = useMemo(

    () => dashboard?.charts || {},

    [dashboard.charts]

);

const activity = useMemo(

    () => dashboard?.activity || {},

    [dashboard.activity]

);

const companies = useMemo(

    () => dashboard?.companies || {},

    [dashboard.companies]

);

const productivity = useMemo(

    () => dashboard?.productivity || {},

    [dashboard.productivity]

);

/* --------------------------------------------------------------------------
   Dashboard Status
-------------------------------------------------------------------------- */

const dashboardStatus = useMemo(

    () => ({

        connected,

        loading,

        refreshing,

        hasError: Boolean(error),

        lastUpdated,

    }),

    [

        connected,

        loading,

        refreshing,

        error,

        lastUpdated,

    ]

);

/* --------------------------------------------------------------------------
   Executive Metrics
-------------------------------------------------------------------------- */

const executiveMetrics = useMemo(

    () => ({

        totalEmails:

            kpis.totalEmails || 0,

        unreadEmails:

            kpis.unreadEmails || 0,

        readEmails:

            kpis.readEmails || 0,

        responseRate:

            kpis.responseRate || 0,

        highPriority:

            kpis.highPriority || 0,

    }),

    [kpis]

);

/* --------------------------------------------------------------------------
   Dashboard Ready
-------------------------------------------------------------------------- */

const isDashboardReady = useMemo(

    () =>

        !loading &&

        !refreshing &&

        !error,

    [

        loading,

        refreshing,

        error,

    ]

);

/******************************************************************************
 * Part 6 Ends
 ******************************************************************************/
/******************************************************************************
 * Enterprise Hook Return
 ******************************************************************************/

return {

    /* ======================================================================
       Connection
    ====================================================================== */

    connected,

    dashboardStatus,

    /* ======================================================================
       Loading
    ====================================================================== */

    loading,

    refreshing,

    error,

    lastUpdated,

    isDashboardReady,

    /* ======================================================================
       Dashboard Data
    ====================================================================== */

    dashboard,

    overview,

    summary,

    kpis,

    charts,

    activity,

    companies,

    productivity,

    executiveMetrics,

    /* ======================================================================
       Dashboard Actions
    ====================================================================== */

    loadDashboard,

    refreshDashboard,

    reload,

    retry,

    retryDashboard,

    forceRefresh,

};
}
/******************************************************************************
 * Part 7 Ends
 ******************************************************************************/