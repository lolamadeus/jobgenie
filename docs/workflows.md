# Workflows

How agents run the routine work. The user starts most of these with a plain request ("find me
some jobs", "help me apply to this") or a slash command (see `.claude/skills/`).

## Starting a session
1. Read `CLAUDE.md` (it loads automatically in Claude Code).
2. **If `knowledge/profile.md` has no `name`, the workspace is new.** Follow
   [onboarding.md](onboarding.md) instead of the rest of this list.
3. Skim `knowledge/open-questions.md` and the newest file in `log/`.
4. Check `pipeline/applications/` and `pipeline/leads/` for a `next_date` on or before today and
   mention them. Overdue follow-ups are the easiest wins to miss.
5. If the portfolio library is on, check `library/answers.json` for answers with
   `status: "new"`. Apply each one (see `library/README.md`), rebuild, and set it to `applied`.

## Learning about the user (intake)
- Interview in small batches, about 3 to 5 questions at a time. Don't send a 30-question form.
- After each answer, write the facts to the right file **before** asking more questions.
- Capture achievements with numbers. Ask "what changed because of your work?", then add a STAR
  story to `knowledge/achievements.md`.
- Every gap you notice goes into `knowledge/open-questions.md`.
- If the user's wording is good, keep it. The summary sections should sound like them.
- Offer shortcuts: an old CV, a LinkedIn profile export (Settings → Data privacy → Get a copy of
  your data), performance reviews or a portfolio site save a lot of questions.

## Processing the inbox
1. Read each file in `inbox/`, such as an old CV, a LinkedIn export or a job ad.
2. Pull the facts into the knowledge base, marking anything that conflicts with what's already
   there and asking about it.
3. Leave the original file where it is, and log what you took from it. Material worth keeping
   for reference (exports, reviews, references) can move to `sources/` with the user's OK.

## Finding jobs (job sweep)
1. Search the sources in `docs/tooling.md` ("Job sources"), best first. Use the user's target
   roles, locations, work mode and keywords from `knowledge/preferences.md` and
   `knowledge/strategy.md`. Keep LinkedIn usage light.
2. For each promising match, create `pipeline/applications/company--role.md` with
   `status: researching`, the URL, and a `## Fit` section comparing it with the knowledge base
   (matches and gaps). Set `priority` from fit and how realistic it is.
3. **Confirm the role is still open at the source** (the company's own careers page or ATS feed).
   Aggregators keep closed roles up for weeks.
4. For companies worth tracking, create or update `pipeline/companies/company.md`.
5. Report a shortlist: best first, one line each on why. The user decides what moves to
   `to-apply`. Close out roles that have gone (`status: withdrawn` with a note in `next_step`).
6. Note in `docs/tooling.md` what each source turned up, so the next sweep starts from the best
   ones. Add new sources when you find them.

## Finding freelance leads (only with a freelance track)
1. Scan the lead sources in `knowledge/strategy.md`: job boards and "hiring" posts in the
   communities where the user's clients gather, plus cold targets (people visibly needing the
   service and not yet having it).
2. Create `pipeline/leads/slug.md` with `status: spotted`, the URL and the **signal** (why it's a
   lead). Skip unpaid or exposure-only work unless the user says otherwise.
3. Draft outreach that's specific to their project. The user approves every send. After a send,
   set `status: contacted`, `last_contact`, a timeline entry and a follow-up `next_date`
   (usually about a week later).
4. Respect each community's self-promotion rules.

## Writing a CV or cover letter
**Who writes the prose is the user's choice, recorded as `writing_mode` in
`knowledge/preferences.md`** (asked during onboarding):

- **`user-writes`** (recommended): readers increasingly spot LLM-written CVs, and an AI-sounding
  CV reads as low effort. Agents decide what to include, the order and priorities, structure,
  layout and formatting, facts (dates, titles, numbers), keyword matching against the ad, and
  checking. Anything longer than a short factual line (profile, achievement bullets,
  cover-letter paragraphs) is left as a placeholder, `[YOU WRITE: what this line needs to do]`,
  so it can't slip through as final copy.
- **`claude-drafts`**: agents draft everything, marked `[DRAFT]`, and the user edits until it's
  theirs. Drafts must pass "Avoiding AI tells" in `knowledge/cv-guide.md`, and agents ask the user
  for the specifics (numbers, names, outcomes) rather than filling gaps with adjectives.

Either way:
1. Build only from `knowledge/`. Don't add skills or claims that aren't recorded there.
   Tailor using the role-family table in `knowledge/cv-guide.md` and the job ad's keywords.
2. Save it to `documents/cvs/` (or `documents/cover-letters/`) with frontmatter, and link it from
   the application's `cv` / `cover_letter` field.
3. Export to PDF or DOCX when asked (pandoc, Word or LibreOffice, whichever is installed). Put the
   file next to the Markdown and list it in `exports`.
4. Start as `status: draft`. The user approves it before it becomes `final`.
5. Check it against "Avoiding AI tells" before the user sees it.

## Preparing an application
1. Read the ad in full (the company's own page if possible) and save the key text into the
   application file's `## Role summary`.
2. Research the company: what it does, recent news, team, values, how it hires. Update
   `pipeline/companies/`.
3. `## Fit`: requirements against the knowledge base, honestly. Gaps get a line on how to
   address them (a stretch is fine if the user applies to stretch roles).
4. Tailor the CV and, if wanted, a cover letter (see above). Pick portfolio pieces if relevant
   (see below).
5. Draft answers to any application-form questions in the application file, for the user to
   adapt. **The user submits**, unless they explicitly ask you to and the form needs nothing
   prohibited (passwords, ID numbers).
6. After sending: `status: applied`, `date_applied`, a `## Timeline` entry, and a follow-up
   `next_step` and `next_date` (often 1–2 weeks).

## Interview prep
1. Pull the role, company file and fit into a prep doc in `documents/other/`.
2. Map likely questions to STAR stories in `knowledge/achievements.md`. Add missing stories by
   interviewing the user.
3. Questions for them, logistics, and anything to research. Afterwards, record how it went in the
   application's timeline.

## Choosing portfolio pieces (portfolio library)
0. Check the user's labels in `library/marks.json` first: favourites, great/good ratings, and items
   marked for this use. Hidden items are never used.
1. Start from the brief (the job ad or lead): what they make, the tone, and what they ask to see.
2. Search `library/library.json` by project, kind and tags. Prefer work from shipped or
   published projects.
3. Check the rights to show anything made for an employer or client before it goes public.
4. The user approves the selection before anything is published or sent.

## Applying and outreach
- Draft emails and messages first, and only send them after the user approves the exact text.
- When something is sent, update the application's `status`, `date_applied` and `## Timeline`,
  and the contact's `last_contact`.

## Weekly review
1. What moved this week: applications, replies, interviews, leads.
2. Follow-ups due or overdue, with drafts ready.
3. What's working (sources, role families, message styles) and what isn't. Update
   `knowledge/strategy.md` and `docs/tooling.md`.
4. Refresh the "Current state" section of `CLAUDE.md`.

## Ending a session
Append a `## Title` section to `log/YYYY-MM-DD.md` covering what was done, what was decided and
what's next. Bump `updated` on every file you touched. Update "Current state" in `CLAUDE.md` if
anything substantive changed.
