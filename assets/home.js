// The home page replays one real lap (Achna Speedway, 1:11.572, OBD revs and
// throttle at 25 Hz, resampled to 10 Hz) through the live screen, the map dots and every
// instrument look. Paused off screen. The figures change even with reduced motion (nothing
// moves across the screen); the sliding and blinking parts are off then.
(function () {
  "use strict";
  var raw = document.getElementById("lap-data");
  if (!raw) return;
  var L = JSON.parse(raw.textContent), N = L.t.length, LAP = L.lap;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Distance along the lap, for the graph cursor.
  var D = [0];
  for (var i = 1; i < N; i++) D.push(D[i - 1] + Math.hypot(L.x[i] - L.x[i - 1], L.y[i] - L.y[i - 1]));

  function at(elapsed) {
    var t = ((elapsed % LAP) + LAP) % LAP;
    var u = t / LAP * (N - 1), k = Math.min(N - 2, Math.floor(u)), f = Math.max(0, Math.min(1, u - k));
    function mix(a) { return a[k] + (a[k + 1] - a[k]) * f; }
    return { elapsed: elapsed, t: t, x: mix(L.x), y: mix(L.y), v: mix(L.v), rpm: mix(L.rpm), thr: mix(L.thr),
      gear: L.gear[f < 0.5 ? k : k + 1], gl: mix(L.gl), gt: mix(L.gt), gap: mix(L.gap), d: mix(D) / D[N - 1] };
  }
  function clock(t, n) { var m = Math.floor(t / 60), s = t - m * 60; return m + ":" + (s < 10 ? "0" : "") + s.toFixed(n); }
  function revs(r) { return (Math.round(r / 10) * 10).toLocaleString("en-GB"); }
  function gapText(g) { return (g > 0.004 ? "+" : g < -0.004 ? "−" : "") + Math.abs(g).toFixed(2); }
  function $(id) { return document.getElementById(id); }
  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  var lBig = $("l-big"), lLabel = $("l-label"), lFlash = $("l-flash"), lRec = $("l-rec");
  var lClock = $("clock"), lGap = $("l-gap"), lTile = $("l-gaptile"), lBar = $("l-gapbar"), lSpeed = $("l-speed"), lRevs = $("l-revs"), lThr = $("l-thr");
  var oDot = $("o-dot"), gCur = $("g-cur");
  var fields = all("[data-f]"), needles = all("[data-needle]"), bars = all("[data-segs]"), shifts = all("[data-shift]");
  var dots = all("[data-dot]"), thrBars = all("[data-thr]"), gDots = all("[data-g]"), gapBoxes = all("[data-gapbox]");

  function render(s) {
    var text = { speed: Math.round(s.v), gear: s.gear, rpm: Math.round(s.rpm / 10) * 10, "rpm-label": revs(s.rpm) + " rpm",
      lap: clock(s.t, 2), lap3: clock(s.t, 3), gap: gapText(s.gap) };
    if (lClock) {
      // Lap 7 onwards, one lap after another; for 3 s after the line the finished lap shows.
      var lapNo = 7 + Math.floor(s.elapsed / LAP), justDone = s.elapsed >= LAP && s.t < 3;
      lBig.classList.toggle("done", justDone);
      if (justDone) {
        lLabel.textContent = "Lap " + (lapNo - 1);
        lClock.textContent = clock(LAP, 2);
        lFlash.textContent = gapText(L.gap[N - 1]) + " to best";
      } else {
        lLabel.textContent = "Lap " + lapNo;
        lClock.textContent = clock(s.t, 2);
        lFlash.textContent = "";
      }
      var rec = 724 + s.elapsed; lRec.textContent = Math.floor(rec / 60) + ":" + ("0" + Math.floor(rec % 60)).slice(-2);
      var g = justDone ? L.gap[N - 1] : s.gap;
      lGap.textContent = gapText(g);
      lTile.classList.toggle("behind", g > 0.004);
      lBar.style.setProperty("--f", Math.min(1, Math.abs(g)).toFixed(3));
      lSpeed.textContent = Math.round(s.v); lRevs.textContent = revs(s.rpm); lThr.textContent = Math.round(s.thr);
    }
    if (oDot) { oDot.setAttribute("cx", s.x.toFixed(1)); oDot.setAttribute("cy", s.y.toFixed(1)); }
    if (gCur) { var gx = (s.d * 300).toFixed(1); gCur.setAttribute("x1", gx); gCur.setAttribute("x2", gx); }
    fields.forEach(function (el) { var v = text[el.getAttribute("data-f")]; if (v !== undefined) el.textContent = v; });
    needles.forEach(function (el) {
      var top = +el.getAttribute("data-top"), v = el.getAttribute("data-needle") === "rpm" ? s.rpm : s.v;
      var a = -135 + 270 * Math.max(0, Math.min(1, v / top));
      el.setAttribute("transform", "rotate(" + a.toFixed(1) + " " + el.getAttribute("data-cx") + " " + el.getAttribute("data-cy") + ")");
    });
    bars.forEach(function (g) {
      var kids = g.children, lit = Math.round(s.rpm / +g.getAttribute("data-segs") * kids.length);
      for (var k = 0; k < kids.length; k++) kids[k].setAttribute("opacity", k < lit ? "1" : ".14");
    });
    shifts.forEach(function (g) {   // none below 70 % of 8,000 rpm, all from 97 %
      var kids = g.children, lit = Math.max(0, Math.min(kids.length, Math.ceil((s.rpm / 8000 - 0.7) / 0.27 * kids.length)));
      for (var k = 0; k < kids.length; k++) kids[k].setAttribute("opacity", k < lit ? "1" : ".15");
    });
    dots.forEach(function (c) { c.setAttribute("cx", s.x.toFixed(1)); c.setAttribute("cy", s.y.toFixed(1)); });
    thrBars.forEach(function (r) { r.setAttribute("width", (2.1 * Math.max(0, Math.min(100, s.thr))).toFixed(0)); });
    gDots.forEach(function (c) { c.setAttribute("cx", (760 + s.gt * 60).toFixed(1)); c.setAttribute("cy", (120 - s.gl * 60).toFixed(1)); });
    gapBoxes.forEach(function (r) { r.setAttribute("fill", s.gap > 0.004 ? "#d8463c" : "#2f9e5b"); });
  }

  {
    var visible = 0, running = false, t0 = performance.now() - (LAP - 8) * 1000;
    var frame = function (now) {
      if (!visible) { running = false; return; }
      render(at((now - t0) / 1000));
      requestAnimationFrame(frame);
    };
    var shown = new Set();
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) shown.add(e.target); else shown.delete(e.target); });
        visible = shown.size;
        if (visible && !running) { running = true; requestAnimationFrame(frame); }
      });
      all(".phone, .scene").forEach(function (el) { io.observe(el); });
    } else { visible = 1; running = true; requestAnimationFrame(frame); }
  }

  // Instrument looks: tabs show one look at a time.
  var lookTabs = all(".looktabs [role=tab]");
  function showLook(k, focus) {
    lookTabs.forEach(function (t, j) {
      var on = j === k; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
      var g = document.querySelector('.clusters [data-look="' + t.getAttribute("data-show") + '"]');
      if (g) { if (on) g.removeAttribute("hidden"); else g.setAttribute("hidden", ""); }
    });
    if (focus) lookTabs[k].focus();
  }
  lookTabs.forEach(function (t, j) {
    t.addEventListener("click", function () { showLook(j); });
    t.addEventListener("keydown", function (e) {
      var to = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (to === undefined) return;
      e.preventDefault(); showLook((j + to + lookTabs.length) % lookTabs.length, true);
    });
  });
  if (lookTabs.length) showLook(0);
})();

// App tour: tabs choose a screen; it moves on by itself every few seconds until the visitor
// takes over (a tab, a swipe, focus) or presses Pause. Still for reduced motion.
(function () {
  "use strict";
  var tour = document.querySelector(".tour");
  if (!tour) return;
  var tabs = Array.prototype.slice.call(tour.querySelectorAll('[role="tab"]'));
  var slides = tour.querySelector(".slides"), track = tour.querySelector(".track"), caption = tour.querySelector(".tour-caption"), pause = tour.querySelector(".pause");
  var DWELL = 6000, index = 0, timer = 0, visible = true, playing = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  tour.style.setProperty("--dwell", DWELL / 1000 + "s");

  function schedule() {
    clearTimeout(timer);
    if (playing && visible) timer = setTimeout(function () { show(index + 1); }, DWELL);
  }
  function show(i, focus) {
    index = (i + tabs.length) % tabs.length;
    tabs.forEach(function (t, k) {
      var on = k === index;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).setAttribute("aria-hidden", String(!on));
    });
    track.style.transform = "translateX(" + (-100 * index) + "%)";
    if (caption) caption.textContent = tabs[index].querySelector("span").textContent;
    var tab = tabs[index], list = tab.parentElement;
    if (focus) tab.focus();
    if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: tab.offsetLeft - 20, behavior: "smooth" });
    var bar = tab.querySelector(".prog"); bar.style.display = "none"; void bar.offsetWidth; bar.style.display = "";
    schedule();
  }
  function setPlaying(on) {
    playing = on;
    tour.classList.toggle("playing", on);
    pause.textContent = on ? "Pause" : "Play";
    pause.setAttribute("aria-label", on ? "Stop moving through the screens" : "Move through the screens by themselves");
    if (on) show(index + 1); else clearTimeout(timer);
  }
  tabs.forEach(function (t, k) {
    t.addEventListener("click", function () { setPlaying(false); show(k); });
    t.addEventListener("keydown", function (e) {
      var to = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (e.key === "Home") to = -index; if (e.key === "End") to = tabs.length - 1 - index;
      if (to === undefined) return;
      e.preventDefault(); setPlaying(false); show(index + to, true);
    });
  });
  pause.addEventListener("click", function () { setPlaying(!playing); });
  tour.querySelector(".tprev").addEventListener("click", function () { setPlaying(false); show(index - 1); });
  tour.querySelector(".tnext").addEventListener("click", function () { setPlaying(false); show(index + 1); });
  tour.addEventListener("focusin", function (e) { if (e.target !== pause && playing) setPlaying(false); });
  var x0 = null;
  slides.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
  slides.addEventListener("pointerup", function (e) {
    if (x0 === null) return; var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { setPlaying(false); show(index + (dx < 0 ? 1 : -1)); }
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; schedule(); }, { threshold: 0.35 }).observe(tour);
  }
  tour.classList.toggle("playing", playing);
  pause.textContent = playing ? "Pause" : "Play";
  if (!playing) pause.hidden = true;
  show(0);
})();

// Gear: the arrows move the row by one card.
(function () {
  var row = document.querySelector(".gear-row");
  if (!row) return;
  function by(dir) { var card = row.querySelector(".gear-card"); row.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: "smooth" }); }
  document.querySelector(".gear .prev").addEventListener("click", function () { by(-1); });
  document.querySelector(".gear .next").addEventListener("click", function () { by(1); });
})();

// Testers: the form adds one request to the tester list (insert only; nobody can read the list
// through the website). A repeat of the same email counts as already on the list.
(function () {
  var form = document.querySelector(".tester-form");
  if (!form) return;
  var status = form.querySelector(".form-status"), button = form.querySelector("button[type=submit]");
  function say(text, kind) { status.textContent = text; status.className = "form-status" + (kind ? " " + kind : ""); }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say("Enter your email address.", "bad"); form.email.focus(); return; }
    if (!form.consent.checked) { say("Tick the box so we can email you about testing.", "bad"); form.consent.focus(); return; }
    var cfg = window.TRACKY_ACCOUNTS;
    if (!cfg) { say("This form isn't available right now. Write to info@trackyapp.eu instead.", "bad"); return; }
    var gear = Array.prototype.map.call(form.querySelectorAll("input[name=gear]:checked"), function (c) { return c.value; });
    button.disabled = true; say("Sending…");
    fetch(cfg.url + "/rest/v1/tester_requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: cfg.key, Authorization: "Bearer " + cfg.key, Prefer: "return=minimal" },
      body: JSON.stringify({ email: email, iphone: form.iphone.value || null, gear: gear, note: form.note.value.trim() || null, consent: true })
    }).then(function (r) {
      if (r.ok || r.status === 409) { form.reset(); say(r.status === 409 ? "You're already on the list. We'll be in touch." : "Thanks. You're on the tester list, and we'll email you when there's a place.", "ok"); }
      else { say("That didn't go through. Try again, or write to info@trackyapp.eu.", "bad"); }
    }).catch(function () { say("No connection. Try again, or write to info@trackyapp.eu.", "bad"); })
      .then(function () { button.disabled = false; });
  });
})();

// CarPlay example (Pro section): the gap band turns from green (ahead) to red (behind) and back,
// as it does on the car. Still for reduced motion.
(function () {
  var band = document.querySelector(".cp2 .cp-band");
  if (!band || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  var gap = band.querySelector(".cp-gap"), last = document.querySelector(".cp2 .cp-last");
  var states = [{ tone: "ahead", gap: "−0.26", last: "1:10.9" }, { tone: "behind", gap: "+0.31", last: "1:11.2" }], k = 0;
  setInterval(function () {
    k = (k + 1) % states.length;
    band.setAttribute("data-tone", states[k].tone);
    gap.textContent = states[k].gap;
    if (last) last.textContent = states[k].last;
  }, 2600);
})();
