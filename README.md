# JobGenie

A job-search workspace you run by talking to [Claude Code](https://claude.com/claude-code).

You chat about yourself, your goals and the roles you see. Claude interviews you, researches
roles and companies, keeps records, tailors CVs and drafts messages for your approval, and
writes everything down as plain Markdown files in this folder. A local web page, the **Hub**,
shows it all: your profile, a job-application board, companies, contacts, documents, open
questions and an activity log. It updates live as Claude works.

It starts blank and shapes itself to you, whatever your field: engineering, design, operations,
teaching, games, film or anything else. It suits employment, freelance, or both at once.

## What you get

- **A knowledge base about you**: profile, preferences, work history, skills, education and
  achievement stories, built through a short interview (or from your old CV).
- **A job pipeline**: every role as a card with its fit, status, next step and due date. Claude
  sweeps job boards for you and checks roles are still open at the source.
- **Tailored applications**: CVs and cover letters built from your real history, matched to each
  ad, and checked against a list of AI-writing tells so they read like you.
- **Freelance leads** (optional): a board for potential clients, and drafted outreach.
- **A portfolio library** (optional, for work that lives in files): catalogues your images,
  videos, audio, documents and 3D files, groups them into projects, and lets you rate them so the
  best work goes into applications.
- **Memory between sessions**: `CLAUDE.md` holds a "Current state" briefing that Claude keeps up
  to date, so each new conversation picks up where the last one left off.
- **Guard rails**: nothing is sent, submitted or posted without your yes; facts are never
  invented; personal details stay on your machine.

## Quick start

1. **Install the prerequisites**
   - [Claude Code](https://claude.com/claude-code): the Claude desktop app (Code tab), the CLI, or an
     IDE extension.
   - [uv](https://docs.astral.sh/uv/getting-started/installation/), which runs the Hub with the
     right Python packages:
     - Windows: `winget install astral-sh.uv`
     - macOS: `brew install uv`
     - Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Optional: [ffmpeg](https://ffmpeg.org/) for video previews in the portfolio library.

2. **Get your own copy**
   ```bash
   git clone https://github.com/lolamadeus/jobgenie.git
   cd jobgenie
   ```
   Or download the ZIP and unzip it anywhere.

3. **Open the folder in Claude Code** and say:
   > let's get started

   (or type `/onboard`). Claude explains what's going to happen, opens the Hub, and interviews
   you a few questions at a time. If you have an old CV or a LinkedIn export, drop it in `inbox/`
   first to save typing.

4. **Keep the Hub open** at http://127.0.0.1:8787. In the Claude desktop app it opens in the
   browser pane; otherwise run:
   ```bash
   uv run hub/server.py
   ```

That's it. From then on, just talk to Claude. [docs/getting-the-most-out-of-it.md](docs/getting-the-most-out-of-it.md)
has example requests and tips.

## Everyday commands

| Command | What it does |
|---|---|
| `/onboard` | First-run interview; picks up where it left off if interrupted |
| `/job-sweep` | Searches your job sources and adds the good matches to the board |
| `/apply <link>` | Researches a role, tailors your CV and letter, drafts form answers |
| `/weekly-review` | What moved, what's due, what to change |
| `/lead-sweep` | Finds freelance clients (if you have a freelance track) |
| `/library-setup` | Sets up the portfolio library for your work files |

You don't need the commands. Plain requests work too: "here's a job ad", "prep me for my interview
on Thursday", "draft a follow-up to the recruiter", "I'm now open to contract roles".

## Privacy: read this before you push anything

Once you've used it, this folder contains your career history, salary expectations, contacts and
CVs. **Keep your filled-in copy private.** Don't push it to a public GitHub repository. If you
forked this repo publicly, make a separate private repository (or no remote at all) for your own
search.

The Hub only listens on your own computer (127.0.0.1). Claude is instructed to keep contact
details and salary figures out of requests to outside services unless you ask for that
specific thing.

## How it's organised

```
CLAUDE.md          the briefing Claude reads first: current state, golden rules, layout
knowledge/         about you: profile, preferences, strategy, skills, experience, CV guide
pipeline/          applications, companies, contacts, freelance leads
documents/         CVs, cover letters and other generated documents
inbox/             drop old CVs, exports and job ads here
sources/           raw reference material (reviews, references, exports)
log/               what happened, day by day
library/           the optional portfolio library
hub/               the Hub web app (code only)
docs/              onboarding, workflows, schemas, tooling, customising, user guide
.claude/skills/    the slash commands
```

Everything is Markdown with a little YAML at the top of each file, so it's all readable in any
text editor, diffable in git, and yours to keep.

## Making it yours

Ask for changes in chat, for example "add a field for security clearance", "rename Job
applications to Roles", "I don't need the companies page", or "track which recruiter sent each
role". Claude edits the schemas, the Hub and the docs to match.
[docs/customising.md](docs/customising.md) explains how, for the curious.

## Optional integrations

- **Email** (Gmail connector in claude.ai): find and draft replies to recruiter emails.
- **LinkedIn** (a third-party MCP server, off by default): job and company searches. LinkedIn bans
  automated accounts, so it's for light use only. See `docs/tooling.md` and
  `.mcp.json.example`.
- **Data providers** such as Crustdata (claude.ai connector): company and job search at scale.

## Updating

If you cloned with git, you can pull improvements later:
```bash
git pull
```
Your own files (knowledge, pipeline, documents) aren't touched by updates unless an update
changes a template you've already filled in. Then git asks you to merge, and Claude can help.

## FAQ

**Do I need to be technical?** No. You need to install two things and open a folder in Claude
Code. After that it's conversation.

**Does it apply for jobs automatically?** No, on purpose. Claude researches, tailors and drafts;
you decide and you send. Mass-applying with generic AI-written CVs tends to backfire.

**Can I use it without the Hub?** Yes. The files are the source of truth and Claude works
without the Hub. The Hub just makes it easy to see.

**Can I use another AI tool?** The files are plain Markdown and the instructions live in
`CLAUDE.md` and `docs/`, so any coding agent that reads project instructions can work with it.
It's built and tested with Claude Code.
