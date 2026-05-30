import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user } = useAuth();
    if (user === null) {
        return (
            <div className="min-h-screen flex items-center justify-center" data-testid="auth-loading">
                <div className="text-muted-foreground">Loading…</div>
            </div>
        );
    }
    if (!user) return <Navigate to="/login" replace />;
    if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
    return children;
}
