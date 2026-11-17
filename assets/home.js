// The home page's example lap: one simulated lap of the example circuit drives the live
// screen, the map dots, the graph cursor and the video overlay. Example figures only.
(function () {
  "use strict";
  var raw = document.getElementById("lap-data");
  if (!raw) return;
  var data = JSON.parse(raw.textContent);
  var P = data.p, V = data.v, LAP = data.lap, N = P.length;

  // Distance and time along the lap; time is scaled so the lap takes LAP seconds.
  var D = [0], T = [0];
  for (var i = 1; i <= N; i++) {
    var a = P[i - 1], b = P[i % N];
    var ds = Math.hypot(b[0] - a[0], b[1] - a[1]);
    D.push(D[i - 1] + ds);
    T.push(T[i - 1] + ds / ((V[i - 1] + V[i % N]) / 2));
  }
  var scale = LAP / T[N];
  for (i = 0; i <= N; i++) T[i] *= scale;

  function at(t) {
    t = ((t % LAP) + LAP) % LAP;
    var lo = 0, hi = N;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (T[m] <= t) lo = m; else hi = m; }
    var f = (t - T[lo]) / (T[hi] - T[lo] || 1);
    var a = P[lo], b = P[hi % N], va = V[lo], vb = V[hi % N];
    var speed = va + (vb - va) * f;
    var gears = [[0, 2], [82, 3], [112, 4], [142, 5], [176, 6]], g = 2, from = 0, to = 82;
    for (var k = 0; k < gears.length; k++) if (speed >= gears[k][0]) { g = gears[k][1]; from = gears[k][0]; to = (gears[k + 1] || [215])[0]; }
    var rpm = 4300 + (speed - Math.max(from, 45)) / (to - Math.max(from, 45)) * 3300;
    return {
      t: t, x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f,
      d: (D[lo] + (D[hi] - D[lo]) * f) / D[N], speed: speed, gear: g,
      rpm: Math.max(3600, Math.min(7900, rpm)), pedal: vb > va + 0.3 ? 1 : (vb < va - 0.3 ? 0 : 0.55),
      gap: -0.42 + 0.31 * Math.sin(t / LAP * Math.PI * 2 * 2 + 0.6)
    };
  }

  function clock(t) { var m = Math.floor(t / 60), s = t - m * 60; return m + ":" + (s < 10 ? "0" : "") + s.toFixed(2); }
  function clock3(t) { var m = Math.floor(t / 60), s = t - m * 60; return m + ":" + (s < 10 ? "0" : "") + s.toFixed(3); }
  function $(id) { return document.getElementById(id); }
  function rpmText(r) { return (Math.round(r / 10) * 10).toLocaleString("en-GB"); }

  // Live screen
  var lClock = $("clock"), lGap = $("l-gap"), lTile = $("l-gaptile"), lBar = $("l-gapbar"), lSpeed = $("l-speed"), lRevs = $("l-revs");
  // Session pages
  var oDot = $("o-dot"), gCur = $("g-cur");
  // Video
  var vSpeed = $("v-speed"), vGear = $("v-gear"), vRpm = $("v-rpm"), vLap = $("v-lap"), vPedal = $("v-pedal"), vDot = $("v-dot"), road = $("v-road");
  var segs = document.querySelectorAll(".scene .rv");

  // The road: centre-line dashes and kerb stripes laid out in perspective.
  var dashes = [], stripes = [], NS = "http://www.w3.org/2000/svg";
  if (road) {
    for (i = 0; i < 14; i++) {
      var p1 = document.createElementNS(NS, "polygon"); p1.setAttribute("fill", "#f4f4f4"); road.appendChild(p1); dashes.push(p1);
      var p2 = document.createElementNS(NS, "polygon"); p2.setAttribute("fill", "#f4f4f4"); road.appendChild(p2); stripes.push(p2);
    }
  }
  var H = 262, B = 600;                       // horizon and bottom of the picture
  function edge(x0, x1, y) { return x0 + (x1 - x0) * (y - H) / (B - H); }
  function quad(el, za, zb, l0, l1, r0, r1) {   // between depths za and zb, between two lines
    if (zb <= za) { el.setAttribute("points", ""); return; }
    var ya = H + (B - H) / za, yb = H + (B - H) / zb;
    if (ya > B + 40) ya = B + 40;
    el.setAttribute("points", [edge(l0, l1, ya), ya, edge(r0, r1, ya), ya, edge(r0, r1, yb), yb, edge(l0, l1, yb), yb].join(" "));
  }
  var travelled = 0;
  function drawRoad(speed, dt) {
    if (!road) return;
    travelled += speed * dt * 0.06;
    var step = 3, off = travelled % (2 * step);
    for (var k = 0; k < dashes.length; k++) {
      var z = 0.6 + k * step - (travelled % step);
      quad(dashes[k], Math.max(z, 0.55), Math.max(z + step * 0.45, 0.55), 486, 500, 494, 522);
      var zs = 0.6 + k * 2 * step - off;
      quad(stripes[k], Math.max(zs, 0.55), Math.max(zs + step, 0.55), 560, 1180, 586, 1240);
    }
  }

  function render(s, dt) {
    if (lClock) lClock.textContent = clock(s.t);
    if (lGap) {
      var g = s.gap, behind = g > 0.0049;
      lGap.textContent = (behind ? "+" : "−") + Math.abs(g).toFixed(2);
      lTile.classList.toggle("behind", behind);
      lBar.style.setProperty("--f", Math.min(1, Math.abs(g) / 0.8).toFixed(3));
      lSpeed.textContent = Math.round(s.speed);
      lRevs.textContent = rpmText(s.rpm);
    }
    if (oDot) { oDot.setAttribute("cx", s.x.toFixed(1)); oDot.setAttribute("cy", s.y.toFixed(1)); }
    if (gCur) { var gx = (s.d * 300).toFixed(1); gCur.setAttribute("x1", gx); gCur.setAttribute("x2", gx); }
    if (vSpeed) {
      vSpeed.textContent = Math.round(s.speed);
      vGear.textContent = s.gear;
      vRpm.textContent = rpmText(s.rpm) + " rpm";
      vLap.textContent = clock3(s.t);
      vPedal.setAttribute("width", (200 * s.pedal).toFixed(0));
      vDot.setAttribute("cx", s.x.toFixed(1)); vDot.setAttribute("cy", s.y.toFixed(1));
      var lit = Math.round(s.rpm / 8000 * segs.length);
      for (var k = 0; k < segs.length; k++) segs[k].setAttribute("opacity", k < lit ? "1" : ".16");
      drawRoad(s.speed, dt);
    }
  }

  var start = 64.38 - LAP;                     // the live screen opens at 1:04.38 into the lap
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { render(at(48.21), 0); return; }

  // Run only while some part of it is on screen.
  var visible = 0, running = false, last = 0, t0 = 0;
  function frame(now) {
    if (!visible) { running = false; return; }
    var dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    render(at((now - t0) / 1000 + start + LAP), dt);
    requestAnimationFrame(frame);
  }
  t0 = performance.now();
  var watched = document.querySelectorAll(".phone, .scene");
  if (!("IntersectionObserver" in window)) { visible = 1; requestAnimationFrame(frame); return; }
  var shown = new Set();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) shown.add(e.target); else shown.delete(e.target); });
    visible = shown.size;
    if (visible && !running) { running = true; last = 0; requestAnimationFrame(frame); }
  });
  watched.forEach(function (el) { io.observe(el); });
})();
