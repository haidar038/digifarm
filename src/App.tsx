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
import ForgotPassword from "./pages/ForgotPassword";
import ForcePasswordChange from "./pages/ForcePasswordChange";

// Public pages
import LandingPage from "./pages/LandingPage";
import AIAssistant from "./pages/ai/AIAssistant";
import ArticleList from "./pages/articles/ArticleList";
import ArticleDetail from "./pages/articles/ArticleDetail";
import PublicWeather from "./pages/PublicWeather";

// Protected pages (Farmer/Manager)
import Index from "./pages/Index";
import Lands from "./pages/Lands";
import Production from "./pages/Production";
import Planning from "./pages/Planning";
import Weather from "./pages/Weather";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminLands from "./pages/admin/AdminLands";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminConnections from "./pages/admin/AdminConnections";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminArticleEditor from "./pages/admin/AdminArticleEditor";

// Observer pages
import ObserverDashboard from "./pages/observer/ObserverDashboard";
import ObserverFarmers from "./pages/observer/ObserverFarmers";
import ObserverFarmerDetail from "./pages/observer/ObserverFarmerDetail";
import ObserverExport from "./pages/observer/ObserverExport";
import ObserverManagers from "./pages/observer/ObserverManagers";

// Manager pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerFarmers from "./pages/manager/ManagerFarmers";
import ManagerFarmerDetail from "./pages/manager/ManagerFarmerDetail";
import ManagerConnections from "./pages/manager/ManagerConnections";
import ManagerAnalytics from "./pages/manager/ManagerAnalytics";
import ManagerWeather from "./pages/manager/ManagerWeather";

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
    const { isAdmin, isObserver, isManager } = useRole();

    // Admin goes to admin panel
    if (isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    // Observer goes to observer panel
    if (isObserver) {
        return <Navigate to="/observer" replace />;
    }

    // Manager goes to manager panel
    if (isManager) {
        return <Navigate to="/manager" replace />;
    }

    // Farmers go to farmer dashboard
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
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/change-password" element={<ForcePasswordChange />} />
                            <Route path="/ai" element={<AIAssistant />} />
                            <Route path="/articles" element={<ArticleList />} />
                            <Route path="/articles/:slug" element={<ArticleDetail />} />
                            <Route path="/cuaca" element={<PublicWeather />} />

                            {/* Role-based dashboard redirect */}
                            <Route
                                path="/dashboard"
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
                                path="/planning"
                                element={
                                    <ProtectedRoute>
                                        <Planning />
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
                            <Route
                                path="/admin/connections"
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminConnections />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/audit-log"
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminAuditLog />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/articles"
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminArticles />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/articles/new"
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminArticleEditor />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/articles/:id/edit"
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminArticleEditor />
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
                            <Route
                                path="/observer/managers"
                                element={
                                    <ProtectedRoute requiredRole="observer">
                                        <ObserverManagers />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Manager routes */}
                            <Route
                                path="/manager"
                                element={
                                    <ProtectedRoute requiredRole="manager">
                                        <ManagerDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/manager/farmers"
                                element={
                                    <ProtectedRoute requiredRole="manager">
                                        <ManagerFarmers />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/manager/farmers/:id"
                                element={
                                    <ProtectedRoute requiredRole="manager">
                                        <ManagerFarmerDetail />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/manager/connections"
                                element={
                                    <ProtectedRoute requiredRole="manager">
                                        <ManagerConnections />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/manager/analytics"
                                element={
                                    <ProtectedRoute requiredRole="manager">
                                        <ManagerAnalytics />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/manager/weather"
                                element={
                                    <ProtectedRoute requiredRole="manager">
                                        <ManagerWeather />
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
