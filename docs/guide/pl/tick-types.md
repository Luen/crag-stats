# Typy przejść

**Typ przejścia** rejestruje _sposób_, w jaki droga została pokonana, a nie tylko fakt dotarcia do topu. Onsight jest wart więcej niż przejście red point na tej samej drodze. Dlatego theCrag (oraz Crag Stats) traktują je oddzielnie.

W poniższych tabelach **Send** oznacza, że Crag Stats liczy przejście jako udane (czyste), na przykład w „udanych prowadzeniach”, współczynniku przejść i piramidach. **Próba** oznacza, że przejście jest zapisane jako próba: na wykresach wyświetla się na szaro, nadal liczy się do objętości wspinaczkowej i pozwala oznaczyć drogę jako projekt.

<!-- component:tick-types -->

## Jak przejścia są tutaj wykorzystywane

- **Piramidy i wykresy** spójnie kolorują każdy typ przejścia: onsight na zielono, flash na żółto, red point na czerwono, pink point na różowo, send/czyste na niebiesko, a próby na szaro.
- **CPR** przesuwa każde przejście o offset wyceny (onsight liczy się jako trudniejszy niż red point); zobacz [CPR](/docs/cpr).
- **Projekty** to drogi z próbami, ale bez przejścia. Droga pokonana w pierwszej próbie (onsight lub flash) nigdy nie jest projektem.
- **Obciążenie treningowe** liczy próby jako 0.8× przejścia, ponieważ praca nad drogą to wciąż wysiłek; zobacz [Obciążenie treningowe](/docs/training-load).

## Liczone typy przejść w analityce

W theCrag próby bez przejścia (takie jak `Working`, `Attempt`, `Hang dog` czy `Retreat`) są zapisywane jako przejścia. Jeśli zapisujesz wiele podejść roboczych podczas pracy nad projektem, wliczanie każdej próby do sum w panelu może zniekształcić główną liczbę przejść, udział stylów i typ wspinacza.

W **Ustawieniach → Widok i widoczność → Liczone typy przejść** możesz skonfigurować sposób traktowania każdego typu przejścia w Crag Stats:

- **Włącz (Licz wszędzie):** Uwzględnione w głównych prowadzeniach, podziale dyscyplin, skałach i sektorach, piramidach, sumach na mapie, liczbach Eddingtona, powtórzeniach dróg, osiach profilu wspinacza, mapach aktywności, obciążeniu treningowym, odznakach, projektach i celach.
- **Tylko projekty i cele (Poza sumami):** Wykluczone z głównych prowadzeń, udziału dyscyplin, skał, sektorów, piramid, sum na mapie, liczb Eddingtona, powtórzeń dróg i osi profilu wspinacza, ale wciąż wliczane do wykrywania projektów, aktywności w sesjach (mapy aktywności, serie, sesje tygodniowe i wykresy dni tygodnia), zmęczenia w obciążeniu treningowym, odznak i celów trudnościowych.
- **Ukryj (Całkowicie wyklucz):** Wykluczone z całej analityki, projektów, celów i odznak.

Wykaz zawsze zachowuje i wyświetla wszystkie Twoje zapisane przejścia z pełnym filtrowaniem, niezależnie od tego ustawienia. Aby sprawdzić, które odznaki podlegają poszczególnym wyborom, zobacz [Odznaki](/docs/badges).

Gdy skonfigurowany typ przejścia wyklucza niektóre z Twoich logów, panel przelicza również statystyki profilu, które normalnie pochodzą z theCrag (przejścia w skałach i na panelu, liczba dróg, suma wysokości i typ wspinacza), korzystając z Twoich liczonych przejść, tak aby każda suma na stronie opisywała ten sam zestaw przejść. Wyczyść konfigurację za pomocą gotowego ustawienia **Wszystkie zalogowane przejścia**, aby wrócić do statystyk pochodzących z theCrag.

## Źródło

Definicje są sparafrazowane na podstawie artykułu theCrag [Typy przejść](https://www.thecrag.com/en/article/ticktypes). Nie każdy typ przejścia ma zastosowanie do każdego stylu asekuracji.
