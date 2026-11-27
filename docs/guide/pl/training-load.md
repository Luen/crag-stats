# Obciążenie treningowe

Karta **Obciążenie treningowe** (oraz dedykowana strona [`/training-load`](/training-load)) szacuje, jak ciężko wspinałeś się w ostatnim czasie w porównaniu do tego, do czego przyzwyczajony jest twój organizm. Szybki wzrost obciążenia to moment, w którym najczęściej zdarzają się kontuzje palców i barków. Karta na pulpicie podsumowuje ostatnie 12 tygodni; strona pokazuje 26 tygodni oraz 28-dniowy pasek dziennego obciążenia.

## 1. Obciążenie na przejście

Każde przejście otrzymuje wynik obciążenia:

> **obciążenie = 10 × intensywność × współczynnik stylu**

**Intensywność** porównuje wycenę przejścia z twoim **najtrudniejszym przejściem z ostatnich 12 miesięcy** w tej samej dyscyplinie. Drogi są porównywane w skali Ewbank, a boldery w skali V.

| Wycena w porównaniu do twojego maksimum z 12 miesięcy             | Intensywność |
| ----------------------------------------------------------------- | ------------ |
| Na twoim limicie                                                  | 1.0          |
| 2 stopnie Ewbank (1 stopień V) poniżej                            | 0.5          |
| 4 stopnie Ewbank (2 stopnie V) poniżej                            | 0.25         |
| Powyżej twojego maksimum (nowy rekord)                            | do 1.5       |
| Praca nad drogą bez wyceny lub Projektem na theCrag (patrz niżej) | 1.0          |
| Przejście bez wyceny lub brak przejść w ciągu 12 miesięcy         | 0.3          |

Wspinanie blisko limitu liczy się znacznie bardziej niż duża liczba przejść znacznie poniżej niego. Dzień z dziesięcioma łatwymi drogami i dzień spędzony na jednym projekcie mogą dać podobny wynik.

**Projekty bez wyceny i oflagowane:** próba, przejście z blokami lub inny wpis bez czystego przejścia na drodze **bez wyceny** lub drodze oznaczonej na theCrag flagą **Project** (z opcjonalnego importu informacji o drodze), jest traktowane jako wspinanie **na twoim limicie**. Drogi bez wyceny, nad którymi pracujesz, to zazwyczaj nowe linie blisko twojego limitu; flaga jest ostatecznym potwierdzeniem, jeśli ją posiadamy. Te same próby wliczają się również do udziału wspinania blisko limitu. Jeśli sam przypisałeś wycenę do wpisu na theCrag, zostanie użyta właśnie ta wycena. Czyste _przejście_ bez wyceny nadal liczy się jako lekkie (0.3), ponieważ nienazwana łatwa droga nie powinna wyglądać jak dzień na limicie.

**Współczynnik stylu:** przejście z prowadzeniem to 1.0. Próby i przejścia z blokami to 0.8, ponieważ praca nad drogą to wciąż realny wysiłek. Wspinaczka na wędkę lub na drugiego to dodatkowy mnożnik 0.8×.

## 2. Zmęczenie i forma

Dziennie obciążenia są uśredniane na dwa sposoby, oba z większą wagą przypisaną do ostatnich dni:

- **Zmęczenie (ostre):** 7-dniowa średnia ważona wykładniczo.
- **Forma (chroniczna):** 28-dniowa średnia ważona wykładniczo.

## 3. Stosunek obciążenia ostrego do chronicznego

**stosunek = zmęczenie ÷ forma**

| Stosunek  | Status            | Znaczenie                                                             |
| --------- | ----------------- | --------------------------------------------------------------------- |
| —         | Odpoczynek        | Brak wpisów w ostatnim czasie                                         |
| < 0.8     | Poniżej normy     | Lżej niż zwykle: świeżość, tapering lub utrata formy                  |
| 0.8 – 1.3 | Optimum           | Zgodnie z tym, do czego jesteś przyzwyczajony                         |
| 1.3 – 1.5 | Wzrost obciążenia | Wspinasz się więcej niż zwykle; uważaj na regenerację                 |
| > 1.5     | Skok              | Duży skok; strefa najbardziej kojarzona z kontuzjami przeciążeniowymi |

Przedziały te pochodzą ze stosunku obciążenia ostrego do chronicznego, stosowanego w naukach o sporcie i treningu wspinaczkowym. Traktuj je jako wskazówkę, a nie diagnozę.

## Również na karcie / stronie

- **Tygodniowe obciążenie:** całkowite obciążenie dla każdego tygodnia (12 na karcie, 26 na stronie). Bieżący tydzień to podświetlony słupek.
- **Dziennie obciążenie (strona):** ostatnie 28 dni obciążenia ważonego intensywnością, w tym dni odpoczynku.
- **Przejścia blisko limitu · 28d:** przejścia z ostatnich 28 dni w granicach 2 stopni Ewbank (1 stopień V) od twojego maksimum z 12 miesięcy.
- **Udział wspinania blisko limitu:** procentowy udział przejść z wyceną z ostatnich 28 dni, które były blisko twojego limitu. Wysoki udział przez kilka tygodni oznacza dużo wspinania na limicie; rozważ tygodnie odpoczynku.
- **Ostatnie 7 / 28 dni:** przejścia, czyste przejścia, dni aktywności i odpoczynku, pokonana wysokość i wskaźnik przejść.

## Zastrzeżenia

- **Liczy się tylko to, co zapiszesz.** Sesje na ścianie, trening na chwytotablicy i inne treningi, których nie logujesz, są niewidoczne.
- **Wyceny są subiektywne**, a droga łatwa lub przeszacowana zniekształca intensywność.
- **Stosunek wymaga historii.** Przy mniej niż kilku tygodniach logów, "forma" jest niska, a stosunek ulega dużym wahaniom.

W przypadku dróg typu Projekt, własna wycena musi pochodzić z przejścia lub pokonanego wyciągu (lub pola CSV Ascent Grade). Efektywna wycena skopiowana z drogi jest tylko rozwiązaniem rezerwowym, więc nie wyłącza założenia o Projekcie na limicie.
