# Statystyki roczne

Tabela rok do roku zawsze wyświetla różnice w przejściach i onsightach jako liczby, a różnice wysokości w wybranej przez Ciebie jednostce, niezależnie od metryki wykresu.

Karta panelu **Statystyki roczne** (oraz wykresy na stronie **[Aktywność](/activity)**, gdy jest ona włączona) pokazują, jak Twoja objętość zmienia się z roku na rok.

## Na rok

Słupki (od najstarszych → do najnowszych) dla wybranej metryki:

- **Przejścia** — każdy zarejestrowany wpis w danym roku
- **Udane przejścia** — tylko ukończone drogi (zobacz [Typy przejść](/docs/tick-types))
- **Wysokość** — zsumowana wysokość przejść (w metrach lub stopach, zgodnie z preferowaną jednostką wysokości w Ustawieniach), z wysokością drogi jako wartością zastępczą, gdy wpis jej nie ma

Mała liczba pod każdym słupkiem to **różnica rok do roku** w porównaniu z poprzednim rokiem kalendarzowym (lub „—” dla Twojego pierwszego roku). Słupki roczne prowadzą do `/logbook?year=`.

## Skumulowane

Gruba linia akcentu to Twoja **suma bieżąca kariery** dla wybranej metryki. Cienkie kolorowe nakładki (gdy dostępne są dane mapy cieplnej) resetują się do zera 1 stycznia i rosną z dnia na dzień na wspólnej osi styczeń–grudzień, co pozwala na bezpośrednie porównanie sezonów. Po ostatniej wspinaczce w roku cienka linia biegnie **płasko do grudnia** (bez doliczania sztucznej objętości). Kliknij wybrany dzień na cienkiej linii, aby otworzyć `/logbook?day=` dla tej daty (najechanie kursorem nadal pokazuje sumę w skali roku). Pod kropkami kariery liczba w nawiasie to **wkład z danego roku**, a nie kolejna różnica rok do roku.

Twoje preferencje trybu wykresu są przechowywane w przeglądarce (`cs_yearly_chart`).

## Tabela rok do roku

Rozwiń **Tabelę rok do roku** na karcie, aby zobaczyć liczbowe różnice w przejściach, wysokości i onsightach dla każdego roku w logbooku.
