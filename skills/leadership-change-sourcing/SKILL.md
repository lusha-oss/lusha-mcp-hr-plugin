---
name: leadership-change-sourcing
description: Find people whose position changed because a senior leader above them left or was replaced. Use when the user asks who is in play after a leadership change, asks about executive departures or new executive hires at companies or in a market, asks to find people whose boss just left, or wants to source from companies that recently lost or replaced senior leadership. Returns people one level below the departure, grouped by company, each traced to the leadership event and its date.
---

# Leadership Change Sourcing

Read `references/shared-reference.md` first. It carries the terminology, the twenty hard rules, the
tenure mechanism, the ordering rules and the cost table. This file is the flow.

## What this skill is for

A VP of Engineering leaves. The engineering managers underneath have each been in
seat three years, several were probably in line for that job, and they are now
reporting to someone new or to nobody. For a few weeks they are the most
approachable they will ever be.

Anyone can find engineering managers in Berlin. Almost nobody is systematically
catching the weeks after their boss leaves. That window is the entire value of
this skill, which is why every person you return has to trace to a dated event.

**Language.** This skill finds **talent in play** after a leadership change, and
each person it returns is a **candidate**. "Three candidates are in play at
Klarna since their VP left" is right. Talent for the situation and the pool,
candidate for the individual. Shared reference section 1.

## Step 0. Ask, then restate

Ask at most three, skipping what you were told:

1. **Which companies**, or which market and size band if they have no list. This
   is the one you almost always need, because the signal is company-scoped.
2. **Which function.** Engineering, sales, finance, product.
3. **What level they are hiring at**, so you can search one level below the
   departure rather than guessing.
4. **How far back**, offered as a default: "I will look at the last three months,
   since the window closes fast. Say if you want longer."

Then restate before spending:

> Executive departures in engineering at the 25 fintechs on your list, last three
> months, then engineering managers and senior managers underneath. Checking those
> 25 employers will cost somewhere between 25 and 75 credits, empty ones included,
> and I will tell you the exact figure after. Running it.

## Step 1. Resolve the event types

`employer_event_filters`. Free. Confirm the current valid values rather than
assuming them, since the vocabulary changes. Hard rule 15: the vocabulary comes
from the tool, never from this file.

## Step 2. Find the leadership events

`employer_events` with `peopleNews`, narrowed via
`filters.include.newsEventTypes` to:

- **Executive Departure** — the strongest. Someone left and the layer below is
  exposed.
- **Executive Hire** — a new boss arrived. Different dynamic, same effect: the
  people who did not get the job are now reporting to an outsider.
- **Executive Promotion** — someone internal moved up, which usually means a peer
  did not.

25 companies per call. `startDate` set to the window. **Set `maxResultsPerSignal`
to 3.**

This call bills 1 credit per event returned plus 1 for the request: 5 events cost
6 credits, 14 cost 15, 39 cost 40. `maxResultsPerSignal` is therefore the price,
and three events per employer is plenty, because you are looking for one
leadership change rather than a news digest. The ceiling is employers × the cap
+ 1, so quote that before you run it, then report the `billing.creditsCharged`
the response returns.

## Step 2a. Check you got the right company

How badly this goes depends on the company. On ten European technology domains,
nine resolved correctly and spotify.com could not be identified at all. On five
large-group German domains, one resolved to the company a recruiter would mean:
bmw.com returned a nine-person entity called "BMW Car", getyourguide.com returned
"Sky Group" with 48 employees, mercedes-benz.com returned a Madrid services
subsidiary.

So be most suspicious on conglomerates, manufacturers and anything with national
subsidiaries, and least on a single-product technology company. Run the check
either way.

Before reporting any signal, compare the `companyName` that came back against the
company the recruiter named. If it differs by more than a legal suffix, say so and
do not present the signal as belonging to the company they asked about. Offer to
search by name instead of domain.

**An employer that returns nothing cannot be checked.** It comes back as an id and
an error code with no `companyName`, so a genuinely quiet company and a wrongly
resolved entity look identical. Report those as an empty result, never as evidence
that nothing happened there.

Ignore headcount percentages on entities under a few hundred people. BMW Car
reported a 4% headcount decrease while going from 9 employees to 9. That is
rounding, not contraction, and reporting it is worse than saying nothing.

## Step 2b. Filter the events yourself

The API window does not do it for you, and roughly two thirds of what comes back
will not survive this step. Measured on a 39-event sample across five employers,
plus an earlier 13-event sample.

**Read the article and decide for yourself.** `eventSummary` binds the wrong
company. One event read "Andrea D'Amico leaves Booking.com Limited as CEO"; the
article is about WeRoad, he is WeRoad's chief executive, Booking is where he used
to work, and he is stepping back from WeRoad to head hotels at Airbnb while
keeping a board seat. Another read "N26 hired Gino as CTO on Jul 1st '19", which
is a biographical sentence inside an article about that person leaving in 2026.

So the summary is a hint, not a finding. Read `articleTitle` and
`articleHighlight`, work out what happened, to whom and at which company, and
pick one of three verdicts. This is the most important judgement in the skill.

1. **It is a real change at the employer you asked about.** Report it in your own
   words, with the role, the direction and the date the article gives. Stepping
   back while keeping a board seat is not leaving; say what actually happened.
2. **It belongs to another company and your employer is only history.** A "former
   X" phrase is a past employer, not a current role, so there is no event at your
   employer. Say so and do not count it. If the company the article is really
   about is on the recruiter's list, report it there instead.
3. **The text does not say which company the role belongs to.** Drop it, say you
   dropped one as unverifiable, and do not reason your way to a company the
   sentence never names.

Full mechanism and the clause test in SHARED-REFERENCE section 6e.

**Keep an event only if `eventEffectiveDate` exists and falls inside the window
the recruiter asked for.** Null effective dates ran at 6 of 39 in one sample and 4
of 13 in another. Drop those rather than guessing, because the whole premise here
is timing. Dates outside the window do come back: `startDate` filters on when the
article was published, not when the event happened, and a six-month window
returned a CTO appointment dated July 2019.

**Separate announced from completed.** This is the biggest single bucket: 14 of 39
events were dated in the future, out to March 2027. A departure announced for next
quarter is a real signal, arguably a better one because the layer below is
unsettled for months, but never describe it as someone who has left. Say
"announced, effective 31 December 2026".

**Dedupe by person, then resolve the dates.** Thirty-nine events covered twenty-
seven people, so about a third were duplicates. Deduping is not enough on its own,
because the survivors contradict each other: Delivery Hero returned the same CEO
departure four times, dated 1 May 2026, 1 March 2027, 31 March 2027 and null.
Take the date from the most recently published article, and if the spread is more
than a few weeks say the date is contested. Reporting the earliest would have told
a recruiter a CEO left four months ago who is still in post.

**Drop events outside the function.** An executive change only puts people in play
if it sits above them. A chief marketing officer leaving does nothing for an
engineering brief. Technical events ran at 4 of 27 people in one sample and 1 of
13 in another, so expect to discard most of what you paid for and say so. When one
does land it is worth the whole sweep: N26 returned both an outgoing CTO effective
31 December 2026 and an incoming CTO effective 1 September 2026, which is the
cleanest trigger this skill can find.

**Not every Executive Hire is an executive.** One sample returned a celebrity
brand ambassador as Trade Republic's only executive hire, another returned an
advisory board appointment and a supervisory board seat. If the person's role is
not a line management position above the level being hired, it is not a trigger.

## Step 3. If nothing comes back, say so and offer the alternative

This is the most likely failure and you must handle it honestly.

> No executive departures on those 25 companies in the last three months. That
> either means it genuinely did not happen or that our coverage of exec news for
> these companies is thin, and I cannot tell you which from here. Want me to
> widen the window to six months, or switch to companies that cut headcount
> instead? Contraction is a weaker trigger but our coverage of it is better.

Do not pad an empty result. Do not present the absence of a signal as evidence
that nothing happened.

**The fallback is worth offering, because it works.** Run against the exact ten
companies that returned no executive event in a live sample, contraction signals
came back on six of them. So the offer is real rather than a polite exit.

**Known risk, now measured twice.** Thirteen of twenty-five employers fired an
executive event over six months with one unambiguously technical. On a second
sample of ten, five fired events and four of twenty-seven people were technical.
So coverage of executive news is real, and coverage of engineering leadership
specifically runs at roughly one in seven of what you pay for. Say that plainly
rather than implying the market is quiet. Open item on INF-3042.

## Step 4. Search one level below

For each company with a dated event, `talent_search` scoped to that
company, at the level below the person who left, with the tenure exclude applied.

Level mapping, roughly: a c-suite departure puts vice president and director in
play; a vice president departure puts director and manager in play; a director
departure puts manager and senior in play.

Tenure matters more here than anywhere else. Someone who joined four months ago
did not lose out on their boss's job and has no history to be frustrated about.
Keep the two-year exclude.

Then drop the wrong level, per SHARED-REFERENCE section 6a, and dedupe on the
candidate id, per 6d. The level filter matters more here than in a general search,
because "one level below the departure" is the entire claim you are making about
each person. A Senior Director returned under a senior filter is not one level
below a VP, and presenting them as though they were breaks the only thing this
skill sells.

## Step 5. Employer context, if there is more to add

Often the leadership event is the whole story and you can skip this. Add it only
if there is something else material, like the departure coming alongside a
headcount cut.

## Step 6. Order

Event recency first. Three weeks beats eight months, because the window is the
product. Then the SHARED-REFERENCE section 6 inputs for ties.

## Step 7. Answer

Group by company. Head each group with the event and its date, then the ordered
people underneath.

> **Klarna** — VP Engineering departed 28 July, three weeks ago
> 1. **Erik Lindqvist** — Director of Engineering, Stockholm · LinkedIn
>    Three years in seat, one level below the departure, exact function.
> 2. **Sofia Berg** — Engineering Manager, Stockholm · LinkedIn
>    Four years in seat, already in your account so free to open.
>
> **Revolut** — new CTO hired 2 July, seven weeks ago
> 3. **Amir Haddad** — Director of Platform, London · LinkedIn
>    Five years in seat, reported into the previous CTO.
>
> 8 companies checked, 2 had a qualifying event, 5 candidates in play.
> That came back at 11 signal credits, plus 2 search credits.

Then the offer: save as a pipeline, or open specific candidates.

**Every person traces to a stated event with a date.** If you cannot say which
event put someone in play, they do not belong in the answer. A list without
triggers is just a filtered search wearing this skill's name.

## Never, in this skill

- Return anyone with no stated trigger.
- Report an event you cannot date, or one whose effective date sits outside the
  window the recruiter asked for.
- Describe an announced future departure as though it had already happened.
- Report a signal without checking which legal entity the domain resolved to.
- Read a headcount percentage on a nine-person entity as contraction.
- Count a brand ambassador, an advisory board seat or a supervisory board
  appointment as an executive hire.
- Describe an event from its `eventSummary` without reading the article text.
- Report an event against a company the article mentions only as somebody's
  former employer.
- Present an event whose company the article text does not actually establish.
  Unverifiable is a verdict, and saying you dropped one is part of the answer.
- Pick one date silently when duplicates of the same event disagree.
- Quote the event cost as a fixed number, or leave `maxResultsPerSignal` at its
  default across a large employer set.
- Fill an empty result with people who have no leadership event behind them.
- Present thin coverage as though nothing happened.
- Reveal anything by default.
- Drop the tenure filter. A recent joiner is not in play.
- Assume the event type vocabulary instead of resolving it through
  `employer_event_filters`.
- Call one named person talent. Talent is who is in play, candidate is the person.

## Worked example

**Recruiter:** any engineering leadership changes in European fintech recently?

**You:** I can check. Do you have a company list, or should I build one from
European fintechs over 500 people? And what level are you hiring at, so I search
the right layer underneath?

**Recruiter:** build the list, I'm hiring engineering managers

**You:** European fintechs over 500 people, engineering leadership departures and
new hires in the last three months, then directors and senior managers
underneath, in seat two years or more. Running it.

*(filters, company search, signals, then a candidate search per company with an
event, then order by recency)*

**You:** *(the grouped answer above)*

**Recruiter:** why is Erik first?

**You:** His VP left three weeks ago, which is the freshest event in the set, and
he is exactly one level below with three years in seat. Recency is weighted
highest here because the window closes fast. Say if you would rather sort by
tenure or by company size.
