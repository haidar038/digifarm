import { Suspense, lazy } from "react";
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
import { Loader2 } from "lucide-react";

// Loading fallback component for lazy-loaded routes
function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Memuat halaman...</p>
            </div>
        </div>
    );
}

// Auth pages (keep static - critical path)
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ForcePasswordChange from "./pages/ForcePasswordChange";

// Public pages (keep static - SEO important)
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

// Lazy-loaded public pages
const AIAssistant = lazy(() => import("./pages/ai/AIAssistant"));
const ArticleList = lazy(() => import("./pages/articles/ArticleList"));
const ArticleDetail = lazy(() => import("./pages/articles/ArticleDetail"));
const PublicWeather = lazy(() => import("./pages/PublicWeather"));
const CommodityPrices = lazy(() => import("./pages/CommodityPrices"));

// Lazy-loaded protected pages (Farmer/Manager)
const Index = lazy(() => import("./pages/Index"));
const Lands = lazy(() => import("./pages/Lands"));
const Production = lazy(() => import("./pages/Production"));
const Planning = lazy(() => import("./pages/Planning"));
const Weather = lazy(() => import("./pages/Weather"));
const Profile = lazy(() => import("./pages/Profile"));
const Analytics = lazy(() => import("./pages/Analytics"));

// Lazy-loaded Admin pages
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminLands = lazy(() => import("./pages/admin/AdminLands"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminConnections = lazy(() => import("./pages/admin/AdminConnections"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminArticles = lazy(() => import("./pages/admin/AdminArticles"));
const AdminArticleEditor = lazy(() => import("./pages/admin/AdminArticleEditor"));
const AdminForumManagement = lazy(() => import("./pages/admin/AdminForumManagement"));

// Lazy-loaded Observer pages
const ObserverDashboard = lazy(() => import("./pages/observer/ObserverDashboard"));
const ObserverFarmers = lazy(() => import("./pages/observer/ObserverFarmers"));
const ObserverFarmerDetail = lazy(() => import("./pages/observer/ObserverFarmerDetail"));
const ObserverExport = lazy(() => import("./pages/observer/ObserverExport"));
const ObserverManagers = lazy(() => import("./pages/observer/ObserverManagers"));

// Lazy-loaded Manager pages
const ManagerDashboard = lazy(() => import("./pages/manager/ManagerDashboard"));
const ManagerFarmers = lazy(() => import("./pages/manager/ManagerFarmers"));
const ManagerFarmerDetail = lazy(() => import("./pages/manager/ManagerFarmerDetail"));
const ManagerConnections = lazy(() => import("./pages/manager/ManagerConnections"));
const ManagerAnalytics = lazy(() => import("./pages/manager/ManagerAnalytics"));
const ManagerWeather = lazy(() => import("./pages/manager/ManagerWeather"));

// Lazy-loaded Forum pages
const ForumHome = lazy(() => import("./pages/forum/ForumHome"));
const ForumCategory = lazy(() => import("./pages/forum/ForumCategory"));
const ForumThread = lazy(() => import("./pages/forum/ForumThread"));
const CreateThread = lazy(() => import("./pages/forum/CreateThread"));
const UserThreads = lazy(() => import("./pages/forum/UserThreads"));

// Lazy-loaded Expert pages
const ExpertDashboard = lazy(() => import("./pages/expert/ExpertDashboard"));
const ExpertProfile = lazy(() => import("./pages/expert/ExpertProfile"));

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
    const { isAdmin, isObserver, isManager, isExpert } = useRole();

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

    // Expert goes to expert panel
    if (isExpert) {
        return <Navigate to="/expert" replace />;
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
                        <Suspense fallback={<PageLoader />}>
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
                                <Route path="/harga-komoditas" element={<CommodityPrices />} />

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
                                    path="/admin/forum"
                                    element={
                                        <ProtectedRoute requiredRole="admin">
                                            <AdminForumManagement />
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

                                {/* Forum routes - public view-only */}
                                <Route path="/forum" element={<ForumHome />} />
                                <Route path="/forum/category/:slug" element={<ForumCategory />} />
                                <Route path="/forum/thread/:slug" element={<ForumThread />} />

                                {/* Forum routes - protected (requires authentication) */}
                                <Route
                                    path="/forum/new"
                                    element={
                                        <ProtectedRoute>
                                            <CreateThread />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/forum/my-threads"
                                    element={
                                        <ProtectedRoute>
                                            <UserThreads />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Expert routes */}
                                <Route
                                    path="/expert"
                                    element={
                                        <ProtectedRoute requiredRole="expert">
                                            <ExpertDashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/expert/profile"
                                    element={
                                        <ProtectedRoute requiredRole="expert">
                                            <ExpertProfile />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </BrowserRouter>
                </TooltipProvider>
            </AuthProvider>
        </QueryClientProvider>
    </ErrorBoundary>
);

export default App;
