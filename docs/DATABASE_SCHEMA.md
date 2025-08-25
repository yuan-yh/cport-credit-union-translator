# DATABASE_SCHEMA.md

**Project**: cPort Credit Union Translation Tool  
**Purpose**: Database schema design and data modeling for MVP  
**Last Updated**: August 24, 2025  
**Phase**: MVP Development  

## Overview

This document defines the PostgreSQL database schema for cPort's translation tool MVP, designed for implementation with Prisma ORM. The schema focuses on essential data models needed for the greeter-centric workflow while maintaining banking compliance requirements.

---

## **PRISMA SCHEMA DEFINITION**

### **Core Schema File (prisma/schema.prisma)**

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Management - Staff accounts
model User {
  id          String   @id @default(cuid())
  username    String   @unique
  email       String   @unique
  passwordHash String
  firstName   String
  lastName    String
  role        UserRole
  branchId    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  sessions    Session[]
  translations Translation[]
  queueItems  QueueItem[]

  @@map("users")
}

// Customer Sessions - Core workflow tracking
model Session {
  id              String        @id @default(cuid())
  customerName    String?       // Optional - customer may not provide
  customerPhone   String?       // Optional - for returning customer recognition
  preferredLanguage String      // ISO language code (pt, fr, so, ar, es)
  status          SessionStatus @default(ACTIVE)
  serviceType     ServiceType?  // Determined during triage
  priority        Priority      @default(STANDARD)
  emotionState    String?       // Calm, Anxious, Distressed from Hume AI
  branchId        String        // Which branch this session belongs to
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  completedAt     DateTime?

  // Staff assignments
  greeterId       String?
  greeter         User?         @relation(fields: [greeterId], references: [id])
  assignedBankerId String?
  assignedBanker  User?         @relation(fields: [assignedBankerId], references: [id], name: "AssignedSessions")

  // Relationships
  translations    Translation[]
  queueItems      QueueItem[]
  contextNotes    ContextNote[]

  @@map("sessions")
}

// Translation Records - All translation activities
model Translation {
  id              String     @id @default(cuid())
  sessionId       String
  originalText    String
  translatedText  String
  sourceLanguage  String     // ISO language code
  targetLanguage  String     // ISO language code
  confidence      Float      // 0.0 to 1.0 confidence score
  context         String?    // banking, loans, accounts, etc.
  modelUsed       ModelType  @default(BASE)
  processingTimeMs Int       // Performance tracking
  createdAt       DateTime   @default(now())
  createdById     String     // Which staff member initiated

  // Relationships
  session         Session    @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdBy       User       @relation(fields: [createdById], references: [id])

  @@map("translations")
}

// Queue Management - Customer service queue
model QueueItem {
  id              String      @id @default(cuid())
  sessionId       String      @unique // One queue item per session
  queueType       QueueType   // TELLER or CONSULTOR
  position        Int         // Position in queue (1 = next)
  estimatedWaitMinutes Int    // Estimated wait time
  priority        Priority    @default(STANDARD)
  status          QueueStatus @default(WAITING)
  assignedBankerId String?    // When assigned to specific banker
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  calledAt        DateTime?   // When customer was called for service
  completedAt     DateTime?   // When service completed

  // Relationships
  session         Session     @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  assignedBanker  User?       @relation(fields: [assignedBankerId], references: [id])

  @@map("queue_items")
}

// Context Notes - Key information captured during interactions
model ContextNote {
  id            String    @id @default(cuid())
  sessionId     String
  noteType      NoteType  // SERVICE_NEED, CUSTOMER_INFO, SPECIAL_INSTRUCTIONS
  content       String
  keyPhrases    String[]  // Important keywords extracted
  isPrivate     Boolean   @default(false) // Staff-only notes
  createdAt     DateTime  @default(now())
  createdById   String

  // Relationships  
  session       Session   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdBy     User      @relation(fields: [createdById], references: [id], name: "CreatedNotes")

  @@map("context_notes")
}

// System Configuration - App settings and parameters
model SystemConfig {
  id          String   @id @default(cuid())
  key         String   @unique // CONFIG_KEY format
  value       String   // JSON string for complex values
  description String?
  category    String   // TRANSLATION, QUEUE, SECURITY, etc.
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("system_config")
}

// Audit Log - Compliance and security tracking
model AuditLog {
  id          String     @id @default(cuid())
  userId      String?    // Null for system events
  sessionId   String?    // Associated session if applicable
  action      String     // LOGIN, TRANSLATE, QUEUE_ASSIGN, etc.
  resource    String?    // What was acted upon
  details     Json?      // Additional context as JSON
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime   @default(now())

  // Relationships (optional - for data integrity)
  user        User?      @relation(fields: [userId], references: [id], name: "AuditLogs")

  @@map("audit_logs")
}

// Feedback - Customer and staff feedback collection
model Feedback {
  id            String       @id @default(cuid())
  sessionId     String?      // Associated session
  feedbackType  FeedbackType // SATISFACTION, TRANSLATION_QUALITY, BUG_REPORT
  rating        Int?         // 1-5 scale rating
  comments      String?
  language      String?      // Language of feedback
  isAnonymous   Boolean      @default(true)
  createdAt     DateTime     @default(now())
  submittedById String?      // Staff member who collected feedback

  // Relationships
  session       Session?     @relation(fields: [sessionId], references: [id], name: "SessionFeedback")
  submittedBy   User?        @relation(fields: [submittedById], references: [id], name: "CollectedFeedback")

  @@map("feedback")
}

// ENUMS - Standardized values

enum UserRole {
  GREETER
  TELLER  
  CONSULTOR
  ADMIN
  MANAGER
}

enum SessionStatus {
  ACTIVE      // Currently in progress
  WAITING     // In queue
  IN_SERVICE  // Being served by banker
  COMPLETED   // Service finished
  ABANDONED   // Customer left without service
}

enum ServiceType {
  SIMPLE_TRANSACTION  // Deposits, withdrawals, basic inquiries
  COMPLEX_SERVICE     // Loans, account opening, disputes
  URGENT              // Emergency or high-priority issues
}

enum Priority {
  LOW
  STANDARD
  HIGH
  URGENT
}

enum QueueType {
  TELLER     // Simple transactions
  CONSULTOR  // Complex services
}

enum QueueStatus {
  WAITING     // In queue
  CALLED      // Customer called but not yet served
  IN_SERVICE  // Currently being served
  COMPLETED   // Service completed
  NO_SHOW     // Customer didn't respond to call
}

enum ModelType {
  BASE       // Standard Google Translate
  CUSTOM     // cPort fine-tuned model
  FALLBACK   // Emergency fallback
}

enum NoteType {
  SERVICE_NEED        // What customer wants
  CUSTOMER_INFO       // Basic customer details  
  SPECIAL_INSTRUCTIONS // Important handling notes
  STAFF_OBSERVATION   // Staff notes about interaction
}

enum FeedbackType {
  SATISFACTION         // Overall service satisfaction
  TRANSLATION_QUALITY  // How good was the translation
  BUG_REPORT          // Technical issues
  FEATURE_REQUEST     // Suggestions for improvement
}
```

---

## **DATABASE RELATIONSHIPS DIAGRAM**

### **Core Entity Relationships**
```
User (Staff)
├── 1:N → Session (as greeter)
├── 1:N → Session (as assigned banker)
├── 1:N → Translation (created translations)
├── 1:N → QueueItem (assigned queue items)
└── 1:N → ContextNote (created notes)

Session (Customer Interaction)
├── 1:N → Translation (all translations in session)
├── 1:1 → QueueItem (queue assignment)
├── 1:N → ContextNote (session notes)
├── N:1 → User (greeter)
├── N:1 → User (assigned banker)
└── 1:N → Feedback (session feedback)

Translation (Individual Translation)
├── N:1 → Session (belongs to session)
└── N:1 → User (created by staff member)

QueueItem (Queue Management)
├── 1:1 → Session (one queue item per session)
└── N:1 → User (assigned banker)
```

---

## **SAMPLE DATA MODELS**

### **TypeScript Interface Definitions**

```typescript
// Generated Prisma types will include these, but here are the key interfaces:

export interface SessionWithDetails {
  id: string;
  customerName?: string;
  customerPhone?: string;
  preferredLanguage: string;
  status: SessionStatus;
  serviceType?: ServiceType;
  priority: Priority;
  emotionState?: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Relations
  greeter?: User;
  assignedBanker?: User;
  translations: Translation[];
  queueItems: QueueItem[];
  contextNotes: ContextNote[];
}

export interface TranslationRequest {
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
  sessionId: string;
}

export interface QueueItemWithSession {
  id: string;
  queueType: QueueType;
  position: number;
  estimatedWaitMinutes: number;
  priority: Priority;
  status: QueueStatus;
  createdAt: Date;
  
  // Relations
  session: {
    id: string;
    customerName?: string;
    preferredLanguage: string;
    serviceType?: ServiceType;
    emotionState?: string;
  };
  assignedBanker?: User;
}
```

---

## **DATABASE INITIALIZATION**

### **Migration Files Structure**
```
prisma/migrations/
├── 001_initial_schema/
│   └── migration.sql
├── 002_add_audit_logging/
│   └── migration.sql
└── 003_add_feedback_system/
    └── migration.sql
```

### **Initial Seed Data (prisma/seed.ts)**
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create system admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@cportcu.org',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      branchId: 'forest-avenue'
    }
  });

  // Create sample staff users
  const greeterPasswordHash = await bcrypt.hash('greeter123', 10);
  const greeter = await prisma.user.create({
    data: {
      username: 'greeter1',
      email: 'greeter@cportcu.org',
      passwordHash: greeterPasswordHash,
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'GREETER',
      branchId: 'forest-avenue'
    }
  });

  const tellerPasswordHash = await bcrypt.hash('teller123', 10);
  const teller = await prisma.user.create({
    data: {
      username: 'teller1',
      email: 'teller@cportcu.org',
      passwordHash: tellerPasswordHash,
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'TELLER',
      branchId: 'forest-avenue'
    }
  });

  // Create sample system configuration
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'SUPPORTED_LANGUAGES',
        value: JSON.stringify(['pt', 'fr', 'so', 'ar', 'es']),
        description: 'List of supported translation languages',
        category: 'TRANSLATION'
      },
      {
        key: 'DEFAULT_QUEUE_WAIT_TIME',
        value: '10',
        description: 'Default estimated wait time in minutes',
        category: 'QUEUE'
      },
      {
        key: 'SESSION_TIMEOUT_HOURS',
        value: '4',
        description: 'Session timeout in hours',
        category: 'SECURITY'
      }
    ]
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## **DATABASE OPERATIONS**

### **Common Query Patterns**

#### **Session Management Queries**
```typescript
// Create new customer session
async function createSession(data: {
  customerName?: string;
  customerPhone?: string;
  preferredLanguage: string;
  branchId: string;
  greeterId: string;
}) {
  return await prisma.session.create({
    data: {
      ...data,
      status: 'ACTIVE'
    },
    include: {
      greeter: true,
      translations: true,
      queueItems: true
    }
  });
}

// Get active sessions for branch
async function getActiveSessions(branchId: string) {
  return await prisma.session.findMany({
    where: {
      branchId,
      status: {
        in: ['ACTIVE', 'WAITING', 'IN_SERVICE']
      }
    },
    include: {
      greeter: true,
      assignedBanker: true,
      queueItems: {
        include: {
          assignedBanker: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
}
```

#### **Queue Management Queries**
```typescript
// Get queue status for specific queue type
async function getQueueStatus(queueType: QueueType, branchId: string) {
  return await prisma.queueItem.findMany({
    where: {
      queueType,
      status: {
        in: ['WAITING', 'CALLED']
      },
      session: {
        branchId
      }
    },
    include: {
      session: {
        select: {
          customerName: true,
          preferredLanguage: true,
          serviceType: true,
          emotionState: true
        }
      },
      assignedBanker: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { position: 'asc' }
    ]
  });
}

// Assign customer to banker
async function assignCustomerToBanker(queueItemId: string, bankerId: string) {
  return await prisma.queueItem.update({
    where: { id: queueItemId },
    data: {
      assignedBankerId: bankerId,
      status: 'CALLED',
      calledAt: new Date()
    }
  });
}
```

#### **Translation Tracking Queries**
```typescript
// Record translation activity
async function recordTranslation(data: {
  sessionId: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  context?: string;
  modelUsed: ModelType;
  createdById: string;
  processingTimeMs: number;
}) {
  return await prisma.translation.create({
    data
  });
}

// Get translation statistics
async function getTranslationStats(timeframe: { start: Date; end: Date }) {
  const stats = await prisma.translation.groupBy({
    by: ['targetLanguage', 'modelUsed'],
    where: {
      createdAt: {
        gte: timeframe.start,
        lte: timeframe.end
      }
    },
    _count: {
      id: true
    },
    _avg: {
      confidence: true,
      processingTimeMs: true
    }
  });

  return stats;
}
```

---

## **PERFORMANCE CONSIDERATIONS**

### **Database Indexes**
```sql
-- Essential indexes for performance
CREATE INDEX idx_sessions_branch_status ON sessions(branch_id, status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_queue_items_type_status ON queue_items(queue_type, status);
CREATE INDEX idx_queue_items_position ON queue_items(position);
CREATE INDEX idx_translations_session_created ON translations(session_id, created_at);
CREATE INDEX idx_translations_target_lang ON translations(target_language);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
```

### **Data Retention Policies**
```typescript
// Automated cleanup procedures
async function cleanupOldData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenYearsAgo = new Date();
  sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

  // Archive old sessions (keep for 30 days)
  await prisma.session.updateMany({
    where: {
      completedAt: {
        lt: thirtyDaysAgo
      },
      status: 'COMPLETED'
    },
    data: {
      // Move to archive table or mark as archived
    }
  });

  // Clean up old audit logs (keep for 7 years per banking requirements)
  await prisma.auditLog.deleteMany({
    where: {
      timestamp: {
        lt: sevenYearsAgo
      }
    }
  });
}
```

---

## **BACKUP AND RECOVERY**

### **Backup Strategy**
```bash
# Daily automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cport_translation_prod"
BACKUP_DIR="/opt/cport-translation/backups"

# Full database backup
pg_dump -U cport_user -h localhost $DB_NAME > $BACKUP_DIR/full_backup_$DATE.sql

# Table-specific backups for critical data
pg_dump -U cport_user -h localhost $DB_NAME -t sessions > $BACKUP_DIR/sessions_$DATE.sql
pg_dump -U cport_user -h localhost $DB_NAME -t translations > $BACKUP_DIR/translations_$DATE.sql
pg_dump -U cport_user -h localhost $DB_NAME -t audit_logs > $BACKUP_DIR/audit_logs_$DATE.sql

# Compress backups
gzip $BACKUP_DIR/*.sql

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

This database schema provides cPort Credit Union with a robust, compliant, and scalable foundation for their translation tool while maintaining simplicity appropriate for the MVP implementation timeline.