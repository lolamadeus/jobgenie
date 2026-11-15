---
name: onboard
description: First-run interview that fills in the user's profile, goals and work history, and shapes the workspace to their field. Use when the workspace is new (knowledge/profile.md has no name), or the user says "let's get started", "set me up" or asks to redo onboarding.
---

# Onboard

Follow [docs/onboarding.md](../../../docs/onboarding.md) step by step.

- First check `CLAUDE.md` → "Current state" → "Onboarding". If some items are already ticked,
  say what's done and carry on from the first unticked item instead of starting over.
- Open the Hub for the user at the start (the `hub` entry in `.claude/launch.json`, or tell them
  to run `uv run hub/server.py`).
- Ask 3 to 5 questions at a time. Write each answer to its file before the next batch.
- If there's anything in `inbox/`, process it first: it saves the user a lot of typing.
- Tick the onboarding checklist in `CLAUDE.md` as each step completes, and finish by rewriting
  "Current state" and logging the session.
