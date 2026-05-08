import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Tickets, Menu, X, Zap, User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { to: "/events", label: "Events" },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = profile?.is_admin ?? false;

  // Scroll shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  const handleSignOut = useCallback(() => {
    signOut();
    setIsMenuOpen(false);
    window.location.href = "/";
  }, [signOut]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${
          scrolled ? "pt-2" : "pt-4"
        }`}
      >
        <div 
          className={`w-full max-w-7xl mx-4 transition-all duration-300 rounded-full ${
            scrolled
              ? "glass-header shadow-md shadow-black/5 px-6 border border-border/60"
              : "glass-header bg-background/50 border border-border/60 px-6"
          }`}
        >
          <div className="flex justify-between items-center h-14">

            {/* ── Logo ──────────────────────────────────────────── */}
            <Link
              to="/"
              className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight group"
            >
              <motion.div
                whileHover={{ rotate: 8, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/30"
              >
                <Zap className="h-4 w-4" />
              </motion.div>
              <span className="gradient-text">SeatSync</span>
            </Link>

            {/* ── Desktop Nav ───────────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(to)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {label}
                  {isActive(to) && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                    />
                  )}
                </Link>
              ))}
              {user && (
                <Link
                  to="/tickets"
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/tickets")
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  My Tickets
                  {isActive("/tickets") && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                    />
                  )}
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/admin")
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  Admin
                  {isActive("/admin") && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                    />
                  )}
                </Link>
              )}
            </nav>

            {/* ── Desktop Controls ──────────────────────────────── */}
            <div className="hidden md:flex items-center gap-2.5">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ml-2"
                      >
                        <Avatar className="h-9 w-9 border border-border shadow-sm">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {user.email?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 bg-background/95 backdrop-blur-xl border border-border shadow-2xl mt-2">
                      <DropdownMenuLabel className="font-normal px-2 py-1.5">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold leading-none">{profile?.name || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/50 my-1" />
                      <DropdownMenuItem onClick={() => navigate("/tickets")} className="rounded-lg cursor-pointer flex items-center gap-2 py-2 px-2 hover:bg-muted/60 transition-colors">
                        <Tickets className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">My Tickets</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-lg cursor-pointer flex items-center gap-2 py-2 px-2 hover:bg-muted/60 transition-colors">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Profile</span>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate("/admin")} className="rounded-lg cursor-pointer flex items-center gap-2 py-2 px-2 hover:bg-muted/60 transition-colors">
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Admin Dashboard</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-border/50 my-1" />
                      <DropdownMenuItem onClick={handleSignOut} className="rounded-lg cursor-pointer flex items-center gap-2 py-2 px-2 text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors">
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium">Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/auth")}
                  className="gradient-primary rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:opacity-90 transition-all duration-200"
                >
                  Sign In
                </motion.button>
              )}
            </div>

            {/* ── Mobile Menu Button ────────────────────────────── */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsMenuOpen((v) => !v)}
                className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-muted/60 transition-colors"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Dropdown Card */}
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="fixed top-[76px] right-4 left-4 sm:left-auto sm:w-80 z-50 md:hidden bg-background/95 backdrop-blur-xl border border-border/60 shadow-2xl rounded-2xl flex flex-col overflow-hidden"
            >
              {/* Header (Optional, but good for context if needed, else removed for cleaner card look) */}
              {user && (
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
                  <Avatar className="h-10 w-10 border border-border shadow-sm">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold leading-none truncate">{profile?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
                {[
                  { to: "/events", label: "Events", icon: Zap },
                  ...(user ? [{ to: "/tickets", label: "My Tickets", icon: Tickets }] : []),
                  ...(user ? [{ to: "/profile", label: "Profile", icon: User }] : []),
                  ...(isAdmin ? [{ to: "/admin", label: "Admin Dashboard", icon: LayoutDashboard }] : []),
                ].map(({ to, label, icon: Icon }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                  >
                    <Link
                      to={to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                        isActive(to)
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Footer */}
              <div className="px-3 py-4 border-t border-border/60">
                {user ? (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/15 transition-all duration-150"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => { navigate("/auth"); setIsMenuOpen(false); }}
                    className="flex w-full items-center justify-center gap-2 gradient-primary rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:opacity-90 transition-all duration-200"
                  >
                    Sign In
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
