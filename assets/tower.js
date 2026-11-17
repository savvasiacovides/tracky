// The hero's timing tower: a real session's laps arrive one by one, sectors in the circuit's
// timing colours (purple the session's quickest, green a new best, yellow slower). Shows the
// whole list at once, without moving, for reduced motion.
(function () {
  "use strict";
  var list = document.getElementById("tower"), raw = document.getElementById("tower-data");
  if (!list || !raw) return;
  var laps = JSON.parse(raw.textContent), SHOW = 11, STEP = 2600;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function row(l, fresh) {
    var li = document.createElement("li");
    li.className = (l[2] === "p" ? "best" : "") + (fresh ? " fresh" : "");
    li.innerHTML = '<span class="n">' + l[0] + '</span><span class="t">' + l[1] + '</span>' +
      l[3].map(function (c) { return '<i class="s-' + c + '"></i>'; }).join("");
    return li;
  }
  function show(upTo, fresh) {
    list.innerHTML = "";
    var from = Math.max(0, upTo - SHOW);
    for (var k = upTo - 1; k >= from; k--) list.appendChild(row(laps[k], fresh && k === upTo - 1));
  }
  if (reduced) { show(laps.length, false); return; }
  var n = 4, timer = 0, visible = true;
  function tick() { n = n >= laps.length ? 4 : n + 1; show(n, true); if (visible) timer = setTimeout(tick, STEP); }
  show(n, false);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting; clearTimeout(timer); if (visible) timer = setTimeout(tick, STEP);
    }).observe(list);
  } else { timer = setTimeout(tick, STEP); }
})();
