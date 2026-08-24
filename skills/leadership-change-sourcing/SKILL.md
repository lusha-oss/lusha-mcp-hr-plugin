---
name: leadership-change-sourcing
description: Find people whose position changed because a senior leader above them left or was replaced. Use when the user asks who is in play after a leadership change, asks about executive departures or new executive hires at companies or in a market, asks to find people whose boss just left, or wants to source from companies that recently lost or replaced senior leadership. Returns people one level below the departure, grouped by company, each traced to the leadership event and its date.
---

# Leadership Change Sourcing

Read `references/shared-reference.md` first. It carries the terminology, the fifteen hard rules, the tenure mechanism, the ordering rules and the cost table. This file is the flow.

**What this skill is for.** A VP of Engineering leaves. The engineering managers underneath have each been in seat three years, several were probably in line for that job, and they are now reporting to someone new or to nobody. For a few weeks they are the most approachable they will ever be.

Anyone can find engineering managers in Berlin. Almost nobody is systematically catching the weeks after their boss leaves. That window is the entire value of this skill, which is why every person you return has to trace to a dated event.

**Language.** This skill finds talent in play after a leadership change, and each person it returns is a candidate. "Three candidates are in play at Klarna since their VP left" is right. Talent for the situation and the pool, candidate for the individual. Shared reference section 1.

**Step 0. Ask, then restate.** Ask at most three, skipping what you were told: which companies, or which market and size band if they have no list, which is the one you almost always need because the signal is company-scoped; which function, meaning engineering, sales, finance or product; what level they are hiring at, so you can search one level below the departure rather than guessing; and how far back, offered as a default, "I will look at the last three months, since the window closes fast, say if you want longer."

Then restate before spending:

> Executive departures in engineering at the 25 fintechs on your list, last three months, then engineering managers and senior managers underneath. Running it.

**Step 1. Resolve the event types.** `employer_event_filters`. Free. Confirm the current valid values rather than assuming them, since the vocabulary changes. Hard rule 15: the vocabulary comes from the tool, never from this file.

**Step 2. Find the leadership events.** `employer_events` with `peopleNews`, narrowed via `filters.include.newsEventTypes` to Executive Departure, which is the strongest because someone left and the layer below is exposed; Executive Hire, where a new boss arrived, a different dynamic with the same effect since the people who did not get the job are now reporting to an outsider; and Executive Promotion, where someone internal moved up, which usually means a peer did not.

25 companies per call. `startDate` set to the window. Charges per signal returned.

Every event must have a date. An event you cannot date is useless here, because the whole premise is timing. Drop it rather than reporting it vaguely.

**Step 3. If nothing comes back, say so and offer the alternative.** This is the most likely failure and you must handle it honestly.

> No executive departures on those 25 companies in the last three months. That either means it genuinely did not happen or that our coverage of exec news for these companies is thin, and I cannot tell you which from here. Want me to widen the window to six months, or switch to companies that cut headcount instead? Contraction is a weaker trigger but our coverage of it is better.

Do not pad an empty result. Do not present the absence of a signal as evidence that nothing happened.

Known risk: how consistently Executive Departure fires across a large company set has not been measured. If it turns out to be thin, this skill is thin, and that coverage question is being tracked internally.

**Step 4. Search one level below.** For each company with a dated event, `talent_search` scoped to that company, at the level below the person who left, with the tenure exclude applied. Level mapping, roughly: a c-suite departure puts vice president and director in play; a vice president departure puts director and manager in play; a director departure puts manager and senior in play.

Tenure matters more here than anywhere else. Someone who joined four months ago did not lose out on their boss's job and has no history to be frustrated about. Keep the two-year exclude.

**Step 5. Employer context, if there is more to add.** Often the leadership event is the whole story and you can skip this. Add it only if there is something else material, like the departure coming alongside a headcount cut.

**Step 6. Order.** Event recency first. Three weeks beats eight months, because the window is the product. Then the shared reference section 6 inputs for ties.

**Step 7. Answer.** Group by company. Head each group with the event and its date, then the ordered candidates underneath.

> **Klarna** — VP Engineering departed 28 July, three weeks ago
>
> 1. **Erik Lindqvist** — Director of Engineering, Stockholm · LinkedIn
>   Three years in seat, one level below the departure, exact function.
> 2. **Sofia Berg** — Engineering Manager, Stockholm · LinkedIn
>   Four years in seat, already in your account so free to open.
>
> **Revolut** — new CTO hired 2 July, seven weeks ago
> 3\. **Amir Haddad** — Director of Platform, London · LinkedIn
>    Five years in seat, reported into the previous CTO.
>
> 8 companies checked, 2 had a qualifying event, 5 candidates in play.
> That was 12 signal credits and 2 search credits.

Then the offer: save as a pipeline, or open specific candidates.

Every person traces to a stated event with a date. If you cannot say which event put someone in play, they do not belong in the answer. A list without triggers is just a filtered search wearing this skill's name.

**Never, in this skill:** return anyone with no stated trigger; report an event you cannot date; fill an empty result with people who have no leadership event behind them; present thin coverage as though nothing happened; reveal anything by default; drop the tenure filter, since a recent joiner is not in play; assume the event type vocabulary instead of resolving it through `employer_event_filters`; call one named person talent, because talent is who is in play and candidate is the person.

## Worked example

**Recruiter:** any engineering leadership changes in European fintech recently?

**You:** I can check. Do you have a company list, or should I build one from European fintechs over 500 people? And what level are you hiring at, so I search the right layer underneath?

**Recruiter:** build the list, I'm hiring engineering managers

**You:** European fintechs over 500 people, engineering leadership departures and new hires in the last three months, then directors and senior managers underneath, in seat two years or more. Running it.

_(filters, company search, signals, then a talent search per company with an event, then order by recency)_

**You:** _(the grouped answer above)_

**Recruiter:** why is Erik first?

**You:** His VP left three weeks ago, which is the freshest event in the set, and he is exactly one level below with three years in seat. Recency is weighted highest here because the window closes fast. Say if you would rather sort by tenure or by company size.
