# JobGenie

This folder is the user's job-search workspace and the **single source of truth** for everything
agents know about them: career history, skills, goals, target companies, applications, contacts
and generated documents (CVs, cover letters).

Every agent working here reads this file first. Anything worth knowing beyond one conversation
goes into a Markdown file here, not just into chat. The user reads it all through the **Hub**,
a read-only local web page that renders these files. If it isn't in a file, the user can't see
that you know it.

**If `knowledge/profile.md` has no `name` yet, this workspace is new: follow
[docs/onboarding.md](docs/onboarding.md).** Otherwise start with "Starting a session" in
[docs/workflows.md](docs/workflows.md).

## Current state
_Keep this section current. It's the briefing for every new session: a fresh agent should know
what's going on without the chat history. Last updated: never (new workspace)._

- **Who:** _not known yet._
- **Situation:** _not known yet (why they're looking, how urgent, any deadline)._
- **Goal:** _not known yet (tracks, target roles, location and work mode, salary floor, priorities;
  details live in `knowledge/preferences.md` and the plan in `knowledge/strategy.md`)._
- **Onboarding** (see `docs/onboarding.md`; tick as you go):
  - [ ] Basics: name, location, work rights, situation
  - [ ] Materials processed (old CV, LinkedIn export, portfolio)
  - [ ] Preferences: tracks, target roles, locations, salary, deal-breakers
  - [ ] Work history and first STAR stories
  - [ ] Skills and education
  - [ ] Writing mode chosen
  - [ ] Shaped to the field: job sources, CV guide, library on/off, freelance, extra fields
  - [ ] Tools checked and recorded in `docs/tooling.md`
  - [ ] Strategy drafted and reviewed
- **Done so far:** nothing yet.
- **Next:** onboarding.
- **Time-sensitive:** _anything with a deadline (access to a work account ending, references to
  collect, notice periods, visa dates)._

## Golden rules

1. **Files over chat.** When you learn a fact about the user (a job, a skill, a preference, a
   decision), write it to the right file in the same turn. Chat is temporary; files persist.
2. **Never invent.** Only record what the user told you or what came from a source you name.
   Mark guesses with `(unconfirmed)` and add a question to `knowledge/open-questions.md`.
3. **Follow the schemas** in [docs/schemas.md](docs/schemas.md). The Hub reads frontmatter, so a
   wrong key or status quietly breaks a view. New fields go into the schema first.
4. **Keep the briefing current.** After any substantive change, update the **Current state**
   section above and append to today's file in `log/` (see
   [docs/workflows.md](docs/workflows.md)).
5. **The user doesn't edit files by hand.** Agents make all changes, so keep files tidy and
   consistent. Don't leave a half-finished file behind.
6. **Privacy.** Contact details and salary figures stay in this folder. Never send them to
   external services (search engines, APIs, data providers, LinkedIn) unless the user asks for
   that specific action. Never push this folder to a public git remote.
7. **Outward actions need a yes.** Sending email, LinkedIn messages or connection requests,
   submitting applications or posting anything always needs the user's explicit approval for
   that specific action.
8. **Writing.** Who writes the prose in CVs, cover letters and messages sent under the user's
   name follows `writing_mode` in `knowledge/preferences.md` (see "Writing a CV" in
   `docs/workflows.md`). Agent-drafted text is marked `[DRAFT: …]` until the user makes it their
   own. **All writing and design follows "Avoiding AI tells" in `knowledge/cv-guide.md`.**
9. **Shape the workspace to the user.** Add fields, views, sources and rules when the user's
   search needs them; remove what goes unused. See [docs/customising.md](docs/customising.md).

_Add golden rules here when the user wants something applied everywhere (e.g. "never name my
current employer", "always use US spelling")._

## Layout

| Path | What lives there |
|---|---|
| `knowledge/profile.md` | Who the user is: headline, summary, location, work rights, links |
| `knowledge/preferences.md` | What they want: tracks, target roles, locations, salary, writing mode, freelance services |
| `knowledge/strategy.md` | How the search runs: positioning, role families, sources, cadence, risks |
| `knowledge/skills.md` | Skills inventory (structured in frontmatter) |
| `knowledge/education.md` | Degrees, courses, certifications |
| `knowledge/experience/` | One file per role, `YYYY-MM-company-slug.md` |
| `knowledge/cv-guide.md` | How CVs are built: format, structure, tailoring by role family, "Avoiding AI tells", sources |
| `knowledge/achievements.md` | Concrete wins and STAR stories for CVs and interviews |
| `knowledge/open-questions.md` | Gaps agents need the user to fill in |
| `pipeline/applications/` | One file per application, `company-slug--role-slug.md` |
| `pipeline/leads/` | Freelance leads, one per client or project, `slug.md` (only with a freelance track) |
| `pipeline/companies/` | Research on target companies, `company-slug.md` |
| `pipeline/contacts/` | People in the network, `firstname-lastname.md` |
| `documents/cvs/` | Generated CVs: Markdown source plus any exported PDF/DOCX |
| `documents/cover-letters/` | Generated cover letters |
| `documents/other/` | Anything else produced (interview prep, research, portfolio notes) |
| `inbox/` | Raw material the user drops in (old CVs, job ads, exports). Process it, then record what you took |
| `sources/` | Raw source material kept for reference (performance reviews, references, exports). Don't edit it; pull facts out into `knowledge/` |
| `log/` | Session log, one file per day, `YYYY-MM-DD.md` |
| `docs/` | Agent docs: onboarding, workflows, schemas, tooling, customising; and the user guide |
| `hub/` | The Hub web app (code only, no content) |
| `library/` | **Portfolio library** (optional): the user's own work files, catalogued for portfolios and applications. Off by default. See `library/README.md` |
| `.claude/skills/` | Slash commands: `/onboard`, `/job-sweep`, `/apply`, `/lead-sweep`, `/weekly-review`, `/library-setup` |

## Tools available

See [docs/tooling.md](docs/tooling.md): connectors (email, LinkedIn, data providers), job sources
for the user's field, document export, and portfolio hosting notes. Record what works there.

## The Hub

- Start: `uv run hub/server.py` (or the `hub` entry in `.claude/launch.json`), then open
  http://127.0.0.1:8787
- It re-reads the files on every request and the page refreshes itself when a file changes, so
  there's no build step. Write the file and the Hub shows it.
- **Keep the Hub minimal and let it evolve.** Add a view only when real content needs one, and
  prefer extending an existing view or schema over adding a new one. Remove what goes unused.
  Keep it read-only: no forms, no editing.
- **The portfolio library** (`/library/`) is a separate page linked from the Hub when it's
  enabled, and it's the one interactive exception: the user rates their work and answers
  questions into `library/marks.json` and `library/answers.json`. Agents read both and never
  overwrite them (except setting an answer's `status`).
- A new content type needs a matching view in `hub/static/app.js` and a schema in
  `docs/schemas.md` (see `docs/customising.md`).
