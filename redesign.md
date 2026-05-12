SeatSync Complete UI/UX Redesign — Final Prompt

Objective: Redesign the entire SeatSync platform UI while preserving all existing functionality, API integrations, auth flows, business logic, and the core seat selection algorithm. The seat map grid logic, touch interactions, and responsive scaling must remain untouched — only its wrapper/modal styling changes.
Current Tech Stack (preserve fully): React 18 + Vite + Tailwind CSS + Radix UI + Framer Motion + React Query + shadcn/ui + React Router + Google OAuth + JWT
0. Functionality Lock (Non-Negotiable)

All existing API calls, React Query hooks (useEvents, useAuth, etc.), state management, routing (/events, /event/:id, /admin, etc.), form validations, JWT handling, Google OAuth flow, seat selection logic, ticket generation logic, and MongoDB operations must remain completely untouched. Only JSX structure, Tailwind classes, CSS custom properties, and Framer Motion wrappers may change. If a new UI pattern requires logic adjustment, wrap the existing component rather than refactor it.
1. Design Token System (Semantic, Dual Mode)

Replace all hardcoded colors with semantic tokens in index.css and extend Tailwind config:
Table


Token	Light Mode	Dark Mode
--bg-primary	#FDF8F6	#0F1419
--bg-secondary	#FFFFFF	#1A1D23
--bg-elevated	#F5F0EE	#242830
--bg-card	#FFFFFF	#1E2128
--bg-glass	rgba(255,255,255,0.7)	rgba(30,33,40,0.7)
--accent-primary	#E85D4E	#FF7A6B
--accent-hover	#D14D40	#FF9488
--accent-muted	#F4A9A0	#B85C52
--accent-bg	#FEF2F0	#3A2522
--text-primary	#1A1A1A	#F0F0F0
--text-secondary	#6B6B6B	#A0A0A0
--text-muted	#9CA3AF	#6B7280
--border	#E5E0DE	#2A2D35
--success	#10B981	#34D399
--warning	#F59E0B	#FBBF24
--error	#EF4444	#F87171
Mode Behavior:
System-aware default via prefers-color-scheme
Manual toggle in Header: sun/moon icon with 300ms rotation animation
All transitions: transition-colors duration-300 ease-in-out
Images in dark mode: brightness(1.05) via CSS so event photos remain visible
Glassmorphism: backdrop-blur-xl bg-glass border border-border/20 — used sparingly on modals, overlays, and floating cards only
2. Typography System

Google Fonts to import: Space Grotesk (700, 600), Inter (400, 500, 600), JetBrains Mono (500, 700)
Scale (fluid via clamp()):
Hero display: clamp(2.5rem, 6vw, 4.5rem), Space Grotesk 700, tracking -0.02em, line-height 1.1
H2 section: clamp(1.75rem, 3vw, 2.5rem), Space Grotesk 600, line-height 1.2
H3 card title: 1.25rem, Inter 600
Body: 1rem, Inter 400, line-height 1.6
Caption/label: 0.875rem, Inter 500, uppercase, tracking 0.05em
Mono data (prices, seat numbers, ticket codes): 1.125–1.5rem, JetBrains Mono 700
3. shadcn/ui Base Components Update

Update all components in src/components/ui/ to consume new tokens:
Button: rounded-xl default, rounded-full for CTAs. Primary: coral background, white text. Secondary: outlined with border, transparent bg. Ghost: text only, coral on hover.
Input/Textarea: rounded-xl, border-border, focus ring ring-2 ring-accent-primary/30 ring-offset-2 ring-offset-bg-primary
Card: rounded-2xl, bg-bg-card, subtle shadow shadow-sm hover:shadow-md, no harsh borders
Dialog/Sheet: rounded-2xl, bg-bg-card, shadow-2xl, enter animation scale+fade
Badge: rounded-full, small padding, coral for primary, muted for secondary
Avatar: rounded-full, ring-2 ring-border, coral ring on active/online state
Select/Dropdown: rounded-xl, clean minimal, no heavy chrome
4. Global Components

Header (Header.tsx):
Transparent on top, transitions to bg-glass backdrop-blur-xl border-b border-border/50 on scroll
Logo: "SeatSync" in Space Grotesk 700, coral dot accent after "Sync"
Nav links: Inter 500, subtle underline scale-from-center on hover
Theme toggle: animated sun↔moon rotation, 300ms
User dropdown: card with shadow, rounded-xl, staggered item animations
Mobile: full-screen overlay, links stagger in from left with Framer Motion
Footer (Footer.tsx):
4-column grid: Brand + tagline, Quick Links, Legal, Social
Subtle top border only, no heavy separators
Social icons: rounded-lg squares, hover translateY(-2px) + coral tint
Bottom bar: copyright in text-muted, small
LoadingScreen (LoadingScreen.tsx):
Centered pulsing logo (coral dot bounces), not a generic spinner
Background: bg-primary
Skeleton variants for all card shapes defined below
ErrorBoundary (ErrorBoundary.tsx):
Friendly illustration placeholder (coral accent geometric shape)
"Something went wrong" in Space Grotesk, "Don't worry, your tickets are safe" secondary text
"Retry" button: rounded-full, coral
"Go Home" link: ghost style
OfflineBanner (OfflineBanner.tsx):
Fixed top bar, bg-accent-muted/20 light / bg-accent-muted/10 dark, coral left border
Small icon + "You're offline. Changes will sync when connected."
Dismissible with subtle fade-out
ScrollToTop (ScrollToTop.tsx):
Fixed bottom-right, appears after 400px scroll
rounded-full, bg-accent-primary, white icon, shadow-lg
Hover: scale(1.1), 150ms
5. Landing Page (Index.tsx)

HeroSection (HeroSection.tsx):
Asymmetric 60/40 split: left text, right floating event card preview
Background: subtle warm gradient mesh (light: #FDF8F6 → #FEF2F0, dark: #0F1419 → #1A1210) — no generic purple/blue gradients
Headline: "Book Events You'll Love" — Space Grotesk, hero scale
Subhead: Inter, text-secondary, max-width 560px
Search bar: pill-shaped (rounded-full), bg-bg-card, shadow-sm, focus ring coral, icon left, placeholder "Search concerts, sports, theatre..."
Primary CTA: "Explore Events" — rounded-full, coral, white text, hover lift + shadow
Stats row: animated counter "1,200+ tickets this month", small JetBrains Mono number + Inter label
Right side: 1–2 floating event cards with gentle Framer Motion bob animation
FeaturedEvents (FeaturedEvents.tsx) + EventCard (EventCard.tsx):
Must match reference image aesthetic: horizontal scrollable category filter chips at top (All, Concerts, Sports, Theatre, Corporate, etc.)
Grid: responsive 1→2→3→4 columns, gap-6
Cards: rounded-2xl, bg-bg-card, overflow-hidden
Image: 16:10 aspect ratio, object-cover, hover scale(1.03) inside card
Floating category tag: pill badge, top-left, bg-glass backdrop-blur-md, coral text
Price badge: bottom-right on image, bg-accent-primary, white text, JetBrains Mono
Body: title (2-line clamp, Inter 600), date + location row with icons, text-secondary
CTA: "Book Now" or "View Details" — full-width bottom button, rounded-xl, coral, hover lift
Hover: card translateY(-6px), shadow deepens, image zooms
FeaturesSection (FeaturesSection.tsx):
Clean 4-column grid (2x2 on tablet, 1 col mobile)
Each card: rounded-2xl, bg-bg-elevated, generous padding (32px)
Icon: line-style Lucide icon, coral, 32px
Title: Space Grotesk 600
Description: Inter, text-secondary
Step number: JetBrains Mono, text-muted, "01", "02", etc.
TestimonialsSection (TestimonialsSection.tsx):
Horizontal scroll on mobile (snap-x), 3-column grid desktop
Card: rounded-2xl, bg-bg-card, border (not heavy shadow)
Quote icon: coral, top-left
Quote text: Inter 500, italic, text-primary
Avatar: rounded-full, 48px, ring
Name: Inter 600, Role: text-secondary small
NewsletterSection (NewsletterSection.tsx):
Single rounded card (rounded-3xl), gradient background: from-accent-muted/30 to-accent-bg (light), from-accent-muted/10 to-bg-elevated (dark)
Title: Space Grotesk, "Get early access"
Input + button inline, pill-shaped
Success: checkmark animation + "You're in!" message
6. User-Facing Pages

Events Page (Events.tsx):
Sticky top filter bar: horizontal scrollable chips (category, date, price, occasion), active chip = coral bg + white text
Active filters: removable pill chips with × icon
Sort: minimal select, rounded-xl
Grid: same EventCard component as landing
Empty state: illustration + "No events found" + "Clear filters" CTA
Loading: skeleton cards matching new shape (rounded-2xl, pulse animation)
EventDetail (EventDetail.tsx):
Hero: full-width event image, static (no parallax for performance)
Info card: overlaps image bottom by 40px, bg-bg-card, rounded-t-3xl on mobile, rounded-2xl with shadow on desktop
Event title: Space Grotesk, H2 scale
Meta row: calendar icon + date, map pin + venue, clock + duration — text-secondary, icon coral
Price: JetBrains Mono, text-3xl, coral, "per ticket" muted below
Description: Inter, generous line-height, text-secondary
CTA: "Select Seats" — rounded-full, large, coral, sticky bottom on mobile
Back button: top-left, glassmorphism pill
Auth (Auth.tsx) + AuthCallback (AuthCallback.tsx):
Split screen: left 50% brand panel (gradient + subtle pattern), right 50% form
Form card: rounded-2xl, bg-bg-card, shadow-xl, max-width 420px
Inputs: rounded-xl, floating labels or clear placeholders, coral focus ring
Google button: outlined, white bg, Google colors icon, "Continue with Google"
Divider: "or" with thin lines
Submit: full-width coral button, rounded-xl
Link: "Don't have an account?" — coral text hover
Dark mode: left panel uses dark gradient, right panel bg-bg-card
Profile (Profile.tsx):
Card-based sections: Avatar & Info, Personal Details, Preferences, Danger Zone
Avatar: 96px, rounded-full, ring-4 ring-accent-muted/30, upload hover overlay
Forms: consistent input styling with auth
Save button: coral, rounded-xl
MyTickets (MyTickets.tsx):
Ticket cards: horizontal layout, rounded-2xl, bg-bg-card
Left: event thumbnail, rounded-xl, 120px wide
Right: event name, date, venue, seat info (JetBrains Mono), status badge
QR placeholder: dashed border border-dashed border-border, rounded-xl, 80px
Download: icon button, coral, rounded-full
Empty: illustration + "No tickets yet" + "Browse Events" CTA
TicketGenerator (TicketGenerator.tsx) + TicketDetails (TicketDetails.tsx):
Preview card: premium ticket aesthetic
Top: event image strip, coral gradient overlay
Middle: event name (Space Grotesk), date, venue, seat info (JetBrains Mono 700)
Bottom: QR code area, dashed cut line aesthetic, "Admit One" label
Price: large coral number
Download button: prominent, coral, rounded-full, with download icon
PDF Output: Must visually align — coral header bar, JetBrains Mono for seat/price data, clean layout, not receipt-style
7. Seat Selection (SeatSelection.tsx) — WRAPPER ONLY

CRITICAL: The seat grid layout algorithm, touch interactions, drag-to-select behavior, responsive scaling, seat category mapping, and pricing calculations must remain 100% unchanged.
Allowed changes:
Modal overlay: bg-primary/80 backdrop-blur-sm, Dialog component with rounded-2xl
Modal header: event name (Space Grotesk), stage indicator (coral line), close button (top-right, rounded-full)
Legend: new color tokens — Available (bg-bg-elevated border-border), Selected (bg-accent-primary), Occupied (bg-text-muted/30), VIP (bg-warning/20 border-warning)
Side panel: bg-bg-card, rounded-l-2xl, shadow-xl
Selected seats list: JetBrains Mono for seat labels
Price summary: JetBrains Mono 700, coral total
"Confirm Booking" button: full-width, rounded-xl, coral, hover lift
Zoom controls: rounded-full icon buttons, bg-bg-elevated, subtle shadow
Framer Motion: modal enter = scale(0.95)→1 + opacity 0→1, 200ms
Forbidden changes:
Grid dimensions, cell size, row/column math
Touch event handlers, onTouchStart, onTouchMove, onTouchEnd
preventDefault or touch-action CSS
Seat data structures or selection state logic
8. Admin Pages (Admin.tsx, AdminBookings.tsx, AdminSetup.tsx)

Admin.tsx (Dashboard):
Sidebar: fixed left, bg-bg-secondary, border-r border-border, 240px
Nav items: icon + label, rounded-lg, active = coral left border + bg-accent-bg
Collapsible on mobile to hamburger overlay
Main content:
KPI cards: rounded-2xl, bg-bg-card, icon top-left (coral), large JetBrains Mono number, trend indicator (up/down arrow + %)
Charts (if Recharts/Chart.js): coral primary, bg-bg-elevated secondary, no harsh grid lines
Recent events table: clean minimal rows, hover:bg-bg-elevated, coral action buttons
Header: search bar (pill), notification bell, user avatar
AdminBookings.tsx:
Filter bar: date range, event select, status chips
Table: rounded-2xl, bg-bg-card, sticky header
Columns: Booking ID (JetBrains Mono), Customer, Event, Seats, Amount, Status, Actions
Status badges: success (green), pending (warning), cancelled (error)
Actions: view, download ticket — icon buttons, coral hover
Pagination: minimal, rounded-lg buttons
AdminSetup.tsx:
Step indicator: horizontal, coral active step, muted completed
Forms: consistent with auth page styling
Save/Continue: coral, rounded-xl
9. Global Interactions & Motion

Page transitions: AnimatePresence fade + translateY(16px→0), 200ms ease-out
Button hover: translateY(-2px) + shadow-md, 150ms
Card hover: translateY(-6px) + shadow-lg, image scale(1.03), 200ms
Input focus: ring-2 ring-accent-primary/30 ring-offset-2, 150ms
Skeleton loading: bg-bg-elevated pulse, matching card shapes exactly
Toast: slide from top-right, rounded-xl, bg-bg-card, shadow-lg, auto-dismiss 4s
Scroll: scroll-behavior: smooth globally
Reduced motion: if prefers-reduced-motion, disable all Framer Motion animations, instant transitions only
10. Responsive Strategy

Table


Breakpoint	Behavior
< 640px	Single column, full-width cards, horizontal scroll filters, sticky CTAs, hamburger nav
640–1024px	2 columns, sidebar collapses, adjusted padding
> 1024px	Full layout, 3–4 columns, fixed sidebar on admin, hover states active
11. Accessibility (WCAG 2.1 AA)

Contrast ratios ≥ 4.5:1 for all text in both modes
Focus rings visible on every interactive element (no outline: none without replacement)
Semantic HTML: nav, main, section, article, proper heading hierarchy (h1→h2→h3)
aria-label on icon-only buttons
Color never sole indicator: status icons + text labels
Keyboard navigation: all modals trap focus, Escape closes
12. Implementation Order

Foundation: Design tokens in index.css, Tailwind config extension, Google Fonts import, theme provider update
Base UI: Update all src/components/ui/ shadcn components
Global Shell: Header, Footer, LoadingScreen, ErrorBoundary, OfflineBanner, ScrollToTop
Landing: Hero, FeaturedEvents, Features, Testimonials, Newsletter
User Pages: Events, EventDetail, Auth, Profile, MyTickets, TicketGenerator, TicketDetails
Admin: Admin, AdminBookings, AdminSetup
Seat Map: Modal wrapper, legend, side panel, zoom controls (grid untouched)
Polish: Animation tuning, responsive edge cases, accessibility audit, dark mode QA
