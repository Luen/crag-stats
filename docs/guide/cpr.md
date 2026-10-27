# CPR (Climber Performance Rating)

**CPR** is theCrag's rating of your climbing ability. Crag Stats shows a CPR timeline for **sport**, **trad** and **boulder** separately, as theCrag does, because the three disciplines rate very differently.

## How theCrag calculates CPR

theCrag built CPR from a statistical analysis of around a million ticks. The main ideas:

- **Each grade is about 5× harder than the one below** (power factor _P_ = 5 on the Ewbank scale). Every unique route you've done adds roughly _P_ to the power of its grade to a total. The total is turned back into a grade with a base-5 logarithm. So five ascents of a grade are worth about the same as one ascent of the next grade up.
- **Tick shifts.** How you climbed matters. Ticks are shifted by a grade offset before scoring. For example, sport climbers red point about **2.1 grades** harder than they onsight, and on trad a pink point is about **0.8 grades** easier than a red point. Offsets are worked out separately for sport, trad and boulder.
- **Solidifying a grade.** One tick at a new grade could be a soft route or a fluke. Your _grade_ rises only after about **three** ticks at it, but every ascent still adds to the rating.
- **Decay.** If you stop climbing, CPR drops by about **0.7 Ewbank grades per year** (roughly three quarters of a grade).
- **Repeats** of a route only count once (the best tick), and the route's assigned grade is used rather than your personal opinion.

theCrag keeps a decayed and an undecayed rating for each of sport, trad and boulder.

## Where Crag Stats gets it

- **From theCrag's API (preferred).** When you sync with a supporter API key, each ascent can carry theCrag's own CPR values. If enough of your ascents in a discipline have them (at least 3, and at least 20% of that discipline's ascents), the timeline uses **theCrag's decayed CPR**, labelled _theCrag CPR_.
- **Approximate model (fallback).** Otherwise Crag Stats calculates its own CPR, labelled _Approx._ It uses the same ideas: _P_ = 5, the best tick per route, tick shifts and 0.7 grades/year decay. The tick shifts are estimates, for example sport onsight +2.1, flash +1.4, red point 0, pink point −0.5, attempts −3. **It is not a copy of theCrag's proprietary implementation**, so expect small differences.

## Reading the timeline

- Each **column** is one quarter of a year.
- **Candles** show the range of grades you climbed with each tick type in that quarter. As on theCrag, the purest tick sits on top: onsight green, flash yellow, red point red, pink point pink, send/clean blue, attempts grey.
- The **black line** is your CPR over time. A ring marks your **peak**, and a hollow dot your **current** rating.
- The **coloured background** shows the grade bands (Beginner → Elite) at their real grade boundaries.
- **Bars** underneath show how many ascents you logged that quarter. Click one to open those ascents in the logbook.
- A **dashed divider** with **⋯** on the time axis marks a gap of more than one quarter.

theCrag notes that a **grey top** above the line (failed attempts at a higher grade) often comes just before a jump up a grade.

## Sources

- theCrag: [Climber Performance Rating (CPR)](https://www.thecrag.com/en/article/cpr)
- theCrag: [CPR timeline explained](https://www.thecrag.com/en/article/cprtimeline)
