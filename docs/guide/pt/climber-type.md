# Climber type

The dashboard labels you with a **climber type**, such as _Sport climber_ or _Rock climber_. It sits at the top of the dashboard and in the "Climber type" card.

## How it's decided

1. **theCrag first, while every tick type is counted.** If your theCrag account has a climber type set (synced through the API), Crag Stats uses it as-is. Once you set any tick type to _Projects & goals only_ or _Hide_ in Settings, the label is recalculated from your counted ascents instead, so projecting burns can't keep you in the wrong discipline.
2. **Otherwise, from your logbook.** Every counted ascent counts towards its discipline (gear style): Sport, Trad, Boulder, Top rope, Alpine, Aid, Deep-water solo, and so on. By default, attempts count too, but you can configure [counted tick types](/docs/tick-types) in Settings to keep projecting burns (like working boulder problems) from distorting your climber type.
3. **The 40% rule.** If a single discipline makes up **at least 40%** of all your counted ascents, _and_ that discipline is **Sport, Trad, or Boulder**, you're a "Sport climber", "Trad climber", or "Boulder climber".
4. **Everything else** is a **Rock climber**. That covers no discipline reaching 40%, or the biggest share being something like Top rope.

The coloured bar in the card shows each discipline's share, using the same colours as everywhere else: Sport blue, Trad orange, and Boulder red.

## Why 40%?

Most climbers mix disciplines. A threshold well below 50% still captures a clear preference (for example 47% sport, 24% boulder, and 24% trad) without forcing an all-rounder into a single box. Climbers whose time is spread fairly evenly stay "Rock climber".

## Changing it

- Set a climber type on your theCrag profile and sync,
- adjust your counted tick types in Settings if projecting attempts are skewing your discipline share, or
- log more of the style you identify with. The label updates on the next page load.
