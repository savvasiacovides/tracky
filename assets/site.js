// Every page: the menu on small screens, the header's line once the page scrolls, and the Account
// button showing who is signed in (from what /account/ last kept in this browser; nothing is fetched).
(function () {
  "use strict";
  var head = document.querySelector(".site");
  if (!head) return;
  var menu = head.querySelector(".menu");
  if (menu) menu.addEventListener("click", function () {
    var open = !head.classList.contains("open");
    head.classList.toggle("open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.textContent = open ? "Close" : "Menu";
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && head.classList.contains("open")) { menu.click(); menu.focus(); }
  });
  var onScroll = function () { head.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var chip = head.querySelector("[data-acct]");
  function me() {
    try {
      if (!localStorage.getItem("tracky.session")) return null;
      return JSON.parse(localStorage.getItem("tracky.me") || "null") || {};
    } catch (e) { return null; }
  }
  window.trackyChip = function () {
    if (!chip) return;
    var m = me(), face = chip.querySelector(".face"), who = chip.querySelector(".who");
    chip.classList.toggle("out", !m);
    if (!m) { who.textContent = "Account"; face.textContent = ""; return; }
    who.textContent = m.username ? "@" + m.username : "Your account";
    face.textContent = "";
    if (m.photo) { var img = new Image(); img.alt = ""; img.src = m.photo; face.appendChild(img); }
    else face.textContent = (m.initials || "").slice(0, 2);
  };
  window.trackyChip();
})();
