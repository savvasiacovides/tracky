// Tracky account on the web: the same Supabase project and the same requests as the app
// (Sources/TelemetryCore/AccountRequests.swift). Row Level Security on the database decides
// what a signed-in driver can read or change; the publishable key in config.js is public by design.
(function () {
  "use strict";
  const C = window.TRACKY_ACCOUNTS || {};
  const POLICY_VERSION = "2026-11-16";
  const SHORTEST_PASSWORD = 12;
  const HERE = location.origin + location.pathname;
  const KEY = "tracky.session";
  const CONSENTS = [
    ["sync", "Keep sessions on all my devices", "Your recordings are stored with your account so they appear on your other devices.", true],
    ["heart_rate", "Heart rate in synced sessions", "Asked separately because heart rate is health data. Never sold or used for ads.", false],
    ["anon_stats", "Anonymous statistics", "Your laps may be part of statistics about circuits and cars that never identify you.", true],
    ["ads_personalised", "Personalised advertising", "Without this, any advertising is chosen by the track you look at, not by you.", false],
  ];

  const $ = (id) => document.getElementById(id);
  let session = load();

  // ---- Storage (per browser; may be unavailable) ----
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
  function save(s) { session = s; try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch (e) {} }

  // ---- Requests ----
  async function call(path, { method = "GET", query = {}, body, auth = false, prefer } = {}) {
    if (auth) await fresh();
    const url = new URL(path, C.url.replace(/\/?$/, "/"));
    Object.keys(query).sort().forEach((k) => url.searchParams.set(k, query[k]));
    const headers = { apikey: C.key };
    if (auth && session) headers.Authorization = "Bearer " + session.access_token;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (prefer) headers.Prefer = prefer;
    const res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!res.ok) throw new Error(problem(res.status, data));
    return data;
  }
  function problem(status, data) {
    const raw = (data && (data.msg || data.error_description || data.message || data.error)) || "";
    if (/invalid login/i.test(raw)) return "That email and password don't match an account.";
    if (/not confirmed/i.test(raw)) return "Please confirm your email first: open the link we sent you.";
    if (/already registered|already exists/i.test(raw)) return "There is already an account with that email. Sign in instead.";
    if (/rate limit|too many/i.test(raw) || status === 429) return "Too many tries. Please wait a minute and try again.";
    if (/weak|pwned|leaked/i.test(raw)) return "Please choose a stronger password that hasn't appeared in a data breach.";
    if (status === 401) return "Your sign-in has expired. Please sign in again.";
    return raw || "Something went wrong (" + status + "). Please try again.";
  }
  function keep(tokens) {
    save({ access_token: tokens.access_token, refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at || Math.floor(Date.now() / 1000) + Number(tokens.expires_in || 3600),
      user: tokens.user || (session && session.user) || null });
  }
  async function fresh() {
    if (!session) throw new Error("Please sign in.");
    if (Date.now() / 1000 < session.expires_at - 60) return;
    try {
      const t = await call("auth/v1/token", { method: "POST", query: { grant_type: "refresh_token" }, body: { refresh_token: session.refresh_token } });
      keep(t);
    } catch (e) { save(null); show(); throw new Error("Your sign-in has expired. Please sign in again."); }
  }

  // ---- What the page shows ----
  function say(text, bad) { const n = $("notice"); n.textContent = text; n.className = "notice" + (bad ? " bad" : ""); n.hidden = !text; }
  function show(view) {
    const v = view || (session ? "in" : "out");
    $("signed-out").hidden = v !== "out";
    $("signed-in").hidden = v !== "in";
    $("new-password").hidden = v !== "password";
    if (v === "in") fill().catch((e) => say(e.message, true));
  }
  function busy(form, on) { form.querySelectorAll("button, input").forEach((el) => (el.disabled = on)); }
  function initials(name, email) {
    const words = (name || email || "?").trim().split(/\s+/);
    return ((words[0] || "")[0] + ((words[1] || "")[0] || "")).toUpperCase();
  }

  async function fill() {
    const uid = session.user && session.user.id;
    const [profile, cars, consents] = await Promise.all([
      call("rest/v1/profiles", { auth: true, query: { select: "driver_name", id: "eq." + uid } }),
      call("rest/v1/cars", { auth: true, query: { select: "id,name,make,model,year", order: "created_at.asc" } }),
      call("rest/v1/my_consents", { auth: true, query: { select: "kind,granted" } }),
    ]);
    const name = (profile && profile[0] && profile[0].driver_name) || "";
    $("who-name").textContent = name || "No driver name yet";
    $("who-email").textContent = session.user.email || "";
    $("initials").textContent = initials(name, session.user.email);
    $("profile").driver.value = name;
    drawCars(cars || []);
    drawConsents(consents || []);
  }

  function drawCars(cars) {
    const list = $("cars"); list.textContent = "";
    if (!cars.length) { const li = document.createElement("li"); li.className = "empty"; li.textContent = "No cars yet."; list.append(li); return; }
    cars.forEach((car) => {
      const li = document.createElement("li");
      const label = document.createElement("span");
      const extra = [car.year, car.make, car.model].filter(Boolean).join(" ");
      label.textContent = car.name + (extra && extra !== car.name ? " · " + extra : "");
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
      remove.addEventListener("click", async () => {
        if (!confirm("Remove " + car.name + " from your cars?")) return;
        try { await call("rest/v1/cars", { method: "DELETE", auth: true, query: { id: "eq." + car.id } }); await fill(); }
        catch (e) { say(e.message, true); }
      });
      li.append(label, remove); list.append(li);
    });
  }

  function drawConsents(rows) {
    const box = $("consents"); box.textContent = "";
    const now = Object.fromEntries(rows.map((r) => [r.kind, r.granted]));
    CONSENTS.forEach(([kind, title, detail, standard]) => {
      const row = document.createElement("label"); row.className = "toggle";
      const text = document.createElement("span"); text.textContent = title;
      const small = document.createElement("small"); small.textContent = detail; text.append(small);
      const box2 = document.createElement("input"); box2.type = "checkbox";
      box2.checked = kind in now ? now[kind] : standard;
      box2.addEventListener("change", async () => {
        box2.disabled = true;
        try { await call("rest/v1/rpc/set_consent", { method: "POST", auth: true, body: { kind, granted: box2.checked, policy_version: POLICY_VERSION } }); say("Saved."); }
        catch (e) { box2.checked = !box2.checked; say(e.message, true); }
        box2.disabled = false;
      });
      row.append(text, box2); box.append(row);
    });
  }

  // ---- Forms ----
  document.querySelectorAll("[data-tab]").forEach((tab) => tab.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    $("signin").hidden = tab.dataset.tab !== "signin"; $("signup").hidden = tab.dataset.tab !== "signup"; say("");
  }));

  $("signin").addEventListener("submit", async (ev) => {
    ev.preventDefault(); const f = ev.target; busy(f, true); say("");
    try {
      keep(await call("auth/v1/token", { method: "POST", query: { grant_type: "password" }, body: { email: clean(f.email.value), password: f.password.value } }));
      f.reset(); show();
    } catch (e) { say(e.message, true); }
    busy(f, false);
  });

  $("signup").addEventListener("submit", async (ev) => {
    ev.preventDefault(); const f = ev.target; say("");
    if (f.password.value.length < SHORTEST_PASSWORD) return say("Please use at least " + SHORTEST_PASSWORD + " characters for your password.", true);
    busy(f, true);
    try {
      const made = await call("auth/v1/signup", { method: "POST", query: { redirect_to: HERE },
        body: { email: clean(f.email.value), password: f.password.value, data: { driver_name: f.driver.value.trim().slice(0, 60) } } });
      if (made && made.access_token) { keep(made); show(); }
      else say("Almost there: we've sent an email to " + clean(f.email.value) + ". Open the link in it to confirm your account.");
      f.reset();
    } catch (e) { say(e.message, true); }
    busy(f, false);
  });

  $("forgot").addEventListener("click", async () => {
    const email = clean($("signin").email.value);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say("Type your email above first, then choose “Forgotten your password?”.", true);
    try { await call("auth/v1/recover", { method: "POST", query: { redirect_to: HERE }, body: { email } }); say("If there is an account for " + email + ", we've sent it a link to choose a new password."); }
    catch (e) { say(e.message, true); }
  });

  $("set-password").addEventListener("submit", async (ev) => {
    ev.preventDefault(); const f = ev.target;
    if (f.password.value.length < SHORTEST_PASSWORD) return say("Please use at least " + SHORTEST_PASSWORD + " characters.", true);
    busy(f, true);
    try { await call("auth/v1/user", { method: "PUT", auth: true, body: { password: f.password.value } }); f.reset(); say("Your new password is saved."); show(); }
    catch (e) { say(e.message, true); }
    busy(f, false);
  });

  $("profile").addEventListener("submit", async (ev) => {
    ev.preventDefault(); const f = ev.target; busy(f, true);
    try { await call("rest/v1/profiles", { method: "PATCH", auth: true, prefer: "return=minimal", query: { id: "eq." + session.user.id }, body: { driver_name: f.driver.value.trim().slice(0, 60) } }); say("Driver name saved."); await fill(); }
    catch (e) { say(e.message, true); }
    busy(f, false);
  });

  $("add-car").addEventListener("submit", async (ev) => {
    ev.preventDefault(); const f = ev.target; busy(f, true);
    try { await call("rest/v1/cars", { method: "POST", auth: true, prefer: "return=minimal", body: { name: f.name.value.trim().slice(0, 80) } }); f.reset(); await fill(); }
    catch (e) { say(e.message, true); }
    busy(f, false);
  });

  $("sign-out").addEventListener("click", async () => {
    try { await call("auth/v1/logout", { method: "POST", auth: true }); } catch (e) {}
    save(null); say("You're signed out."); show();
  });

  $("delete").addEventListener("click", async () => {
    const typed = prompt("This deletes your Tracky account, profile, cars and choices, on every device. It cannot be undone.\n\nType DELETE to confirm.");
    if (typed !== "DELETE") return;
    try { await call("rest/v1/rpc/delete_my_account", { method: "POST", auth: true, body: {} }); save(null); say("Your account has been deleted."); show(); }
    catch (e) { say(e.message, true); }
  });

  function clean(t) { return String(t || "").trim().toLowerCase(); }

  // ---- Arriving from an email link ----
  // Account emails link here (?token_hash=…&type=signup|recovery) so no link in them leaves
  // trackyapp.eu; the page asks Supabase to verify the token. Older links arrive with
  // #access_token=… after Supabase verified them itself.
  async function arrive() {
    const q = new URLSearchParams(location.search);
    if (q.get("token_hash") && q.get("type")) {
      const type = q.get("type");
      history.replaceState(null, "", HERE);
      // On an iPhone or iPad the link goes to the app, which uses the code itself and signs the
      // driver in there. The code is used here only when the driver says Tracky is not on this
      // device: a code can be used once, so the website never takes it while the app may.
      const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (apple) {
        const app = "tracky://auth?token_hash=" + encodeURIComponent(q.get("token_hash")) + "&type=" + encodeURIComponent(type);
        const handed = await new Promise((done) => {
          say("Open Tracky to finish. You'll be signed in there.");
          const n = $("notice");
          const open = document.createElement("a");
          open.className = "button"; open.href = app; open.textContent = "Open Tracky";
          const here = document.createElement("button");
          here.className = "link"; here.type = "button"; here.textContent = "No Tracky on this device? Finish on the website";
          const row = document.createElement("p"); row.append(open, document.createElement("br"), here);
          n.append(row);
          here.addEventListener("click", () => done(false));
          document.addEventListener("visibilitychange", () => { if (document.hidden) done(true); });
          location.href = app;
        });
        if (handed) { say("Tracky has your link. You can close this page."); return show(); }
        say("");
      }
      try {
        const t = await call("auth/v1/verify", { method: "POST", body: { type, token_hash: q.get("token_hash") } });
        keep(t);
        if (type === "recovery") { say("Choose a new password for your account."); return show("password"); }
        say("Your email is confirmed. Welcome to Tracky. You can sign in with this account in the app too.");
      } catch (e) {
        say(/expired|invalid/i.test(e.message) ? "This link has expired or was already used. Sign in, or ask for a new link." : e.message, true);
      }
      return show();
    }
    const h = new URLSearchParams(location.hash.slice(1));
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
