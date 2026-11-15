---
type: guide
title: CV guide
status: draft
updated:
---

_A starter guide that applies to most fields. During onboarding, Claude tailors it to the user's
field, seniority and country: it researches how hiring works there (with sources listed at the
bottom), fills in the tailoring table, and marks the guide `agreed` once the user is happy with
it. Who writes the prose is set by `writing_mode` in `knowledge/preferences.md`; see "Writing a CV"
in `docs/workflows.md`._

## How CVs actually get read
- **Skim first.** A recruiter's first pass is short. They look for name, current or last title,
  companies, dates, location and the keywords from the ad. Put those where the eye lands.
- **The first reader may not be a specialist.** HR, an agency or an applicant tracking system
  (ATS) often screens first. Use the ad's own words for skills and titles when they're true.
- **Claims get checked in interview.** Only include what you'd happily be questioned on. Use real
  titles, not inflated ones.
- **Instructions are a test.** Follow every application instruction (file name, format, cover
  letter or not, portfolio link). Skipping one is an easy reason to reject.
- **Field-specific:** _[To fill in during onboarding: what hiring managers in this field look at
  first (portfolio, code samples, publications, case studies, certifications, a reel) and what
  the CV's job is alongside it.]_

## Format
- **Length:** 1–2 pages for most people; longer only where the field expects it (academic CVs,
  some senior or technical roles). _[Confirm the norm for this field and country.]_
- **File:** PDF unless the ad asks for Word. Name it `Firstname-Lastname-CV.pdf` or whatever the ad
  specifies. Keep an editable master next to it.
- **Layout:** single column, standard section headings, real selectable text, no text inside
  images, no skill bars or charts, nothing important inside tables or text boxes. ATS parsers
  handle plain layouts best.
- **Country conventions:** _[e.g. UK: no photo, date of birth or full address; a line on right
  to work if relevant. US: "resume", one page is common earlier in a career. Germany: photo and
  a more formal Lebenslauf are still common. Fill in for the user's target countries.]_
- **Links:** portfolio, LinkedIn, GitHub or similar in the header, clickable. Test every link in
  a private window before sending.

## Structure (default; adjust per field)
1. **Header:** name, a role line tailored per application, location, email, phone, links.
2. **Profile:** 2–4 lines, tailored. Who you are, what you're best at, why this role.
3. **Experience,** newest first. The most recent and relevant roles get the most bullets; old or
   unrelated roles get a line or are dropped.
4. **Selected work / projects / credits** where the field values them (creative, research,
   engineering).
5. **Skills and tools:** short groups. The ad's keywords early. Only what you'd be tested on.
6. **Education and certifications:** one line each, unless early in a career.

## Tailoring by role family
_Filled in once `knowledge/strategy.md` names the role families._

| Role family | Lead with | Play down |
|---|---|---|
| | | |

## Bullets
- Each bullet says what you did and what changed because of it: a number, a launch, a saving, an
  adoption, a result. The facts come from `knowledge/experience/` and `knowledge/achievements.md`.
- **Specifics beat adjectives.** "Cut month-end close from 9 days to 4" says more than "drove
  efficiency".
- Don't pad. Leave out what doesn't help with this role.
- **Readers are alert to AI-written CVs.** Surveys of hiring managers in 2025–26 report most say they can
  spot one, and that the giveaways are generic phrasing and vague or inflated claims. (The
  surveys come from CV vendors, so treat them as directional.) That's why the rules below exist.

## Avoiding AI tells
These rules apply to every CV, cover letter, outreach message, site page and design produced in
this workspace, whoever writes it.

**Design (CVs, letters, portfolio pages):**
1. Single column. One or two typefaces chosen on purpose (not the word-processor default), black
   text, and at most one restrained accent colour.
2. No skill bars, star ratings, icons by the contact details, "eyebrow" labels above headings,
   avatar circles or sidebars.
3. Hierarchy comes from size, weight and spacing, not boxes, shading or colour blocks.
4. Every element has to carry information. Remove one thing before finishing.

**Writing: what to avoid in any agent-drafted text:**
- **Staging instead of stating:** "not X but Y" contrasts nobody asked for; dramatic one-line
  closers; aphorisms; "here's the thing" run-ups.
- **Rhythm by rule:** everything in threes, repeated sentence openings, uniform sentence length,
  and em dashes as an all-purpose connector. Use commas, full stops and parentheses instead.
- **Inflated vocabulary:** delve, crucial, pivotal, showcase, underscore, tapestry, testament,
  leverage, multifaceted, foster, "align with", "serves as", "boasts". Also trailing -ing clauses
  ("…, highlighting her…").
- **CV clichés:** results-driven, passionate, proven track record, dynamic, spearheaded,
  orchestrated, leveraged. Avoid every bullet having the same verb-then-impact shape, and a
  profile that could describe anyone.
- **Formatting:** bold on every label, title-case or emoji headings, decorative symbols.
- **Leftovers:** hedges, chatbot phrasing, and vague claims where a fact should be.

**How we work:**
1. **The user's own writing sets the style.** Never "de-slop" or rewrite the user's text; flag at
   most.
2. **Check agent-drafted text against the list above before the user sees it.** Plain words,
   specific facts, varied sentence length and shape.
3. Agent drafts are clearly marked `[DRAFT: …]` until the user has made them their own.

## Portfolio, samples and links
_[Fill in for the field: what to link (portfolio site, GitHub, case studies, publications, a
reel), how long a reel should be, whether to tailor samples per application, and rights to show
past employers' work.]_

## Templates
Generic template sites mostly push two-column, icon-heavy layouts that ATS parse badly. It's
usually better to build a plain template from this guide in Word, Google Docs or LibreOffice.

## Sources
_Claude adds the sources it used when tailoring this guide: hiring-manager advice, recruiter
guidance and job-ad analysis for the user's field and country, with dates._
