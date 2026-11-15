---
name: apply
description: Prepare an application for a specific role. Research the role and company, assess fit, tailor the CV and cover letter, pick portfolio pieces and draft form answers for the user to send. Use when the user shares a job link or ad and wants to apply, or says "help me apply to X".
---

# Apply

The argument is a job URL, pasted ad text, or the name of an application already in
`pipeline/applications/`.

Follow "Preparing an application" and "Writing a CV or cover letter" in `docs/workflows.md`:

1. Read the ad at the source and confirm it's open. Create or update the application file
   (`status: to-apply`) and the company file.
2. Write `## Fit`: each key requirement against `knowledge/`, honestly, with how to handle gaps.
   Tell the user plainly if it's a long shot.
3. Tailor the CV (start from the newest base CV in `documents/cvs/` if there is one) and a cover
   letter if wanted. Respect `writing_mode` in `knowledge/preferences.md`. Check against
   "Avoiding AI tells" in `knowledge/cv-guide.md`.
4. If the portfolio library is on, propose pieces using `library/marks.json` first.
5. Draft answers to any application-form questions in the application file.
6. Hand over: what's ready, what the user must write or check, and the exact steps to submit.
   **The user submits.** Once they confirm it's sent, update `status`, `date_applied`, the
   timeline and a follow-up date.
