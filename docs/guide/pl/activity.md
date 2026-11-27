# Aktywność

Karty **Statystyki miesięczne** i **Statystyki roczne** na pulpicie nawigacyjnym podsumowują objętość na pierwszy rzut oka. **Aktywność** (`/activity`) to strona ze szczegółami, gdy chcesz czegoś więcej niż wykresy: pełną tabelę miesięczną (przejścia, czyste przejścia, wysokość, podział na style) oraz zestawienie rok do roku.

## Co się liczy

- **Przejścia** — każdy zarejestrowany wpis z danego dnia/miesiąca/roku (w tym próby).
- **Czyste przejścia** — wpisy sklasyfikowane jako czyste przejścia (patrz [Typy wpisów](/docs/tick-types)).
- **Wysokość** — metry z przejścia lub wysokości drogi, jeśli są podane.
- **Style** — Sport / Trad / Boulder na podstawie stylu sprzętowego; cała reszta trafia do kategorii **Inne** w tabeli.

Linki miesięcy otwierają wykaz przejść dla danego miesiąca kalendarzowego. Linki lat (na karcie/tabeli rocznej) otwierają `/logbook?year=`.

## Dlaczego osobna strona

Samo powtórzenie tych samych dwóch wykresów niepotrzebnie przeładowywałoby pasek boczny. Strona Aktywność zasługuje na własny adres, zawierając **tabelę ze szczegółowym podziałem miesięcznym** oraz zapewniając łatwy podgląd zmian rok do roku — dokładnie tak, jak określono w wymaganiach dla wyjścia poza ubogie karty.

## Serie

Karta Serie pokazuje bieżące serie dni, tygodni i miesięcy obok Twojej
**najdłuższej** serii dni w historii (cztery kafelki metryk). Daty rozpoczęcia i zakończenia najdłuższej serii
znajdują się pod kafelkami. Gdy istnieje kilka tak samo długich rekordów, wyświetlany jest najwcześniejszy zakres.
Pojedynczy dzień wspinaczkowy pokazuje jedną datę; pusta historia nie zawiera dat rekordów.

Stopka pokazuje również Twój ostatni dzień wspinaczkowy, ile pełnych dni minęło
od tamtej pory, gdy bieżąca seria dni została przerwana, oraz łączną liczbę **aktywnych dni**
(unikalnych dni wspinaczkowych). Dni wynikają z prawidłowo wpisanych dat przejść; próby i
czyste przejścia, na ścianie i w skałach, liczą się jednakowo, a kilka dróg jednego dnia liczy się
jako jeden dzień. Zobacz [Odznaki](/docs/badges), aby poznać kamienie milowe dla 7, 10 i 30 dni.

Bieżąca seria dni kończy się dzisiaj lub wczoraj, jeśli jeszcze dzisiaj się nie wspinałeś.
Porównania dni kalendarzowych używają czasu UTC, więc strefa czasowa serwera i zmiany
czasu nie mogą przesunąć zarejestrowanego dnia. Wpisy z przyszłą datą nie przedłużają bieżącej serii.

Bieżące serie tygodniowe i miesięczne kierują się tą samą zasadą okresu karencji: liczą kolejne
okresy kończące się w bieżącym okresie lub w bezpośrednio go poprzedzającym, jeśli w bieżącym
okresie nie było jeszcze wspinania. Po całym pustym tygodniu lub miesiącu ten licznik
wynosi zero. Tygodnie zaczynają się w poniedziałek, a granice kalendarzowe korzystają z UTC, w tym poprzez
53. tydzień ISO i nowy rok. Wpisy z przyszłą datą nie wliczają się do tych liczników.

## Ostatnie aktywności

Pulpit nawigacyjny wyświetla najnowszy **dzień wspinaczkowy** jako pierwszy. W ramach każdego dnia najnowsze **zalogowane** przejście znajduje się na początku,
wykorzystując znacznik czasu utworzenia wpisu u dostawcy.
Wyświetlana data pozostaje datą wspinania: zalogowanie dzisiaj starszego przejścia nie
przesuwa go ponad przejścia z późniejszego dnia wspinaczkowego. Kolejność logowania służy jako przybliżenie
kolejności wspinania, gdy wpisujesz drogi sekwencyjnie, a nie jako zarejestrowany czas przejścia.

Wpisy z brakiem lub nieprawidłowym czasem logowania znajdują się za wpisami ze znacznikiem czasu z tego samego dnia.
Jednakowe lub niedostępne czasy logowania używają zapisanego ID przejścia, najnowsze jako pierwsze, aby utrzymać stabilną kolejność. Znaczniki czasu edycji/synchronizacji nie są używane jako czasy utworzenia wpisu.

Ostatnie aktywności pokazują również te same odznaki stylu wspinania co wykaz przejść: dyscyplinę drogi, inny zarejestrowany styl asekuracji w stosownych przypadkach oraz jawne warianty solo, takie jak Lead solo czy Top-rope solo. Brak partnerów nigdy nie oznacza przejścia solo.
