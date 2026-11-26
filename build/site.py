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

VERSION = "20261127"  # bump to refresh cached CSS and JS
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
      <p>Telemetry, redefined. On iPhone, in testing now.</p></div>
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
    tour = part("tour_grid")
    hero = f"""<section class="hero" aria-labelledby="hero-h"><div class="wrap hero-stack">
  <h1 class="mega" id="hero-h"><img src="/assets/icon-512.png" alt="" width="512" height="512"><span>Tracky</span></h1>
  <div class="stage">{part("hero_phone")}</div>
  <div class="pitch">
    <p class="tagline">Telemetry, redefined.</p>
    <p class="lede">Lap times, sectors, engine data and video for every lap. On iPhone.</p>
    <div class="cta"><a class="btn primary" href="#join">Become a tester</a><a class="btn" href="#app">See the app</a></div>
  </div>
</div></section>"""

    app = f"""<section class="sec app-sec on-dark" id="app" aria-labelledby="app-h"><div class="wrap">
  <div class="sec-head"><h2 id="app-h">One app. Every lap.</h2>
    <p class="lede">Drive, look back at every lap, then share it. These are Tracky's own screens, drawn here with example figures.</p></div>
  <div class="tour">{tour}</div>
</div></section>"""

    looks = f"""<section class="sec looks-sec" aria-labelledby="looks-h"><div class="wrap">
  <div class="sec-head"><h2 id="looks-h">Your lap. Your overlay.</h2>
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
  <div class="sec-head"><h2 id="gear-h">Plug in. Find time.</h2>
    <p class="lede">Start with just your iPhone. Add a GPS receiver for sharper times, an OBD reader for the engine, a GoPro and a heart-rate strap. <a href="/gear/">What we would buy</a>.</p></div>
  {part("gear_row")}
  <p class="small" style="margin-top:18px">Product names are trademarks of their owners. Drawings are illustrations.</p>
</div></section>"""

    circuits = f"""<section class="sec circ-sec" aria-labelledby="circ-h"><div class="wrap">
  <div class="sec-head"><h2 id="circ-h">Any circuit. Every corner.</h2>
    <p class="lede">Tracky finds the start line by itself, at any circuit you drive. At the Nürburgring it uses the published lines: Bridge to Gantry on tourist days, full laps on track days, the GP circuit and the 24h layout.</p></div>
  </div>
  {part("circ_strip")}
  <div class="wrap"><p class="fine">Outlines from the <a href="https://github.com/TUMFTM/racetrack-database">TUM racetrack-database</a> (LGPL-3.0), based on © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> (ODbL).</p></div>
</section>"""

    form = part("tester_form").replace('class="tester-form"', 'class="tester-form form"')
    join = f"""<section class="sec on-dark" id="join" aria-labelledby="join-h"><span id="test"></span><div class="wrap join-grid">
  <div><h2 id="join-h">Get on the grid early.</h2>
    <p class="lede">Testers get each new build through Apple's TestFlight app and tell us how it does at the track.</p>
    <ul class="perks"><li>New builds as soon as they are ready</li><li>Your devices and your circuits shape what comes next</li><li>Free while it is in testing</li></ul></div>
  {form}
</div></section>"""

    body = hero + app + looks + plans + gear + circuits + join + part("lap_data")
    write("index.html", shell("home", "Tracky: telemetry, redefined. Lap timing, data and video for track days",
                              "Telemetry, redefined. Tracky times every lap and sector on iPhone, records engine data and video, and shows where the time went.",
                              "/", body, js=("/account/config.js", "/assets/home.js")))


# ---------------------------------------------------------------- Gear and tyres

def guide_page(key, title, h1, lede, kinds, extra_top="", honest="", rules="", head_title="", desc="", path="", kind_fn=guide.kind, js=()):
    jump = "".join(f'<li><a href="#{k["id"]}">{e(k["nav"])}</a></li>' for k in kinds)
    side = extra_top or f'<div class="rules">{rules}</div>'
    body = f"""<div class="wrap guide-head">
  <div class="gh-main">
    <h1>{e(h1)}</h1>
    <p class="lede">{lede}</p>
    <ul class="jump">{jump}</ul>
    <p class="honest">{honest}</p>
  </div>
  <div class="gh-side">{side}</div>
</div>
{'<div class="wrap"><div id="size-results" class="results" aria-live="polite"></div></div>' if extra_top else ''}
{"".join(kind_fn(k) for k in kinds)}
{f'<section class="kind guide-end" aria-labelledby="how-h"><div class="wrap"><h2 id="how-h">How we choose</h2><div class="rules">{rules}</div></div></section>' if extra_top else ''}
{guide.DUEL_SCRIPT}"""
    write(path.strip("/") + "/index.html", shell(key, head_title, desc, path, body, js=js))


def gear():
    guide_page("gear", "Gear", "Gear that works with Tracky",
               "Tracky times laps with the iPhone alone. Add a GPS receiver for more exact laps, an OBD reader for engine data, a camera for video and a heart-rate strap. For each, the one we would buy, compared with the alternatives. Tyres are on <a href=\"/tyres/\">their own page</a>.",
               guide.KINDS,
               honest="“Tested with Tracky” means we have used it with Tracky in our own cars. Everything else here works with Tracky’s published support but has not been through our own testing yet, and we say so.",
               rules='<div><b>Facts, not hype</b><p>Every figure is the maker’s own unless it says ours. We say plainly what we have tested and what we have not.</p></div>'
                     '<div><b>Every choice, one verdict</b><p>We show more than one option for each kind of gear and tell you which one we would buy and why.</p></div>'
                     '<div><b>Partner links</b><p>RaceBox is our partner: its link gives you a discount and earns Tracky a commission. Amazon links earn Tracky a small commission, at no cost to you. As an Amazon Associate, Tracky earns from qualifying purchases.</p></div>',
               head_title="Tracky – Gear: GPS, OBD, cameras and heart rate compared",
               desc="GPS receivers, OBD readers, cameras and heart-rate straps for Tracky: three choices each, compared, with the one we would buy.",
               path="/gear/")


def tyres():
    def kind_tyres(u):
        h = guide.kind(u)
        h = h.replace("Figures from each maker unless marked as ours.", "Figures from each maker or the test named.")
        return h.replace("Prices change, so they are on Amazon.", "Prices change, so you see them when you tap Buy now.")
    guide.ICON["tyre"] = guide.ICON.get("tyre") or '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="7"/></svg>'
    pick = lambda a, t: (f'<fieldset class="axle-pick" data-axle="{a}"{" hidden" if a=="rear" else ""}><legend>{t}</legend>'
        f'<label>Width<select name="{a}-w" required><option value="">Width</option></select></label>'
        f'<label>Height<select name="{a}-a" required disabled><option value="">Height</option></select></label>'
        f'<label>Diameter<select name="{a}-r" required disabled><option value="">Diameter</option></select></label></fieldset>')
    search = f"""<section id="size-search" class="size-search" aria-labelledby="size-h" hidden>
    <h2 id="size-h">Find track tyres in your size</h2>
    <form autocomplete="off">
      {pick("front", "All four")}
      {pick("rear", "Rear")}
      <div class="go"><label class="split"><input type="checkbox" name="split"> Different size at the rear</label>
      <button class="button" type="submit">Find tyres</button></div>
    </form>
  </section>"""
    guide_page("tyres", "Tyres", "Track-day tyres",
               "The tyre we would buy for each kind of driving, compared with its closest rivals on independent test results. Search your size for prices and stock. In Tracky, add the tyres to your car to compare sessions on the old and new set.",
               tyres_data.USES, extra_top=search,
               honest="We have not tested these tyres ourselves. Every figure is the maker’s own or comes from the independent test named beside it. Treadwear (UTQG) is the American wear grade: higher lasts longer, and it is only comparable within one maker’s range.",
               rules='<div><b>Chosen by use</b><p>The right tyre depends on how often you are on track, whether you drive there, and how often it rains.</p></div>'
                     '<div><b>Backed by tests</b><p>Every pick follows independent testing and what the maker built the tyre for. Each result names its source.</p></div>'
                     '<div><b>Partner links</b><p>Buy now takes you to our tyre partner. Tracky earns a small commission at no cost to you, whichever tyre you choose.</p></div>',
               head_title="Tracky – Tyres for track days, compared by use",
               desc="Track-day tyres compared on independent tests: road tyres for track days, road-legal track tyres, 200-treadwear tyres and semi-slicks for track cars.",
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
