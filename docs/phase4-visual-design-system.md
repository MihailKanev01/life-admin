# Phase 4 — Visual Design System

Status: v1 proposal

## Product feeling

The interface should feel:

- calm
- trustworthy
- useful
- modern
- personal
- lightweight

It should not feel:

- gamified
- corporate-heavy
- overly colorful
- analytics-first
- crowded

## Visual principles

### 1. Content creates hierarchy

Use spacing and typography before borders, shadows or color.

### 2. One primary accent

Most of the interface is neutral. Accent color is reserved for primary actions and selected/interactive states.

### 3. Semantic colors only

- Danger: an item requires attention now.
- Warning: something is approaching.
- Success: completed / all clear.
- Neutral: informational.

Never use color as the only way to communicate state.

### 4. Lists for repeated information

Use rows for reminders, payments, search results and history.

Use cards only for distinct Things and summary groups.

### 5. Soft surfaces

Large areas use a warm off-white page background and white content surfaces.

Borders are subtle. Shadows are reserved for overlays and elevated actions.

## Design tokens

### Color

- Canvas: #F6F6F3
- Surface: #FFFFFF
- Surface subtle: #F0F0EC
- Border: #E4E4DE
- Text primary: #171715
- Text secondary: #71736C
- Text tertiary: #A0A19A
- Primary accent: #242421
- Attention: #A84E45
- Warning: #A56A27
- Success: #3F6F4D

### Typography

Font stack:
- Inter
- system-ui
- -apple-system
- BlinkMacSystemFont

Recommended scale:

| Role | Size |
|---|---:|
| Display | 44–50px |
| Page title | 34–40px |
| Section title | 18–20px |
| Body | 14–15px |
| Supporting | 12–13px |
| Eyebrow | 10–11px |

Weights:
- 800 display/title
- 700 section/actions
- 600 labels
- 400 body

### Spacing

Base unit: 4px.

Common values:
- 8px compact gap
- 12px control gap
- 16px row padding
- 20–24px panel padding
- 32px section separation
- 48–56px page top padding

### Shape

- Small control radius: 10–12px
- Surface radius: 16–18px
- Modal radius: 20–24px
- Pills: 999px

## Component behavior

### Navigation

Desktop:
- narrow sidebar
- active item uses subtle filled background

Mobile:
- fixed bottom navigation
- exactly four primary destinations visible
- central Quick Add action

### Primary action

Dark filled button with strong contrast.

Do not create multiple competing primary buttons within one section.

### Attention row

Use:
- small semantic dot
- title
- supporting date/status
- amount only when relevant
- chevron for drill-in

Do not use full red backgrounds.

### Empty state

Empty states should reassure rather than look like an error.

Example:
"You're all caught up."

### Modal / sheet

Desktop:
- centered or bottom-aligned compact dialog

Mobile:
- bottom sheet
- safe-area padding
- large enough touch targets

## Responsive strategy

### Desktop
- sidebar
- top search
- centered content max width
- two-column secondary sections

### Tablet
- retain desktop information hierarchy
- reduce page margins
- cards collapse earlier

### Mobile
- one column
- bottom nav
- bottom sheets
- minimal toolbar
- no horizontal overflow

## Accessibility

- semantic HTML
- keyboard focus states
- visible focus ring
- sufficient text contrast
- touch targets at least 44px where appropriate
- never depend solely on color
- labels for icon-only controls

## Reference direction

Useful current references:
- Apple HIG layout and toolbars
- calm utility dashboards
- modern life-admin products
- list-first task interfaces

Avoid copying any competitor visually.
