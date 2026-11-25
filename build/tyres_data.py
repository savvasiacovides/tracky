"""Track-day tyres by use: our pick against the alternatives. Every figure is the maker's own or from the test named beside it.
Line-up approved by the owner 25 Nov 2026 ("we need the elite tyres", "we need top tyres")."""

NOT_RD = "Not available from our partner"

def P(name, brand, path, badge, forwho, status, pros, cons, top=False):
    d = dict(name=name, brand=brand, url=("RD:" + path) if path else None, badge=badge, forwho=forwho, status=("", status), facts=[], pros=pros, cons=cons, top=top)
    if not path: d["nobuy"] = NOT_RD
    return d

def price(key):
    return "RD:" + RD[key] if RD.get(key) else NOT_RD

# Model pages on ReifenDirekt.de. A brand page ("_Reifen.html") is swapped by tyres/search.js for the tyre itself,
# from the nightly feed. None: ReifenDirekt.de does not sell it (feed checked 25 Nov 2026).
RD = {
 "pse": "/Bridgestone_Reifen.html",
 "ps4s": "/reifen/michelin/pilot-sport-4s.html",
 "pzr": "/Pirelli_Reifen.html",
 "trs": "/reifen/pirelli/p-zero-trofeo-rs.html",
 "cup2r": "/reifen/michelin/pilot-sport-cup-2-r.html",
 "sc3r": "/Goodyear_Reifen.html",
 "prace": "/reifen/bridgestone/potenza-race.html",
 "a052": "/reifen/yokohama/advan-a052.html",
 "p1": None,
 "crs": None,
 "re71rs": None,
 "ar1": "/Nankang_Reifen.html",
 "r888r": "/reifen/toyo/proxes-r888r.html",
}

USES = [
 dict(id="road", nav="Road & track days", icon="tyre", wrap=True, title="Road tyres that handle track days",
  why="For a car you drive every day, in all weather, and take on track a few times a season.",
  verdict=[("Our pick: Bridgestone Potenza Sport Evo.", "It won sport auto’s 2026 summer tyre test, came second in Tyre Reviews’ 2026 performance tyre test and had the shortest dry braking in ACE’s 2026 test. It is also made in 17 inch sizes for smaller cars. The Pirelli P Zero R beat it in Tyre Reviews’ test, best in the dry and quickest in the wet, but Pirelli makes it for sports cars and supercars on 19 inch wheels and up. The Michelin Pilot Sport 4S won ACE’s 2026 test and is the long-standing favourite, with a 300 treadwear grade.")],
  prods=[
   P("Bridgestone Potenza Sport Evo", "Bridgestone", RD["pse"], "Our pick", "For a fast road car of any size that does track days", "Road, with track grip",
     ["Won sport auto’s 2026 summer test", "Shortest dry braking in ACE’s 2026 test", "Made in 17 inch sizes too"], ["Loudest tyre in Tyre Reviews’ 2026 test"], top=True),
   P("Pirelli P Zero R", "Pirelli", RD["pzr"], "Test winner", "For sports cars and supercars on big wheels", "Road, and occasional track",
     ["Won Tyre Reviews’ 2026 performance test", "Best in the dry, quickest in the wet there"], ["Sizes from 19 inch only", "Pirelli: not a dedicated track tyre"]),
   P("Michelin Pilot Sport 4S", "Michelin", RD["ps4s"], "Long-lasting", "For the most miles from a set", "Road, and occasional track",
     ["Won ACE’s 2026 summer test", "Treadwear 300 (UTQG)"], ["Less grip on track than a track tyre"]),
  ],
  table=dict(cols=["Potenza Sport Evo", "P Zero R", "Pilot Sport 4S"], pick=0,
   names=["Bridgestone Potenza Sport Evo", "Pirelli P Zero R", "Michelin Pilot Sport 4S"], rows=[
   ("Made for", ["Fast road cars, EV ready", "Sports cars and supercars", "Road and occasional track"], []),
   ("Rain", ["Top wet and dry score, sport auto 2026", "Quickest in the wet, Tyre Reviews 2026", "Wet and dry"], [1]),
   ("Independent test, 2026", ["1st, sport auto; 2nd, Tyre Reviews", "1st of 8, Tyre Reviews", "1st of 10, ACE"], []),
   ("Price", [price("pse"), price("pzr"), price("ps4s")], []),
  ]),
  own="<b>Why not a track tyre?</b> A semi-slick wears fast on the road and has far less grip in the rain. If the car is your daily driver, a tyre from this group is the safer choice."),

 dict(id="trackdays", nav="Track tyres", icon="tyre", wrap=True, title="Road-legal track tyres",
  why="For regular track days in a car you drive to the circuit. More dry grip than any road tyre, with a shorter life and less grip in the rain.",
  verdict=[("Our pick: Pirelli P Zero Trofeo RS.", "It won Auto Bild’s 2026 track-day tyre test on a BMW M2 and Tyre Reviews’ test of the fastest track tyres, where it set the fastest dry lap. The Michelin Pilot Sport Cup 2 R came second in that Tyre Reviews test and is fitted at the factory by Porsche, Ferrari and AMG. The Goodyear Eagle F1 SuperCar 3R is Goodyear’s most track-focused road-legal tyre, with a 100 treadwear grade, sold in Europe in 20 inch sizes. The Bridgestone Potenza Race stopped shortest in the wet in Tyre Reviews’ test, so it is the one for damp days.")],
  prods=[
   P("Pirelli P Zero Trofeo RS", "Pirelli", RD["trs"], "Our pick", "For the fastest road-legal track days", "Road legal, made for the track",
     ["Won Auto Bild’s 2026 track-day test", "Fastest dry lap in Tyre Reviews’ track tyre test"], ["Made for dry tracks", "Wears faster than a road tyre"], top=True),
   P("Michelin Pilot Sport Cup 2 R", "Michelin", RD["cup2r"], "Factory fit", "For the tyre Porsche, Ferrari and AMG fit", "Road legal, made for the track",
     ["Second in Tyre Reviews’ track tyre test", "Michelin: made for intense track use"], ["Joint fourth in Auto Bild’s 2026 test", "Made for a dry track"]),
   P("Goodyear Eagle F1 SuperCar 3R", "Goodyear", RD["sc3r"], "Most extreme", "For powerful cars on 20 inch wheels", "Road legal, made for the track",
     ["Goodyear’s most track-focused road tyre", "Developed for the Chevrolet Camaro ZL1 1LE"], ["Treadwear 100: wears fast", "Not for standing water"]),
   P("Bridgestone Potenza Race", "Bridgestone", RD["prace"], "Damp days", "For track days that are often wet", "Road legal, made for the track",
     ["Shortest wet braking in Tyre Reviews’ track tyre test", "Won Auto Bild Sportscars’ 2022 test"], ["Fourth of four in that Tyre Reviews test"]),
  ],
  table=dict(cols=["P Zero Trofeo RS", "Pilot Sport Cup 2 R", "Eagle F1 SuperCar 3R", "Potenza Race"], pick=0,
   names=["Pirelli P Zero Trofeo RS", "Michelin Pilot Sport Cup 2 R", "Goodyear Eagle F1 SuperCar 3R", "Bridgestone Potenza Race"], rows=[
   ("Made for", ["Track days, road legal", "Intense track use, road legal", "Track and competition, road legal", "Track days, road legal"], []),
   ("Fitted at the factory to", ["Pagani Utopia, BMW M2 CS", "Porsche, Ferrari, AMG, Koenigsegg", "Chevrolet Camaro ZL1 1LE", "Lamborghini Huracán STO"], []),
   ("Rain", ["Dry track first", "Dry track first", "Not for standing water", "Shortest wet braking, Tyre Reviews"], [3]),
   ("Independent test", ["1st, Auto Bild 2026 and Tyre Reviews", "2nd, Tyre Reviews; joint 4th, Auto Bild 2026", "No independent test found", "4th, Tyre Reviews; 1st, Auto Bild 2022"], [0]),
   ("Price", [price("trs"), price("cup2r"), price("sc3r"), price("prace")], []),
  ]),
  own="<b>On a semi-slick,</b> drive the first laps gently while the tyres warm up, set the pressures when they are hot, and take it easy on wet roads on the way home. Check the tread after every track day."),

 dict(id="budget", nav="200 treadwear", icon="tyre", wrap=True, title="200-treadwear tyres for class racing",
  why="For club series and time-attack classes that require a treadwear rating of 200 or more. Road legal, and close to a track tyre in the dry.",
  verdict=[("Our pick: Yokohama Advan A052.", "It is the all-rounder of the group, with the second-fastest wet lap in Tire Rack’s 2025 track test, and the only one of the four you can buy through Tracky. In the dry the others were quicker in the 2025 and 2026 tests. The Vitour Tempesta P1 came second in Auto Bild’s 2026 track-day test and braked shortest in Tire Rack’s 2025 test. The Nankang Sportnex CR-S came third in Auto Bild’s test and was the fastest when worn in Grassroots Motorsports’ 2026 long-term test. The Bridgestone Potenza RE-71RS was best in four of five measures in Tire Rack’s 2025 test, wet included, but we could not find it on sale in Europe.")],
  prods=[
   P("Yokohama Advan A052", "Yokohama", RD["a052"], "Our pick", "For 200-treadwear classes, wet or dry", "Road legal, made for the track",
     ["Second-fastest wet lap, Tire Rack 2025", "Treadwear 200 (UTQG)"], ["Slower in the dry than the others in 2025 and 2026 tests"], top=True),
   P("Vitour Tempesta P1", "Vitour", RD["p1"], "Hardest braking", "For dry track days and time attack", "Road legal, made for the track",
     ["Second in Auto Bild’s 2026 track-day test", "Shortest dry braking, Tire Rack 2025"], ["Sixth of seven in the wet, Tire Rack 2025"]),
   P("Nankang Sportnex CR-S", "Nankang", RD["crs"], "Keeps its pace", "For long days and endurance races", "Road legal, made for the track",
     ["Third in Auto Bild’s 2026 track-day test", "Fastest when worn, Grassroots Motorsports 2026"], ["Last of seven in the wet, Tire Rack 2025"]),
   P("Bridgestone Potenza RE-71RS", "Bridgestone", RD["re71rs"], "Best in test", "For drivers who can buy it outside Europe", "Road legal, made for the track",
     ["Best in four of five measures, Tire Rack 2025", "Best wet braking and wet lap in that test"], ["Not found on sale in Europe"]),
  ],
  table=dict(cols=["Advan A052", "Tempesta P1", "Sportnex CR-S", "Potenza RE-71RS"], pick=0,
   names=["Yokohama Advan A052", "Vitour Tempesta P1", "Nankang Sportnex CR-S", "Bridgestone Potenza RE-71RS"], rows=[
   ("Treadwear (UTQG)", ["200", "200", "200", "200"], []),
   ("Dry lap, Tire Rack 2025", ["7th of 7", "4th of 7", "2nd of 7", "1st of 7"], [3]),
   ("Wet lap, Tire Rack 2025", ["2nd of 7", "6th of 7", "7th of 7", "1st of 7"], [3]),
   ("Auto Bild 2026, of 5", ["Joint 4th", "2nd", "3rd", "Not in that test"], [1]),
   ("Price", [price("a052"), price("p1"), price("crs"), price("re71rs")], []),
  ]),
  own="<b>Racing in a class?</b> Check its rules before you buy: many club series set a minimum treadwear, and some list the tyres they allow."),

 dict(id="trackcar", nav="Track cars", icon="tyre", wrap=True, title="Semi-slicks for track cars",
  why="For a car used mainly on track, on dry days. 100-treadwear semi-slicks: the most grip of any road-legal tyre, and the least in the cold and wet.",
  verdict=[("Our pick: Nankang AR-1.", "It is a 100-treadwear semi-slick that is still E-marked for the road and on the MSUK List 1B for UK club racing, made in sizes from 13 to 20 inch. The Toyo Proxes R888R is the other 100-treadwear classic, also from 13 inch. The Michelin Pilot Sport Cup 2 R is the road-legal choice for bigger, faster cars, made by Michelin for intense track use.")],
  prods=[
   P("Nankang AR-1", "Nankang", RD["ar1"], "Our pick", "For light track cars on dry days", "Road legal semi-slick",
     ["Treadwear 100, semi-slick compound", "E-marked and MSUK List 1B"], ["Made for dry tracks", "Few sizes available through Tracky"], top=True),
   P("Toyo Proxes R888R", "Toyo", RD["r888r"], "The classic", "For track cars on small wheels", "Road legal semi-slick",
     ["Road legal, Toyo says", "Sizes from 13 inch"], ["Treadwear 100: wears fastest", "Much less grip in the rain"]),
   P("Michelin Pilot Sport Cup 2 R", "Michelin", RD["cup2r"], "Bigger cars", "For fast cars on big wheels", "Road legal, made for the track",
     ["Michelin: made for intense track use", "Second in Tyre Reviews’ track tyre test"], ["Made for a dry track"]),
  ],
  table=dict(cols=["AR-1", "Proxes R888R", "Pilot Sport Cup 2 R"], pick=0,
   names=["Nankang AR-1", "Toyo Proxes R888R", "Michelin Pilot Sport Cup 2 R"], rows=[
   ("Made for", ["Track days, time attack, club racing", "Road and track", "Intense track use"], []),
   ("Treadwear (UTQG)", ["100", "100", "Not stated"], []),
   ("Wheels", ["13 to 20 inch", "From 13 inch", "Not stated"], [0, 1]),
   ("Rain", ["Dry tracks first", "Much less grip in the rain", "Dry track first"], []),
   ("Price", [price("ar1"), price("r888r"), price("cup2r")], []),
  ]),
  own="<b>Cold or wet?</b> These tyres need heat to grip. On a cold or damp morning, a tyre from the track-tyre group above will often be quicker and safer."),
]
