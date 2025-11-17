# TON Payment Platform

## Overview

A comprehensive Web3 payment platform built for the TON blockchain ecosystem, designed to integrate seamlessly with Telegram. The application provides bill splitting, direct payments, invoice management, and merchant payment solutions with real-time updates and QR code generation capabilities.

## Known MVP Limitations

1. **Wallet Balance Display**: Header wallet badge may show "NaN TON" on first load due to async timing. Balance updates correctly in database and dashboard stats. Refresh page or wait for polling cycle to see correct balance.
2. **Balance Polling**: Uses 3-second polling interval for real-time updates instead of WebSocket push notifications.

## Recent Changes

**November 17, 2025:**
- **Mobile-First Responsive Design Enhancements**:
  - Responsive page headers: Flexible layouts (flex-col sm:flex-row) that stack vertically on mobile
  - Responsive typography: Smaller text on mobile (text-2xl sm:text-3xl for headings)
  - Optimized touch targets: Minimum 60px height for all action buttons (min-h-[60px])
  - Mobile-friendly dialogs: Max height of 90vh with overflow scrolling, responsive widths (sm:max-w-[500px])
  - Responsive grids: All grids use grid-cols-1 sm:grid-cols-2 lg:grid-cols-X pattern
  - Adaptive spacing: Reduced padding on mobile (p-3 sm:p-4, gap-4 sm:gap-6)
  - Full-width mobile buttons: Action buttons expand to full width on mobile (w-full sm:w-auto)
  - Responsive QR codes: Adjust size based on screen width (200px for <400px screens, 256px otherwise)
  - Viewport optimization: Meta tag with width=device-width, initial-scale=1.0, maximum-scale=1
- **TON Connect Integration**: Replaced mock wallet system with real TON Connect SDK
  - Installed @tonconnect/ui-react for wallet connection protocol
  - Created tonconnect-manifest.json for app metadata and wallet discovery
  - Implemented real wallet connection via TonConnectUIProvider
  - Wallet connector uses useTonAddress, useTonConnectUI, useTonWallet hooks
  - Supports Tonkeeper, MyTonWallet, and other TON-compatible wallets
- **Real TON Blockchain Integration**:
  - Fetches actual wallet balances from TON testnet using API calls
  - No @ton/ton dependency to avoid Buffer polyfill complexity
  - Direct JSON-RPC calls to testnet.toncenter.com for balance queries
  - Balance updates every 10 seconds when wallet connected
- **Telegram Mini App Integration**: Using @twa-dev/sdk
  - TelegramProvider context wrapper for app-wide Telegram WebApp access
  - Displays Telegram user profile (avatar, name, username) in header
  - App expands to full height in Telegram WebApp with closing confirmation
- **Buffer Polyfill Solution**: Added buffer package polyfill in index.html for browser compatibility

**Previous:**
- PostgreSQL database with DbStorage using Drizzle ORM
- Wallet balance management with React Query (fixes NaN display issues)
- Bill splitting financial logic with automatic balance updates
- Invoice payment flow with balance tracking
- P2P payment system with confirmed transactions

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server with HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing
- Single-page application (SPA) architecture with code splitting

**UI Component System**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Material Design principles adapted for crypto/blockchain context
- Responsive design with mobile-first approach
- Custom theme system supporting light/dark modes via CSS variables

**State Management**
- TanStack Query (React Query) for server state management
- Query client configured with infinite stale time and disabled refetching
- Local state management using React hooks (useState, useEffect)
- WebSocket integration for real-time data synchronization

**Design System**
- Typography: Inter (primary), Space Grotesk (accent), monospace for addresses
- Spacing: Consistent Tailwind units (2, 4, 6, 8, 12, 16)
- Layout: Fixed sidebar (16rem) with responsive mobile drawer
- Color scheme: Neutral base with customizable HSL color variables

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for API endpoints
- HTTP server with WebSocket support for real-time updates
- Custom middleware for request logging and JSON body parsing
- Development and production environment configurations

**API Design**
- RESTful API structure with `/api` prefix
- Resource-based endpoints for wallets, transactions, bills, invoices, and merchant payments
- WebSocket server on `/ws` path for real-time event broadcasting
- Session management using connect-pg-simple for PostgreSQL session store

**Real-time Communication**
- WebSocket server using `ws` library
- Client registration system based on wallet addresses
- Event broadcasting for transaction, bill, invoice, and merchant payment updates
- Automatic query invalidation on client side upon receiving events

### Data Layer

**Database Schema (Drizzle ORM)**
- PostgreSQL database with Neon serverless driver
- Five main tables: wallets, transactions, bills, billParticipants, invoices, merchantPayments
- Decimal precision handling (18 digits, 9 decimal places) for TON amounts
- UUID primary keys generated via `gen_random_uuid()`
- Timestamp tracking with `defaultNow()` for audit trails
- Status-based state management (pending/confirmed/failed for transactions, active/settled/cancelled for bills)

**Storage Interface**
- Abstract storage interface (`IStorage`) defining CRUD operations
- Separation of concerns between business logic and data access
- Support for both in-memory (development) and PostgreSQL (production) implementations

### External Dependencies

**TON Blockchain Integration**
- Mock TON price fetching (designed for real API integration)
- Wallet address generation and validation
- Transaction hash tracking and status management
- QR code generation for payment links using `qrcode.react`

**Third-party Services**
- Neon serverless PostgreSQL for database hosting
- Google Fonts (Inter, Space Grotesk) for typography
- Date-fns for timestamp formatting and manipulation
- Zod for schema validation integrated with Drizzle

**Development Tools**
- Replit-specific plugins for dev banner, runtime error overlay, and cartographer
- ESBuild for server-side bundling in production
- TypeScript for compile-time type checking
- Drizzle Kit for database migrations

**UI Libraries**
- Radix UI for accessible, unstyled component primitives (30+ components)
- Lucide React for consistent iconography
- Embla Carousel for carousel functionality
- Class Variance Authority (CVA) for component variant management
- Tailwind Merge and clsx for conditional class name composition