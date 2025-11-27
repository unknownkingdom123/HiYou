# ClgBooksAI Bot - Design Guidelines

## Design Approach: Modern Productivity System

**Selected Approach:** Design System with productivity tool references (Linear, Notion, Vercel Dashboard)

**Rationale:** Educational productivity tool requiring clear information hierarchy, data-rich interfaces, and efficient user workflows. Dark-first design aligns with modern developer/student tools that reduce eye strain during extended use.

---

## Core Design Principles

1. **Information Clarity First** - Data and content take precedence over decoration
2. **Dark Mode Excellence** - Default dark theme optimized for readability and extended sessions
3. **Purposeful Minimalism** - Clean interfaces that guide users efficiently through tasks
4. **Consistent Patterns** - Predictable interactions across authentication, chat, and dashboards

---

## Typography

**Font Families:**
- Primary: Inter (via Google Fonts CDN) - all UI text
- Monospace: JetBrains Mono - MIS numbers, file sizes, technical data

**Hierarchy:**
- Page Headings: text-3xl md:text-4xl font-bold
- Section Titles: text-xl md:text-2xl font-semibold
- Card Headings: text-lg font-medium
- Body Text: text-base font-normal
- Small Text/Labels: text-sm
- Metadata/Captions: text-xs

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 4, 6, 8, 12, 16, 24
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-24
- Card gaps: gap-6 to gap-8
- Button padding: px-6 py-3

**Container Strategy:**
- Auth pages: max-w-md mx-auto
- Dashboards: max-w-7xl mx-auto px-4
- Chat interface: max-w-3xl mx-auto
- Admin panels: max-w-6xl mx-auto

---

## Component Library

### Authentication Pages (Sign Up/Login/Forgot Password)

**Layout:**
- Centered card on neutral background
- Logo/branding at top: "ClgBooksAI Bot" text-2xl font-bold
- Home page link in top-right corner
- Form card: bg-surface, rounded-lg, shadow-lg, p-8
- Footer: "Created By AVISHKAR 💡 [ EE ]" at bottom, text-sm, centered

**Form Elements:**
- Input fields: Full-width, rounded-md, border, px-4 py-3
- Labels: text-sm font-medium, mb-2
- Show/Hide password: Eye icon button inside input (right side)
- Password strength indicator for signup
- OTP input: 6-digit grid layout with individual boxes
- Checkbox (Remember Me): Rounded checkbox with label
- Primary CTA: Full-width, rounded-md, py-3, font-medium
- Secondary links: text-sm, underline-offset-4

**Sign Up Specific:**
- Fields stack vertically with gap-4
- Password + Confirm Password side-by-side on desktop (grid-cols-2)
- Mobile verification badge after OTP success

**Forgot Password Flow:**
- Toggle between Email/Mobile recovery options
- OTP verification step with resend timer
- Password reset form with confirmation

### AI Chatbot Interface

**Layout:**
- Full-height chat container (min-h-screen minus header/footer)
- Messages area: Scrollable, pb-24 for input clearance
- Fixed input bar at bottom: sticky bottom-0, backdrop-blur

**Message Components:**
- User messages: Right-aligned, max-w-md, bg-accent, rounded-2xl, px-4 py-3
- Bot messages: Left-aligned, max-w-lg, bg-surface, rounded-2xl, px-4 py-3
- PDF result cards within bot messages:
  - Border, rounded-lg, p-4, mt-3
  - Book icon + title (text-lg font-semibold)
  - Author, category, file size (text-sm)
  - Download button: Primary CTA, full-width
  - Similar matches: Compact list below, text-sm

**Input Area:**
- Text input: flex-1, rounded-full, px-6 py-3, border
- Send button: Icon button, rounded-full, icon: Heroicons paper-airplane
- Character count: text-xs, subtle

### User Dashboard

**Header Section:**
- Welcome message: text-2xl font-bold, mb-2
- Profile summary card: Flex layout, avatar placeholder + name/email/stats

**Previous Downloads Section:**
- Title: "Previous Downloads" text-xl font-semibold, mb-6
- Book cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6
- Individual book card:
  - PDF icon (large) or thumbnail placeholder
  - Book title: text-lg font-medium, line-clamp-2
  - Author + category: text-sm
  - Download date: text-xs
  - Re-download button: Secondary style, full-width

**Stats Cards:**
- 3-column grid on desktop, stack on mobile
- Each stat: bg-surface, rounded-lg, p-6
- Icon + number (text-3xl font-bold) + label (text-sm)

### Admin Dashboard

**Navigation:**
- Sidebar on desktop (w-64), slide-out on mobile
- Navigation items: px-4 py-3, rounded-md, icon + label
- Active state: bg-accent/10, font-medium

**Upload PDF Section:**
- Drag-and-drop zone: border-2 border-dashed, rounded-lg, p-12, text-center
- Upload icon (Heroicons cloud-arrow-up)
- Form fields: 2-column grid on desktop, full-width on mobile
- Tag input: Pills with remove buttons

**Manage Library:**
- Data table: Full-width, rounded-lg, overflow-hidden
- Table headers: bg-surface, font-medium, px-4 py-3
- Table rows: hover:bg-surface/50, border-b
- Action buttons: Icon buttons (edit, delete) with tooltips

**User Management:**
- User list: Card-based layout, not table
- Each user card: flex layout, avatar + info + stats + actions
- Download history: Expandable section within card

---

## Dark Mode Specifications

**Default (Dark):**
- Background: Near-black with slight warmth
- Surface: Elevated dark gray
- Text: High-contrast white/light gray
- Accent: Vibrant blue for CTAs and active states
- Borders: Subtle gray with low opacity

**Light Mode Toggle:**
- Icon button in top-right corner (all pages)
- Sun/Moon icon (Heroicons)
- Smooth transition: transition-colors duration-200

---

## Icons

**Library:** Heroicons (via CDN)
- Navigation: outline style
- Buttons: solid style  
- Status indicators: mini style

---

## Special Components

**Theme Toggle Button:**
- Fixed position: top-right on auth pages, header on dashboards
- Rounded-full, p-2, hover state
- Icon switches based on current theme

**Footer (All Pages):**
- Centered text, text-sm
- "Created By AVISHKAR 💡 [ EE ]"
- py-8, border-t

**Branding:**
- "ClgBooksAI Bot" appears consistently in headers
- Logo placeholder: Robot/AI icon + text

---

## Images

No hero images required. This is a utility-focused application where clarity and functionality take priority. Use icon placeholders for PDF thumbnails and user avatars throughout the interface.