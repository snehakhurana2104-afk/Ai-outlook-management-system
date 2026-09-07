// ==========================================================
// useAnalytics.js
// Phase 7.2
// Enterprise Analytics Data / Hooks Layer
// Microsoft 365 Enterprise Edition
// ==========================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AnalyticsService from "../services/analyticsService";

/* ==========================================================================
   Constants
========================================================================== */

const DEFAULT_FILTERS = Object.freeze({
  range: "month",
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  priority: "All",
  category: "All",
});

const AUTO_REFRESH_INTERVAL = 60000;

/* ==========================================================================
   Initial State
========================================================================== */

const INITIAL_DATA = Object.freeze({
  analytics: {},
  companies: [],
  todayStats: {},
  executive: {},
  productivity: null,
  priorityChart: [],
  categoryChart: [],
  trendChart: [],
});

/* ==========================================================================
   Utility
========================================================================== */

const normalizeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const normalizeObject = (value) => {
  return value && typeof value === "object"
    ? value
    : {};
};

/* ==========================================================================
   Hook
========================================================================== */

const useAnalytics = (
  initialFilters = {}
) => {
  /* ========================================================================
     Filters
  ======================================================================== */

  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));

  /* ========================================================================
     Data
  ======================================================================== */

  const [data, setData] =
    useState(INITIAL_DATA);

  /* ========================================================================
     Loading
  ======================================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* ========================================================================
     Error
  ======================================================================== */

  const [error, setError] =
    useState(null);

  /* ========================================================================
     Sync
  ======================================================================== */

  const [lastSync, setLastSync] =
    useState(null);

  /* ========================================================================
     Request Protection
  ======================================================================== */

  const requestIdRef = useRef(0);

  const mountedRef = useRef(true);

  const refreshingRef = useRef(false);

  /* ========================================================================
     Mounted State
  ======================================================================== */

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ========================================================================
     Filter Update
  ======================================================================== */

  const updateFilter = useCallback(
    (key, value) => {
      setFilters((previous) => ({
        ...previous,
        [key]: value,
      }));
    },
    []
  );

  /* ========================================================================
     Update Multiple Filters
  ======================================================================== */

  const updateFilters = useCallback(
    (nextFilters = {}) => {
      setFilters((previous) => ({
        ...previous,
        ...nextFilters,
      }));
    },
    []
  );

  /* ========================================================================
     Reset Filters
  ======================================================================== */

  const resetFilters = useCallback(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      ...initialFilters,
    });
  }, [initialFilters]);

  /* ========================================================================
     Fetch Analytics
  ======================================================================== */

  const fetchAnalytics = useCallback(
    async (options = {}) => {
      const {
        silent = false,
      } = options;

      const currentRequestId =
        ++requestIdRef.current;

      if (!silent) {
        setLoading(true);
      }

      setError(null);

      try {
        const response =
          await AnalyticsService.getDashboardAnalytics(
            filters
          );

        /*
         * Ignore stale requests.
         */

        if (
          currentRequestId !==
          requestIdRef.current
        ) {
          return null;
        }

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to load analytics."
          );
        }

        const payload =
          response?.data || {};

        if (!mountedRef.current) {
          return null;
        }

        const normalizedData = {
          analytics:
            normalizeObject(
              payload.analytics
            ),

          companies:
            normalizeArray(
              payload.topCompanies
            ),

          todayStats:
            normalizeObject(
              payload.today
            ),

          executive:
            normalizeObject(
              payload.executive
            ),

          productivity:
            payload.productivity ||
            null,

          priorityChart:
            normalizeArray(
              payload.priorityDistribution
            ),

          categoryChart:
            normalizeArray(
              payload.categoryAnalysis
            ),

          trendChart:
            normalizeArray(
              payload.dailyTrend
            ),
        };

        setData(normalizedData);

        setLastSync(new Date());

        return normalizedData;
      } catch (requestError) {
        if (
          !mountedRef.current
        ) {
          return null;
        }

        console.error(
          "[useAnalytics]",
          requestError
        );

        setError(
          requestError?.message ||
            "Unable to load Outlook analytics."
        );

        return null;
      } finally {
        if (
          mountedRef.current &&
          currentRequestId ===
            requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  /* ========================================================================
     Initial / Filter-Based Fetch
  ======================================================================== */

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /* ========================================================================
     Manual Refresh
  ======================================================================== */

  const refresh = useCallback(
    async () => {
      if (refreshingRef.current) {
        return null;
      }

      refreshingRef.current = true;

      setRefreshing(true);

      try {
        return await fetchAnalytics({
          silent: true,
        });
      } finally {
        refreshingRef.current = false;

        if (mountedRef.current) {
          setRefreshing(false);
        }
      }
    },
    [fetchAnalytics]
  );

  /* ========================================================================
     Auto Refresh
  ======================================================================== */

  useEffect(() => {
    const timer = setInterval(() => {
      if (
        !refreshingRef.current
      ) {
        fetchAnalytics({
          silent: true,
        });
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearInterval(timer);
    };
  }, [fetchAnalytics]);

  /* ========================================================================
     Unique Companies
  ======================================================================== */

  const uniqueCompanies = useMemo(() => {
    const map = new Map();

    data.companies.forEach(
      (company) => {
        if (!company) {
          return;
        }

        const name =
          String(
            company.name || ""
          ).trim();

        if (!name) {
          return;
        }

        map.set(name, {
          ...company,
          name,
        });
      }
    );

    return [...map.values()];
  }, [data.companies]);

  /* ========================================================================
     Derived Statistics
  ======================================================================== */

  const statistics = useMemo(() => {
    const analytics =
      data.analytics || {};

    return {
      monthlyEmails:
        Number(
          analytics.monthlyEmails || 0
        ),

      highPriority:
        Number(
          analytics.highPriority || 0
        ),

      totalCompanies:
        Number(
          analytics.totalCompanies || 0
        ),

      responseRate:
        Number(
          analytics.responseRate || 0
        ),
    };
  }, [data.analytics]);

  /* ========================================================================
     Return API
  ======================================================================== */

  return {
    /* ----------------------------------------------------------------------
       Filters
    ---------------------------------------------------------------------- */

    filters,

    updateFilter,

    updateFilters,

    resetFilters,

    /* ----------------------------------------------------------------------
       Data
    ---------------------------------------------------------------------- */

    analytics:
      data.analytics,

    companies:
      data.companies,

    uniqueCompanies,

    todayStats:
      data.todayStats,

    executive:
      data.executive,

    productivity:
      data.productivity,

    priorityChart:
      data.priorityChart,

    categoryChart:
      data.categoryChart,

    trendChart:
      data.trendChart,

    /* ----------------------------------------------------------------------
       Statistics
    ---------------------------------------------------------------------- */

    statistics,

    /* ----------------------------------------------------------------------
       Request State
    ---------------------------------------------------------------------- */

    loading,

    refreshing,

    error,

    lastSync,

    /* ----------------------------------------------------------------------
       Actions
    ---------------------------------------------------------------------- */

    fetchAnalytics,

    refresh,
  };
};

/* ==========================================================================
   Display Name
========================================================================== */

useAnalytics.displayName =
  "useAnalytics";

/* ==========================================================================
   Export
========================================================================== */

export default useAnalytics;