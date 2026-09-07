import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useIsAuthenticated,
  useMsal,
} from "@azure/msal-react";

import {
  InteractionStatus,
} from "@azure/msal-browser";

import {
  getActiveAccount,
  getGraphAccessToken,
  acquireGraphTokenInteractively,
  getUserProfile,
  checkGraphConnection,
  GraphInteractionRequiredError,
} from "../services/graphService";

import {
  initializeMsal,
  loginRequest,
  graphAccessScopes,
} from "../config/msalConfig";

const AuthContext = createContext(null);

const BASE_GRAPH_SCOPES = ["User.Read"];

const normalizeScopes = (scopes) => {
  const source =
    Array.isArray(scopes) && scopes.length
      ? scopes
      : BASE_GRAPH_SCOPES;

  return [
    ...new Set(
      source
        .filter(Boolean)
        .map((scope) => String(scope).trim())
        .filter(Boolean)
    ),
  ];
};

const getScopeKey = (scopes) =>
  normalizeScopes(scopes)
    .slice()
    .sort()
    .join(" ");

const getAccountKey = (account) => {
  if (!account) {
    return "";
  }

  return (
    account.homeAccountId ||
    account.localAccountId ||
    account.username ||
    ""
  );
};

const isInteractionError = (error) => {
  if (!error) {
    return false;
  }

  if (error instanceof GraphInteractionRequiredError) {
    return true;
  }

  const code = String(
    error?.errorCode ||
      error?.code ||
      error?.name ||
      ""
  ).toLowerCase();

  const message = String(
    error?.message || ""
  ).toLowerCase();

  return (
    code.includes("interaction_required") ||
    code.includes("login_required") ||
    code.includes("consent_required") ||
    code.includes("no_tokens_found") ||
    code.includes("invalid_grant") ||
    code.includes("token_expired") ||
    message.includes("interaction_required") ||
    message.includes("login_required") ||
    message.includes("consent_required") ||
    message.includes("no_tokens_found") ||
    message.includes("invalid_grant") ||
    message.includes("token_expired")
  );
};

const isUserCancellation = (error) => {
  if (!error) {
    return false;
  }

  const code = String(
    error?.errorCode ||
      error?.code ||
      ""
  ).toLowerCase();

  const message = String(
    error?.message || ""
  ).toLowerCase();

  return (
    code.includes("user_cancelled") ||
    code.includes("user_canceled") ||
    message.includes("user cancelled") ||
    message.includes("user canceled")
  );
};

const getProfileFallback = (account) => {
  if (!account) {
    return null;
  }

  return {
    id:
      account.localAccountId ||
      account.homeAccountId ||
      null,
    displayName:
      account.name ||
      account.username ||
      "",
    givenName:
      account.name ||
      "",
    surname: "",
    mail:
      account.username ||
      "",
    userPrincipalName:
      account.username ||
      "",
  };
};

const getConnectionBoolean = (result) => {
  if (result === true) {
    return true;
  }

  if (!result || typeof result !== "object") {
    return false;
  }

  if (result.connected === true) {
    return true;
  }

  if (result.graphConnected === true) {
    return true;
  }

  if (
    result.success === true &&
    result.connected !== false
  ) {
    return true;
  }

  if (
    result.data &&
    typeof result.data === "object"
  ) {
    if (result.data.connected === true) {
      return true;
    }

    if (
      result.data.graphConnected === true
    ) {
      return true;
    }

    if (
      result.data.success === true &&
      result.data.connected !== false
    ) {
      return true;
    }
  }

  return false;
};

export const AuthProvider = ({ children }) => {
  const {
    instance,
    accounts,
    inProgress,
  } = useMsal();

  const isAuthenticated =
    useIsAuthenticated();

  const mountedRef = useRef(true);
  const initializedRef = useRef(false);
  const initializationRef = useRef(null);
  const loadingUserRef = useRef(false);
  const tokenRequestsRef = useRef(new Map());
  const connectRequestRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const [loading, setLoading] =
    useState(true);

  const [authReady, setAuthReady] =
    useState(false);

  const [user, setUser] =
    useState(null);

  const [account, setAccount] =
    useState(null);

  const [accessToken, setAccessToken] =
    useState(null);

  const [graphConnected, setGraphConnected] =
    useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState("initializing");

  const [lastSyncTime, setLastSyncTime] =
    useState(null);

  const [error, setError] =
    useState(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      tokenRequestsRef.current.clear();
      connectRequestRef.current = null;
      initializationRef.current = null;
    };
  }, []);

  const getAccountSafe = async () => {
    try {
      const active = await getActiveAccount();

      if (active) {
        return active;
      }
    } catch (accountError) {
      console.warn(
        "Unable to get active account",
        accountError
      );
    }

    try {
      const active =
        instance.getActiveAccount?.();

      if (active) {
        return active;
      }
    } catch (accountError) {
      console.warn(
        "Unable to get MSAL account",
        accountError
      );
    }

    if (
      Array.isArray(accounts) &&
      accounts.length > 0
    ) {
      return accounts[0];
    }

    return null;
  };

  const markConnected = (token) => {
    if (!mountedRef.current) {
      return;
    }

    if (token) {
      setAccessToken(token);
    }

    setGraphConnected(true);
    setConnectionStatus("connected");
    setError(null);
  };

  const markDisconnected = () => {
    if (!mountedRef.current) {
      return;
    }

    setAccessToken(null);
    setGraphConnected(false);
    setConnectionStatus("disconnected");
  };

  const markReauthorizationRequired = (
    authError
  ) => {
    if (!mountedRef.current) {
      return;
    }

    setGraphConnected(false);
    setConnectionStatus(
      "reauthorization-required"
    );

    setError(
      authError?.message ||
        "Microsoft authorization is required."
    );
  };

  const getToken = async ({
    scopes = BASE_GRAPH_SCOPES,
    forceRefresh = false,
  } = {}) => {
    const normalizedScopes =
      normalizeScopes(scopes);

    const currentAccount =
      await getAccountSafe();

    if (!currentAccount) {
      throw new Error(
        "Microsoft account is not available."
      );
    }

    const accountKey =
      getAccountKey(currentAccount);

    const scopeKey =
      getScopeKey(normalizedScopes);

    const requestKey =
      `${accountKey}|${scopeKey}|${
        forceRefresh
          ? "force"
          : "normal"
      }`;

    const existing =
      tokenRequestsRef.current.get(
        requestKey
      );

    if (existing) {
      return existing;
    }

    const request = (async () => {
      try {
        const token =
          await getGraphAccessToken({
            scopes: normalizedScopes,
            forceRefresh,
          });

        if (!token) {
          throw new Error(
            "Microsoft Graph access token was not returned."
          );
        }

        markConnected(token);

        return token;
      } catch (tokenError) {
        if (
          isInteractionError(
            tokenError
          )
        ) {
          markReauthorizationRequired(
            tokenError
          );
        } else if (
          mountedRef.current
        ) {
          setConnectionStatus("error");
          setError(
            tokenError?.message ||
              "Unable to acquire Microsoft Graph token."
          );
        }

        throw tokenError;
      } finally {
        tokenRequestsRef.current.delete(
          requestKey
        );
      }
    })();

    tokenRequestsRef.current.set(
      requestKey,
      request
    );

    return request;
  };

  const loadUser = async ({
    silent = false,
  } = {}) => {
    if (loadingUserRef.current) {
      return null;
    }

    loadingUserRef.current = true;

    if (mountedRef.current) {
      if (!silent) {
        setLoading(true);
      }

      setError(null);
    }

    try {
      const currentAccount =
        await getAccountSafe();

      if (!currentAccount) {
        markDisconnected();

        if (mountedRef.current) {
          setUser(null);
          setAccount(null);
        }

        return null;
      }

      if (mountedRef.current) {
        setAccount(currentAccount);
      }

      try {
        await getToken({
          scopes: BASE_GRAPH_SCOPES,
          forceRefresh: false,
        });
      } catch (tokenError) {
        if (
          isInteractionError(
            tokenError
          )
        ) {
          throw tokenError;
        }
      }

      let profile = null;

      try {
        profile =
          await getUserProfile();
      } catch (profileError) {
        if (
          isInteractionError(
            profileError
          )
        ) {
          throw profileError;
        }

        profile =
          getProfileFallback(
            currentAccount
          );
      }

      let connectionResult = false;

      try {
        connectionResult =
          await checkGraphConnection();
      } catch {
        connectionResult = false;
      }

      const connected =
        getConnectionBoolean(
          connectionResult
        );

      const finalProfile =
        profile ||
        getProfileFallback(
          currentAccount
        );

      if (mountedRef.current) {
        setUser(finalProfile);
        setAccount(currentAccount);
        setGraphConnected(connected);

        setConnectionStatus(
          connected
            ? "connected"
            : "disconnected"
        );

        setLastSyncTime(new Date());
        setError(null);
      }

      return finalProfile;
    } catch (loadError) {
      if (mountedRef.current) {
        if (
          isInteractionError(
            loadError
          )
        ) {
          markReauthorizationRequired(
            loadError
          );
        } else {
          setConnectionStatus("error");
          setError(
            loadError?.message ||
              "Unable to load Microsoft account."
          );
        }
      }

      return null;
    } finally {
      loadingUserRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
        setAuthReady(true);
      }
    }
  };

  const connectMicrosoft = async () => {
    if (connectRequestRef.current) {
      return connectRequestRef.current;
    }

    if (
      inProgress !==
      InteractionStatus.None
    ) {
      return null;
    }

    const request = (async () => {
      try {
        if (mountedRef.current) {
          setConnectionStatus("connecting");
          setError(null);
        }

        const currentAccount =
          await getAccountSafe();

        if (currentAccount) {
          try {
            const token =
              await getToken({
                scopes: graphAccessScopes,
                forceRefresh: false,
              });

            if (mountedRef.current) {
              setAccessToken(token);
              setGraphConnected(true);
              setConnectionStatus(
                "connected"
              );
            }

            await loadUser({
              silent: true,
            });

            return token;
          } catch (silentError) {
            if (
              !isInteractionError(
                silentError
              )
            ) {
              throw silentError;
            }
          }
        }

        const token =
          await acquireGraphTokenInteractively(
            "popup"
          );

        if (mountedRef.current) {
          setAccessToken(token);
          setGraphConnected(true);
          setConnectionStatus(
            "connected"
          );
          setError(null);
        }

        await loadUser({
          silent: true,
        });

        return token;
      } catch (connectError) {
        if (
          isUserCancellation(
            connectError
          )
        ) {
          if (mountedRef.current) {
            setConnectionStatus(
              "disconnected"
            );
          }

          return null;
        }

        if (mountedRef.current) {
          if (
            isInteractionError(
              connectError
            )
          ) {
            markReauthorizationRequired(
              connectError
            );
          } else {
            setGraphConnected(false);
            setConnectionStatus("error");
            setError(
              connectError?.message ||
                "Microsoft connection failed."
            );
          }
        }

        return null;
      } finally {
        connectRequestRef.current =
          null;
      }
    })();

    connectRequestRef.current =
      request;

    return request;
  };

  const login = async () => {
    if (
      inProgress !==
      InteractionStatus.None
    ) {
      return null;
    }

    try {
      const currentAccount =
        await getAccountSafe();

      if (currentAccount) {
        try {
          const token =
            await getToken({
              scopes: BASE_GRAPH_SCOPES,
              forceRefresh: false,
            });

          await loadUser({
            silent: true,
          });

          return token;
        } catch (
          existingAccountError
        ) {
          if (
            !isInteractionError(
              existingAccountError
            )
          ) {
            throw existingAccountError;
          }
        }
      }

      if (mountedRef.current) {
        setConnectionStatus("connecting");
        setError(null);
      }

      await instance.loginRedirect({
        ...loginRequest,
      });

      return null;
    } catch (loginError) {
      if (
        isUserCancellation(
          loginError
        )
      ) {
        return null;
      }

      if (mountedRef.current) {
        setConnectionStatus("error");
        setError(
          loginError?.message ||
            "Microsoft login failed."
        );
      }

      return null;
    }
  };

  const logout = async () => {
    tokenRequestsRef.current.clear();
    connectRequestRef.current = null;

    if (refreshTimerRef.current) {
      clearInterval(
        refreshTimerRef.current
      );

      refreshTimerRef.current = null;
    }

    if (mountedRef.current) {
      setUser(null);
      setAccount(null);
      setAccessToken(null);
      setGraphConnected(false);
      setConnectionStatus(
        "disconnected"
      );
      setLastSyncTime(null);
      setError(null);
      setAuthReady(false);
    }

    try {
      await instance.logoutRedirect({
        postLogoutRedirectUri:
          window.location.origin +
          "/login",
      });
    } catch (logoutError) {
      if (mountedRef.current) {
        setConnectionStatus("error");
        setError(
          logoutError?.message ||
            "Microsoft logout failed."
        );
      }
    }
  };

  const refreshAuth = async () => {
    try {
      const currentAccount =
        await getAccountSafe();

      if (!currentAccount) {
        markDisconnected();
        return null;
      }

      const token =
        await getToken({
          scopes: BASE_GRAPH_SCOPES,
          forceRefresh: true,
        });

      await loadUser({
        silent: true,
      });

      if (mountedRef.current) {
        setLastSyncTime(new Date());
        setGraphConnected(true);
        setConnectionStatus(
          "connected"
        );
      }

      return token;
    } catch (refreshError) {
      if (mountedRef.current) {
        if (
          isInteractionError(
            refreshError
          )
        ) {
          markReauthorizationRequired(
            refreshError
          );
        } else {
          setConnectionStatus("error");
          setError(
            refreshError?.message ||
              "Authentication refresh failed."
          );
        }
      }

      return null;
    }
  };

  useEffect(() => {
    if (
      initializationRef.current
    ) {
      return;
    }

    if (
      inProgress !==
      InteractionStatus.None
    ) {
      return;
    }

    initializationRef.current =
      (async () => {
        try {
          if (mountedRef.current) {
            setLoading(true);
            setAuthReady(false);
            setConnectionStatus(
              "initializing"
            );
            setError(null);
          }

          await initializeMsal();

          const currentAccount =
            await getAccountSafe();

          if (!currentAccount) {
            if (mountedRef.current) {
              setUser(null);
              setAccount(null);
              setAccessToken(null);
              setGraphConnected(false);
              setConnectionStatus(
                "disconnected"
              );
              setAuthReady(true);
              setLoading(false);
            }

            initializedRef.current =
              true;

            return;
          }

          if (mountedRef.current) {
            setAccount(currentAccount);
          }

          await loadUser({
            silent: true,
          });

          if (mountedRef.current) {
            initializedRef.current =
              true;

            setAuthReady(true);
            setLoading(false);
          }
        } catch (
          initializationError
        ) {
          if (mountedRef.current) {
            if (
              isInteractionError(
                initializationError
              )
            ) {
              markReauthorizationRequired(
                initializationError
              );
            } else {
              setConnectionStatus(
                "error"
              );

              setError(
                initializationError?.message ||
                  "Microsoft authentication initialization failed."
              );
            }

            setAuthReady(true);
            setLoading(false);
          }

          initializedRef.current =
            true;
        }
      })();
  }, [
    inProgress,
    accounts,
    instance,
  ]);

  useEffect(() => {
    if (
      inProgress !==
      InteractionStatus.None
    ) {
      return;
    }

    if (
      !Array.isArray(accounts) ||
      accounts.length === 0
    ) {
      if (
        initializedRef.current &&
        mountedRef.current
      ) {
        setAccount(null);
        setUser(null);
        setAccessToken(null);
        setGraphConnected(false);
        setConnectionStatus(
          "disconnected"
        );
      }

      return;
    }

    const currentAccount =
      instance.getActiveAccount?.() ||
      accounts[0];

    if (!currentAccount) {
      return;
    }

    if (mountedRef.current) {
      setAccount(currentAccount);
    }

    if (
      initializedRef.current &&
      !loadingUserRef.current
    ) {
      loadUser({
        silent: true,
      });
    }
  }, [
    accounts,
    inProgress,
    instance,
  ]);

  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(
        refreshTimerRef.current
      );

      refreshTimerRef.current = null;
    }

    if (!graphConnected) {
      return undefined;
    }

    refreshTimerRef.current =
      setInterval(
        async () => {
          if (
            inProgress !==
            InteractionStatus.None
          ) {
            return;
          }

          const currentAccount =
            await getAccountSafe();

          if (!currentAccount) {
            return;
          }

          try {
            await getToken({
              scopes: BASE_GRAPH_SCOPES,
              forceRefresh: true,
            });

            if (mountedRef.current) {
              setLastSyncTime(
                new Date()
              );
            }
          } catch (
            refreshError
          ) {
            if (
              isInteractionError(
                refreshError
              )
            ) {
              markReauthorizationRequired(
                refreshError
              );
            }
          }
        },
        10 * 60 * 1000
      );

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(
          refreshTimerRef.current
        );

        refreshTimerRef.current = null;
      }
    };
  }, [
    graphConnected,
    inProgress,
    accounts,
    instance,
  ]);

  const hasAccount =
    Boolean(
      account ||
        accounts?.length
    );

  const isConnected =
    Boolean(
      graphConnected &&
        hasAccount
    );

  const isLoading =
    loading ||
    inProgress ===
      InteractionStatus.Startup;

  const effectiveAuthenticated =
    Boolean(
      isAuthenticated ||
        hasAccount
    );

  const contextValue = {
    user,
    account,
    accounts,
    accessToken,

    loading: isLoading,
    isLoading,
    authReady,

    isAuthenticated:
      effectiveAuthenticated,

    graphConnected,
    isConnected,

    connectionStatus,
    lastSyncTime,
    error,

    getToken,
    getAccessToken: getToken,

    getAccount: getAccountSafe,
    getActiveAccount:
      getAccountSafe,

    login,
    logout,

    connectMicrosoft,
    connectOutlook:
      connectMicrosoft,

    refreshAuth,
    refresh: refreshAuth,

    loadUser,
  };

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
};

export const useAuthContext =
  useAuth;

export default AuthContext;