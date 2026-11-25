"""Track-day tyres by use: our pick against the alternatives. Every figure is the maker's own or from the test named beside it."""

def P(name, brand, path, badge, forwho, status, pros, cons, top=False):
    return dict(name=name, brand=brand, url="RD:" + path, badge=badge, forwho=forwho, status=("", status), facts=[], pros=pros, cons=cons, top=top)

RD = {
 "sc7": "/reifen/continental/sportcontact-7.html",
 "ps4s": "/reifen/michelin/pilot-sport-4s.html",
 "f1ss": "/reifen/goodyear/eagle-f1-supersport.html",
 "trs": "/reifen/pirelli/p-zero-trofeo-rs.html",
 "cup2": "/reifen/michelin/pilot-sport-cup-2.html",
 "prace": "/reifen/bridgestone/potenza-race.html",
 "f1ssr": "/reifen/goodyear/eagle-f1-supersport-r.html",
 "a052": "/reifen/yokohama/advan-a052.html",
 "ad09": "/Yokohama_Reifen.html",   # no model page; search.js swaps in the feed's cheapest AD09
 "r888r": "/reifen/toyo/proxes-r888r.html",
 "cup2r": "/reifen/michelin/pilot-sport-cup-2-r.html",
 "smr2": "/reifen/dunlop/sport-maxx-race-2.html",
 "f1ssrs": "/reifen/goodyear/eagle-f1-supersport-rs.html",
}

USES = [
 dict(id="road", nav="Road car", icon="tyre", wrap=True, title="A road car with a few track days",
  why="You drive to work on them, in the rain, all year round, and take the car to a circuit a few times a season. You need a road tyre first that copes with a hot lap.",
  verdict=[("Our pick: Continental SportContact 7.", "It came first in ADAC’s 2025 test of 18 tyres and in EVO’s 2024 test, and across 22 wet-braking tests it stopped shorter than its premium rivals on average. The Michelin Pilot Sport 4S is the long-standing favourite, made by Michelin for road and occasional track use, with a 300 treadwear grade. The Goodyear Eagle F1 SuperSport leans further towards dry grip, so it suits a car that rarely sees rain.")],
  prods=[
   P("Continental SportContact 7", "Continental", RD["sc7"], "Our pick", "For the best all-round road tyre that copes on track", "Road, with track-proven grip",
     ["Won ADAC’s 2025 test of 18 tyres", "Strong in the wet and the dry"], ["Treadwear varies a lot between sizes"], top=True),
   P("Michelin Pilot Sport 4S", "Michelin", RD["ps4s"], "Long-lasting", "For the most miles from a set", "Road, and occasional track",
     ["Michelin makes it for road and occasional track", "Treadwear 300 (UTQG)"], ["Less grip on track than a track tyre"]),
   P("Goodyear Eagle F1 SuperSport", "Goodyear", RD["f1ss"], "Dry grip", "For a car that rarely sees rain", "Road, race-inspired",
     ["Goodyear’s race-inspired road tyre", "Won Tyre Reviews’ 2019 UHP test"], ["Goodyear aims it at dry roads"]),
  ],
  table=dict(cols=["SportContact 7", "Pilot Sport 4S", "Eagle F1 SuperSport"], pick=0,
   names=["Continental SportContact 7", "Michelin Pilot Sport 4S", "Goodyear Eagle F1 SuperSport"], rows=[
   ("Made for", ["Road, track-proven", "Road and occasional track", "Dry roads, race-inspired"], []),
   ("Treadwear (UTQG)", ["240 to 500, by size", "300", "80 to 300, by size"], [1]),
   ("Rain", ["Wet and dry", "Wet and dry", "Dry first"], [0, 1]),
   ("Independent test", ["1st of 18, ADAC 2025", "Exemplary, Auto Bild Sportscars 2025", "1st of 8, Tyre Reviews 2019"], [0]),
   ("Price", ["RD:" + RD["sc7"], "RD:" + RD["ps4s"], "RD:" + RD["f1ss"]], []),
  ]),
  own="<b>Why not a track tyre?</b> A semi-slick wears fast on the road and has far less grip in the rain. If the car is your daily driver, a road tyre from this group is the safer choice."),

 dict(id="trackdays", nav="Track days", icon="tyre", wrap=True, title="Regular track days, driving there and back",
  why="You do a track day most months and drive to the circuit. These are road-legal semi-slicks: much more grip on a dry track, less tread and less grip in the rain.",
  verdict=[("Our pick: Pirelli P Zero Trofeo RS.", "It won Auto Bild’s 2026 track-day tyre test and Tyre Reviews’ 2024 track-day test. The Michelin Pilot Sport Cup 2 is the benchmark many drivers know, and Michelin makes it for road and regular track use. The Bridgestone Potenza Race was Bridgestone’s first tyre made for track days. The Goodyear Eagle F1 SuperSport R stopped shortest in the wet in Tyre Reviews’ 2024 test, so it is the one to choose if your track days are often damp.")],
  prods=[
   P("Pirelli P Zero Trofeo RS", "Pirelli", RD["trs"], "Our pick", "For the fastest road-legal track-day tyre", "Road legal, made for the track",
     ["Won Auto Bild’s 2026 track-day test", "First fitted to the Pagani Utopia"], ["Made for dry tracks", "Wears faster than a road tyre"], top=True),
   P("Michelin Pilot Sport Cup 2", "Michelin", RD["cup2"], "The benchmark", "For drivers who want the tyre they know", "Road and regular track",
     ["Michelin: road and regular track use", "Treadwear 180 (UTQG)"], ["Michelin optimises it for a dry track"]),
   P("Bridgestone Potenza Race", "Bridgestone", RD["prace"], "Made for track days", "For hot hatches to supercars", "Road legal semi-slick",
     ["Bridgestone’s first tyre made for track days", "Fitted to the Huracán STO and Cupra Leon"], ["Made for dry tracks"]),
   P("Goodyear Eagle F1 SuperSport R", "Goodyear", RD["f1ssr"], "Damp days", "For track days that are often wet", "Road legal, on and off track",
     ["Best wet braking of six, Tyre Reviews 2024", "Goodyear: dry grip on and off track"], ["Steering less precise than the best in that test"]),
  ],
  table=dict(cols=["P Zero Trofeo RS", "Pilot Sport Cup 2", "Potenza Race", "Eagle F1 SuperSport R"], pick=0,
   names=["Pirelli P Zero Trofeo RS", "Michelin Pilot Sport Cup 2", "Bridgestone Potenza Race", "Goodyear Eagle F1 SuperSport R"], rows=[
   ("Made for", ["Track days, road legal", "Road and regular track", "Track days, road legal", "Dry grip on and off track"], []),
   ("Fitted at the factory to", ["Pagani Utopia, BMW M2 CS", "Ferrari 458 Speciale", "Lamborghini Huracán STO", "Not stated"], []),
   ("Rain", ["Dry track first", "Dry track first", "Dry track first", "Best wet braking in its 2024 test"], [3]),
   ("Independent test", ["1st of 5, Auto Bild 2026", "Not in recent tests", "1st of 6, Auto Bild Sportscars 2022", "Best wet braking, Tyre Reviews 2024"], [0, 2]),
   ("Price", ["RD:" + RD["trs"], "RD:" + RD["cup2"], "RD:" + RD["prace"], "RD:" + RD["f1ssr"]], []),
  ]),
  own="<b>On a semi-slick,</b> drive the first laps gently while the tyres warm up, set the pressures when they are hot, and take it easy on wet roads on the way home. Check the tread after every track day."),

 dict(id="budget", nav="Smaller cars", icon="tyre", wrap=True, title="Smaller cars, budgets and 200-treadwear classes",
  why="An MX-5, a GR86, a Civic, a Clio: lighter cars, smaller wheels, and often a racing class that only allows tyres with a treadwear of 200 or more.",
  verdict=[("Our pick: Yokohama Advan A052.", "Yokohama makes it for the classes that require a 200-treadwear tyre and says it grips in the wet as well as the dry. The Yokohama Advan Neova AD09 has the same 200 treadwear and is Yokohama’s street-legal sports tyre for road and track, so it suits a fast road car that also does track days. The Toyo Proxes R888R grips harder at 100 treadwear and is road legal, but it is weak in the rain, so keep it for dry track days.")],
  prods=[
   P("Yokohama Advan A052", "Yokohama", RD["a052"], "Our pick", "For 200-treadwear classes and fast road use", "Road legal, made for the track",
     ["Made for 200-treadwear racing classes", "Grip in the wet and dry, Yokohama says"], ["Wears faster than a road tyre"], top=True),
   P("Yokohama Advan Neova AD09", "Yokohama", RD["ad09"], "Road and track", "For a fast road car that also does track days", "Road legal, street and track",
     ["Treadwear 200 (UTQG)", "Yokohama’s street-legal sports tyre"], ["Not for near-freezing temperatures"]),
   P("Toyo Proxes R888R", "Toyo", RD["r888r"], "Most grip", "For dry track days in a light car", "Road legal, made for the track",
     ["Road legal, Toyo says", "Sizes from 13 inch"], ["Treadwear 100: wears fastest", "Much less grip in the rain"]),
  ],
  table=dict(cols=["Advan A052", "Neova AD09", "Proxes R888R"], pick=0,
   names=["Yokohama Advan A052", "Yokohama Advan Neova AD09", "Toyo Proxes R888R"], rows=[
   ("Made for", ["200-treadwear classes", "Street and track", "Road and track"], []),
   ("Treadwear (UTQG)", ["200", "200", "100"], [0, 1]),
   ("Rain", ["Wet and dry, Yokohama says", "Wet grip from a high-silica compound, Yokohama says", "Dry first"], [0, 1]),
   ("Price", ["RD:" + RD["a052"], "RD:" + RD["ad09"], "RD:" + RD["r888r"]], []),
  ]),
  own="<b>Racing in a class?</b> Check its rules before you buy: many club series set a minimum treadwear, and some list the tyres they allow."),

 dict(id="trackcar", nav="Track car", icon="tyre", wrap=True, title="A track car on dry days",
  why="The car mostly lives at the circuit and you pick your days. These are the most extreme road-legal tyres: the fastest on a dry track, and the least forgiving in the wet or when cold.",
  verdict=[("Our pick: Michelin Pilot Sport Cup 2 R.", "Michelin makes it for intense track use and it beat the Goodyear Eagle F1 SuperSport RS and the Pirelli P Zero Trofeo R in Tyre Reviews’ 2020 head-to-head. The SuperSport RS had the sharpest steering in that test. The Dunlop Sport Maxx Race 2 was developed with Porsche for the 911 GT3.")],
  prods=[
   P("Michelin Pilot Sport Cup 2 R", "Michelin", RD["cup2r"], "Our pick", "For the fastest dry laps on road-legal tyres", "Mostly track, road legal",
     ["Michelin: made for intense track use", "Won Tyre Reviews’ 2020 head-to-head"], ["Needs a warm-up before it grips", "Made for a dry track only"], top=True),
   P("Goodyear Eagle F1 SuperSport RS", "Goodyear", RD["f1ssrs"], "Sharpest steering", "For drivers who want feel through the wheel", "Mostly track, road legal",
     ["Goodyear’s most race-focused tyre", "Best steering precision in the 2020 test"], ["Made for dry surfaces"]),
   P("Dunlop Sport Maxx Race 2", "Dunlop", RD["smr2"], "Porsche GT", "For Porsche GT cars and others on its sizes", "Mostly track, road legal",
     ["Fitted by Porsche to the 911 GT3, GT3 RS and GT2 RS"], ["Made for dry surfaces"]),
  ],
  table=dict(cols=["Pilot Sport Cup 2 R", "Eagle F1 SuperSport RS", "Sport Maxx Race 2"], pick=0,
   names=["Michelin Pilot Sport Cup 2 R", "Goodyear Eagle F1 SuperSport RS", "Dunlop Sport Maxx Race 2"], rows=[
   ("Made for", ["Intense track use", "Track, road legal", "Dry track, road legal"], []),
   ("Fitted at the factory to", ["Porsche, Ferrari, AMG, Koenigsegg", "Porsche 911 GT2 RS", "Porsche 911 GT3, GT3 RS, GT2 RS"], []),
   ("Rain", ["Dry track only", "Dry surfaces", "Dry surfaces"], []),
   ("Tyre Reviews 2020", ["1st of 3", "2nd of 3", "Not in that test"], [0]),
   ("Price", ["RD:" + RD["cup2r"], "RD:" + RD["f1ssrs"], "RD:" + RD["smr2"]], []),
  ]),
  own="<b>Cold or wet?</b> These tyres need heat to grip. On a cold or damp morning, a tyre from the track-days group above will often be quicker and safer."),
]

