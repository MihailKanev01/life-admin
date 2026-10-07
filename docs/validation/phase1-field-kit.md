# Phase 1 Field Kit — Direct User Validation

> This document is an execution template. It contains no fabricated participant data.
> The Phase 1 gate can only be closed with real sessions.

## Objective

Determine whether Life Admin solves a meaningful problem better than a user's current mix of Reminders, Calendar, Notes, email, files or spreadsheets.

Primary question:

> Does Life Admin reduce uncertainty and make the next life-admin action easier, without creating another system that requires too much maintenance?

## Participant mix

Target 10–15 participants across at least three profiles:

| Profile | Target | What to learn |
|---|---:|---|
| Reminder/Calendar user | 3–5 | Is existing tooling already enough? |
| Multi-tool admin manager | 3–5 | Does consolidation/context materially help? |
| Asset-responsible user | 3–5 | Does Things + history + documents reduce effort? |

Do not recruit only people who already like productivity apps.

## Screen

Look for people who:
- manage recurring personal responsibilities;
- have at least one of: vehicle, home/appliances, subscriptions, warranties or important documents;
- have forgotten, delayed or searched for life-admin information in the past;
- currently use at least one workaround.

Exclude:
- people whose professional workflow is the main use case;
- productivity enthusiasts who already enjoy maintaining complex systems;
- specialist property managers;
- participants unwilling to discuss their current workflow at a high level.

Never request passwords, banking credentials, identity documents, medical information or other sensitive records.

## Session structure

### 0–3 min — Warm-up

Ask:
1. “Walk me through the last annoying personal-admin thing you had to handle.”
2. “Where did you keep the information?”
3. “What made it annoying?”

Do not mention Life Admin yet.

### 3–8 min — Current workflow

Ask:
1. “Show or describe how you would handle this today.”
2. “What do you have to remember yourself?”
3. “Where can information get lost?”
4. “What usually causes you to delay it?”

Record their exact language.

### 8–15 min — Generic-tool baseline

Scenario:

> “Your car insurance expires on June 14. You have the insurance PDF, last service information, payment amount, and the car itself.”

Ask the participant to think through their normal method.

Observe:
- what they create first;
- where the document goes;
- where service history goes;
- where payment information goes;
- what they would need later before acting.

Do not help unless they are completely blocked.

### 15–23 min — Life Admin

Use the prototype without explaining its intended advantage.

Tasks:
1. Capture the insurance deadline in Quick Add.
2. Review the proposed Type / Context / When.
3. Decide whether to save it.
4. Open the Mazda 6.
5. Find the insurance, document, service history and payment context.
6. Explain what they would do next.

Observe:
- trust in proposed context;
- edits/corrections;
- time to find information;
- wrong turns;
- whether the Thing model makes sense without explanation.

### 23–27 min — Comparison

Ask exactly:

> “Which setup would you rather use for this kind of thing, and why?”

Then:

> “What, if anything, was easier?”

Then:

> “What would make you go back to your current setup?”

Do not defend the product.

### 27–30 min — Debrief

Ask:
1. “What is the most useful part?”
2. “What feels unnecessary?”
3. “What would you expect to happen automatically?”
4. “Would you use this for your real life-admin tasks? Why or why not?”

## Scoring

Each core task gets:

- **2 — independent success:** completed without moderator help;
- **1 — partial:** hesitation, correction, or minor help;
- **0 — failure:** unable to complete or misunderstood the model.

Also record:

| Metric | Recording |
|---|---|
| Time to first useful action | seconds |
| Wrong turns | count |
| Help requests | count |
| Confidence | 1–5 |
| Preference | Generic / Life Admin / No preference |
| Maintenance burden | Low / Medium / High |
| Main reason | participant's words |

## Critical observations

### Quick Add
Positive:
- participant understands what is being proposed without explanation;
- participant checks/corrects details;
- participant trusts the explicit review-before-save pattern.

Negative:
- participant expects silent creation;
- proposed context feels magical/wrong;
- review adds more effort than it removes.

### Things
Positive:
- participant naturally understands “Mazda 6” as the place where related admin belongs;
- participant uses the Thing to retrieve context before acting;
- participant says this avoids hunting across apps/folders.

Negative:
- participant treats it as another folder/list;
- participant asks why the reminder cannot just live in Reminders;
- context does not change the next action.

### Home
Positive:
- participant can quickly explain why an item needs attention now;
- participant does not need to inspect the full inventory first.

Negative:
- participant wants a conventional task list;
- prioritization feels arbitrary or unnecessary.

## Evidence capture

For every participant, record:
- profile;
- current tools;
- recent real example;
- current workaround;
- observed pain;
- task results;
- exact quotes;
- strongest positive signal;
- strongest negative signal;
- product implication.

Never turn moderator interpretation into a participant quote.

## Synthesis rules

After all sessions:

1. Cluster observations by workflow, not by participant.
2. Separate frequency from severity.
3. Separate what people say from what they actually do.
4. Identify repeated workaround patterns.
5. Compare the generic baseline with Life Admin behavior.
6. Update H1–H10 only from direct evidence.

## Phase 1 gate

### PASS
Use only when repeated direct evidence shows:
- the problem is frequent/severe enough;
- Things/context are understood without heavy explanation;
- Life Admin produces a meaningful advantage over current workarounds;
- at least 3 high-value workflows repeat across participants;
- the primary user is identifiable;
- MVP scope can be locked.

### REVISE
Use when:
- problem is real but positioning/model is unclear;
- only one narrow workflow strongly benefits;
- context helps some users but not others;
- existing tools win in common scenarios.

### FAIL
Use when:
- most participants already solve the problem adequately;
- Life Admin adds maintenance without enough benefit;
- Things/context do not change behavior;
- no repeatable target workflow emerges.

## Participant tracker

| ID | Profile | Current tools | Real admin example | Quick Add | Things | Generic vs LA | Confidence | Key quote | Decision |
|---|---|---|---|---:|---:|---|---:|---|---|
| P01 | | | | | | | | | |
| P02 | | | | | | | | | |
| P03 | | | | | | | | | |
| P04 | | | | | | | | | |
| P05 | | | | | | | | | |
| P06 | | | | | | | | | |
| P07 | | | | | | | | | |
| P08 | | | | | | | | | |
| P09 | | | | | | | | | |
| P10 | | | | | | | | | |
| P11 | | | | | | | | | |
| P12 | | | | | | | | | |
| P13 | | | | | | | | | |
| P14 | | | | | | | | | |
| P15 | | | | | | | | | |

## Output after the last session

Produce:
- evidence-backed primary persona;
- evidence-backed JTBD;
- top 3–5 repeated workflows;
- H1–H10 results;
- MVP priority changes;
- positioning decision;
- Phase 1 PASS / REVISE / FAIL;
- clear reason for the decision.

Do not implement backend/MVP breadth before this gate unless a direct validation result requires it.
