"""Builds trackyapp.eu/gear/index.html from the product data below. Every figure is the maker's own unless marked as ours."""
import html, os, re, sys

SITE = sys.argv[1]
TAG = "trackyapp-21"
def amz(asin): return f"https://www.amazon.co.uk/dp/{asin}?tag={TAG}"

ICON = {
 "hr": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 40S7 30 7 18a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 12-17 22-17 22z"/><path d="M12 22h7l3-6 4 12 3-6h7"/></svg>',
 "cam": '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="13" width="36" height="24" rx="5"/><circle cx="28" cy="25" r="6.5"/><path d="M11 18h5"/></svg>',
 "obd": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 17h32l-4 16H12z"/><path d="M16 23h2M23 23h2M30 23h2M19 28h2M27 28h2"/></svg>',
 "gps": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 43s-13-12.4-13-22a13 13 0 0 1 26 0c0 9.6-13 22-13 22z"/><circle cx="24" cy="21" r="4.5"/></svg>',
}

# status: ("yes", text) tested by us; ("soon", text); ("", text) supported, not tested by us
KINDS = [
 dict(id="gps", nav="GPS", icon="gps", title="GPS receiver: sharper lap times",
  why="The iPhone gives Tracky one position a second. At 160 km/h that is 44 metres between points, so the line, the sectors and the lap time are partly guessed. A 25 Hz receiver gives Tracky a point every 1.8 metres at the same speed.",
  verdict=[("Our pick: RaceBox Mini.", "It is the receiver Tracky is developed and tested with, Tracky wakes it when you press START, and it fixes the biggest weakness of timing with a phone. Buy the Mini S instead only if you want the receiver to keep recording when the phone is not in the car. The Dragy Pro has the same 25 Hz rate for less money, but we have not tested it with Tracky yet.")],
  prods=[
   dict(name="RaceBox Mini", brand="RaceBox", asin="B0B46TK6R9", badge="Our pick", top=True, forwho="For anyone timing laps with Tracky",
        status=("yes","Tested with Tracky"), facts=[("25 Hz","positions a second"),("10 cm","accuracy, maker’s figure"),("1100 mAh","battery"),("106 g","weight")],
        pros=["The receiver Tracky is built and tested with","Woken by Tracky when you press START"], cons=["Needs the phone connected to record"]),
   dict(name="RaceBox Mini S", brand="RaceBox", asin="B0C8JCB8TZ", badge="Records on its own", forwho="For drivers who leave the phone in the paddock",
        status=("","Same receiver family, not yet tested by us"), facts=[("25 Hz","positions a second"),("130 min","recording at 25 Hz without a phone"),("325 min","at 10 Hz"),("1100 mAh","battery")],
        pros=["Keeps recording with no phone connected","Same 25 Hz and accuracy as the Mini"], cons=["Costs more than the Mini","Not yet tested with Tracky"]),
   dict(name="Dragy Pro", brand="Dragy", asin="B0DSV36JY9", badge="Best value", forwho="For 25 Hz on a smaller budget",
        status=("","Supported by Tracky, not yet tested by us"), facts=[("25 Hz","positions a second"),("128 MB","memory on board"),("6-axis","motion sensor"),("~12 h","battery at 25 Hz")],
        pros=["25 Hz for less than a RaceBox","Records on its own memory"], cons=["Not yet tested with Tracky","Shorter battery at 25 Hz than at 10 Hz"]),
  ],
  table=dict(cols=["iPhone alone","RaceBox Mini","RaceBox Mini S","Dragy Pro"], pick=1, rows=[
   ("Positions a second",["1","25","25","25"],[1,2,3]),
   ("Records without the phone",["No","No","Yes","Yes"],[2,3]),
   ("Tested with Tracky",["Yes","Yes","Not yet","Not yet"],[0,1]),
   ("Price",["Free","AMZ:B0B46TK6R9","AMZ:B0C8JCB8TZ","AMZ:B0DSV36JY9"],[]),
  ]),
  own="<b>Already have a receiver?</b> Tracky also reads Qstarz, PGEAR, Columbus, Racebox.cc and other Bluetooth LE receivers, and Garmin GLO through the iPhone. Add a device in Tracky to see the full list."),

 dict(id="obd", nav="Engine data", icon="obd", title="OBD reader: see what the engine did",
  why="Your lap tells you where you were slow. The OBD reader tells you why: revs, throttle, speed and temperatures from the car itself, on the same graph as every lap.",
  verdict=[("Our pick: OBDLink MX+.", "It is the reader we use in our own cars. In our Porsche GT4 RS it delivered about 30 rev readings a second. It also reads more of a car’s networks than the others here. If you want to spend less, the Carista OBD works with Tracky and is a fraction of the price. The OBDLink CX suits BMW and MINI owners who also code their car with BimmerCode.")],
  prods=[
   dict(name="OBDLink MX+", brand="OBDLink", asin="B07JFRFJG6", badge="Our pick", top=True, forwho="For the fastest engine data",
        status=("yes","Tested with Tracky in our cars"), facts=[("~30 / s","rev readings in our GT4 RS"),("STN2255","chip, faster than ELM327"),("MS-CAN, SW-CAN","extra networks"),("Classic","Bluetooth, made for iPhone")],
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
   ("Data rate with Tracky",["~30 rev readings / s (our GT4 RS)","Not measured yet","Not measured yet"],[0]),
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
  table=dict(cols=["MISSION 1 PRO","HERO13 Black","Osmo Action 6"], pick=0, rows=[
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
  verdict=[("Our pick: Garmin HRM 200.", "We drive with a Garmin chest strap. The HRM 200 is Garmin’s simplest one: up to a year on a coin cell, a strap you can wash, and it works with Garmin watches as well as Tracky. The Polar H10 is the strap others measure their accuracy against, and costs about the same. Choose the Polar Verity Sense if a strap round your chest is uncomfortable under a harness: it is worn on the arm, but an arm sensor is optical and less exact than a chest strap.")],
  prods=[
   dict(name="Garmin HRM 200", brand="Garmin", asin="B0DQ9KDKT2", badge="Our pick", top=True, forwho="For a strap you can forget about",
        status=("","Works with Tracky’s heart-rate support"), facts=[("1 year","coin-cell battery"),("Chest","electrical sensor"),("HRV","data"),("3 ATM","water rating")],
        pros=["Battery lasts up to a year","Washable strap, works with Garmin watches too"], cons=["Thicker pod than Garmin’s dearer straps"]),
   dict(name="Polar H10", brand="Polar", asin="B07PM54P4N", badge="Most accurate", forwho="For the most exact heart rate",
        status=("","Works with Tracky’s heart-rate support"), facts=[("ECG","chest sensor"),("400 h","coin-cell battery"),("30 m","water rating"),("60 g","with strap")],
        pros=["The accuracy benchmark for chest straps","Bluetooth and ANT+"], cons=["Battery needs a coin cell, not a charger"]),
   dict(name="Polar Verity Sense", brand="Polar", asin="B08TRGNGF6", badge="No chest strap", forwho="For drivers who dislike a chest strap",
        status=("","Works with Tracky’s heart-rate support"), facts=[("Arm","optical sensor"),("30 h","rechargeable"),("2","Bluetooth links at once"),("19 g","weight")],
        pros=["Nothing round your chest under the belts","Rechargeable"], cons=["Optical: less exact than a chest strap"]),
  ],
  table=dict(cols=["Garmin HRM 200","Polar H10","Polar Verity Sense"], pick=0, rows=[
   ("Worn on",["Chest","Chest","Arm"],[]),
   ("Sensor",["Electrical","Electrical (ECG)","Optical"],[0,1]),
   ("Battery",["Up to 1 year, coin cell","Up to 400 h, coin cell","Up to 30 h, rechargeable"],[0]),
   ("Water",["3 ATM","30 m","50 m"],[2]),
   ("Price",["AMZ:B0DQ9KDKT2","AMZ:B07PM54P4N","AMZ:B08TRGNGF6"],[]),
  ]),
  own="<b>Already have a Garmin watch?</b> It can send its heart rate to Tracky: hold the menu button, then Sensors &amp; Accessories, Wrist Heart Rate, Broadcast Heart Rate. Any Bluetooth heart-rate strap works the same way as the three above."),
]

def e(s): return html.escape(s, quote=True)
def link(asin, text, cls): return f'<a class="{cls}" href="{amz(asin)}" rel="sponsored noopener" target="_blank">{e(text)}</a>'

def shot(k, p):
    slug = re.sub(r"[^a-z0-9]+", "-", p["name"].lower()).strip("-")
    img = os.path.join(SITE, "gear", "img", slug + ".webp")
    if os.path.exists(img):
        inner = f'<img src="/gear/img/{slug}.webp" alt="{e(p["name"])}" loading="lazy">'
    else:
        inner = f'<div class="plate">{ICON[k["icon"]]}<span>{e(p["brand"])}</span><strong>{e(p["name"].replace(p["brand"]+" ",""))}</strong></div>'
    return f'<div class="shot"><span class="badge">{e(p["badge"])}</span>{inner}</div>'

def prod(k, p):
    st, sttext = p["status"]
    facts = "".join(f"<li><b>{e(a)}</b>{e(b)}</li>" for a, b in p["facts"])
    pc = "".join(f'<li class="p">{e(x)}</li>' for x in p["pros"]) + "".join(f'<li class="c">{e(x)}</li>' for x in p["cons"])
    return (f'<article class="prod{" top" if p.get("top") else ""}">{shot(k,p)}<div class="body">'
            f'<h3>{e(p["name"])}</h3><p class="for">{e(p["forwho"])}</p>'
            f'<span class="status {st}">{e(sttext)}</span><ul class="facts">{facts}</ul><ul class="pc">{pc}</ul>'
            f'{link(p["asin"], "See price on Amazon", "button")}</div></article>')

def table(k):
    t = k["table"]; pk = t["pick"]
    head = "<td></td>" + "".join(f'<th scope="col"{" class=pk" if i==pk else ""}>{e(c)}</th>' for i, c in enumerate(t["cols"]))
    rows = ""
    for label, vals, best in t["rows"]:
        cells = ""
        for i, v in enumerate(vals):
            cls = []
            if i == pk: cls.append("pk")
            if i in best: cls.append("best")
            if v.startswith("AMZ:"): v = link(v[4:], "On Amazon", "")
            else:
                if v in ("No", "Not yet", "Not published", "Not measured yet", "Not stated") or v.startswith("No,"): cls.append("no")
                v = e(v)
            cells += f'<td{(" class=\"" + " ".join(cls) + "\"") if cls else ""}>{v}</td>'
        rows += f'<tr><th scope="row">{e(label)}</th>{cells}</tr>'
    return (f'<div class="timing"><table><caption>Figures from each maker unless marked as ours. Purple: our pick and the best in each row. Prices change, so they are on Amazon.</caption>'
            f'<thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table></div>')

def kind(k):
    verdict = "".join(f"<p><b>{e(a)}</b>{e(b)}</p>" for a, b in k["verdict"])
    prods = "".join(prod(k, p) for p in k["prods"])
    return (f'<section class="kind" id="{k["id"]}" aria-labelledby="{k["id"]}-h"><h2 id="{k["id"]}-h">{e(k["title"])}</h2>'
            f'<p class="why">{e(k["why"])}</p><div class="verdict">{verdict}</div><div class="prods">{prods}</div>{table(k)}<p class="own">{k["own"]}</p></section>')

main = f'''<main class="gear">
  <h1 class="wide">Gear</h1>
  <p class="lede">Tracky times laps with the iPhone alone. This is the gear that makes the laps more exact, adds engine data and video, and shows how hard you are working. Three choices for each, and the one we would buy.</p>
  <ul class="jump">{"".join(f'<li><a href="#{k["id"]}">{e(k["nav"])}</a></li>' for k in KINDS)}</ul>
  <p class="honest">“Tested with Tracky” means we have used it with Tracky in our own cars. Everything else here works with Tracky’s published support but has not been through our own testing yet, and we say so.</p>
  {"".join(kind(k) for k in KINDS)}
  <section class="kind" aria-labelledby="how-h"><h2 id="how-h">How we choose</h2>
  <div class="rules">
    <div><b>Facts, not hype</b><p>Every figure is the maker’s own unless it says ours. We say plainly what we have tested and what we have not.</p></div>
    <div><b>Every choice, one verdict</b><p>We show more than one option for each kind of gear and tell you which one we would buy and why.</p></div>
    <div><b>Partner links</b><p>Amazon links earn Tracky a small commission, at no cost to you, whichever product you choose. As an Amazon Associate, Tracky earns from qualifying purchases.</p></div>
  </div></section>
</main>'''

p = os.path.join(SITE, "gear", "index.html")
s = open(p).read()
s = s[:s.index('<main class="gear">')] + main + s[s.index("</main>") + len("</main>"):]
s = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="GPS receivers, OBD readers, cameras and heart-rate straps for Tracky: three choices each, compared, with the one we would buy.">', s)
s = s.replace("<title>Tracky – Gear</title>", "<title>Tracky – Gear: GPS, OBD, cameras and heart rate compared</title>")
open(p, "w").write(s)
print("written")
