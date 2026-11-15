# Tooling

What's connected, how to use it, and what each job source has turned up. **Agents keep this file
current:** record what works, what doesn't, and quirks worth remembering, with dates.

The user only installs the Claude desktop app (Chat or Code tab) or Claude Code. **Agents install
everything else**, after a one-line
explanation and the user's yes, then check it works and record it here with the date.

## Setting up the computer
| Tool | Needed for | Check | Windows | macOS | Linux |
|---|---|---|---|---|---|
| **uv** (required) | The Hub and every tool script; brings its own Python | `uv --version` | `winget install --id astral-sh.uv -e` | `brew install uv`, or `curl -LsSf https://astral.sh/uv/install.sh \| sh` without Homebrew | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| git (optional) | Cloning and pulling updates | `git --version` | `winget install --id Git.Git -e` | `xcode-select --install` | the package manager, e.g. `sudo apt install git` |
| ffmpeg (optional) | Library video previews and audio/video lengths | `ffmpeg -version` | `winget install --id Gyan.FFmpeg -e` | `brew install ffmpeg` | e.g. `sudo apt install ffmpeg` |
| pandoc (optional) | Exporting CVs to DOCX/PDF when no Word or LibreOffice | `pandoc --version` | `winget install --id JohnMacFarlane.Pandoc -e` | `brew install pandoc` | e.g. `sudo apt install pandoc` |

- **After installing, a newly installed command may not be found until the shell restarts.** On
  Windows, winget puts tools on the user PATH; call them by full path for the rest of the session
  (e.g. `%LOCALAPPDATA%\Microsoft\WinGet\Links\uv.exe`), or ask the user to restart the Claude app.
- If `winget` or `brew` is missing, use the uv standalone installer (Windows PowerShell:
  `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`).
- Only install optional tools when a task needs them, and say so first.
- Anything that needs an admin prompt or a password is the user's to approve: tell them exactly
  what will pop up.

_Installed (onboarding records versions and dates here):_

## Connected tools
_Onboarding fills in which of these the user has, and the date checked._

### Email (Gmail connector, claude.ai)
- Turn on in claude.ai → Settings → Connectors, then it's available in Claude sessions.
- Search, read and draft. **Sending needs explicit approval of the exact message every time.**
- Useful for: finding past application emails, recruiter threads, interview invites, and drafting
  follow-ups for the user to send.

### LinkedIn MCP (optional, third-party)
- An open-source server that drives a real browser signed in to the user's LinkedIn account
  (`stickerdaniel/linkedin-mcp-server`). To enable it, copy `.mcp.json.example` to `.mcp.json`,
  restart Claude, and sign in once with `uvx mcp-server-linkedin@<version> --login`.
- **Pin a version** rather than `@latest`, and upgrade only when the user asks. Third-party code
  runs with access to the account.
- **LinkedIn bans automated accounts.** Keep usage light: a handful of searches per session, no
  bulk profile scraping, no looping calls. If a call returns a security check or Cloudflare page,
  stop LinkedIn calls for the session and ask the user to check the account in a normal browser.
- Messages and connection requests always need the user's approval first.
- Search tip: LinkedIn's newer search UI can ignore the `location` filter. Put the place in the
  keywords instead ("product designer London").

### Crustdata (optional, claude.ai connector)
- People, company and job data. New accounts get some free credits; check the balance with
  `account_credits` (free).
- Cheap: `job_search`, `company_search`, `person_search` with narrow `fields`. Expensive: enrich
  calls and anything `_live`. **Ask the user before spending on expensive calls.**
- `job_search` filters use `{field, type, value}` combined with `and_()` / `or_()`. Title match:
  `{field: "job_details.title", type: "[.]", value: "Product Designer"}`. For active listings
  filter `metadata.date_updated` with `=>` a recent date. `limit: 0` returns the count for free;
  run that first.
- Its job index leans on Indeed. Indeed job URLs often refuse direct fetches; use web search for
  the listing text.

### Discord, Slack communities, forums
There's usually no safe API route (bots need admin rights; user tokens break Discord's terms).
Read communities through the browser (Claude in Chrome or the built-in browser) when needed.

### Documents
- Exporting CVs to PDF/DOCX: Word, LibreOffice or pandoc, whichever is installed. Record which
  here during onboarding.
- Google Docs: available through the claude.ai Google Workspace connector if the user prefers.

## Job sources
_Best first. Onboarding replaces and extends this list for the user's field and country, and
every sweep adds what it learned. Keep notes short and dated._

### General
1. **LinkedIn Jobs** (through the MCP or the browser). Broad coverage; lots of reposts and
   "promoted" noise. Check the posting date.
2. **Company careers pages and ATS feeds.** The most reliable source of truth for whether a role
   is open, and the full ad text. Many companies expose public JSON:
   - Greenhouse: `https://boards-api.greenhouse.io/v1/boards/<company>/jobs?content=true`
   - Lever: `https://api.lever.co/v0/postings/<company>?mode=json`
   - Ashby: `https://api.ashbyhq.com/posting-api/job-board/<company>`
   - Workable: `https://apply.workable.com/api/v1/widget/accounts/<company>`
   - Recruitee: `https://<company>.recruitee.com/api/offers/`
   - SmartRecruiters: `https://api.smartrecruiters.com/v1/companies/<company>/postings`
3. **Indeed / Glassdoor / national boards** (e.g. Reed and Totaljobs in the UK, Seek in
   Australia/NZ, StepStone in Germany). Wide coverage, more noise.
4. **Remote-first boards:** We Work Remotely, Remote OK, Remotive, Working Nomads. Check the
   location restrictions in each ad ("remote, US only" is common).
5. **Recruiters and agencies** in the user's field: track them in `pipeline/contacts/`.

**Aggregators keep closed roles up for weeks.** Always confirm a role at the company's own page
or ATS feed before recommending it. Some sites (Webflow-built boards especially) include hidden
"this position has been closed" text in every page, so a text fetch can't tell open from closed;
check in a browser.

### Games industry
- **[DevQuest](https://devquest.gg/)**: refreshes hourly; filters for posting date, studio type,
  work type, seniority and region; the search sits in the URL (`?q=designer`). JS-rendered, so use
  the browser.
- **[Grackle HQ](https://gracklehq.com/jobs)**: scrapes studio careers pages. Search with
  `?searchstring=...`, then `&metro=Remote` or `&country=UK`. Old listings linger, so check the age
  column.
- **[Hitmarker](https://hitmarker.net/)**: games and esports jobs by category. JS-rendered.
- **[Work With Indies](https://www.workwithindies.com/)**: indie studios and contracts; browse by
  `/categories/<discipline>`. Good for freelance leads.
- **GamesIndustry.biz Jobs, GamesJobsDirect, r/gameDevClassifieds**: worth a look per sweep.

### Field-specific
_Onboarding adds the boards, newsletters and communities that matter for the user's field here,
best first (e.g. Dribbble and Behance jobs for designers, ArtStation jobs for 3D and concept
artists, Wellfound for startups, Hacker News "Who's hiring" for engineers, mandy.com for film and
TV, ProBlogger for writers, sector bodies' job boards for public sector and charities)._

### Market notes
_Dated observations from sweeps: how many relevant roles appear per week, the remote share,
salary ranges seen, which sources keep producing the good ones._

## Portfolio site hosting (if the user wants a site)
A simple static page is often enough: Claude can build one from `knowledge/` and the portfolio
library, following "Avoiding AI tells" in `knowledge/cv-guide.md`. Lessons from doing this before:
- **Free static hosts:** Cloudflare Pages, Netlify, GitHub Pages. With Cloudflare Pages, deploy
  with `npx --yes wrangler@4 pages deploy dist --project-name=<name> --branch=main` (the user signs
  in once with `wrangler login`). On Windows PowerShell, `npx` may be blocked by script policy:
  use `npx.cmd`.
- **File size limits:** Cloudflare Pages allows 25 MiB per file. Compress video (H.264, about
  2–4 Mbps for a reel) or host it on YouTube/Vimeo and embed.
- **Safari video needs byte-range support.** Pages' static hosting ignores `Range` requests, so
  self-hosted video won't play in Safari without a small Pages Function that answers with 206
  responses. Simpler: embed video from a video host.
- Add `noindex` while it's only for applications, if the user doesn't want it in search results.
- Check rights before putting employer or client work on a public site.

## The Hub
`uv run hub/server.py` serves http://127.0.0.1:8787. Python standard library plus `markdown` and
`pyyaml`, which uv installs automatically from the script header.
- In the Claude desktop app, the `hub` entry in `.claude/launch.json` opens it in the app's
  browser pane.
- **Web links and exported files open in a new tab in the user's default browser** through
  `POST /api/open`, so the Hub never gets navigated away.
- Server code changes need a restart. Static files (`hub/static/`) reload by themselves.
- The Job applications page keeps its filter choices in the browser's localStorage. That's view
  state only; the Hub still never writes content files.
- The portfolio library app (`/library/`) is the one place the user writes data
  (`library/marks.json`, `library/answers.json`).
