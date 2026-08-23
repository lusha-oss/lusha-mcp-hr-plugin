# Test Scenarios

The acceptance scenarios for the three skills in this plugin, with a **Result** column to
fill in. A scenario is not a suggestion: where one tests a hard rule, failing it is a
defect rather than a tuning issue.

Each scenario is pass or fail on observable behaviour, not on whether the answer felt good.

**Run each with no skill hint.** If a skill only fires when the recruiter names it, the
`description` field is wrong, and that is the single most important thing to find out.

## How to record a result

Write `pass`, `fail` or `—` (not yet run). For a failure, record the **actual tool call
made or the actual text returned**, in the Evidence column or as a footnote. "It felt
wrong" is not a result anyone can act on.

## Where to run it

Against any connected recruiter MCP deployment — production for a final pass, or a
non-production endpoint pointed at via `LUSHA_MCP_ORIGIN` (see
[Testing against a different endpoint](../README.md#testing-against-a-different-endpoint))
for everything before that, since a non-production endpoint gives you the call log to check
against.

Groups B, C, D, E, F and I are also testable against the general sales MCP surface with the
tool names substituted through the crosswalk in `tools.json`, which is worth doing before
this plugin's own server deployment exists: a wording problem found there is free.

---

## A. Routing. Does the right skill fire at all?

| # | Prompt | Expected | Result | Evidence |
| --- | --- | --- | --- | --- |
| A1 | "I need to hire a senior backend engineer in Berlin" | Source Movable Talent fires | — | |
| A2 | "here's the JD, who's out there" plus a pasted job description | Source Movable Talent fires, and does **not** ask things the JD already answered | — | |
| A3 | "what's changed on my Berlin list" | Keep a List Live fires | — | |
| A4 | "has anyone moved since last month" | Keep a List Live fires | — | |
| A5 | "any exec departures in fintech recently" | Leadership Change Sourcing fires | — | |
| A6 | "find me people whose boss just left" | Leadership Change Sourcing fires | — | |
| A7 | "find me talent for a staff engineer role" | Source Movable Talent fires. Tests that talent and candidate are equivalent on input | — | |
| A8 | "what's my credit balance" | No skill fires. `account_usage` answers directly | — | |
| A9 | Any refresh or leadership brief | The relevant filter tool is called before the signal search. A hardcoded signal list is a fail | — | |

**A2 is the one to watch.** Re-asking a recruiter what they just pasted is the fastest way
to lose them.

---

## B. Ask before you spend

| # | Prompt | Expected | Result | Evidence |
| --- | --- | --- | --- | --- |
| B1 | "I need a senior backend engineer" | Asks about location. Asks **at most three** questions. Makes **no tool call** before asking | — | |
| B2 | Same, then "remote in Germany, two years is fine" | Restates the brief and names the filters **before** searching | — | |
| B3 | Same, then "just search, I don't care" | Proceeds on defaults, **says which defaults it used**, does not ask again | — | |
| B4 | A fully specified brief with location, level and tenure all given | Asks **nothing**, or at most one thing, and searches | — | |
| B5 | "senior backend engineer, Berlin, 2+ years in seat, AWS certified" | Asks nothing. Searches | — | |

Fail conditions: more than three questions; a second round of questions before the first
search; any tool call before the questions; asking something the brief already answered.

---

## C. Tenure. The highest-risk logic on the surface.

| # | Prompt | Expected | Result | Evidence |
| --- | --- | --- | --- | --- |
| C1 | "people who have been in the job at least two years" | `exclude.contacts.jobChangedAfterDate` = today minus 2 years. Nothing on the include side | — | |
| C2 | "between two and four years in seat" | Include `jobChangedAfterDate` = today minus 4 years **and** exclude = today minus 2 years | — | |
| C3 | "people who just changed jobs" | The opposite: include side only, recent date. No exclude | — | |
| C4 | "who's been there the longest" | Does not invent a sort it cannot do. Explains the search filters on tenure without returning it, and offers a longer threshold instead | — | |

**C2 is the one that will break.** Verify the produced filter, not the answer. Verified
reference counts on US senior engineering: 1,432,491 unfiltered, 325,998 inside two years,
304,927 in the two-to-four band. If C2 returns roughly 325,998 the bounds are inverted.

---

## D. Ordering

| # | Prompt | Expected | Result | Evidence |
| --- | --- | --- | --- | --- |
| D1 | Any sourcing brief | Result is ordered. Every entry has a one-line reason. Pool size stated | — | |
| D2 | A deliberately broad brief, for example "engineers in the US" | Tightens first and **says what it tightened**. Does not sort 25 out of 1.4 million and call it a ranking | — | |
| D3 | "sort by tenure instead" | Recruiter override wins over the default weighting | — | |
| D4 | A brief that stresses a certification | Certifications visibly weighted up in the reasons | — | |
| D5 | A brief that says "urgent" | Employer event recency visibly weighted up | — | |
| D6 | Any brief where some results have `canReveal.credits: 0` | Those are surfaced and labelled as free to open | — | |
| D7 | Any sourcing brief | **No enrich call is made in order to produce the ordering** | — | |

D7 is a hard rule. Watch the call log, not the answer.

---

## E. Cost and reveal. Every one of these is a defect if it fails.

| # | Prompt | Expected | Result | Evidence |
| --- | --- | --- | --- | --- |
| E1 | "get me their emails" after a search | `candidate_profile` with `reveal: ["emails"]` present. Never omitted | — | |
| E2 | "get me everything on them" | Still `reveal: ["emails"]`. Asks before adding phones and says five credits | — | |
| E3 | "I need their phone numbers" | Says five credits each **before** calling. Then `reveal` includes phones | — | |
| E4 | "look up these five people" with identifiers | `candidate_lookup` with `enrich: false` | — | |
| E5 | "get emails for everyone on this list" | States the per-row cost and asks for explicit confirmation **before** `list_run_column`. Does not run it on the strength of the request alone | — | |
| E6 | Any turn that spent credits | Reports actual spend at the end | — | |
| E7 | Any search | Costs stated before, not only after | — | |

---

## F. Lists

| # | Prompt | Expected | Result | Evidence |
| --- | --- | --- | --- | --- |
| F1 | "save these" | `list_find` first, then create or reuse. Says "no reveal credits", not "free" | — | |
| F2 | "show me my Berlin list" | Says what the read costs before reading. Pages rather than pulling everything | — | |
| F3 | "take those three off" | Names the three back and asks to confirm before `list_remove_candidates` | — | |
| F4 | "rename this list" | `list_update` | — | |
| F5 | "add a Stage column" | `list_columns` first, then `list_add_column` | — | |
| F6 | Any `list_*` tool call | **No** `email` parameter is ever sent. Hard rule, returns a 500 | — | |
| F7 | "delete this list" | Explains it cannot delete from here and points at the Lusha UI. There is no delete tool on this server | — | |

---

## G. Honest limits. The skill should say the limit, not hedge.

| # | Prompt | Expected | Result | Evidence |
| --- | --- | --- | --- | --- |
| G1 | "find me people who know Kubernetes" | Says we cannot screen on skills and why. Offers certifications instead. Does **not** send a `skills` filter | — | |
| G2 | "only people with a personal email" | Says the search cannot filter on that and personal email comes on enrich. Does **not** send `private_email` | — | |
| G3 | "who's open to work" | Says we do not hold that. Explains approachability is inferred from tenure plus employer events | — | |
| G4 | "filter by university" | Says education filters are not available for recruiting use | — | |
| G5 | "what do these people earn" | Says we hold no compensation data | — | |
| G6 | "show me their open roles" | Presents job posts as hiring direction and volume, not as a requisition list | — | |
| G7 | "find candidates in Israel" | Reports the result honestly. Coverage there is 137 country-wide, so this should not look like a normal result | — | |

---

## H. Empty, wide and broken

| # | Prompt | Expected | Result | Evidence |
| --- | --- | --- | --- | --- |
| H1 | An over-narrow brief returning zero | Names the filter most likely responsible and offers to widen. Never a bare "no results" | — | |
| H2 | An over-broad brief | Tightens and says so | — | |
| H3 | Leadership sourcing where no events are found | Says so plainly, does **not** fill the answer with people who have no trigger, offers contraction signals as the weaker alternative | — | |
| H4 | A compliance-restricted reveal | Says that individual cannot be revealed, confirms no charge, notes the profile is still available | — | |
| H5 | Out of credits mid-flow | Says what was and was not charged, shows the balance, offers purchase options | — | |
| H6 | A 500 from a `list_*` tool | Retries once with only `entity_type` and `list_id`, then reports failure. Does not loop | — | |

---

## I. Language

This group is the difference between a recruiting product and a sales product with the
words swapped. **I2 and I5 are the ones that fail quietly**, because an answer that only
ever says "candidate" reads as correct until you notice it never sounds like recruiting.

| # | Check | Expected | Result | Evidence |
| --- | --- | --- | --- | --- |
| I1 | Read any full answer | None of the six banned sales words appears (see shared reference section 1) | — | |
| I2 | Read any full answer | **Talent actually appears**, used for the pool, the pipeline or the activity. "Sourcing talent", "that talent pool", "your talent pipeline", "in play". An answer with zero occurrences of talent is a fail even if nothing in it is wrong | — | |
| I3 | Read any full answer | Candidate used for individuals and counts of individuals. "The strongest candidate", "three candidates moved" | — | |
| I4 | Read any ordered shortlist | Nobody called talent, or called a strong candidate, purely because they matched a filter. Talent is never applied to one named person | — | |
| I5 | Ask entirely in candidate language: "find me candidates for a backend role" | The assistant still uses talent for the pool in its own framing. It does not simply mirror the recruiter's vocabulary back | — | |
| I6 | Ask entirely in talent language: "find me talent for a backend role" | Same behaviour and same results as I5. Talent and candidate are equivalent on input | — | |
| I7 | "find me good candidates" | Does not claim to assess quality. Explains what the ordering is based on | — | |
| I8 | A saved list, after saving | Referred to as a pipeline, not as a list of records | — | |

I1 is checked mechanically over the skill text by `npm run check`; what is tested here is
the **answer**, which the gate cannot see.
