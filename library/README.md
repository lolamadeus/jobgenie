# Portfolio library (optional)

A catalogue of **your own work, found on your drives**: images, videos, audio, documents, 3D files,
or any other file type you add. Claude groups the files into projects, and you rate them in a
small app so the best material ends up in your portfolio, CV, reel and applications.

**Who it's for:** anyone whose work lives in files, such as artists, designers, animators, 3D
and VFX artists, video editors, photographers, musicians, sound designers, writers and architects. If your work
doesn't (most office, engineering, sales and operations roles), leave it switched off. The Hub
hides it until it's on.

Your files are never moved, renamed or changed. The library only reads them.

## Setting it up

Ask Claude: **"set up my portfolio library"** (or run `/library-setup`). Claude will:

1. Ask which folders hold your work and what you'll use it for. It writes these to
   `library/config.yaml` (`roots`, `kinds`, `uses`, size filters) and sets `enabled: true`.
2. Scan, make previews and build:
   ```
   uv run library/tools/scan.py
   uv run library/tools/thumbs.py
   uv run library/tools/build.py
   ```
3. Look at the folder list and contact sheets (`thumbs.py --sheets <text>`), group folders into
   projects in `projects.yaml`, and put anything it isn't sure about into `questions.yaml` or a
   project's `question`.
4. Point you at the app: **http://127.0.0.1:8787/library/** (linked from the Hub's sidebar).

Optional extras: **ffmpeg** gives video previews and audio/video lengths (`winget install ffmpeg`,
`brew install ffmpeg`, or your Linux package manager). Without it the library still works.

## The app (http://127.0.0.1:8787/library/)

Tabs for All, each kind of file found, Projects and Questions. Every item can be:

- **rated** great, good, mid or bad (keys `1` to `4`),
- **favourited** (`F`),
- **marked for a use** from `config.yaml` `uses`, such as portfolio, CV or reel (shortcut keys are shown in the app),
- **hidden** (`H`) when it's not portfolio material,
- given a **note**.

**Review** steps through unrated items one at a time. Images, videos, audio, PDFs and text files
open in a viewer; other files show their path.

**The user's labels go to `marks.json`, and answers to `answers.json`.** This is the user's own
data: agents read it and never overwrite it.

- `marks.json`: `{"<id>" or "p:<project-slug>": {rating, fav, use: [], hide, note, at}}`.
- `answers.json`: `[{q, ref, text, at, status}]`, where `ref` is `p:<slug>`, `q:<hash>` or
  `f:<folder-id>`. **At session start, apply any answer with `status: "new"`** to
  `projects.yaml`, `curation.yaml` and `knowledge/`, rebuild, then set its status to `applied`.
  This is the one file agents may change: only the `status` field.

## Files

| File | Who writes it | What it is |
|---|---|---|
| `config.yaml` | agents (with the user) | Folders, kinds, uses, filters, on/off |
| `projects.yaml` | agents | Projects, tiers, which folders belong to each |
| `curation.yaml` | agents | Per-item titles, tags, project links, hides, and regex rules |
| `questions.yaml` | agents | Questions for the user |
| `marks.json`, `answers.json` | the user, through the app | Ratings, uses, notes, answers |
| `scan/`, `thumbs/`, `library.json` | the tools | Generated. Never hand-edit; git ignores them |

IDs are a hash of each file's path, so curation and ratings survive rescans. If files move, their
IDs change. Re-scan, and ask Claude to carry the marks across by file name.

## Using it for applications

When preparing an application or a portfolio, Claude checks `marks.json` first: favourites, then
great and good, then anything marked for that use. Hidden items are never used. It searches
`library.json` by project, kind and tags, and the user approves the final selection.

## Making it fit your field

The library is deliberately plain so it can grow in the direction you need. Ask Claude for
changes. Examples:

- **Illustrators and designers:** add `.ai`, `.indd`, `.fig` as a `design` kind; tiers like
  "Client work / Personal / Studies"; uses `[portfolio, cv, socials]`.
- **3D and games art:** add `.spp`, `.sbsar`, `.uasset`; render turntables to video so they get
  previews.
- **Video and motion:** set `min_video_seconds` to skip tiny clips; uses `[reel, site, cv]`.
- **Music and sound:** set `min_audio_seconds` to skip short effects; Claude can add version
  grouping (collapse `mix_v2`, `mix_final`) to `build.py` if your drives are full of revisions.
- **Writers:** documents only (`kinds: [document]`); PDFs get a first-page preview.

Keep the app read-only apart from the user's own labels, and keep `marks.json` the user's.
