---
name: job-sweep
description: Search the user's job sources for new roles that fit, add the good ones to the pipeline, close out roles that have gone, and report a shortlist. Use when the user asks to find jobs, run a sweep, or refresh the pipeline.
---

# Job sweep

1. Read `knowledge/preferences.md`, `knowledge/strategy.md` and "Job sources" in
   `docs/tooling.md`. If preferences are empty, run `/onboard` first.
2. Re-check the open items in `pipeline/applications/` with `status: researching` or `to-apply`:
   is each role still live at the source? Close the ones that have gone (`status: withdrawn`,
   reason in `next_step`).
3. Search the sources best first, following "Finding jobs" in `docs/workflows.md`. Keep LinkedIn
   to a handful of calls. Confirm every new role at the company's own page or ATS feed.
4. Create an application file for each good match with `## Fit`, `priority` and `next_step`.
   Create or update the company file for companies worth tracking.
5. Report: new roles (best first, one line on why each), roles closed, and anything that needs
   the user's decision. Add dated notes to `docs/tooling.md` on what each source produced.
6. Update "Current state" in `CLAUDE.md` and log the sweep.

Arguments, if given, narrow the sweep (e.g. `/job-sweep remote only`, `/job-sweep Acme`).
