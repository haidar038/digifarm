import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/error";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useRole } from "@/hooks/useRole";
import { handleError } from "@/lib/error-utils";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// Protected pages (Farmer/Manager)
import Index from "./pages/Index";
import Lands from "./pages/Lands";
import Production from "./pages/Production";
import Weather from "./pages/Weather";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminLands from "./pages/admin/AdminLands";
import AdminUsers from "./pages/admin/AdminUsers";

// Observer pages
import ObserverDashboard from "./pages/observer/ObserverDashboard";
import ObserverFarmers from "./pages/observer/ObserverFarmers";
import ObserverFarmerDetail from "./pages/observer/ObserverFarmerDetail";
import ObserverExport from "./pages/observer/ObserverExport";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
        },
        mutations: {
            onError: (error) => {
                handleError(error, { title: "Operation Failed" });
            },
        },
    },
});

// Component to redirect users to their respective panels based on role
function RoleBasedHome() {
    const { isAdmin, isObserver } = useRole();

    // Admin goes to admin panel
    if (isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    // Observer goes to observer panel
    if (isObserver) {
        return <Navigate to="/observer" replace />;
    }

    // Farmers and managers go to farmer dashboard
    return <Index />;
}

const App = () => (
    <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />

                            {/* Role-based home redirect */}
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <RoleBasedHome />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Farmer/Manager routes */}
                            <Route
                                path="/lands"
                                element={
                                    <ProtectedRoute>
                                        <Lands />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/production"
                                element={
                                    <ProtectedRoute>
                                        <Production />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/analytics"
                                element={
                                    <ProtectedRoute>
                                        <Analytics />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/weather"
                                element={
                                    <ProtectedRoute>
                                        <Weather />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Admin routes */}
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminOverview />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/lands"
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminLands />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/users"
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminUsers />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Observer routes */}
                            <Route
                                path="/observer"
                                element={
                                    <ProtectedRoute requiredRole="observer">
                                        <ObserverDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/observer/farmers"
                                element={
                                    <ProtectedRoute requiredRole="observer">
                                        <ObserverFarmers />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/observer/farmers/:id"
                                element={
                                    <ProtectedRoute requiredRole="observer">
                                        <ObserverFarmerDetail />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/observer/export"
                                element={
                                    <ProtectedRoute requiredRole="observer">
                                        <ObserverExport />
                                    </ProtectedRoute>
                                }
                            />

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                </TooltipProvider>
            </AuthProvider>
        </QueryClientProvider>
    </ErrorBoundary>
);

export default App;
