// Tracky tyre size search (trackyapp.eu/tyres/). Reads public.tyre_offers, filled each night from
// ReifenDirekt.de's Awin feed by the tyre-feed function. Shows the track tyres on this page that come in
// the driver's front and rear sizes. Photos are ReifenDirekt.de's, through Awin's image service (owner confirmed
// 24 November 2026 that we may use them); each tyre card on the page shows its model's photo too.
(function () {
  var SHOW_PHOTOS = true;
  var USE = { road: "Road car, a few track days", trackdays: "Regular track days", budget: "Smaller cars, 200 treadwear", trackcar: "Track car, dry days" };
  var ORDER = ["trackdays", "road", "trackcar", "budget"];
  var box = document.getElementById("size-search");
  if (!box || !window.TRACKY_ACCOUNTS) return;
  var cfg = window.TRACKY_ACCOUNTS;
  var form = box.querySelector("form"), out = box.querySelector(".results"), list = document.getElementById("tyre-sizes");
  var front = form.elements.front, rear = form.elements.rear;
  var offers = null;

  function parse(s) {
    var m = /(\d{3})\D*(\d{2})\D*?(\d{2})\b/.exec((s || "").replace(/\s+/g, " "));
    return m ? { w: +m[1], a: +m[2], r: +m[3], label: m[1] + "/" + m[2] + " R" + m[3] } : null;
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function money(o) { return o.price == null ? "" : new Intl.NumberFormat("en-IE", { style: "currency", currency: o.currency || "EUR" }).format(o.price); }

  function load() {
    if (offers) return Promise.resolve(offers);
    var q = cfg.url + "/rest/v1/tyre_offers?select=model,use,brand,name,size,width,aspect,rim,load_speed,price,currency,in_stock,image,link&order=price.asc";
    return fetch(q, { headers: { apikey: cfg.key } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) { offers = rows; return rows; });
  }

  function photos(rows) {
    if (!SHOW_PHOTOS) return;
    var pic = {}, cheap = {};
    rows.forEach(function (o) {
      var n = o.brand + " " + o.name;
      if (o.image && !pic[n]) pic[n] = o.image;
      if (o.in_stock && o.link && (!cheap[n] || (o.price || 1e9) < (cheap[n].price || 1e9))) cheap[n] = o;
    });
    // A tyre ReifenDirekt.de has no model page for links to its brand page; send it to the tyre itself.
    document.querySelectorAll(".duel").forEach(function (duel) {
      duel.querySelectorAll(".c-top").forEach(function (top) {
        var h = top.querySelector("h3"), o = h && cheap[h.textContent.trim()];
        if (!o) return;
        var side = top.classList.contains("a") ? ".a" : ".b";
        duel.querySelectorAll('[data-c="' + top.dataset.c + '"]' + side + ' a[href*="_Reifen.html"]').forEach(function (a) { a.href = o.link; });
      });
    });
    document.querySelectorAll(".duel .c-top").forEach(function (top) {
      var h = top.querySelector("h3"), shot = top.querySelector(".shot");
      var src = h && pic[h.textContent.trim()];
      if (!src || !shot) return;
      var img = el("img", "tyre-photo"); img.src = src; img.alt = h.textContent.trim(); img.loading = "lazy";
      shot.textContent = ""; shot.classList.add("photo"); shot.appendChild(img);
    });
  }

  function fill() {
    load().then(function (rows) {
      if (!rows.length) { box.hidden = true; return; }
      box.hidden = false;
      photos(rows);
      var seen = {};
      rows.map(function (o) { return o.size; }).sort().forEach(function (s) {
        if (seen[s]) return; seen[s] = 1; var opt = document.createElement("option"); opt.value = s; list.appendChild(opt);
      });
    }).catch(function () { box.hidden = true; });
  }

  function pick(rows, size) {
    var by = {};
    rows.forEach(function (o) {
      if (o.width !== size.w || o.aspect !== size.a || o.rim !== size.r) return;
      var cur = by[o.model];
      if (!cur || (o.in_stock && !cur.in_stock) || (o.in_stock === cur.in_stock && (o.price || 1e9) < (cur.price || 1e9))) by[o.model] = o;
    });
    return by;
  }

  function axle(label, o) {
    var row = el("div", "axle");
    row.appendChild(el("span", "k", label));
    row.appendChild(el("b", null, o.size + (o.load_speed ? " " + o.load_speed : "")));
    row.appendChild(el("span", "p", money(o)));
    if (!o.in_stock) row.appendChild(el("span", "stock", "Not in stock right now"));
    var a = el("a", "button quiet", "See on ReifenDirekt.de"); a.href = o.link; a.rel = "sponsored noopener"; a.target = "_blank";
    row.appendChild(a);
    return row;
  }

  function card(f, r) {
    var o = f || r, c = el("article", "result");
    if (SHOW_PHOTOS && o.image) { var img = el("img"); img.src = o.image; img.alt = o.brand + " " + o.name; img.loading = "lazy"; c.appendChild(img); }
    c.appendChild(el("span", "tag", USE[o.use] || ""));
    c.appendChild(el("h3", null, o.brand + " " + o.name));
    var more = document.getElementById(o.use);
    if (f && r) { c.appendChild(axle("Front", f)); c.appendChild(axle("Rear", r)); }
    else if (f && !rear.value.trim()) c.appendChild(axle("All four", f));
    else if (f) c.appendChild(axle("Front", f));
    else c.appendChild(axle("Rear", r));
    if (more) { var m = el("a", "why", "Why this tyre"); m.href = "#" + o.use; c.appendChild(m); }
    return c;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var fs = parse(front.value), rs = rear.value.trim() ? parse(rear.value) : null;
    out.textContent = "";
    if (!fs) { out.appendChild(el("p", "note", "Type the size from your tyre’s side, for example 245/35 R19.")); return; }
    if (rear.value.trim() && !rs) { out.appendChild(el("p", "note", "The rear size isn’t a tyre size. Try, for example, 275/35 R19.")); return; }
    out.appendChild(el("p", "note", "Looking…"));
    load().then(function (rows) {
      out.textContent = "";
      var F = pick(rows, fs), R = rs ? pick(rows, rs) : null;
      var both = [], one = [];
      Object.keys(F).concat(R ? Object.keys(R) : []).forEach(function (k, i, all) {
        if (all.indexOf(k) !== i) return;
        if (!R) both.push([F[k], null]);
        else if (F[k] && R[k]) both.push([F[k], R[k]]);
        else one.push([F[k] || null, R[k] || null]);
      });
      var rank = function (p) { return ORDER.indexOf((p[0] || p[1]).use); };
      both.sort(function (a, b) { return rank(a) - rank(b); });
      var title = rs ? fs.label + " front, " + rs.label + " rear" : fs.label;
      if (!both.length) out.appendChild(el("p", "note", "None of the track tyres on this page comes in " + title + " at ReifenDirekt.de right now."));
      else {
        out.appendChild(el("p", "count", both.length + (both.length === 1 ? " track tyre" : " track tyres") + " in " + title));
        var g = el("div", "grid"); both.forEach(function (p) { g.appendChild(card(p[0], p[1])); }); out.appendChild(g);
      }
      if (one.length) {
        out.appendChild(el("p", "count", "Only in one of your sizes"));
        var g2 = el("div", "grid"); one.forEach(function (p) { g2.appendChild(card(p[0], p[1])); }); out.appendChild(g2);
      }
      out.appendChild(el("p", "src", "Sizes, stock and prices from ReifenDirekt.de, updated every night. Check the load index and speed rating your car needs."));
    }).catch(function () { out.textContent = ""; out.appendChild(el("p", "note", "The size search isn’t available right now. The tyres below link to every size.")); });
  });

  fill();
})();
