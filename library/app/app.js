/* Portfolio library: the user's own work found on their drives (images, video, audio, documents, 3D...),
   grouped into projects, for picking what goes in a portfolio, CV, reel or application.
   Data: /api/library (built by library/tools/build.py). Labels: /api/library/marks (library/marks.json),
   written through POST /api/library/mark and /api/library/answer. Everything else is read-only. */
"use strict";

// ---------- state ----------
let LIB = null, CFG = { uses: [] }, MARKS = {}, ANSWERS = [], ITEMS = [], PROJ = {};
let SEL = null;            // selected item id (keyboard target)
let LIST = [];             // items in the current view, in order (keyboard, player queue, review)
let SHOWN = 0;             // how many of LIST are rendered (infinite scroll)
let PLAY = null;           // audio id playing in the bottom player
let VIEW = null;           // overlay state: {mode: "view"|"review", queue, i}
let VERSION = null;
const PAGE = 80;
const RATES = [["great", "Great", "1"], ["good", "Good", "2"], ["mid", "Mid", "3"], ["bad", "Bad", "4"]];
const KIND_LABEL = { image: "Images", video: "Videos", audio: "Audio", document: "Documents", model: "3D" };
const KIND_ONE = { image: "image", video: "video", audio: "audio", document: "document", model: "3D file" };
const RESERVED = new Set(["f", "h", "j", "k", "o"]);
let USES = [];             // [[key, Label, shortcut]] from library/config.yaml `uses`
const CONF = { confirmed: "Confirmed", likely: "Likely", guess: "Needs you", unknown: "Unknown" };
const DEFAULT_F = { kind: "", rating: "", use: "", project: "", fav: false, hidden: false, sort: "featured", tier: "" };
let F = loadF();
let Q = "";

function loadF() { try { return { ...DEFAULT_F, ...JSON.parse(localStorage.getItem("pl-filters") || "{}") }; } catch { return { ...DEFAULT_F }; } }
function persist() { try { localStorage.setItem("pl-filters", JSON.stringify(F)); } catch { /* storage unavailable */ } }

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dur = (s) => { s = Math.round(+s || 0); return s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const mk = (id) => MARKS[id] || {};
const pname = (slug) => (PROJ[slug] || {}).name || "";
const kindLabel = (k) => KIND_LABEL[k] || (k.charAt(0).toUpperCase() + k.slice(1));
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 1400); }
function typing() { const a = document.activeElement; return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT"); }
const playable = (x) => x.kind === "audio";

// ---------- data ----------
async function boot() {
  const [c, m] = await Promise.all([fetch("/api/library").then((r) => r.json()), fetch("/api/library/marks").then((r) => r.json())]);
  MARKS = m.marks || {}; ANSWERS = m.answers || []; CFG = m.config || CFG;
  const used = new Set();
  USES = (CFG.uses || []).map((u) => {
    const k = [...u].find((ch) => /[a-z]/.test(ch) && !RESERVED.has(ch) && !used.has(ch)) || "";
    if (k) used.add(k);
    return [u, u.charAt(0).toUpperCase() + u.slice(1), k.toUpperCase()];
  });
  $("#brand-title").textContent = CFG.title || "Portfolio library";
  document.title = CFG.title || "Portfolio library";
  if (c.missing) return notBuilt();
  LIB = c;
  PROJ = Object.fromEntries((LIB.projects || []).map((p) => [p.slug, p]));
  ITEMS = LIB.items.map((x) => ({ ...x, year: String(x.mtime).slice(0, 4),
    hay: [x.label, x.name, x.rel, x.folder, x.desc, x.kind, (x.tags || []).join(" "), pname(x.project)].join(" ").toLowerCase() }));
  route();
  setInterval(poll, 3000);
}
function notBuilt() {
  $("#tabs").innerHTML = "";
  $("#rail").innerHTML = "";
  $("#main").innerHTML = `<div class="panel callout" style="max-width:640px;margin:40px auto">
    <h2>Nothing catalogued yet</h2>
    <p>${CFG.enabled ? "The library is switched on, but no scan has been built." : "The library is switched off."}
    Ask Claude to <b>"set up my portfolio library"</b>. It will ask which folders hold your work, scan them,
    group the files into projects and build this page. Your files are never moved or changed.</p></div>`;
  setInterval(poll, 3000);
}
async function poll() {
  try {
    const v = await (await fetch("/api/version")).json();
    if (VERSION && v.static !== VERSION.static) location.reload();
    if (VERSION && v.library !== VERSION.library && !VIEW) location.reload(); // library rebuilt
    VERSION = v;
  } catch { /* offline: keep working */ }
}

async function save(id, field, value) {
  const prev = { ...mk(id) };
  const next = { ...prev, [field]: value };
  if (!value || (Array.isArray(value) && !value.length)) delete next[field];
  MARKS[id] = next;
  refreshMarks(id);
  try {
    const r = await fetch("/api/library/mark", { method: "POST", headers: { "Content-Type": "application/json", "X-Hub": "library" }, body: JSON.stringify({ id, field, value }) });
    if (!r.ok) throw new Error(await r.text());
  } catch (e) {
    MARKS[id] = prev; refreshMarks(id); toast("Couldn't save: " + e.message);
  }
}
function rate(id, v) { const cur = mk(id).rating; save(id, "rating", cur === v ? null : v); toast(cur === v ? "Rating cleared" : `Marked ${v}`); }
function toggle(id, f) { const v = !mk(id)[f]; save(id, f, v); toast(f === "fav" ? (v ? "Favourited" : "Unfavourited") : (v ? "Hidden" : "Unhidden")); }
function toggleUse(id, u) { const s = new Set(mk(id).use || []); s.has(u) ? s.delete(u) : s.add(u); save(id, "use", [...s]); toast(`${s.has(u) ? "Marked for" : "Removed from"} ${u}`); }

// ---------- filtering ----------
function match(it, f, except = "") {
  const m = mk(it.id);
  if (!f.hidden && m.hide) return false;
  if (except !== "kind" && f.kind && it.kind !== f.kind) return false;
  if (except !== "rating" && f.rating) { if (f.rating === "unrated" ? m.rating : m.rating !== f.rating) return false; }
  if (except !== "use" && f.use && !(m.use || []).includes(f.use)) return false;
  if (f.fav && !m.fav) return false;
  if (except !== "project" && f.project && (f.project === "_none" ? it.project : it.project !== f.project)) return false;
  if (Q && !it.hay.includes(Q)) return false;
  return true;
}
const RANK = { great: 0, good: 1, mid: 2, bad: 3 };
function sorted(arr, how) {
  const a = [...arr];
  const tierIx = (x) => { const t = (PROJ[x.project] || {}).tier; const i = (LIB.tiers || []).findIndex((y) => y.key === t); return i < 0 ? 99 : i; };
  if (how === "featured") {
    // favourites and ratings first, then items from the most important projects, newest within
    const score = (x) => [mk(x.id).fav ? 0 : 1, RANK[mk(x.id).rating] ?? 4, x.project ? 0 : 1, tierIx(x)];
    a.sort((x, y) => { const sx = score(x), sy = score(y); for (let i = 0; i < sx.length; i++) if (sx[i] !== sy[i]) return sx[i] - sy[i]; return String(y.mtime).localeCompare(String(x.mtime)); });
  } else if (how === "rating") a.sort((x, y) => (RANK[mk(x.id).rating] ?? 4) - (RANK[mk(y.id).rating] ?? 4) || String(y.mtime).localeCompare(String(x.mtime)));
  else if (how === "project") a.sort((x, y) => pname(x.project).localeCompare(pname(y.project)) || x.label.localeCompare(y.label));
  else if (how === "name") a.sort((x, y) => x.label.localeCompare(y.label));
  else if (how === "size") a.sort((x, y) => (y.size || 0) - (x.size || 0));
  else a.sort((x, y) => String(y.mtime).localeCompare(String(x.mtime)));
  return a;
}
function count(arr, key) { const c = {}; for (const x of arr) { const k = key(x); if (k) c[k] = (c[k] || 0) + 1; } return c; }

// ---------- routing ----------
function view() { return decodeURIComponent(location.hash.slice(1)) || "all"; }
function route() {
  if (!LIB) return;
  const v = view();
  tabs(v);
  if (v === "all" || LIB.kinds.includes(v)) return listView(v);
  if (v === "projects") return projectsView();
  if (v.startsWith("project/")) return projectView(v.slice(8));
  if (v === "questions") return questionsView();
  location.hash = "all";
}
window.addEventListener("hashchange", () => { $("#main").scrollTop = 0; route(); });

function tabs(v) {
  const vis = ITEMS.filter((x) => !mk(x.id).hide);
  const t = [["all", "All", vis.length], ...(LIB.kinds.length > 1 ? LIB.kinds.map((k) => [k, kindLabel(k), vis.filter((x) => x.kind === k).length]) : []),
    ["projects", "Projects", LIB.projects.length], ["questions", "Questions", openQuestions().length]];
  $("#tabs").innerHTML = t.map(([id, l, n]) => `<a href="#${id}" class="${v === id || (id === "projects" && v.startsWith("project/")) ? "on" : ""}">${esc(l)}<span class="n ${id === "questions" && n ? "alert" : ""}">${n.toLocaleString()}</span></a>`).join("");
}

// ---------- item lists ----------
function listView(v) {
  const f = { ...F, kind: v === "all" ? F.kind : v };
  LIST = sorted(ITEMS.filter((x) => match(x, f)), F.sort);
  rail(v, f);
  const rated = ITEMS.filter((x) => !mk(x.id).hide && mk(x.id).rating).length;
  const keys = USES.filter((u) => u[2]).map(([, l, k]) => `<kbd>${k}</kbd> ${esc(l.toLowerCase())}`).join(", ");
  $("#main").innerHTML = `<div class="lhead"><h1>${v === "all" ? "All work" : esc(kindLabel(v))}</h1>
      <span class="meta">${LIST.length.toLocaleString()} shown · ${rated.toLocaleString()} rated so far</span>
      <span class="sort">Sort <select data-f="sort">${[["featured", "Featured"], ["newest", "Newest"], ["rating", "Best rated"], ["project", "Project"], ["name", "Name"], ["size", "Largest"]].map(([k, l]) => `<option value="${k}" ${F.sort === k ? "selected" : ""}>${l}</option>`).join("")}</select></span></div>
    <p class="hint">Rate with <kbd>1</kbd>–<kbd>4</kbd> (great → bad), <kbd>F</kbd> favourite${keys ? `, ${keys}` : ""}, <kbd>H</kbd> hide. <kbd>J</kbd>/<kbd>K</kbd> move, <kbd>Enter</kbd> open, <kbd>Space</kbd> play audio. Or press <b>Review</b> to go one by one.</p>
    ${LIST.length ? `<div class="grid" id="list"></div><div class="more-sentinel" id="more"></div>` : `<div class="empty">Nothing matches these filters.</div>`}`;
  SHOWN = 0;
  more();
  observe();
}
function more() {
  const el = $("#list");
  if (!el || SHOWN >= LIST.length) return;
  const chunk = LIST.slice(SHOWN, SHOWN + PAGE);
  el.insertAdjacentHTML("beforeend", chunk.map(cardHTML).join(""));
  SHOWN += chunk.length;
}
let OBS = null;
function observe() {
  if (OBS) OBS.disconnect();
  const s = $("#more");
  if (!s) return;
  OBS = new IntersectionObserver((e) => { if (e[0].isIntersecting) more(); }, { root: $("#main"), rootMargin: "600px" });
  OBS.observe(s);
}

function marksHTML(id) {
  const m = mk(id);
  return `<div class="rate">${RATES.map(([v, l, k]) => `<button class="${v} ${m.rating === v ? "on" : ""}" data-act="rate" data-v="${v}" title="${l} (${k})">${l}</button>`).join("")}</div>
    <button class="ico fav ${m.fav ? "on" : ""}" data-act="fav" title="Favourite (F)">${m.fav ? "★" : "☆"}</button>
    ${USES.map(([u, l, k]) => `<button class="use ${(m.use || []).includes(u) ? "on" : ""}" data-act="use" data-v="${esc(u)}" title="Use for ${esc(l.toLowerCase())}${k ? ` (${k})` : ""}">${esc(l)}</button>`).join("")}
    <button class="ico" data-act="hide" title="${m.hide ? "Unhide" : "Hide: not portfolio material"} (H)">${m.hide ? "◌" : "⊘"}</button>`;
}
function thumbHTML(x) {
  const m = mk(x.id);
  const rb = m.rating ? `<span class="rb"><span class="badge ${m.rating}">${m.rating}</span></span>` : "";
  const corner = x.duration ? `<span class="dur">${dur(x.duration)}</span>` : (x.width ? `<span class="dur">${x.width}×${x.height}</span>` : "");
  if (x.thumb) {
    return `<button class="thumb ${x.thumb}" data-act="open" style="background-image:url('/thumbs/${x.id}.jpg')" title="Open (Enter)${x.thumb === "strip" ? ". Hover to scrub frames" : ""}">${rb}${corner}</button>`;
  }
  const icon = { audio: "♪", video: "▶", image: "▣", document: "≡", model: "◆" }[x.kind] || "□";
  const act = playable(x) ? "play" : "open";
  return `<button class="thumb none ${PLAY === x.id ? "playing" : ""}" data-act="${act}" title="${playable(x) ? "Play (Space)" : "Open (Enter)"}">
    <span class="noimg"><span class="kicon">${PLAY === x.id && !$("#audio").paused ? "❚❚" : icon}</span><span>${esc(x.ext.replace(".", "").toUpperCase())}</span></span>${rb}${corner}</button>`;
}
function cardHTML(x) {
  const m = mk(x.id);
  const sub = [x.project ? pname(x.project) : x.folder, KIND_ONE[x.kind] || x.kind, x.year].filter(Boolean).join(" · ");
  return `<div class="card ${SEL === x.id ? "sel" : ""} ${m.hide ? "is-hidden" : ""}" data-id="${x.id}">
    ${thumbHTML(x)}
    <div class="cbody"><div class="ct" data-act="select"><b title="${esc(x.name)}">${esc(x.label)}</b><span>${esc(sub)}</span></div>
      <div class="marks">${marksHTML(x.id)}</div></div></div>`;
}
function refreshMarks(id) {
  document.querySelectorAll(`.card[data-id="${id}"]`).forEach((el) => {
    const it = ITEMS.find((x) => x.id === id);
    if (it) el.outerHTML = cardHTML(it);
  });
  if (PLAY === id) $("#p-marks").innerHTML = marksHTML(id);
  if (VIEW) { const it = VIEW.queue[VIEW.i]; if (it && it.id === id) sidePanel(); }
  if (id.startsWith("p:")) document.querySelectorAll(`[data-pid="${id}"] .marks, .marks[data-pid="${id}"]`).forEach((g) => { g.innerHTML = marksHTML(id); });
}

// ---------- filter rail ----------
function rail(v, f) {
  const base = (ex) => ITEMS.filter((x) => match(x, f, ex));
  const chip = (key, val, label, cls = "") => `<button class="chip ${cls} ${F[key] === val ? "on" : ""}" data-set="${key}" data-v="${esc(val)}">${label}</button>`;
  const rc = count(base("rating"), (x) => mk(x.id).rating || "unrated");
  const pc = Object.entries(count(base("project"), (x) => x.project || "_none")).sort((a, b) => b[1] - a[1]);
  const all = ITEMS.filter((x) => !mk(x.id).hide && (v === "all" || x.kind === v));
  const done = all.filter((x) => mk(x.id).rating).length;
  let h = `<div class="f-sec progress"><div class="f-h">Rating progress</div>${done.toLocaleString()} of ${all.length.toLocaleString()} rated
    <div class="bar"><i style="width:${all.length ? (done / all.length) * 100 : 0}%"></i></div></div>`;
  if (v === "all" && LIB.kinds.length > 1) {
    const kc = count(base("kind"), (x) => x.kind);
    h += `<div class="f-sec"><div class="f-h">Kind ${F.kind ? `<button data-set="kind" data-v="">clear</button>` : ""}</div><div class="chips">${LIB.kinds.map((k) => chip("kind", k, `${esc(kindLabel(k))} <span class="c">${kc[k] || 0}</span>`)).join("")}</div></div>`;
  }
  h += `<div class="f-sec"><div class="f-h">Your rating ${F.rating ? `<button data-set="rating" data-v="">clear</button>` : ""}</div><div class="chips">
    ${chip("rating", "unrated", `Unrated ${rc.unrated || 0}`)}${RATES.map(([k, l]) => chip("rating", k, `${l} ${rc[k] || 0}`, "r-" + k)).join("")}</div>
    <label class="toggle"><input type="checkbox" data-tog="fav" ${F.fav ? "checked" : ""}> ★ Favourites only</label></div>`;
  if (USES.length) h += `<div class="f-sec"><div class="f-h">Marked for ${F.use ? `<button data-set="use" data-v="">clear</button>` : ""}</div><div class="chips">${USES.map(([u, l]) => chip("use", u, esc(l))).join("")}</div></div>`;
  h += `<div class="f-sec"><div class="f-h">Project ${F.project ? `<button data-set="project" data-v="">clear</button>` : ""}</div>
    <input class="f-search" placeholder="Find a project…" data-pfilter>
    <div class="glist">${pc.map(([p, n]) => `<button class="${F.project === p ? "on" : ""}" data-set="project" data-v="${esc(p)}" data-name="${esc((p === "_none" ? "unsorted" : pname(p)).toLowerCase())}"><span>${esc(p === "_none" ? "— Not in a project —" : pname(p))}</span><span class="c">${n}</span></button>`).join("")}</div></div>
    <div class="f-sec"><label class="toggle"><input type="checkbox" data-tog="hidden" ${F.hidden ? "checked" : ""}> Show hidden items</label>
    <button class="btn" style="margin-top:8px;width:100%" data-reset>Reset filters</button></div>`;
  $("#rail").innerHTML = h;
}

// ---------- projects ----------
function projectsView() {
  const tiers = LIB.tiers || [];
  $("#rail").innerHTML = `<div class="f-sec"><div class="f-h">Tier ${F.tier ? `<button data-set="tier" data-v="">clear</button>` : ""}</div><div class="chips">${tiers.map((t) => `<button class="chip ${F.tier === t.key ? "on" : ""}" data-set="tier" data-v="${esc(t.key)}">${esc(t.label)}</button>`).join("")}</div></div>
    <div class="f-sec"><div class="f-h">How sure</div><div class="hint" style="margin:0">Confirmed = you or your notes say so. Likely = strong evidence in the files. Needs you = see Questions.</div></div>
    <div class="f-sec"><div class="f-h">Rate the projects</div><div class="hint" style="margin:0">Rate each project for how much to feature it in your CV, portfolio and applications.</div></div>`;
  const ps = LIB.projects.filter((p) => (!F.tier || p.tier === F.tier) && (!Q || [p.name, p.client, p.evidence, p.role].join(" ").toLowerCase().includes(Q)));
  LIST = [];
  if (!LIB.projects.length) {
    $("#main").innerHTML = `<div class="lhead"><h1>Projects</h1></div><div class="empty">No projects yet. Claude groups scanned folders into projects in <code>library/projects.yaml</code>, asking you where it isn't sure.</div>`;
    return;
  }
  const groups = [...tiers, { key: "_other", label: "Other" }];
  $("#main").innerHTML = `<div class="lhead"><h1>Projects</h1><span class="meta">${ps.length} projects</span></div>` + groups.map((t) => {
    const rows = ps.filter((p) => (t.key === "_other" ? !tiers.some((x) => x.key === p.tier) : p.tier === t.key));
    if (!rows.length) return "";
    return `<div class="tier-h">${esc(t.label)} · ${rows.length}</div><div class="ggrid">${rows.map((p) => `<div class="gcard" data-pid="p:${esc(p.slug)}" data-go="project/${esc(p.slug)}">
        <div><h3>${esc(p.name)}</h3><div class="sub">${esc([p.client, p.years, p.role].filter(Boolean).join(" · "))}</div></div>
        <div class="stats">${Object.entries(p.by_kind || {}).map(([k, n]) => `<span><b>${n}</b> ${esc(kindLabel(k).toLowerCase())}</span>`).join("") || "<span>no files linked</span>"}
          ${p.confidence ? `<span class="badge ${p.confidence === "guess" ? "acc" : ""}">${esc(CONF[p.confidence] || p.confidence)}</span>` : ""}${p.question ? `<span class="badge acc">question</span>` : ""}</div>
        <div class="marks" data-stop>${marksHTML("p:" + p.slug)}</div></div>`).join("")}</div>`;
  }).join("");
}
function projectView(slug) {
  const p = PROJ[slug];
  if (!p) { $("#main").innerHTML = `<div class="empty">No project called ${esc(slug)}.</div>`; return; }
  const items = sorted(ITEMS.filter((x) => x.project === slug && !mk(x.id).hide), "featured");
  LIST = items;
  SHOWN = LIST.length;
  $("#rail").innerHTML = `<div class="f-sec"><div class="f-h">${esc(p.name)}</div><div class="progress">${items.length} items</div></div>
    <div class="f-sec"><a class="btn" href="#projects" style="display:block;text-align:center">← All projects</a></div>`;
  const ans = ANSWERS.filter((a) => a.ref === "p:" + slug);
  $("#main").innerHTML = `<a class="back" href="#projects">← Projects</a>
    <div class="gpage-h"><div><h1>${esc(p.name)}</h1><div class="sub" style="color:var(--muted)">${esc([p.client, p.years, p.role].filter(Boolean).join(" · "))}</div></div>
      <div class="marks" data-pid="p:${esc(slug)}">${marksHTML("p:" + slug)}</div></div>
    ${p.question ? qcardHTML({ q: p.question, ref: "p:" + slug, ctx: "" }, ans) : ""}
    ${p.evidence || p.note ? `<div class="panel"><h2>About ${p.confidence ? `<span class="badge">${esc(CONF[p.confidence] || p.confidence)}</span>` : ""}</h2>${p.evidence ? `<p>${esc(p.evidence)}</p>` : ""}${p.note ? `<p style="color:var(--muted)">${esc(p.note)}</p>` : ""}</div>` : ""}
    ${items.length ? `<div class="grid" id="list">${items.map(cardHTML).join("")}</div>` : `<div class="empty">No files linked yet.</div>`}`;
}

// ---------- questions ----------
// general questions are keyed by a hash of their text, so removing one never shifts the others
function qref(t) { let h = 5381; for (const c of t) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return "q:" + h.toString(36); }
function allQuestions() {
  const qs = LIB.projects.filter((p) => p.question).map((p) => ({ q: p.question, ref: "p:" + p.slug, ctx: p.name }));
  (LIB.questions || []).forEach((q) => qs.push({ q: q.q, ref: qref(q.q), ctx: q.context || "" }));
  return qs;
}
function openQuestions() { return allQuestions().filter((q) => !ANSWERS.some((a) => a.ref === q.ref)); }
function qcardHTML(q, ans) {
  return `<div class="qcard ${ans.length ? "answered" : ""}" data-ref="${esc(q.ref)}">
    <div class="qt">${esc(q.q)}</div>${q.ctx ? `<div class="qc">${esc(q.ctx)}</div>` : ""}
    ${ans.map((a) => `<div class="qc" style="color:var(--great)">✓ You said (${esc(a.at.slice(0, 10))}): ${esc(a.text)}</div>`).join("")}
    <textarea placeholder="${ans.length ? "Add more…" : "Your answer (plain words are fine)"}"></textarea>
    <div class="qa"><span class="saved"></span><button class="btn primary" data-answer>Save answer</button></div></div>`;
}
function questionsView() {
  const all = allQuestions();
  const folders = LIB.folders.filter((f) => !f.project_slug && !f.ignore && f.files > 0).sort((a, b) => b.files - a.files);
  const open = all.filter((q) => !ANSWERS.some((a) => a.ref === q.ref));
  const done = all.filter((q) => ANSWERS.some((a) => a.ref === q.ref));
  LIST = [];
  $("#rail").innerHTML = `<div class="f-sec progress"><div class="f-h">Answered</div>${done.length} of ${all.length}<div class="bar"><i style="width:${all.length ? (done.length / all.length) * 100 : 0}%"></i></div></div>
    <div class="f-sec hint" style="margin:0">Answers are saved for Claude, which updates the projects and your knowledge base from them next session (or ask it to now).</div>`;
  const counts = (f) => Object.entries(f.counts || {}).map(([k, n]) => `${n} ${kindLabel(k).toLowerCase()}`).join(", ");
  $("#main").innerHTML = `<div class="lhead"><h1>Questions</h1><span class="meta">${open.length} open</span></div>
    ${open.map((q) => qcardHTML(q, [])).join("") || `<div class="empty">No open questions.</div>`}
    ${done.length ? `<div class="sec-h">Answered · ${done.length}</div>` + done.map((q) => qcardHTML(q, ANSWERS.filter((a) => a.ref === q.ref))).join("") : ""}
    ${folders.length ? `<div class="sec-h">Folders not linked to a project · ${folders.length}</div>
    <p class="hint">Biggest first. A few words each is plenty, like "Client X brand refresh, 2021, I did the illustrations", or "not mine, ignore".</p>
    ${folders.slice(0, 80).map((f) => qcardHTML({ q: f.project, ref: "f:" + f.id, ctx: `${f.root_label || f.root} · ${counts(f)} · ${f.first || "?"} to ${f.last || "?"}${f.examples?.length ? " · e.g. " + f.examples.slice(0, 3).join(", ") : ""}` }, ANSWERS.filter((a) => a.ref === "f:" + f.id))).join("")}` : ""}`;
}
async function answer(card) {
  const text = card.querySelector("textarea").value.trim();
  if (!text) return;
  const body = { ref: card.dataset.ref, q: card.querySelector(".qt").textContent, text };
  try {
    const r = await fetch("/api/library/answer", { method: "POST", headers: { "Content-Type": "application/json", "X-Hub": "library" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    ANSWERS.push((await r.json()).saved);
    card.querySelector(".saved").textContent = "Saved ✓";
    card.classList.add("answered");
    card.querySelector("textarea").value = "";
    tabs(view());
    toast("Answer saved");
  } catch (e) { toast("Couldn't save: " + e.message); }
}

// ---------- bottom audio player ----------
const audio = $("#audio");
function playAudio(id) {
  const it = ITEMS.find((x) => x.id === id);
  if (!it) return;
  if (PLAY === id) { audio.paused ? audio.play() : audio.pause(); return; }
  const old = PLAY; PLAY = id; SEL = id;
  audio.src = `/media/${id}`; audio.play().catch(() => {});
  $("#player").classList.remove("hidden");
  $("#p-title").textContent = it.label;
  $("#p-sub").textContent = [pname(it.project) || it.folder, it.year].filter(Boolean).join(" · ");
  $("#p-marks").innerHTML = marksHTML(id);
  [old, id].forEach((x) => x && rerender(x));
}
function rerender(id) { const it = ITEMS.find((x) => x.id === id); document.querySelectorAll(`.card[data-id="${id}"]`).forEach((el) => { if (it) el.outerHTML = cardHTML(it); }); }
function step(dir) {
  const ms = LIST.filter(playable);
  if (!ms.length) return;
  const i = ms.findIndex((x) => x.id === PLAY);
  const n = ms[(i + dir + ms.length) % ms.length];
  playAudio(n.id);
  document.querySelector(`[data-id="${n.id}"]`)?.scrollIntoView({ block: "nearest" });
}
audio.addEventListener("timeupdate", () => {
  $("#p-fill").style.width = `${audio.duration ? (audio.currentTime / audio.duration) * 100 : 0}%`;
  $("#p-time").textContent = `${dur(audio.currentTime)} / ${dur(audio.duration || 0)}`;
});
audio.addEventListener("play", () => { $("#p-play").textContent = "❚❚"; PLAY && rerender(PLAY); });
audio.addEventListener("pause", () => { $("#p-play").textContent = "▶"; PLAY && rerender(PLAY); });
audio.addEventListener("ended", () => step(1));
$("#p-play").onclick = () => (audio.paused ? audio.play() : audio.pause());
$("#p-next").onclick = () => step(1);
$("#p-prev").onclick = () => step(-1);
$("#p-close").onclick = () => { audio.pause(); const o = PLAY; PLAY = null; o && rerender(o); $("#player").classList.add("hidden"); };
$("#p-bar").onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); if (audio.duration) audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration; };
$("#p-marks").addEventListener("click", (e) => { const b = e.target.closest("[data-act]"); if (b && PLAY) act(b, PLAY); });

// ---------- viewer & review mode ----------
function openViewer(id, mode = "view") {
  let queue = LIST.length ? LIST : ITEMS;
  if (mode === "review") {
    queue = (LIST.length ? LIST : ITEMS).filter((x) => !mk(x.id).rating && !mk(x.id).hide);
    if (!queue.length) { toast("Nothing unrated in this view"); return; }
  }
  const i = Math.max(0, queue.findIndex((x) => x.id === id));
  audio.pause();
  VIEW = { mode, queue, i, total: queue.length };
  showItem();
}
function stageHTML(it) {
  const src = `/media/${it.id}`;
  if (it.kind === "video") return `<video src="${src}" controls autoplay></video>`;
  if (it.kind === "image" && it.ext !== ".psd" && it.ext !== ".tif" && it.ext !== ".tiff" && it.ext !== ".exr" && it.ext !== ".tga") return `<img src="${src}" alt="">`;
  if (it.kind === "image" && it.thumb) return `<img src="/thumbs/${it.id}.jpg" alt="">`;
  if (it.kind === "audio") return `<div class="audio-stage"><div class="big">${esc(it.label)}</div><div>${esc(pname(it.project) || it.folder)}</div><audio src="${src}" controls autoplay></audio></div>`;
  if (it.ext === ".pdf" || [".txt", ".md", ".svg"].includes(it.ext)) return `<iframe src="${src}" title="${esc(it.label)}"></iframe>`;
  return `<div class="audio-stage"><div class="big">${esc(it.label)}</div><div>No preview for ${esc(it.ext)} files. Open it from the path on the right.</div>${it.thumb ? `<img src="/thumbs/${it.id}.jpg" alt="" style="max-width:100%">` : ""}</div>`;
}
function showItem() {
  const it = VIEW.queue[VIEW.i];
  if (!it) { closeViewer(); toast("Review done for this view"); return; }
  SEL = it.id;
  $("#overlay").innerHTML = `<div class="viewer"><div class="stage">${stageHTML(it)}</div><div class="side" id="side"></div></div>`;
  $("#overlay").classList.remove("hidden");
  sidePanel();
}
function sidePanel() {
  const it = VIEW.queue[VIEW.i], m = mk(it.id);
  $("#side").innerHTML = `${VIEW.mode === "review" ? `<div class="review-head">Reviewing <b>${VIEW.i + 1}</b> of ${VIEW.total} unrated · rating moves on</div>` : ""}
    <div><h2>${esc(it.label)}</h2><div class="sub">${it.project ? `<a href="#project/${esc(it.project)}" data-close>${esc(pname(it.project))}</a> · ` : ""}${esc([KIND_ONE[it.kind] || it.kind, it.year, it.duration ? dur(it.duration) : "", it.width ? `${it.width}×${it.height}` : "", kb(it.size)].filter(Boolean).join(" · "))}</div></div>
    <div class="big-rate">${RATES.map(([v, l, k]) => `<button class="${v} ${m.rating === v ? "on" : ""}" data-act="rate" data-v="${v}">${l}<small>${k}</small></button>`).join("")}</div>
    <div class="row2"><button class="ico fav ${m.fav ? "on" : ""}" data-act="fav" title="Favourite (F)">${m.fav ? "★" : "☆"} <small>F</small></button>
      ${USES.map(([u, l, k]) => `<button class="use ${(m.use || []).includes(u) ? "on" : ""}" data-act="use" data-v="${esc(u)}">${esc(l)} ${k}</button>`).join("")}
      <button class="btn" data-act="hide" style="margin-left:auto">${m.hide ? "Unhide" : "Hide"} <small>H</small></button></div>
    <textarea placeholder="Notes (what's good about it, where to use it…)" data-note>${esc(m.note || "")}</textarea>
    ${it.desc ? `<div class="sub">${esc(it.desc)}</div>` : ""}
    ${(it.tags || []).length ? `<div class="chips">${it.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
    <div class="path">${esc(it.path)}</div>
    <div class="nav"><button class="btn" data-nav="-1">← Prev</button>${VIEW.mode === "review" ? `<button class="btn" data-nav="1">Skip →</button>` : ""}<button class="btn" data-close>Close <small>Esc</small></button><button class="btn" data-nav="1">Next →</button></div>`;
}
function navViewer(d) { VIEW.i = Math.min(Math.max(0, VIEW.i + d), VIEW.queue.length); showItem(); }
function closeViewer() { $("#overlay").classList.add("hidden"); $("#overlay").innerHTML = ""; VIEW = null; route(); }
$("#overlay").addEventListener("click", (e) => {
  if (e.target.id === "overlay") return closeViewer();
  const b = e.target.closest("[data-act]");
  if (b) return act(b, VIEW.queue[VIEW.i].id);
  const n = e.target.closest("[data-nav]");
  if (n) return navViewer(+n.dataset.nav);
  if (e.target.closest("[data-close]")) closeViewer();
});
$("#overlay").addEventListener("change", (e) => { if (e.target.matches("[data-note]")) save(VIEW.queue[VIEW.i].id, "note", e.target.value); });
$("#review-btn").onclick = () => LIB && openViewer(null, "review");

// ---------- actions & events ----------
function act(b, id) {
  const a = b.dataset.act;
  if (a === "rate") { rate(id, b.dataset.v); if (VIEW && VIEW.mode === "review" && mk(id).rating) setTimeout(() => VIEW && navViewer(1), 220); }
  else if (a === "fav") toggle(id, "fav");
  else if (a === "hide") { toggle(id, "hide"); if (VIEW && VIEW.mode === "review") setTimeout(() => VIEW && navViewer(1), 220); }
  else if (a === "use") toggleUse(id, b.dataset.v);
}
function select(id) {
  document.querySelectorAll(".card.sel").forEach((e) => e.classList.remove("sel"));
  SEL = id;
  document.querySelectorAll(`[data-id="${id}"]`).forEach((e) => e.classList.add("sel"));
}
document.addEventListener("click", (e) => {
  const holder = e.target.closest("[data-id]");
  const b = e.target.closest("[data-act]");
  if (holder && b && !$("#overlay").contains(b) && !$("#player").contains(b)) {
    const id = holder.dataset.id;
    select(id);
    const a = b.dataset.act;
    if (a === "play") return playAudio(id);
    if (a === "open") return openViewer(id);
    if (a === "select") return;
    return act(b, id);
  }
  const g = e.target.closest("[data-pid]");
  if (g && b) { e.stopPropagation(); return act(b, g.dataset.pid); }
  const go = e.target.closest("[data-go]");
  if (go && !b) { location.hash = go.dataset.go; return; }
  const set = e.target.closest("[data-set]");
  if (set) { const k = set.dataset.set; F[k] = F[k] === set.dataset.v && set.classList.contains("chip") ? "" : set.dataset.v; persist(); return route(); }
  if (e.target.closest("[data-reset]")) { F = { ...DEFAULT_F, sort: F.sort }; persist(); return route(); }
  const ans = e.target.closest("[data-answer]");
  if (ans) return answer(ans.closest(".qcard"));
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches("[data-tog]")) { F[t.dataset.tog] = t.checked; persist(); route(); }
  if (t.matches("select[data-f]")) { F[t.dataset.f] = t.value; persist(); route(); }
});
document.addEventListener("input", (e) => {
  if (e.target.matches("[data-pfilter]")) {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".glist button").forEach((b) => { b.style.display = b.dataset.name.includes(q) ? "" : "none"; });
  }
});
let qT;
$("#q").addEventListener("input", (e) => { clearTimeout(qT); qT = setTimeout(() => { Q = e.target.value.trim().toLowerCase(); route(); }, 160); });
// hover-scrub through the 4 frames of a video strip
document.addEventListener("mousemove", (e) => {
  const t = e.target.closest(".thumb.strip");
  if (!t) return;
  const r = t.getBoundingClientRect();
  const f = Math.min(3, Math.floor(((e.clientX - r.left) / r.width) * 4));
  t.style.backgroundPosition = `${f * 33.333}% 0`;
});
document.addEventListener("mouseout", (e) => { const t = e.target.closest?.(".thumb.strip"); if (t && !t.contains(e.relatedTarget)) t.style.backgroundPosition = ""; });

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || !LIB) return;
  if (typing()) { if (e.key === "Escape") document.activeElement.blur(); return; }
  const k = e.key.toLowerCase();
  if (VIEW) {
    const id = VIEW.queue[VIEW.i]?.id;
    if (k === "escape") return closeViewer();
    if (k === "arrowright" || k === "j") return navViewer(1);
    if (k === "arrowleft" || k === "k") return navViewer(-1);
    if (k === " ") { e.preventDefault(); const m = $("#overlay video, #overlay audio"); if (m) m.paused ? m.play() : m.pause(); return; }
    return keyAct(k, id, e);
  }
  if (k === "/") { e.preventDefault(); return $("#q").focus(); }
  if (k === "escape") return;
  const ids = LIST.map((x) => x.id);
  if (["j", "k", "arrowdown", "arrowup", "arrowleft", "arrowright"].includes(k)) {
    if (!ids.length) return;
    e.preventDefault();
    let i = ids.indexOf(SEL);
    i = ["j", "arrowdown", "arrowright"].includes(k) ? Math.min(ids.length - 1, i + 1) : Math.max(0, i - 1);
    while (SHOWN <= i && SHOWN < LIST.length && $("#list")) more();
    select(ids[i]);
    document.querySelector(`[data-id="${ids[i]}"]`)?.scrollIntoView({ block: "nearest" });
    return;
  }
  if (!SEL) return;
  const it = ITEMS.find((x) => x.id === SEL);
  if (k === " ") { e.preventDefault(); if (it && playable(it)) playAudio(SEL); else if (it) openViewer(SEL); return; }
  if (k === "enter" || k === "o") return openViewer(SEL);
  keyAct(k, SEL, e);
});
function keyAct(k, id, e) {
  if (!id) return;
  const r = { 1: "great", 2: "good", 3: "mid", 4: "bad" }[k];
  if (r) { e.preventDefault(); return act({ dataset: { act: "rate", v: r } }, id); }
  if (k === "0") return save(id, "rating", null);
  if (k === "f") return act({ dataset: { act: "fav" } }, id);
  if (k === "h") return act({ dataset: { act: "hide" } }, id);
  const u = USES.find((x) => x[2] && x[2].toLowerCase() === k);
  if (u) return act({ dataset: { act: "use", v: u[0] } }, id);
}

boot().catch((e) => { $("#main").innerHTML = `<div class="empty">Couldn't load the library: ${esc(e.message)}</div>`; });
