// Job Search Hub: read-only renderer for the Markdown knowledge base.
// Data comes from /api/data (built by hub/server.py). No editing happens here.

const STATUSES = [
  ["researching", "Researching"], ["to-apply", "To apply"], ["applied", "Applied"],
  ["screening", "Screening"], ["interviewing", "Interviewing"], ["offer", "Offer"],
  ["rejected", "Rejected"], ["withdrawn", "Withdrawn"], ["ghosted", "Ghosted"],
];
const ACTIVE = new Set(["researching", "to-apply", "applied", "screening", "interviewing", "offer"]);
const LEAD_STATUSES = [
  ["spotted", "Spotted"], ["contacted", "Contacted"], ["talking", "In talks"], ["proposal", "Proposal sent"],
  ["won", "Won"], ["lost", "Lost"], ["no-reply", "No reply"],
];
const LEAD_ACTIVE = new Set(["spotted", "contacted", "talking", "proposal"]);
const PRIO = { high: 0, medium: 1, low: 2 };
const byPrio = (k) => (a, b) => (PRIO[a.meta[k]] ?? 1) - (PRIO[b.meta[k]] ?? 1);
const LEVELS = ["expert", "advanced", "intermediate", "beginner"];
// The Hub shapes itself to the user: the freelance board appears once the user has a freelance
// track (knowledge/preferences.md `tracks`) or any lead; the library once library/config.yaml is enabled.
const freelanceOn = (d) => (d.preferences?.meta?.tracks || []).includes("freelance") || d.leads.length > 0;
const libraryOn = (d) => !!d.library?.enabled;
const isBlank = (d) => !has(d.profile?.meta?.name) && !d.experience.length && !d.applications.length;

const NAV = [
  { group: "Me" },
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile & goals" },
  { id: "strategy", label: "Strategy" },
  { id: "cvguide", label: "CV guide" },
  { id: "experience", label: "Experience", count: (d) => d.experience.length },
  { id: "skills", label: "Skills", count: (d) => skillList(d).length },
  { id: "education", label: "Education", count: (d) => eduCount(d) },
  { id: "achievements", label: "Achievements", count: (d) => storyCount(d) },
  { group: "Search" },
  { id: "pipeline", label: "Job applications", count: (d) => d.applications.filter((a) => ACTIVE.has(a.meta.status)).length },
  { id: "leads", label: "Freelance leads", show: freelanceOn, count: (d) => d.leads.filter((a) => LEAD_ACTIVE.has(a.meta.status)).length },
  { id: "companies", label: "Companies", count: (d) => d.companies.length },
  { id: "contacts", label: "Contacts", count: (d) => d.contacts.length },
  { id: "documents", label: "Documents", count: (d) => d.documents.length + d.files.length },
  { group: "Workspace" },
  { id: "questions", label: "Open questions", count: (d) => openQuestions(d).length, alert: true },
  { id: "log", label: "Activity log" },
  { group: "Portfolio", show: libraryOn },
  { id: "library", label: (d) => `${d.library.title} ↗`, href: "/library/", show: libraryOn },
];

let DATA = null;
let VERSION = null;

// ---------- helpers ----------
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const has = (v) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && !v.length) && !(typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtMonth(v) {
  if (!has(v)) return "";
  const s = String(v);
  if (s === "present") return "Present";
  const m = s.match(/^(\d{4})-(\d{2})/);
  return m ? `${MONTHS[+m[2] - 1]} ${m[1]}` : s;
}
function fmtDate(v) {
  if (!has(v)) return "";
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : String(v);
}
function toMonths(v) {
  if (String(v) === "present" || !has(v)) { const n = new Date(); return n.getFullYear() * 12 + n.getMonth(); }
  const m = String(v).match(/^(\d{4})(?:-(\d{2}))?/);
  return m ? +m[1] * 12 + (m[2] ? +m[2] - 1 : 0) : null;
}
function duration(start, end) {
  const a = toMonths(start), b = toMonths(end);
  if (a === null || b === null || !has(start)) return "";
  const yearOnly = (v) => /^\d{4}$/.test(String(v));
  if (yearOnly(start) || yearOnly(end)) { const y = Math.round((b - a) / 12); return y ? `~${y} yr${y > 1 ? "s" : ""}` : ""; }
  const n = b - a + 1, y = Math.floor(n / 12), mo = n % 12;
  return [y && `${y} yr${y > 1 ? "s" : ""}`, mo && `${mo} mo`].filter(Boolean).join(" ");
}
const daysUntil = (v) => (has(v) ? Math.round((new Date(String(v)) - new Date(new Date().toDateString())) / 864e5) : null);
const chips = (arr, cls = "") => (arr || []).map((t) => `<span class="chip ${cls}">${esc(t)}</span>`).join("");
const statusLabel = (s) => (STATUSES.find(([k]) => k === s) || [s, s || "Unknown"])[1];
const docLink = (doc, label) => `<a href="#/doc/${encodeURIComponent(doc.path)}">${label}</a>`;
const empty = (msg) => `<div class="empty">${msg}</div>`;

function skillList(d) {
  const groups = d.skills?.meta?.groups || [];
  return groups.flatMap((g) => (g.skills || []).map((s) => ({ ...s, group: g.name })));
}
const eduCount = (d) => (d.education?.meta?.entries || []).length + (d.education?.meta?.certifications || []).length;
const storyCount = (d) => (d.achievements?.html.match(/<h2/g) || []).length;
const openQuestions = (d) => (d.questions?.meta?.questions || []).filter((q) => (q.status || "open") === "open");
const allDocs = (d) => [d.profile, d.preferences, d.skills, d.education, d.achievements, d.questions, d.strategy, d.cvguide,
  ...d.experience, ...d.applications, ...d.leads, ...d.companies, ...d.contacts, ...d.documents, ...d.logs, ...(d.sources || [])].filter(Boolean);

function body(doc) {
  if (!doc?.html) return "";
  return `<div class="md" data-base="${esc(doc.path)}">${doc.html}</div>`;
}
function updated(doc) {
  if (!doc) return "";
  const u = doc.meta?.updated;
  return `<div class="muted small">Source: <code>${esc(doc.path)}</code>${u ? ` · updated ${esc(fmtDate(u))}` : ""}</div>`;
}
function header(title, sub = "", right = "") {
  return `<header class="page-head"><div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ""}</div>${right}</header>`;
}
function metaTable(meta, skip = []) {
  const rows = Object.entries(meta || {}).filter(([k, v]) => !["type", ...skip].includes(k) && has(v));
  if (!rows.length) return "";
  const val = (v) => {
    if (Array.isArray(v)) return v.every((x) => typeof x !== "object") ? chips(v) : `<pre>${esc(JSON.stringify(v, null, 2))}</pre>`;
    if (typeof v === "object") return Object.entries(v).map(([k, x]) => `<div><span class="muted">${esc(k)}:</span> ${linkify(x)}</div>`).join("");
    return linkify(v);
  };
  return `<dl class="meta">${rows.map(([k, v]) => `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${val(v)}</dd>`).join("")}</dl>`;
}
function linkify(v) {
  const s = String(v);
  if (/^https?:\/\//.test(s)) return `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s.replace(/^https?:\/\/(www\.)?/, ""))}</a>`;
  if (/\.md$/.test(s) && !s.includes(" ")) return `<a href="#/doc/${encodeURIComponent(s)}">${esc(s)}</a>`;
  if (/^(documents|inbox)\//.test(s)) return `<a href="/files/${esc(s)}" target="_blank">${esc(s)}</a>`;
  return esc(s);
}

// ---------- views ----------
const VIEWS = {
  overview(d) {
    const p = d.profile?.meta || {};
    const pref = d.preferences?.meta || {};
    const qs = openQuestions(d);
    const apps = d.applications;
    const active = apps.filter((a) => ACTIVE.has(a.meta.status));
    const activeLeads = d.leads.filter((a) => LEAD_ACTIVE.has(a.meta.status));
    const broken = allDocs(d).filter((x) => x.error);
    const skills = skillList(d);

    const checks = [
      ["Profile summary", has(p.headline) || /<p>(?!<em>Not filled)/.test(d.profile?.html || "")],
      ["Goals & preferences", has(pref.target_roles)],
      ["Search strategy", !!d.strategy?.html],
      [`Work history (${d.experience.length} role${d.experience.length === 1 ? "" : "s"})`, d.experience.length > 0],
      [`Skills (${skills.length})`, skills.length > 0],
      ["Education", eduCount(d) > 0],
      [`Achievement stories (${storyCount(d)})`, storyCount(d) > 0],
      ["A base CV", d.documents.some((x) => x.meta.type === "cv")],
    ];
    const done = checks.filter((c) => c[1]).length;

    const upcoming = [...active, ...activeLeads].filter((a) => has(a.meta.next_step))
      .sort((a, b) => String(a.meta.next_date || "9999").localeCompare(String(b.meta.next_date || "9999"))).slice(0, 6);

    const hero = `
      <section class="hero card">
        <div>
          <div class="eyebrow">Job search</div>
          <h1>${esc(p.name) || "Your profile"}</h1>
          <p class="lead">${esc(p.headline) || '<span class="muted">No headline yet. It gets written during intake.</span>'}</p>
          <div class="hero-meta">${[p.location, p.work_rights].filter(has).map(esc).join(" · ")}</div>
          ${has(pref.target_roles) ? `<div class="hero-targets"><span class="muted small">Targeting</span> ${chips(pref.target_roles.map((r) => String(r).replace(/\s*\(.*\)\s*$/, "")), "chip-accent")}</div>` : ""}
          ${pref.freelance?.business ? `<div class="hero-targets"><span class="muted small">Freelance</span> ${chips([pref.freelance.business, ...(pref.freelance.services || [])])}</div>` : ""}
        </div>
        <div class="progress-ring" style="--pct:${Math.round((done / checks.length) * 100)}">
          <div><strong>${done}/${checks.length}</strong><span>knowledge</span></div>
        </div>
      </section>`;

    const tiles = `
      <section class="tiles">
        ${tile("Roles on file", d.experience.length, "#/experience")}
        ${tile("Active applications", active.length, "#/pipeline")}
        ${freelanceOn(d) ? tile("Freelance leads", activeLeads.length, "#/leads") : tile("Companies tracked", d.companies.length, "#/companies")}
        ${tile("Open questions", qs.length, "#/questions", qs.length ? "warn" : "")}
      </section>`;

    const welcome = isBlank(d) ? `<section class="card welcome">
        <h2>Welcome. This workspace is empty, and that's expected.</h2>
        <p>Everything here is filled in by Claude as you talk to it. To start:</p>
        <ol>
          <li>In the Claude desktop app (Chat or Code tab) or Claude Code, point Claude at this folder.</li>
          <li>Say <em>"let's get started with JobGenie"</em>. Claude interviews you a few questions at a time and fills in your profile, goals and work history.</li>
          <li>Drop an old CV, LinkedIn export or job ad into <code>inbox/</code> to save typing. Claude reads it and asks about anything unclear.</li>
          <li>Keep this page open. It updates by itself whenever Claude writes a file.</li>
        </ol>
        <p class="muted small">New here? <code>README.md</code> explains the whole thing, and <code>docs/getting-the-most-out-of-it.md</code> has tips and example requests.</p>
      </section>` : "";

    const errors = broken.length ? `<section class="card alert"><strong>${broken.length} file${broken.length > 1 ? "s" : ""} couldn't be read properly</strong>
      <ul>${broken.map((b) => `<li><code>${esc(b.path)}</code>: ${esc(b.error)}</li>`).join("")}</ul></section>` : "";

    return `${hero}${welcome}${errors}${tiles}
      <div class="grid-2">
        <section class="card">
          <h2>What I know so far</h2>
          <ul class="checklist">${checks.map(([l, ok]) => `<li class="${ok ? "ok" : ""}"><span class="tick">${ok ? "✓" : ""}</span>${esc(l)}</li>`).join("")}</ul>
        </section>
        <section class="card">
          <h2>Needs your input <a class="more" href="#/questions">All</a></h2>
          ${qs.length ? `<ul class="qlist">${qs.slice(0, 5).map((q) => `<li><span class="tag">${esc(q.area || "other")}</span>${esc(q.q)}</li>`).join("")}</ul>` : empty("Nothing outstanding.")}
        </section>
        <section class="card">
          <h2>Job applications <a class="more" href="#/pipeline">Board</a></h2>
          ${apps.length ? funnel(apps, STATUSES, ACTIVE) : empty("No applications yet.")}
          ${freelanceOn(d) ? `<h2 class="sub-h">Freelance leads <a class="more" href="#/leads">Board</a></h2>
          ${d.leads.length ? funnel(d.leads, LEAD_STATUSES, LEAD_ACTIVE) : empty("No leads yet.")}` : ""}
        </section>
        <section class="card">
          <h2>Next steps</h2>
          ${upcoming.length ? `<ul class="steps">${upcoming.map((a) => {
            const due = dueBadge(a.meta.next_date);
            const label = a.meta.type === "lead" ? `<b>${esc(a.meta.name)}</b> · freelance` : `<b>${esc(a.meta.company)}</b> · ${esc(a.meta.role)}`;
            return `<li>${docLink(a, label)}<div class="muted small">${esc(a.meta.next_step)} ${due}</div></li>`;
          }).join("")}</ul>` : empty("No scheduled next steps.")}
        </section>
      </div>
      <section class="card">
        <h2>Latest activity <a class="more" href="#/log">Full log</a></h2>
        ${d.logs[0] ? `<div class="muted small">${esc(fmtDate(d.logs[0].meta.date))}</div>${body(d.logs[0])}` : empty("No activity logged yet.")}
      </section>`;
  },

  profile(d) {
    const p = d.profile, pref = d.preferences;
    const pm = pref?.meta || {};
    const sal = pm.salary || {};
    const SYM = { GBP: "£", USD: "$", EUR: "€", AUD: "A$", NZD: "NZ$", CAD: "C$", JPY: "¥", INR: "₹" };
    const money = (n) => `${SYM[sal.currency] || (esc(sal.currency || "") + " ")}${Number(n).toLocaleString()}`;
    const salary = [has(sal.min) && `${money(sal.min)} floor`, has(sal.target) && `${money(sal.target)} target`, has(sal.previous) && `<span class="muted">previous ${money(sal.previous)}</span>`]
      .filter(Boolean).join(" · ") + (has(sal.note) ? `<div class="muted small">${esc(sal.note)}</div>` : "");
    const fl = pm.freelance || {};
    const prefRows = [
      ["Tracks", chips(pm.tracks, "chip-accent")],
      ["Target roles", `<ul class="plain">${(pm.target_roles || []).map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`], ["Seniority", esc(pm.seniority)],
      ["Employment", chips(pm.employment_types)], ["Stretch roles", pm.apply_to_stretch_roles ? "Yes, apply even without every requirement" : ""],
      ["Locations", chips(pm.locations)], ["Work mode", chips(pm.work_mode)], ["Relocation", esc(pm.relocation)], ["Salary", salary],
      ["Priority", esc(pm.company_priority)], ["Industries: yes", chips(pm.industries_like)], ["Industries: no", chips(pm.industries_avoid, "chip-neg")],
      ["Company size", chips(pm.company_size)], ["Deal-breakers", chips(pm.deal_breakers, "chip-neg")],
      ["Availability", esc(pm.availability)],
    ].filter(([, v]) => v && v.trim());
    return header("Profile & goals", "Who you are and what you're looking for") + `
      <div class="grid-2">
        <section class="card"><h2>Profile</h2>${metaTable(p?.meta, ["updated"])}${body(p)}${updated(p)}</section>
        <section class="card"><h2>What you want next</h2>
          ${prefRows.length ? `<dl class="meta">${prefRows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>` : empty("Preferences not captured yet.")}
          ${body(pref)}${updated(pref)}</section>
      </div>
      ${has(fl) ? `<section class="card"><h2>Freelance: ${esc(fl.business || "")}</h2><dl class="meta">
        ${[["Services", chips(fl.services)], ["Targets", `<ul class="plain">${(fl.targets || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`], ["Approach", esc(fl.approach)],
            ["Previous rates", esc(fl.previous_rates)], ["Rate goal", esc(fl.rate_goal)], ["Flexibility", esc(fl.flexibility)]]
          .filter(([, v]) => v && v.replace(/<[^>]+>/g, "").trim()).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></section>` : ""}`;
  },

  strategy(d) {
    const s = d.strategy;
    if (!s) return header("Strategy") + empty("No strategy written yet.");
    const badge = has(s.meta.status) ? `<span class="tag">${esc(s.meta.status)}</span>` : "";
    return header("Strategy", "How we're running the search", badge) + `<section class="card">${body(s)}</section>${updated(s)}`;
  },

  cvguide(d) {
    const s = d.cvguide;
    if (!s) return header("CV guide") + empty("No CV guide written yet.");
    const badge = has(s.meta.status) ? `<span class="tag">${esc(s.meta.status)}</span>` : "";
    return header("CV guide", "How we build CVs: format, structure, tailoring", badge) + `<section class="card">${body(s)}</section>${updated(s)}`;
  },

  experience(d) {
    const roles = [...d.experience].sort((a, b) => (toMonths(b.meta.start) ?? 0) - (toMonths(a.meta.start) ?? 0));
    if (!roles.length) return header("Experience") + empty("No roles recorded yet. Tell Claude about your work history and each role becomes a file in <code>knowledge/experience/</code>.");
    const first = roles[roles.length - 1]?.meta.start;
    return header("Experience", `${roles.length} role${roles.length > 1 ? "s" : ""}${first ? ` · since ${fmtMonth(first)}` : ""}`) + `
      <ol class="timeline">${roles.map((r) => {
        const m = r.meta;
        const current = String(m.end) === "present";
        return `<li class="tl-item ${current ? "current" : ""}">
          <div class="tl-dot"></div>
          <article class="card">
            <div class="tl-head">
              <div><h3>${esc(m.title)}</h3><div class="tl-company">${esc(m.company)}${has(m.industry) ? ` <span class="muted">· ${esc(m.industry)}</span>` : ""}</div></div>
              <div class="tl-dates">${esc(fmtMonth(m.start))} – ${esc(fmtMonth(m.end) || "?")}<div class="muted small">${esc(duration(m.start, m.end))}</div></div>
            </div>
            <div class="muted small">${[m.location, m.employment, m.team].filter(has).map(esc).join(" · ")}</div>
            ${has(m.summary) ? `<p>${esc(m.summary)}</p>` : ""}
            ${has(m.roles) ? `<ol class="roles">${m.roles.map((x) => `<li><span>${esc(x.title)}</span><span class="muted small">${
              [fmtMonth(x.start), fmtMonth(x.end)].some(has) ? `${esc(fmtMonth(x.start) || "?")} – ${esc(fmtMonth(x.end) || "?")}` : esc(x.note || "dates unknown")}</span></li>`).join("")}</ol>` : ""}
            ${has(m.tech) ? `<div class="chips">${chips(m.tech)}</div>` : ""}
            ${r.html ? `<details><summary>Details</summary>${body(r)}</details>` : ""}
            ${r.error ? `<div class="alert small">${esc(r.error)}</div>` : ""}
          </article></li>`;
      }).join("")}</ol>`;
  },

  skills(d) {
    const groups = d.skills?.meta?.groups || [];
    if (!groups.length) return header("Skills") + empty("No skills recorded yet.") ;
    const order = (s) => { const i = LEVELS.indexOf(s.level); return i < 0 ? 9 : i; };
    return header("Skills", `${skillList(d).length} skills in ${groups.length} groups`,
      `<div class="legend">${LEVELS.map((l) => `<span class="lvl lvl-${l}"></span>${l}`).join("")}</div>`) +
      `<div class="grid-2">${groups.map((g) => `<section class="card"><h2>${esc(g.name)}</h2><div class="skills">${
        [...(g.skills || [])].sort((a, b) => order(a) - order(b)).map((s) => `<div class="skill" title="${esc(s.note || "")}">
          <span class="lvl lvl-${esc(s.level || "none")}"></span><span class="skill-name">${esc(s.name)}</span>
          <span class="muted small">${[has(s.years) && `${s.years}y`, has(s.last_used) && `'${String(s.last_used).slice(-2)}`].filter(Boolean).join(" · ")}</span></div>`).join("")
      }</div></section>`).join("")}</div>${d.skills?.html ? `<section class="card">${body(d.skills)}</section>` : ""}${updated(d.skills)}`;
  },

  education(d) {
    const m = d.education?.meta || {};
    const ent = m.entries || [], certs = m.certifications || [];
    if (!ent.length && !certs.length) return header("Education") + empty("No education recorded yet.");
    return header("Education") + `<div class="grid-2">
      <section class="card"><h2>Education</h2>${ent.length ? ent.map((e) => `<div class="edu">
        <h3>${esc([e.qualification, e.field].filter(has).join(", "))}</h3>
        <div>${esc(e.institution)}</div><div class="muted small">${[[e.start, e.end].filter(has).join(" – "), e.grade].filter(has).map(esc).join(" · ")}</div>
        ${has(e.notes) ? `<p class="small">${esc(e.notes)}</p>` : ""}</div>`).join("") : empty("None recorded.")}</section>
      <section class="card"><h2>Certifications</h2>${certs.length ? certs.map((c) => `<div class="edu">
        <h3>${has(c.url) ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.name)}</a>` : esc(c.name)}</h3>
        <div class="muted small">${[c.issuer, c.year].filter(has).map(esc).join(" · ")}</div></div>`).join("") : empty("None recorded.")}</section>
    </div>${body(d.education)}${updated(d.education)}`;
  },

  achievements(d) {
    const a = d.achievements;
    return header("Achievements", "Stories and wins that feed CVs and interview prep") +
      (a?.html ? `<section class="card stories">${body(a)}</section>${updated(a)}` : empty("No stories yet. These come out of the work-history intake."));
  },

  pipeline(d) {
    const apps = d.applications;
    if (!apps.length) return header("Job applications") + empty("No applications yet. Roles Claude finds or you mention appear here as cards.");
    const activeN = apps.filter((a) => ACTIVE.has(a.meta.status)).length;
    return header("Job applications", `${activeN} active · ${apps.length - activeN} closed`) +
      appStages(apps) + appFilters() + `<div id="apps-results">${appResults(apps)}</div>`;
  },

  leads(d) {
    return board(d.leads, LEAD_STATUSES, LEAD_ACTIVE, "Freelance leads",
      "No leads yet. Potential clients spotted on job boards, forums, social media and so on appear here as cards, one per client or project.",
      (a) => `<div class="kcard-top"><b>${esc(a.meta.name)}</b>${prioTag(a.meta.priority)}</div>
        <div class="muted small">${[a.meta.service, a.meta.source].filter(has).map(esc).join(" · ")}</div>`);
  },

  companies(d) {
    const rank = (c) => ({ high: 0, medium: 1, low: 2 }[c.meta.interest] ?? 1);
    const rows = [...d.companies].sort((a, b) => rank(a) - rank(b) || String(a.meta.industry || "").localeCompare(String(b.meta.industry || "")) || String(a.meta.name || "").localeCompare(String(b.meta.name || "")));
    if (!rows.length) return header("Companies") + empty("No companies researched yet.");
    return header("Companies", `${rows.length} tracked`) + table(["Company", "Industry", "Location", "Interest", "Status"], rows.map((c) => [
      docLink(c, `<b>${esc(c.meta.name)}</b>`), esc(c.meta.industry), esc(c.meta.location),
      has(c.meta.interest) ? `<span class="prio prio-${esc(c.meta.interest)}">${esc(c.meta.interest)}</span>` : "", esc(c.meta.status)]));
  },

  contacts(d) {
    if (!d.contacts.length) return header("Contacts") + empty("No contacts yet.");
    return header("Contacts", `${d.contacts.length} people`) + table(["Name", "Company", "Role", "Relationship", "Last contact", "Next"], d.contacts.map((c) => [
      docLink(c, `<b>${esc(c.meta.name)}</b>`), esc(c.meta.company), esc(c.meta.role), esc(c.meta.relationship), esc(fmtDate(c.meta.last_contact)), esc(c.meta.next_action)]));
  },

  documents(d) {
    const docs = [...d.documents].sort((a, b) => String(b.meta.updated || b.mtime).localeCompare(String(a.meta.updated || a.mtime)));
    const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
    return header("Documents", "CVs, cover letters and everything else produced") + `
      <section class="card"><h2>Written documents</h2>${docs.length ? table(["Title", "Type", "Target", "Status", "Updated"], docs.map((x) => [
        docLink(x, `<b>${esc(x.meta.title || x.path.split("/").pop())}</b>`), esc(x.meta.type), esc(x.meta.target),
        has(x.meta.status) ? `<span class="tag">${esc(x.meta.status)}</span>` : "", esc(fmtDate(x.meta.updated)),
      ])) : empty("No CVs or letters yet.")}</section>
      <section class="card"><h2>Files</h2>${d.files.length ? `<ul class="files">${d.files.map((f) => `<li><a href="/files/${esc(f.path)}" target="_blank">${esc(f.name)}</a> <span class="muted small">${esc(f.path)} · ${kb(f.size)}</span></li>`).join("")}</ul>` : empty("No exported files yet.")}</section>
      <section class="card"><h2>Inbox <span class="muted small">raw material you've dropped in</span></h2>${d.inbox.length ? `<ul class="files">${d.inbox.map((f) => `<li><a href="/files/${esc(f.path)}" target="_blank">${esc(f.name)}</a></li>`).join("")}</ul>` : empty("Empty. Drop old CVs or job ads into <code>inbox/</code>.")}</section>`;
  },

  questions(d) {
    const all = d.questions?.meta?.questions || [];
    const open = all.filter((q) => (q.status || "open") === "open"), done = all.filter((q) => q.status === "answered");
    const list = (qs) => `<ul class="qlist big">${qs.map((q) => `<li><span class="tag">${esc(q.area || "other")}</span><div>${esc(q.q)}<div class="muted small">added ${esc(fmtDate(q.added))}</div></div></li>`).join("")}</ul>`;
    return header("Open questions", "Gaps Claude needs you to fill. Answer them in chat.") +
      `<section class="card">${open.length ? list(open) : empty("Nothing outstanding.")}</section>` +
      (done.length ? `<section class="card faded"><h2>Recently answered</h2>${list(done)}</section>` : "") + updated(d.questions);
  },

  log(d) {
    if (!d.logs.length) return header("Activity log") + empty("Nothing logged yet.");
    return header("Activity log", "What agents did, day by day") +
      d.logs.map((l) => `<section class="card log"><div class="log-date">${esc(fmtDate(l.meta.date || l.path.match(/\d{4}-\d{2}-\d{2}/)?.[0]))}</div>${body(l)}</section>`).join("");
  },

  doc(d, path) {
    const doc = allDocs(d).find((x) => x.path === path);
    if (!doc) return header("Not found") + empty(`No file at <code>${esc(path)}</code>.`);
    const m = doc.meta || {};
    const title = (m.type === "experience" && m.company ? `${m.title} · ${m.company}` : "") ||
      (m.company && m.role ? `${m.company} · ${m.role}` : "") || m.title || m.name || path.split("/").pop();
    const badge = has(m.status) ? `<span class="pill s-${esc(m.status)}">${esc(statusLabel(m.status))}</span>` : "";
    return `<a class="back" href="javascript:history.back()">← Back</a>` + header(esc(title), esc(m.type || ""), badge) +
      (doc.error ? `<section class="card alert">${esc(doc.error)}</section>` : "") +
      `<div class="doc-layout"><section class="card">${body(doc) || empty("No body text.")}</section>
       <aside class="card">${metaTable(m, ["title"]) || empty("No metadata.")}${updated(doc)}</aside></div>`;
  },
};

const prioTag = (p) => (has(p) ? `<span class="prio prio-${esc(p)}">${esc(p)}</span>` : "");
const dueBadge = (v) => {
  const du = daysUntil(v);
  if (du === null) return "";
  if (du < 0) return `<span class="due late">${-du}d overdue</span>`;
  if (du === 0) return `<span class="due today">today</span>`;
  return `<span class="due">in ${du}d</span>`;
};

// ---------- job applications: stage summary, filters, card grid ----------
// Filters are view state only (nothing is written to the files). Remembered per browser.
const APP_DEFAULTS = { stage: "active", prio: "all", mode: "all", q: "", sort: "priority" };
const APP_UI = (() => {
  try { return { ...APP_DEFAULTS, ...JSON.parse(localStorage.getItem("hub.apps") || "{}"), q: "" }; }
  catch { return { ...APP_DEFAULTS }; }
})();
function saveAppUI() {
  try { localStorage.setItem("hub.apps", JSON.stringify({ ...APP_UI, q: "" })); } catch { /* storage unavailable */ }
}
const byText = (k) => (a, b) => String(a.meta[k] || "").localeCompare(String(b.meta[k] || ""));
const APP_SORTS = {
  priority: [(a, b) => byPrio("priority")(a, b) || String(a.meta.next_date || "9999").localeCompare(String(b.meta.next_date || "9999")) || byText("company")(a, b), "Priority"],
  due: [(a, b) => String(a.meta.next_date || "9999").localeCompare(String(b.meta.next_date || "9999")) || byPrio("priority")(a, b), "Next step due"],
  found: [(a, b) => String(b.meta.date_found || "").localeCompare(String(a.meta.date_found || "")) || byText("company")(a, b), "Newest first"],
  company: [byText("company"), "Company A–Z"],
};

function appStages(apps) {
  const count = (k) => apps.filter((a) => a.meta.status === k).length;
  const closedN = apps.filter((a) => !ACTIVE.has(a.meta.status)).length;
  const btn = (key, label, n, cls = "") => `<button type="button" class="stage ${cls} ${APP_UI.stage === key ? "on" : ""} ${n ? "" : "zero"}"
      data-apps="stage" data-val="${key}" aria-pressed="${APP_UI.stage === key}">
      <span class="stage-top">${cls === "stage-step" ? `<span class="dot s-${key}"></span>` : ""}${label}</span><span class="stage-n">${n}</span></button>`;
  return `<div class="stages" role="toolbar" aria-label="Filter by stage">
    ${btn("active", "All active", apps.length - closedN, "stage-all")}
    ${STATUSES.filter(([k]) => ACTIVE.has(k)).map(([k, l]) => btn(k, l, count(k), "stage-step")).join("")}
    ${btn("closed", "Closed", closedN, "stage-closed")}
  </div>`;
}

function appFilters() {
  const seg = (key, label, opts) => `<div class="filter"><span class="filter-l">${label}</span><div class="seg" role="group" aria-label="${label}">${
    opts.map(([v, l]) => `<button type="button" data-apps="${key}" data-val="${v}" class="${APP_UI[key] === v ? "on" : ""}" aria-pressed="${APP_UI[key] === v}">${l}</button>`).join("")}</div></div>`;
  const filtered = APP_UI.prio !== "all" || APP_UI.mode !== "all" || APP_UI.q || APP_UI.stage !== "active";
  return `<div class="filters">
    <input id="apps-q" class="search" type="search" placeholder="Search company, role, location…" value="${esc(APP_UI.q)}" aria-label="Search applications">
    ${seg("prio", "Priority", [["all", "All"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]])}
    ${seg("mode", "Work mode", [["all", "All"], ["remote", "Remote"], ["hybrid", "Hybrid"], ["onsite", "On-site"]])}
    <label class="filter"><span class="filter-l">Sort</span><select id="apps-sort">${
      Object.entries(APP_SORTS).map(([k, [, l]]) => `<option value="${k}" ${APP_UI.sort === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    ${filtered ? `<button type="button" class="linkbtn" data-apps="reset">Reset</button>` : ""}
  </div>`;
}

function appMatches(a) {
  const m = a.meta, s = m.status, f = APP_UI;
  if (f.stage === "active" ? !ACTIVE.has(s) : f.stage === "closed" ? ACTIVE.has(s) : s !== f.stage) return false;
  if (f.prio !== "all" && (m.priority || "medium") !== f.prio) return false;
  if (f.mode !== "all" && m.work_mode !== f.mode) return false;
  const q = f.q.trim().toLowerCase();
  return !q || [m.company, m.role, m.location, m.salary_range, m.next_step, m.source, ...(Array.isArray(m.tags) ? m.tags : [])].join(" ").toLowerCase().includes(q);
}

function appResults(apps) {
  const list = apps.filter(appMatches).sort((APP_SORTS[APP_UI.sort] || APP_SORTS.priority)[0]);
  const closedN = apps.filter((a) => !ACTIVE.has(a.meta.status)).length;
  if (!list.length) return `<div class="empty">No applications match. <button type="button" class="linkbtn" data-apps="reset">Clear the filters</button></div>`;

  if (APP_UI.stage === "closed") {
    return `<section class="card">${table(["Company", "Role", "Status", "Why", "Updated"], list.map((a) => [
      docLink(a, `<b>${esc(a.meta.company)}</b>`), esc(a.meta.role),
      `<span class="pill s-${esc(a.meta.status)}">${esc(statusLabel(a.meta.status))}</span>`,
      `<span class="muted small">${esc(a.meta.next_step)}</span>`, `<span class="nowrap">${esc(fmtDate(a.meta.updated))}</span>`]))}</section>`;
  }
  const groups = STATUSES.filter(([k]) => ACTIVE.has(k)).map(([k, l]) => [k, l, list.filter((a) => a.meta.status === k)]).filter((g) => g[2].length);
  return groups.map(([k, l, items]) => `<section class="app-group">
      <h2 class="group-h"><span class="dot s-${k}"></span>${l}<span class="group-n">${items.length}</span></h2>
      <div class="app-grid">${items.map(appCard).join("")}</div></section>`).join("") +
    (APP_UI.stage === "active" && closedN ? `<div class="closed-hint">${closedN} closed application${closedN > 1 ? "s" : ""} hidden.
      <button type="button" class="linkbtn" data-apps="stage" data-val="closed">Show</button></div>` : "");
}

const MODE_LABEL = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };
function appCard(a) {
  const m = a.meta;
  const tags = [
    has(m.work_mode) && `<span class="tagx mode-${esc(m.work_mode)}">${esc(MODE_LABEL[m.work_mode] || m.work_mode)}</span>`,
    has(m.salary_range) && `<span class="tagx">${esc(m.salary_range)}</span>`,
    has(m.visa_support) && `<span class="tagx tag-visa" title="Visa sponsorship / relocation help">Visa: ${esc(m.visa_support)}</span>`,
    ...(Array.isArray(m.tags) ? m.tags : []).map((t) => `<span class="tagx">${esc(t)}</span>`),
  ].filter(Boolean).join("");
  return `<a class="acard p-${esc(m.priority || "medium")}" href="#/doc/${encodeURIComponent(a.path)}">
    <div class="acard-head">
      <div class="acard-title"><div class="acard-co">${esc(m.company)}</div><div class="acard-role">${esc(m.role)}</div></div>
      ${prioTag(m.priority)}
    </div>
    ${has(m.location) ? `<div class="acard-loc">${esc(m.location)}</div>` : ""}
    ${tags ? `<div class="acard-tags">${tags}</div>` : ""}
    ${has(m.next_step) ? `<div class="acard-next"><span class="acard-next-l">Next</span>${esc(m.next_step)} ${dueBadge(m.next_date)}</div>` : ""}
    <div class="acard-foot">${[has(m.date_found) && `Found ${esc(fmtDate(m.date_found))}`, has(m.source) && esc(m.source)].filter(Boolean).join(" · ")}</div>
  </a>`;
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-apps]");
  if (!b) return;
  if (b.dataset.apps === "reset") Object.assign(APP_UI, APP_DEFAULTS);
  else APP_UI[b.dataset.apps] = b.dataset.val;
  saveAppUI();
  render();
});
document.addEventListener("input", (e) => {
  if (e.target.id !== "apps-q") return;
  APP_UI.q = e.target.value;
  const box = document.getElementById("apps-results");
  if (box && DATA) box.innerHTML = appResults(DATA.applications);
});
document.addEventListener("change", (e) => {
  if (e.target.id !== "apps-sort") return;
  APP_UI.sort = e.target.value;
  saveAppUI();
  render();
});

function funnel(items, statuses, active) {
  return `<div class="funnel">${statuses.filter(([k]) => active.has(k)).map(([k, l]) => {
    const n = items.filter((a) => a.meta.status === k).length;
    return `<div class="funnel-row"><span>${l}</span><div class="bar"><i class="s-${k}" style="width:${items.length ? (n / items.length) * 100 : 0}%"></i></div><b>${n}</b></div>`;
  }).join("")}</div>`;
}

// Kanban board shared by job applications and freelance leads.
function board(items, statuses, active, title, emptyMsg, cardBody) {
  if (!items.length) return header(title) + empty(emptyMsg);
  const col = ([k, l]) => {
    const inCol = items.filter((a) => a.meta.status === k).sort(byPrio("priority"));
    return `<div class="col"><div class="col-head"><span class="dot s-${k}"></span>${l}<b>${inCol.length}</b></div>
      ${inCol.map((a) => `<a class="kcard" href="#/doc/${encodeURIComponent(a.path)}">${cardBody(a)}
        ${has(a.meta.next_step) ? `<div class="next small">→ ${esc(a.meta.next_step)}${has(a.meta.next_date) ? ` · ${esc(fmtDate(a.meta.next_date))}` : ""}</div>` : ""}
      </a>`).join("")}</div>`;
  };
  const closed = items.filter((a) => !active.has(a.meta.status));
  return header(title, `${items.length - closed.length} active · ${closed.length} closed`) +
    `<div class="board">${statuses.filter(([k]) => active.has(k)).map(col).join("")}</div>` +
    (closed.length ? `<h2 class="section-title">Closed</h2><div class="board">${statuses.filter(([k]) => !active.has(k)).map(col).join("")}</div>` : "");
}

function tile(label, n, href, cls = "") {
  return `<a class="tile card ${cls}" href="${href}"><span class="tile-n">${n}</span><span class="tile-l">${label}</span></a>`;
}
function table(head, rows) {
  return `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c || ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

// ---------- shell ----------
function route() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  if (h.startsWith("doc/")) return ["doc", h.slice(4)];
  return [VIEWS[h] ? h : "overview", null];
}

function render() {
  if (!DATA) return;
  const [view, arg] = route();
  const active = view === "doc" ? null : view;
  document.getElementById("nav").innerHTML = NAV.filter((n) => !n.show || n.show(DATA)).map((n) => {
    if (n.group) return `<div class="nav-group">${n.group}</div>`;
    const c = n.count ? n.count(DATA) : null;
    const label = typeof n.label === "function" ? esc(n.label(DATA)) : n.label;
    return `<a href="${n.href || `#/${n.id}`}" class="${n.id === active ? "active" : ""}">${label}${c ? `<span class="badge ${n.alert ? "badge-alert" : ""}">${c}</span>` : ""}</a>`;
  }).join("");
  const y = window.scrollY;
  const focusId = document.activeElement?.id; // keep typing focus (e.g. the search box) across re-renders
  document.getElementById("main").innerHTML = VIEWS[view](DATA, arg);
  window.scrollTo(0, y);
  const f = focusId && document.getElementById(focusId);
  if (f) { f.focus(); if (f.type === "search") f.setSelectionRange(f.value.length, f.value.length); }
}

async function load() {
  const res = await fetch("/api/data");
  if (!res.ok) throw new Error(await res.text());
  DATA = await res.json();
  document.getElementById("sync").textContent = `Synced ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  render();
}

async function poll() {
  try {
    const v = await (await fetch("/api/version")).json();
    if (VERSION && v.static !== VERSION.static) return location.reload(); // Hub code changed
    if (VERSION && v.data !== VERSION.data) await load(); // content changed
    VERSION = v;
    document.getElementById("sync").classList.remove("offline");
  } catch {
    const s = document.getElementById("sync");
    s.textContent = "Hub offline";
    s.classList.add("offline");
  }
}

// Web links and exported files open in a new tab in the user's own default browser, via the
// Hub server, so the Hub never gets navigated away. Falls back to a normal new tab.
async function openOutside(url) {
  try {
    const r = await fetch("/api/open", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Hub": "open" },
      body: JSON.stringify({ url }),
    });
    if (!r.ok) throw new Error(r.status);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || !/^https?:/.test(a.href)) return;
  const u = new URL(a.href);
  if (u.origin === location.origin && !u.pathname.startsWith("/files/")) return; // Hub's own pages
  if (u.origin === location.origin && a.closest(".md") && !/^\/|^[a-z]+:/i.test(a.getAttribute("href"))) return; // relative links: handled below
  e.preventDefault();
  e.stopImmediatePropagation();
  openOutside(a.href);
});

// Relative links inside rendered Markdown open inside the Hub (.md) or as files.
document.addEventListener("click", (e) => {
  const a = e.target.closest(".md a[href]");
  if (!a) return;
  const href = a.getAttribute("href");
  if (/^[a-z]+:|^#|^\//i.test(href)) return;
  e.preventDefault();
  const base = a.closest("[data-base]").dataset.base.split("/").slice(0, -1);
  for (const part of href.split("#")[0].split("/")) {
    if (part === "..") base.pop(); else if (part && part !== ".") base.push(part);
  }
  const target = base.join("/");
  if (target.endsWith(".md")) location.hash = `#/doc/${encodeURIComponent(target)}`;
  else openOutside(`${location.origin}/files/${target}`);
});

window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
load().catch((e) => { document.getElementById("main").innerHTML = `<section class="card alert">Couldn't load data: ${esc(e.message)}</section>`; });
poll();
setInterval(poll, 2000);
