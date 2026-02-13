# DESIGN_SYSTEM.md

**Project**: cPort Credit Union Translation Tool  
**Purpose**: Ultra-Modern Minimalist Design System & Component Library  
**Last Updated**: February 2026  
**Design Philosophy**: Nordic Minimalism meets Financial Trust

---

## DESIGN PHILOSOPHY

### Core Principles

1. **Radical Simplicity** - Every element must earn its place. Remove until it breaks.
2. **Calm Technology** - The interface should feel like a sanctuary, not a dashboard.
3. **Trust Through Clarity** - Financial tools require transparency and predictability.
4. **Inclusive by Default** - Accessibility is not an afterthought.
5. **Motion with Purpose** - Animations communicate state, never distract.

### Aesthetic DNA

Our design language draws from:
- **Swiss Typography** - Precision, grids, intentional whitespace
- **Japanese Ma (間)** - The beauty of negative space
- **Scandinavian Functionalism** - Form follows purpose
- **Brutalist Web** - Honest, unadorned, confident

---

## COLOR SYSTEM

### Brand Palette

```
┌─────────────────────────────────────────────────────────────┐
│  CPORT PRIMARY PALETTE - "Maine Coast at Dusk"              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ██████  Midnight        #0A0F1C   RGB(10, 15, 28)         │
│  ██████  Deep Ocean      #0D1B2A   RGB(13, 27, 42)         │
│  ██████  Steel Blue      #1B263B   RGB(27, 38, 59)         │
│  ██████  Harbor          #415A77   RGB(65, 90, 119)        │
│  ██████  Fog             #778DA9   RGB(119, 141, 169)      │
│  ██████  Sea Foam        #E0E8F0   RGB(224, 232, 240)      │
│  ██████  Pure White      #FFFFFF   RGB(255, 255, 255)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Semantic Colors

```
┌─────────────────────────────────────────────────────────────┐
│  FUNCTIONAL COLORS                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUCCESS SPECTRUM                                           │
│  ██████  Emerald-50      #ECFDF5   Background              │
│  ██████  Emerald-400     #34D399   Accent                  │
│  ██████  Emerald-600     #059669   Primary                 │
│                                                             │
│  WARNING SPECTRUM                                           │
│  ██████  Amber-50        #FFFBEB   Background              │
│  ██████  Amber-400       #FBBF24   Accent                  │
│  ██████  Amber-600       #D97706   Primary                 │
│                                                             │
│  DANGER SPECTRUM                                            │
│  ██████  Rose-50         #FFF1F2   Background              │
│  ██████  Rose-400        #FB7185   Accent                  │
│  ██████  Rose-600        #E11D48   Primary                 │
│                                                             │
│  INFO SPECTRUM                                              │
│  ██████  Sky-50          #F0F9FF   Background              │
│  ██████  Sky-400         #38BDF8   Accent                  │
│  ██████  Sky-600         #0284C7   Primary                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Language Identity Colors

Each supported language has an assigned color for instant visual recognition:

```
┌─────────────────────────────────────────────────────────────┐
│  LANGUAGE PALETTE                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ██████  Portuguese      #22C55E   Vibrant Green           │
│  ██████  French          #3B82F6   Royal Blue              │
│  ██████  Somali          #F59E0B   Warm Amber              │
│  ██████  Arabic          #8B5CF6   Rich Purple             │
│  ██████  Spanish         #EF4444   Passionate Red          │
│  ██████  English         #6B7280   Neutral Gray            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## TYPOGRAPHY

### Font Stack

**Primary**: `"Söhne"` (Klim Type Foundry)
- Fallback: `"SF Pro Display", "Inter", -apple-system, system-ui`
- Use: Headlines, navigation, buttons

**Secondary**: `"Söhne Mono"` 
- Fallback: `"JetBrains Mono", "SF Mono", monospace`
- Use: Numbers, data, timestamps

**Body**: `"Untitled Sans"` (Klim Type Foundry)
- Fallback: `"Inter", "Helvetica Neue", sans-serif`
- Use: Body text, descriptions, form labels

### Type Scale

```
┌─────────────────────────────────────────────────────────────┐
│  TYPOGRAPHY SCALE (Modular - 1.25 ratio)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Display    │  48px / 3rem    │  Line: 1.1   │  -0.02em    │
│  H1         │  32px / 2rem    │  Line: 1.2   │  -0.01em    │
│  H2         │  24px / 1.5rem  │  Line: 1.25  │  -0.005em   │
│  H3         │  20px / 1.25rem │  Line: 1.3   │  0          │
│  Body L     │  18px / 1.125rem│  Line: 1.6   │  0          │
│  Body       │  16px / 1rem    │  Line: 1.6   │  0          │
│  Body S     │  14px / 0.875rem│  Line: 1.5   │  0          │
│  Caption    │  12px / 0.75rem │  Line: 1.4   │  0.01em     │
│  Overline   │  11px / 0.6875  │  Line: 1.3   │  0.08em     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Weight System

```
Light      300   │  Used sparingly for large display text
Regular    400   │  Default body text
Medium     500   │  Emphasis, labels, secondary buttons
Semibold   600   │  Primary buttons, navigation
Bold       700   │  Headlines, critical actions
```

---

## SPACING SYSTEM

### Base Unit: 4px

All spacing derives from a 4px grid system for pixel-perfect alignment.

```
┌─────────────────────────────────────────────────────────────┐
│  SPACING TOKENS                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  --space-0     │  0px           │  None                     │
│  --space-1     │  4px   (0.25rem)  │  Micro                 │
│  --space-2     │  8px   (0.5rem)   │  Tiny                  │
│  --space-3     │  12px  (0.75rem)  │  Small                 │
│  --space-4     │  16px  (1rem)     │  Base                  │
│  --space-5     │  20px  (1.25rem)  │  Medium                │
│  --space-6     │  24px  (1.5rem)   │  Large                 │
│  --space-8     │  32px  (2rem)     │  XLarge                │
│  --space-10    │  40px  (2.5rem)   │  XXLarge               │
│  --space-12    │  48px  (3rem)     │  Section               │
│  --space-16    │  64px  (4rem)     │  Region                │
│  --space-20    │  80px  (5rem)     │  Page                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ELEVATION & DEPTH

### Shadow System

```css
/* Ultra-subtle layering - Dark Mode */
--shadow-0: none;
--shadow-1: 0 1px 2px rgba(0, 0, 0, 0.4);
--shadow-2: 0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
--shadow-3: 0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2);
--shadow-4: 0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.25);
--shadow-5: 0 16px 48px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.3);

/* Glow effects for interactive states */
--glow-focus: 0 0 0 3px rgba(59, 130, 246, 0.4);
--glow-success: 0 0 0 3px rgba(34, 211, 153, 0.4);
--glow-danger: 0 0 0 3px rgba(225, 29, 72, 0.4);
```

### Blur & Frosted Glass

```css
--blur-sm: blur(4px);
--blur-md: blur(8px);
--blur-lg: blur(16px);
--blur-xl: blur(24px);

/* Glass morphism for overlays */
--glass-dark: rgba(10, 15, 28, 0.8);
--glass-medium: rgba(27, 38, 59, 0.7);
--glass-light: rgba(65, 90, 119, 0.5);
```

---

## BORDER RADIUS

```
┌─────────────────────────────────────────────────────────────┐
│  RADIUS TOKENS                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  --radius-none    │  0px        │  Sharp edges              │
│  --radius-sm      │  4px        │  Subtle rounding          │
│  --radius-md      │  8px        │  Default components       │
│  --radius-lg      │  12px       │  Cards, containers        │
│  --radius-xl      │  16px       │  Large cards, modals      │
│  --radius-2xl     │  24px       │  Hero sections            │
│  --radius-full    │  9999px     │  Pills, avatars           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## MOTION & ANIMATION

### Timing Functions

```css
/* Easing curves */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Spring-like bouncy feel */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Smooth deceleration */
--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
```

### Duration Scale

```
--duration-instant: 75ms    │  Instant feedback
--duration-fast:    150ms   │  Micro-interactions
--duration-normal:  200ms   │  Standard transitions
--duration-slow:    300ms   │  Page transitions
--duration-slower:  500ms   │  Complex animations
```

### Key Animations

```css
/* Subtle fade-in for content */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Pulse for active voice recording */
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 0.4; }
  100% { transform: scale(1); opacity: 0.8; }
}

/* Soft breathing for loading states */
@keyframes breathe {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* Sound wave visualization */
@keyframes wave {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}
```

---

## COMPONENT SPECIFICATIONS

### 1. Language Selector Cards

```
┌─────────────────────────────────────────────────────────────┐
│  LANGUAGE CARD - Unselected                                 │
├─────────────────────────────────────────────────────────────┤
│  Size: 140px × 120px                                        │
│  Background: rgba(27, 38, 59, 0.6)                         │
│  Border: 1px solid rgba(65, 90, 119, 0.3)                  │
│  Radius: 16px                                               │
│  Padding: 20px                                              │
│                                                             │
│  ┌───────────────┐                                          │
│  │               │                                          │
│  │   🇵🇹  40px    │  ← Flag icon, centered                  │
│  │               │                                          │
│  │  Português    │  ← Native language name, 14px medium    │
│  │  Portuguese   │  ← English name, 11px, muted            │
│  └───────────────┘                                          │
│                                                             │
│  Hover: background rgba(65, 90, 119, 0.4)                  │
│         border-color: language-specific color              │
│         transform: translateY(-2px)                         │
│         transition: all 200ms ease-smooth                   │
│                                                             │
│  Selected: background language-color at 15% opacity        │
│            border: 2px solid language-color                │
│            shadow: 0 0 20px language-color at 20%          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Voice Recording Button

```
┌─────────────────────────────────────────────────────────────┐
│  VOICE BUTTON - Primary Action                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  IDLE STATE                                                 │
│  ┌─────────────────────────┐                                │
│  │          ○              │  Size: 80px diameter          │
│  │         ╱│╲             │  Background: #0D1B2A          │
│  │        ╱ │ ╲            │  Border: 2px solid #415A77    │
│  │       ╱  │  ╲           │  Icon: Microphone, 32px       │
│  └─────────────────────────┘  Color: #778DA9               │
│                                                             │
│  RECORDING STATE                                            │
│  ┌─────────────────────────┐                                │
│  │      ●●●●●●●            │  Background: #E11D48          │
│  │     ┌─────┐             │  Shadow: 0 0 40px #E11D48     │
│  │     │ ■■■ │             │  Icon: Stop square            │
│  │     └─────┘             │  Animated pulse rings         │
│  │      ●●●●●●●            │  3 concentric rings           │
│  └─────────────────────────┘                                │
│                                                             │
│  PROCESSING STATE                                           │
│  ┌─────────────────────────┐                                │
│  │       ◐──◓──◑           │  Rotating gradient border     │
│  │          ↻              │  Spinner icon                 │
│  │       ◑──◓──◐           │  "Processing..." label        │
│  └─────────────────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Translation Bubble

```
┌─────────────────────────────────────────────────────────────┐
│  TRANSLATION MESSAGE - Bidirectional Display                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CUSTOMER MESSAGE (Left-aligned)                            │
│  ┌───────────────────────────────────────────────┐          │
│  │ ● Customer · Portuguese · 2:34 PM             │ Header   │
│  ├───────────────────────────────────────────────┤          │
│  │                                               │          │
│  │ "Eu preciso abrir uma conta poupança"         │ Original │
│  │                                               │          │
│  ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤          │
│  │                                               │          │
│  │ "I need to open a savings account"            │ Transl.  │
│  │                                               │          │
│  │ ████████████░░░ 92% confident                 │ Score    │
│  └───────────────────────────────────────────────┘          │
│                                                             │
│  Background: rgba(34, 211, 153, 0.08)                      │
│  Left border: 3px solid #22C55E (Portuguese color)         │
│  Radius: 0 16px 16px 0                                      │
│                                                             │
│  STAFF MESSAGE (Right-aligned)                              │
│  ┌───────────────────────────────────────────────┐          │
│  │             Staff · English · 2:35 PM ●       │ Header   │
│  ├───────────────────────────────────────────────┤          │
│  │                                               │          │
│  │ "I can help you with that. Do you have       │ Original │
│  │  your ID with you today?"                     │          │
│  │                                               │          │
│  ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤          │
│  │                                               │          │
│  │ "Posso ajudá-lo com isso. Você tem           │ Transl.  │
│  │  sua identificação consigo hoje?"             │          │
│  │                                               │          │
│  │ ████████████████░ 98% confident               │ Score    │
│  └───────────────────────────────────────────────┘          │
│                                                             │
│  Background: rgba(59, 130, 246, 0.08)                      │
│  Right border: 3px solid #3B82F6                            │
│  Radius: 16px 0 0 16px                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Queue Status Card

```
┌─────────────────────────────────────────────────────────────┐
│  QUEUE CARD - Customer in Queue                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ #4  ●                                    ≡  MENU    │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │                                                     │    │
│  │  Maria Santos                                       │    │
│  │  ┌────┐  🇵🇹 Portuguese                             │    │
│  │  │ MS │  ⏱ ~8 min wait                              │    │
│  │  └────┘  📋 Account Opening                         │    │
│  │                                                     │    │
│  │  "Precisa abrir conta para receber..."              │    │
│  │                                                     │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │    │
│  │  │  CALL   │  │ ASSIGN  │  │ DETAILS │             │    │
│  │  └─────────┘  └─────────┘  └─────────┘             │    │
│  │                                                     │    │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Calm              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Size: 100% width, auto height                              │
│  Background: rgba(27, 38, 59, 0.5)                         │
│  Border: 1px solid rgba(65, 90, 119, 0.3)                  │
│  Radius: 12px                                               │
│  Padding: 16px                                              │
│                                                             │
│  Priority indicator: Left border 4px                        │
│  - Standard: #415A77                                        │
│  - High: #FBBF24                                            │
│  - Urgent: #E11D48                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. Confidence Indicator

```
┌─────────────────────────────────────────────────────────────┐
│  CONFIDENCE BAR - Translation Quality                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HIGH (90-100%)                                             │
│  ████████████████████  98%                                  │
│  Color: #34D399 (Emerald)                                   │
│  Label: "High confidence"                                   │
│                                                             │
│  MEDIUM (70-89%)                                            │
│  ██████████████░░░░░░  82%                                  │
│  Color: #FBBF24 (Amber)                                     │
│  Label: "Review suggested"                                  │
│                                                             │
│  LOW (<70%)                                                 │
│  ████████░░░░░░░░░░░░  58%                                  │
│  Color: #FB7185 (Rose)                                      │
│  Label: "Manual review needed"                              │
│                                                             │
│  Bar specs:                                                 │
│  - Height: 6px                                              │
│  - Radius: 3px                                              │
│  - Background track: rgba(255,255,255,0.1)                  │
│  - Animated fill on load                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ICONOGRAPHY

### Icon Style Guidelines

- **Weight**: 1.5px stroke for clarity at small sizes
- **Size**: 20px default, 16px compact, 24px comfortable
- **Style**: Outlined, not filled (maintains minimalist aesthetic)
- **Corners**: Rounded caps and joins
- **Grid**: 24×24 with 2px padding

### Core Icon Set

```
Navigation:
  ◀ Back         ▶ Forward       ⌂ Home         ☰ Menu
  ✕ Close        ↑ Up            ↓ Down         ↻ Refresh

Actions:
  + Add          ✓ Check         ✎ Edit         ⌫ Delete
  ↗ Export       ⤓ Download      ⎘ Copy         ⊞ Expand

Communication:
  🎤 Microphone   🔇 Mute         📢 Speaker      🔔 Notification
  💬 Chat         📧 Email        📞 Phone        👤 User

Status:
  ● Online       ○ Offline       ◐ Processing   ⚠ Warning
  ✓ Success      ✕ Error         ℹ Info         ⏱ Timer

Banking:
  💳 Card         💰 Money        📊 Chart        📋 Document
  🏦 Bank         🔒 Secure       ✅ Verified     📝 Form
```

---

## LAYOUT SYSTEM

### Grid Specifications

```
┌─────────────────────────────────────────────────────────────┐
│  12-COLUMN GRID SYSTEM                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Desktop (1440px+)                                          │
│  │ 72px │ ▤ ▤ ▤ ▤ ▤ ▤ ▤ ▤ ▤ ▤ ▤ ▤ │ 72px │                │
│  │margin│    12 cols @ 72px      │margin│                │
│  │      │    gap: 24px            │      │                │
│                                                             │
│  Tablet (768px - 1439px)                                    │
│  │ 32px │ ▤ ▤ ▤ ▤ ▤ ▤ ▤ ▤ │ 32px │                        │
│  │margin│   8 cols         │margin│                        │
│  │      │   gap: 20px      │      │                        │
│                                                             │
│  Mobile (< 768px)                                           │
│  │ 16px │ ▤ ▤ ▤ ▤ │ 16px │                                 │
│  │margin│  4 cols  │margin│                                 │
│  │      │  gap: 16px│     │                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Breakpoints

```css
--breakpoint-sm: 640px;   /* Small phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large monitors */
```

---

## FIGMA STRUCTURE

### Page Organization

```
📁 cPort Translation Tool
├── 📄 Cover
├── 📄 Design Tokens
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Effects
│   └── Icons
├── 📄 Components
│   ├── Atoms
│   │   ├── Buttons
│   │   ├── Inputs
│   │   ├── Labels
│   │   └── Icons
│   ├── Molecules
│   │   ├── Language Card
│   │   ├── Queue Item
│   │   ├── Translation Bubble
│   │   └── Voice Recorder
│   └── Organisms
│       ├── Header
│       ├── Translation Panel
│       ├── Queue List
│       └── Customer Form
├── 📄 Screens - Greeter
│   ├── Home
│   ├── Language Selection
│   ├── Active Translation
│   └── Customer Handoff
├── 📄 Screens - Teller
│   ├── Queue View
│   ├── Active Service
│   └── Session Summary
├── 📄 Screens - Consultor
│   ├── Dashboard
│   ├── Document Upload
│   └── Complex Service Flow
├── 📄 Screens - Admin
│   ├── User Management
│   ├── Analytics
│   └── System Health
├── 📄 Prototypes
│   ├── Greeter Flow
│   ├── Teller Flow
│   └── Full Journey
└── 📄 Developer Handoff
    ├── Specs
    └── Assets
```

### Component Variants

Each component should have the following variants in Figma:

```
State variants:
  - Default
  - Hover
  - Active/Pressed
  - Focused
  - Disabled
  - Loading
  - Error

Size variants:
  - Small (sm)
  - Medium (md) - default
  - Large (lg)

Theme variants:
  - Dark (primary)
  - Light (secondary)
```

---

## ACCESSIBILITY STANDARDS

### WCAG 2.1 AA Compliance

```
┌─────────────────────────────────────────────────────────────┐
│  ACCESSIBILITY REQUIREMENTS                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  COLOR CONTRAST                                             │
│  • Normal text: 4.5:1 minimum ratio                         │
│  • Large text (18px+): 3:1 minimum ratio                    │
│  • UI components: 3:1 minimum ratio                         │
│                                                             │
│  TOUCH TARGETS                                              │
│  • Minimum size: 44×44 pixels                               │
│  • Spacing between targets: 8px minimum                     │
│                                                             │
│  FOCUS STATES                                               │
│  • Visible focus ring on all interactive elements           │
│  • Focus ring: 3px solid with 4px offset                    │
│  • Never use outline: none without alternative              │
│                                                             │
│  SCREEN READERS                                             │
│  • All images have alt text                                 │
│  • Form inputs have associated labels                       │
│  • ARIA labels for icon-only buttons                        │
│  • Logical heading hierarchy (h1 → h2 → h3)                 │
│                                                             │
│  MOTION                                                     │
│  • Respect prefers-reduced-motion                           │
│  • No auto-playing animations >5 seconds                    │
│  • Pause/stop controls for any animation                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## DARK MODE SPECIFICATIONS

This design system is **dark-mode first** given the professional banking environment and extended screen time for staff.

### Surface Hierarchy

```
Layer 0 (Background):    #0A0F1C  - Page background
Layer 1 (Surface):       #0D1B2A  - Cards, panels
Layer 2 (Elevated):      #1B263B  - Dropdowns, modals
Layer 3 (Overlay):       #415A77  - Tooltips, popovers
```

### Text Hierarchy

```
Primary text:     #FFFFFF  - Headlines, primary content
Secondary text:   #E0E8F0  - Body text, descriptions
Tertiary text:    #778DA9  - Labels, timestamps
Disabled text:    #415A77  - Inactive states
```

---

This design system provides the foundation for building a cohesive, accessible, and beautiful translation tool that reflects cPort Credit Union's commitment to serving their community with excellence.
