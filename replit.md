# TON Payment Platform

## Overview

A comprehensive Web3 payment platform built for the TON blockchain ecosystem, designed to integrate seamlessly with Telegram. The application provides bill splitting, direct payments, invoice management, and merchant payment solutions with real-time updates and QR code generation capabilities.

## Known MVP Limitations

1. **Wallet Balance Display**: Header wallet badge may show "NaN TON" on first load due to async timing. Balance updates correctly in database and dashboard stats. Refresh page or wait for polling cycle to see correct balance.
2. **Balance Polling**: Uses 3-second polling interval for real-time updates instead of WebSocket push notifications.

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