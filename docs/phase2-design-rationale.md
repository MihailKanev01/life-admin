# Phase 2 — Design Rationale

## Evidence

Current public-market and UX evidence points toward:
- limited primary navigation;
- prominent current attention;
- fast capture;
- contextual records;
- progressive disclosure;
- calm notification behavior.

Apple's current HIG recommends keeping tabs limited to frequently used top-level areas and labels concise. It also describes sidebars as suitable for wider screens and notes that they consume significant space, while layouts should make essential information easy to find and avoid crowding it with nonessential details.

Sources:
- https://developer.apple.com/design/human-interface-guidelines/tab-bars
- https://developer.apple.com/design/human-interface-guidelines/sidebars
- https://developer.apple.com/design/human-interface-guidelines/layout

## Visual references reviewed

### Hubmee
Useful:
- personalized greeting;
- daily/attention framing;
- visible primary navigation.

Risk:
- too many agenda/event blocks can make the home screen noisy.

Reference:
https://hubmee.com/about-us

### Kubbi
Useful:
- prominent add action;
- simple document/recent information presentation.

Risk:
- document-centric model is narrower than our product.

Reference:
https://kubbi.me/

### Manor
Useful:
- calm, dense utility dashboard for home management.

Risk:
- multiple persistent panels can overwhelm a general-purpose life-admin user.

Reference:
https://manor.app/

### Hartley
Useful:
- clear actions;
- household framing;
- friendly utility feel.

Risk:
- too many equal-weight categories can compete for attention.

Reference:
https://www.hellohartley.co.uk/

## Design decision

Our visual direction should combine:
- the calmness of utility software;
- the personal greeting/attention model of modern life-admin products;
- the fast add action of document/task tools;
- the information hierarchy of a list-first dashboard.

We should avoid:
- an equal grid of many cards;
- persistent analytics;
- decorative gradients everywhere;
- feature badges;
- excessive color coding.

## Layout principle

The first viewport should answer three questions:
1. What needs my attention?
2. What is coming next?
3. Is there anything waiting on someone else?

Everything else is secondary.
