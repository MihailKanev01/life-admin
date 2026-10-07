# Visual Direction — Phase 0

## Visual references reviewed

These are references for patterns, not designs to copy.

### Satheia
Strong greeting + concise life-admin summary + clear reminder status.
https://satheia.ai/

### Hubmee
Greeting, today's agenda and one attention item create a strong entry point.
https://hubmee.com/about-us

### Mel
Warmer life-admin presentation can reduce the feeling of bureaucracy.
https://www.thanksmel.com/

### Dribbble to-do/life-admin concepts
Document thumbnails and gradients can look attractive but can easily become visual noise. Use only where they improve recognition.
https://dribbble.com/shots/16499580-To-do-list-app-design

## Visual target

The target is a calm, modern, premium utility interface.

### Desktop

```
┌──────────────┬─────────────────────────────────────────────┐
│ LOGO         │ Good afternoon                             │
│              │                                             │
│ Home         │ 2 things need attention                    │
│ Things       │                                             │
│ Payments     │ ┌─────────────────────────────────────────┐ │
│ Search       │ │ Internet payment              TODAY €25 │ │
│              │ │ Car insurance                 5 DAYS    │ │
│ + Add        │ └─────────────────────────────────────────┘ │
│              │                                             │
│ Settings     │ Coming up                                   │
└──────────────┴─────────────────────────────────────────────┘
```

### Mobile

```
┌───────────────────────────┐
│ Good afternoon            │
│                           │
│ 2 things need attention   │
│                           │
│ Internet payment  TODAY   │
│ Car insurance     5 DAYS  │
│                           │
│ Coming up                 │
│ TV warranty       24 days │
│ Car service       1200 km │
├──────┬──────┬────┬────────┤
│ Home │Things│ + │Payments│
└──────┴──────┴────┴────────┘
```

## Design rules

- Prefer whitespace over borders.
- Prefer one strong attention hierarchy over many colors.
- Use color semantically, not decoratively.
- Avoid a grid of six or eight equal-sized dashboard cards.
- Use typography and spacing to establish hierarchy.
- Keep the home screen scannable in a few seconds.
- Never make the user decode the meaning of a color without a text label or icon.

## What to avoid

- rainbow dashboards
- excessive gradients
- gamification
- giant analytics sections
- persistent banners
- large empty card grids
- decorative charts with no decision value
