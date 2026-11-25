// Tracky account on the web: the app's own data, read with the driver's sign-in. Same Supabase
// project and the same requests as the app (Sources/TelemetryCore/AccountRequests.swift, PaddockRequests,
// AccountSync); Row Level Security decides what a signed-in driver may read or change, and the
// publishable key in config.js is public by design. Sessions are read from the driver's own synced
// files (Tracky Pro) through the media worker; nothing here is made up or estimated.
(function () {
  "use strict";
  var C = window.TRACKY_ACCOUNTS || {};
  var MEDIA = "https://tracky-media.plain-rain-f6db.workers.dev";
  var POLICY_VERSION = "2026-11-16";
  var SHORTEST_PASSWORD = 12;
  var HERE = location.origin + location.pathname;
  var KEY = "tracky.session", ME = "tracky.me", CACHE = "tracky.sessions.v1";
  var CONSENTS = [
    ["sync", "Keep sessions on all my devices", "Your recordings are stored with your account so they appear on your other devices and here.", true],
    ["heart_rate", "Heart rate in synced sessions", "Asked separately because heart rate is health data. Never sold or used for ads.", false],
    ["anon_stats", "Anonymous statistics", "Your laps may be part of statistics about circuits and cars that never identify you.", true],
    ["ads_personalised", "Personalised advertising", "Without this, any advertising is chosen by the track you look at, not by you.", false]
  ];

  var $ = function (id) { return document.getElementById(id); };
  var session = load(), me = null, data = { sessions: [], files: [], cars: [], shared: [], posts: [], pro: null };

  // ---------------------------------------------------------------- storage
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
  function save(s) {
    session = s;
    try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else { localStorage.removeItem(KEY); localStorage.removeItem(ME); } } catch (e) {}
    if (window.trackyChip) window.trackyChip();
  }
  function cacheGet() { try { return JSON.parse(localStorage.getItem(CACHE)) || {}; } catch (e) { return {}; } }
  function cachePut(c) { try { localStorage.setItem(CACHE, JSON.stringify(c)); } catch (e) { /* full: skip */ } }

  // ---------------------------------------------------------------- requests
  async function call(path, opt) {
    opt = opt || {};
    if (opt.auth) await fresh();
    var url = new URL(path, C.url.replace(/\/?$/, "/"));
    Object.keys(opt.query || {}).sort().forEach(function (k) { url.searchParams.set(k, opt.query[k]); });
    var headers = { apikey: C.key };
    if (opt.auth && session) headers.Authorization = "Bearer " + session.access_token;
    if (opt.body !== undefined) headers["Content-Type"] = "application/json";
    if (opt.prefer) headers.Prefer = opt.prefer;
    var res = await fetch(url, { method: opt.method || "GET", headers: headers, body: opt.body === undefined ? undefined : JSON.stringify(opt.body) });
    var text = await res.text(), out = null;
    try { out = text ? JSON.parse(text) : null; } catch (e) { out = text; }
    if (!res.ok) throw new Error(problem(res.status, out));
    return out;
  }
  function rpc(name, body) { return call("rest/v1/rpc/" + name, { method: "POST", auth: true, body: body || {} }); }
  function problem(status, d) {
    var raw = (d && (d.msg || d.error_description || d.message || d.error)) || "";
    if (/invalid login/i.test(raw)) return "That email and password don't match an account.";
    if (/not confirmed/i.test(raw)) return "Please confirm your email first: open the link we sent you.";
    if (/already registered|already exists/i.test(raw)) return "There is already an account with that email. Sign in instead.";
    if (/rate limit|too many/i.test(raw) || status === 429) return "Too many tries. Please wait a minute and try again.";
    if (/weak|pwned|leaked/i.test(raw)) return "Please choose a stronger password that hasn't appeared in a data breach.";
    if (status === 401) return "Your sign-in has expired. Please sign in again.";
    return raw || "Something went wrong (" + status + "). Please try again.";
  }
  function keep(t) {
    save({ access_token: t.access_token, refresh_token: t.refresh_token,
      expires_at: t.expires_at || Math.floor(Date.now() / 1000) + Number(t.expires_in || 3600),
      user: t.user || (session && session.user) || null });
  }
  async function fresh() {
    if (!session) throw new Error("Please sign in.");
    if (Date.now() / 1000 < session.expires_at - 60) return;
    try { keep(await call("auth/v1/token", { method: "POST", query: { grant_type: "refresh_token" }, body: { refresh_token: session.refresh_token } })); }
    catch (e) { save(null); show(); throw new Error("Your sign-in has expired. Please sign in again."); }
  }
  function mediaURL(key) { return MEDIA + "/m/" + String(key).split("/").map(encodeURIComponent).join("/"); }
  async function media(key, range) {
    await fresh();
    var h = { Authorization: "Bearer " + session.access_token };
    if (range) h.Range = "bytes=0-" + (range - 1);
    var r = await fetch(mediaURL(key), { headers: h });
    if (!r.ok && r.status !== 206) throw new Error("File " + r.status);
    return r.arrayBuffer();
  }

  // ---------------------------------------------------------------- formatting
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function lap(ms) {
    if (ms == null || !isFinite(ms)) return "–";
    var s = ms / 1000, m = Math.floor(s / 60), r = s - m * 60;
    return (m ? m + ":" + (r < 10 ? "0" : "") : "") + r.toFixed(3);
  }
  function gap(ms) { return (ms > 0 ? "+" : ms < 0 ? "−" : "") + Math.abs(ms / 1000).toFixed(3); }
  function day(ms, withTime) {
    if (!ms) return "";
    var d = new Date(ms), o = { day: "numeric", month: "short", year: "numeric" };
    if (withTime) { o.hour = "2-digit"; o.minute = "2-digit"; }
    return d.toLocaleString("en-GB", o);
  }
  function month(ms) { return new Date(ms).toLocaleString("en-GB", { month: "long", year: "numeric" }); }
  function km(m) { return m == null ? "–" : (m / 1000).toLocaleString("en-GB", { maximumFractionDigits: m < 100000 ? 1 : 0 }); }
  function hours(ms) { var h = ms / 3600000; return h < 1 ? Math.round(ms / 60000) + " min" : h.toLocaleString("en-GB", { maximumFractionDigits: 1 }) + " h"; }
  function kmh(mps) { return mps == null ? "–" : Math.round(mps * 3.6) + " km/h"; }
  function initials(name, email) {
    var w = (name || email || "?").trim().split(/\s+/);
    return (((w[0] || "")[0] || "") + ((w[1] || "")[0] || "")).toUpperCase();
  }
  function avatar(box, photoKey, name) {
    box.textContent = "";
    if (photoKey) { var i = new Image(); i.alt = ""; i.src = mediaURL(photoKey); i.onerror = function () { box.textContent = initials(name); }; box.appendChild(i); }
    else box.textContent = initials(name, session && session.user && session.user.email);
  }
  // A track's shape from the app's outline (x east, y north, metres around the middle).
  function outline(points, cls) {
    var ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "shape " + (cls || "")); svg.setAttribute("aria-hidden", "true");
    if (!points || points.length < 6) { svg.setAttribute("viewBox", "0 0 10 10"); return svg; }
    var xs = [], ys = [];
    for (var i = 0; i + 1 < points.length; i += 2) { xs.push(points[i]); ys.push(-points[i + 1]); }
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var w = Math.max(x1 - x0, 1), h = Math.max(y1 - y0, 1), pad = Math.max(w, h) * 0.08;
    svg.setAttribute("viewBox", [x0 - pad, y0 - pad, w + 2 * pad, h + 2 * pad].map(function (v) { return v.toFixed(1); }).join(" "));
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M" + xs.map(function (x, k) { return x.toFixed(1) + " " + ys[k].toFixed(1); }).join(" L") + " Z");
    p.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(p);
    return svg;
  }
  function say(text, bad) {
    var n = $("notice"); n.textContent = text || ""; n.className = "notice" + (bad ? " bad" : ""); n.hidden = !text;
    if (text) n.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function busy(form, on) { form.querySelectorAll("button, input").forEach(function (x) { x.disabled = on; }); }

  // ---------------------------------------------------------------- views
  var VIEWS = ["profile", "sessions", "session", "bests", "sharing", "cars", "settings"];
  function route() {
    if (!session) return;
    var h = location.hash.replace(/^#/, ""), view = h.split("/")[0] || "profile";
    if (VIEWS.indexOf(view) < 0) view = "profile";
    document.querySelectorAll("[data-view]").forEach(function (s) { s.hidden = s.dataset.view !== view; });
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      var on = a.dataset.nav === view || (view === "session" && a.dataset.nav === "sessions");
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (view === "session") drawOne(decodeURIComponent(h.slice(8)));
    window.scrollTo({ top: 0 });
  }
  window.addEventListener("hashchange", route);

  function show(view) {
    var v = view || (session ? "in" : "out");
    $("signed-out").hidden = v !== "out";
    $("signed-in").hidden = v !== "in";
    $("new-password").hidden = v !== "password";
    document.body.classList.toggle("acc-signed-in", v === "in");
    if (v === "in") { route(); fill().catch(function (e) { say(e.message, true); }); }
  }

  // ---------------------------------------------------------------- loading
  async function fill() {
    var uid = session.user && session.user.id;
    if (!uid) { session.user = await call("auth/v1/user", { auth: true }); save(session); uid = session.user.id; }
    var got = await Promise.all([
      call("rest/v1/profiles", { auth: true, query: { select: "*", id: "eq." + uid } }),
      call("rest/v1/cars", { auth: true, query: { select: "*", order: "created_at.asc" } }).catch(function () { return []; }),
      call("rest/v1/my_consents", { auth: true, query: { select: "kind,granted" } }).catch(function () { return []; }),
      call("rest/v1/synced_files", { auth: true, query: { select: "name,media_key,bytes,modified_at", order: "modified_at.desc" } }).catch(function () { return []; }),
      call("rest/v1/shared_sessions", { auth: true, query: { select: "*", owner: "eq." + uid, order: "created_at.desc" } }).catch(function () { return []; }),
      rpc("my_pro").catch(function () { return null; })
    ]);
    me = (got[0] && got[0][0]) || { id: uid, driver_name: "" };
    data.cars = got[1] || []; data.files = (got[3] || []).filter(function (f) { return /\.tracky$/i.test(f.name); });
    data.shared = got[4] || []; data.pro = got[5];
    try {
      localStorage.setItem(ME, JSON.stringify({ username: me.username || null, initials: initials(me.driver_name, session.user.email),
        photo: me.photo_key ? mediaURL(me.photo_key) : null }));
    } catch (e) {}
    if (window.trackyChip) window.trackyChip();
    drawProfile(); drawCars(); drawConsents(got[2] || []); drawSettings(); drawSharing();
    if (me.username) {
      Promise.all([
        rpc("driver_profile", { p_username: me.username }).catch(function () { return []; }),
        rpc("paddock_posts", { p_mode: "author", p_key: me.username, p_limit: 60, p_offset: 0 }).catch(function () { return []; })
      ]).then(function (r) { drawCounts((r[0] || [])[0]); data.posts = r[1] || []; drawPosts(); });
    } else { drawCounts(null); drawPosts(); }
    await loadSessions();
  }

  // Sessions: each synced file's header, read from the first part of the file and kept in this
  // browser by name and date, so a visit after the first downloads only what changed.
  async function loadSessions() {
    var cache = cacheGet(), uid = session.user.id, mine = cache[uid] || {}, next = {};
    var todo = [];
    data.files.forEach(function (f) {
      var k = f.name + "@" + f.modified_at;
      if (mine[k]) { next[k] = mine[k]; } else todo.push(f);
    });
    function collect() {
      data.sessions = Object.keys(next).map(function (k) { return next[k]; }).filter(Boolean)
        .sort(function (a, b) { return (b.startedAt || 0) - (a.startedAt || 0); });
      drawSessions(); drawStats(); drawBests(); drawRecent();
      if (location.hash.indexOf("#session/") === 0) drawOne(decodeURIComponent(location.hash.slice(9)));
    }
    collect();
    $("sync-line").textContent = todo.length ? "Reading " + todo.length + " session" + (todo.length === 1 ? "" : "s") + "…" : syncLine();
    var queue = todo.slice(), failed = 0;
    async function worker() {
      while (queue.length) {
        var f = queue.shift(), k = f.name + "@" + f.modified_at;
        try {
          var h = await window.TrackyFile.header(await media(f.media_key, 393216));
          if (!h) h = await window.TrackyFile.header(await media(f.media_key));
          var s = window.TrackyFile.describe(h); s.file = f.name; s.bytes = f.bytes; s.key = k;
          next[k] = s;
        } catch (e) { failed++; }
        $("sync-line").textContent = queue.length ? "Reading " + queue.length + " more…" : syncLine();
        collect();
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    cache[uid] = next; cachePut(cache);
    $("sync-line").textContent = syncLine() + (failed ? " " + failed + " could not be read." : "");
  }
  function syncLine() {
    var n = data.sessions.length;
    if (!data.files.length) return data.pro ? "No sessions synced yet." : "Sessions stay on your iPhone.";
    return n + " session" + (n === 1 ? "" : "s") + " from Tracky Cloud.";
  }

  // ---------------------------------------------------------------- profile
  function drawProfile() {
    var name = me.driver_name || "No driver name yet";
    $("p-name").textContent = name; $("side-name").textContent = name;
    $("p-user").textContent = me.username ? "@" + me.username : "No username yet";
    $("side-user").textContent = me.username ? "@" + me.username : session.user.email;
    avatar($("p-av"), me.photo_key, me.driver_name); avatar($("side-av"), me.photo_key, me.driver_name);
    $("p-pro").hidden = !(me.is_pro || data.pro);
    $("p-ver").hidden = !me.verified;
    $("p-priv").hidden = !me.is_private;
    $("p-bio").textContent = me.bio || ""; $("p-bio").hidden = !me.bio;
    var shown = data.cars.find(function (c) { return c.show_on_card; });
    var car = me.car_name || (shown && shown.name) || "";
    $("p-car").textContent = car; $("p-car").hidden = !car;
    var links = $("p-links"); links.textContent = "";
    Object.keys(me.links || {}).forEach(function (k) {
      var v = me.links[k]; if (!v || typeof v !== "string") return;
      var a = el("a", null, k.charAt(0).toUpperCase() + k.slice(1)); a.href = /^https?:/.test(v) ? v : "https://" + v; a.rel = "noopener"; a.target = "_blank";
      links.appendChild(a);
    });
    links.hidden = !links.childNodes.length;
    $("n-cars").textContent = data.cars.length || "";
  }
  function drawCounts(p) {
    $("c-posts").textContent = p ? p.posts : (me.username ? "0" : "–");
    $("c-followers").textContent = p ? p.followers : "–";
    $("c-following").textContent = p ? p.following : "–";
  }
  function drawPosts() {
    var box = $("posts"); box.textContent = "";
    if (!me.username) { box.appendChild(el("p", "empty", "Choose a username in the app (You › Edit profile) to post in the Paddock.")); return; }
    if (!data.posts.length) { box.appendChild(el("p", "empty", "No posts yet. Share a lap or a photo from the Paddock in the app.")); return; }
    data.posts.forEach(function (p) {
      var tile = el("figure", "post"), m = (p.media || [])[0];
      if (m && m.kind !== "video") { var i = new Image(); i.loading = "lazy"; i.alt = p.caption || "Post"; i.src = mediaURL(m.key); tile.appendChild(i); }
      else if (m) { tile.classList.add("video"); tile.appendChild(el("span", "play", "Video")); }
      else if (p.lap) {
        tile.classList.add("lapcard");
        tile.appendChild(el("b", null, lap(p.lap.lapMs || p.lap.bestLapMs)));
        tile.appendChild(el("span", null, [p.lap.track, p.lap.car].filter(Boolean).join(", ")));
      } else { tile.classList.add("text"); tile.appendChild(el("span", null, p.caption)); }
      var cap = el("figcaption");
      cap.appendChild(el("span", "likes", p.likes + " ♥"));
      if (p.comments) cap.appendChild(el("span", null, p.comments + " comments"));
      if (p.venue_name) cap.appendChild(el("span", null, p.venue_name));
      tile.appendChild(cap);
      tile.title = (p.caption || "") + " · " + day(Date.parse(p.created_at));
      box.appendChild(tile);
    });
  }

  // Totals and achievements: counted from the synced sessions, nothing estimated.
  function totals() {
    var t = { sessions: data.sessions.length, laps: 0, distance: 0, time: 0, tracks: {}, cars: {}, top: 0, days: {} };
    data.sessions.forEach(function (s) {
      t.laps += s.laps.filter(function (l) { return !l.invalid; }).length;
      if (s.distanceM) t.distance += s.distanceM;
      if (s.durationMs) t.time += s.durationMs;
      if (s.track) t.tracks[s.track] = 1;
      if (s.car) t.cars[s.car] = 1;
      if (s.topSpeedMps && s.topSpeedMps > t.top) t.top = s.topSpeedMps;
      if (s.startedAt) t.days[new Date(s.startedAt).toDateString()] = 1;
    });
    t.trackCount = Object.keys(t.tracks).length; t.carCount = Object.keys(t.cars).length; t.dayCount = Object.keys(t.days).length;
    return t;
  }
  function drawStats() {
    var t = totals(), ul = $("stats"); ul.textContent = "";
    var items = [[t.sessions, "sessions"], [t.laps.toLocaleString("en-GB"), "timed laps"], [km(t.distance), "km driven"],
      [t.time ? hours(t.time) : "–", "on track"], [t.trackCount, t.trackCount === 1 ? "track" : "tracks"], [t.top ? String(Math.round(t.top * 3.6)) : "–", "km/h top speed"]];
    items.forEach(function (it) { var li = el("li"); li.appendChild(el("b", "fig", String(it[0]))); li.appendChild(el("span", null, it[1])); ul.appendChild(li); });
    $("stats-note").textContent = noSessionsText();
    $("n-sessions").textContent = t.sessions || ""; $("n-tracks").textContent = t.trackCount || "";
    drawAchievements(t);
  }
  function noSessionsText() {
    if (data.sessions.length) return "From " + data.sessions.length + " session" + (data.sessions.length === 1 ? "" : "s") + " in Tracky Cloud. Sessions kept only on your iPhone are not counted.";
    if (!data.files.length && !(me && me.is_pro) && !data.pro) return "Your sessions are kept on your iPhone. With Tracky Pro they are kept in your account too, and appear here.";
    if (!data.files.length) return "Nothing synced yet. Open Tracky on your iPhone while signed in to this account: sessions go up by themselves.";
    return "";
  }
  function pbCount() {
    // Times a session set a new best lap at its track (in date order).
    var best = {}, n = 0;
    data.sessions.slice().sort(function (a, b) { return (a.startedAt || 0) - (b.startedAt || 0); }).forEach(function (s) {
      if (!s.track || !s.bestMs) return;
      if (best[s.track] == null || s.bestMs < best[s.track]) { if (best[s.track] != null) n++; best[s.track] = s.bestMs; }
    });
    return n;
  }
  // Achievements: ladders that move with the driver. Each card shows the level reached and the next
  // target, worked out from the synced sessions (the app's own laps and sectors); nothing estimated.
  function ladder(value, tiers, lowerIsBetter) {
    var reached = tiers.filter(function (x) { return lowerIsBetter ? value != null && value <= x : value >= x; });
    var next = tiers.find(function (x) { return lowerIsBetter ? value == null || value > x : value < x; });
    var prev = reached.length ? reached[reached.length - 1] : null;
    var p = 0;
    if (next == null) p = 1;
    else if (lowerIsBetter) { var from = prev == null ? Math.max(next * 2, value || 0) : prev; p = value == null ? 0 : (from - value) / (from - next); }
    else { var base = prev || 0; p = (value - base) / (next - base); }
    return { level: reached.length, of: tiers.length, next: next, p: Math.max(0, Math.min(1, p)) };
  }
  function sec(ms) { return (ms / 1000).toFixed(ms < 1000 ? 3 : 2) + " s"; }
  function byDate() { return data.sessions.slice().sort(function (a, b) { return (a.startedAt || 0) - (b.startedAt || 0); }); }
  function validLaps(s) { return s.laps.filter(function (l) { return !l.invalid && l.ms > 0; }).sort(function (a, b) { return a.number - b.number; }); }
  function pbCount() {
    // Times a session set a new best lap at its track (in date order).
    var best = {}, n = 0;
    byDate().forEach(function (s) {
      if (!s.track || !s.bestMs) return;
      if (best[s.track] == null || s.bestMs < best[s.track]) { if (best[s.track] != null) n++; best[s.track] = s.bestMs; }
    });
    return n;
  }
  // The next whole second below the best lap at each track; the closest one is the target.
  function barriers() {
    var best = {}, broken = 0;
    byDate().forEach(function (s) {
      if (!s.track || !s.bestMs) return;
      var old = best[s.track];
      if (old == null || s.bestMs < old) {
        if (old != null && Math.floor(s.bestMs / 1000) < Math.floor(old / 1000)) broken++;
        best[s.track] = s.bestMs;
      }
    });
    var target = null;
    Object.keys(best).forEach(function (track) {
      var b = best[track], line = Math.ceil(b / 1000) * 1000 - 1000;
      if (line === b) line -= 1000;
      var gapMs = b - line;
      if (!target || gapMs < target.gap) target = { track: track, best: b, line: line, gap: gapMs };
    });
    return { broken: broken, target: target };
  }
  // Tightest run of three laps in a row (max minus min), across all sessions.
  function consistency() {
    var bestRun = null;
    data.sessions.forEach(function (s) {
      var v = validLaps(s);
      for (var i = 0; i + 2 < v.length; i++) {
        if (v[i + 1].number !== v[i].number + 1 || v[i + 2].number !== v[i].number + 2) continue;
        var t = [v[i].ms, v[i + 1].ms, v[i + 2].ms], spread = Math.max.apply(null, t) - Math.min.apply(null, t);
        if (!bestRun || spread < bestRun.spread) bestRun = { spread: spread, s: s };
      }
    });
    return bestRun;
  }
  // How close a session's best lap came to its best sectors put together.
  function idealGap() {
    var out = null;
    data.sessions.forEach(function (s) {
      var v = validLaps(s).filter(function (l) { return l.sectors && l.sectors.length; });
      if (v.length < 2 || !s.bestMs) return;
      var n = v[0].sectors.length, ideal = 0;
      for (var k = 0; k < n; k++) {
        var m = Math.min.apply(null, v.map(function (l) { return l.sectors[k] == null ? Infinity : l.sectors[k]; }));
        if (!isFinite(m)) return; ideal += m;
      }
      var g = s.bestMs - ideal;
      if (g >= 0 && (!out || g < out.gap)) out = { gap: g, s: s };
    });
    return out;
  }
  function drawAchievements(t) {
    var km1 = Math.floor(t.distance / 1000), bar = barriers(), run = consistency(), ideal = idealGap(), pbs = pbCount();
    function where(s) { return [s.track, day(s.startedAt)].filter(Boolean).join(", "); }
    var cards = [];
    var L = ladder(t.laps, [10, 50, 100, 250, 500, 1000, 2500, 5000]);
    cards.push(["Lap counter", t.laps.toLocaleString("en-GB") + " timed laps", L, L.next ? "Next: " + L.next.toLocaleString("en-GB") + " laps" : "Top level"]);
    var D = ladder(km1, [100, 250, 500, 1000, 2500, 5000, 10000]);
    cards.push(["Distance", km1.toLocaleString("en-GB") + " km on track", D, D.next ? "Next: " + D.next.toLocaleString("en-GB") + " km" : "Top level"]);
    var T = ladder(t.dayCount, [1, 3, 5, 10, 25, 50, 100]);
    cards.push(["Track days", t.dayCount + (t.dayCount === 1 ? " day" : " days") + " on track", T, T.next ? "Next: " + T.next + " days" : "Top level"]);
    var E = ladder(t.trackCount, [1, 3, 5, 10, 20]);
    cards.push(["Explorer", t.trackCount + (t.trackCount === 1 ? " track" : " tracks") + " driven", E, E.next ? "Next: " + E.next + " tracks" : "Top level"]);
    var P = ladder(pbs, [1, 3, 5, 10, 25, 50]);
    cards.push(["Personal bests", pbs + " new best " + (pbs === 1 ? "lap" : "laps") + " at a track", P, P.next ? "Next: " + P.next + " personal bests" : "Top level"]);
    if (bar.target) {
      var B = { level: bar.broken, of: null, next: true, p: Math.max(0, Math.min(1, 1 - bar.target.gap / 1000)) };
      cards.push(["Barrier breaker", bar.target.track + ": " + lap(bar.target.best), B,
        "Next: break " + lap(bar.target.line).replace(/\.000$/, "") + ", " + sec(bar.target.gap) + " to find", bar.broken + " broken so far"]);
    } else cards.push(["Barrier breaker", "Set a best lap at a track", { level: 0, of: null, next: true, p: 0 }, "Next: your first best lap"]);
    var C = ladder(run ? run.spread : null, [1500, 1000, 500, 300, 200, 100], true);
    cards.push(["Consistency", run ? "3 laps in a row within " + sec(run.spread) + " (" + where(run.s) + ")" : "Drive three laps in a row", C,
      C.next ? "Next: within " + sec(C.next) : "Top level"]);
    var I = ladder(ideal ? ideal.gap : null, [1000, 500, 250, 100, 50], true);
    cards.push(["Ideal lap", ideal ? (ideal.gap < 1 ? "Best lap matched your best sectors" : "Best lap " + sec(ideal.gap) + " off your best sectors") + " (" + where(ideal.s) + ")" : "Drive a session with sectors", I,
      I.next ? "Next: within " + sec(I.next) : "Top level"]);

    var ul = $("achieve"); ul.textContent = "";
    cards.forEach(function (c) {
      var lv = c[2], li = el("li", lv.next ? "" : "done");
      var head = el("div", "ah"); head.appendChild(el("b", null, c[0]));
      if (lv.of) {
        var pips = el("span", "pips"); pips.setAttribute("aria-label", "Level " + lv.level + " of " + lv.of);
        for (var k = 0; k < lv.of; k++) pips.appendChild(el("i", k < lv.level ? "on" : ""));
        head.appendChild(pips);
      } else if (c[4]) head.appendChild(el("span", "count", c[4]));
      li.appendChild(head);
      li.appendChild(el("span", "now", c[1]));
      var meter = el("i", "meter"); meter.style.setProperty("--p", lv.p.toFixed(3)); li.appendChild(meter);
      li.appendChild(el("small", null, c[3]));
      ul.appendChild(li);
    });
  }

  // ---------------------------------------------------------------- sessions
  function bestByTrack() {
    var b = {};
    data.sessions.forEach(function (s) { if (s.track && s.bestMs && (b[s.track] == null || s.bestMs < b[s.track])) b[s.track] = s.bestMs; });
    return b;
  }
  function sessionRow(s, best) {
    var a = el("a", "srow"); a.href = "#session/" + encodeURIComponent(s.key);
    a.appendChild(outline(s.outline));
    var mid = el("span", "mid");
    mid.appendChild(el("b", null, s.name || s.track || s.title || "Session"));
    mid.appendChild(el("span", null, [day(s.startedAt, true), s.car].filter(Boolean).join(", ")));
    var valid = s.laps.filter(function (l) { return !l.invalid; }).length;
    mid.appendChild(el("span", null, valid + (valid === 1 ? " lap" : " laps") + (s.distanceM ? ", " + km(s.distanceM) + " km" : "")));
    a.appendChild(mid);
    var right = el("span", "right");
    right.appendChild(el("b", "fig", lap(s.bestMs)));
    if (s.track && s.bestMs && best[s.track] === s.bestMs) right.appendChild(el("span", "pb", "Best here"));
    else if (s.track && s.bestMs && best[s.track]) right.appendChild(el("span", "behind", gap(s.bestMs - best[s.track])));
    a.appendChild(right);
    return a;
  }
  function drawSessions() {
    var box = $("sessions"); box.textContent = "";
    $("s-note").textContent = noSessionsText();
    if (!data.sessions.length) { box.appendChild(emptyState()); return; }
    var best = bestByTrack(), group = null, list = null;
    data.sessions.forEach(function (s) {
      var m = s.startedAt ? month(s.startedAt) : "Undated";
      if (m !== group) { group = m; box.appendChild(el("h2", "month", m)); list = el("div", "slist"); box.appendChild(list); }
      list.appendChild(sessionRow(s, best));
    });
  }
  function drawRecent() {
    var box = $("recent"); box.textContent = "";
    if (!data.sessions.length) { box.appendChild(emptyState()); return; }
    var best = bestByTrack(), list = el("div", "slist");
    data.sessions.slice(0, 4).forEach(function (s) { list.appendChild(sessionRow(s, best)); });
    box.appendChild(list);
  }
  function emptyState() {
    var d = el("div", "empty-box");
    d.appendChild(el("p", null, noSessionsText() || "No sessions yet."));
    if (!(me && me.is_pro) && !data.pro) d.appendChild(el("p", "hint", "Tracky Pro is in the app: You › Settings › Tracky Pro."));
    return d;
  }

  // One session: the laps in the timing colours the app uses (Laps, `TimingMarks`): in the order
  // driven, purple is the session's fastest, green beat every earlier lap, yellow did not. Invalid
  // laps get no colour and never count.
  function drawOne(key) {
    var box = $("one"); box.textContent = "";
    var s = data.sessions.find(function (x) { return x.key === key; });
    if (!s) { box.appendChild(el("p", "empty", data.files.length ? "Reading this session…" : "This session isn't in your account.")); return; }
    var head = el("div", "one-head");
    head.appendChild(outline(s.outline, "big"));
    var t = el("div");
    t.appendChild(el("h1", null, s.name || s.track || s.title || "Session"));
    t.appendChild(el("p", "sub", [day(s.startedAt, true), s.track && s.name ? s.track : null, s.car, s.driver].filter(Boolean).join(", ")));
    var figs = el("ul", "figs");
    [["Best lap", lap(s.bestMs), "fastest"], ["Optimal", s.optimalMs ? lap(s.optimalMs) : "–"], ["Top speed", kmh(s.topSpeedMps)],
     ["Laps", String(s.laps.filter(function (l) { return !l.invalid; }).length)], ["Distance", s.distanceM ? km(s.distanceM) + " km" : "–"],
     ["Time", s.durationMs ? hours(s.durationMs) : "–"]].forEach(function (f) {
      var li = el("li", f[2] || ""); li.appendChild(el("span", null, f[0])); li.appendChild(el("b", "fig", f[1])); figs.appendChild(li);
    });
    t.appendChild(figs);
    var src = [];
    if (s.gpsRateHz) src.push("GPS " + Math.round(s.gpsRateHz) + " Hz" + (s.gpsSource ? " (" + s.gpsSource + ")" : ""));
    if (s.engine) src.push("engine data");
    if (src.length) t.appendChild(el("p", "hint", "Recorded with " + src.join(" and ") + "."));
    head.appendChild(t);
    box.appendChild(head);
    if (s.notes) box.appendChild(el("p", "notes", s.notes));
    box.appendChild(lapTable(s));
  }
  function lapTable(s) {
    var wrap = el("div", "laps-wrap"), table = el("table", "laps");
    var n = s.sectorCount || 0, valid = s.laps.filter(function (l) { return !l.invalid && l.ms > 0; });
    var fastest = valid.length ? Math.min.apply(null, valid.map(function (l) { return l.ms; })) : null;
    var bestSec = []; for (var i = 0; i < n; i++) bestSec.push(Math.min.apply(null, valid.filter(function (l) { return l.sectors && l.sectors.length === n; }).map(function (l) { return l.sectors[i]; }).concat([Infinity])));
    var thead = el("thead"), hr = el("tr");
    ["Lap", "Time", "Gap"].forEach(function (h) { hr.appendChild(el("th", null, h)); });
    for (i = 0; i < n; i++) hr.appendChild(el("th", null, "S" + (i + 1)));
    hr.appendChild(el("th", null, "Top"));
    thead.appendChild(hr); table.appendChild(thead);
    var tb = el("tbody"), soFar = Infinity, secSoFar = bestSec.map(function () { return Infinity; });
    s.laps.forEach(function (l) {
      var tr = el("tr", l.invalid ? "invalid" : "");
      tr.appendChild(el("td", null, String(l.number)));
      var cls = "";
      if (!l.invalid && l.ms > 0) { cls = l.ms === fastest ? "purple" : l.ms < soFar ? "green" : "yellow"; soFar = Math.min(soFar, l.ms); }
      tr.appendChild(el("td", "fig " + cls, lap(l.ms)));
      tr.appendChild(el("td", "gap", !l.invalid && fastest && l.ms !== fastest ? gap(l.ms - fastest) : l.invalid ? "Invalid" : ""));
      for (var k = 0; k < n; k++) {
        var v = l.sectors && l.sectors.length === n ? l.sectors[k] : null, c = "";
        if (v != null && !l.invalid) { c = v === bestSec[k] ? "purple" : v < secSoFar[k] ? "green" : "yellow"; secSoFar[k] = Math.min(secSoFar[k], v); }
        tr.appendChild(el("td", "fig sec " + c, v == null ? "–" : (v / 1000).toFixed(3)));
      }
      tr.appendChild(el("td", "top", l.top ? Math.round(l.top * 3.6) : "–"));
      tb.appendChild(tr);
    });
    table.appendChild(tb); wrap.appendChild(table);
    var key = el("p", "hint legend");
    key.innerHTML = '<span class="k purple"></span> fastest <span class="k green"></span> quicker than every earlier lap <span class="k yellow"></span> slower than an earlier lap<span class="unit">Top speed in km/h</span>';
    wrap.appendChild(key);
    return wrap;
  }

  // ---------------------------------------------------------------- best laps
  function drawBests() {
    var box = $("bests"); box.textContent = "";
    var by = {};
    data.sessions.forEach(function (s) { if (!s.track || !s.bestMs) return; (by[s.track] = by[s.track] || []).push(s); });
    var names = Object.keys(by).sort(function (a, b) { return by[b].length - by[a].length || a.localeCompare(b); });
    if (!names.length) { box.appendChild(emptyState()); return; }
    names.forEach(function (name) {
      var list = by[name].slice().sort(function (a, b) { return (a.startedAt || 0) - (b.startedAt || 0); });
      var best = list.reduce(function (m, s) { return !m || s.bestMs < m.bestMs ? s : m; }, null);
      var card = el("article", "track");
      card.appendChild(outline((best.outline && best.outline.length ? best : list[list.length - 1]).outline));
      var body = el("div", "tbody");
      body.appendChild(el("h2", null, name));
      body.appendChild(el("p", "sub", list.length + (list.length === 1 ? " session" : " sessions") + ", since " + day(list[0].startedAt)));
      var line = el("p", "bestline");
      line.appendChild(el("b", "fig", lap(best.bestMs)));
      line.appendChild(el("span", null, [best.car, day(best.startedAt)].filter(Boolean).join(", ")));
      body.appendChild(line);
      if (list.length > 1) body.appendChild(progress(list, best.bestMs));
      var go = el("a", "more", "Open that session"); go.href = "#session/" + encodeURIComponent(best.key); body.appendChild(go);
      card.appendChild(body);
      box.appendChild(card);
    });
  }
  // Each session's best lap here, in date order; up is quicker, the best is marked.
  function progress(list, bestMs) {
    var ns = "http://www.w3.org/2000/svg", w = 320, h = 70, svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h); svg.setAttribute("class", "spark"); svg.setAttribute("role", "img");
    var v = list.map(function (s) { return s.bestMs; }), lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), span = Math.max(hi - lo, 1);
    var pts = v.map(function (ms, i) { return [list.length === 1 ? w / 2 : 8 + i * (w - 16) / (list.length - 1), 8 + (ms - lo) / span * (h - 16)]; });
    svg.setAttribute("aria-label", "Best lap by session, from " + lap(v[0]) + " to " + lap(v[v.length - 1]));
    var pl = document.createElementNS(ns, "polyline"); pl.setAttribute("points", pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "));
    svg.appendChild(pl);
    pts.forEach(function (p, i) {
      var c = document.createElementNS(ns, "circle"); c.setAttribute("cx", p[0].toFixed(1)); c.setAttribute("cy", p[1].toFixed(1)); c.setAttribute("r", v[i] === bestMs ? 5 : 3);
      if (v[i] === bestMs) c.setAttribute("class", "best");
      svg.appendChild(c);
    });
    return svg;
  }

  // ---------------------------------------------------------------- sharing
  function drawSharing() {
    var p = $("sh-profile"); p.textContent = "";
    var dl = el("dl", "kv");
    function row(k, v) { dl.appendChild(el("dt", null, k)); dl.appendChild(el("dd", null, v)); }
    row("Profile", me.username ? (me.is_private ? "Private: only drivers you accept see your posts" : "Public: any Tracky driver can see your posts") : "No username yet, so no Paddock profile");
    if (me.username) row("Link", "tracky://u/" + me.username);
    p.appendChild(dl);
    p.appendChild(el("p", "hint", "Change who sees your profile and stories in the app: Settings › Hidden, restricted and blocked."));
    var box = $("sh-shared"); box.textContent = "";
    if (!data.shared.length) { box.appendChild(el("p", "empty", "Nothing shared yet. From a session in the app, share a lap or the whole session to your profile.")); return; }
    var list = el("div", "slist");
    data.shared.forEach(function (s) {
      var r = el("div", "srow static");
      var mid = el("span", "mid");
      mid.appendChild(el("b", null, s.title || s.track_name || "Session"));
      mid.appendChild(el("span", null, [s.track_name, s.car_name, day(Date.parse(s.started_at || s.created_at))].filter(Boolean).join(", ")));
      var what = [s.scope === "lap" ? "One lap" : "Whole session"];
      if (s.telemetry) what.push("telemetry"); if (s.engine) what.push("engine"); if (s.heart_rate) what.push("heart rate");
      if (s.downloadable) what.push("downloadable");
      mid.appendChild(el("span", null, what.join(", ")));
      r.appendChild(mid);
      var right = el("span", "right");
      right.appendChild(el("b", "fig", lap(s.best_lap_ms)));
      right.appendChild(el("span", "aud", s.audience === "followers" ? "Followers" : "Everyone"));
      r.appendChild(right);
      list.appendChild(r);
    });
    box.appendChild(list);
  }
  function drawConsents(rows) {
    var box = $("consents"); box.textContent = "";
    var now = {}; rows.forEach(function (r) { now[r.kind] = r.granted; });
    CONSENTS.forEach(function (c) {
      var row = el("label", "toggle"), text = el("span");
      text.appendChild(el("b", null, c[1])); text.appendChild(el("small", null, c[2]));
      var box2 = document.createElement("input"); box2.type = "checkbox"; box2.setAttribute("role", "switch");
      box2.checked = c[0] in now ? now[c[0]] : c[3];
      box2.addEventListener("change", async function () {
        box2.disabled = true;
        try { await rpc("set_consent", { kind: c[0], granted: box2.checked, policy_version: POLICY_VERSION }); say("Saved."); }
        catch (e) { box2.checked = !box2.checked; say(e.message, true); }
        box2.disabled = false;
      });
      row.appendChild(text); row.appendChild(box2); box.appendChild(row);
    });
  }

  // ---------------------------------------------------------------- cars
  var CAR_FIELDS = [["make", "Make"], ["model", "Model"], ["year", "Year", "number"], ["power_hp", "Power (hp)", "number"], ["weight_kg", "Weight (kg)", "number"], ["drive", "Driven wheels"], ["tyres", "Tyres"], ["changes", "Changes made"]];
  function drawCars() {
    var list = $("cars"); list.textContent = "";
    if (!data.cars.length) { list.appendChild(el("li", "empty", "No cars yet.")); return; }
    data.cars.forEach(function (car) {
      var li = el("li", "car");
      var top = el("div", "car-top");
      var t = el("div"); t.appendChild(el("b", null, car.name));
      var spec = [car.year, car.make, car.model].filter(Boolean).join(" ");
      var more = [car.power_hp ? car.power_hp + " hp" : null, car.weight_kg ? car.weight_kg + " kg" : null, car.drive, car.tyres].filter(Boolean).join(", ");
      if (spec || more) t.appendChild(el("span", null, [spec, more].filter(Boolean).join(" · ")));
      if (car.show_on_card) t.appendChild(el("span", "oncard", "On your card"));
      var count = data.sessions.filter(function (s) { return s.car === car.name; }).length;
      if (count) t.appendChild(el("span", null, count + (count === 1 ? " synced session" : " synced sessions")));
      top.appendChild(t);
      var edit = el("button", "linkbtn", "Edit"); edit.type = "button";
      var remove = el("button", "linkbtn", "Remove"); remove.type = "button";
      var acts = el("div", "acts"); acts.appendChild(edit); acts.appendChild(remove); top.appendChild(acts);
      li.appendChild(top);
      var form = el("form", "car-form"); form.hidden = true;
      CAR_FIELDS.forEach(function (f) {
        var lab = el("label", null, f[1]), inp = document.createElement("input");
        inp.name = f[0]; inp.type = f[2] || "text"; inp.value = car[f[0]] == null ? "" : car[f[0]];
        lab.appendChild(inp); form.appendChild(lab);
      });
      var onCard = el("label", "check"), cb = document.createElement("input"); cb.type = "checkbox"; cb.name = "show_on_card"; cb.checked = !!car.show_on_card;
      onCard.appendChild(cb); onCard.appendChild(el("span", null, "Show on your card")); form.appendChild(onCard);
      var save = el("button", "btn primary", "Save"); save.type = "submit"; form.appendChild(save);
      li.appendChild(form);
      edit.addEventListener("click", function () { form.hidden = !form.hidden; edit.textContent = form.hidden ? "Edit" : "Close"; });
      form.addEventListener("submit", async function (ev) {
        ev.preventDefault(); busy(form, true);
        var body = { show_on_card: cb.checked };
        CAR_FIELDS.forEach(function (f) { var v = form[f[0]].value.trim(); body[f[0]] = v === "" ? null : f[2] === "number" ? Number(v) : v; });
        try { await call("rest/v1/cars", { method: "PATCH", auth: true, prefer: "return=minimal", query: { id: "eq." + car.id }, body: body }); say("Saved " + car.name + "."); await reloadCars(); }
        catch (e) { say(e.message, true); }
        busy(form, false);
      });
      remove.addEventListener("click", async function () {
        if (!confirm("Remove " + car.name + " from your cars?")) return;
        try { await call("rest/v1/cars", { method: "DELETE", auth: true, query: { id: "eq." + car.id } }); await reloadCars(); }
        catch (e) { say(e.message, true); }
      });
      list.appendChild(li);
    });
  }
  async function reloadCars() { data.cars = await call("rest/v1/cars", { auth: true, query: { select: "*", order: "created_at.asc" } }); drawCars(); drawProfile(); }

  // ---------------------------------------------------------------- settings
  function drawSettings() {
    $("set-email").textContent = session.user.email || "";
    $("set-user").textContent = me.username ? "@" + me.username : "Not chosen yet";
    $("set-pro").textContent = (me.is_pro || data.pro) ? "Yes" : "Not yet";
    $("profile").driver.value = me.driver_name || "";
  }

  // ---------------------------------------------------------------- followers
  document.querySelectorAll("[data-list]").forEach(function (b) {
    b.addEventListener("click", async function () {
      if (!me || !me.username) return;
      var which = b.dataset.list, dlg = $("people"), ul = $("people-list");
      $("people-h").textContent = which === "followers" ? "Followers" : "Following";
      ul.textContent = ""; ul.appendChild(el("li", "empty", "Loading…"));
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      try {
        var rows = await rpc("follow_list", { p_username: me.username, p_which: which });
        ul.textContent = "";
        if (!rows.length) ul.appendChild(el("li", "empty", which === "followers" ? "No followers yet." : "Not following anyone yet."));
        rows.forEach(function (r) {
          var li = el("li"), av = el("span", "av"); avatar(av, r.photo_key, r.driver_name);
          var t = el("span"); t.appendChild(el("b", null, r.driver_name || r.username)); t.appendChild(el("small", null, "@" + r.username + (r.verified ? " · Verified" : "")));
          li.appendChild(av); li.appendChild(t); ul.appendChild(li);
        });
      } catch (e) { ul.textContent = ""; ul.appendChild(el("li", "empty", e.message)); }
    });
  });
  document.querySelectorAll("[data-close]").forEach(function (x) { x.addEventListener("click", function () { var d = x.closest("dialog"); if (d.close) d.close(); else d.removeAttribute("open"); }); });

  // ---------------------------------------------------------------- forms
  document.querySelectorAll("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll("[data-tab]").forEach(function (t) { t.setAttribute("aria-selected", String(t === tab)); });
      $("signin").hidden = tab.dataset.tab !== "signin"; $("signup").hidden = tab.dataset.tab !== "signup"; say("");
    });
  });
  function clean(t) { return String(t || "").trim().toLowerCase(); }
  // Date of birth is typed dd/mm/yyyy; the account stores yyyy-mm-dd. Null if it is not a real date.
  function isoBirthDate(t) {
    var m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(String(t || "").trim());
    if (!m) return null;
    var d = +m[1], mo = +m[2], y = +m[3], when = new Date(Date.UTC(y, mo - 1, d));
    if (y < 1900 || when.getUTCFullYear() !== y || when.getUTCMonth() !== mo - 1 || when.getUTCDate() !== d) return null;
    return y + "-" + String(mo).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }
  // Slashes go in as the digits are typed: 02091990 -> 02/09/1990.
  $("signup").born.addEventListener("input", function (ev) {
    if (ev.inputType && ev.inputType.indexOf("delete") === 0) return;
    var digits = this.value.replace(/\D/g, "").slice(0, 8);
    this.value = digits.length > 4 ? digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4)
      : digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
  });

  $("signin").addEventListener("submit", async function (ev) {
    ev.preventDefault(); var f = ev.target; busy(f, true); say("");
    try { keep(await call("auth/v1/token", { method: "POST", query: { grant_type: "password" }, body: { email: clean(f.email.value), password: f.password.value } })); f.reset(); location.hash = "#profile"; show(); }
    catch (e) { say(e.message, true); }
    busy(f, false);
  });
  $("signup").addEventListener("submit", async function (ev) {
    ev.preventDefault(); var f = ev.target; say("");
    if (f.password.value.length < SHORTEST_PASSWORD) return say("Please use at least " + SHORTEST_PASSWORD + " characters for your password.", true);
    // Tracky is for 16 and over (Privacy Policy, Children).
    var born = isoBirthDate(f.born.value);
    if (!born) return say("Enter your date of birth as dd/mm/yyyy.", true);
    var p = born.split("-").map(Number), now = new Date();
    var age = now.getFullYear() - p[0] - ((now.getMonth() + 1 < p[1] || (now.getMonth() + 1 === p[1] && now.getDate() < p[2])) ? 1 : 0);
    if (age < 16) return say("You must be 16 or older to create a Tracky account.", true);
    busy(f, true);
    try {
      var made = await call("auth/v1/signup", { method: "POST", query: { redirect_to: HERE },
        body: { email: clean(f.email.value), password: f.password.value, data: { driver_name: f.driver.value.trim().slice(0, 60), birth_date: born } } });
      if (made && made.access_token) { keep(made); show(); }
      else say("Almost there: we've sent an email to " + clean(f.email.value) + ". Open the link in it to confirm your account.");
      f.reset();
    } catch (e) { say(e.message, true); }
    busy(f, false);
  });
  $("forgot").addEventListener("click", async function () {
    var email = clean($("signin").email.value);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say("Type your email above first, then choose “Forgotten your password?”.", true);
    try { await call("auth/v1/recover", { method: "POST", query: { redirect_to: HERE }, body: { email: email } }); say("If there is an account for " + email + ", we've sent it a link to choose a new password."); }
    catch (e) { say(e.message, true); }
  });
  async function setPassword(ev) {
    ev.preventDefault(); var f = ev.target;
    if (f.password.value.length < SHORTEST_PASSWORD) return say("Please use at least " + SHORTEST_PASSWORD + " characters.", true);
    busy(f, true);
    try { await call("auth/v1/user", { method: "PUT", auth: true, body: { password: f.password.value } }); f.reset(); say("Your new password is saved."); if (ev.target.id === "set-password") show(); }
    catch (e) { say(e.message, true); }
    busy(f, false);
  }
  $("set-password").addEventListener("submit", setPassword);
  $("change-password").addEventListener("submit", setPassword);
  $("profile").addEventListener("submit", async function (ev) {
    ev.preventDefault(); var f = ev.target; busy(f, true);
    try { await call("rest/v1/profiles", { method: "PATCH", auth: true, prefer: "return=minimal", query: { id: "eq." + session.user.id }, body: { driver_name: f.driver.value.trim().slice(0, 60) } }); me.driver_name = f.driver.value.trim().slice(0, 60); drawProfile(); say("Driver name saved."); }
    catch (e) { say(e.message, true); }
    busy(f, false);
  });
  $("add-car").addEventListener("submit", async function (ev) {
    ev.preventDefault(); var f = ev.target; busy(f, true);
    try { await call("rest/v1/cars", { method: "POST", auth: true, prefer: "return=minimal", body: { name: f.name.value.trim().slice(0, 80) } }); f.reset(); await reloadCars(); }
    catch (e) { say(e.message, true); }
    busy(f, false);
  });
  $("sign-out").addEventListener("click", async function () {
    try { await call("auth/v1/logout", { method: "POST", auth: true }); } catch (e) {}
    save(null); history.replaceState(null, "", HERE); say("You're signed out."); show();
  });
  $("delete").addEventListener("click", async function () {
    var typed = prompt("This deletes your Tracky account, profile, cars and choices, on every device. It cannot be undone.\n\nType DELETE to confirm.");
    if (typed !== "DELETE") return;
    try { await rpc("delete_my_account"); save(null); say("Your account has been deleted."); show(); }
    catch (e) { say(e.message, true); }
  });

  // ---------------------------------------------------------------- arriving from an email link
  // Account emails link here (?token_hash=…&type=signup|recovery) so no link in them leaves
  // trackyapp.eu. On an iPhone or iPad the code goes to the app (a code works once); the website
  // uses it only when the driver says Tracky isn't on this device.
  async function arrive() {
    var q = new URLSearchParams(location.search);
    if (q.get("token_hash") && q.get("type")) {
      var type = q.get("type");
      history.replaceState(null, "", HERE);
      var apple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (apple) {
        var app = "tracky://auth?token_hash=" + encodeURIComponent(q.get("token_hash")) + "&type=" + encodeURIComponent(type);
        var handed = await new Promise(function (done) {
          say("Open Tracky to finish. You'll be signed in there.");
          var n = $("notice"), open = el("a", "btn primary", "Open Tracky"); open.href = app;
          var here = el("button", "linkbtn", "No Tracky on this device? Finish on the website"); here.type = "button";
          var row = el("p"); row.appendChild(open); row.appendChild(document.createElement("br")); row.appendChild(here); n.appendChild(row);
          here.addEventListener("click", function () { done(false); });
          document.addEventListener("visibilitychange", function () { if (document.hidden) done(true); });
          location.href = app;
        });
        if (handed) { say("Tracky has your link. You can close this page."); return show(); }
        say("");
      }
      try {
        keep(await call("auth/v1/verify", { method: "POST", body: { type: type, token_hash: q.get("token_hash") } }));
        if (type === "recovery") { say("Choose a new password for your account."); return show("password"); }
        say("Your email is confirmed. Welcome to Tracky. You can sign in with this account in the app too.");
      } catch (e) { say(/expired|invalid/i.test(e.message) ? "This link has expired or was already used. Sign in, or ask for a new link." : e.message, true); }
      return show();
    }
    var h = new URLSearchParams(location.hash.slice(1));
    if (h.get("error_description")) { say(h.get("error_description").replace(/\+/g, " "), true); history.replaceState(null, "", HERE); }
    if (h.get("access_token")) {
      save({ access_token: h.get("access_token"), refresh_token: h.get("refresh_token"),
        expires_at: Number(h.get("expires_at")) || Math.floor(Date.now() / 1000) + Number(h.get("expires_in") || 3600), user: null });
      history.replaceState(null, "", HERE);
      try { session.user = await call("auth/v1/user", { auth: true }); save(session); } catch (e) { say(e.message, true); }
      if (h.get("type") === "recovery") { say("Choose a new password for your account."); return show("password"); }
      say("Your email is confirmed. Welcome to Tracky.");
    }
    show();
  }

  if (!C.url || !C.key || /YOUR_|\$\(/.test(C.key)) { say("Accounts are not available on the website yet.", true); return; }
  arrive();
})();
