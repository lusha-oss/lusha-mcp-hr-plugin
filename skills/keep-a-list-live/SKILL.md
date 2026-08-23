---
name: keep-a-list-live
description: Report what changed on a saved candidate list, and work the list. Use when the user asks what has changed, asks to refresh or update a list, asks whether anyone has moved or been promoted, returns to a list they saved earlier, or asks to take people off a list, rename it or add a column to it. Reports only the changes since their last check, each with a date, and stays silent on everyone unchanged.
---

# Keep a List Live

Read `references/shared-reference.md` first. It carries the terminology, the fifteen hard rules, the tenure mechanism, the ordering rules and the cost table. This file is the flow.

**What this skill is for.** A recruiter built a talent pipeline weeks ago. They come back and want to know what changed, not to read the whole roster again. This is the skill that makes the product worth opening twice.

**Language.** A saved list is their talent pipeline once they have built it, and each person on it is a candidate. Say "three candidates on your Berlin pipeline moved", not "three talents moved" and not "three records changed". Shared reference section 1.

Three kinds of change matter, in roughly this order. Someone moved company or was promoted, so their situation changed. Someone newly crossed the tenure threshold, so they were too fresh to approach last time and now they are not, and nobody else in the market is tracking this. Their employer had news, so the reason to reach out changed.

**Step 0. Confirm, and say what the read costs.** Only ask what you cannot infer: which pipeline, if the account has more than one plausible match, and if there is one obvious match use it and name it rather than asking; and since when, if you have no record of a last check, offered as a default, "I will look at the last three months unless you want a different window."

Then say what you are about to read and what it costs, before reading it:

> Your Berlin Backend pipeline has 80 people. Reading it back costs 4 credits, then checking for movement costs per signal found. Go ahead?

For a small pipeline just say it and proceed. For a large one, wait.

**Step 1. Find the pipeline.** `list_find`. Free, verified. Never send an `email` parameter to it. If several could match, name them and ask which. Do not guess between two plausible pipelines; reading the wrong one costs credits and wastes the turn.

**Step 2. Read the rows you need.** `list_read`. This costs 1 credit per 25 rows returned, whether or not anything is revealed, and the values come back masked. The sales server's own description says it is free. It is not. Do not repeat that claim to the recruiter. Page rather than pulling the whole list. If they asked about a handful of candidates, read the page those candidates are on and stop.

**Step 3. Who moved.** Resolve the signal types first, with `candidate_change_filters`. Free. It returns what actually exists right now rather than what this file thinks exists. Two types exist today, `promotion` and `companyChange`, but if Lusha adds a third the filter tool will show it and you should use it. Do not hardcode the list from this document.

Then `candidate_changes`, batched at 25, windowed with `startDate` set to their last check so you only get new movement. Nothing beyond what the filter tool returns is available at person level, so do not go looking for manager changes or job hunting signals just because a recruiter asks for them. Identify candidates by LinkedIn URL where you have it, otherwise email, otherwise full name plus company.

**Step 4. What happened at their employers.** `employer_events` on the companies from the pipeline, 25 per call, `startDate` set to the last check. For a refresh the events that matter are the ones that make someone more approachable: contraction, restructure, acquisition, facility closure, executive departure. A hiring surge is worth reporting but it is weaker.

**Step 5. Who newly became approachable.** This is the step that earns the skill. Re-run the original position search with the tenure exclude date moved to today, then diff against the pipeline. Anyone who appears now but did not before has crossed the threshold since the last check.

Do not try to calculate this from stored dates. The search filters on tenure but does not return it, so there is nothing stored to calculate from. It is a re-run and a diff. If you do not have the original search criteria, say so and offer to rebuild them from the pipeline rather than guessing.

**Step 6. Order the diff.** Per shared reference section 6, adapted: order by how much each change matters to a recruiter, not by the order the signals came back. A candidate who changed company outranks one whose employer posted a job. Recency breaks ties.

**Step 7. Answer.** Report only what changed. Group by type, and put a date on every entry.

> Four changes on your Berlin Backend pipeline since 2 July.
>
> **Moved company (2)**
> Anna Weber left Delivery Hero for Zalando, 4 August. Worth a fresh look, she is only two months in.
> Tomas Novak moved to N26 as Staff Engineer, 22 July.
>
> **Promoted (1)**
> Lukas Bauer is now Engineering Manager at Trade Republic, 1 August.
>
> **Newly approachable (3)**
> Three candidates have now passed two years in seat: Maria Silva, Jonas Klein and Petra Hoffmann. All three were too fresh when you built this pipeline.
>
> **Employer news (1)**
> Zalando cut headcount 3% in July, which affects four candidates here.
>
> **No change for the other 69.**
>
> That was 4 credits to read the pipeline and 7 signal credits.

That closing count line matters. Without it the recruiter cannot tell whether you checked everyone or ran out of budget. Then offer: open anyone worth acting on, take candidates off, add a column.

**Working the pipeline.** The recruiter can curate in conversation instead of going to the UI. Take candidates off with `list_remove_candidates`, naming them back first because there is no undo through the API: "Removing Anna Weber, Tomas Novak and Lukas Bauer from Berlin Backend. Confirm?" Rename with `list_update`, which is metadata only and does not touch contents. Add a column with `list_add_column`, after `list_columns` so you do not create a duplicate, since a recruiter-owned column like Notes or Stage is what turns a saved list into a working pipeline. Populate a column with `list_run_column`, then poll `list_run_status` because runs are asynchronous.

> `list_run_column` on a reveal column is the only call in this plugin that can spend at list scale. An email column across 500 rows is 500 credits in one call. Phone is five each. State the per-row cost, get an explicit yes, and scope to selected rows if the API allows it. Never run one as a side effect of a request for something else.

If a run partially completes, report which rows populated and what was charged. Never re-run the whole column to fix a partial result.

**The durable refresh, if it turns out to be possible.** If a column can carry a Lusha signal, then the whole refresh can live in the list: add the column once, re-run it against the saved rows whenever the recruiter wants, and the result persists in their workspace instead of vanishing with the conversation. That is a better product than a chat answer. Nobody has established that signal columns exist. That question is being measured internally. Until it comes back, run the flow above and do not promise the in-list version.

**Never, in this skill:** re-list the whole roster, since the point is the diff; reveal anything during a refresh; pull a 200-row list into the conversation to answer "what changed"; tell the recruiter reading the pipeline back is free; remove anyone without naming them first; run a reveal column without an explicit yes and a stated cost; send an `email` parameter to any `list_*` tool; hardcode the signal types instead of calling `candidate_change_filters`; call one named person talent, because talent is the pipeline and candidate is the person.

## Worked example

**Recruiter:** what's changed on my Berlin list?

**You:** Berlin Backend, 80 people, last checked 2 July. Reading it back is 4 credits, then signal checks on top. Running it.

_(list_find, list_read paged, candidate_change_filters, candidate_changes, employer_events, tenure re-run, order the diff)_

**You:** _(the grouped diff above)_

**Recruiter:** take the three who moved off the list

**You:** Removing Anna Weber, Tomas Novak and Lukas Bauer from Berlin Backend. There is no undo, confirm?

**Recruiter:** yes

**You:** Done, 77 candidates left in that pipeline. Want me to add the three newly approachable ones in their place?
