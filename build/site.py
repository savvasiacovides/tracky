"""Builds every page of trackyapp.eu from one shell, so the menu and footer are the same everywhere.

    python3 build/site.py

Writes index.html, gear/, tyres/, support/, privacy/ and account/ at the repository root. The menu lives in
NAV below and nowhere else (25 November 2026: each page had kept its own copy, and they had drifted:
Tyres twice on the tyres page, Privacy missing from some, Gear and Tyres from others).
"""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import guide, tyres_data  # noqa: E402

VERSION = "20261125"  # bump to refresh cached CSS and JS
NAV = [("features", "Features", "/#app"), ("gear", "Gear", "/gear/"), ("tyres", "Tyres", "/tyres/"), ("support", "Support", "/support/")]
FOOT = [
    ("Tracky", [("Features", "/#app"), ("Free and Pro", "/#pro"), ("Join the test", "/#join")]),
    ("Guides", [("Gear", "/gear/"), ("Tyres", "/tyres/")]),
    ("Help", [("Support", "/support/"), ("Privacy Policy", "/privacy/"), ("Your account", "/account/"), ("info@trackyapp.eu", "mailto:info@trackyapp.eu")]),
]
e = html.escape


def part(name):
    return open(os.path.join(HERE, "parts", name + ".html")).read()


def shell(key, title, description, path, body, css=(), js=(), dark=False, head_extra=""):
    links = "".join(
        f'<li><a href="{href}"{" aria-current=\"page\"" if k == key else ""}>{e(label)}</a></li>' for k, label, href in NAV)
    foot = "".join(
        f'<div><h2>{e(h)}</h2><ul>{"".join(f"<li><a href=\"{u}\">{e(t)}</a></li>" for t, u in items)}</ul></div>' for h, items in FOOT)
    sheets = "".join(f'<link rel="stylesheet" href="{c}?v={VERSION}">' for c in ("/assets/css/screens.css", "/assets/css/site.css", *css))
    scripts = "".join(f'<script src="{s}?v={VERSION}" defer></script>' for s in ("/assets/site.js", *js))
    acct_current = ' aria-current="page"' if key == "account" else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="https://trackyapp.eu{path}">
<meta property="og:image" content="https://trackyapp.eu/assets/icon-512.png">
<link rel="canonical" href="https://trackyapp.eu{path}">
<meta name="theme-color" content="{'#181b1f' if dark else '#e4e6e1'}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
{sheets}{head_extra}
</head>
<body class="{'dark' if dark else 'light'} page-{key}">
<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap">
  <a class="mark" href="/"><img src="/assets/icon-96.png" alt="" width="32" height="32"><span>Tracky</span></a>
  <nav class="mainnav" id="site-menu" aria-label="Main"><ul>{links}</ul></nav>
  <button class="menu" type="button" aria-expanded="false" aria-controls="site-menu">Menu</button>
  <a class="acct out" href="/account/"{acct_current} data-acct><span class="face" aria-hidden="true"></span><span class="who">Account</span></a>
</div></header>
<main id="main">
{body}
</main>
<footer class="foot"><div class="kerb" aria-hidden="true"></div><div class="wrap">
  <div class="grid">
    <div><a class="mark" href="/"><img src="/assets/icon-96.png" alt="" width="32" height="32"><span>Tracky</span></a>
      <p>The lap timer for track days, on iPhone. In testing now.</p></div>
    {foot}
  </div>
  <div class="legal"><span>© 2026 Altivox Operations OÜ, Ahtri tn 12, 15551 Tallinn, Estonia</span><span>Registry code 17520583</span></div>
</div></footer>
{scripts}
</body>
</html>
"""


def write(rel, text):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write(text)
    print("wrote", rel, len(text))


# ---------------------------------------------------------------- Home

def lap_path():
    L = json.loads(re.search(r'>(.*)</script>', part("lap_data"), re.S).group(1))
    pts = list(zip(L["x"], L["y"]))
    d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + " Z"
    sx, sy = pts[0]
    # The start/finish line: square to the direction of travel at the first point.
    import math
    dx, dy = pts[3][0] - pts[0][0], pts[3][1] - pts[0][1]
    n = math.hypot(dx, dy) or 1
    nx, ny = -dy / n * 16, dx / n * 16
    sf = f'<line class="sf" x1="{sx - nx:.1f}" y1="{sy - ny:.1f}" x2="{sx + nx:.1f}" y2="{sy + ny:.1f}"/>'
    return d, sf, (sx, sy)


def home():
    d, sf, (sx, sy) = lap_path()
    tour = part("tour_grid")
    hero = f"""<section class="hero" aria-labelledby="hero-h"><div class="wrap hero-grid">
  <div class="hero-copy">
    <h1 class="display" id="hero-h"><span>Press START.</span> <span>The laps time</span> <span>themselves.</span></h1>
    <p class="lede">Tracky is the lap timer for track days, on iPhone. It times every lap and sector, records the car's engine, your heart rate and video, and shows you where the time went.</p>
    <div class="cta"><a class="btn primary" href="#join">Join the test</a><a class="btn" href="#app">See the app</a></div>
    <ul class="facts"><li>Finds the track by itself</li><li>GPS, OBD, GoPro, heart rate</li><li>Free to time</li></ul>
  </div>
  <figure class="lap scene" aria-labelledby="lap-cap">
    <svg class="circuit" viewBox="20 0 360 404" role="img" aria-label="Outline of Achna Speedway with a car lapping it">
      <path class="casing" d="{d}"/><path class="surface" d="{d}"/><path class="racing" d="{d}"/>{sf}
      <circle class="car" r="9" cx="{sx:.1f}" cy="{sy:.1f}" data-dot/>
    </svg>
    <div class="tower" aria-hidden="true">
      <div class="lapclock"><span>Lap</span><b data-f="lap">0:00.00</b></div>
      <div class="gap" data-gapcls><span>Gap to best</span><b data-f="gap">0.00</b></div>
      <div><span>Speed</span><b><i data-f="speed">0</i><small>km/h</small></b></div>
      <div><span>Gear</span><b data-f="gear">3</b></div>
      <div><span>Revs</span><b data-f="rpm">0</b></div>
    </div>
    <figcaption id="lap-cap">A real lap, replayed: Achna Speedway in Cyprus, 1:11.572, with the car's own speed, gear and revs.</figcaption>
  </figure>
</div></section>"""

    app = f"""<section class="sec app-sec on-dark" id="app" aria-labelledby="app-h"><div class="wrap">
  <div class="sec-head"><h2 id="app-h">Everything from the paddock to the drive home.</h2>
    <p class="lede">Drive, look back at every lap, then share it. These are Tracky's own screens, drawn here with example figures.</p></div>
  <div class="tour">{tour}</div>
</div></section>"""

    looks = f"""<section class="sec looks-sec" aria-labelledby="looks-h"><div class="wrap">
  <div class="sec-head"><h2 id="looks-h">Your lap on video, in the look you choose.</h2>
    <p class="lede">Tracky draws your speed, revs, gap and the map over every lap you film, lined up to the frame. The same real lap as above.</p></div>
  {part("looks_stage")}
</div></section>"""

    plans = f"""<section class="sec plans" id="pro" aria-labelledby="plans-h"><div class="wrap">
  <div class="sec-head"><h2 id="plans-h">Free to time. Pro to get faster.</h2>
    <p class="lede">Everything you need on track is free: timing, devices, graphs and the Paddock. Tracky Pro adds the coach, CarPlay, your crew live and Tracky Cloud. One payment, kept for good.</p></div>
  <div class="plans-grid">
    <div class="sheet">{part("compare")}</div>
    <div>{part("carplay")}</div>
  </div>
  <p class="fine">Price in euros including VAT. Tracky Pro arrives with the App Store release.</p>
</div></section>"""

    gear = f"""<section class="sec gear-sec on-dark" id="kit" aria-labelledby="gear-h"><div class="wrap">
  <div class="sec-head"><h2 id="gear-h">Works with the gear you already own.</h2>
    <p class="lede">Start with just your iPhone. Add a GPS receiver for sharper times, an OBD reader for the engine, a GoPro and a heart-rate strap. <a href="/gear/">What we would buy</a>.</p></div>
  {part("gear_row")}
  <p class="small" style="margin-top:18px">Product names are trademarks of their owners. Drawings are illustrations.</p>
</div></section>"""

    circuits = f"""<section class="sec circ-sec" aria-labelledby="circ-h"><div class="wrap">
  <div class="sec-head"><h2 id="circ-h">From your local track to Spa.</h2>
    <p class="lede">Tracky finds the start line by itself, at any circuit you drive. At the Nürburgring it uses the published lines: Bridge to Gantry on tourist days, full laps on track days, the GP circuit and the 24h layout.</p></div>
  </div>
  {part("circ_strip")}
  <div class="wrap"><p class="fine">Outlines from the <a href="https://github.com/TUMFTM/racetrack-database">TUM racetrack-database</a> (LGPL-3.0), based on © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> (ODbL).</p></div>
</section>"""

    form = part("tester_form").replace('class="tester-form"', 'class="tester-form form"')
    join = f"""<section class="sec on-dark" id="join" aria-labelledby="join-h"><span id="test"></span><div class="wrap join-grid">
  <div><h2 id="join-h">Test Tracky before it launches.</h2>
    <p class="lede">Testers get each new build through Apple's TestFlight app and tell us how it does at the track.</p>
    <ul class="perks"><li>New builds as soon as they are ready</li><li>Your devices and your circuits shape what comes next</li><li>Free while it is in testing</li></ul></div>
  {form}
</div></section>"""

    body = hero + app + looks + plans + gear + circuits + join + part("lap_data")
    write("index.html", shell("home", "Tracky: the lap timer for track days, on iPhone",
                              "Tracky is a lap timer for track days on iPhone. Press START and every lap is timed, then see where the time went.",
                              "/", body, js=("/account/config.js", "/assets/home.js")))


# ---------------------------------------------------------------- Gear and tyres

def guide_page(key, title, h1, lede, kinds, extra_top="", honest="", rules="", head_title="", desc="", path="", kind_fn=guide.kind, js=()):
    jump = "".join(f'<li><a href="#{k["id"]}">{e(k["nav"])}</a></li>' for k in kinds)
    body = f"""<div class="wrap guide-head">
  <h1>{e(h1)}</h1>
  <p class="lede">{lede}</p>
  {extra_top}
  <ul class="jump">{jump}</ul>
  <p class="honest">{honest}</p>
</div>
{"".join(kind_fn(k) for k in kinds)}
<section class="kind guide-end" aria-labelledby="how-h"><div class="wrap"><h2 id="how-h">How we choose</h2><div class="rules">{rules}</div></div></section>
{guide.DUEL_SCRIPT}"""
    write(path.strip("/") + "/index.html", shell(key, head_title, desc, path, body, js=js))


def gear():
    guide_page("gear", "Gear", "Gear",
               "Tracky times laps with the iPhone alone. This is the gear that makes the laps more exact, adds engine data and video and shows how hard you are working. Tyres have <a href=\"/tyres/\">their own page</a>. For each, the one we would buy, set against the alternatives.",
               guide.KINDS,
               honest="“Tested with Tracky” means we have used it with Tracky in our own cars. Everything else here works with Tracky’s published support but has not been through our own testing yet, and we say so.",
               rules='<div><b>Facts, not hype</b><p>Every figure is the maker’s own unless it says ours. We say plainly what we have tested and what we have not.</p></div>'
                     '<div><b>Every choice, one verdict</b><p>We show more than one option for each kind of gear and tell you which one we would buy and why.</p></div>'
                     '<div><b>Partner links</b><p>Amazon links earn Tracky a small commission, at no cost to you, whichever product you choose. As an Amazon Associate, Tracky earns from qualifying purchases.</p></div>',
               head_title="Tracky – Gear: GPS, OBD, cameras and heart rate compared",
               desc="GPS receivers, OBD readers, cameras and heart-rate straps for Tracky: three choices each, compared, with the one we would buy.",
               path="/gear/")


def tyres():
    def kind_tyres(u):
        h = guide.kind(u)
        h = h.replace("Figures from each maker unless marked as ours.", "Figures from each maker or the test named.")
        return h.replace("Prices change, so they are on Amazon.", "Prices change, so they are on ReifenDirekt.de.")
    guide.ICON["tyre"] = guide.ICON.get("tyre") or '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="7"/></svg>'
    search = """<section id="size-search" class="size-search" aria-labelledby="size-h" hidden>
    <h2 id="size-h">Find track tyres in your size</h2>
    <form autocomplete="off">
      <label>Front<input name="front" list="tyre-sizes" inputmode="text" placeholder="245/35 R19" required></label>
      <label>Rear, if different<input name="rear" list="tyre-sizes" inputmode="text" placeholder="275/35 R19"></label>
      <button class="button" type="submit">Find tyres</button>
    </form>
    <datalist id="tyre-sizes"></datalist>
    <div class="results" aria-live="polite"></div>
  </section>"""
    guide_page("tyres", "Tyres", "Tyres",
               "Nothing you bolt on changes a lap time as much as the tyres. Choose by how you use the car: for each, the one we would buy, set against the alternatives. Tracky shows the difference: put the tyres in your car’s details, then compare a session on the old set with one on the new.",
               tyres_data.USES, extra_top=search,
               honest="We have not tested these tyres ourselves. Every figure is the maker’s own or comes from the independent test named beside it. Treadwear (UTQG) is the American wear grade: higher lasts longer, and it is only comparable within one maker’s range.",
               rules='<div><b>By use, not by brand</b><p>The right tyre depends on how often you are on track, whether you drive there, and how often it rains.</p></div>'
                     '<div><b>Tests, not hype</b><p>Our picks follow independent tests and what each maker says the tyre is for. We name the test beside every result.</p></div>'
                     '<div><b>Partner links</b><p>ReifenDirekt.de links earn Tracky a small commission, at no cost to you, whichever tyre you choose.</p></div>',
               head_title="Tracky – Tyres for track days, compared by use",
               desc="Track-day tyres compared by how you use the car: road car with track days, regular track days, smaller cars and 200-treadwear classes, and dry-day track cars.",
               path="/tyres/", kind_fn=kind_tyres, js=("/account/config.js", "/tyres/search.js"))


# ---------------------------------------------------------------- Support and privacy

def slug(t):
    return re.sub(r"[^a-z0-9]+", "-", html.unescape(re.sub("<[^>]+>", "", t)).lower()).strip("-")


def prose_page(key, name, h1, lede, title, desc, transform=lambda b: b):
    body = transform(part(name))
    heads = []
    def add_id(m):
        attrs, text = m.group(1), m.group(2)
        if "id=" in attrs:
            i = re.search(r'id="([^"]+)"', attrs).group(1)
        else:
            i = slug(text); attrs += f' id="{i}"'
        heads.append((i, re.sub("<[^>]+>", "", text)))
        return f"<h2{attrs}>{text}</h2>"
    body = re.sub(r"<h2([^>]*)>(.*?)</h2>", add_id, body, flags=re.S)
    toc = "".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in heads)
    page = f"""<div class="wrap page-head"><h1>{e(h1)}</h1><p class="lede">{lede}</p></div>
<div class="wrap prose-grid"><aside aria-label="On this page"><ul>{toc}</ul></aside><article class="prose">
{body}
</article></div>"""
    write(key + "/index.html", shell(key, title, desc, f"/{key}/", page))


def support():
    def t(b):
        return re.sub(r'<div class="contact">\s*(<a[^>]*>[^<]*</a>)\s*(<p>.*?</p>)\s*</div>', r'<div class="contact-card">\1\2</div>', b, flags=re.S)
    prose_page("support", "support_body", "Support", "Answers to common questions. If yours isn't here, write to us.",
               "Tracky – Support", "Help with Tracky: lap timing, connecting GPS receivers and OBD readers, video, and your account.", t)


def privacy():
    prose_page("privacy", "privacy_body", "Privacy Policy", "Effective 23 November 2026, version 2.",
               "Tracky – Privacy Policy", "How Tracky, provided by Altivox Operations OÜ, collects and uses personal data, and your rights.")


# ---------------------------------------------------------------- Account

def account():
    body = part("account_body")
    write("account/index.html", shell("account", "Tracky – Your account", "Your Tracky account on the web: your profile, sessions, best laps, what you share, your cars and your choices.",
                                      "/account/", body, css=("/account/account.css",), js=("/account/config.js", "/account/tracky-file.js", "/account/account.js"), dark=True))


if __name__ == "__main__":
    home(); gear(); tyres(); support(); privacy(); account()
