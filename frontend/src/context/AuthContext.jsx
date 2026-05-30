import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = loading, false = logged out, object = logged in
    const [error, setError] = useState("");

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data.user);
        } catch {
            setUser(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const login = async (email, password) => {
        setError("");
        try {
            const { data } = await api.post("/auth/login", { email, password });
            setUser(data.user);
            return data.user;
        } catch (e) {
            const msg = formatApiErrorDetail(e.response?.data?.detail) || e.message;
            setError(msg);
            throw new Error(msg);
        }
    };

    const register = async (payload) => {
        setError("");
        try {
            const { data } = await api.post("/auth/register", payload);
            setUser(data.user);
            return data.user;
        } catch (e) {
            const msg = formatApiErrorDetail(e.response?.data?.detail) || e.message;
            setError(msg);
            throw new Error(msg);
        }
    };

    const logout = async () => {
        try { await api.post("/auth/logout"); } catch (e) { /* ignore */ }
        setUser(false);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, refresh, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
