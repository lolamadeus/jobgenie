# Getting the most out of it

This workspace is a job search you run by talking to Claude. You chat; Claude does the research,
keeps the records, and drafts things for you to approve; and the **Hub** (a local web page) shows
everything it knows and everything in progress. You never need to edit a file yourself.

## The loop

1. **Tell Claude things.** Facts about you, what you want, what happened today ("I heard back from
   Acme, they want a call on Thursday").
2. **Claude writes them down** in Markdown files in this folder, straight away.
3. **The Hub updates by itself** (http://127.0.0.1:8787). If it's not in the Hub, Claude doesn't
   know it next time.
4. **Anything that goes out into the world needs your yes:** applications, emails, messages,
   posts. Claude drafts; you approve or send.

Every new session starts by reading `CLAUDE.md`, whose "Current state" section Claude keeps up to
date. That's how it picks up where you left off without you repeating yourself.

## Things to ask for

**Getting set up**
- "Let's get started" or `/onboard`: the first-run interview.
- "I've put my old CV in the inbox": Claude reads it and asks about gaps.
- "Set up my portfolio library" or `/library-setup`: if your work lives in files.

**Finding work**
- `/job-sweep`, or "find me some jobs": searches the sources in `docs/tooling.md`, adds the good
  ones to Job applications, and reports a shortlist.
- "Here's a job ad: <link or pasted text>": researches it and adds it with a fit assessment.
- "Find companies like X that hire Y": builds a target list in Companies.
- `/lead-sweep`: finds freelance clients (if you have a freelance track).

**Applying**
- `/apply <link>`: researches the company, tailors your CV and letter, drafts form answers.
- "Make me a base CV": a general-purpose CV to tailor from.
- "Help me prep for my interview with X on Thursday": likely questions mapped to your stories.
- "Draft a follow-up to the recruiter at Acme": you approve before anything is sent.

**Keeping on top of it**
- `/weekly-review`: what moved, what's due, what to change.
- "What should I do today?": the most useful next steps, from your pipeline and deadlines.
- "Update the strategy: I'm open to contract roles now."
- "Remember that I don't want to work in gambling": it goes into your preferences, permanently.

## Tips

- **Paste freely.** Job ads, recruiter emails, rejection emails, interview notes, LinkedIn
  messages. Claude extracts what matters and files it.
- **Answer the open questions.** The Hub's Open questions page lists gaps Claude needs you to
  fill. Each answer makes your CVs and fit assessments better.
- **Give numbers.** "Cut onboarding time from two weeks to three days" beats "improved
  onboarding". Claude asks for them; have a think about the ones you're proud of.
- **Apply to stretch roles** if you're comfortable with it. Claude will say honestly where you're
  a stretch and how to address the gaps.
- **Move fast on the rare ones.** If a role is a great fit and rarely comes up (say, fully remote
  in a niche field), apply within a day or two.
- **Rate your work in the library** a few minutes at a time. Review mode (one item at a time,
  keys 1–4) is quick.
- **Change anything.** The workspace reshapes itself to you: new fields, new views, different
  wording, things removed. Just ask. See `docs/customising.md`.

## What Claude won't do without asking

- Send emails or messages, submit applications, post anything, or connect with people.
- Spend paid credits on data tools beyond cheap searches.
- Enter passwords, ID numbers or payment details (it'll ask you to do those).
- Invent facts about you. Unknowns become questions for you instead.

## Privacy

- Everything lives in this folder on your computer. The Hub only listens on your own machine
  (127.0.0.1).
- Claude only sends personal details (contact info, salary) to outside services when you ask for
  that specific thing.
- **If you use git, keep your copy private.** Once you've filled it in, this folder holds your
  whole career history, salary and contacts. Don't push it to a public GitHub repository. If you
  forked it publicly, make a private copy for your own search.

## When something looks wrong

- **The Hub says "Hub offline"**: the server stopped (usually because the app or computer
  restarted). Ask Claude to "open the Hub".
- **A red banner on the Overview**: a file has a formatting problem. Ask Claude to fix it.
- **Claude seems to have forgotten something**: ask it to check the files and update "Current
  state" in `CLAUDE.md`. If it was only said in chat and never written down, tell it again.
- **"uv not found" or another missing tool**: ask Claude to install it. If it was only just
  installed, restarting the Claude app usually fixes "not found".
