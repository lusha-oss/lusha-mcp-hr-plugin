---
name: source-movable-talent
description: Source talent for an open position. Use when the user describes a position they are hiring for, pastes a job description, asks who is out there or available for a role, or asks to source, find or shortlist candidates or talent. Asks a few scoping questions first, then returns an ordered shortlist of people who fit the position and have been in their current job long enough to be open to a move, each with a reason to approach them now. Does not reveal contact details unless the recruiter asks.
---

# Source Movable Talent

Read `references/shared-reference.md` first. It carries the terminology, the fifteen hard rules, the tenure mechanism, the ordering rules and the cost table. This file is the flow.

**What this skill is for.** A recruiter has a position to fill. They want talent that fits it and is actually approachable right now, with a reason to make contact. Not a database dump.

Two things make the answer good, and both are your job rather than the API's: asking enough to build a real brief before spending anything, and ordering the pool that comes back so the recruiter reads from the top instead of reading everything.

**Language.** You are sourcing talent, and each person in the shortlist is a candidate. Talent for the pool and the activity, candidate for the individual, per shared reference section 1. Say "sourcing talent in Berlin" and "the strongest candidate in that pool", not "searching for candidates" and not "Erik is talent".

**Step 0. Ask, then restate. Before any tool call.** Ask at most three questions, in one round, skipping anything the brief already answered. Pick from these in priority order: location, and whether remote counts, which is almost always needed and almost never volunteered; level, if the title is ambiguous, since "engineer" spans intern to staff; tenure, offered as a default rather than a question, as in "I will look for people who have been in the job two years or more, which usually means they are open to a conversation, say if you also want recent movers"; and a must-have if the position implies one, such as a certification, a target previous employer, or a specific technology company background.

If they pasted a job description, most of this is answered. Read it before asking. Asking a recruiter something they just wrote down is the fastest way to lose them.

Then restate the brief in one line and name the filters, before spending:

> Senior backend engineers, Berlin or remote in Germany, in seat two years or more, AWS certification preferred. I will search on level senior, department Engineering and Technical, country DE, and exclude anyone who changed job since August 2024. Say if that is wrong, otherwise I will run it.

If they decline to answer anything, proceed on defaults and say which defaults you used. Never ask twice.

**Step 1. Resolve their words into real filter values.** Use `talent_search_filters`. Free, so there is no reason not to. Resolve from the tool, never from a list written into this file. That is hard rule 15.

Departments, levels and locations all have fixed vocabularies that will not match what the recruiter said. Certifications are worse: the same certification exists under several spellings, so look it up and pass every variant into the search, or you will miss most of the population.

Never call `type: "skills"`. It returns an empty list.

**Step 2. Optional. Build an employer pool first.** Only if the recruiter wants a why-now angle before a shortlist, for example "who is hiring in fintech" or "find me people at companies that just had layoffs". Confirm the current values with `employer_event_filters` first, then `employer_events` with contraction signals: `headcountDecrease1m`, `3m`, `6m`, `12m`, `riskNews`, `corporateStrategyNews`. Then feed those companies into the search.

Skip this for a normal position brief. It costs per signal returned and it is not what they asked for.

**Step 3. Search the talent pool.** `talent_search`, with the tenure exclude set two years back by default. Check the bounds in words before sending, per shared reference section 5.

Then look at the size of the pool before you look at who is in it. Far too large, meaning six figures for a normal brief: tighten and say what you tightened, because ordering a page drawn from 1.4 million is not a ranking; narrow on level, city rather than country, or a certification if they named one. Zero or nearly zero: name the filter most likely responsible and offer to widen it, usually a certification, a city, or an over-precise title, and never report an empty pool without a theory. Reasonable: continue.

**Step 4. Employer context, for the shortlist only.** `employer_events` on the companies in your shortlist, not on every company in the result set. It charges per signal returned. This is where the why-now comes from, and it is the difference between this and a LinkedIn search.

**Step 5. Order it.** Per shared reference section 6. Free, no calls. Weight by what they emphasised. Surface anyone the account already owns, since those are free to open.

**Step 6. Answer.** In this order. First, one line on the talent pool you sourced from and how big it is: "Senior backend engineers in Germany, two years or more in seat: a talent pool of 1,240. Here are the 25 strongest." Second, the ordered shortlist, one line per candidate with name, title, company, location and LinkedIn link, and directly beneath each one line of reason. Third, what it cost: "That was 1 search credit and 6 signal credits." Fourth, the offer: save this as a pipeline, open specific candidates at 1 credit each, or widen the pool with lookalikes if it is too short.

No contact details. No data dumps. Reveal nothing.

Example of one entry:

> **3. Ravindra Sadaphule** — Senior Director of Engineering, Adobe, Cupertino · LinkedIn
> Exact level match, four years in seat, and your account already has his details so opening him is free.

**Step 7. Save, if they want it.** `list_find` first to reuse an existing list rather than making a duplicate. Then `list_create` and `list_add_candidates`, or pass `list_id` straight into the search, which writes the results in one call. A saved list is the recruiter's talent pipeline from that point on. Saving reveals nothing. Say "no reveal credits" rather than "free", because the write cost has not been measured.

**Step 8. Open specific candidates, only when asked.** `candidate_profile` with `reveal: ["emails"]`, on the people they named and nobody else. One credit each. Say the number before you run it. Phone only if they explicitly ask for a phone number, and say it is five credits each first.

**Widening a short shortlist.** `similar_candidates` needs at least 5 seed people, so it only works once a list exists. Precision measured around 70% on test, with drift into unrelated senior profiles, so offer it as a fallback and say so honestly. Two credits per ten results. Do not reach for it when the recruiter gave clear criteria and the search was just too narrow. Widen the filters instead; that is free to retry.

**Never, in this skill:** reveal anything the recruiter did not ask for; enrich anyone they did not name; claim to have screened on skills, or offer `private_email` as a filter; present job posts as a list of open roles; hand back an unordered shortlist; call one named person talent because they matched a filter; send an `email` parameter to any `list_*` tool.

## Worked example

**Recruiter:** I need a senior backend engineer in Berlin.

**You:** Two quick things and I will run it. Berlin only, or remote in Germany too? And I will default to people who have been in the job two years or more, since they are the ones open to a conversation. Say if you also want recent movers.

**Recruiter:** Remote in Germany is fine. Two years is good.

**You:** Senior backend engineers, Germany, in seat two years or more, LinkedIn profile required. Sourcing that now.

_(filters, then search, then signals on the shortlist, then order)_

**You:** That talent pool is 1,240 people: senior backend engineers in Germany who have been in the job two years or more. Here are the 25 strongest, ordered.

_(the ordered shortlist, each candidate with a reason)_

That was 1 search credit and 6 signal credits. Three of these candidates are already in your account so opening them is free. Want me to save this as a pipeline, open anyone specifically, or tighten the pool further?
