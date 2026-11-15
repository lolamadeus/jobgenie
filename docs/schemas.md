# File schemas

Every content file is Markdown with a YAML frontmatter block. The Hub reads the frontmatter to
build its views and renders the body as normal Markdown.

General rules:
- Dates are `YYYY-MM-DD`. Months, for job start and end, are `YYYY-MM`.
- Use `present` as the `end` of a current role.
- Paths in frontmatter are relative to the repo root, for example
  `pipeline/contacts/jane-doe.md`.
- Slugs are lowercase-kebab-case.
- Leave unknown fields empty, or leave them out. Don't put placeholder text like "TBD" in
  frontmatter, because the Hub would show it as data. Put the gap in
  `knowledge/open-questions.md` instead.
- Every file has `updated: YYYY-MM-DD`. Bump it whenever you change the file.
- **Quote any YAML string that contains `: `, `#`, or a comma inside `{...}` / `[...]`.** For
  example, `industry: Games: indie` and `{name: Design, research}` both break or split silently. When
  a file fails to parse, the Hub's Overview shows a red banner, so check it after writing.

---

## knowledge/profile.md

```yaml
type: profile
name: ""
headline: ""            # one line, e.g. "Senior backend engineer, payments and fintech"
location: ""
work_rights: ""         # e.g. "UK citizen", "needs visa sponsorship for US"
email: ""               # the address the user wants used on applications and the site
phone: ""               # as the user writes it on CVs
links:                  # any of: linkedin, github, portfolio, website, or whatever fits the field
  linkedin: ""
updated: 2026-01-15
```
Body: `## Summary` (3 to 6 sentences in the user's voice), `## Career story` (how the path fits
together), `## Strengths`, `## Notes`.

## knowledge/preferences.md

```yaml
type: preferences
tracks: []              # employment | freelance
target_roles: []        # role families, most wanted first
seniority: ""
employment_types: []    # full-time | contract
locations: []
work_mode: []           # remote | hybrid | onsite
relocation: ""
salary:
  currency: GBP
  min:                  # number, floor
  target:               # number
  previous:             # number, last salary
  note: ""
industries_like: []
industries_avoid: []
company_size: []        # startup | scaleup | mid-size | enterprise
deal_breakers: []
apply_to_stretch_roles: true
company_priority: ""    # e.g. "Fintech first; big banks only at a level down"
availability: ""        # notice period or earliest start
writing_mode: ""        # user-writes | claude-drafts. Who writes CV and letter prose (see docs/workflows.md)
freelance:              # only if `tracks` includes freelance
  business: ""          # trading name, if any
  services: []
  targets: []           # who buys: e.g. "indie game studios", "local restaurants", "B2B SaaS marketing teams"
  approach: ""
  rates: ""
updated: 2026-01-15
```
Body: free notes on motivations and what a great next role looks like.

## knowledge/strategy.md

```yaml
type: strategy
status: draft           # draft | agreed
updated: 2026-01-15
```
Body: positioning, the employment-track role families with fit, the freelance lead-generation
plan, the operating rhythm, and risks. Shown on the Hub's Strategy page. Keep it current as
the approach changes.

## pipeline/leads/slug.md

One file per freelance lead: a client, team or project that might buy the user's services. Only
used when `knowledge/preferences.md` `tracks` includes `freelance` (the Hub hides the board
otherwise).

```yaml
type: lead
name: ""                # client, team or project name
project: ""             # the specific project, if different
contact: ""             # person or handle (stays local)
source: ""              # job-board | upwork | linkedin | reddit | discord | forum | social | referral | cold | other
url: ""                 # where it was spotted
links: []               # their site, socials, the project page
stage: ""               # where they are, e.g. "early prototype", "funded", "rebranding", "launching in Q3"
service: ""             # what they might buy from the user, in the user's own service names
signal: ""              # why it's a lead, e.g. "posted asking for a logo", "site is out of date"
budget: ""
status: spotted         # spotted | contacted | talking | proposal | won | lost | no-reply
priority: medium        # high | medium | low
date_found: 2026-01-15
last_contact:
next_step: ""
next_date:
updated: 2026-01-15
```
Body: `## Notes` (what they're making and fit), `## Timeline` (dated bullets: every message sent
or received).

## knowledge/skills.md

```yaml
type: skills
groups:
  - name: Languages
    skills:
      - name: Python
        level: advanced   # expert | advanced | intermediate | beginner
        years: 5          # optional
        last_used: 2026   # optional, a year
        note: ""          # optional, short context
updated: 2026-01-15
```
Body: anything that doesn't fit the structure, such as how skills were learned, or soft skills
with examples.

## knowledge/education.md

```yaml
type: education
entries:
  - institution: ""
    qualification: ""   # e.g. "BSc (Hons)"
    field: ""
    start: 2015         # a year, or YYYY-MM
    end: 2018
    grade: ""
    notes: ""
certifications:
  - name: ""
    issuer: ""
    year: 2024
    url: ""
updated: 2026-01-15
```

## knowledge/experience/YYYY-MM-company-slug.md

One file per company or engagement. Use `YYYY-company-slug.md` when the start month is unknown.
Promotions go in the `roles` list, not in separate files. Long contracts held under a
freelance business get their own file, with a link from the freelance file.

```yaml
type: experience
company: ""
title: ""               # the latest or most senior title
start: 2021-03          # YYYY-MM, or YYYY when the month is unknown
end: present            # or YYYY-MM / YYYY
roles:                  # optional title progression, oldest first
  - title: ""
    start: 2021-03
    end: 2022-12        # empty if unknown
    note: ""            # optional
location: ""
employment: full-time   # full-time | part-time | contract | freelance | internship | volunteer
industry: ""
team: ""                # e.g. "Platform team, 6 engineers, reported to the CTO"
tech: []                # tools and technologies used in this role
summary: ""             # one line, shown on the timeline
updated: 2026-01-15
```
Body sections, in this order, skipping any that are empty: `## Context` (what the company and team
did), `## Responsibilities`, `## Achievements` (concrete outcomes with numbers where possible),
`## Why I moved on`, `## Notes`.

## knowledge/achievements.md

```yaml
type: achievements
updated: 2026-01-15
```
Body: one `## Title` per story, each with **Situation / Task / Action / Result** lines and a
`Source:` line linking to the experience file. These feed CVs and interview prep.

## knowledge/open-questions.md

```yaml
type: open-questions
questions:
  - q: "What was the team size at Acme?"
    area: experience    # profile | preferences | skills | education | experience | pipeline | other
    added: 2026-01-15
    status: open        # open | answered
updated: 2026-01-15
```
When a question is answered, write the answer into the right file, then set `status: answered`.
Delete answered questions once they're more than two weeks old.

## pipeline/applications/company-slug--role-slug.md

```yaml
type: application
company: ""
role: ""
status: researching     # researching | to-apply | applied | screening | interviewing | offer | rejected | withdrawn | ghosted
priority: medium        # high | medium | low
source: ""              # linkedin | referral | company-site | recruiter | job-board | community | other
url: ""
location: ""
work_mode: ""           # remote | hybrid | onsite
salary_range: ""
visa_support: ""        # roles that need a visa only: yes | no | unknown, plus a short note if useful,
                        # e.g. "yes: sponsors visas, relocation package". Leave empty otherwise
tags: []                # short free labels shown on the card, e.g. [referral, stretch, "AI: averse"]
date_found: 2026-01-15
date_applied:
next_step: ""           # the single next action, e.g. "Tailor CV", "Prep for tech interview"
next_date:              # date the next step is due
cv: ""                  # path to the CV used
cover_letter: ""
contacts: []            # paths to contact files
company_file: ""        # path to pipeline/companies/x.md
updated: 2026-01-15
```
Body: `## Role summary`, `## Fit` (matches and gaps against the knowledge base), `## Timeline`
(dated bullets, newest last), `## Notes`.

## pipeline/companies/company-slug.md

```yaml
type: company
name: ""
domain: ""
industry: ""
size: ""                # headcount, e.g. "200-500"
stage: ""               # e.g. "Series B", "public"
location: ""
interest: medium        # high | medium | low
status: watching        # watching | targeting | applied | not-interested
updated: 2026-01-15
```
Body: `## Overview`, `## Why it fits`, `## Hiring signals`, `## People`, `## Sources` (with links
and dates).

## pipeline/contacts/firstname-lastname.md

```yaml
type: contact
name: ""
company: ""
role: ""
relationship: ""        # former-colleague | friend | recruiter | hiring-manager | referral | met-at-event | other
how_met: ""
linkedin: ""
email: ""
last_contact:
next_action: ""
updated: 2026-01-15
```
Body: interaction history as dated bullets.

## knowledge/cv-guide.md

```yaml
type: guide
title: CV guide
status: draft           # draft | agreed
updated: 2026-01-15
```
Body: how CVs are built for this search (format, structure, tailoring by role family, sources).
Shown on the Hub's CV guide page.

## documents/cvs/*.md and documents/cover-letters/*.md

```yaml
type: cv                # cv | cover-letter | research | portfolio | other (notes in documents/other/)
title: ""               # e.g. "CV: Senior Backend, Acme"
target: ""              # "general" or the role and company
application: ""         # path to the application file, if any
status: draft           # draft | final | sent
exports: []             # paths to exported PDF/DOCX next to this file
created: 2026-01-15
updated: 2026-01-15
```
Body: the document itself. The Hub also lists non-Markdown files in `documents/` as downloads.

## log/YYYY-MM-DD.md

```yaml
type: log
date: 2026-01-15
```
Body: one `## Short title` per session, with bullets for what was done, decisions made and what's
next. Append to the existing day file; don't create a second one.

## library/ (portfolio library, optional)

The schemas for `library/config.yaml`, `projects.yaml`, `curation.yaml`, `questions.yaml`,
`marks.json` and `answers.json` are in [library/README.md](../library/README.md). The library app
reads the built `library/library.json`. Rebuild with `uv run library/tools/build.py` after any
curated edit.

## Adding fields

Schemas are a starting point. When the user's search needs something the schema doesn't have
(a security clearance level on applications, a `portfolio_piece` on companies, a `rate` on leads),
add the field here first, then use it. Unknown frontmatter keys still show on each file's page in
the Hub; to show one on a board card or table, extend `hub/static/app.js`. See
[customising.md](customising.md).
