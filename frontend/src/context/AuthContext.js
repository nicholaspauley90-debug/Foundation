import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { me as fetchMe, login as apiLogin, logout as apiLogout, register as apiRegister } from "../lib/api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = unknown/anon; object = signed in
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchMe().then((u) => setUser(u)).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await apiLogin({ email, password });
    if (u?.token) localStorage.setItem("foundation_token", u.token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const u = await apiRegister({ email, password, name });
    if (u?.token) localStorage.setItem("foundation_token", u.token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem("foundation_token");
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, ready, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth requires AuthProvider");
  return c;
}
