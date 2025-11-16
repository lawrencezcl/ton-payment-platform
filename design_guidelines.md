# TON Payment Platform Design Guidelines

## Design Approach

**Selected System**: Material Design adapted for TON blockchain ecosystem
**Reference Inspiration**: Stripe Dashboard (clean financial UI) + Telegram's interface patterns (familiar to target users)
**Design Principles**: Trust through clarity, crypto-native simplicity, instant visual feedback, Telegram-familiar navigation

## Typography Hierarchy

**Primary Font**: Inter (Google Fonts) - modern, highly legible for financial data
**Accent Font**: Space Grotesk (Google Fonts) - for headings and emphasis

**Scale**:
- Display: text-4xl font-bold (page titles, empty states)
- Heading 1: text-2xl font-semibold (section headers)
- Heading 2: text-xl font-semibold (card titles, modals)
- Body: text-base font-normal (primary content)
- Small: text-sm font-medium (labels, meta info)
- Tiny: text-xs font-normal (timestamps, helper text)
- Mono: font-mono text-sm (wallet addresses, transaction hashes)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 consistently
- Component padding: p-4, p-6, p-8
- Section gaps: gap-4, gap-6, gap-8
- Margins: m-4, m-6, m-8
- Icon sizing: h-5 w-5 (small), h-6 w-6 (medium), h-8 w-8 (large)

**Grid System**:
- Dashboard: Sidebar (w-64 fixed) + Main content (flex-1)
- Mobile: Full-width stack, collapsible sidebar drawer
- Cards: Grid with responsive columns (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Transaction lists: Single column with full-width cards

**Container Strategy**:
- Max width: max-w-7xl for main content areas
- Card max width: max-w-md for focused actions (send payment, create invoice)
- Full width: Transaction tables and lists

## Component Library

### Navigation
**Sidebar Navigation** (Desktop):
- Fixed left sidebar with logo at top
- Navigation items with icons (Heroicons) + labels
- Active state with indicator bar (border-l-4)
- Sections: Dashboard, Bill Splitting, Payments, Invoices, Transactions
- Bottom: Wallet connection status + user profile

**Mobile Navigation**:
- Bottom navigation bar with 4 primary items + overflow menu
- Hamburger menu for full navigation drawer

### Dashboard Components

**Stat Cards**:
- Grid layout showing: Total Balance, Pending Bills, Active Invoices, Recent Transactions
- Large number display (text-3xl font-bold)
- Label below (text-sm)
- Trend indicator with small icon
- Card padding: p-6

**Quick Actions Bar**:
- Horizontal scrollable buttons (on mobile)
- Primary actions: Send Payment, Request Payment, Split Bill, Create Invoice
- Icon + label layout

### Financial Components

**Payment Cards**:
- Clean card design with consistent padding (p-6)
- Header: Amount (large, bold) + Currency (TON symbol)
- Meta row: Status badge + timestamp
- Description/memo text
- Footer: Action buttons (Accept, Decline, View Details)

**Transaction List Items**:
- Two-column layout: Left (icon + description) | Right (amount + status)
- Icon indicates type: sent, received, split, invoice
- Amount with + or - prefix
- Timestamp in text-xs below description
- Divider between items (border-b)

**Bill Splitting Interface**:
- Participant avatars in horizontal row
- Expense items as expandable list
- Individual shares displayed per person
- Settlement summary showing who owes whom
- "Settle Up" prominent CTA

### Forms & Inputs

**Amount Input**:
- Extra large text input (text-3xl) for entering amounts
- TON symbol prefix
- USD conversion displayed below in text-sm
- Clear visual focus state

**Wallet Address Input**:
- Monospace font for addresses
- "Paste" button integrated
- QR scan button (on mobile)
- Address validation indicator

**Invoice Builder**:
- Line items with add/remove rows
- Description + amount fields per row
- Subtotal calculation displayed
- Optional: Due date, memo, recipient

### Action Components

**Payment Modals**:
- Centered modal (max-w-md)
- Header with close button
- Form content area (p-6)
- Footer with action buttons
- Confirmation step shows: recipient, amount, fee estimate

**QR Code Display**:
- Large QR code (256x256px minimum)
- Share button below
- Copy payment link button
- Time expiry countdown for invoices

### Data Display

**Transaction Table** (Desktop):
- Columns: Date, Type, Description, Amount, Status, Actions
- Sortable headers
- Row hover state
- Pagination at bottom

**Status Badges**:
- Small pill shapes (px-3 py-1 rounded-full text-xs font-medium)
- States: Pending, Confirmed, Failed, Settled, Overdue
- Icon prefix for quick scanning

**Empty States**:
- Centered illustration placeholder
- Heading explaining the empty state
- Descriptive text
- Primary CTA to take first action

## Wallet Connection

**Connected State**:
- Compact display: Avatar + truncated address + TON balance
- Dropdown menu: View full address, Copy address, Disconnect

**Not Connected State**:
- Prominent "Connect Wallet" button
- TonConnect modal with wallet options
- Trust indicators (secure, non-custodial messaging)

## Icon Library

**Heroicons** (via CDN) for all UI icons:
- Navigation: home, credit-card, receipt-percent, document-text, clock
- Actions: paper-airplane (send), arrow-down-tray (receive), plus, x-mark
- Status: check-circle, x-circle, clock, exclamation-triangle
- Utility: qr-code, copy, share, chevrons, user-circle

## Images

**No Hero Image**: This is a dashboard application, not a marketing site. Lead directly with functional interface.

**Illustrations**:
- Empty states: Use simple line illustrations for "no transactions," "no bills," "no invoices"
- Style: Minimalist, single-tone outline illustrations
- Placement: Centered in empty content areas with max-w-xs

**User Avatars**:
- Circular avatars for bill splitting participants
- Initials fallback for users without photos
- Size: h-10 w-10 standard, h-8 w-8 for lists

**QR Codes**:
- Generated dynamically for payment requests
- White background with padding
- High contrast for scanning reliability

## Responsive Strategy

**Breakpoints**:
- Mobile: < 768px (stack all, bottom nav, full-width cards)
- Tablet: 768px - 1024px (2-column grids, sidebar visible)
- Desktop: > 1024px (3-column grids, persistent sidebar)

**Mobile Optimizations**:
- Large tap targets (min h-12)
- Thumb-friendly bottom navigation
- Swipe gestures for transaction actions
- Full-screen modals instead of centered

## Accessibility

- All interactive elements have min 44x44px touch targets
- Form inputs with associated labels
- Error messages clearly linked to fields
- Keyboard navigation support throughout
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- ARIA labels for icon-only buttons
- Transaction amounts announced with currency context