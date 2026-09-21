/* ── helpers ─────────────────────────────────────── */
const $  = (s, r=document) => r.querySelector(s);
const el = (t, a={}, ...kids) => {
  const n = document.createElement(t);
  for (const [k,v] of Object.entries(a)){
    if (v === false || v == null) continue;
    if (k === "html") n.innerHTML = v;
    else if (k === "text") n.textContent = v;
    else n.setAttribute(k, v === true ? "" : v);
  }
  kids.flat().forEach(c => c && n.append(c));
  return n;
};
const yearOf = v => v.date.slice(0,4);
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const pretty = d => { const [y,m,day] = d.split("-"); return `${MONTHS[+m-1]} ${+day}, ${y}`; };
const byNewest = (a,b) => b.date.localeCompare(a.date);
const byOldest = (a,b) => a.date.localeCompare(b.date);
const years = [...new Set(LIBRARY.videos.map(yearOf))].sort((a,b)=>a-b);
const find = id => LIBRARY.videos.find(v => v.id === id);

/* ── YouTube detection ───────────────────────────────
   Accepts watch?v=, youtu.be/, embed/, and shorts/ links.
   Returns the 11-character video ID, or null if src isn't YouTube. */
function youtubeId(src){
  if (!src) return null;
  try {
    const u = new URL(src, location.href);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1, 12) || null;
    if (host === "youtube.com" || host === "m.youtube.com"){
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(embed|shorts)\/([\w-]{11})/);
      if (m) return m[2];
    }
  } catch { /* not a URL — treat as a local path */ }
  return null;
}
const isYouTube = v => !!youtubeId(v.src);
const ytThumb = id => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

/* ── stored progress (per browser, best effort) ──── */
const store = {
  read(){ try { return JSON.parse(localStorage.getItem("ofv:progress") || "{}"); } catch { return {}; } },
  write(o){ try { localStorage.setItem("ofv:progress", JSON.stringify(o)); } catch {} },
  set(id, pct){ const o = store.read(); if (pct > .02 && pct < .97) o[id] = pct; else delete o[id]; store.write(o); },
  get(id){ return store.read()[id] || 0; }
};
try {
  const t = localStorage.getItem("ofv:theme");
  if (t) document.documentElement.dataset.theme = t;
} catch {}

/* ── procedural stills (stand-ins until posters exist) ── */
const TONES = [
  { sky:["#F7D3AC","#E9A489","#C5777C"], land:"#8E5A62", sun:"#FFE9C9" }, // shoreline dusk
  { sky:["#CFE0C0","#A7C193","#6F8F68"], land:"#4E6B4C", sun:"#F2F6E4" }, // open green
  { sky:["#F2DCC6","#DCB99C","#A97C6D"], land:"#7A5147", sun:"#FFF1DC" }, // indoors, warm lamp
  { sky:["#C6DCE4","#9CC0CE","#6B94A6"], land:"#4B6C7C", sun:"#EAF5F8" }  // water, cool
];
function still(tone = 0, seed = 1){
  const t = TONES[tone % TONES.length];
  const sx = 24 + (seed * 37) % 52;            // sun position, deterministic
  const hz = 58 + (seed * 13) % 10;            // horizon height %
  return `
  <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="s${tone}${seed}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${t.sky[0]}"/><stop offset="55%" stop-color="${t.sky[1]}"/><stop offset="100%" stop-color="${t.sky[2]}"/>
      </linearGradient>
      <radialGradient id="g${tone}${seed}" cx="50%" cy="50%">
        <stop offset="0%" stop-color="${t.sun}" stop-opacity=".95"/><stop offset="100%" stop-color="${t.sun}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="320" height="200" fill="url(#s${tone}${seed})"/>
    <circle cx="${sx*3.2}" cy="${hz*1.6}" r="46" fill="url(#g${tone}${seed})"/>
    <circle cx="${sx*3.2}" cy="${hz*1.6}" r="13" fill="${t.sun}" opacity=".9"/>
    <rect y="${hz*2}" width="320" height="${200-hz*2}" fill="${t.land}" opacity=".92"/>
    <rect y="${hz*2}" width="320" height="${200-hz*2}" fill="${t.sun}" opacity=".09"/>
    <g fill="${t.sun}" opacity=".22">
      <rect x="${sx*3.2-30}" y="${hz*2+9}"  width="60" height="2" rx="1"/>
      <rect x="${sx*3.2-20}" y="${hz*2+20}" width="40" height="2" rx="1"/>
      <rect x="${sx*3.2-36}" y="${hz*2+32}" width="72" height="2" rx="1"/>
    </g>
  </svg>`;
}
function heroArt(){
  return `
  <svg viewBox="0 0 800 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sun setting over the ocean">
    <defs>
      <linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="#9FB4C4"/><stop offset="34%" stop-color="#EBC49B"/>
        <stop offset="62%" stop-color="#E8A98A"/><stop offset="100%" stop-color="#D08A7E"/>
      </linearGradient>
      <linearGradient id="hsea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#B78A85"/><stop offset="100%" stop-color="#6E5560"/>
      </linearGradient>
      <radialGradient id="hglow" cx="50%" cy="50%">
        <stop offset="0%" stop-color="#FFF3DD" stop-opacity="1"/><stop offset="100%" stop-color="#FFE0B4" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="560" fill="url(#hsky)"/>
    <g opacity=".5" fill="#F6E3CE">
      <ellipse cx="180" cy="120" rx="150" ry="16"/><ellipse cx="560" cy="86" rx="190" ry="13"/>
      <ellipse cx="400" cy="172" rx="230" ry="12"/>
    </g>
    <circle cx="430" cy="318" r="150" fill="url(#hglow)"/>
    <circle cx="430" cy="318" r="40" fill="#FFF5E2"/>
    <rect y="330" width="800" height="230" fill="url(#hsea)"/>
    <g fill="#FFEBCF">
      <rect x="392" y="344" width="76" height="5" rx="2.5" opacity=".85"/>
      <rect x="380" y="368" width="100" height="5" rx="2.5" opacity=".6"/>
      <rect x="360" y="396" width="140" height="5" rx="2.5" opacity=".45"/>
      <rect x="336" y="430" width="188" height="5" rx="2.5" opacity=".32"/>
      <rect x="308" y="470" width="244" height="5" rx="2.5" opacity=".22"/>
    </g>
    <path d="M0 512c120-22 240 16 400 8s280-30 400-8v48H0z" fill="#EFD9C4" opacity=".9"/>
  </svg>`;
}
let stillSeed = 0;
const stillFor = v => still(v.tone || 0, (v.id.charCodeAt(0) + v.id.length + (stillSeed++)) % 17 + 1);

/* ── chrome ──────────────────────────────────────── */
$("#brand").textContent = LIBRARY.title;
document.title = LIBRARY.title;

const iconHome = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/></svg>`;
const iconFolder = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h9A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z"/></svg>`;

function buildNav(){
  const nav = $("#nav");
  nav.innerHTML = "";
  nav.append(el("a", { href:"#/", html: iconHome + "<span>Home</span>" }));
  years.forEach(y => {
    const n = LIBRARY.videos.filter(v => yearOf(v) === y).length;
    nav.append(el("a", { href:`#/${y}`, html: iconFolder + `<span>${y}</span><span class="count">${n}</span>` }));
  });
}
function markNav(hash){
  document.querySelectorAll("#nav a, #settingsLink").forEach(a => {
    a.removeAttribute("aria-current");
    if (a.getAttribute("href") === hash) a.setAttribute("aria-current","page");
  });
}
buildNav();

/* menu + scrim */
const rail = $("#rail"), scrim = $("#scrim");
const closeRail = () => { rail.classList.remove("open"); scrim.classList.remove("on"); };
$("#menuBtn").onclick = () => { rail.classList.add("open"); scrim.classList.add("on"); };
scrim.onclick = closeRail;
rail.addEventListener("click", e => { if (e.target.closest("a")) closeRail(); });

/* theme */
$("#themeBtn").onclick = () => {
  const now = document.documentElement.dataset.theme;
  const isDark = now ? now === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const next = isDark ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("ofv:theme", next); } catch {}
};

/* search */
const searchWrap = $("#searchWrap"), searchInput = $("#searchInput");
$("#searchBtn").onclick = () => {
  searchWrap.classList.toggle("on");
  if (searchWrap.classList.contains("on")) searchInput.focus();
  else { searchInput.value = ""; render(); }
};
searchInput.addEventListener("input", render);

/* toast */
let toastTimer;
function toast(msg){
  const t = $("#toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), 2200);
}

/* ── cards ───────────────────────────────────────── */
function card(v){
  const pct = store.get(v.id);
  const thumb = el("div", { class:"thumb" });
  const ytId = youtubeId(v.src);
  const posterSrc = v.poster || (ytId ? ytThumb(ytId) : null);
  thumb.innerHTML = posterSrc
    ? `<img src="${posterSrc}" alt="" loading="lazy">`
    : stillFor(v);
  thumb.append(el("span", { class:"dur", html:
    `<svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><path d="M1 0.5 9 5 1 9.5z"/></svg><span>${v.duration || "—"}</span>` }));
  if (pct) thumb.append(el("span", { class:"resume" }, el("i", { style:`width:${Math.round(pct*100)}%` })));

  return el("a", { class:"card", href:`#/watch/${v.id}` },
    thumb,
    el("h4", { text: v.title }),
    el("time", { datetime: v.date, text: pretty(v.date) })
  );
}

/* ── views ───────────────────────────────────────── */
function viewHome(){
  setHead(LIBRARY.title, "", false);
  const hero = el("div", { class:"hero" });
  const heroSrc = "posters/hero.jpeg";           // ← put your own image at this path
  hero.innerHTML = `<img src="${heroSrc}" alt="" loading="eager">`;
  hero.querySelector("img").onerror = () => {
    console.warn(`Hero image failed to load from "${heroSrc}". Check the file exists at that path, the name/extension match exactly (case-sensitive), and Live Server is running from the project's root folder.`);
    hero.innerHTML = heroArt();
  };

  const chips = el("div", { class:"years" });
  years.forEach(y => {
    const n = LIBRARY.videos.filter(v => yearOf(v) === y).length;
    chips.append(el("a", { class:"yearchip", href:`#/${y}` },
      el("b", { text:y }),
      el("span", { text: `${n} ${n === 1 ? "video" : "videos"}` })
    ));
  });

  return [
    el("section", { class:"home" },
      el("div", {},
        el("h2", { text:"Welcome to Our Family Videos" }),
        el("p", { text: LIBRARY.intro })
      ),
      hero
    ),
    el("section", { class:"yearstrip" },
      el("h3", { text:"Choose a year" }),
      chips
    )
  ];
}

function viewYear(year){
  const list = LIBRARY.videos.filter(v => yearOf(v) === year).sort(byOldest);
  const n = list.length;
  setHead(year, `${n} ${n === 1 ? "video" : "videos"}`, true);
  if (!n) return el("div", { class:"empty" }, el("b", { text:"Nothing here yet" }),
    "Add a video with this year's date to the library list and it will appear here.");
  const grid = el("div", { class:"grid" });
  list.forEach(v => grid.append(card(v)));
  return grid;
}

function viewSearch(q){
  const term = q.toLowerCase();
  const list = LIBRARY.videos.filter(v =>
    (v.title + " " + v.date + " " + (v.note || "")).toLowerCase().includes(term)
  ).sort(byNewest);
  setHead("Search", `${list.length} ${list.length === 1 ? "match" : "matches"} for “${q}”`, true);
  if (!list.length) return el("div", { class:"empty" },
    el("b", { text:"No matches" }), "Try a different title, year, or word from a note.");
  const grid = el("div", { class:"grid" });
  list.forEach(v => grid.append(card(v)));
  return grid;
}

function viewSettings(){
  setHead("Settings", "Where things live and how to add more", true);
  const total = LIBRARY.videos.length;
  const withFiles = LIBRARY.videos.filter(v => v.src).length;
  const wrap = el("div", { style:"max-width:60ch" });
  wrap.innerHTML = `
    <p style="margin:6px 0 22px;color:var(--ink-soft)">
      ${total} videos across ${years.length} years. ${withFiles} of them have a file attached.
    </p>
    <h3 style="font-family:Newsreader,Georgia,serif;font-weight:500;font-size:18px;margin:0 0 8px">Adding a video</h3>
    <p style="margin:0 0 20px;color:var(--ink-soft)">
      Open this page's source and find the <code>LIBRARY</code> list near the bottom. Add an entry with a title,
      a date like <code>2025-06-14</code>, and the path to your file. The year folder is created from the date,
      so you never have to file anything by hand.
    </p>
    <h3 style="font-family:Newsreader,Georgia,serif;font-weight:500;font-size:18px;margin:0 0 8px">Where to keep the files</h3>
    <p style="margin:0 0 20px;color:var(--ink-soft)">
      Home video files are large, so keep them out of the page itself. Put the MP4s in a folder next to this file,
      or on a storage bucket, and point <code>src</code> at them. Use H.264 MP4 so every phone and browser can play it.
    </p>
    <h3 style="font-family:Newsreader,Georgia,serif;font-weight:500;font-size:18px;margin:0 0 8px">Watch history</h3>
    <p style="margin:0 0 14px;color:var(--ink-soft)">
      This browser remembers where you stopped in each video. Nothing leaves your device.
    </p>
  `;
  const clear = el("button", { class:"act", type:"button" }, "Clear watch history");
  clear.onclick = () => { store.write({}); toast("Watch history cleared"); };
  wrap.append(clear);
  return wrap;
}

/* ── player ──────────────────────────────────────── */
function viewWatch(id){
  const v = find(id);
  if (!v){ setHead("Not found", "", true); return el("div", { class:"empty" },
    el("b", { text:"That video isn't in the library" }), "It may have been renamed. Pick a year from the sidebar to browse."); }

  setHead(v.title, pretty(v.date), true);

  const ytId = youtubeId(v.src);
  const frame = ytId ? buildYouTubeFrame(ytId) : buildLocalFrame(v);
  return assemblePlayer(v, frame);
}

/* YouTube plays through an iframe — YouTube's own player supplies
   play/pause, scrub, volume, captions and fullscreen, so none of the
   custom controls below apply to it. */
function buildYouTubeFrame(ytId){
  const frame = el("div", { class:"frame" });
  const iframe = el("iframe", {
    src: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`,
    title: "YouTube video player",
    frameborder: "0",
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    referrerpolicy: "strict-origin-when-cross-origin",
    allowfullscreen: true,
    style: "position:absolute; inset:0; width:100%; height:100%; border:0;"
  });
  frame.append(iframe);
  return frame;
}

function buildLocalFrame(v){
  const frame = el("div", { class:"frame" });
  const video = el("video", { playsinline:true, preload:"metadata", poster: v.poster || false });
  if (v.src) video.src = v.src;
  frame.append(video);

  if (!v.src){
    const ph = el("div", { class:"placeholder" });
    ph.innerHTML = stillFor(v);
    frame.append(ph);
  }

  /* controls */
  const playBtn = el("button", { type:"button", "aria-label":"Play" });
  const ICON_PLAY  = `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.5 14 8 3 14.5z"/></svg>`;
  const ICON_PAUSE = `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3.6" height="12" rx="1"/><rect x="9.4" y="2" width="3.6" height="12" rx="1"/></svg>`;
  playBtn.innerHTML = ICON_PLAY;

  const clock = el("span", { class:"clock", text:"0:00 / 0:00" });
  const scrub = el("input", { class:"scrub", type:"range", min:"0", max:"1000", value:"0", "aria-label":"Seek" });
  const muteBtn = el("button", { type:"button", "aria-label":"Mute", html:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>` });
  const vol = el("input", { class:"vol", type:"range", min:"0", max:"1", step:"0.05", value:"1", "aria-label":"Volume" });
  const fsBtn = el("button", { type:"button", "aria-label":"Fullscreen", html:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>` });

  const controls = el("div", { class:"controls" }, playBtn, clock, scrub, muteBtn, vol, fsBtn);
  frame.append(controls);

  const fmt = s => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2,"0")}`;
  };
  const sync = () => {
    clock.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration || 0)}`;
    if (video.duration) scrub.value = String((video.currentTime / video.duration) * 1000);
  };

  video.addEventListener("loadedmetadata", () => {
    sync();
    const pct = store.get(v.id);
    if (pct && video.duration) video.currentTime = pct * video.duration;
  });
  video.addEventListener("timeupdate", () => {
    sync();
    if (video.duration) store.set(v.id, video.currentTime / video.duration);
  });
  video.addEventListener("play",  () => { playBtn.innerHTML = ICON_PAUSE; playBtn.setAttribute("aria-label","Pause"); });
  video.addEventListener("pause", () => { playBtn.innerHTML = ICON_PLAY;  playBtn.setAttribute("aria-label","Play"); });
  video.addEventListener("ended", () => store.set(v.id, 1));
  video.addEventListener("error", () => {
    if (video.src) showVeil(`This file didn't load. Check that the path in the library still points to it.`, true);
  });

  const toggle = () => { if (video.src) video.paused ? video.play() : video.pause(); };
  playBtn.onclick = toggle;
  video.addEventListener("click", toggle);
  scrub.addEventListener("input", () => { if (video.duration) video.currentTime = (scrub.value/1000) * video.duration; });
  muteBtn.onclick = () => { video.muted = !video.muted; muteBtn.style.opacity = video.muted ? ".5" : "1"; };
  vol.addEventListener("input", () => { video.volume = +vol.value; video.muted = false; muteBtn.style.opacity = "1"; });
  fsBtn.onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else (frame.requestFullscreen || frame.webkitRequestFullscreen).call(frame);
  };

  /* keyboard */
  const keys = e => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === " " || e.key.toLowerCase() === "k"){ e.preventDefault(); toggle(); }
    if (e.key.toLowerCase() === "f"){ e.preventDefault(); fsBtn.click(); }
    if (e.key === "ArrowRight") video.currentTime += 5;
    if (e.key === "ArrowLeft")  video.currentTime -= 5;
  };
  document.addEventListener("keydown", keys);
  cleanups.push(() => document.removeEventListener("keydown", keys));

  /* veil for the no-file state */
  let veil;
  function showVeil(message, isError){
    veil?.remove();
    const pick = el("input", { type:"file", accept:"video/*", style:"display:none" });
    const btn = el("button", { class:"ghostbtn", type:"button", text:"Choose a file to preview" });
    btn.onclick = () => pick.click();
    pick.onchange = () => {
      const f = pick.files?.[0];
      if (!f) return;
      video.src = URL.createObjectURL(f);
      veil.remove();
      frame.querySelector(".placeholder")?.remove();
      video.play();
      toast("Previewing " + f.name + " — add its path to the library to keep it");
    };
    veil = el("div", { class:"veil" }, el("p", { text: message }), btn, pick);
    frame.append(veil);
  }
  if (!v.src) showVeil("No file is linked to this memory yet. Point its src at your video file, or try one from this device.");

  return frame;
}

/* meta, share/download, and "more from this year" — shared by both frame types */
function assemblePlayer(v, frame){
  const shareBtn = el("button", { class:"act", type:"button", html:
    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 15V3M8 7l4-4 4 4"/></svg><span>Share</span>` });
  shareBtn.onclick = async () => {
    const url = location.href;
    if (navigator.share){ try { await navigator.share({ title: v.title, url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); toast("Link copied"); }
    catch { toast("Copy this page's address to share it"); }
  };

  const ytId = youtubeId(v.src);
  const dl = ytId
    ? el("a", { class:"act", href:`https://www.youtube.com/watch?v=${ytId}`, target:"_blank", rel:"noopener", html:
        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg><span>Open on YouTube</span>` })
    : v.src
    ? el("a", { class:"act", href: v.src, download:"", html:
        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/><path d="M12 3v12M8 11l4 4 4-4"/></svg><span>Download</span>` })
    : el("button", { class:"act", type:"button", disabled:true, html:
        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/><path d="M12 3v12M8 11l4 4 4-4"/></svg><span>Download</span>` });

  const meta = el("div", { class:"meta" },
    el("div", {},
      el("h2", { text: v.title }),
      el("div", { class:"when", html:
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg><span>${pretty(v.date)}</span>` })
    ),
    el("div", { class:"acts" }, shareBtn, dl)
  );

  const out = el("div", { class:"player" }, frame, meta);
  if (v.note) out.append(el("p", { class:"note", text: v.note }));

  return out;
}

/* ── router ──────────────────────────────────────── */
let cleanups = [];
function setHead(title, sub, showBack){
  $("#pageTitle").textContent = title;
  $("#pageSub").textContent = sub || "";
  $("#backBtn").hidden = !showBack;
}
$("#backBtn").onclick = () => history.length > 1 ? history.back() : (location.hash = "#/");

function render(){
  cleanups.forEach(fn => fn()); cleanups = [];
  const view = $("#view");
  view.innerHTML = "";
  stillSeed = 0;

  const q = searchWrap.classList.contains("on") ? searchInput.value.trim() : "";
  const hash = location.hash || "#/";
  let body;

  if (q) body = viewSearch(q);
  else if (hash === "#/settings") body = viewSettings();
  else if (hash.startsWith("#/watch/")) body = viewWatch(decodeURIComponent(hash.slice(8)));
  else if (/^#\/\d{4}$/.test(hash)) body = viewYear(hash.slice(2));
  else body = viewHome();

  [body].flat().forEach(n => view.append(n));
  markNav(q ? "" : (hash.startsWith("#/watch/") ? `#/${yearOf(find(hash.slice(8)) || { date:"0000-" })}` : hash));
  $("#stage").scrollTop = 0;
}
addEventListener("hashchange", () => {
  if (searchInput.value){ searchInput.value = ""; searchWrap.classList.remove("on"); }
  render();
});
render();