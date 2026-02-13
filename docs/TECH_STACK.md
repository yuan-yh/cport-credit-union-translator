# TECH_STACK.md

**Project**: cPort Credit Union Translation Tool  
**Last Updated**: February 2026  
**Phase**: MVP Production

> **Note**: For complete technical architecture, data flow diagrams, and authentication details, see [PRODUCT_ARCHITECTURE.md](./PRODUCT_ARCHITECTURE.md)

---

## Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI library with Concurrent Features |
| **TypeScript** | 5.3+ | Type safety |
| **Vite** | 5.x | Build tool with HMR |
| **TanStack Query** | 5.x | Server state management |
| **Zustand** | 4.x | Client state |
| **Tailwind CSS** | 3.4+ | Utility-first styling |
| **Framer Motion** | 10.x | Animations |
| **Radix UI** | Latest | Accessible primitives |
| **Socket.io Client** | 4.x | Real-time communication |

## Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20 LTS | Runtime |
| **Express** | 4.18+ | Web framework |
| **TypeScript** | 5.3+ | Type safety |
| **Socket.io** | 4.x | WebSocket server |
| **bcryptjs** | 2.x | Password hashing |
| **jsonwebtoken** | 9.x | JWT authentication |
| **zod** | 3.x | Schema validation |
| **winston** | 3.x | Logging |

## Database & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 16.x | Primary database |
| **Prisma** | 5.x | ORM with migrations |
| **Redis** | 7.x | Sessions, caching, pub/sub |
| **File System** | - | Document/audio storage |

## External APIs

| Service | Purpose |
|---------|---------|
| **Google Cloud Translation** | Primary translation engine |
| **OpenAI Whisper** | Speech-to-text (backup) |
| **Hume AI** | Emotion analysis |
| **SMTP** | Email notifications |
| **Twilio** | SMS (optional) |

## Infrastructure

| Service | Purpose |
|---------|---------|
| **Google Cloud Run** | Container hosting |
| **Cloud SQL** | Managed PostgreSQL |
| **Memorystore** | Managed Redis |
| **Cloud Storage** | File uploads |
| **Cloud CDN** | Asset delivery |

## Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **Husky** | Git hooks |

---

## Related Documentation

- [PRODUCT_ARCHITECTURE.md](./PRODUCT_ARCHITECTURE.md) - Complete system architecture
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Visual design specifications
- [UI_UX_SPECIFICATIONS.md](./UI_UX_SPECIFICATIONS.md) - Screen designs
- [FIGMA_COMPONENTS.md](./FIGMA_COMPONENTS.md) - Component library specs
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Data models