"""Gear guide data and the head-to-head blocks shared by /gear/ and /tyres/. Every figure is the maker's own unless marked as ours.
Moved here from the old one-off generator on 25 November 2026; build/site.py renders the pages."""
import html, os, re, sys

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAG = "trackyapp-21"
def amz(asin): return f"https://www.amazon.co.uk/dp/{asin}?tag={TAG}"
from urllib.parse import quote
def rd(path): return "https://www.awin1.com/cread.php?awinmid=11823&awinaffid=3164653&ued=" + quote("https://www.reifendirekt.de" + path, safe="")
def href(ref): return rd(ref[3:]) if ref.startswith("RD:") else amz(ref)

ICON = {
 "hr": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 40S7 30 7 18a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 12-17 22-17 22z"/><path d="M12 22h7l3-6 4 12 3-6h7"/></svg>',
 "cam": '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="13" width="36" height="24" rx="5"/><circle cx="28" cy="25" r="6.5"/><path d="M11 18h5"/></svg>',
 "obd": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 17h32l-4 16H12z"/><path d="M16 23h2M23 23h2M30 23h2M19 28h2M27 28h2"/></svg>',
 "tyre": '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="7"/><path d="M24 7v4M24 37v4M7 24h4M37 24h4M12 12l3 3M33 33l3 3M36 12l-3 3M15 33l-3 3"/></svg>',
 "gps": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 43s-13-12.4-13-22a13 13 0 0 1 26 0c0 9.6-13 22-13 22z"/><circle cx="24" cy="21" r="4.5"/></svg>',
}

# status: ("yes", text) tested by us; ("soon", text); ("", text) supported, not tested by us
KINDS = [
 dict(id="gps", nav="GPS", icon="gps", title="GPS receiver: sharper lap times",
  why="The iPhone gives Tracky one position a second. At 160 km/h that is 44 metres between points, so the line, the sectors and the lap time are partly guessed. A 25 Hz receiver gives Tracky a point every 1.8 metres at the same speed.",
  verdict=[("Our pick: RaceBox Mini.", "It is the receiver Tracky is developed and tested with, Tracky wakes it when you press START, and it fixes the biggest weakness of timing with a phone. Buy the Mini S instead only if you want the receiver to keep recording when the phone is not in the car. The Dual XGPS160 gives 10 positions a second, works with many other apps and is approved by Apple for use with Tracky, but we have not tested it with Tracky yet.")],
  prods=[
   dict(name="RaceBox Mini", brand="RaceBox", asin="B0B46TK6R9", badge="Our pick", top=True, forwho="For anyone timing laps with Tracky",
        status=("yes","Tested with Tracky"), facts=[("25 Hz","positions a second"),("10 cm","accuracy, maker’s figure"),("1100 mAh","battery"),("106 g","weight")],
        pros=["The receiver Tracky is built and tested with","Woken by Tracky when you press START"], cons=["Needs the phone connected to record"]),
   dict(name="RaceBox Mini S", brand="RaceBox", asin="B0C8JCB8TZ", badge="Records on its own", forwho="For drivers who leave the phone in the paddock",
        status=("","Same receiver family, not yet tested by us"), facts=[("25 Hz","positions a second"),("130 min","recording at 25 Hz without a phone"),("325 min","at 10 Hz"),("1100 mAh","battery")],
        pros=["Keeps recording with no phone connected","Same 25 Hz and accuracy as the Mini"], cons=["Costs more than the Mini","Not yet tested with Tracky"]),
   dict(name="Dual XGPS160", brand="Dual", asin="B00E65TNYE", badge="Works with any app", forwho="For drivers who also use it with other apps",
        status=("","Approved by Apple for Tracky, not yet tested by us"), facts=[("10 Hz","positions a second"),("~10 h","battery, maker’s figure"),("1400 mAh","battery"),("5","devices at once")],
        pros=["Apple approved it for use with Tracky","Works with flight, racing and map apps too"], cons=["10 Hz, below the 25 Hz RaceBoxes","Not yet tested with Tracky"]),
  ],
  table=dict(cols=["iPhone alone","RaceBox Mini","RaceBox Mini S","Dual XGPS160"], pick=1, rows=[
   ("Positions a second",["1","25","25","10"],[1,2]),
   ("Records laps without the phone",["No","No","Yes","No"],[2]),
   ("Tested with Tracky",["Yes","Yes","Not yet","Not yet"],[0,1]),
   ("Price",["Free","AMZ:B0B46TK6R9","AMZ:B0C8JCB8TZ","AMZ:B00E65TNYE"],[]),
  ]),
  own="<b>Already have a receiver?</b> Tracky also reads Qstarz, PGEAR, Columbus, Racebox.cc and other Bluetooth LE receivers, and Garmin GLO through the iPhone. Add a device in Tracky to see the full list."),

 dict(id="obd", nav="Engine data", icon="obd", title="OBD reader: see what the engine did",
  why="Your lap tells you where you were slow. The OBD reader tells you why: revs, throttle, speed and temperatures from the car itself, on the same graph as every lap.",
  verdict=[("Our pick: OBDLink MX+.", "It is the reader we use in our own cars. In our own car it delivered about 30 rev readings a second. It also reads more of a car’s networks than the others here. If you want to spend less, the Carista OBD works with Tracky and is a fraction of the price. The OBDLink CX suits BMW and MINI owners who also code their car with BimmerCode.")],
  prods=[
   dict(name="OBDLink MX+", brand="OBDLink", asin="B07JFRFJG6", badge="Our pick", top=True, forwho="For the fastest engine data",
        status=("yes","Tested with Tracky in our cars"), facts=[("~30 / s","rev readings in our car"),("STN2255","chip, faster than ELM327"),("MS-CAN, SW-CAN","extra networks"),("Classic","Bluetooth, made for iPhone")],
        pros=["The quickest data we have measured","Also reads MS-CAN and SW-CAN networks"], cons=["The most expensive here"]),
   dict(name="Carista OBD", brand="Carista", asin="B0BBS73F6J", badge="Best value", forwho="For engine data on a budget",
        status=("yes","Tested with Tracky"), facts=[("Bluetooth LE","connects to iPhone"),("ELM327","v1.4 command set"),("Diagnostics","in Carista’s own app")],
        pros=["Works with Tracky out of the box","Costs a fraction of the MX+"], cons=["We have not measured its data rate yet"]),
   dict(name="OBDLink CX", brand="OBDLink", asin="B08NFLL3NT", badge="For BMW and MINI", forwho="For BMW and MINI owners who code",
        status=("","Supported by Tracky, not yet tested by us"), facts=[("Bluetooth 5.1","LE"),("HS-CAN","pins 6 and 14 only"),("<1 mA","sleep current"),("BimmerCode","co-developed")],
        pros=["Made with BimmerCode for coding","Can stay plugged in"], cons=["Does not support every OBD-II protocol","Not yet tested with Tracky"]),
  ],
  table=dict(cols=["OBDLink MX+","Carista OBD","OBDLink CX"], pick=0, rows=[
   ("Connection",["Classic Bluetooth","Bluetooth LE","Bluetooth LE 5.1"],[]),
   ("Car coverage",["All OBD-II, plus MS-CAN and SW-CAN","OBD-II","HS-CAN only"],[0]),
   ("Data rate with Tracky",["~30 rev readings / s (our car)","Not measured yet","Not measured yet"],[0]),
   ("Tested with Tracky",["Yes","Yes","Not yet"],[0,1]),
   ("Price",["AMZ:B07JFRFJG6","AMZ:B0BBS73F6J","AMZ:B08NFLL3NT"],[]),
  ]),
  own="<b>Already have a reader?</b> Most Bluetooth LE OBD readers that speak the ELM327 language work with Tracky, whatever they are called. Plug it in, switch the ignition on and add it in Tracky. Not every car sends gear or oil pressure over standard OBD."),

 dict(id="video", nav="Cameras", icon="cam", title="Camera: watch every lap back",
  why="Video shows what the data cannot: your hands, the kerbs, the traffic. Tracky puts your speed, gap and revs over the video and lines it up with the lap.",
  verdict=[("Our pick: GoPro MISSION 1 PRO.", "It is the camera we use. Tracky starts and stops it when you press START, so you never forget to record, and its 1-inch sensor keeps detail in shade and at dusk. The HERO13 Black costs less, is started by Tracky too, and has built-in GPS. The DJI Osmo Action 6 has an excellent picture, but Tracky cannot start it: you add its video from Photos afterwards.")],
  prods=[
   dict(name="GoPro MISSION 1 PRO", brand="GoPro", asin="B0GWFKMJYG", badge="Our pick", top=True, forwho="For the best picture, started by Tracky",
        status=("yes","Tested with Tracky"), facts=[("1-inch","50 MP sensor"),("8K","open gate video"),("3 h+","4K recording, maker’s figure"),("20 m","waterproof")],
        pros=["Started and stopped by Tracky","Largest sensor here"], cons=["The most expensive here"]),
   dict(name="GoPro HERO13 Black", brand="GoPro", asin="B0DCQVQDQ7", badge="Best value", forwho="For a proven GoPro that Tracky starts",
        status=("","Started by Tracky, not yet tested by us"), facts=[("5.3K60","video"),("GPS","built in"),("1900 mAh","battery"),("10 m","waterproof")],
        pros=["Started and stopped by Tracky","Built-in GPS"], cons=["Smaller sensor, weaker in low light","Not yet tested with Tracky"]),
   dict(name="DJI Osmo Action 6", brand="DJI", asin="B0FM3X3DW5", badge="Not a GoPro", forwho="For DJI fans happy to add video afterwards",
        status=("","Video added from Photos"), facts=[("1/1.1-inch","sensor"),("f/2.0–4.0","variable aperture"),("50 GB","built-in storage"),("4 h","recording, maker’s figure")],
        pros=["Large sensor and adjustable aperture","Storage built in"], cons=["Tracky cannot start or stop it","No GPS that Tracky can read"]),
  ],
  table=dict(cols=["MISSION 1 PRO","HERO13 Black","Osmo Action 6"], names=["GoPro MISSION 1 PRO","GoPro HERO13 Black","DJI Osmo Action 6"], pick=0, rows=[
   ("Started by Tracky",["Yes","Yes","No, add from Photos"],[0,1]),
   ("Sensor",["1-inch","1/1.9-inch","1/1.1-inch"],[0]),
   ("Top video",["8K","5.3K60","8K"],[0,2]),
   ("GPS that Tracky reads",["Not stated","Yes","No"],[1]),
   ("Waterproof",["20 m","10 m","20 m"],[0,2]),
   ("Tested with Tracky",["Yes","Not yet","Not yet"],[0]),
   ("Price",["AMZ:B0GWFKMJYG","AMZ:B0DCQVQDQ7","AMZ:B0FM3X3DW5"],[]),
  ]),
  own="<b>Already have a camera?</b> Tracky starts and stops GoPro HERO9 and newer, MAX2 and the MISSION 1 series. Video from any other camera can be added from Photos: Tracky lines it up with your laps by the time it was recorded."),

 dict(id="heart", nav="Heart rate", icon="hr", title="Heart-rate strap: see the stress",
  why="Your heart rate shows where a lap is hard work: the corners you brace for, the traffic you fight, the stint where you start to tire. Tracky records it with every lap. It stays private unless you choose to share it.",
  verdict=[("Our pick: Garmin HRM 600.", "It is the strap we drive with. It charges like a phone instead of taking coin cells, lasts up to two months at an hour a day, and the strap goes in the wash once the pod is off. It also talks to Tracky and a Garmin watch at the same time. The Polar H10 is the strap others measure their accuracy against and costs less. Choose the Polar Verity Sense if a strap round your chest is uncomfortable under a harness: it is worn on the arm, but an arm sensor is optical and less exact than a chest strap. Garmin’s cheaper HRM 200 gives the same heart rate with a coin cell instead of a charger.")],
  prods=[
   dict(name="Garmin HRM 600", brand="Garmin", asin="B0F7ZGDDCX", badge="Our pick", top=True, forwho="For a strap you charge and forget",
        status=("yes","Tested with Tracky"), facts=[("2 months","rechargeable, at 1 h a day"),("Chest","electrical sensor"),("3","Bluetooth links at once"),("5 ATM","water rating")],
        pros=["Rechargeable, no coin cells","Washable strap, works with Garmin watches too"], cons=["The most expensive here"]),
   dict(name="Polar H10", brand="Polar", asin="B07PM54P4N", badge="Most accurate", forwho="For the most exact heart rate for less",
        status=("","Works with Tracky’s heart-rate support"), facts=[("ECG","chest sensor"),("400 h","coin-cell battery"),("30 m","water rating"),("60 g","with strap")],
        pros=["The accuracy benchmark for chest straps","Costs less than the HRM 600"], cons=["Battery needs a coin cell, not a charger"]),
   dict(name="Polar Verity Sense", brand="Polar", asin="B08TRGNGF6", badge="No chest strap", forwho="For drivers who dislike a chest strap",
        status=("","Works with Tracky’s heart-rate support"), facts=[("Arm","optical sensor"),("30 h","rechargeable"),("2","Bluetooth links at once"),("19 g","weight")],
        pros=["Nothing round your chest under the belts","Rechargeable"], cons=["Optical: less exact than a chest strap"]),
  ],
  table=dict(cols=["Garmin HRM 600","Polar H10","Polar Verity Sense"], pick=0, rows=[
   ("Worn on",["Chest","Chest","Arm"],[]),
   ("Sensor",["Electrical","Electrical (ECG)","Optical"],[0,1]),
   ("Battery",["Up to 2 months, rechargeable","Up to 400 h, coin cell","Up to 30 h, rechargeable"],[0]),
   ("Bluetooth links at once",["3","Not stated","2"],[0]),
   ("Water",["5 ATM (50 m)","30 m","50 m"],[0,2]),
   ("Tested with Tracky",["Yes","Not yet","Not yet"],[0]),
   ("Price",["AMZ:B0F7ZGDDCX","AMZ:B07PM54P4N","AMZ:B08TRGNGF6"],[]),
  ]),
  own="<b>Already have a Garmin watch?</b> It can send its heart rate to Tracky: hold the menu button, then Sensors &amp; Accessories, Wrist Heart Rate, Broadcast Heart Rate. Any Bluetooth heart-rate strap works the same way as the three above.")
]

def e(s): return html.escape(s, quote=True)

# The device drawings from the home page, used until a product photo is added to gear/img/.
_ART = re.findall(r'<div class="art">(.*?)</div>', open(os.path.join(os.path.dirname(__file__), "parts", "gear_row.html")).read())
ART = {"gps": _ART[0], "obd": _ART[1], "cam": _ART[2], "hr": _ART[3]}

def drawn(k, p):
    if k["icon"] not in ART:
        return f'<div class="plate">{ICON[k["icon"]]}<span>{e(p["brand"])}</span><strong>{e(p["name"].replace(p["brand"]+" ",""))}</strong></div>'
    return f'<div class="plate art">{ART[k["icon"]]}<span>{e(p["brand"])}</span><strong>{e(p["name"].replace(p["brand"]+" ",""))}</strong></div>'
def link(ref, text, cls, where=""):
    tail = f'<span class="where"> {e(where)}</span>' if where else ""
    return f'<a class="{cls}" href="{href(ref)}" rel="sponsored noopener" target="_blank">{e(text)}{tail}</a>'

def shot(k, p):
    slug = re.sub(r"[^a-z0-9]+", "-", p["name"].lower()).strip("-")
    img = os.path.join(SITE, "gear", "img", slug + ".webp")
    if os.path.exists(img):
        inner = f'<img src="/gear/img/{slug}.webp" alt="{e(p["name"])}" loading="lazy">'
    else:
        inner = drawn(k, p)
    return f'<div class="shot"><span class="badge">{e(p["badge"])}</span>{inner}</div>'

def cell_val(v):
    if v.startswith("AMZ:"): return link(v[4:], "See price", ""), ""
    if v.startswith("RD:"): return link(v, "See price", ""), ""
    no = v in ("No", "Not yet", "Not published", "Not measured yet", "Not stated") or v.startswith("No,")
    return e(v), (" no" if no else "")

def plate(k, p):
    slug = re.sub(r"[^a-z0-9]+", "-", p["name"].lower()).strip("-")
    if os.path.exists(os.path.join(SITE, "gear", "img", slug + ".webp")):
        return f'<div class="shot"><img src="/gear/img/{slug}.webp" alt="{e(p["name"])}" loading="lazy"></div>'
    return f'<div class="shot drawn">{drawn(k, p)}</div>'

def col(k, name, idx, side, hidden):
    """One side of the head-to-head: picture, name, status, the compared rows, pros and cons, buy."""
    t = k["table"]; full = t.get("names", t["cols"])[idx]; p = next((x for x in k["prods"] if x["name"] == full), None)
    h = ' hidden' if hidden else ''
    out = []
    if p:
        st, sttext = p["status"]
        out.append(f'<div class="c-top {side}" data-c="{idx}"{h}>{plate(k,p)}<span class="tag">{e(p["badge"])}</span><h3{' class="wrap"' if k.get("wrap") else ''}>{e(p["name"])}</h3><p class="for">{e(p["forwho"])}</p><span class="status {st}">{e(sttext)}</span></div>')
    else:
        out.append(f'<div class="c-top {side}" data-c="{idx}"{h}><div class="shot"><div class="plate">{ICON[k["icon"]]}<strong>{e(name)}</strong></div></div><span class="tag">Free</span><h3>{e(name)}</h3><p class="for">What you have without extra gear</p></div>')
    for label, vals, best in t["rows"]:
        if label == "Price": continue
        v, no = cell_val(vals[idx]); b = " best" if idx in best else ""
        out.append(f'<div class="c-row {side}{b}{no}" data-c="{idx}"{h}><span class="k">{e(label)}</span><b>{v}</b></div>')
    if p:
        pc = "".join(f'<li class="p">{e(x)}</li>' for x in p["pros"]) + "".join(f'<li class="c">{e(x)}</li>' for x in p["cons"])
        out.append(f'<ul class="pc c-row {side}" data-c="{idx}"{h}>{pc}</ul>')
        out.append(f'<div class="c-buy {side}" data-c="{idx}"{h}>{(link(p["url"], "See price", "button" + (" quiet" if side=="b" else ""), "on ReifenDirekt.de") if p.get("url") else link(p["asin"], "See price on Amazon", "button" + (" quiet" if side=="b" else "")))}</div>')
    else:
        out.append(f'<div class="c-buy {side}" data-c="{idx}"{h}><span class="free">Nothing to buy</span></div>')
    return out

def duel(k):
    t = k["table"]; pk = t["pick"]; others = sorted((i for i in range(len(t["cols"])) if i != pk), key=lambda i: t["cols"][i] == "iPhone alone")
    a = col(k, t["cols"][pk], pk, "a", False)
    bs = [col(k, t["cols"][i], i, "b", n > 0) for n, i in enumerate(others)]
    # Interleave: each row of the pick beside the same row of every challenger (only one shown).
    cells = []
    for r in range(len(a)):
        cells.append(a[r])
        for b in bs: cells.append(b[r] if r < len(b) else "")
    chips = "".join(f'<button type="button" role="tab" aria-selected="{"true" if n==0 else "false"}" data-c="{i}">{e(t["cols"][i])}</button>' for n, i in enumerate(others))
    return (f'<div class="duel" data-pick="{pk}"><div class="vs"><span class="me">Our pick</span><span class="vs-word">vs</span>'
            f'<div class="chips" role="tablist" aria-label="Compare our pick with">{chips}</div></div>'
            f'<div class="grid">{"".join(cells)}</div>'
            f'<p class="src">Figures from each maker unless marked as ours. Purple: best in the row. Prices change, so they are on {"ReifenDirekt.de" if k["id"]=="tyres" else "Amazon"}.</p></div>')

def kind(k):
    head, rest = k["verdict"][0]
    first = rest.split(". ")[0] + "."
    more = rest[len(first):].strip()
    verdict = (f'<details class="verdict"><summary><b>{e(head)}</b> {e(first)}</summary><p>{e(more)}</p></details>' if more
               else f'<div class="verdict"><p><b>{e(head)}</b> {e(first)}</p></div>')
    return (f'<section class="kind" id="{k["id"]}" aria-labelledby="{k["id"]}-h"><div class="wrap"><h2 id="{k["id"]}-h">{e(k["title"])}</h2>'
            f'<p class="why">{e(k["why"])}</p>{verdict}{duel(k)}<p class="own">{k["own"]}</p></div></section>')


DUEL_SCRIPT = """<script>
document.querySelectorAll('.duel').forEach(function (d) {
  var tabs = d.querySelectorAll('.chips [role=tab]');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
      d.querySelectorAll('.grid .b').forEach(function (c) { c.hidden = c.dataset.c !== t.dataset.c; });
    });
  });
});
</script>"""
