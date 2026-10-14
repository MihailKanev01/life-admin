# Prototype Validation Session Protocol

This protocol is the execution layer for the existing Phase 1 / Phase 2 validation work. It is designed for real participants and must never be populated with invented answers.

## Goal

Determine whether the current Life Admin prototype solves a meaningful personal-admin problem, and identify which parts of the IA and interaction model need to change before backend/business-domain implementation.

## Participant target

Recruit 10–15 real participants across at least three useful profiles, for example:

- working adult managing a vehicle;
- person responsible for household bills and renewals;
- person managing multiple devices, purchases, warranties or documents.

Do not recruit people solely because they already like productivity apps. Prefer participants who can describe recent real admin situations.

## Session format

Target 25–35 minutes.

1. Brief consent and context.
2. Ask behavior questions about the participant's current workflow before showing the prototype.
3. Run the usability tasks without explaining navigation, labels or controls.
4. Ask a short debrief about value, trust and what they would stop doing.
5. Record observations and exact user language immediately after the session.

Do not pitch the product or explain the intended solution before the participant attempts a task.

## Behavior questions

Ask:

- "Tell me about the last personal-admin task you nearly forgot or delayed."
- "Where did you keep the information?"
- "What tools did you use?"
- "Did you copy the same information between tools?"
- "What happened when something was missed?"
- "What personal admin do you repeat every month, quarter or year?"
- "What documents are difficult to find when you need them?"
- "What do you currently do when a reminder arrives at a bad time?"

Probe for recent examples, not opinions about hypothetical features.

## Prototype tasks

Run these in order and do not explain the UI first.

### Task 1 — Understand today

"You just opened the app. Tell me what, if anything, needs your attention today."

Observe:
- first item identified;
- whether priority feels obvious;
- wrong paths;
- hesitation.

### Task 2 — Add a reminder

"Add a reminder that your car insurance expires on June 14."

Observe:
- whether Quick Add is discovered;
- number of interactions;
- terminology confusion;
- expectation of AI assistance.

### Task 3 — Add a Thing

"Add your car and show me where you would keep its insurance document."

Observe:
- whether the Things model is understood without explanation;
- whether document context feels natural.

### Task 4 — Find a document

"Find the insurance document for your car."

Observe:
- whether object context or global search is used;
- wrong paths;
- retrieval effort.

### Task 5 — Reschedule

"The reminder is showing today but you cannot do it. Show me what you would do."

Observe:
- discovery of Snooze/Reschedule;
- confidence in the action.

### Task 6 — Add a recurring payment

"Add a €25 internet payment on the 15th of every month."

Observe:
- whether recurring behavior is understood;
- whether the user expects banking functionality.

### Task 7 — Find a future item

"Show me what important thing is coming up next month."

Observe:
- whether Upcoming is understandable without a full calendar;
- whether the user can form a useful mental model.

### Task 8 — Search

"Find anything you previously saved about the car."

Observe:
- whether Search is discoverable;
- whether users expect object context in results.

## Observation rules

Record:

- first click;
- hesitation;
- wrong path;
- verbal confusion;
- recovery;
- completion time;
- whether help was requested;
- confidence after completion;
- exact user wording.

Do not record or request unnecessary personal information, account credentials, financial account numbers, health information or private documents.

## Lightweight scoring

For each task record:

- Completed independently: 2
- Completed with a small nudge: 1
- Could not complete: 0

Also record friction separately as:
- Low: immediate, clear path
- Medium: hesitation or one wrong path
- High: repeated wrong paths, explanation required, or abandonment

Do not turn the numeric score into a false precision metric. Use it to compare patterns across participants.

## Debrief

Ask:

- "What part felt most useful?"
- "What part felt unnecessary or confusing?"
- "What would you expect this app to remember for you?"
- "What would you still keep in another app?"
- "What would make you stop using it?"
- "What would you trust the app to organize automatically?"
- "What would you always want to confirm yourself?"
- "Would this replace anything you currently use? Which one?"

## Synthesis

After 10 interviews, update `docs/validation/interview-tracker.md` and `docs/validation/hypothesis-results.md`.

For every hypothesis H1–H10, record:

- evidence supporting it;
- evidence against it;
- representative user language;
- confidence: low / medium / high;
- decision: keep / revise / reject.

A hypothesis is not considered validated merely because participants say the idea sounds good. Prioritize observed behavior, recent real examples and successful task completion.

## Gate

Do not convert a hypothesis into a product commitment until the evidence supports it.

Real-user validation is complete only when:
- at least 10 quality sessions are recorded;
- at least three participant profiles are represented;
- all eight prototype tasks have been tested;
- H1–H10 have explicit evidence-based decisions;
- major usability failures have an agreed product response.

