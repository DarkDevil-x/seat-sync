
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, memo } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import ScrollToTop from "./components/ScrollToTop";
import { AnimatePresence, motion } from "framer-motion";

const Events          = lazy(() => import("./pages/Events"));
const EventDetail     = lazy(() => import("./pages/EventDetail"));
const Profile         = lazy(() => import("./pages/Profile"));
const Admin           = lazy(() => import("./pages/Admin"));
const MyTickets       = lazy(() => import("./pages/MyTickets"));
const AdminSetup      = lazy(() => import("./pages/AdminSetup"));
const TicketGenerator = lazy(() => import("./pages/TicketGenerator"));
const AuthCallback    = lazy(() => import("./pages/AuthCallback"));

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// ── Optimised QueryClient ──────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,      // 30 seconds
      gcTime: 1000 * 60 * 5,    // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Skeleton page fallback ─────────────────────────────────────────────────────
const PageFallback = memo(() => (
  <div className="container mx-auto py-10 px-4 max-w-7xl">
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-1/3 bg-muted rounded-xl" />
      <div className="h-4 w-2/5 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-[420px] bg-muted rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
));
PageFallback.displayName = "PageFallback";

// ── Page transition wrapper ────────────────────────────────────────────────────
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// ── Auth guards ────────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageFallback />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  if (isLoading) return <PageFallback />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile?.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageFallback />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ── Animated Routes ────────────────────────────────────────────────────────────
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/events" element={
          <Suspense fallback={<PageFallback />}>
            <PageTransition><Events /></PageTransition>
          </Suspense>
        } />
        <Route path="/events/:id" element={
          <Suspense fallback={<PageFallback />}>
            <PageTransition><EventDetail /></PageTransition>
          </Suspense>
        } />
        <Route path="/auth" element={
          <RedirectIfAuth>
            <PageTransition><Auth /></PageTransition>
          </RedirectIfAuth>
        } />
        <Route path="/profile" element={
          <RequireAuth>
            <Suspense fallback={<PageFallback />}>
              <PageTransition><Profile /></PageTransition>
            </Suspense>
          </RequireAuth>
        } />
        <Route path="/admin" element={
          <RequireAdmin>
            <Suspense fallback={<PageFallback />}>
              <PageTransition><Admin /></PageTransition>
            </Suspense>
          </RequireAdmin>
        } />
        <Route path="/admin-setup" element={
          <Suspense fallback={<PageFallback />}>
            <PageTransition><AdminSetup /></PageTransition>
          </Suspense>
        } />
        <Route path="/tickets" element={
          <RequireAuth>
            <Suspense fallback={<PageFallback />}>
              <PageTransition><MyTickets /></PageTransition>
            </Suspense>
          </RequireAuth>
        } />
        <Route path="/generate-ticket/:id" element={
          <RequireAuth>
            <Suspense fallback={<PageFallback />}>
              <PageTransition><TicketGenerator /></PageTransition>
            </Suspense>
          </RequireAuth>
        } />
        <Route path="/auth/callback" element={
          <Suspense fallback={<PageFallback />}>
            <PageTransition><AuthCallback /></PageTransition>
          </Suspense>
        } />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <OfflineBanner />
              <div className="bg-blob bg-blob-1" />
              <div className="bg-blob bg-blob-2" />
              <div className="flex flex-col min-h-screen relative z-0">
                <Header />
                <main className="flex-1 pt-16">
                  <AnimatedRoutes />
                </main>
                <ScrollToTop />
                <Analytics />
                <SpeedInsights />
              </div>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
