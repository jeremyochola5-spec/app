import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Savings from "@/pages/Savings";
import Saccos from "@/pages/Saccos";
import SaccoDetail from "@/pages/SaccoDetail";
import AdminDashboard from "@/pages/AdminDashboard";

function App() {
    return (
        <div className="App">
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/savings" element={<ProtectedRoute><Savings /></ProtectedRoute>} />
                        <Route path="/saccos" element={<ProtectedRoute><Saccos /></ProtectedRoute>} />
                        <Route path="/saccos/:id" element={<ProtectedRoute><SaccoDetail /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                    </Routes>
                </BrowserRouter>
                <Toaster position="top-right" richColors />
            </AuthProvider>
        </div>
    );
}

export default App;
