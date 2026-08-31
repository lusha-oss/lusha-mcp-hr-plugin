---
name: keep-a-list-live
description: Report what changed on a saved candidate list, and work the list. Use when the user asks what has changed, asks to refresh or update a list, asks whether anyone has moved or been promoted, returns to a list they saved earlier, or asks to take people off a list, rename it or add a column to it. Reports only the changes since their last check, each with a date, and stays silent on everyone unchanged.
---

# Keep a List Live

Read `references/shared-reference.md` first. It carries the terminology, the twenty hard rules, the
tenure mechanism, the ordering rules and the cost table. This file is the flow.

## What this skill is for

A recruiter built a talent pipeline weeks ago. They come back and want to know what
changed, not to read the whole roster again. This is the skill that makes the
product worth opening twice.

**Language.** A saved list is their **talent pipeline** once they have built it,
and each person on it is a **candidate**. Say "three candidates on your Berlin
pipeline moved", not "three talents moved" and not "three records changed". Shared
reference section 1.

Three kinds of change matter, in roughly this order:

1. Someone moved company or was promoted. Their situation changed.
2. Someone newly crossed the tenure threshold. They were too fresh to approach
   last time and now they are not. Nobody else in the market is tracking this.
3. Their employer had news. The reason to reach out changed.

## Step 0. Confirm, and say what the read costs

Only ask what you cannot infer:

- **Which list**, if the account has more than one plausible match. If there is
  one obvious candidate, use it and name it rather than asking.
- **Since when**, if you have no record of a last check. Offer a default: "I will
  look at the last three months unless you want a different window."

Then say what you are about to read and what it costs, before reading it:

> Your Berlin Backend list has 80 people. Reading it back costs 4 credits, then
> checking for movement costs credits per person and per employer, and empty
> results are still billed. I would expect somewhere between 30 and 60 in total
> and I will tell you the exact number afterwards. Go ahead?

For a small list just say it and proceed. For a large one, wait.

## Step 1. Find the list

`list_find`. Free, verified. Never send an `email` parameter to it.

If several lists could match, name them and ask which. Do not guess between two
plausible lists; reading the wrong one costs credits and wastes the turn.

## Step 2. Read the rows you need

`list_read`. **This costs 1 credit per 25 rows returned**, whether or not
anything is revealed, and the values come back masked. Reading a list is not
free, so say the cost before you read.

Page rather than pulling the whole list. If they asked about a handful of people,
read the page those people are on and stop.

## Step 3. Who moved

**Resolve the signal types first.** `candidate_change_filters`. Free. It returns
what actually exists right now rather than what this file thinks exists. Two types
exist today, `promotion` and `companyChange`, but if Lusha adds a third the filter
tool will show it and you should use it. Do not hardcode the list from this
document.

Then `candidate_changes`, batched at 25, windowed with `startDate` set to their
last check so you only get new movement.

Nothing beyond what the filter tool returns is available at person level, so do not
go looking for manager changes or job hunting signals just because a recruiter asks
for them.

Identify people by LinkedIn URL where you have it, otherwise email, otherwise full
name plus company.

## Step 4. What happened at their employers

`employer_events` on the companies from the list, 25 per call, `startDate`
set to the last check, `maxResultsPerSignal` set to 3. The cost is not predictable
from the employer count, so quote a range, keep the cap low, and report the
`billing.creditsCharged` the response returns.

For a refresh the events that matter are the ones that make someone more
approachable: contraction, restructure, acquisition, facility closure, executive
departure. A hiring surge is worth reporting but it is weaker.

Two things to check before reporting any of it. The employer that came back has to
be the employer on the pipeline, per SHARED-REFERENCE section 6b. And `startDate`
filters on when the article was published rather than when the event happened, so
keep an event only if `eventEffectiveDate` exists and falls inside the window.
Case-normalise `jobTitle.seniority` when you compare a pipeline read against a
search, because the same field comes back capitalised from one and lower-case from
the other.

## Step 5. Who newly became approachable

This is the step that earns the skill, and it is one call.

Bracket the window between the recruiter's last check and today, using both bounds
of the job-change date. For a two-year threshold and a last check on 24 September:

```json
"jobChangedAfterDate": "<last check minus 2 years>",
"exclude": { "contacts": { "jobChangedAfterDate": "<today minus 2 years>" } }
```

Everyone returned changed job inside that one-month band two years ago, which is
exactly the set that crossed the two-year threshold since the recruiter last
looked.

Verified twice, exactly, on two different populations for one search credit each.
German engineering directors: 21,892 at the older threshold and 22,213 at the
newer, and the bracket returned 321. UK senior engineering: 136,500 and 138,742,
and the bracket returned 2,242. Both match the difference to the person.

Run step 3a's level post-filter and the id dedupe on this output too. It draws
from the same index, so it carries the same off-level records and the same
duplicates.

**Do not re-run the full search and diff it against the pipeline.** That was the
earlier instruction and it is the expensive way to the same answer. Finding 321
people inside 22,000 rows means paging hundreds of times. The bracket asks the API
for the cohort directly.

Do not try to calculate this from stored dates either. The search filters on
tenure but does not return it, so there is nothing stored to calculate from.

If you do not know the last check date, ask, or default to one month and say so.
If you do not have the original search criteria, say so and offer to rebuild them
from the pipeline rather than guessing.

## Step 6. Order the diff

Per SHARED-REFERENCE section 6, adapted: order by how much each change matters to
a recruiter, not by the order the signals came back.

Someone who changed company outranks someone whose employer posted a job. Recency
breaks ties.

## Step 7. Answer

**Report only what changed.** Group by type, and put a date on every entry.

> Four changes on your Berlin Backend pipeline since 2 July.
>
> **Moved company (2)**
> Anna Weber left Delivery Hero for Zalando, 4 August. Worth a fresh look, she is
> only two months in.
> Tomas Novak moved to N26 as Staff Engineer, 22 July.
>
> **Promoted (1)**
> Lukas Bauer is now Engineering Manager at Trade Republic, 1 August.
>
> **Newly approachable (3)**
> Three candidates have now passed two years in seat: Maria Silva, Jonas Klein and
> Petra Hoffmann. All three were too fresh when you built this pipeline.
>
> **Employer news (1)**
> Zalando cut headcount 3% in July, which affects four candidates here.
>
> **No change for the other 69.**
>
> That was 4 credits to read the pipeline and 7 signal credits.

That closing count line matters. Without it the recruiter cannot tell whether you
checked everyone or ran out of budget.

Then offer: open anyone worth acting on, take people off, add a column.

## Working the list

The recruiter can curate in conversation instead of going to the UI.

**Take people off.** `list_remove_candidates`. **Name them back first**, because
there is no undo through the API. "Removing Anna Weber, Tomas Novak and Lukas
Bauer from Berlin Backend. Confirm?"

**Rename.** `list_update`. Metadata only, it does not touch contents.

**Add a column.** `list_add_column`, after `list_columns` so you do not
create a duplicate. A recruiter-owned column like Notes or Stage turns the list
into a working pipeline.

**Populate a column.** `list_run_column`, then poll `list_run_status` because runs
are asynchronous.

> **`list_run_column` on a reveal column is the only call in this plugin that can
> spend at list scale.** An email column across 500 rows is 500 credits in one
> call. Phone is five each. State the per-row cost, get an explicit yes, and scope
> to selected rows if the API allows it. Never run one as a side effect of a
> request for something else.

If a run partially completes, report which rows populated and what was charged.
Never re-run the whole column to fix a partial result.

## The durable refresh, if it turns out to be possible

If a column can carry a Lusha signal, then the whole refresh can live in the
table: add the column once, re-run it against the saved rows whenever the
recruiter wants, and the result persists in their workspace instead of vanishing
with the conversation. That is a better product than a chat answer.

**Nobody has established that signal columns exist.** It is being measured in
INF-3038. Until it comes back, run the flow above and do not promise the in-table
version.

## Never, in this skill

- Re-list the whole roster. The point is the diff.
- Reveal anything during a refresh.
- Pull a 200-row list into the conversation to answer "what changed".
- Tell the recruiter reading the list back is free.
- Re-run the whole position search and diff it to find the newly approachable.
  Bracket it instead.
- Quote an employer-event cost as a fixed number. It is not predictable; give a
  range and report the actual charge.
- Leave `maxResultsPerSignal` at its default on a large employer set.
- Remove anyone without naming them first.
- Run a reveal column without an explicit yes and a stated cost.
- Send an `email` parameter to any `list_*` tool.

## Worked example

**Recruiter:** what's changed on my Berlin list?

**You:** Berlin Backend, 80 people, last checked 2 July. Reading it back is 4
credits, then signal checks on top. Running it.

*(list_find, list_read paged, signals on people, signals on companies, one
bracketed tenure search, order the diff)*

**You:** *(the grouped diff above)*

**Recruiter:** take the three who moved off the list

**You:** Removing Anna Weber, Tomas Novak and Lukas Bauer from Berlin Backend.
There is no undo, confirm?

**Recruiter:** yes

**You:** Done, 77 people left. Want me to add the three newly approachable ones in
their place?
