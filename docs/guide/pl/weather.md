# Pogoda

Crag Stats może zapisywać w pamięci podręcznej **codzienną pogodę w terenie** dla dróg posiadających współrzędne, a następnie wykorzystywać te dane dla odznak, widoków pulpitu i dziennika, oraz do porównywania Twoich wyników wspinaczkowych w różnych warunkach pogodowych.

## Dobrowolne włączenie

Domyślnie wyłączone. Właściciel serwera ustawia `WEATHER_IMPORT=true` w pliku `.env` i restartuje usługę. After each successful logbook sync or CSV upload, on the background import schedule (`IMPORT_CRON`, daily by default), and from **Settings → Import weather**, Crag Stats fetches up to **50** missing outdoor days per run from [Open-Meteo](https://open-meteo.com/)'s historical weather API, oldest climb days first, with at least **1.1 seconds** between requests. Akcja w Ustawieniach uruchamia proces w tle, dzięki czemu strona nie musi czekać na zakończenie pobierania całej partii danych. Opcja Wipe czyści pamięć podręczną.

Darmowy, niekomercyjny poziom usług Open-Meteo jest przeznaczony dla osobistych instalacji typu self-hosted. Nie włączaj tej opcji dla komercyjnych usług wielodostępowych bez zapoznania się z ich regulaminem i płatnymi opcjami.

## Co jest pobierane

- **Tylko w skałach** — drogi prawdopodobnie halowe / na ściance są pomijane (ta sama heurystyka co w przypadku celów).
- **Wymagane współrzędne** — droga musi posiadać szerokość i długość geograficzną (z synchronizacji z theCrag lub z importu danych dróg dla dzienników CSV).
- **Dni minione** — dzisiejsza data w formacie UTC jest pomijana; archiwum dla bieżącego dnia jest często niepełne.
- **Wspólny klucz pamięci podręcznej** — szerokość/długość geograficzna są zaokrąglane do **jednego miejsca po przecinku**, więc pobliskie drogi w jednym rejonie dzielą ten sam wpis dzienny.

Przechowywane pola: maksymalna/minimalna temperatura dobowa (°C), opady (mm), kod pogodowy WMO, średnia wilgotność oraz maksymalna/średnia prędkość wiatru na wysokości 10 m (km/h). Jednostki wyświetlania temperatury (°C lub °F), wiatru (km/h lub mph) oraz opadów (mm lub in) można wybrać w **Ustawienia → Wyświetlanie i widoczność**.

## Odznaki

Po zapisaniu danych dla danego dnia w pamięci podręcznej, odznaki te mogą zostać odblokowane za każde zarejestrowane przejście **w skałach** tego dnia w danej lokalizacji (liczą się również próby; wpisy halowe/ze ścianki są pomijane, nawet jeśli dzielą te same zaokrąglone współrzędne):

| Odznaka                 | Reguła                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| **Fala upałów**         | Maksymalna temperatura dnia ≥ 35°C                                                               |
| **Zlodowacenie**        | Minimalna temperatura dnia ≤ 0°C                                                                 |
| **Mokry warun**         | ≥ 1 mm opadów i brak klasyfikacji jako śnieg                                                     |
| **Wspinanie w śniegu**  | Kody śniegu WMO (71–77, 85–86) lub ≥ 1 mm opadów przy temp. max ≤ 1°C                            |
| **Wywiady**             | Maksymalny wiatr na 10 m ≥ 50 km/h                                                               |
| **Lampa**               | Temp. max 15–25°C, zmierzone opady < 0.1 mm, brak śniegu/burzy wg WMO                            |
| **Wilgoć**              | Średnia wilgotność ≥ 85%                                                                         |
| **Prowadzenie w burzy** | **Prowadzenie** w dniu z opadami innymi niż śnieg ≥ 10 mm                                        |
| **Cztery pory roku**    | Zdobądź przynajmniej raz odznaki: Fala upałów, Zlodowacenie, Mokry warun oraz Wspinanie w śniegu |

Bez `WEATHER_IMPORT` (lub przed pobraniem zaległości) odznaki te pozostaną zablokowane, nawet jeśli wspinaczka odbyła się w takich warunkach. „Seria upałów” (wiele gorących dni w jednym tygodniu) jest odroczona.

## Strona szczegółów pogody

Otwórz [Pogoda](/weather) z paska bocznego analityki lub klikając w tytuł dowolnej karty pogodowej na pulpicie. Pulpit wyświetla uproszczone warunki oraz podsumowanie temperatury maksymalnej i skuteczności przejść, gdy sygnał danych jest wyraźny. W przypadku braku wyraźnego sygnału, sekcja wyników zachowuje szczegółowe przedziały i elementy sterujące; strona szczegółów zawsze oferuje pełny widok. Zapisana widoczność i pozycje kart pulpitu są nadal stosowane.

Na stronie szczegółów sposób grupowania wyników i miara są zapisywane w adresie URL (`group=temperature|conditions`, `measure=sendRate|nearLimit|onsightFlash`), co pozwala na dodanie widoku do zakładek i korzystanie z przycisków Wstecz/Dalej. Wzorce pogodowe opisują korelacje, a nie zalecenia czy przyczyny.

**Zasięg i jakość lokalizacji** rozróżnia użyteczne dni z zapisaną lokalizacją, dni sprawdzone z niedostępną pogodą oraz dni jeszcze niesprawdzone (w tym dzisiejsze i przyszłe daty). Przejścia w skałach z poprawnymi datami, ale bez ustalonej lokalizacji, są liczone oddzielnie: nie można przypisać im konkretnej pogody i są wyłączone z mianownika tych obliczeń. Warunki zliczają wszystkie wpisy w skałach; wyniki zliczają tylko przejścia i próby. Elementy sterujące importem i lokalizacją pozostają w Ustawieniach, z linkiem w sekcji Pogoda dla zalogowanego właściciela.

Przy braku zapisanej pogody dla wspinaczki w skałach, strona wyjaśnia działanie importu. Niewielka ilość danych w pamięci podręcznej pozwala na wyświetlanie warunków, podczas gdy sekcja wyników oczekuje na osiągnięcie minimalnej próbki danych. Przeglądanie strony Pogoda nigdy nie wysyła żądań do dostawcy danych.

## Warunki pogodowe

Karta pulpitu **Warunki pogodowe** pojawia się, gdy przynajmniej jeden dzień wspinaczki w skałach ma zapisane dane pogodowe; bez `WEATHER_IMPORT` (lub przed zakończeniem pierwszego pobierania) pozostaje ukryta. Może być wyświetlana, ukrywana lub przemieszczana w Ustawienia → Pulpit, podobnie jak każda inna karta.

- **Dni** to _dniolokalizacje_: jeden dzień kalendarzowy w jednej zapisanej lokalizacji (szerokość/długość geograficzna zaokrąglona do jednego miejsca po przecinku). Dzień podzielony między dwa rejony liczy się podwójnie; drogi na ściance i inne prawdopodobnie halowe nigdy nie są wliczane.
- **Zasięg** porównuje dni z zapisaną pogodą ze wszystkimi dniami w skałach, które posiadają współrzędne drogi. Dni bez użytecznych danych w pamięci podręcznej (w tym niesprawdzone oraz sprawdzone, ale niedostępne) są wymienione jako „bez użytecznych danych pogodowych” i pomijane we wszystkich innych liczbach w widoku warunków.
- **Najgorętsze / najzimniejsze wspinanie** wykorzystuje maksymalną i minimalną temperaturę danego dnia. Link prowadzi do najwcześniej zarejestrowanego przejścia tego dnia w serwisie theCrag.
- **Udział dni** pokazuje dni idealne, deszczowe, śnieżne, mroźne i upalne jako udział w dniach z zapisaną pogodą, stosując te same zasady co w powyższych odznakach (deszcz ≥ 1 mm i brak śniegu, kody śniegu, min ≤ 0°C, max ≥ 35°C). Jeden dzień może pojawić się w więcej niż jednym wierszu, na przykład mroźny, śnieżny dzień.
- **Idealny** dzień to dzień z ładną pogodą (max 15–25°C, sucho, bez śniegu i burz), który jest również spokojny (maks. wiatr poniżej 25 km/h), mało wilgotny (średnia wilgotność poniżej 85%) i w którym temperatura w nocy nie spadła poniżej zera. Jeśli dla danego dnia brakuje danych o wietrze, wilgotności lub temperaturze minimalnej, nie jest on liczony jako idealny.
- **Maksymalna temperatura dobowata** to mały histogram maksymalnych temperatur każdego dnia w przedziałach co 5°C, oznaczony w wybranej przez Ciebie jednostce temperatury. Zakresy obejmują dolną granicę i wykluczają górną (na przykład 0–<5°C lub 32–<41°F).

Są to wartości modelowe dla najbliższej komórki siatki, a nie oficjalne dane klimatyczne czy pomiary pod samą ścianą.

## Pogoda a wyniki

Gdy **20 lub więcej** dniolokalizacji w skałach ma zapisaną pogodę, widok szczegółowy **Pogoda a wyniki** porównuje Twoje osiągnięcia wspinaczkowe w zależności od warunków atmosferycznych. Do tego czasu wyświetlana jest informacja, ile odpowiednich dniolokalizacji zostało dotychczas zapisanych. Podsumowanie na pulpicie pozostaje ukryte, dopóki pogoda nie zostanie zapisana i może być przemieszczane lub ukrywane w Ustawienia → Pulpit; strona szczegółów pozostaje dostępna z wyjaśnieniem o braku danych.

**Co jest liczone.** Przejścia i próby w skałach (ta sama klasyfikacja co w pozostałych częściach aplikacji), dla których dniolokalizacja ma zapisaną pogodę. Drogi na ściance, wpisy niebędące ani przejściem, ani próbą, oraz wspinaczki bez lokalizacji pogodowej są pomijane. Przejścia, których pogoda pochodzi z przybliżonego pobliskiego miejsca lub poligonu obszaru, są uwzględniane, a widok informuje o ich liczbie.

Kompaktowe podsumowanie na pulpicie pokazuje stosunek temperatury maksymalnej do skuteczności przejść. W przypadku braku wyraźnego sygnału na pulpicie oraz na stronie szczegółów dostępne są oba poniższe parametry sterujące.

**Grupuj według:**

- **Maksymalna temperatura:** poniżej 10°, 10–17°, 18–24°, 25–29° oraz 30°+. Każdy przedział obejmuje swoją dolną granicę i kończy się tuż przed kolejnym, podobnie jak zakresy temperatur w dzienniku.
- **Warunki:** Ładna pogoda, Sucho (zmierzone opady poniżej 1 mm i brak śniegu; brak danych o deszczu oznacza stan nieznany, a nie suchy), Deszczowo, Śnieżnie, Gorąco, Mroźnie, Spokojnie (maks. wiatr poniżej 25 km/h) i Wietrznie (≥ 50 km/h), zgodnie z zasadami odznak/dziennika opisanymi powyżej. Jeden dzień może odpowiadać kilku warunkom. Zmierzony wiatr od 25 do poniżej 50 km/h nie jest klasyfikowany ani jako Spokojny, ani jako Wietrzny.

**Miary:**

- **Skuteczność przejść:** liczba przejść jako udział w sumie przejść i prób.
- **Blisko limitu:** udział przejść z wyceną w granicach 2 stopni (1 stopień w skali V) od Twojego najtrudniejszego przejścia w skałach w **tym samym stylu i skali wycen** w ciągu 365 dni poprzedzających dany dzień. Drogi tradycyjne są porównywane z tradycyjnymi, a sportowe ze sportowymi; skala V i wyceny dróg nigdy nie są mieszane. Użycie Twoich ostatnich najlepszych wyników zamiast życiowych osiągnięć sprawia, że wzrost formy na przestrzeni lat nie powoduje, że niedawna pogoda wydaje się lepsza. Przejścia bez wcześniejszego przejścia w tym samym stylu w danym roku oraz przejścia bez wyceny są wyłączone z tej miary.
- **Onsight/flash:** liczba przejść w stylu onsight i flash jako udział we wszystkich przejściach.

**Rzetelna interpretacja.**

- Każdy słupek pokazuje wskaźnik dla danego przedziału; linia oznacza Twój ogólny wskaźnik. Przedział wymaga co najmniej **10** wspinaczek (dla mianownika danej miary) w ciągu co najmniej **3** dni, aby wyświetlić wskaźnik. Dla mniejszych przedziałów wyświetlany jest komunikat „Zbyt mało danych”.
- Przedział jest oznaczany jako **Wyższy** lub **Niższy** tylko wtedy, gdy różni się od wszystkich _innych_ dni pogodowych bardziej, niż wynikałoby to ze zmienności z dnia na dzień (test dwustronny na poziomie około 95%), przy co najmniej 5 dniach po każdej stronie. Wspinaczki tego samego dnia dzielą tę samą pogodę i zazwyczaj ten sam rejon oraz partnera, więc test traktuje każdą dniolokalizację jako jedną jednostkę, a nie każdą wspinaczkę z osobna. Jeden wyjątkowy dzień w skałach nie może sam w sobie stworzyć wzorca.
- Jednowierszowe podsumowanie wskazuje przedział, który najbardziej wyróżnia się dla wybranej miary, lub informuje, że nic się jeszcze nie wyróżnia.
- Jest to **korelacja, a nie przyczyna**. Pora roku, rejon, partnerzy i etap zaawansowania w projekcie — wszystko to zmienia się wraz z pogodą. Przy wielu przedziałach i miarach, sporadyczne wskazanie „Wyższy” lub „Niższy” może pojawić się przez przypadek.

Każdy przedział maksymalnej temperatury oraz warunki: ładna pogoda, deszcz, śnieg, upał, mróz, spokój i wiatr, prowadzą do wykazu przefiltrowanego pod kątem tych przejść. Dla warunku „Sucho” nie ma filtra w dzienniku. Tabela wartości pod wykresami na stronie szczegółów zawiera listę wszystkich przedziałów wraz z liczbami dla wszystkich trzech miar. Wyświetlanie karty nigdy nie wyzwala żądania danych pogodowych, a prywatne notatki nigdy nie są wykorzystywane.

Gdy porównanie temperatury i skuteczności na pulpicie nie wykazuje wyraźnego sygnału, karta Pogoda a wyniki zachowuje szczegółowe przedziały, lokalne sterowanie grupowaniem/miarami oraz tabelę wartości. Te elementy sterujące nie zmieniają adresu URL pulpitu. Wyraźny sygnał zachowuje kompaktowe podsumowanie; obie wersje linkują do strony pogody. Minimalne progi próbki pozostają bez zmian.

## Filtry i znaczniki dziennika

Odniesienia do limitu korzystają z tego samego obliczenia stylu i skali wycen co
[Rodzaje skał i wyniki](/docs/rock-types), z użyciem wycen pokonanych wyciągów, jeśli są dostępne.
Odniesienie pogodowe obejmuje przejścia w skałach bez zapisanej pogody, uwzględnia 365. dzień wstecz i wyklucza przejścia z dnia, który jest porównywany.

Gdy jakakolwiek pogoda jest zapisana w pamięci podręcznej, dziennik zyskuje filtr **Pogoda w danym dniu** (`?weather=`): `fair`, `perfect`, `heat`, `freeze`, `rain`, `snow`, `wind` lub `calm`. **Wietrzny dzień** pasuje do dziennej maksymalnej prędkości wiatru na 10 m **≥ 50 km/h**, czyli tego samego progu co odznaka **Wywiady**. **Spokojny / bezwietrzny dzień** pasuje do zmierzonej maksymalnej prędkości wiatru **poniżej 25 km/h** — progu spokoju używanego przez **Idealny dzień**, bez wymogu sprzyjającej temperatury, suchej pogody czy niskiej wilgotności. Brak odczytów wiatru nie pasuje do żadnej opcji; dni z wiatrem od 25 do poniżej 50 km/h nie pasują do żadnego filtra wiatru. Pozostałe opcje stosują te same zasady co odznaki. Filtr dopasowuje tylko przejścia **w skałach** posiadające współrzędne i zapisaną pogodę dla danej lokalizacji; drogi na ściance, przejścia bez współrzędnych oraz dni, które nie zostały jeszcze pobrane, nigdy nie zostaną dopasowane.

Wiersze w dniach z zapisaną pogodą pokazują również małe tekstowe znaczniki (na przykład „Upał 36°C”, „Mróz -2°C”, „Deszcz 4 mm”, „Śnieg”, „Wietrznie 55 km/h”, „Ładna pogoda 21°C”). Zwykłe dni nie wyświetlają nic.

Zalogowany właściciel widzi również opcję **Brak zapisanej pogody** (`?missing=weather`), która wyświetla przejścia w skałach ze współrzędnymi i datą wsteczną, które wciąż nie mają danych pogodowych; pozwala to zobaczyć, co zostanie pobrane w następnych importach. Odwiedzający nigdy nie widzą tej opcji.

Zaległości w brakującej pogodzie wykluczają dni, które dostawca już sprawdził, ale nie mógł dostarczyć dla nich danych. Te negatywne wpisy w pamięci podręcznej nie generują znaczników pogodowych i nie są automatycznie kolejkowane ponownie. Nieprawidłowe daty kalendarzowe są wykluczone zarówno z importera, jak i z listy zaległości.

## Ostatnie aktywności

Karta pulpitu **Ostatnie aktywności** pokazuje te same znaczniki tekstowe pod wspinaczką w skałach, gdy jej dzień jest zapisany w pamięci podręcznej. Są one wyświetlane jako krótka lista z etykietą „Pogoda w danym dniu”, nigdy wyłącznie za pomocą koloru, a pasek ten jest pomijany dla dróg na ściance, dni bez danych pogodowych oraz zwykłej pogody.

## Historia wspinania

Procenty w historii opisują zapisane dniolokalizacje w skałach, a nie dni, których pogoda jest wciąż nieznana.

Gdy pamięć podręczna obejmuje co najmniej 20 dni w skałach i połowę lub więcej Twoich wszystkich dni w skałach, [Historia wspinania](/docs/climbing-story) może dodać jedną krótką linijkę o warunkach, w jakich się wspinasz (śnieg, zimno, upał, deszcz lub duża rozpiętość temperatur). Opisuje ona warunki, w których faktycznie się wspinasz, nigdy te, których unikasz, i nie pojawia się w historii, gdy zasięg danych jest zbyt mały.

## Kalendarz przejść

[Kalendarz przejść](/docs/ascent-calendar) posiada tryb kolorystyczny **Pogoda** (widoczny dopiero po zapisaniu danych pogodowych). Korzysta on z tych samych zasad co odznaki; legenda kolorów znajduje się na tamtej stronie.

## Sektory: klimat podczas Twoich wizyt

Na stronie **Sektory**, rejon z co najmniej **5** zapisanymi dniami wizyt w skałach wyświetla jednowierszowe podsumowanie: średnią temperaturę maksymalną i minimalną oraz udział dni z deszczem, śniegiem, mrozem lub upałem (śnieg, mróz i upał tylko powyżej 0%). Opisuje to dni, w których faktycznie się tam wspinałeś, więc skłania się ku porom roku, w których bywasz. **Nie** są to oficjalne dane klimatyczne ani prognoza; informacja ta jest ukryta dla rejonów poniżej progu, dla dróg na ściance oraz gdy nie ma zapisanej pogody.

## Wskaźnik ładnej pogody

Gdy **20 lub więcej** dni w skałach ma zapisaną pogodę, karta Warunki pogodowe dodaje **Wskaźnik ładnej pogody**: udział dni, które były _ładne_ (max 15-25°C, sucho, bez śniegu i burz — ta sama zasada co przy odznace **Lampa**). Podaje ona również udział dni _trudnych_ (upał, mróz, deszcz, śnieg lub bardzo silny wiatr). Dni pomiędzy, takie jak suchy dzień z temperaturą 29°C, nie są wliczane do żadnej z tych grup.

Etykieta ma charakter opisowy, nie jest oceną: **Skłonność do ładnej pogody** przy 60% lub więcej dni ładnych, **Wspinacz na każdą pogodę** przy 50% lub więcej dni trudnych, w przeciwnym razie **Trochę jednego i drugiego**. Grupy mogą się pokrywać: łagodny, suchy dzień może być jednocześnie bardzo wietrzny lub mroźny w nocy. Gdy oba progi etykiet zostaną osiągnięte, priorytet ma **Wspinacz na każdą pogodę**. Poniżej 20 dni nic nie jest wyświetlane, więc przy małej liczbie danych system nie nadaje Ci etykiety. Link otwiera dziennik przefiltrowany do ładnych dni.
Sezonowe rekomendacje oparte na metadanych dróg znajdziesz w sekcji [Najlepsze miesiące](/docs/best-months); rekomendacje te są niezależne od pogody zarejestrowanej podczas Twoich wizyt.

Etykiety ładnej pogody używają dokładnej liczby dni dla swoich progów; wyświetlane wskaźniki są zaokrąglane do jednego miejsca po przecinku. Samo zaokrąglenie wyświetlania nigdy nie zmienia Twojej etykiety.

### Od szczegółów pogody do Twojego dziennika

Każdy wiersz warunków i każdy słupek temperatury maksymalnej w widoku szczegółowym **Warunki pogodowe** otwiera dziennik przefiltrowany do tych dni. Słupek temperatury obejmuje swoją dolną granicę i kończy się tuż przed kolejnym słupkiem (na przykład 20–24° obejmuje od 20.0 °C do, ale bez, 25 °C). Zakres pozostaje zastosowany podczas sortowania, stronicowania lub dodawania innych filtrów; użyj **Wyczyść zakres pogodowy**, aby usunąć tylko ten zakres.

Karta zlicza _dni_ w każdej lokalizacji, podczas gdy dziennik wymienia każde pasujące _przejście_, więc te dwie liczby mogą się różnić. Na szerokich ekranach dziennik pokazuje kolumnę Pogoda z zapisaną temperaturą maksymalną, minimalną i opadami; na mniejszych ekranach znaczniki warunków pojawiają się zamiast tego obok drogi. Przejścia halowe lub bez zapisanej pogody wyświetlają kreskę. Przeglądanie tych stron nigdy nie wyzwala żądania danych pogodowych.

## Lokalizacje pogodowe w przypadku braku współrzędnych drogi

Eksporty CSV nie zawierają współrzędnych. Przy włączonym imporcie pogody i danych dróg (`WEATHER_IMPORT=true` i `ROUTE_DATA_IMPORT=true`), skonfigurowany klucz API wspierającego może również wyszukiwać lokalizacje dla ID rejonów/sektorów znalezionych w zapisanych danych dróg. Nie powoduje to importu dziennika ani profilu właściciela tego klucza. Obsługiwane są zarówno powiązane nadrzędne elementy dziennika, jak i tablice nadrzędne z API dróg.

Wyszukiwanie obszarów korzysta z budżetu dziesięciu żądań importu dróg i jednosekundowych odstępów. Sprawdzanie dróg wykorzystuje budżet w pierwszej kolejności; pozostałe żądania sprawdzają do dziesięciu obszarów każde. Ustawienia wyświetlają **oczekujące obszary pogodowe** i oferują opcję **Sprawdź lokalizacje pogodowe teraz**, gdy wszystkie drogi zostaną sprawdzone. Istniejące instalacje CSV mogą uzupełnić brakujące lokalizacje obszarów bez konieczności używania funkcji **Odśwież wszystkie drogi**. Następny proces importu sprawdza również zaległości. Po zakończeniu sprawdzania lokalizacji, jeśli istnieją odpowiednie dni, rozpoczyna się proces pobierania pogody w tle.

Odpowiedzi dla obszarów (w tym brakujące lokalizacje) są zapisywane raz według ID obszaru dostawcy. `ROUTE_DATA_REFRESH_DAYS` kontroluje również ich opcjonalny wiek odświeżania, a funkcja **Odśwież wszystkie drogi** sprawia, że wyszukiwanie obszarów staje się ponownie możliwe. Błędy dostępu przerywają import i uruchamiają istniejący mechanizm ponawiania; klucz umożliwiający odczyt historii dróg nie gwarantuje dostępu do lokalizacji obszarów. Jeśli API nie dostarcza żadnej obsługiwanej lokalizacji, użyj jawnego wyboru pobliskiego miejsca poniżej. Podczas przeglądania stron pogodowych nie są wykonywane żadne połączenia z API.

System preferuje konkretny punkt drogi, następnie punkt nadrzędnego rejonu (TLC), a na końcu punkt bezpośredniego sektora z zapisanych danych dostawcy. Ignoruje geometrię ograniczoną tylko do kraju lub dowolnych elementów nadrzędnych. Starsze zapisane punkty bez oryginalnej geometrii dostawcy pozostają użyteczne i są oznaczane jako „Zapisany punkt”; ich oryginalna precyzja nie może zostać odzyskana tylko z tego punktu. Drogi halowe pozostają wykluczone.

Ustawienia → Importuj pogodę → **Przejrzyj lokalizacje pogodowe** wyświetla listę obszarów w skałach i liczbę nierozpoznanych dróg. W przypadku braku lokalizacji wyszukaj pobliskie miasto, używając jego nazwy/regionu i dwuliterowego kodu kraju, a następnie jawnie wybierz właściwy wynik. Wyszukiwanie przesyła tylko wpisany tekst i kod kraju do [geokodowania Open-Meteo](https://open-meteo.com/en/docs/geocoding-api), którego dane lokalizacyjne pochodzą z GeoNames. Nie przesyła ono danych o drogach, dat wspinaczek, prywatnych notatek ani kluczy API. Wyszukiwanie odbywa się dopiero po przesłaniu formularza, wyniki są zapisywane na 30 dni, wysyłane w odstępach i wstrzymywane w przypadku błędów.

Wybrane miasto służy jako **przybliżona lokalizacja zapasowa**, współdzielona tylko przez to samo ID obszaru dostawcy (lub tożsamość drogi, jeśli ID obszaru nie istnieje). Nie nadpisuje ono współrzędnych drogi, nie zmienia map dróg ani nie twierdzi, że jest najbliższą osadą. Prawidłowy punkt drogi/sektora/rejonu zawsze ma priorytet. Pogoda w mieście może różnić się od tej pod ścianą ze względu na odległość, wysokość i ukształtowanie terenu, dlatego dane oparte na miastach pojawiają się w widokach i filtrach pogody, ale **nie odblokowują odznak pogodowych**. Możesz usunąć lokalizację zapasową w dowolnym momencie.

Dziennik i ostatnie aktywności pokazują źródło lokalizacji pogodowej. Importer, zaległości, kalendarz, karta warunków, podsumowania wizyt w rejonach i dziennik korzystają z tego samego klucza ustalonej lokalizacji/dnia. Zmiana lub usunięcie lokalizacji zapasowej natychmiast przerywa korzystanie z jej starego klucza; stara pogoda pozostaje w pamięci podręcznej i może być nadal używana przez inne wspinaczki w tej lokalizacji. Pobierz następną partię pogody, aby uzupełnić nowo wybraną lokalizację. Funkcja Wipe czyści ustalenia, wybory miejsc i wyniki wyszukiwania oraz anuluje trwające wyszukiwania.

W przypadku braku tych punktów, jawnie wpisana geometria GeoJSON Polygon/MultiPolygon dla zidentyfikowanego rejonu lub sektora może dostarczyć współrzędną swojej pierwszej granicy zewnętrznej; środek ani centroid nie są obliczane. Jest on oznaczony jako **Wielokąt przybliżonego obszaru** i nie odblokowuje pogody ani odznak Summer Sun Face. Punkty dróg i rejonów zawsze mają pierwszeństwo. Granice krajów/regionów, zniekształcone kształty, duże obszary (o przekątnej ograniczającej powyżej 15 km) oraz kształty przecinające linię zmiany daty są wykluczone. Nieotypowane tablice granic i nieudokumentowane formaty Fence pozostają nieobsługiwane; żaden przechwycony fixture wielokąta dostawcy nie jest jeszcze dostępny. Wybrane miasto jest używane tylko wtedy, gdy te geometryczne mechanizmy rezerwowe również zawiodą. Importowanie pogody musi pozostać włączone, aby pobrać brakujące dni. Summer Sun Face korzysta z oddzielnie zweryfikowanych dowodów z tagów dróg; zobacz [Odznaki](/docs/badges).
