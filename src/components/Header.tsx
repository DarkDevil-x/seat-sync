import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Tickets, Menu, X, User, LogOut, LayoutDashboard, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

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
          className={`w-full max-w-7xl mx-4 transition-all duration-300 rounded-full px-6 ${
            scrolled
              ? "bg-background/85 backdrop-blur-xl shadow-sm border border-border/50"
              : "bg-background/50 backdrop-blur-sm border border-border/40"
          }`}
        >
          <div className="flex justify-between items-center h-14">

            {/* ── Logo ──────────────────────────────────────────── */}
            <Link to="/" className="flex items-center gap-0.5 group">
              <span className="font-display font-bold text-xl tracking-tight text-foreground transition-colors group-hover:text-primary">SeatSync</span>
              <span className="text-primary font-bold text-2xl leading-none">.</span>
            </Link>

            {/* ── Desktop Nav ───────────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                ...NAV_LINKS,
                ...(user ? [{ to: "/tickets", label: "My Tickets" }] : []),
                ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200
                    after:content-[''] after:absolute after:bottom-1.5 after:left-1/2 after:h-0.5 after:bg-primary after:transition-all after:duration-200
                    ${
                      isActive(to)
                        ? "text-primary after:w-4/5 after:-translate-x-1/2"
                        : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-4/5 hover:after:-translate-x-1/2"
                    }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* ── Desktop Controls ──────────────────────────────── */}
            <div className="hidden md:flex items-center gap-2.5">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ml-2 transition-transform duration-150 hover:scale-105 active:scale-95">
                        <Avatar className="h-9 w-9 border border-border shadow-sm">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {user.email?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 bg-background/95 backdrop-blur-xl border border-border shadow-2xl mt-2">
                      <DropdownMenuLabel className="font-normal px-2 py-1.5">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold leading-none">{[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "User"}</p>
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
                        <>
                          <DropdownMenuItem onClick={() => navigate("/admin")} className="rounded-lg cursor-pointer flex items-center gap-2 py-2 px-2 hover:bg-muted/60 transition-colors">
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Admin Dashboard</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/admin/bookings")} className="rounded-lg cursor-pointer flex items-center gap-2 py-2 px-2 hover:bg-muted/60 transition-colors">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Manage Bookings</span>
                          </DropdownMenuItem>
                        </>
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
                <button
                  onClick={() => navigate("/auth")}
                  className="bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-semibold shadow-sm hover:bg-primary/90 active:scale-95 transition-all duration-200"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* ── Mobile Menu Button ────────────────────────────── */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen((v) => !v)}
                className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-muted/60 active:scale-95 transition-all duration-150"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Full-Screen Overlay ─────────────────────────────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "-100%" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 md:hidden bg-background flex flex-col pt-20 pb-8 px-6"
          >
            {user && (
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "User"}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{user.email}</p>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-2 flex-1">
              {[
                { to: "/events", label: "Events", icon: LayoutDashboard },
                ...(user ? [{ to: "/tickets", label: "My Tickets", icon: Tickets }] : []),
                ...(user ? [{ to: "/profile", label: "Profile", icon: User }] : []),
                ...(isAdmin ? [{ to: "/admin", label: "Admin Dashboard", icon: LayoutDashboard }] : []),
                ...(isAdmin ? [{ to: "/admin/bookings", label: "Manage Bookings", icon: BookOpen }] : []),
              ].map(({ to, label, icon: Icon }, i) => (
                <motion.div
                  key={to}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors duration-150 ${
                      isActive(to)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-border">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-base font-medium text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => { navigate("/auth"); setIsMenuOpen(false); }}
                  className="flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-3 text-base font-semibold hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
