# Phase 2 — Low-Fidelity Wireframes

These are layout specifications, not final visual designs.

## Desktop — Home

```
┌──────────────┬────────────────────────────────────────────────────────┐
│ LIFE ADMIN   │ Good afternoon, Михаил                                │
│              │                                                         │
│ ● Home       │ Needs attention                                        │
│   Things     │ ┌─────────────────────────────────────────────────────┐ │
│   Payments   │ │ Internet payment                         TODAY  €25 │ │
│   Search     │ │ Car insurance                           5 DAYS     │ │
│              │ └─────────────────────────────────────────────────────┘ │
│              │                                                         │
│ + Add        │ Coming up                                               │
│              │ ─────────────────────────────────────────────────────  │
│ Settings     │ ○ TV warranty                                  24 days │
│ Account      │ ○ Car service                                1,200 km │
│              │                                                         │
│              │ Waiting                                                 │
│              │ ─────────────────────────────────────────────────────  │
│              │ 📦 Return package                             Tomorrow │
└──────────────┴────────────────────────────────────────────────────────┘
```

## Desktop — Things

```
┌──────────────┬────────────────────────────────────────────────────────┐
│ LIFE ADMIN   │ Things                                      + Add       │
│              │                                                         │
│ Home         │ Search your things...                                  │
│ ● Things     │                                                         │
│ Payments     │ ┌────────────────┐ ┌────────────────┐                 │
│ Search       │ │ 🚗 Mazda 6     │ │ 🏠 Home        │                 │
│              │ │ 235,420 km     │ │ 2 attention    │                 │
│ + Add        │ │ 1 attention    │ │                │                 │
│              │ └────────────────┘ └────────────────┘                 │
│ Settings     │                                                         │
└──────────────┴────────────────────────────────────────────────────────┘
```

## Desktop — Thing detail

```
← Things

🚗 Mazda 6
235,420 km

Needs attention
────────────────────────────────────
Insurance                 5 days
Service                   1,200 km

Documents
────────────────────────────────────
Insurance.pdf
Registration.pdf

Payments
────────────────────────────────────
Insurance       €120     Jun 14

History
────────────────────────────────────
Oil change       228,000 km       €85
Brake service    220,000 km      €210
```

## Mobile — Home

```
┌──────────────────────────────┐
│ Good afternoon               │
│                              │
│ 2 things need attention      │
│                              │
│ Internet          TODAY €25  │
│ Car insurance      5 DAYS    │
│                              │
│ Coming up                    │
│ TV warranty        24 days   │
│ Car service        1200 km   │
│                              │
│ Waiting                      │
│ Package            Tomorrow  │
│                              │
├───────┬────────┬────┬────────┤
│ Home  │ Things │ +  │Payments│
└───────┴────────┴────┴────────┘
```

## Mobile — Quick Add

```
┌──────────────────────────────┐
│ Add                          │
│                              │
│ What do you want to remember?│
│                              │
│ [ Insurance expires June 14 ]│
│                              │
│ I found:                     │
│ 🚗 Mazda 6                   │
│ Insurance                    │
│ June 14, 2027                │
│                              │
│ [ Cancel ]     [ Confirm ]  │
└──────────────────────────────┘
```

## Mobile — Thing detail

```
┌──────────────────────────────┐
│ ← Mazda 6              ⋯     │
│                              │
│ 235,420 km                   │
│                              │
│ ATTENTION                    │
│ Insurance          5 days    │
│ Service         1,200 km     │
│                              │
│ DOCUMENTS                    │
│ Insurance.pdf                │
│ Registration.pdf             │
│                              │
│ PAYMENTS                     │
│ Insurance       €120 Jun 14  │
└──────────────────────────────┘
```
