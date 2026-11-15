# Customising the workspace

The workspace starts general and gets shaped to each user: their field, their country, how they
like to work. The user asks in chat ("add a field for security clearance", "I don't need the
companies page", "track which recruiter sent each role"); agents make the change.

## Principles
- **Grow on need.** Add a view, field or tool when real content needs it, not in case it might.
  Prefer extending an existing view or schema over adding a new one. Remove what goes unused.
- **Schema first.** Any new field or content type is written into `docs/schemas.md` before it's
  used, so every agent writes it the same way.
- **The Hub stays read-only.** No forms or editing in the Hub. The portfolio library's labels
  are the one exception, and they're the user's data.
- **Keep it legible.** The user never edits files, so changes must leave everything tidy and
  consistent. Update `CLAUDE.md` and the docs in the same turn.

## What adapts automatically
- **Freelance leads** appears in the Hub once `knowledge/preferences.md` `tracks` includes
  `freelance`, or once any lead exists.
- **Portfolio library** appears once `library/config.yaml` has `enabled: true`. Its tabs follow
  the kinds of file actually found; its "use" labels come from `uses` in the config.
- **Application cards** show any `tags: []` you put on an application, so most "I want to see X on
  the card" requests need no code: put it in `tags`.
- **Any frontmatter field** shows on that file's own page in the Hub, even without code changes.

## Common changes

**Add a field** (e.g. `clearance` on applications)
1. Add it to the schema in `docs/schemas.md`, with allowed values.
2. Use it in the files.
3. To show it on cards or tables, edit `appCard()` / the view in `hub/static/app.js`.

**Add a new content type** (e.g. `pipeline/events/` for meetups and job fairs)
1. Add a schema to `docs/schemas.md` and the folder to the layout table in `CLAUDE.md`.
2. In `hub/server.py`, add it to `collect()` (`load_dir("pipeline/events")`) and to `WATCHED` if
   it's a new top-level folder. Restart the Hub.
3. In `hub/static/app.js`, add a `NAV` entry, a view in `VIEWS`, and include it in `allDocs()` so
   its files open. Use the existing helpers (`table`, `board`, `docLink`, `chips`).

**Hide or remove something unused**
- Give its `NAV` entry a `show: (d) => ...` condition, or delete the entry. Delete the folder only
  if it's empty and the user agrees.

**Rename things to the user's language**
- Labels live in `NAV` and the view headers in `hub/static/app.js`; status names in `STATUSES` and
  `LEAD_STATUSES` (change the label, keep the key, or update every file that uses the key).

**Field-specific job sources, CV advice, strategy**
- These are content, not code: `docs/tooling.md`, `knowledge/cv-guide.md`,
  `knowledge/strategy.md`.

**New golden rules**
- If the user wants something to apply everywhere ("never mention my previous employer by
  name", "always use US spelling"), add it to the golden rules in `CLAUDE.md`.

**New slash commands**
- Add a skill folder under `.claude/skills/<name>/SKILL.md` with a `name` and `description` in its
  frontmatter, and steps that point at `docs/workflows.md`. Keep each one short.

**Portfolio library**
- Folders, kinds, file types, uses and filters: `library/config.yaml`. Project groupings and
  tiers: `library/projects.yaml`. Deeper changes (version grouping for audio, turntable previews
  for 3D, extra metadata) go in `library/tools/` and `library/app/`. See `library/README.md`.

## After a change
- Check the Hub: Overview shows a red banner if any file fails to parse.
- Hub static files reload by themselves; `hub/server.py` changes need a restart.
- Log the change in `log/` and, if it changes how agents should work, in `CLAUDE.md`.
