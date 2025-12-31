import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/error";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { handleError } from "@/lib/error-utils";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// Protected pages
import Index from "./pages/Index";
import Lands from "./pages/Lands";
import Production from "./pages/Production";
import Weather from "./pages/Weather";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

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

                            {/* Protected routes */}
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <Index />
                                    </ProtectedRoute>
                                }
                            />
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

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                </TooltipProvider>
            </AuthProvider>
        </QueryClientProvider>
    </ErrorBoundary>
);

export default App;
