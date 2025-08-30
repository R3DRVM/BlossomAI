# Blossom - DeFi Yield Optimization Terminal

## Overview

Blossom is a sophisticated DeFi yield optimization platform that provides institutional-grade trading terminal interface for yield farming strategies. The application combines real-time yield opportunity aggregation, AI-powered strategy building, portfolio risk assessment, and conversational AI assistance to help users maximize returns across 100+ DeFi protocols.

The platform features a terminal-style interface inspired by institutional trading platforms, with multiple panels displaying yield opportunities, performance charts, risk metrics, and an interactive chat assistant. Users can build custom yield strategies through a visual node-based builder and monitor their portfolio performance in real-time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built using **React 18 with TypeScript**, utilizing a modern component-based architecture. The UI framework leverages **shadcn/ui components** built on top of **Radix UI primitives** for accessibility and consistency. **Tailwind CSS** provides utility-first styling with custom CSS variables for theming support (light/dark modes).

The application uses **Wouter** for lightweight client-side routing and **TanStack Query (React Query)** for server state management with optimistic updates and caching. The terminal interface is organized into resizable panels using a grid-based layout system, with components like YieldOverview, StrategyBuilder, PerformanceChart, RiskMetrics, and ChatSidebar.

### Backend Architecture

The backend follows a **Node.js/Express.js** architecture with TypeScript for type safety. The application uses an **MVC-like pattern** with separate concerns:

- **Routes layer** (`server/routes.ts`) - Handles HTTP endpoints and WebSocket connections
- **Storage layer** (`server/storage.ts`) - Abstracts database operations with a clean interface
- **Database layer** (`server/db.ts`) - Neon PostgreSQL connection with Drizzle ORM

The server implements **session-based authentication** using Replit's OpenID Connect integration, with sessions stored in PostgreSQL. Real-time features are handled through **WebSocket connections** for live yield updates and chat functionality.

### Data Storage Solutions

The application uses **PostgreSQL as the primary database** via **Neon Database** (serverless PostgreSQL). Database schema and migrations are managed through **Drizzle ORM** with TypeScript-first approach, providing type-safe database queries and automatic schema validation.

Key database entities include:
- Users (Replit Auth integration)
- Protocols (DeFi protocol information)
- Yield Opportunities (real-time APY data)
- Strategies (user-created yield strategies)
- Portfolio Positions (user investments)
- Chat Messages (AI assistant conversations)
- Risk Assessments (strategy risk evaluations)
- Sessions (authentication state)

### Authentication and Authorization

The application implements **Replit Authentication** using OpenID Connect (OIDC) flow with **Passport.js** strategy. Session management uses **express-session** with PostgreSQL session store for persistence. All API endpoints are protected with `isAuthenticated` middleware that validates session state.

User profile data is automatically synchronized from Replit's user information, including email, name, and profile image. The authentication system supports automatic session refresh and graceful handling of expired sessions.

### Real-time Features

**WebSocket integration** provides real-time updates for:
- Live yield opportunity data from DeFi protocols
- Portfolio performance metrics
- Chat message delivery
- Strategy execution status

The WebSocket server maintains connection state and handles automatic reconnection with exponential backoff. Real-time data is synchronized across multiple client sessions for the same user.

## External Dependencies

### DeFi Protocol Integration

The platform aggregates yield opportunities from **100+ DeFi protocols** across multiple blockchains including Ethereum, Solana, and other major ecosystems. Protocol data is fetched through various APIs and on-chain data sources, with real-time APY updates and TVL tracking.

### Database Services

- **Neon Database** - Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM** - Type-safe database queries and schema management
- Session storage with automatic cleanup and TTL management

### UI Component Libraries

- **shadcn/ui** - High-quality React component library
- **Radix UI** - Accessible primitive components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library with consistent design

### Development and Build Tools

- **Vite** - Fast build tool with HMR support
- **TypeScript** - Type safety across frontend and backend
- **ESBuild** - Fast JavaScript bundler for production builds
- **Replit Development Environment** - Cloud-based development platform

### Authentication Services

- **Replit OpenID Connect** - Authentication provider
- **Passport.js** - Authentication middleware
- **Express Session** - Session management with PostgreSQL storage

### Monitoring and Analytics

The platform includes built-in request logging, error tracking, and performance monitoring. WebSocket connections are monitored for health and automatic reconnection handling.