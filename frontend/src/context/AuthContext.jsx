import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const r = await api.get("/auth/me");
      setUser(r.data.user);
      setRole(r.data.role);
    } catch (e) {
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Network failure during logout is non-fatal; we still clear local state.
      if (process.env.NODE_ENV !== "production") {
        console.error("Logout request failed:", err);
      }
    }
    setUser(null);
    setRole(null);
    window.location.href = "/";
  }, []);

  const value = useMemo(
    () => ({ user, role, loading, setUser, setRole, refresh: checkAuth, logout }),
    [user, role, loading, checkAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
