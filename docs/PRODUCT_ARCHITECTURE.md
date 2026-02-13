# PRODUCT_ARCHITECTURE.md

**Project**: cPort Credit Union Translation Tool  
**Purpose**: Complete Technical Architecture, Data Flow & Authentication Design  
**Last Updated**: February 2026  
**Phase**: MVP Production Architecture

---

## EXECUTIVE SUMMARY

This document defines the complete product architecture for cPort's real-time translation tool, optimized for a credit union environment requiring bank-grade security, GLBA compliance, and seamless member experiences across six languages.

---

## TECHNOLOGY STACK OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CPORT TRANSLATION TOOL                             │
│                        PRODUCTION ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         PRESENTATION LAYER                          │   │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│   │  │  Greeter  │  │  Teller   │  │ Consultor │  │   Admin   │        │   │
│   │  │   iPad    │  │  Desktop  │  │  Desktop  │  │   Web     │        │   │
│   │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘        │   │
│   │        │              │              │              │               │   │
│   │        └──────────────┴──────────────┴──────────────┘               │   │
│   │                              │                                       │   │
│   │                    React 18 + TypeScript 5                          │   │
│   │                    Vite 5 + TanStack Query                          │   │
│   │                    Tailwind CSS 3.4                                  │   │
│   │                    Framer Motion                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                          WebSocket │ REST API                               │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         APPLICATION LAYER                           │   │
│   │                                                                     │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │                    API GATEWAY (Nginx)                      │   │   │
│   │   │              Rate Limiting · SSL Termination                │   │   │
│   │   └─────────────────────────────────────────────────────────────┘   │   │
│   │                              │                                      │   │
│   │   ┌───────────────────────────────────────────────────────────┐     │   │
│   │   │                 Node.js 20 LTS + Express 4                │     │   │
│   │   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │     │   │
│   │   │  │  Auth    │  │ Session  │  │  Queue   │  │ Transl.  │  │     │   │
│   │   │  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │     │   │
│   │   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │     │   │
│   │   │                                                           │     │   │
│   │   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │     │   │
│   │   │  │  Audit   │  │  Speech  │  │ Emotion  │  │  Email   │  │     │   │
│   │   │  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │     │   │
│   │   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │     │   │
│   │   └───────────────────────────────────────────────────────────┘     │   │
│   │                              │                                      │   │
│   │   ┌───────────────────────────────────────────────────────────┐     │   │
│   │   │              Socket.io 4.x (Real-time Layer)              │     │   │
│   │   │         Redis Adapter for Multi-Instance Support          │     │   │
│   │   └───────────────────────────────────────────────────────────┘     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                          DATA LAYER                                 │   │
│   │                                                                     │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│   │  │   PostgreSQL    │  │     Redis       │  │   File System   │     │   │
│   │  │     16.x        │  │      7.x        │  │    (Uploads)    │     │   │
│   │  │                 │  │                 │  │                 │     │   │
│   │  │  - Users        │  │  - Sessions     │  │  - Documents    │     │   │
│   │  │  - Sessions     │  │  - Queue Cache  │  │  - Audio Files  │     │   │
│   │  │  - Translations │  │  - Rate Limits  │  │  - Exports      │     │   │
│   │  │  - Audit Logs   │  │  - Pub/Sub      │  │                 │     │   │
│   │  │  - Feedback     │  │                 │  │                 │     │   │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│   │                                                                     │   │
│   │                     Prisma ORM 5.x                                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       EXTERNAL SERVICES                             │   │
│   │                                                                     │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │  │   Google     │  │   OpenAI     │  │    Hume      │              │   │
│   │  │   Cloud      │  │   Whisper    │  │     AI       │              │   │
│   │  │ Translation  │  │     API      │  │  (Emotion)   │              │   │
│   │  │     API      │  │              │  │              │              │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   │                                                                     │   │
│   │  ┌──────────────┐  ┌──────────────┐                                │   │
│   │  │    SMTP      │  │   Twilio     │                                │   │
│   │  │   (Email)    │  │  (SMS-Opt)   │                                │   │
│   │  └──────────────┘  └──────────────┘                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FRONTEND STACK (Detailed)

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI component library with Concurrent Features |
| **TypeScript** | 5.3+ | Type safety and developer experience |
| **Vite** | 5.x | Build tool with HMR and optimized production builds |

### State Management & Data Fetching

| Technology | Version | Purpose |
|------------|---------|---------|
| **TanStack Query** | 5.x | Server state management, caching, mutations |
| **Zustand** | 4.x | Lightweight client state (UI preferences) |
| **React Context** | Built-in | Theme, auth state, real-time connection |

### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.4+ | Utility-first styling with custom design tokens |
| **Framer Motion** | 10.x | Fluid animations and micro-interactions |
| **Radix UI** | Latest | Accessible, unstyled primitive components |
| **Lucide React** | Latest | Beautiful, consistent icon set |

### Real-time & Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Socket.io Client** | 4.x | WebSocket connection for real-time updates |
| **Web Speech API** | Native | Browser-based speech recognition |
| **MediaRecorder API** | Native | Audio capture for translation |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 8.x | Code quality and consistency |
| **Prettier** | 3.x | Code formatting |
| **Vitest** | Latest | Unit testing framework |
| **Playwright** | Latest | E2E testing |

### Folder Structure

```
src/
├── app/                    # App-level setup
│   ├── App.tsx
│   ├── providers.tsx       # Context providers wrapper
│   └── router.tsx          # Route definitions
├── components/
│   ├── ui/                 # Atomic design system components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── common/             # Shared components
│   │   ├── Header.tsx
│   │   ├── LanguageSelector.tsx
│   │   └── TranslationPanel.tsx
│   ├── greeter/            # Greeter-specific components
│   ├── teller/             # Teller-specific components
│   ├── consultor/          # Consultor-specific components
│   └── admin/              # Admin-specific components
├── features/               # Feature-based modules
│   ├── auth/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── services/
│   ├── translation/
│   ├── queue/
│   └── sessions/
├── hooks/                  # Shared custom hooks
├── lib/                    # Utilities and helpers
│   ├── api.ts              # API client configuration
│   ├── socket.ts           # Socket.io client
│   └── utils.ts
├── stores/                 # Zustand stores
├── styles/                 # Global styles
│   ├── tokens.css          # Design tokens as CSS vars
│   └── globals.css
└── types/                  # TypeScript type definitions
```

---

## BACKEND STACK (Detailed)

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20 LTS | JavaScript runtime |
| **Express** | 4.18+ | Web framework |
| **TypeScript** | 5.3+ | Type safety |

### Database & ORM

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 16.x | Primary relational database |
| **Prisma** | 5.x | Type-safe ORM with migrations |
| **Redis** | 7.x | Caching, sessions, pub/sub |

### Real-time

| Technology | Version | Purpose |
|------------|---------|---------|
| **Socket.io** | 4.x | WebSocket server |
| **@socket.io/redis-adapter** | Latest | Multi-instance socket scaling |

### Security

| Technology | Version | Purpose |
|------------|---------|---------|
| **bcryptjs** | 2.x | Password hashing |
| **jsonwebtoken** | 9.x | JWT token generation/verification |
| **helmet** | 7.x | Security headers |
| **cors** | 2.x | Cross-origin request handling |
| **express-rate-limit** | 7.x | Rate limiting |

### API & Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| **zod** | 3.x | Runtime schema validation |
| **express-validator** | 7.x | Request validation middleware |

### Logging & Monitoring

| Technology | Version | Purpose |
|------------|---------|---------|
| **winston** | 3.x | Structured logging |
| **morgan** | 1.x | HTTP request logging |

### Folder Structure

```
server/
├── src/
│   ├── index.ts            # Entry point
│   ├── app.ts              # Express app setup
│   ├── config/
│   │   ├── env.ts          # Environment variables
│   │   ├── database.ts     # Database connection
│   │   └── redis.ts        # Redis connection
│   ├── middleware/
│   │   ├── auth.ts         # JWT verification
│   │   ├── validation.ts   # Request validation
│   │   ├── rateLimiter.ts  # Rate limiting
│   │   └── errorHandler.ts # Global error handler
│   ├── routes/
│   │   ├── auth.ts         # /api/auth/*
│   │   ├── sessions.ts     # /api/sessions/*
│   │   ├── translations.ts # /api/translations/*
│   │   ├── queue.ts        # /api/queue/*
│   │   └── admin.ts        # /api/admin/*
│   ├── services/
│   │   ├── authService.ts
│   │   ├── sessionService.ts
│   │   ├── translationService.ts
│   │   ├── queueService.ts
│   │   ├── speechService.ts
│   │   ├── emotionService.ts
│   │   ├── auditService.ts
│   │   └── emailService.ts
│   ├── socket/
│   │   ├── index.ts        # Socket.io setup
│   │   ├── handlers/       # Event handlers
│   │   └── middleware/     # Socket middleware
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── errors.ts       # Custom error classes
│   │   └── helpers.ts
│   └── types/
│       └── index.ts        # Type definitions
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration files
│   └── seed.ts             # Seed data
└── tests/
    ├── unit/
    └── integration/
```

---

## AUTHENTICATION SYSTEM

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                          LOGIN FLOW                                  │  │
│   │                                                                      │  │
│   │  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐     │  │
│   │  │  User   │ ──▶  │ Express │ ──▶  │  Auth   │ ──▶  │Postgres │     │  │
│   │  │ Browser │      │   API   │      │ Service │      │  Users  │     │  │
│   │  └────┬────┘      └────┬────┘      └────┬────┘      └────┬────┘     │  │
│   │       │                │                │                │          │  │
│   │       │  POST /login   │                │                │          │  │
│   │       │  {user, pass}  │                │                │          │  │
│   │       │───────────────▶│                │                │          │  │
│   │       │                │  Validate      │                │          │  │
│   │       │                │───────────────▶│                │          │  │
│   │       │                │                │   Find User    │          │  │
│   │       │                │                │───────────────▶│          │  │
│   │       │                │                │   User Data    │          │  │
│   │       │                │                │◀───────────────│          │  │
│   │       │                │                │                │          │  │
│   │       │                │  Compare Hash  │                │          │  │
│   │       │                │◀───────────────│                │          │  │
│   │       │                │                │                │          │  │
│   │       │   JWT Tokens   │                │                │          │  │
│   │       │◀───────────────│                │                │          │  │
│   │       │                │                │                │          │  │
│   │       │  Store Tokens  │                │                │          │  │
│   │       │  (HttpOnly     │                │                │          │  │
│   │       │   Cookie)      │                │                │          │  │
│   │       │                │                │                │          │  │
│   └───────┴────────────────┴────────────────┴────────────────┴──────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### JWT Token Structure

```typescript
// Access Token (15 minute expiry)
{
  "sub": "user_cuid_12345",        // User ID
  "email": "staff@cportcu.org",
  "role": "TELLER",                // UserRole enum
  "branchId": "forest-avenue",
  "firstName": "Sarah",
  "permissions": [
    "translation:read",
    "translation:create",
    "session:read",
    "session:update",
    "queue:read",
    "queue:manage"
  ],
  "iat": 1708358400,               // Issued at
  "exp": 1708359300                // Expires in 15 min
}

// Refresh Token (7 day expiry, stored in HttpOnly cookie)
{
  "sub": "user_cuid_12345",
  "tokenFamily": "tf_abc123",      // For rotation tracking
  "iat": 1708358400,
  "exp": 1708963200
}
```

### Role-Based Access Control (RBAC)

```typescript
const ROLE_PERMISSIONS = {
  GREETER: [
    'translation:read',
    'translation:create',
    'session:create',
    'session:read',
    'session:update',
    'queue:read',
    'queue:create'
  ],
  
  TELLER: [
    'translation:read',
    'translation:create',
    'session:read',
    'session:update',
    'queue:read',
    'queue:manage',
    'queue:complete'
  ],
  
  CONSULTOR: [
    'translation:read',
    'translation:create',
    'session:read',
    'session:update',
    'session:extend',
    'queue:read',
    'queue:manage',
    'document:upload',
    'document:translate'
  ],
  
  MANAGER: [
    '...all consultor permissions',
    'analytics:read',
    'staff:read',
    'session:delete',
    'feedback:read'
  ],
  
  ADMIN: [
    '*'  // All permissions
  ]
};
```

### Security Measures

```yaml
Password Requirements:
  - Minimum 12 characters
  - At least one uppercase letter
  - At least one lowercase letter  
  - At least one number
  - At least one special character
  - Bcrypt with cost factor 12

Session Security:
  - Access token in memory (XSS protection)
  - Refresh token in HttpOnly, Secure, SameSite=Strict cookie
  - Token rotation on each refresh
  - Automatic logout on suspicious activity
  - Max 3 concurrent sessions per user

Rate Limiting:
  - Login: 5 attempts per 15 minutes per IP
  - API: 100 requests per minute per user
  - Translation: 30 requests per minute per user

Audit Logging:
  - All authentication events logged
  - Failed login attempts tracked
  - Session creation/termination logged
  - All API calls logged with user context
```

---

## DATA FLOW ARCHITECTURE

### Real-time Translation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REAL-TIME TRANSLATION DATA FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   STAFF DEVICE                    SERVER                    EXTERNAL APIs   │
│   ───────────                    ──────                    ─────────────   │
│                                                                             │
│   ┌───────────┐                                                             │
│   │  Capture  │                                                             │
│   │   Audio   │                                                             │
│   └─────┬─────┘                                                             │
│         │                                                                   │
│         ▼                                                                   │
│   ┌───────────┐                                                             │
│   │  Web      │                                                             │
│   │  Speech   │──── Speech-to-Text ─────┐                                  │
│   │  API      │      (Browser)          │                                  │
│   └───────────┘                         │                                  │
│         │                               │                                   │
│         │ (or fallback)                 │                                   │
│         ▼                               ▼                                   │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                         WebSocket                                 │    │
│   │              event: 'audio:chunk' or 'text:translate'            │    │
│   └───────────────────────────────────────────────────────────────────┘    │
│         │                                                                   │
│         ▼                                                                   │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                     Socket.io Server                              │    │
│   │                                                                   │    │
│   │   1. Validate session & permissions                               │    │
│   │   2. Parse incoming data                                          │    │
│   │   3. Route to appropriate service                                 │    │
│   └─────────────────────────┬─────────────────────────────────────────┘    │
│                             │                                               │
│         ┌───────────────────┼───────────────────┐                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│   ┌───────────┐       ┌───────────┐       ┌───────────┐                    │
│   │  Speech   │       │Translation│       │  Emotion  │                    │
│   │  Service  │       │  Service  │       │  Service  │                    │
│   └─────┬─────┘       └─────┬─────┘       └─────┬─────┘                    │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│   ┌───────────┐       ┌───────────┐       ┌───────────┐                    │
│   │  OpenAI   │       │  Google   │       │   Hume    │                    │
│   │  Whisper  │       │  Cloud    │       │    AI     │                    │
│   │           │       │Translation│       │           │                    │
│   └─────┬─────┘       └─────┬─────┘       └─────┬─────┘                    │
│         │                   │                   │                          │
│         └───────────────────┴───────────────────┘                          │
│                             │                                               │
│                             ▼                                               │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                    Response Aggregator                            │    │
│   │                                                                   │    │
│   │   {                                                               │    │
│   │     "sessionId": "sess_abc123",                                   │    │
│   │     "translationId": "trans_xyz789",                              │    │
│   │     "originalText": "Preciso abrir uma conta",                    │    │
│   │     "translatedText": "I need to open an account",                │    │
│   │     "sourceLanguage": "pt",                                       │    │
│   │     "targetLanguage": "en",                                       │    │
│   │     "confidence": 0.94,                                           │    │
│   │     "emotion": { "calm": 0.7, "anxious": 0.2 },                   │    │
│   │     "processingTimeMs": 847                                       │    │
│   │   }                                                               │    │
│   └─────────────────────────┬─────────────────────────────────────────┘    │
│                             │                                               │
│         ┌───────────────────┼───────────────────┐                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│   ┌───────────┐       ┌───────────┐       ┌───────────┐                    │
│   │ PostgreSQL│       │   Redis   │       │  Socket   │                    │
│   │  (Store)  │       │  (Cache)  │       │ (Emit)    │                    │
│   └───────────┘       └───────────┘       └─────┬─────┘                    │
│                                                 │                          │
│                                                 ▼                          │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                     All Session Clients                           │    │
│   │                                                                   │    │
│   │   ┌─────────┐     ┌─────────┐     ┌─────────┐                    │    │
│   │   │ Greeter │     │ Teller  │     │ Display │                    │    │
│   │   │  iPad   │     │ Desktop │     │ Monitor │                    │    │
│   │   └─────────┘     └─────────┘     └─────────┘                    │    │
│   └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Queue Management Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         QUEUE MANAGEMENT FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   GREETER                         SYSTEM                          TELLER   │
│   ───────                         ──────                          ──────   │
│                                                                             │
│   ┌─────────────┐                                                          │
│   │  Customer   │                                                          │
│   │  Arrives    │                                                          │
│   └──────┬──────┘                                                          │
│          │                                                                  │
│          ▼                                                                  │
│   ┌─────────────┐                                                          │
│   │  Language   │                                                          │
│   │  Selection  │                                                          │
│   └──────┬──────┘                                                          │
│          │                                                                  │
│          ▼                                                                  │
│   ┌─────────────┐                                                          │
│   │ Translation │                                                          │
│   │  Session    │─────────────────────────────────────────────────────────▶│
│   └──────┬──────┘                                                          │
│          │                                                                  │
│          │                 ┌─────────────┐                                  │
│          │                 │   AI Triage │                                  │
│          │                 │  Analysis   │                                  │
│          │                 │             │                                  │
│          │                 │ Keywords ──▶│ Service Type                    │
│          │                 │ Emotion ───▶│ Priority                        │
│          │                 │ Context ───▶│ Wait Estimate                   │
│          │                 └──────┬──────┘                                  │
│          │                        │                                         │
│          ▼                        ▼                                         │
│   ┌─────────────┐          ┌─────────────┐                                  │
│   │   Service   │          │   Queue     │          ┌─────────────┐        │
│   │   Type      │◀─────────│   Item      │─────────▶│   Queue     │        │
│   │  Selection  │          │  Created    │          │  Dashboard  │        │
│   └──────┬──────┘          └──────┬──────┘          └──────┬──────┘        │
│          │                        │                        │               │
│          ▼                        │                        ▼               │
│   ┌─────────────┐                │                  ┌─────────────┐        │
│   │   Assign    │                │                  │  Real-time  │        │
│   │  to Queue   │                │                  │   Update    │        │
│   └──────┬──────┘                │                  │  via Socket │        │
│          │                        │                  └──────┬──────┘        │
│          │                        │                         │               │
│          │         ┌──────────────┴──────────────┐          │               │
│          │         │                             │          │               │
│          │         ▼                             ▼          │               │
│          │   ┌───────────┐               ┌───────────┐      │               │
│          │   │  Redis    │               │ PostgreSQL│      │               │
│          │   │  Queue    │               │  Session  │      │               │
│          │   │  Cache    │               │   Store   │      │               │
│          │   └───────────┘               └───────────┘      │               │
│          │                                                   │               │
│          │◀──────────────────────────────────────────────────│               │
│          │         Handoff Complete Notification             │               │
│          │                                                   │               │
│          ▼                                                   ▼               │
│   ┌─────────────┐                                    ┌─────────────┐        │
│   │   Ready     │                                    │   "CALL"    │        │
│   │  for Next   │                                    │   Button    │        │
│   │  Customer   │                                    │   Active    │        │
│   └─────────────┘                                    └──────┬──────┘        │
│                                                             │               │
│                                                             ▼               │
│                                                      ┌─────────────┐        │
│                                                      │  Session    │        │
│                                                      │ Continues   │        │
│                                                      │ with Teller │        │
│                                                      └─────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DATA STORAGE STRATEGY

### Database Selection Rationale

| Store | Use Case | Why |
|-------|----------|-----|
| **PostgreSQL** | Persistent data, relationships, audit logs | ACID compliance, JSON support, proven reliability |
| **Redis** | Sessions, caching, real-time pub/sub | Sub-millisecond latency, built-in pub/sub |
| **File System** | Document uploads, audio recordings | Cost-effective, sufficient for MVP scale |

### Data Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LIFECYCLE MANAGEMENT                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   DATA TYPE          HOT STORAGE     WARM STORAGE    ARCHIVE/DELETE        │
│   ─────────          ───────────     ────────────    ──────────────        │
│                                                                             │
│   Active Sessions    Redis           PostgreSQL      Delete after          │
│                      (real-time)     (backup)        24 hours              │
│                                                                             │
│   Translations       PostgreSQL      PostgreSQL      Anonymize after       │
│                      (30 days)       (archive)       30 days               │
│                                                                             │
│   Queue Items        Redis           PostgreSQL      Delete after          │
│                      (active only)   (completed)     7 days                │
│                                                                             │
│   Audit Logs         PostgreSQL      PostgreSQL      Archive to cold       │
│                      (90 days)       (compressed)    storage, keep 7 yrs   │
│                                                                             │
│   User Sessions      Redis           -               Delete on logout      │
│   (Auth)             (with TTL)                      or expiry             │
│                                                                             │
│   Documents          File System     Compressed      Delete after          │
│                      (30 days)       archive         90 days               │
│                                                                             │
│   Audio Files        File System     -               Delete after          │
│   (temp)             (24 hours)                      processing            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Caching Strategy

```typescript
// Cache layers
const CACHE_CONFIG = {
  // L1: Application memory (Zustand on frontend, in-memory on backend)
  L1: {
    ttl: '5 minutes',
    data: ['user preferences', 'UI state', 'language configs']
  },
  
  // L2: Redis distributed cache
  L2: {
    ttl: '15 minutes',
    data: ['active sessions', 'queue state', 'translation cache']
  },
  
  // L3: PostgreSQL (source of truth)
  L3: {
    ttl: 'permanent',
    data: ['all persistent data']
  }
};

// Cache invalidation patterns
// 1. Time-based: TTL expiration
// 2. Event-based: Socket.io events trigger cache updates
// 3. Manual: Admin can clear specific caches
```

---

## API DESIGN

### RESTful Endpoints

```yaml
Authentication:
  POST   /api/auth/login          # Login with credentials
  POST   /api/auth/refresh        # Refresh access token
  POST   /api/auth/logout         # Invalidate session
  GET    /api/auth/me             # Get current user

Sessions:
  POST   /api/sessions            # Create new customer session
  GET    /api/sessions            # List active sessions (filtered by branch)
  GET    /api/sessions/:id        # Get session details
  PATCH  /api/sessions/:id        # Update session (status, assigned staff)
  DELETE /api/sessions/:id        # End/archive session

Translations:
  POST   /api/translations        # Submit text for translation
  POST   /api/translations/audio  # Submit audio for STT + translation
  GET    /api/translations/:sessionId  # Get all translations for session

Queue:
  GET    /api/queue               # Get current queue state
  POST   /api/queue               # Add customer to queue
  PATCH  /api/queue/:id           # Update queue item (call, assign, complete)
  DELETE /api/queue/:id           # Remove from queue

Admin:
  GET    /api/admin/users         # List staff users
  POST   /api/admin/users         # Create staff user
  PATCH  /api/admin/users/:id     # Update user
  GET    /api/admin/analytics     # Usage analytics
  GET    /api/admin/health        # System health check
```

### WebSocket Events

```yaml
Client → Server:
  session:join          # Join a session room
  session:leave         # Leave a session room
  translation:request   # Request translation
  audio:stream          # Stream audio chunk
  queue:update          # Update queue position/status

Server → Client:
  session:updated       # Session state changed
  translation:result    # Translation completed
  translation:streaming # Partial translation (streaming)
  queue:changed         # Queue state updated
  notification:new      # New notification for user
  connection:status     # Connection health update
```

---

## DEPLOYMENT ARCHITECTURE

### Production Environment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GOOGLE CLOUD PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        Cloud CDN                                    │   │
│   │              Static assets, caching, DDoS protection               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                   Cloud Load Balancer                               │   │
│   │           HTTPS termination, health checks, routing                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                       │                    │                                │
│                       ▼                    ▼                                │
│   ┌───────────────────────────┐   ┌───────────────────────────┐            │
│   │      Cloud Run            │   │      Cloud Run            │            │
│   │     (Frontend)            │   │      (Backend)            │            │
│   │                           │   │                           │            │
│   │  React App (Static)       │   │  Node.js + Socket.io     │            │
│   │  Nginx serving            │   │  Auto-scaling 1-5        │            │
│   │                           │   │  Min instances: 1        │            │
│   └───────────────────────────┘   └────────────┬──────────────┘            │
│                                                │                            │
│                          ┌─────────────────────┴─────────────────────┐      │
│                          │                                           │      │
│                          ▼                                           ▼      │
│   ┌───────────────────────────┐               ┌───────────────────────────┐ │
│   │    Cloud SQL              │               │    Memorystore            │ │
│   │    (PostgreSQL 16)        │               │    (Redis 7)              │ │
│   │                           │               │                           │ │
│   │    HA configuration       │               │    5GB memory             │ │
│   │    Daily backups          │               │    HA replica             │ │
│   │    Point-in-time recovery │               │                           │ │
│   └───────────────────────────┘               └───────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────┐               ┌───────────────────────────┐ │
│   │    Cloud Storage          │               │    Secret Manager         │ │
│   │    (File uploads)         │               │    (API keys, creds)      │ │
│   └───────────────────────────┘               └───────────────────────────┘ │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     Cloud Monitoring                                │   │
│   │           Logs, metrics, alerts, error reporting                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Environment Configuration

```yaml
# Production environment variables
NODE_ENV: production
PORT: 8080

# Database
DATABASE_URL: postgres://user:pass@/cport_prod?host=/cloudsql/project:region:instance
REDIS_URL: redis://10.0.0.5:6379

# Authentication
JWT_SECRET: ${SECRET_MANAGER:jwt-secret}
JWT_REFRESH_SECRET: ${SECRET_MANAGER:jwt-refresh-secret}
JWT_ACCESS_EXPIRY: 15m
JWT_REFRESH_EXPIRY: 7d

# External APIs
GOOGLE_CLOUD_PROJECT: cport-translation
GOOGLE_TRANSLATE_API_KEY: ${SECRET_MANAGER:translate-api-key}
OPENAI_API_KEY: ${SECRET_MANAGER:openai-api-key}
HUME_API_KEY: ${SECRET_MANAGER:hume-api-key}

# Email
SMTP_HOST: smtp.office365.com
SMTP_PORT: 587
SMTP_USER: ${SECRET_MANAGER:smtp-user}
SMTP_PASS: ${SECRET_MANAGER:smtp-pass}

# Security
CORS_ORIGIN: https://translate.cportcu.org
RATE_LIMIT_WINDOW_MS: 60000
RATE_LIMIT_MAX_REQUESTS: 100
```

---

## SECURITY CONSIDERATIONS

### Encryption

```yaml
At Rest:
  - PostgreSQL: AES-256 encryption (Cloud SQL default)
  - Redis: At-rest encryption enabled
  - File Storage: Cloud Storage encryption
  - Backups: Encrypted with customer-managed keys

In Transit:
  - TLS 1.3 for all connections
  - mTLS for service-to-service communication
  - WebSocket connections over WSS only
  - API requests over HTTPS only
```

### Compliance Checklist

```yaml
GLBA Safeguards Rule:
  ✓ Access controls and authentication
  ✓ Encryption of customer information
  ✓ Audit trails for all data access
  ✓ Regular security assessments
  ✓ Employee training requirements
  ✓ Incident response procedures

NCUA Cybersecurity:
  ✓ Risk assessment documentation
  ✓ Vulnerability management
  ✓ Business continuity planning
  ✓ Third-party vendor management
  ✓ Board reporting requirements

Data Privacy:
  ✓ Minimum data collection
  ✓ Purpose limitation
  ✓ Data retention policies
  ✓ Right to deletion (within regulatory limits)
  ✓ Privacy policy disclosure
```

---

## PERFORMANCE TARGETS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load | < 2s | Lighthouse Performance Score > 90 |
| Translation Response | < 2s | P95 latency |
| WebSocket Latency | < 100ms | P95 message delivery |
| API Response | < 500ms | P95 for standard operations |
| Concurrent Sessions | 15+ | Load testing with realistic scenarios |
| Uptime | 99.5% | Monthly availability |
| Error Rate | < 0.1% | 5xx responses / total requests |

---

## DISASTER RECOVERY

```yaml
Backup Strategy:
  PostgreSQL:
    - Daily automated backups (retained 30 days)
    - Point-in-time recovery (7 day window)
    - Cross-region replication for DR
  
  Redis:
    - Persistence enabled (AOF + RDB)
    - HA with automatic failover
  
  File Storage:
    - Multi-region bucket
    - Versioning enabled

Recovery Objectives:
  RTO (Recovery Time Objective): 1 hour
  RPO (Recovery Point Objective): 1 hour

Failover Procedures:
  1. Database failover: Automatic via Cloud SQL HA
  2. Redis failover: Automatic via Memorystore HA
  3. Application failover: Cloud Run auto-scaling
  4. Manual procedures documented in runbook
```

---

This architecture provides cPort Credit Union with a robust, secure, and scalable foundation for their translation tool while meeting all banking compliance requirements and maintaining simplicity appropriate for the available resources.
