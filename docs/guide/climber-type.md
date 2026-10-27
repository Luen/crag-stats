# Climber type

The dashboard labels you with a **climber type**, such as _Sport climber_ or _Rock climber_. It sits at the top of the dashboard and in the "Climber type" card.

## How it's decided

1. **theCrag first.** If your theCrag account has a climber type set (synced through the API), Crag Stats uses it as-is.
2. **Otherwise, from your logbook.** Every logged ascent counts towards its discipline (gear style): Sport, Trad, Boulder, Top rope, Alpine, Aid, Deep-water solo and so on. Attempts count too, because they're climbing you did.
3. **The 40% rule.** If a single discipline makes up **at least 40%** of all your ascents, _and_ that discipline is **Sport, Trad or Boulder**, you're a "Sport climber", "Trad climber" or "Boulder climber".
4. **Everything else** is a **Rock climber**. That covers no discipline reaching 40%, or the biggest share being something like Top rope.

The coloured bar in the card shows each discipline's share, using the same colours as everywhere else: Sport blue, Trad orange, Boulder red.

## Why 40%?

Most climbers mix disciplines. A threshold well below 50% still captures a clear preference (for example 47% sport, 24% boulder, 24% trad) without forcing an all-rounder into a single box. Climbers whose time is spread fairly evenly stay "Rock climber".

## Changing it

- Set a climber type on your theCrag profile and sync, or
- log more of the style you identify with. The label updates on the next page load.
