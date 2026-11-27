# Odznaki

Większość odznak uczci przełomowe momenty w Twojej karierze wspinaczkowej: Twoją pierwszą sesję lub przejście, łączną liczbę przejść, wyceny i wiele więcej. Korzystają one z dat odpowiednich przejść zawartych w Twoim dzienniku przejść. Zaimportowanie starszego przejścia może zatem przesunąć przełomowy moment na wcześniejszą datę.

**First Moves** uczci przeniesienie Twojego dziennika przejść do Crag Stats. Jej data to pierwszy udany import lub synchronizacja zawierająca co najmniej jedno przejście, a ich liczba jest zapisywana wraz z tym importem. Późniejsze synchronizacje i zaimportowane starsze przejścia nie zmieniają tej daty. Nie jest powiązana z żadnym konkretnym przejściem. Znaczniki czasu importu używają strefy czasowej wyświetlania w witrynie.

Jeśli starsza baza danych nie ma zapisanej daty importu, zostanie ona dostarczona przy następnym udanym, niepustym imporcie. Istniejące zapisane daty zostają zachowane.

Wyczyszczenie danych lokalnych resetuje ten kamień milowy wraz z dziennikiem przejść; następny udany, niepusty import rozpocznie nowy.

## Kolejność

Zdobyte odznaki są porządkowane według przejścia, za które zostały przyznane, poczynając od najnowszych. Karta na pulpicie nawigacyjnym pokazuje osiem najnowszych. Odznaki zdobyte tego samego dnia zachowują swoją kolejność z galerii. First Moves oraz szacunki przejść społeczności nie są powiązane z konkretnym przejściem, więc pojawiają się po każdej odznace z datą przejścia.

## Zliczane typy przejść

Ustawienie **Zliczane typy przejść** w sekcji Ustawienia → Wyświetlanie i widoczność decyduje o tym, które z Twoich zarejestrowanych przejść są uwzględniane przy przyznawaniu odznak. Zobacz [Typy przejść](/docs/tick-types), aby uzyskać informacje o samym ustawieniu.

- Typy przejść ustawione jako **Tylko projekty i cele** są wyłączone z głównych statystyk przejść i podsumowań na pulpicie, ale nadal pozwalają na zdobywanie odznak: **Persistence Pays**, serie kolejnych dni, **Multipitch Day**, **Travel Week**, kamienie milowe wysokości i inne odznaki aktywności nadal je zliczają. Kamienie milowe wysokości rosną zatem dzięki próbom roboczym, nawet jeśli Twoja łączna liczba przejść pozostaje niewielka.
- Typy przejść ustawione na **Ukryj** nie dają niczego: te przejścia są wykluczone z odznak, a także z wszelkich innych analiz.

To rozróżnienie jest celowe. Główne podsumowania filtrują to, co czysto poprowadziłeś, podczas gdy odznaki opisują to, co zrobiłeś — próba robocza to nadal dzień spędzony w skale i wciąż liczy się do odznak, które to uczczą. Jeśli oczekiwana odznaka nie pojawiła się, sprawdź, czy jej typ przejścia nie został ukryty, zamiast być jedynie wyłączonym z podsumowań.

## Wspinaczkowy dystans

Odznaki wysokości zliczają łączną wysokość Twoich zarejestrowanych dróg: 1, 5, 10, 20, 50, 100 i 150 km. Każda z nich nosi datę przejścia, które przekracza dany próg skumulowanej sumy. **250m Day** zamiast tego sumuje wysokość pokonaną w ciągu jednego dnia kalendarzowego.

Progi odznak są zdefiniowane w systemie metrycznym i nigdy nie zmieniają się wraz z ustawieniem jednostek wyświetlania. Zmienia się tylko sformułowanie: po wybraniu jednostek imperialnych **1 km climbed** jest wyświetlane w milach, a **250m Day** w stopach. Te same przejścia dają dokładnie te same odznaki w obu systemach jednostek. Zobacz [Ustawienia wyświetlania](/docs/display-settings).

## Pogoda

**Heat Wave**, **Freeze Frame**, **Rain Check**, **Climbing in the Snow**, **Blown Away**, **Bluebird**, **Sticky**, **Storm Send** oraz **Four Seasons** wymagają opcjonalnej pamięci podręcznej pogody w terenie (`WEATHER_IMPORT`). Zobacz [Pogoda](/docs/weather). Dopóki dane dla tych dni nie zostaną pobrane, odznaki pozostają zablokowane. **Storm Send** wymaga udanego przejścia w dzień z intensywnymi opadami deszczu; same próby się nie liczą.

## Już prawie

Na pełnej stronie **[Badges](/badges)** sekcja **Już prawie** wyświetla do trzech zablokowanych odznak, które są najbliższe ukończenia. Kwalifikują się tylko **policzalne** progi (łączna liczba przejść, wysokość, przejścia z danych zakresów wycen, liczba FA/FFA, nakręcone drogi i tym podobne). Jednorazowe odznaki, takie jak dni świąteczne, dni pogodowe czy First Moves, są wykluczone. Postęp jest porządkowany według procentowego wykonania celu (z ograniczeniem do poniżej 100% do momentu zdobycia), a w przypadku remisów według mniejszych celów. Karta odznak na pulpicie nadal pokazuje tylko niedawno zdobyte odznaki.

## Partnerzy, wielowyciągówki i podróże

Te cztery odznaki wykorzystują pola znajdujące się już w Twoim dzienniku przejść i noszą datę przejścia, które je sfinalizowało:

| Odznaka                  | Zasada                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tłok na stanowisku**   | Jedno przejście zawiera 3 lub więcej różnych partnerów (nazwiska są dopasowywane bez uwzględniania wielkości liter).                                                                                                                                                                                                                              |
| **Wielowyciągowy dzień** | Pokonujesz 3 lub więcej wyciągów w ciągu jednego dnia kalendarzowego: zakresy i listy wyciągów są rozwijane i usuwane są ich powtórzenia w ramach drogi/dnia. Wpisy dotyczące całej drogi i poszczególnych wyciągów nie są liczone podwójnie. Gdy istnieją zapisane w pamięci podręcznej wpisy wyciągów z API, liczą się tylko zaliczone wyciągi. |
| **Tydzień w podróży**    | Rejestrujesz przejścia w 4 różnych rejonach w terenie w ciągu dowolnych 7 kolejnych dni. Ścianki wspinaczkowe i nieznane rejony nie liczą się.                                                                                                                                                                                                    |
| **Wytrwałość popłaca**   | Prowadzisz drogę po raz pierwszy po zarejestrowaniu jej w 4 lub więcej różnych dniach (wliczając próby). Powtórzenie drogi, którą już wcześniej pokonałeś, nie liczy się.                                                                                                                                                                         |

Są to odznaki jednorazowe, więc nie pojawiają się w sekcji **Już prawie**.

## Powtórzenia i nowe drogi

Te odznaki dzielą zasady karty [Powtórzenia kontra nowe drogi](/docs/repeats). Drogi są dopasowywane na podstawie identyfikatora drogi z theCrag, próby się liczą, a każda odznaka nosi datę przejścia, które ją sfinalizowało.

| Odznaka                   | Zasada                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Eksplorator**           | Przejścia zarejestrowane na 50 różnych drogach.                                                                                          |
| **Wędrowiec**             | Przejścia zarejestrowane na 100 różnych drogach.                                                                                         |
| **Kolekcjoner dróg**      | Przejścia zarejestrowane na 250 różnych drogach.                                                                                         |
| **Odkrywca przewodników** | Przejścia zarejestrowane na 500 różnych drogach.                                                                                         |
| **Stary druh**            | Jedna droga pokonana w 10 różnych dniach. Kilka przejść jednego dnia liczy się jako jedno.                                               |
| **Lokalny rejon**         | 25 powtórzeń (w dowolnym dniu po pierwszym zarejestrowanym dniu danej drogi) na drogach w jednym rejonie. Pierwsze wizyty się nie liczą. |

Wszystkie sześć jest policzalnych, więc mogą pojawić się w sekcji **Już prawie**.

## Letnia słoneczna ściana

Zarejestruj przejście w terenie na drodze wystawionej w stronę równika w trakcie lokalnego lata meteorologicznego: N/NE/NW od grudnia do lutego na półkuli południowej lub S/SE/SW od czerwca do sierpnia na półkuli północnej. Ta zachowawcza wersja obejmuje szerokości geograficzne bezwzględne od 25° do (ale bez) 60°. Próby liczą się jako zarejestrowane przejścia, podobnie jak w przypadku odznak za dni pogodowe. Odznaka odblokowuje się raz w najwcześniejszym kwalifikującym się dniu i nie ma licznika w sekcji Już prawie.

Najpierw używane są własne tagi nasłonecznienia/wystawy drogi. Gdy droga nie posiada własnych tagów wystawy, mogą je zastąpić tagi dziedziczone z jej **bezpośredniego nadrzędnego obiektu** (na przykład sektora, ściany lub balderu). Identyfikator źródłowy tagu z pamięci podręcznej musi dokładnie odpowiadać temu nadrzędnemu obiektowi. Tagi z wyższych poziomów nadrzędnych, nieznanych źródeł oraz szerokich obszarów geograficznych nigdy nie są brane pod uwagę. Własne tagi wystawy drogi mają priorytet, nawet jeśli obiekt nadrzędny wskazuje coś innego; nieznane lub sprzeczne kierunki drogi nie powodują przejścia do obiektu nadrzędnego.

Na wybranym poziomie tag **All day sun** może kwalifikować bez określonego kierunku wystawy. Tag **Always shady** uniemożliwia przyznanie odznaki. W przeciwnym razie wystawa musi być skierowana w stronę równika, jak opisano powyżej; tagi nasłonecznienia wyłącznie rano/w południe/po południu nie kwalifikują same w sobie. Tagi nasłonecznienia i wystawy nie są wymagane jednocześnie.

Wspinanie na ściance, nieprawidłowe daty, lokalizacje tropikalne/wysokoszerokościowe, dawne punkty o nieznanej dokładności oraz przybliżenia według pobliskich miejscowości nie kwalifikują się. Aktualizacje danych z pamięci podręcznej odzyskują pochodzenie drogi/rodzica/wyższego przodka bez konieczności kolejnej synchronizacji ani zewnętrznego zapytania.

Zapisuje to ekspozycję opisaną przez dostawcę wraz z heurystyką sezonową. Nie określa godziny wspinania, rzeczywistego nasłonecznienia, cienia rzucanego przez przewieszenia ani temperatury skały i nie wymaga pamięci podręcznej Open-Meteo. Osobna odznaka za upał opisuje wysoką temperaturę powietrza zapisaną w pamięci podręcznej. Zminimalizowane rzeczywiste struktury tagów z API oraz ich pochodzenie są udokumentowane w repozytorium.

## Greenpoint

**Greenpoint** to jednorazowa odznaka za poprowadzenie obitej drogi sportowej na własnej asekuracji. Odblokowuje się za pierwszym razem, gdy:

- zarejestrujesz na theCrag wpis **Green point**, **Green point onsight** lub **Green point flash**, który liczy się jako przejście, lub
- poprowadzisz drogę oznaczoną jako **Sport** z przejściem wpisanym jako **Trad**, używając czystego wpisu prowadzenia (onsight, flash, red point, pink point, ground-up red point lub Lead).

Ogólne wpisy typu Tick/Send/Clean, próby, wędka oraz wspinanie na drugiego nie liczą się w tej drugiej ścieżce, ponieważ nie potwierdzają prowadzenia z własną asekuracją. Podobnie jak odznaki powyżej, nie pojawia się w sekcji **Już prawie**. Zobacz [typy przejść](https://www.thecrag.com/en/article/ticktypes) w serwisie theCrag, aby dowiedzieć się, jak zdefiniowane są wpisy Green point.

## Pierwsze przejścia solo z liną

**First Lead Rope Solo** odblokowuje się przy Twoim pierwszym udanym przejściu jawnie zarejestrowanym jako Lead solo. **First Top-Rope Solo** odblokowuje się osobno przy Twoim pierwszym udanym przejściu typu Roped Solo / Top rope solo. Każda odnośnikuje do najwcześniejszego kwalifikującego się przejścia, używając identyfikatora przejścia do rozstrzygania remisów z tego samego dnia, i żadna nie pojawia się w sekcji Już prawie.

Klasyfikacja odpowiada karcie Wspinanie solo. Dokumentacja [API dostawcy](https://www.thecrag.com/en/article/api) obejmuje `leadsolo` i `ropedsolo`; etykiety wyświetlane i ich warianty dotyczące wielkości liter/odstępów/separatorów są rozpoznawane bez zmiany oryginalnego tekstu wpisu. Aktualizacja danych z pamięci podręcznej naprawia dawne flagi ukończenia tylko wtedy, gdy przechowywane dane dostawcy potwierdzają tę samą jawnie określoną metodę solo. Dyscyplina drogi i styl przejścia pozostają rozdzielone.

Próby, patentowanie, wycofania, przejścia free solo, deep-water solo, solo na hakówce, zwykłe przejścia na wędkę oraz wpisy o nieznanym statusie ukończenia nie kwalifikują się. Przejście jawnie zarejestrowane jako Boulder lub Na drugiego również stoi w sprzeczności z dowolną metodą solo z liną i nie może odblokować tych odznak. Sam brak partnerów nie świadczy o wspinaniu solo. Te kamienie milowe dotyczą przejść na ściance oraz w terenie i nie wymagają ani współrzędnych, ani importu danych pogodowych.

## Serie kolejnych dni

**7-Day Streak**, **10-Day Streak** oraz **30-Day Streak** uczczą zarejestrowanie
co najmniej jednego przejścia w każdym kolejnym dniu kalendarzowym. Próby się liczą, a wspinanie na ściance
i w terenie liczy się jednakowo, zgodnie z kartą Serie. Wiele przejść jednego
dnia liczy się jako jedno; brakujące lub nieprawidłowe daty nie tworzą dnia. Daty wspinania,
a nie czas rejestracji, decydują o serii, bez przesuwania ich zapisanych dat
między strefami czasowymi.

Każda odznaka nosi datę najwcześniejszego dnia, w którym osiągnięto jej próg. Zrobienie przerwy
nie wymazuje kamienia milowego z Twojej zarejestrowanej historii. Są to nagrody jednorazowe
i nie pojawiają się w sekcji Już prawie.

## Z kim się wspinałeś

Zdobyte odznaki z kwalifikującym się przejściem pokazują jego zarejestrowanych towarzyszy. Określenie „Partnerzy przy tym przejściu” odnosi się tylko do powiązanego przejścia, w tym odznak zdobytych na przestrzeni kilku wyciągów, dni lub dróg. Nie jest to lista wszystkich osób, które przyczyniły się do całego osiągnięcia. Brak nazwisk nie oznacza przejścia solo.
