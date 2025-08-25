# cPort Credit Union Translation Tool

**Real-time multilingual banking support for Maine's immigrant communities**

## Project Overview

The cPort Credit Union Translation Tool is an AI-powered real-time translation system designed to serve Maine's diverse immigrant populations through personalized, culturally-sensitive banking services. This MVP prototype demonstrates the core workflow of a greeter-centric translation system that enhances rather than replaces human interaction.

### Core Concept

- **Greeter-First Approach**: Universal bankers use iPads to welcome customers, identify language needs, and provide initial translation support
- **Staff-Mediated Translation**: Technology enhances human interaction - staff remain the primary interface with customers
- **Seamless Handoffs**: Customers flow from greeter (iPad) → teller (desktop) → private consultor (desktop) with full conversation context preserved
- **Cultural Banking Focus**: Translations fine-tuned for credit union terminology ("member" vs "customer", "share draft accounts", etc.)

## Supported Languages

- **Portuguese** (1,600+ speakers in Maine - primarily Angolan community)
- **French** (39,000+ speakers - Congolese community using Belgian French)
- **Somali** (2,400+ speakers - including Somali Bantu variations)
- **Arabic** (1,500+ speakers - multiple regional dialects)
- **Spanish** (14,000+ speakers - diverse Latin American origins)

## MVP Features

### 🎯 Must-Have Features (Phase 1)

#### Greeter Interface (iPad-optimized)
- ✅ Language selection with visual flags
- ✅ Push-to-talk audio translation (mock API)
- ✅ Customer triage (name, service type, notes)
- ✅ Queue assignment to teller or private consultation
- ✅ AI-powered service recommendation

#### Teller Interface (Desktop)
- ✅ Split-screen layout (banking work + translation panel)
- ✅ Real-time translation during customer service
- ✅ Transaction confirmation in both languages
- ✅ Session handoff from greeter with full context

#### Mock Translation System
- ✅ Simulated Google Cloud Translation API responses
- ✅ Confidence scoring with color coding
- ✅ Banking terminology dictionary
- ✅ Audio processing simulation

#### Queue Management
- ✅ Real-time queue status across all interfaces
- ✅ Customer assignment and handoff between roles
- ✅ Session persistence across device transitions
- ✅ Simple wait time estimates

### 🚀 Nice-to-Have Features (Phase 2+)
- Advanced analytics and reporting
- Real translation API integration
- Document upload and translation
- Enhanced UI features and animations
- Automated customer feedback collection

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for consistent, accessible components
- **Redux Toolkit** for state management
- **Socket.io Client** for real-time communication
- **Vite** for fast development and building

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Socket.io** for real-time WebSocket communication
- **JWT** for authentication
- **Prisma** with PostgreSQL for database management

### Development Tools
- **Concurrently** for running frontend and backend simultaneously
- **ESLint** for code quality
- **Jest** for testing
- **tsx** for TypeScript execution

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL 14+ (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cport-credit-union-translator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database (optional for MVP)**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

## Project Structure

```
cport-credit-union-translator/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components (Greeter, Teller, etc.)
│   │   ├── store/         # Redux store and slices
│   │   ├── services/      # API and WebSocket services
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Node.js backend application
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic services
│   │   ├── models/        # Database models
│   │   └── utils/         # Utility functions
│   └── prisma/            # Database schema and migrations
├── docs/                  # Project documentation
└── shared/                # Shared types and utilities
```

## User Workflows

### 1. Greeter Workflow (iPad)
1. Customer approaches greeter station
2. Greeter selects customer's language
3. Greeter uses push-to-talk for initial conversation
4. System recommends service type (Simple Transaction vs Complex Service)
5. Greeter captures basic customer information
6. Customer assigned to appropriate queue (teller or private consultation)
7. Session context transferred to next staff member

### 2. Teller Workflow (Desktop)
1. Teller receives notification of new customer in queue
2. Teller reviews customer context and conversation history
3. Customer arrives at teller window
4. Teller uses split-screen interface (banking system + translation)
5. Real-time translation during transaction processing
6. Transaction confirmation in both languages
7. Service completion with summary generation

### 3. Private Consultor Workflow (Desktop)
1. Consultor receives complex service customers
2. Extended session management (30-60 minutes)
3. Document upload and translation support
4. Multi-step service progress tracking
5. Financial product explanations in customer's language

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for critical UI elements
- End-to-end tests for user workflows

### Security
- All API endpoints require authentication
- Input validation on all user inputs
- HTTPS in production
- Rate limiting on API endpoints
- Audit logging for all user actions

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
- `PORT`: Server port (default: 3001)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `NODE_ENV`: Environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or support, contact the development team or refer to the documentation in the `docs/` directory.

---

**Built for cPort Credit Union - Serving Maine's immigrant communities since 1931**

