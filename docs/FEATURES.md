# FEATURES.md

**Project**: cPort Credit Union Translation Tool  
**Purpose**: MVP feature specifications for multilingual banking support  
**Last Updated**: August 24, 2025  
**Phase**: MVP Development  

## Overview

This document defines the MVP feature set for cPort's real-time translation tool, focused on essential functionality that can be implemented within 4 months. Features are organized by user role and prioritized for immediate business impact.

## MVP Feature Prioritization

### Must-Have (MVP Phase 1)
- Core translation functionality
- Basic user interfaces for each role
- Essential queue management
- Simple session tracking

### Nice-to-Have (Phase 2+)
- Advanced analytics
- Complex integrations
- Enhanced UI features
- Automated reporting

---

## **GREETER INTERFACE FEATURES**

### **Core Translation & Language Management**

**F-G001: Language Selection Interface**
- Visual language picker with flag icons and native language names
- Support for 5 languages: English, Portuguese, French, Somali, Arabic, Spanish
- One-tap language switching during conversation
- Default language persistence (remembers customer preference)
```
Acceptance Criteria:
✅ Languages displayed with flags and native script
✅ Selection takes <2 seconds to activate
✅ Language preference saved for return customers (optional phone lookup)
```

**F-G002: Real-time Audio Translation**
- Push-to-talk audio capture using device microphone
- Speech-to-text conversion via Web Speech API
- Text translation via Google Cloud Translation API (with fallback to base models)
- Bi-directional translation display (English ↔ Customer Language)
```
Acceptance Criteria:
✅ Audio processing within 2 seconds
✅ Translation accuracy >85% for common phrases
✅ Clear visual indication of who is speaking
✅ Conversation history visible during session
```

**F-G003: Translation Quality Indicators**
- Confidence scores displayed with color coding (Green >90%, Yellow 70-90%, Red <70%)
- "Uncertain translation" warnings for complex banking terms
- Quick correction/retry buttons for mistranslated phrases
```
Acceptance Criteria:
✅ Confidence scores visible for each translation
✅ Staff can identify low-confidence translations immediately
✅ One-tap retry for unclear translations
```

### **Customer Triage & Service Routing**

**F-G004: AI-Powered Service Recommendation**
- Automatic service type detection from conversation keywords
- Recommendation display: "Simple Transaction" vs "Complex Service"
- Override capability for greeter judgment
```
Acceptance Criteria:
✅ AI suggests correct service type >80% of the time
✅ Greeter can override AI recommendation with one tap
✅ Keywords like "deposit," "withdrawal" → Simple Transaction
✅ Keywords like "loan," "account opening" → Complex Service
```

**F-G005: Customer Context Capture**
- Basic customer information entry (name, phone - optional)
- Service need selection from predefined categories
- Special notes field for additional context
```
Acceptance Criteria:
✅ Form completion in <60 seconds
✅ All fields optional except service type
✅ Predefined categories cover 90% of common requests
```

**F-G006: Queue Assignment**
- Real-time queue status display for teller line and private consultation
- One-click customer assignment to appropriate queue
- Estimated wait time calculation and display
```
Acceptance Criteria:
✅ Current queue lengths visible at all times
✅ Wait time estimates within 20% accuracy
✅ Customer assigned to queue with single button press
```

### **Digital Handoff**

**F-G007: Session Summary Creation**
- Auto-generated summary of customer interaction
- Key phrases and service needs extracted
- Basic customer mood indicator (Calm/Anxious/Urgent)
```
Acceptance Criteria:
✅ Summary generated automatically when assigning to queue
✅ Contains customer name, language, service type, key phrases
✅ Mood indicator based on conversation tone
```

**F-G008: Staff Communication**
- Digital handoff package sent to assigned banker
- Real-time notifications to receiving staff
- Session context preserved across handoff
```
Acceptance Criteria:
✅ Banker receives notification within 10 seconds
✅ All conversation context transferred
✅ Translation continues seamlessly after handoff
```

---

## **TELLER INTERFACE FEATURES**

### **Queue & Customer Management**

**F-T001: Personal Queue Dashboard**
- List view of customers assigned to teller
- Customer cards showing name, language, service type, wait time
- "Next Customer" button with automatic queue advancement
```
Acceptance Criteria:
✅ Queue updates in real-time
✅ Customer information clearly displayed on cards
✅ Next customer selection updates queue for all staff
```

**F-T002: Customer Context Display**
- Full conversation history from greeter interaction
- Service summary and special notes
- Estimated service duration
```
Acceptance Criteria:
✅ Context loads before customer arrives at window
✅ Conversation history scrollable and searchable
✅ Service type and notes prominently displayed
```

### **Translation During Service**

**F-T003: Integrated Translation Interface**
- Split-screen layout: banking work area + translation panel
- Real-time bi-directional translation during customer service
- Translation history maintained throughout interaction
```
Acceptance Criteria:
✅ Translation panel doesn't interfere with banking system
✅ Audio input/output clearly labeled
✅ Conversation history preserved during entire service
```

**F-T004: Banking Term Enhancement**
- Auto-correction for common banking terminology
- Quick-insert buttons for frequent phrases ("Your balance is...", "This transaction...")
- Number and currency formatting in customer's language
```
Acceptance Criteria:
✅ Banking terms translated consistently
✅ Quick phrases inserted with one tap
✅ Currency amounts formatted correctly (e.g., $1,234.56)
```

**F-T005: Transaction Confirmation**
- Critical information repeated in both languages
- Visual confirmation of amounts and account numbers
- Customer acknowledgment required for major transactions
```
Acceptance Criteria:
✅ Transaction amounts shown in both languages
✅ Account numbers confirmed verbally and visually
✅ Clear "customer confirmed" indication
```

### **Service Completion**

**F-T006: Session Summary Generation**
- Automated summary of services completed
- Action items and next steps in customer's language
- Receipt and document explanations translated
```
Acceptance Criteria:
✅ Summary generated automatically at service completion
✅ Contains all services performed and amounts
✅ Next steps clearly explained in customer's language
```

---

## **PRIVATE CONSULTOR INTERFACE FEATURES**

### **Extended Session Management**

**F-C001: Consultation Queue Management**
- Separate queue for complex services (loans, accounts, disputes)
- Longer time allocations (30-60 minutes vs 5-10 for teller)
- Appointment integration capability
```
Acceptance Criteria:
✅ Complex service queue separate from teller queue
✅ Time allocations appropriate for service complexity
✅ Queue status visible to all consultation staff
```

**F-C002: Enhanced Translation Tools**
- Document upload and translation for forms/applications
- Financial term explanations in customer's language  
- Loan calculation explanations with translated terminology
```
Acceptance Criteria:
✅ PDF documents can be uploaded and key sections translated
✅ Financial products explained in culturally appropriate terms
✅ Loan terms (APR, monthly payment) clearly communicated
```

**F-C003: Complex Service Workflows**
- Step-by-step progress tracking for multi-stage services
- Document checklist with translation support
- Service completion verification
```
Acceptance Criteria:
✅ Progress indicator shows current step (e.g., "Step 2 of 5")
✅ Required documents listed in customer's language
✅ Customer understanding verified at each step
```

---

## **SYSTEM-WIDE FEATURES**

### **Real-time Communication**

**F-SYS001: WebSocket Integration**
- Real-time updates across all user interfaces
- Queue status synchronization
- Session state preservation
```
Acceptance Criteria:
✅ Changes propagate to all connected devices within 5 seconds
✅ Connection automatically recovers from brief network interruptions
✅ No data loss during connection issues
```

**F-SYS002: Session Management**
- Unique session IDs for each customer interaction
- Cross-device session continuity (greeter iPad → teller desktop)
- Automatic cleanup of completed sessions
```
Acceptance Criteria:
✅ Sessions persist across device handoffs
✅ Session data retained for 24 hours, then archived
✅ Active sessions recoverable after app restart
```

### **Translation Engine**

**F-SYS003: Google Cloud Translation Integration**
- Primary translation via Google Cloud Translation API
- Fallback to base Google Translate for service reliability
- Custom model integration for cPort-specific terminology
```
Acceptance Criteria:
✅ Translation requests complete within 2 seconds
✅ Service continues with base model if custom model unavailable
✅ Banking terminology translated consistently
```

**F-SYS004: Audio Processing**
- Speech-to-text via Web Speech API (primary) or OpenAI Whisper (backup)
- Multi-language audio input support
- Noise filtering for branch environment
```
Acceptance Criteria:
✅ Audio processing works in normal branch noise levels
✅ Speech recognition >80% accurate for clear speech
✅ Graceful fallback when audio unclear
```

---

## **ADMINISTRATIVE FEATURES**

### **Basic System Administration**

**F-ADM001: User Management**
- Staff login with role-based access (Greeter, Teller, Consultor, Admin)
- Simple username/password authentication
- Basic session timeout (4 hours of inactivity)
```
Acceptance Criteria:
✅ Each staff member has appropriate interface access
✅ Sessions expire automatically for security
✅ Login process takes <30 seconds
```

**F-ADM002: Basic Analytics**
- Daily usage summary (sessions, languages, services)
- Translation accuracy feedback collection
- Simple performance metrics (average service time)
```
Acceptance Criteria:
✅ Daily metrics available to managers
✅ Usage patterns identifiable by language and service type
✅ Performance trends trackable over time
```

**F-ADM003: System Health Monitoring**
- API service status indicators
- Error logging for troubleshooting
- Basic uptime tracking
```
Acceptance Criteria:
✅ Service outages immediately visible to admin
✅ Error logs accessible for problem resolution
✅ System status dashboard shows green/yellow/red indicators
```

---

## **CUSTOMER EXPERIENCE FEATURES**

### **Passive Customer Interface**

**F-CX001: Customer Display Panel**
- Large-text display of translations for customer reading
- Current queue position and wait time
- Service progress indication
```
Acceptance Criteria:
✅ Text large enough for comfortable reading (18pt+)
✅ Customer can follow conversation progress
✅ Wait times updated in real-time
```

**F-CX002: Service Summary Delivery**
- Email summary in customer's preferred language
- SMS summary for basic transactions (optional)
- Printed summary available on request
```
Acceptance Criteria:
✅ Email summaries sent within 5 minutes of service completion
✅ Summaries include key information and next steps
✅ Customer can request printed copy
```

### **Feedback Collection**

**F-CX003: Simple Satisfaction Survey**
- Three-button satisfaction rating (Great/OK/Poor)
- Optional feedback text field
- Translation quality rating (Was everything clear? Yes/No)
```
Acceptance Criteria:
✅ Survey completion takes <30 seconds
✅ Feedback collected anonymously
✅ Results trackable by language and service type
```

---

## **SECURITY & COMPLIANCE**

### **Essential Security Features**

**F-SEC001: Data Encryption**
- All API communications over HTTPS
- Database encryption for customer information
- Session data encrypted in transit
```
Acceptance Criteria:
✅ No unencrypted data transmission
✅ Customer information protected at rest
✅ Session tokens properly secured
```

**F-SEC002: Audit Logging**
- All translation activities logged
- User actions tracked for compliance
- Session summaries retained for 30 days
```
Acceptance Criteria:
✅ Complete audit trail for regulatory review
✅ User actions traceable to individual staff members
✅ Logs retained per banking compliance requirements
```

**F-SEC003: Access Control**
- Role-based permissions (no admin access for front-line staff)
- Automatic logout after inactivity
- Password requirements for staff accounts
```
Acceptance Criteria:
✅ Staff can only access features appropriate to their role
✅ Sessions terminate automatically for security
✅ Strong passwords required for all accounts
```

---

## **TECHNICAL IMPLEMENTATION NOTES**

### **Browser Compatibility**
- Primary support: Chrome 100+, Safari 15+, Edge 100+
- Progressive Web App capabilities for offline basic functions
- Responsive design for iPad and desktop displays

### **Performance Requirements**
- Page load time: <3 seconds
- Translation response: <2 seconds  
- Real-time updates: <5 seconds propagation
- Concurrent users: Support for 15+ simultaneous sessions

### **Integration Points**
- Google Cloud Translation API
- OpenAI Whisper API (backup audio processing)
- Email service (Nodemailer with Gmail/Outlook)
- Local file system for document storage