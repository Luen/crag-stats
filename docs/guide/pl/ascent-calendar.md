# Kalendarz przejść

**Kalendarz przejść** to całoroczna mapa aktywności pokazująca dni, w których zarejestrowano wspinaczki. Komórki linkują do `/logbook?day=` dla danej daty.

## Intensywność

Kolory zmieniają się w zależności od liczby przejść zarejestrowanych danego dnia (puste → mało → dużo), wykorzystując tę samą zieloną paletę intensywności. Próby wliczają się do intensywności; podpowiedź nadal osobno podaje liczbę udanych przejść.

## Wycena

Każdy dzień jest pokolorowany według **najtrudniejszego udanego przejścia** z danego dnia, przy użyciu tej samej palety zakresów Początkujący → Elita, co kafelki wyceny w innych miejscach. Dni zawierające wyłącznie próby (bez udanego przejścia) używają przygaszonego wypełnienia „próba”. Gdy jednego dnia łączą się wyceny bulderów i dróg, kalendarz wybiera wyższe id zakresu — zakresy nie są idealnie porównywalne między różnymi systemami.

Twoja preferencja dotycząca opcji Intensywność / Wycena jest przechowywana w przeglądarce (`cs_heatmap_mode`).

## Pogoda

Gdy opcjonalna [pamięć podręczna pogody](/docs/weather) zawiera którykolwiek z Twoich dni wspinaczkowych, pojawia się trzeci tryb: **Pogoda**. Każdy dzień wspinaczkowy jest pokolorowany według warunków atmosferycznych podczas pierwszego przejścia w terenie z zapisaną pogodą: śnieg, deszcz, gorąco (35°C+), mróz, dobra pogoda (15–25°C i sucho) lub umiarkowanie, przy użyciu tych samych zasad co odznaki. Dni bez zapisanej pogody (ściana wspinaczkowa, brak współrzędnych, jeszcze nie pobrano) pozostają przygaszone szare. Podpowiedzi wyświetlają temperaturę maksymalną, minimalną oraz opady, a tabela **Zobacz wartości pogodowe** pod kalendarzem podaje te same liczby w formie tekstu dla wybranego roku.

Komórki kalendarza zachowują zarejestrowaną datę kalendarzową w każdej strefie czasowej przeglądarki, w tym przy zmianach czasu na letni/zimowy. Nie przeliczają one dni wspinaczkowych na lokalne znaczniki czasu.
