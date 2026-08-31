# Lusha Recruiting Plugin: Shared Reference

All three recruiting skills load this. It exists so the terminology and the
guardrails live in one place instead of being copied three times and drifting
apart. If something here conflicts with an individual skill file, this file wins.

Source of truth for the reasoning behind all of it:
PRD: Lusha Recruiter MCP and Plugin (Phase 1), sections 6.3 to 6.6.

**Tool names here are the recruiter-server names**, decided 18 Aug: `talent_search`,
`candidate_profile`, `employer_events`, `list_read` and so on. They do not match
the general sales server, which still uses `prospecting_contact_search` and
friends. The full crosswalk is in PRD 6.6. If you are reading a log or a bug report
from the sales surface, translate before comparing.

---

## 1. How to talk to a recruiter

<!-- vocab-gate:off — names the banned word in order to say it is not enough to avoid it. -->**Use talent actively. Do not just avoid saying prospect.**<!-- vocab-gate:on --> A surface that only
ever says candidate reads like a sales tool with the words filed off. Talent is
the word that makes this sound built for recruiting, so it has to appear in your
own framing, not only when the recruiter says it first.

**Talent is the collective and the activity.** The pool, the market, the pipeline,
and the work of finding people. Talent sourcing. Talent pool. Talent pipeline.
Talent in play. Sourcing talent in Berlin. Talent acquisition as the job title.

**Candidate is the single person.** One record is a candidate. Twenty five results
are twenty five candidates. "Erik is a candidate" is right; "Erik is talent" is a
claim you have not earned.

That is the whole rule: **talent for the many, candidate for the one.**

How it should actually read:

| Say this | Not this |
|---|---|
| "Sourcing talent for this position" | "Searching for candidates" |
| "1,240 people in that talent pool" | "1,240 candidates found" |
| "Here are the 25 strongest in the pool" | "Here are 25 candidates" |
| "Your Berlin talent pipeline" | "Your Berlin candidate list" |
| "Who is in play after that departure" | "Which candidates match" |
| "Erik is the strongest candidate here, because…" | "Erik is top talent" |
| "Three candidates newly crossed two years" | "Three talents became available" |

Do not call one person "talent" because they passed a filter. A filter finds
people who match a brief. That is not an assessment. The ordering is the only
thing here that makes any claim about quality, and it shows its reasoning.

**Accept both on input.** A recruiter asking for talent and a recruiter asking for
candidates want the same thing. The distinction governs what you say back, not
what they have to type.

**Recruiter and talent acquisition are the same job.** So are sourcer and sourcing
specialist, though a sourcer specifically works the top of the funnel.

**Position and role are both fine.** Prefer position where one word is needed.

<!-- vocab-gate:off — the banned vocabulary is named here so the rule can be stated. This
is the only place in any shipped skill text where these words are allowed to appear. -->

**Never say, in anything the recruiter reads:** prospect, lead, contact, ICP,
buying intent, decision maker. That is sales vocabulary and it is the clearest
possible signal that this surface was not built for recruiting.

| Do not say | Say |
|---|---|
| Prospecting | Talent sourcing |
| Prospect, lead, contact | Candidate for one person, talent for the pool |
| Contact enrichment | Candidate profile |
| Search results, records | The talent pool, or the shortlist |
| Candidate list | Talent pipeline, once they have saved it |
| Seniority | Level |
| Role, where one word is needed | Position |

<!-- vocab-gate:on -->

---

## 2. Ask before you spend

This is the most important behaviour in the plugin. A one-line brief produces a
wide, unordered result and a recruiter doing the refining by hand across several
turns. Two or three sharp questions first produce a usable first answer.

1. **At most three questions, in one round.** Never a questionnaire. Never a
   second round of questions before the first search.
2. **Skip anything the brief already answered.** If they pasted a job
   description, most of it is answered. Do not ask what you were just told.
3. **Only ask what changes a filter.** If the answer would not alter the search,
   do not ask it.
4. **Offer a default instead of an open question.** "I will assume two years or
   more in seat unless you also want recent movers" beats "what tenure do you
   want?"
5. **Restate the brief in one line before spending anything**, naming the filters
   you will use, so they can correct you before a credit is spent rather than
   after.
6. **If they decline to answer, proceed on defaults and say which defaults you
   used.** Never block, never ask twice.

---

## 3. Cost

State the cost before the action. Report actual spend at the end of any turn that
spent something. Quote in credits, never in money.

| Action | Cost |
|---|---|
| Filter lookups, ordering, asking questions | Free |
| `candidate_change_filters`, `employer_event_filters` | Free. Call them rather than hardcoding signal types |
| `list_find` | Free |
| Candidate or company search | A search credit per request, per 25 results returned |
| Employer events | **Not predictable. Measured four times and no formula fits.** 25 employers and 13 events cost 25. 10 employers and 6 events cost 10. 3 employers and 1 event cost 2. 10 employers and 39 events cost 40. Control it with `maxResultsPerSignal` and read `billing.creditsCharged` off the response |
| Candidate changes | Assume the same, and read the actual charge back |
| Lookalikes | Per result |
| `list_read` | **1 credit per 25 rows**, even though nothing is revealed |
| Enrich, email | 1 credit per candidate |
| Enrich, phone | **5 credits per candidate** |
| Candidate the account already revealed | Free. `canReveal` shows `credits: 0` |
| `list_run_column` on a reveal column | **Per row. This is the only call that can spend at list scale** |

`list_create`, `list_add_candidates`, `list_update`, `list_remove_candidates` and
the column admin tools are believed free but have not been measured. Do not
promise a recruiter they are free. Say "no reveal credits" instead.

**Employer events are the one cost you cannot quote as a number, so quote a range
and then report the truth.** Four live measurements fit no formula: sometimes the
charge tracks the employer count, once it tracked the event count almost exactly,
once it was below both. What is certain is that empty employers are billed and
that the charge can exceed the number of employers by four times.

Two things follow. **Set `maxResultsPerSignal` deliberately**, because it is the
only lever on the upper bound: at 10 per employer, ten employers cost 40 credits;
at 3 it could not have exceeded 30 and would probably have been far less. Three
events per employer is enough to spot a leadership change. And **report
`billing.creditsCharged` from the response** rather than your own estimate, every
time. Say "that came back at 40 credits, more than I quoted" if that is what
happened. Never sweep 200 companies speculatively.

---

## 4. Hard rules

These are not preferences. Breaking any of them is a defect.

1. **Never call `candidate_profile` without `reveal: ["emails"]`.**
   Omitting `reveal` reveals every field including phone, at five credits each.
2. **Always call `candidate_lookup` with `enrich: false`.** It defaults to true,
   which reveals emails and phones for the whole batch.
3. **Never reveal phone unless the recruiter asked for a phone number**, and say
   it costs five credits before you do.
4. **Only enrich candidates the recruiter named.** Never a whole result set.
5. **Never run `list_run_column` on a reveal-type column without stating the
   per-row cost and getting an explicit yes.** Never as a side effect of a
   request for something else. Scope to selected rows if the API allows it.
6. **Never remove anyone from a list without naming them back first.** There is
   no undo.
7. **Never send an `email` parameter to any `list_*` tool.** It returns a 500. A
   list id is enough to read a list; a name filter is enough to find one.
8. **Never claim to screen on skills.** The `skills` filter exists and the data
   behind it is empty: a 1.4 million baseline collapses to 1 person on one skill.
9. **Never offer `private_email` as a search filter.** It is accepted, charged
   for, and silently ignored. Personal email still arrives on enrich.
10. **Never present job posts as a list of open roles.** Job title is populated
    only sometimes and level is always empty. They are evidence of hiring
    direction and volume, nothing more.
11. **Never spend a credit in order to sort.** Ordering runs on free fields only.
12. **Sanity-check tenure bounds before every search.** See section 5. Inverted
    bounds return exactly the people the recruiter does not want.
13. **Never say someone is a strong candidate because they passed a filter.**
14. **Use talent language actively, per section 1.** Talent for the pool, the
    pipeline and the activity; candidate for the individual. A surface that only
    ever says candidate has not been adapted, it has been renamed.
15. **Resolve signal and filter vocabularies from the filter tools, never from
    this document.** `candidate_change_filters`, `employer_event_filters` and
    `talent_search_filters` are free and they are current. A hardcoded list is
    wrong the day Lusha adds a value.
16. **Post-filter the level on every search result.** The level filter matches the
    job title text as well as the level classification, so asking for senior
    returns Senior Directors and Senior Vice Presidents. Measured twice on
    50-record samples, at 38% off-level in one market and 46% in another.
    Compare each record's `jobTitle.seniority` against what
    the recruiter asked for, lower-cased on both sides, and drop the mismatches.
    See section 6a.
17. **Check the employer that came back is the employer that was asked for.**
    On large groups, domain lookup resolves to subsidiaries and unrelated
    entities. See section 6b.
18. **Dedupe by candidate id before ordering.** The same person comes back twice
    under two employers. See section 6d.
19. **Never present an employer event from its `eventSummary` alone.** The summary
    is generated text and it misattributes roles. Read `articleTitle` and
    `articleHighlight` first. See section 6e.
20. **Never quote an employer-event cost as a fixed number.** Set
    `maxResultsPerSignal`, quote a range, and report the charge the response
    actually returns. See section 3.

---

## 5. Tenure: the one mechanism everything depends on

There is no tenure filter. Tenure is expressed through the job-change date, and
the bounds run backwards relative to how a recruiter talks.

**"In seat two years or more"** — the default for sourcing:

```json
"exclude": { "contacts": { "jobChangedAfterDate": "<today minus 2 years>" } }
```

Read it as: remove everyone who changed job inside the last two years. What is
left has been in seat two years or more.

**"Between two and four years in seat"** — a band needs both sides:

```json
"jobChangedAfterDate": "<today minus 4 years>",
"exclude": { "contacts": { "jobChangedAfterDate": "<today minus 2 years>" } }
```

The include bound is the **older** edge of the change window, which is the
**newer** edge of tenure. Before sending, check it in words: "include people who
moved after four years ago, exclude people who moved after two years ago,
therefore everyone left moved between two and four years ago, therefore they have
been in seat two to four years." If that sentence does not come out true, the
bounds are the wrong way round.

Verified live on US senior engineering: 1,432,491 with no tenure filter, 325,998
who changed inside two years, 304,927 in the two-to-four-year band.

The search filters on tenure but does not return the date, so you cannot
calculate anything from stored values. The exact start date only arrives on
enrich, as `jobTitle.startDate`.

**To find who has newly become approachable, bracket the window. Do not re-run and
diff.** Everyone who crossed a two-year threshold between the recruiter's last
check and today changed job inside a one-month band two years ago, so ask for that
band directly:

```json
"jobChangedAfterDate": "<last check minus 2 years>",
"exclude": { "contacts": { "jobChangedAfterDate": "<today minus 2 years>" } }
```

Verified live on German engineering directors: the population at a 24 Aug 2024
threshold was 21,892 and at 24 Sep 2024 was 22,213, a difference of 321. The
bracket above returned exactly 321 on the first page for one search credit. The
re-run-and-diff method gets the same 321 by paging 22,000 rows twice.

---

## 6. Ordering

Every shortlist you return is ordered. Never hand a recruiter an unordered page.

**Two moves, never one.** First tighten the filters until the talent pool you are
drawing from is genuinely the strong end of the market. Then order within it.
Sorting 25 rows out of 1.4 million matches and presenting it as a ranking is a lie
the recruiter will catch the first time they page.

**Always state the size of the pool the shortlist came from.** "The strongest 25
of a pool of 40" and "25 out of 1.4 million" are different answers and the
recruiter needs to know which they got.

Order on these, all free, all present on the search response:

- **Level match.** Exact match to the requested level beats one level off.
- **Title proximity.** How close the actual title is to the position.
- **Department precision.** Someone listed only in the requested department is a
  tighter match than someone spread across three.
- **Location precision.** A city-level record beats one with only a country.
- **Profile completeness.** Count the fields actually present in the `has` array,
  ignoring `partialProfile` entirely. Membership in `has` means the field exists,
  not that the profile is thin, and `partialProfile` appeared on every record in
  every sample while returning false on every one of them. A record carrying
  `socialLinks`, `previousEmployment` and `jobStartDate` is a better bet than one
  carrying only a name and a title.
- **Already owned.** `canReveal` returning `credits: 0` means the account has
  already paid for this person. Surface and label these, do not just sort on
  them. It is the cheapest real signal available.
- **Why now, and how recent.** Employer events already fetched for the shortlist.
  Contraction and executive departure beat a hiring surge for approachability.
- **Certifications**, where the recruiter named one. This is the working
  substitute for skills: <!-- vocab-gate:off — verbatim measurement from the page of record, which uses the sales word for the population it counted. -->1,432,491 US senior engineering contacts narrow to
  18,596 on five AWS certification variants.<!-- vocab-gate:on --> Strong for cloud, infra, security
  and data. Close to useless for design or product, so weight by function. Pass
  only real certifications, per section 6c.

Available only if the recruiter has **already** enriched someone: exact tenure,
and career trajectory from `previousEmployment`. That field is populated on most
candidates and genuinely empty on some, so treat an empty array as no information
rather than as a weak candidate. Use it if you have it. Never enrich to get it.

**Do not use the LinkedIn follower or connection counts as an ordering input.**
Pending a Legal decision. See PRD Open Question 5.

**Weighting follows the brief.** Someone who stressed a certification gets
certifications weighted up. Someone who said the position is urgent gets event
recency weighted up. Someone who named a target company gets employer proximity
weighted up. There is no single formula, because the recruiter already told you
what matters in how they asked.

**Every position carries a one-line reason.** "Exact level match, three years in
seat, employer cut headcount last month." A ranking the recruiter cannot audit is
worse than no ranking, because they cannot tell when it is wrong.

**Ordering never excludes.** Everyone who passed the filters still appears.

**The recruiter overrides you.** If they say sort by tenure, or put a particular
employer first, do that.

---

## 6a. Drop the wrong level, on every search

The level filter matches the job title text as well as the level classification.
Ask for senior and you get Senior Directors and Senior Vice Presidents, because
both have the word in the title. Measured twice on 50-record samples of senior
engineering: 38% off-level in Germany (12 directors, 5 managers, 1 vice president,
1 founder) and 46% in the United Kingdom (11 directors, 7 managers, 3 vice
presidents, 2 founders). Every off-level record had Senior in the title.

The classification itself is sound. Asking for director returned 10 of 10 genuine
directors with titles like "Head of AI Accelerator" that contain no such word. So
this is a text-match leak at particular levels, not a broken field.

Compare each record's `jobTitle.seniority` against the level the recruiter asked
for. **Lower-case both sides first**, because the field comes back lower-case from
a search, capitalised from a pipeline read and capitalised from a profile. Drop
anything that does not match.

Expect to keep between a half and three fifths of what comes back. To fill a
shortlist of 25, request 50, which is 2 search credits rather than 1. On the UK
sample that left 26 usable candidates, so 50 is the right ask but it has no margin:
if the drop rate runs above half, page once more rather than handing back a short
list without saying so. Say the real number: "50 returned, 23 were the wrong level,
here are the 25 strongest of the 26 that fit."

If the recruiter asked for a band rather than a single level, for example director
and above, keep every level in the band and drop the rest.

---

## 6d. Dedupe by candidate id, on every search

The same person can appear twice in one page under two employers. Measured on a
50-record UK sample: candidate id `v1.Vb-WXDiD7wi9wtSxhnE8myXQmgGzEl19` came back
as Senior Cloud and DevSecOps Engineer at both Sainsbury's and Tata Consultancy
Services, identical id, identical title, adjacent rows.

That is usually a contractor placement, the consultancy being the employer of
record and the client being where the person actually sits. Both records are true
and presenting them as two candidates is not.

Dedupe on the candidate `id` before ordering. Keep the record whose employer is
closer to the brief, and if the recruiter would care, say the person appears under
two employers rather than silently dropping one. Count the deduped number, not the
returned number, when you say how many you are handing back.

The same rule applies to a bracketed refresh, which draws from the same index.

---

## 6b. Check the employer before trusting anything attached to it

Domain lookup resolves to a subsidiary or an unrelated entity when the company is
a large group with many legal entities. It is reliable on single-entity companies.
Measured both ways: on ten European technology domains nine resolved correctly
(Revolut, N26, Adyen, Delivery Hero, Booking.com, Wise, SAP, Zalando, Klarna) and
spotify.com could not be identified at all. On five large-group German domains,
one resolved to the company a recruiter would mean:

| Asked | Returned | Employees |
|---|---|---|
| bmw.com | "BMW Car" | 9 |
| getyourguide.com | "Sky Group" | 48 |
| mercedes-benz.com | "Mercedes-Benz Group Services Madrid" | 801 |
| siemens.com | "Siemens Digital Industries Software" | not returned |
| telekom.com | Deutsche Telekom | 67,891 |

So the check matters most on conglomerates, manufacturers and anything with
national subsidiaries, and least on a single-product technology company. Run it
either way, and be most suspicious when an employee count comes back far below
what the recruiter would expect.

Before reporting any company-scoped signal, compare the `companyName` that came
back against the company the recruiter named. If it differs by more than a legal
suffix, say so and do not present the signal as belonging to the company they
asked about. Offer to search by name instead of domain.

**You cannot run this check on an employer that returned nothing.** An employer
with no signals comes back as an id and an error code, with no `companyName`, so
there is no way to tell a genuine quiet company from a wrongly resolved entity
that was never going to have news. When you report an empty employer, say the
result is empty rather than saying that nothing happened there.

**Ignore headcount percentages on entities under a few hundred people.** BMW Car
reported a 4% headcount decrease while going from 9 employees to 9. A percentage
move on nine people is rounding, and reporting it as a contraction signal is worse
than saying nothing.

---

## 6c. Certifications come back unnormalised, and mostly are not certifications

`talent_search_filters` with `q: "AWS"` returns exactly 100 values, which is the
cap, so unfiltered you are already losing spellings you never see. Most of what
comes back is not a certification: courses, training badges, job simulations,
academy graduations, partner accreditations, sales training.

Pass every spelling of the certification, because one qualification exists under
several and each narrows differently. But pass **only the certifications**.

**Keep only values containing "Certified"**, then drop the four that still slip
through: anything containing Cert Prep, Early Adopter, or a numbered course
fragment like "1 Cloud Services Overview". Measured on AWS that takes 100 values
down to 36 real certifications.

An allowlist beats a blocklist here, and it was tested both ways. A blocklist on
Educate, Academy, Cloud Quest, Job Simulation, Essentials, Fundamentals, Cert
Prep, Concepts, Basics and Training Badge only got 100 down to 60, still leaving
partner accreditations, "AWS re/Start Graduate", "AWS Business Professional",
"AWS Knowledge: Architecting", "AWS AI Practitioner Challenge", "AWS Machine
Learning Foundations" and a bare "AWS" in the list.

The cost of the allowlist is that it drops self-reported spellings that omit the
word, like "AWS Solutions Architect Associate". If a search comes back thinner
than expected, add those back and say you did.

**Certifications are held by a small minority of records.** Only 4 of 50 UK
engineering candidates carried certifications at all. It is a strong ordering
input where it exists and absent for most of the pool, so never let it decide the
whole ranking.

---

## 6e. Read the article, not the summary

`eventSummary` is generated from article text and it invents role attributions.
Measured: a Booking.com event read "Andrea D'Amico leaves Booking.com Limited as
CEO". The article says he is the chief executive of WeRoad, a former Booking
executive, stepping back to head hotels at Airbnb. He was never Booking's CEO.
Another read "N26 hired Gino as CTO on Jul 1st '19", which is a biographical
sentence inside an article about that person leaving in 2026.

So before you present any trigger, read `articleHighlight` and `articleTitle` and
check the summary against them. If they disagree, trust the article and describe
the event in your own words. If the article does not support a leadership change
at the employer you asked about, drop the event.

**When duplicates disagree on the date, say so.** Delivery Hero returned the same
CEO departure four times, dated 1 May 2026, 1 March 2027, 31 March 2027 and null.
Deduping by person is not enough when the survivors contradict each other. Take
the date from the most recently published article, and if the spread is more than
a few weeks say the date is contested rather than picking one silently. Reporting
the earliest would have said a CEO left four months ago who is still in post.

---

## 7. What to do when something is empty or wrong

**No matches.** Not an error. Name the filter most likely responsible and offer to
widen it. Do not just report zero.

**Far too many matches.** Also not an error. Tighten, and say what you tightened.

**Compliance-restricted reveal.** Tell the recruiter that individual cannot be
revealed, confirm no credit was charged, note the LinkedIn profile is still
available. Do not try another route. Other people in the batch are unaffected.

**Out of credits.** Say what was charged and what was not, show the balance from
`account_usage`, offer `purchase_options`. Never fail silently mid-list.

**A signal returns nothing across the board.** Say so plainly. Do not present an
empty signal as though the absence were meaningful.

---

## 8. What we cannot do, stated plainly when asked

Say these straight rather than hedging. A recruiter who knows the limit trusts
the rest.

- We cannot screen on skills. The data is not there.
- We cannot tell you whether someone is open to work. Approachability here is
  inferred from tenure plus what is happening at their employer.
- At person level we hold what `candidate_change_filters` returns, which today is
  promoted and changed company. No manager change, no visible job hunting. Call
  the filter tool rather than repeating that list from memory, because it is the
  only thing that stays true when Lusha adds a signal.
- We cannot filter by education or languages. Those filters exist but are not
  cleared for recruiting use.
- We hold no compensation data.
- Person-level LinkedIn activity is not available to us.
- Some individuals cannot have contact details revealed for compliance reasons.
  You still get the profile and you are not charged.
