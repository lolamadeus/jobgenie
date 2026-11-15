---
name: library-setup
description: Set up or extend the optional portfolio library, which catalogues the user's own work files (images, video, audio, documents, 3D) into projects they can rate. Use when the user asks to set up the library or portfolio catalogue, add folders to it, or re-scan.
---

# Library setup

Follow [library/README.md](../../../library/README.md).

1. Ask which folders hold their work (finished work first; huge raw or session folders can wait),
   which kinds of file matter, and what they'll use the work for (these become `uses`, e.g.
   portfolio, cv, reel). Ask about noise to filter (short clips, small images, reference folders
   of other people's work).
2. Write `library/config.yaml` and set `enabled: true`.
3. Run `uv run library/tools/scan.py`, then `thumbs.py`, then `build.py`. Large drives can take a
   while: run long scans in the background and tell the user.
4. Group folders into projects in `library/projects.yaml` (rename the tiers to suit the field).
   Use contact sheets (`thumbs.py --sheets <text>`) to look at the work. Put anything uncertain in
   a project's `question` or `library/questions.yaml`. Never invent credits.
5. Rebuild, then point the user to http://127.0.0.1:8787/library/ and explain rating and Review
   mode in two lines.
6. Update "Current state" in `CLAUDE.md` and log it.
