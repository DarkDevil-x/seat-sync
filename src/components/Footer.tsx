import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-xl font-semibold">
                <span className="text-primary">Seat</span>
                <span className="text-foreground">Sync</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Book events, concerts, and more with real-time seat selection. Built for live experiences.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-4">Navigate</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link></li>
              <li><Link to="/events" className="text-muted-foreground hover:text-foreground transition-colors">Events</Link></li>
              <li><Link to="/tickets" className="text-muted-foreground hover:text-foreground transition-colors">My Tickets</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-4">Follow us</p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Twitter" className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">© {currentYear} SeatSync. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Built with ❤️ for live experiences</p>
        </div>
      </div>
    </footer>
  );
}
