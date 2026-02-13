# FIGMA_COMPONENTS.md

**Project**: cPort Credit Union Translation Tool  
**Purpose**: Figma-Ready Component Library Specifications  
**Last Updated**: February 2026  
**Figma Version**: Optimized for Figma 2024+

---

## FIGMA FILE STRUCTURE

```
📁 cPort Translation Tool - Design System
│
├── 📄 🎨 Cover
│   └── Project thumbnail and metadata
│
├── 📄 📐 Foundations
│   ├── Color Styles
│   ├── Typography Styles  
│   ├── Effect Styles (Shadows, Blurs)
│   ├── Grid Systems
│   └── Spacing Guidelines
│
├── 📄 🧱 Components
│   ├── ── Atoms ──────────
│   │   ├── Buttons
│   │   ├── Inputs
│   │   ├── Labels & Badges
│   │   ├── Icons
│   │   └── Indicators
│   │
│   ├── ── Molecules ──────
│   │   ├── Language Cards
│   │   ├── Queue Items
│   │   ├── Translation Bubbles
│   │   ├── Voice Controls
│   │   └── Form Groups
│   │
│   └── ── Organisms ──────
│       ├── Header
│       ├── Translation Panel
│       ├── Queue List
│       ├── Customer Cards
│       └── Workflow Tracker
│
├── 📄 📱 Screens - Greeter
├── 📄 💼 Screens - Teller
├── 📄 📋 Screens - Consultor
├── 📄 ⚙️ Screens - Admin
│
├── 📄 🎬 Prototypes
│   ├── Greeter Flow
│   ├── Teller Flow
│   └── Full Customer Journey
│
└── 📄 📦 Handoff
    ├── Component Specs
    ├── Redlines
    └── Asset Export
```

---

## COLOR STYLES

### How to Set Up in Figma

1. Create a new **Local Styles** library
2. Use **Variables** for the color system (Figma 2024+)
3. Create **Color Styles** that reference variables

### Color Variables

```yaml
# Brand Colors (Collection: Brand)
brand/midnight:     #0A0F1C
brand/deep-ocean:   #0D1B2A
brand/steel-blue:   #1B263B
brand/harbor:       #415A77
brand/fog:          #778DA9
brand/sea-foam:     #E0E8F0
brand/white:        #FFFFFF

# Semantic Colors (Collection: Semantic)
semantic/success/50:   #ECFDF5
semantic/success/400:  #34D399
semantic/success/600:  #059669

semantic/warning/50:   #FFFBEB
semantic/warning/400:  #FBBF24
semantic/warning/600:  #D97706

semantic/danger/50:    #FFF1F2
semantic/danger/400:   #FB7185
semantic/danger/600:   #E11D48

semantic/info/50:      #F0F9FF
semantic/info/400:     #38BDF8
semantic/info/600:     #0284C7

# Language Colors (Collection: Languages)
lang/portuguese:   #22C55E
lang/french:       #3B82F6
lang/somali:       #F59E0B
lang/arabic:       #8B5CF6
lang/spanish:      #EF4444
lang/english:      #6B7280
```

### Color Styles

```yaml
# Background Styles
bg/page:         brand/midnight
bg/surface:      brand/deep-ocean
bg/elevated:     brand/steel-blue
bg/overlay:      brand/harbor @ 50%

# Text Styles
text/primary:    brand/white
text/secondary:  brand/sea-foam
text/tertiary:   brand/fog
text/disabled:   brand/harbor

# Border Styles
border/default:  brand/harbor @ 30%
border/subtle:   brand/steel-blue
border/focus:    semantic/info/400

# Interactive Styles
interactive/default:   semantic/info/600
interactive/hover:     semantic/info/400
interactive/active:    #1D4ED8
interactive/disabled:  brand/harbor
```

---

## TYPOGRAPHY STYLES

### Text Styles Setup

```yaml
# Display
Display:
  Font: Söhne (or fallback: SF Pro Display)
  Size: 48px
  Line Height: 52px (108%)
  Letter Spacing: -0.02em
  Weight: Light (300)

# Headlines
H1:
  Font: Söhne
  Size: 32px
  Line Height: 38px (119%)
  Letter Spacing: -0.01em
  Weight: Semibold (600)

H2:
  Font: Söhne
  Size: 24px
  Line Height: 30px (125%)
  Letter Spacing: -0.005em
  Weight: Semibold (600)

H3:
  Font: Söhne
  Size: 20px
  Line Height: 26px (130%)
  Letter Spacing: 0
  Weight: Medium (500)

# Body
Body Large:
  Font: Untitled Sans (or fallback: Inter)
  Size: 18px
  Line Height: 29px (161%)
  Letter Spacing: 0
  Weight: Regular (400)

Body:
  Font: Untitled Sans
  Size: 16px
  Line Height: 26px (162%)
  Letter Spacing: 0
  Weight: Regular (400)

Body Small:
  Font: Untitled Sans
  Size: 14px
  Line Height: 21px (150%)
  Letter Spacing: 0
  Weight: Regular (400)

# Labels
Label:
  Font: Söhne
  Size: 14px
  Line Height: 17px
  Letter Spacing: 0
  Weight: Medium (500)

Caption:
  Font: Untitled Sans
  Size: 12px
  Line Height: 17px (142%)
  Letter Spacing: 0.01em
  Weight: Regular (400)

Overline:
  Font: Söhne
  Size: 11px
  Line Height: 14px
  Letter Spacing: 0.08em
  Weight: Medium (500)
  Text Transform: UPPERCASE

# Mono
Mono:
  Font: Söhne Mono (or fallback: JetBrains Mono)
  Size: 14px
  Line Height: 20px
  Letter Spacing: 0
  Weight: Regular (400)
```

---

## EFFECT STYLES

### Shadows

```yaml
# Shadow Styles
shadow/sm:
  Type: Drop Shadow
  Color: #000000 @ 40%
  X: 0, Y: 1, Blur: 2, Spread: 0

shadow/md:
  Type: Drop Shadow (2 layers)
  Layer 1: #000000 @ 30%, X: 0, Y: 2, Blur: 4
  Layer 2: #000000 @ 20%, X: 0, Y: 1, Blur: 2

shadow/lg:
  Type: Drop Shadow (2 layers)
  Layer 1: #000000 @ 40%, X: 0, Y: 4, Blur: 12
  Layer 2: #000000 @ 20%, X: 0, Y: 2, Blur: 4

shadow/xl:
  Type: Drop Shadow (2 layers)
  Layer 1: #000000 @ 50%, X: 0, Y: 8, Blur: 24
  Layer 2: #000000 @ 25%, X: 0, Y: 4, Blur: 8

shadow/glow-blue:
  Type: Drop Shadow
  Color: #3B82F6 @ 40%
  X: 0, Y: 0, Blur: 20, Spread: 0

shadow/glow-green:
  Type: Drop Shadow
  Color: #22C55E @ 40%
  X: 0, Y: 0, Blur: 20, Spread: 0

shadow/glow-red:
  Type: Drop Shadow
  Color: #E11D48 @ 40%
  X: 0, Y: 0, Blur: 20, Spread: 0
```

### Blur Effects

```yaml
blur/sm:
  Type: Layer Blur
  Amount: 4px

blur/md:
  Type: Layer Blur
  Amount: 8px

blur/lg:
  Type: Layer Blur
  Amount: 16px

blur/backdrop:
  Type: Background Blur
  Amount: 12px
```

---

## COMPONENT SPECIFICATIONS

### ATOMS

---

#### Button Component

**Component Name**: `Button`

**Variants**:
- `variant`: primary | secondary | danger | ghost
- `size`: sm | md | lg
- `state`: default | hover | active | disabled | loading
- `iconPosition`: none | left | right | only

**Base Properties (MD size)**:
```yaml
Frame:
  Width: Hug contents (min 120px)
  Height: 48px
  Padding: 0 24px
  Border Radius: 8px
  
Auto Layout:
  Direction: Horizontal
  Gap: 8px
  Alignment: Center, Center
```

**Variant Specifications**:

```yaml
# Primary
primary/default:
  Fill: #3B82F6
  Text: #FFFFFF
  
primary/hover:
  Fill: #2563EB
  Effect: shadow/md
  Transform: translateY(-1px) - represent with different frame position
  
primary/active:
  Fill: #1D4ED8
  Effect: none
  
primary/disabled:
  Fill: #415A77
  Text: #778DA9

# Secondary
secondary/default:
  Fill: #1B263B
  Stroke: 1px #415A77
  Text: #E0E8F0

secondary/hover:
  Fill: #2D3B50
  Stroke: 1px #778DA9
  
# Danger
danger/default:
  Fill: #E11D48
  Text: #FFFFFF

# Ghost
ghost/default:
  Fill: transparent
  Text: #778DA9

ghost/hover:
  Fill: #1B263B @ 50%
```

**Size Variants**:
```yaml
sm:
  Height: 36px
  Padding: 0 16px
  Font: Label (14px)

md:
  Height: 48px
  Padding: 0 24px
  Font: Label (14px)

lg:
  Height: 56px
  Padding: 0 32px
  Font: Body (16px)
```

---

#### Input Component

**Component Name**: `Input`

**Variants**:
- `state`: default | focused | error | disabled
- `type`: text | password | search
- `hasIcon`: true | false

**Properties**:
```yaml
Frame:
  Width: Fill container (or fixed based on context)
  Height: 48px
  Padding: 0 16px
  Border Radius: 8px
  Fill: #1B263B
  Stroke: 1px #415A77

Text:
  Style: Body
  Color: #FFFFFF
  Placeholder Color: #778DA9

States:
  focused:
    Stroke: 2px #3B82F6
    Effect: 0 0 0 3px rgba(59, 130, 246, 0.2)
    
  error:
    Stroke: 2px #E11D48
    Effect: 0 0 0 3px rgba(225, 29, 72, 0.2)
    
  disabled:
    Fill: #0D1B2A
    Text: #415A77
```

---

#### Badge Component

**Component Name**: `Badge`

**Variants**:
- `variant`: default | success | warning | danger | info
- `size`: sm | md

**Properties**:
```yaml
Frame:
  Height: 24px (md) | 20px (sm)
  Padding: 0 8px
  Border Radius: 12px (pill)

md/success:
  Fill: rgba(34, 211, 153, 0.15)
  Stroke: 1px rgba(34, 211, 153, 0.3)
  Text: #34D399
  Font: Caption (12px) Medium

md/warning:
  Fill: rgba(251, 191, 36, 0.15)
  Text: #FBBF24

md/danger:
  Fill: rgba(225, 29, 72, 0.15)
  Text: #FB7185

md/info:
  Fill: rgba(56, 189, 248, 0.15)
  Text: #38BDF8
```

---

#### Status Indicator

**Component Name**: `StatusIndicator`

**Variants**:
- `status`: online | offline | busy | away

**Properties**:
```yaml
Frame:
  Width: 8px
  Height: 8px
  Border Radius: 4px (circle)

online:
  Fill: #34D399
  
offline:
  Fill: #6B7280
  
busy:
  Fill: #E11D48
  
away:
  Fill: #FBBF24
```

---

#### Icon Component

**Component Name**: `Icon`

**Variants**:
- `name`: (swap instance for different icons)
- `size`: 16 | 20 | 24 | 32

**Properties**:
```yaml
Frame:
  Width/Height: Based on size variant
  
Vector:
  Stroke Weight: 1.5px
  Stroke Cap: Round
  Stroke Join: Round
  Color: currentColor (inherit)
```

---

### MOLECULES

---

#### Language Card

**Component Name**: `LanguageCard`

**Variants**:
- `language`: portuguese | french | somali | arabic | spanish
- `state`: default | hover | selected

**Properties**:
```yaml
Frame:
  Width: 120px
  Height: 140px
  Padding: 20px
  Border Radius: 16px
  
Auto Layout:
  Direction: Vertical
  Gap: 8px
  Alignment: Center

default:
  Fill: #1B263B
  Stroke: 1px rgba(65, 90, 119, 0.3)

hover:
  Fill: #2D3B50
  Stroke: 1px {language color}
  Transform: translateY(-4px)
  Effect: shadow/lg

selected:
  Fill: {language color} @ 15%
  Stroke: 2px {language color}
  Effect: shadow/glow-{language}

Content:
  Flag:
    Size: 36px (emoji or icon)
    
  Native Name:
    Style: Label (14px Medium)
    Color: #FFFFFF
    
  English Name:
    Style: Caption (11px)
    Color: #778DA9
    
  Selection Dot (only in selected):
    Size: 8px
    Fill: {language color}
```

**Language Color Mapping**:
```yaml
portuguese: #22C55E
french:     #3B82F6
somali:     #F59E0B
arabic:     #8B5CF6
spanish:    #EF4444
```

---

#### Queue Item Card

**Component Name**: `QueueItem`

**Variants**:
- `priority`: standard | high | urgent
- `state`: waiting | current | completed

**Properties**:
```yaml
Frame:
  Width: Fill container
  Height: Auto (min 80px)
  Padding: 16px
  Border Radius: 12px
  Fill: #1B263B
  Stroke: 1px rgba(65, 90, 119, 0.3)
  
Left Border (priority indicator):
  Width: 4px
  standard: #415A77
  high: #FBBF24
  urgent: #E11D48

current state:
  Fill: rgba(59, 130, 246, 0.1)
  Stroke: 1px #3B82F6

Auto Layout:
  Direction: Vertical
  Gap: 8px
  
Content Structure:
  Row 1 (Header):
    Position Number: H3 style
    Customer Name: Body style
    Menu Icon: 20px, right aligned
    
  Row 2 (Details):
    Language Flag: 16px
    Service Type: Caption
    Wait Time: Caption, right aligned
    
  Row 3 (Context - optional):
    Quote text: Body Small, italic, #778DA9
    
  Row 4 (Actions - on hover):
    Button group: Call, Assign, Details
```

---

#### Translation Bubble

**Component Name**: `TranslationBubble`

**Variants**:
- `speaker`: customer | staff
- `hasConfidence`: true | false

**Properties**:
```yaml
Frame:
  Width: Auto (max 80% of parent)
  Padding: 16px
  Border Radius: 16px (with one corner squared)
  
customer:
  Fill: rgba(34, 211, 153, 0.08)
  Border: left 3px {language color}
  Border Radius: 0 16px 16px 0
  Alignment: Left
  
staff:
  Fill: rgba(59, 130, 246, 0.08)
  Border: right 3px #3B82F6
  Border Radius: 16px 0 0 16px
  Alignment: Right

Content Structure:
  Header:
    Speaker label: Caption, #778DA9
    Language: Caption
    Time: Caption, right
    
  Original Text:
    Style: Body
    Color: #FFFFFF
    
  Divider:
    Height: 1px
    Color: rgba(255, 255, 255, 0.1)
    Margin: 12px 0
    
  Translated Text:
    Style: Body Small
    Color: #E0E8F0
    
  Confidence (if shown):
    Progress bar: 100% width, 4px height
    Percentage: Caption, right
```

---

#### Voice Control Button

**Component Name**: `VoiceControl`

**Variants**:
- `size`: sm | md | lg
- `state`: idle | recording | processing | success | error

**Properties**:
```yaml
# Large (Primary interaction)
lg:
  Frame:
    Width: 160px
    Height: 160px
    Border Radius: 80px (circle)
    
  idle:
    Fill: #0D1B2A
    Stroke: 3px #415A77
    Icon: Microphone, 48px, #778DA9
    Label: "Hold to Speak", Caption
    
  recording:
    Fill: #E11D48
    Stroke: none
    Icon: Stop, 48px, #FFFFFF
    Effect: shadow/glow-red
    Animation: 3 pulse rings expanding outward
    
  processing:
    Fill: #1B263B
    Stroke: 3px gradient rotating
    Icon: Spinner, 48px
    
  success:
    Fill: #059669
    Icon: Check, 48px
    Effect: shadow/glow-green
    
  error:
    Fill: #E11D48
    Icon: X, 48px

# Medium (Secondary)
md:
  Width/Height: 80px
  Icon: 32px
  
# Small (Compact)
sm:
  Width/Height: 48px
  Icon: 24px
  No label
```

---

#### Form Group

**Component Name**: `FormGroup`

**Properties**:
```yaml
Frame:
  Width: Fill container
  Gap: 6px
  
Auto Layout:
  Direction: Vertical

Content:
  Label:
    Style: Label (14px Medium)
    Color: #778DA9
    
  Input:
    [Input component instance]
    
  Helper Text (optional):
    Style: Caption
    Color: #778DA9
    
  Error Message (optional):
    Style: Caption
    Color: #FB7185
    Icon: Alert circle, 12px, left
```

---

### ORGANISMS

---

#### Header

**Component Name**: `Header`

**Variants**:
- `role`: greeter | teller | consultor | admin

**Properties**:
```yaml
Frame:
  Width: Fill container
  Height: 64px
  Fill: #0D1B2A
  Border: bottom 1px rgba(65, 90, 119, 0.3)

Auto Layout:
  Direction: Horizontal
  Padding: 0 24px
  Gap: 24px
  Justify: Space Between
  Align: Center

Content Structure:
  Left Section:
    Logo: 32px icon + "cPort Translation" text
    Divider: vertical 1px, 24px height
    Section Name: H3 style, #778DA9
    
  Right Section:
    Status Badge: [Badge component - connection status]
    User Info:
      Name: Body Small
      Status: [StatusIndicator]
    Menu Button: Icon button, 40px
```

---

#### Translation Panel

**Component Name**: `TranslationPanel`

**Properties**:
```yaml
Frame:
  Width: Fill or Fixed 360px
  Height: Fill
  Fill: #0D1B2A
  Border Radius: 16px
  Stroke: 1px rgba(65, 90, 119, 0.3)
  
Content Structure:
  Header:
    Height: 56px
    Title: "Translation", H3
    Language Pair: "{Flag} Language ↔ English {Flag}", Caption
    Close Button (if modal): Icon button
    
  Voice Section:
    Padding: 24px
    [VoiceControl lg component]
    
  Conversation:
    Scrollable area
    Padding: 16px
    Gap: 16px
    [TranslationBubble] instances
    
  Footer:
    Height: 64px
    Quick Actions: Replay, Edit, Copy buttons
```

---

#### Queue List

**Component Name**: `QueueList`

**Properties**:
```yaml
Frame:
  Width: 320px (or fill)
  Height: Fill
  Fill: #0D1B2A
  Border Radius: 16px
  
Content Structure:
  Header:
    Title: "Queue", H3
    Count Badge: [Badge]
    Filter dropdown (optional)
    
  Stats Row:
    Teller Line: X waiting, ~Y min
    Consultation: X waiting, ~Y min
    
  List:
    Scrollable
    Gap: 12px
    [QueueItem] instances
    
  Footer:
    "Call Next" button: [Button primary lg]
```

---

#### Customer Context Card

**Component Name**: `CustomerContext`

**Properties**:
```yaml
Frame:
  Width: Fill
  Padding: 24px
  Fill: #0D1B2A
  Border Radius: 16px
  Stroke: 1px rgba(65, 90, 119, 0.3)

Content Structure:
  Header Row:
    Avatar: 64px circle, initials
    Name: H2
    Language: Badge with flag
    
  Details Row:
    Service Type: Label + value
    Mood: Indicator
    Wait Time: Label + value
    
  Context Section:
    Title: "Context from Greeter", Overline
    Quote: Body, italic, with quotation marks
    
  Action Row:
    Buttons: Transfer, Pause, Complete
```

---

#### Workflow Tracker

**Component Name**: `WorkflowTracker`

**Properties**:
```yaml
Frame:
  Width: Fill
  Padding: 20px
  
Content Structure:
  Steps (vertical list):
    Each Step:
      Status Icon:
        Complete: ● (solid circle, green)
        Current: ◐ (half circle, blue, animated)
        Pending: ○ (outline circle, gray)
        
      Connector Line:
        Complete: solid 2px green
        Pending: dashed 2px gray
        
      Step Label:
        Style: Body Small
        Color: based on status
```

---

## PROTOTYPE SPECIFICATIONS

### Greeter Flow

```yaml
Screen 1: Login
  → Success → Screen 2

Screen 2: UI Selection
  → Standard Mode → Screen 3A
  → Focus Mode → Screen 3B

Screen 3A: Greeter Dashboard (Standard)
  → Select Language → Update panel
  → Tap Voice → Open Translation Overlay
  → Add to Queue → Success feedback
  
Screen 3B: Greeter Dashboard (Focus)
  → Hold Voice Button → Recording state
  → Release → Processing → Result
  → Tap Language → Change language

Screen 4: Translation Overlay
  → Hold to Record → Recording
  → Release → Processing → Translation displayed
  → Close → Return to dashboard
```

### Teller Flow

```yaml
Screen 1: Teller Dashboard
  → Call Next → Customer Context loads
  → Tap Voice → Recording
  → Quick Phrase → Auto-translated
  → Complete Session → Summary + Next customer
```

### Interactions to Prototype

1. **Button press states** - Use Smart Animate
2. **Modal open/close** - Overlay with blur backdrop
3. **Voice recording pulse** - Component with animated variant
4. **Queue updates** - Simulate real-time with delays
5. **Translation appearing** - Fade in with slide

---

## EXPORT SPECIFICATIONS

### Asset Export Settings

```yaml
Icons:
  Format: SVG
  Size: 1x
  Include: stroke settings, no fill override
  
Illustrations:
  Format: PNG
  Sizes: 1x, 2x, 3x
  Background: Transparent
  
Flags:
  Format: PNG
  Sizes: 1x, 2x, 3x
  Or: Use emoji in code
  
Logos:
  Format: SVG (primary), PNG (fallback)
  Variations: Light, Dark, Monochrome
```

### Handoff Annotations

For each component, include:
1. **Spacing values** - In pixels
2. **Color references** - Use token names
3. **Typography** - Use text style names
4. **States** - Document all states
5. **Responsive behavior** - How component scales
6. **Animation specs** - Timing, easing, duration

---

## DESIGN TOKENS (JSON Export)

```json
{
  "color": {
    "brand": {
      "midnight": { "value": "#0A0F1C" },
      "deepOcean": { "value": "#0D1B2A" },
      "steelBlue": { "value": "#1B263B" },
      "harbor": { "value": "#415A77" },
      "fog": { "value": "#778DA9" },
      "seaFoam": { "value": "#E0E8F0" },
      "white": { "value": "#FFFFFF" }
    },
    "semantic": {
      "success": {
        "50": { "value": "#ECFDF5" },
        "400": { "value": "#34D399" },
        "600": { "value": "#059669" }
      },
      "warning": {
        "50": { "value": "#FFFBEB" },
        "400": { "value": "#FBBF24" },
        "600": { "value": "#D97706" }
      },
      "danger": {
        "50": { "value": "#FFF1F2" },
        "400": { "value": "#FB7185" },
        "600": { "value": "#E11D48" }
      },
      "info": {
        "50": { "value": "#F0F9FF" },
        "400": { "value": "#38BDF8" },
        "600": { "value": "#0284C7" }
      }
    },
    "language": {
      "portuguese": { "value": "#22C55E" },
      "french": { "value": "#3B82F6" },
      "somali": { "value": "#F59E0B" },
      "arabic": { "value": "#8B5CF6" },
      "spanish": { "value": "#EF4444" },
      "english": { "value": "#6B7280" }
    }
  },
  "spacing": {
    "0": { "value": "0px" },
    "1": { "value": "4px" },
    "2": { "value": "8px" },
    "3": { "value": "12px" },
    "4": { "value": "16px" },
    "5": { "value": "20px" },
    "6": { "value": "24px" },
    "8": { "value": "32px" },
    "10": { "value": "40px" },
    "12": { "value": "48px" },
    "16": { "value": "64px" },
    "20": { "value": "80px" }
  },
  "borderRadius": {
    "none": { "value": "0px" },
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "12px" },
    "xl": { "value": "16px" },
    "2xl": { "value": "24px" },
    "full": { "value": "9999px" }
  },
  "typography": {
    "fontFamily": {
      "primary": { "value": "Söhne, SF Pro Display, Inter, system-ui" },
      "secondary": { "value": "Untitled Sans, Inter, Helvetica Neue, sans-serif" },
      "mono": { "value": "Söhne Mono, JetBrains Mono, SF Mono, monospace" }
    },
    "fontSize": {
      "display": { "value": "48px" },
      "h1": { "value": "32px" },
      "h2": { "value": "24px" },
      "h3": { "value": "20px" },
      "bodyLg": { "value": "18px" },
      "body": { "value": "16px" },
      "bodySm": { "value": "14px" },
      "caption": { "value": "12px" },
      "overline": { "value": "11px" }
    }
  },
  "shadow": {
    "sm": { "value": "0 1px 2px rgba(0, 0, 0, 0.4)" },
    "md": { "value": "0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)" },
    "lg": { "value": "0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)" },
    "xl": { "value": "0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.25)" }
  },
  "animation": {
    "duration": {
      "instant": { "value": "75ms" },
      "fast": { "value": "150ms" },
      "normal": { "value": "200ms" },
      "slow": { "value": "300ms" },
      "slower": { "value": "500ms" }
    },
    "easing": {
      "linear": { "value": "linear" },
      "easeIn": { "value": "cubic-bezier(0.4, 0, 1, 1)" },
      "easeOut": { "value": "cubic-bezier(0, 0, 0.2, 1)" },
      "easeInOut": { "value": "cubic-bezier(0.4, 0, 0.2, 1)" },
      "spring": { "value": "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      "smooth": { "value": "cubic-bezier(0.22, 1, 0.36, 1)" }
    }
  }
}
```

---

This component library specification provides everything needed to build the cPort Translation Tool design system in Figma with proper organization, variants, and developer handoff documentation.
