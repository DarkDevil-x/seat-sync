
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from "./providers/AuthProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";

const Events        = lazy(() => import("./pages/Events"));
const EventDetail   = lazy(() => import("./pages/EventDetail"));
const Profile       = lazy(() => import("./pages/Profile"));
const Admin         = lazy(() => import("./pages/Admin"));
const MyTickets     = lazy(() => import("./pages/MyTickets"));
const AdminSetup    = lazy(() => import("./pages/AdminSetup"));
const TicketGenerator  = lazy(() => import("./pages/TicketGenerator"));
const AdminBookings    = lazy(() => import("./pages/AdminBookings"));

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const PageFallback = () => (
  <div className="container mx-auto py-8 px-4 space-y-4 animate-pulse">
    <div className="h-8 w-1/3 bg-muted rounded-lg" />
    <div className="h-4 w-2/3 bg-muted rounded" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-64 bg-muted rounded-xl" />
      ))}
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // data considered fresh for 60s — no refetch on re-mount
      gcTime: 10 * 60_000,        // keep unused cache for 10min
      retry: 1,                   // default 3 retries hammers the server; 1 is enough
      refetchOnWindowFocus: false, // Safari fires this on every tab switch — kills perf
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 pt-20">
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:id" element={<EventDetail />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/bookings" element={<AdminBookings />} />
                    <Route path="/admin-setup" element={<AdminSetup />} />
                    <Route path="/tickets" element={<MyTickets />} />
                    <Route path="/generate-ticket/:id" element={<TicketGenerator />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
              <Analytics />
              <SpeedInsights />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
