# Cursor Implementation Prompt (Temporary)

## **Initial Setup Prompt (Start Here)**

```
I need to build a functional prototype for cPort Credit Union's real-time translation tool. This is an MVP for a 4-month intern project focused on serving Maine's immigrant communities with multilingual banking support.

Please read these documentation files to understand the project context and requirements:
- PROJECT_BRIEF.md (business context and goals)
- REQUIREMENTS.md (technical constraints and must-haves)
- FEATURES.md (MVP feature specifications)
- TECH_STACK.md (technology decisions)

After reviewing these files, I need you to:

1. Confirm your understanding of the core concept: A greeter-centric translation system for credit union staff to serve multilingual customers
2. Identify the key MVP features to prototype first
3. Suggest a simplified project structure for rapid prototyping

This prototype should demonstrate:
- Basic greeter interface (iPad-optimized)
- Simple teller interface 
- Mock translation functionality (no real APIs yet)
- Basic queue management
- Session handoff between roles

Focus on the user workflow and interface rather than complex backend features. We can add real translation APIs later.

What's your understanding of the project and what should we build first?
```

---

## **Follow-up Development Prompts (Use After Initial Review)**

### **Prompt 2: Project Structure Setup**
```
Based on your understanding of the cPort translation tool requirements, please create the initial project structure with:

1. A monorepo setup with client (React + TypeScript + MUI) and server (Node.js + Express + TypeScript)
2. Basic package.json files with the dependencies from TECH_STACK.md
3. Essential folder structure for components, pages, services, and types
4. Basic TypeScript interfaces for the core data models (Session, Translation, User, Queue)
5. Simple README with development setup instructions

Start with the foundational structure - we'll build the actual features incrementally.
```

### **Prompt 3: Core Data Models**
```
Now let's define the core TypeScript interfaces and data models for the translation tool. Based on FEATURES.md, create:

1. Session interface (customer interaction tracking)
2. Translation interface (text translation records)
3. User interface (staff roles: Greeter, Teller, Consultor)
4. QueueItem interface (customer queue management)
5. TranslationResult interface (API response structure)

Also create mock data generators for testing the interfaces. Keep it simple but realistic for a credit union environment.
```

### **Prompt 4: Greeter Interface**
```
Let's build the greeter interface first - this is the primary entry point. Based on FEATURES.md requirements F-G001 through F-G008, create:

1. A React component for language selection with flag icons (5 languages: Portuguese, French, Somali, Arabic, Spanish)
2. Mock translation interface with push-to-talk functionality
3. Service type recommendation (Simple Transaction vs Complex Service)
4. Customer context capture form
5. Queue assignment interface

Use Material-UI components and make it iPad-touch friendly. Mock the translation API calls for now - focus on the UX workflow.
```

### **Prompt 5: Teller Interface**
```
Now create the teller interface based on features F-T001 through F-T006. This should include:

1. Customer queue dashboard showing assigned customers
2. Customer context display from greeter handoff
3. Split-screen layout simulation (banking work area + translation panel)
4. Mock translation interface during service
5. Session completion and summary generation

The interface should feel like a desktop application that works alongside existing banking software.
```

### **Prompt 6: Backend API Structure**
```
Create a basic Express.js backend with TypeScript that supports the frontend interfaces:

1. REST API endpoints for sessions, translations, queue management, and users
2. Mock database layer using JSON files or in-memory storage
3. WebSocket setup with Socket.io for real-time queue updates
4. Basic authentication middleware (simple JWT)
5. CORS configuration for local development

Focus on the API structure rather than real database integration. We'll add PostgreSQL later.
```

### **Prompt 7: WebSocket Integration**
```
Implement real-time features using WebSocket connections:

1. Real-time queue updates across all interfaces
2. Session state synchronization (greeter → teller handoff)
3. Translation updates broadcasting
4. Basic connection handling and reconnection logic

Test the real-time functionality between greeter and teller interfaces.
```

### **Prompt 8: Mock Translation Service**
```
Create a mock translation service that simulates the Google Cloud Translation integration:

1. Mock translation responses with confidence scores
2. Simulate different response times and accuracy levels
3. Banking terminology enhancement (mock custom model behavior)
4. Audio transcription simulation (Web Speech API integration)
5. Error handling and fallback scenarios

This should demonstrate the translation workflow without requiring actual API keys.
```

---

## **Context Management Strategy**

### **If Context Window Gets Full:**
```
I need to continue working on the cPort translation tool prototype. Previously we established:

[Briefly summarize what was built so far]

Now I need help with [specific next step]. Please focus on [specific component/feature] and refer back to the documentation files if needed for requirements clarification.

The key constraints are:
- MVP for 4-month intern project
- React + TypeScript + MUI frontend
- Node.js + Express backend
- Focus on user workflow over complex features
```

### **For Specific Feature Development:**
```
Working on [specific feature] for the cPort translation tool. Based on FEATURES.md requirement [F-XXX], I need:

[Specific request with clear requirements]

Please refer to the relevant documentation sections for context, and focus on [specific aspect] while maintaining consistency with the overall architecture we've established.
```

---

## **Final Integration Prompt**
```
Let's integrate all the pieces we've built for the cPort translation tool prototype:

1. Connect the frontend interfaces with the backend APIs
2. Test the complete workflow: customer entry → greeter triage → teller service → completion
3. Ensure real-time updates work across all interfaces
4. Add basic error handling and loading states
5. Create a simple demo script showing the full customer journey

The goal is a working prototype that demonstrates the core concept to cPort stakeholders. Focus on the happy path workflow and smooth user experience.

What final pieces need to be connected to make this a complete demonstration?
```

---

## **Key Points for All Prompts:**

1. **Always reference the docs**: "Based on FEATURES.md requirement F-XXX" or "According to REQUIREMENTS.md section..."

2. **Emphasize MVP scope**: "Focus on core functionality" and "Keep it simple for the 4-month timeline"

3. **Maintain context**: Reference previous work and overall architecture decisions

4. **Prioritize workflow**: User experience and business process over technical complexity

5. **Request clarification**: Ask Cursor to confirm understanding before major implementation

This prompt strategy breaks down the complex project into manageable pieces while ensuring Cursor maintains context about the overall goals and constraints of the cPort translation tool.
