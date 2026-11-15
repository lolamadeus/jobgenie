# Onboarding (agent playbook)

Follow this when the workspace is new (`knowledge/profile.md` has no `name`), or when the user
runs `/onboard` or says something like "let's get started". The goal is a workspace that knows
the user and is shaped to their search, not a form filled in.

**Ground rules**
- Talk like a person. Batches of 3 to 5 questions, never a wall of questions.
- **Write each answer to its file before asking the next batch** (golden rule 1). If the session
  ends halfway, nothing is lost and the next session carries on from the checklist in
  `CLAUDE.md`.
- Onboarding can take more than one session. Tick items off in `CLAUDE.md` → "Current state" →
  "Onboarding" as you go.
- Let the user skip anything. Record skipped items in `knowledge/open-questions.md`.
- Don't invent. If a CV says "led a team" with no size, ask; don't guess.

## 0. Set the scene (first message)
- Say what's about to happen in two or three sentences: you'll ask about them a few questions at
  a time, everything gets saved to files in this folder, and the Hub shows it as it fills up.
- **Open the Hub for them.** In the Claude desktop app, start the `hub` preview (`.claude/launch.json`);
  otherwise tell them to run `uv run hub/server.py` and open http://127.0.0.1:8787. If `uv` is
  missing, give the install command for their OS from `docs/tooling.md`.
- Mention the shortcut: an old CV, LinkedIn export or portfolio link saves a lot of typing. They
  can drop files into `inbox/` at any point.

## 1. The basics → `knowledge/profile.md`, `CLAUDE.md`
- Name (as they want it on applications), where they're based, and their right to work where
  they want to work.
- What they do now (or did last), in their own words.
- Why they're looking and how urgent it is: laid off, contract ending, unhappy, career change,
  graduating, returning to work. Any deadline (notice period, end of visa, savings runway).

Write the profile, and replace the "Who" and "Situation" lines in `CLAUDE.md`.

## 2. Materials → `inbox/`, then the knowledge base
If they have a CV, LinkedIn export, portfolio site or old cover letters, process them now (see
"Processing the inbox" in `docs/workflows.md`). It turns 20 questions into 5 confirmations.

## 3. What they want → `knowledge/preferences.md`
- **Tracks:** employment, freelance, or both. (Freelance turns on the Freelance leads board in
  the Hub, automatically, once `tracks` includes it.)
- Target roles, most wanted first, and how far they'd stretch (adjacent roles, a level down, a
  career change). Ask whether to apply to roles where they don't tick every box.
- Seniority; full-time, part-time or contract.
- Locations, remote/hybrid/on-site, commute limits, relocation (and to where, and whether visa
  sponsorship is needed).
- Salary: currency, floor, target, and last salary if they're happy to share. It stays in this
  folder.
- Industries and company types they want and want to avoid; deal-breakers.
- Short-term vs long-term: do they need *a* job soon, or the right job? Both can run at once.
- Availability: notice period or earliest start.

## 4. Work history → `knowledge/experience/`, `knowledge/achievements.md`
- One file per employer or engagement (see `docs/schemas.md`). Promotions go in `roles`.
- For each recent role: what the team and company did, what they owned, and **what changed
  because of their work**. Push gently for numbers, scale and outcomes.
- Turn the best outcomes into 3 to 6 STAR stories to start with. More come later.
- Older or less relevant roles can be one line each.

## 5. Skills and education → `knowledge/skills.md`, `knowledge/education.md`
Pull most of it from the CV and history, then confirm levels with the user. Only record what
they'd be happy to be tested on.

## 6. Writing mode → `knowledge/preferences.md` `writing_mode`
Explain the choice briefly and let them pick:
- **They write the prose; you handle structure, facts, keywords, layout and checking**
  (recommended: hiring managers increasingly spot AI-written CVs, and the user's own voice is
  harder to fake), or
- **You draft; they edit** until it's theirs.
Either way, the "Avoiding AI tells" rules in `knowledge/cv-guide.md` apply.

## 7. Shape the workspace to their field
This is what makes the workspace theirs. Do what applies, and skip the rest.

- **Job sources.** Research where roles in their field and country are actually posted (web
  search; check a couple of boards live). Add the best ones to "Field-specific" in
  `docs/tooling.md`, best first, with notes on how to search each. Remove sections that don't
  apply (e.g. "Games industry" for a nurse).
- **CV guide.** Research current hiring advice for their field, seniority and country, and fill in
  the `[...]` gaps in `knowledge/cv-guide.md`, listing sources at the bottom. Leave it `draft`
  until the user agrees with it.
- **Portfolio library.** If their work lives in files (art, design, video, audio, 3D, writing,
  architecture, photography...), offer to set up the library now or later (`/library-setup`,
  `library/README.md`). If not, leave it off; the Hub hides it.
- **Freelance.** If they have a freelance track: services, who buys them, rates, how they'll find
  clients (lead sources), and the business name if any. Goes into `preferences.md` `freelance`
  and `strategy.md`.
- **Extra fields.** If their search needs something the schemas don't have (security clearance,
  driving licence, professional registration, visa status per role), add it to
  `docs/schemas.md` and use it. See `docs/customising.md`.
- **Anything sensitive about how to present themselves** (a gap, a career change, a topic some
  employers view differently, how much to say about some kind of work): agree a rule with the
  user, write it into `knowledge/strategy.md`, and add a golden rule to `CLAUDE.md` if it should
  apply everywhere.

## 8. Tools → `docs/tooling.md`
- Check which connectors this session actually has (search the deferred tools for Gmail,
  LinkedIn, Crustdata). Record what's there and the date.
- Offer the optional LinkedIn MCP only with the warning that LinkedIn bans automated accounts and
  it should be used lightly.
- Note which of Word, LibreOffice or pandoc is installed, for exporting CVs.

## 9. Strategy → `knowledge/strategy.md`
Draft it from everything above:
- **Positioning:** the one-line story and its building blocks.
- **Role families:** a table of role family, fit (strong / good / stretch), and why.
- **Company priority:** what to go after first, and why.
- **Sources and cadence:** which sources, how often to sweep (e.g. twice a week), how many
  applications a week is realistic, when to follow up.
- **Freelance plan** (if any): services, rates, lead sources, outreach approach.
- **Risks** and how to handle them.
Show the user, take their edits, and mark sections `(agreed)` as they agree.

## 10. Wrap up
- Rewrite the whole "Current state" section in `CLAUDE.md` so a fresh session knows everything
  important without the chat history. Tick the onboarding checklist.
- Create today's `log/` file.
- Suggest the next three things, usually: a first job sweep (`/job-sweep`), a base CV, and the
  portfolio library or open questions. Mention `docs/getting-the-most-out-of-it.md`.
