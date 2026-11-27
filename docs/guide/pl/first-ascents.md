# Pierwsze przejścia

Karta **Pierwsze przejścia** zlicza drogi i buldery, na których masz na koncie pierwsze przejście (**FA**) lub pierwsze przejście klasyczne (**FFA**). Gdy historia dróg jest zachowana w pamięci podręcznej, pokazuje również, na ilu drogach widniejesz jako **autor drogi** (obijanie / autorstwo).

## Czego potrzebujesz

- **Logowanie właściciela** — jeśli ustawiono `APP_PASSWORD`, zaloguj się, aby otworzyć Ustawienia i użyć opcji **Oznacz FA** / **FFA** w wykazie przejść. Odwiedzający widzą kartę i odznaki, gdy co najmniej jedna droga zostanie oznaczona, ale nie mogą sami dodawać oznaczeń.
- **Opcjonalny import danych o drogach** — ustaw `ROUTE_DATA_IMPORT=true` na serwerze, jeśli chcesz, aby Crag Stats automatycznie oznaczał FA i FFA z publicznej historii dróg na theCrag (zobacz poniżej). Zarówno ręczne oznaczenia, jak i import zapisują dane do tej samej tabeli `first_ascents`; żadne z nich nie zależy od prywatnych notatek.
- **Prywatne notatki nie mają wpływu** — opcja **Ustawienia → Pokaż prywatne notatki** kontroluje jedynie to, czy Twoje **komentarze do przejść** pojawiają się na stronie `/logbook` (oraz w wyszukiwaniu). Nie blokuje to karty Pierwsze przejścia, odznak FA/FFA, kamieni milowych ani importu danych o drogach.

## Oznaczanie pierwszego przejścia

theCrag zapisuje pierwsze przejścia w **historii** każdej drogi (wpisy FA / FFA na stronie drogi), a nie jako typ przejścia. API wykazu przejść nie zwraca historii drogi, więc zwykła synchronizacja ich nie widzi. Możesz oznaczyć je samodzielnie lub włączyć opcjonalny import poniżej.

### Oznacz przejście samodzielnie

1. Otwórz **Wykaz przejść** i znajdź dowolne przejście danej drogi.
2. Najedź kursorem na wiersz (lub przejdź do niego tabulatorem) i kliknij **Oznacz FA** lub **FFA**.
3. Kliknij **Cofnij oznaczenie**, aby cofnąć.

Tylko osoba, która może otworzyć Ustawienia, może oznaczać FA: każdy, jeśli nie ustawiono `APP_PASSWORD`, w przeciwnym razie tylko po zalogowaniu. Odwiedzający widzą odznakę FA oraz kartę, ale nie widzą przycisków.

Oznaczenie jest zapisywane przypisane do ID drogi w theCrag, dzięki czemu przetrwa ponowne synchronizacje. Znika z karty, jeśli wszystkie przejścia drogi zostaną usunięte w theCrag, i powraca, gdy ponownie wpiszesz przejście tej drogi. **Ustawienia → Wyczyść** usuwa wszystkie oznaczenia.

### Filtruj wykaz przejść

W **Wykazie przejść** użyj opcji **Oznaczenie pierwszego przejścia**, aby pokazać tylko swoje FA, FFA, dowolne z nich lub przejścia bez oznaczenia (`?fa=FA|FFA|any|none`). Jeśli import danych o drogach jest włączony, właściciel otrzymuje również opcję **Historia jeszcze niesprawdzona** (`?history=pending`), która wyświetla przejścia jeszcze niepobrane przez importera.

### Importuj je z historii dróg (opcjonalnie, domyślnie wyłączone)

Jeśli właściciel serwera włączy tę opcję (`ROUTE_DATA_IMPORT=true`; w starszych wersjach nazywało się to `ROUTE_HISTORY_IMPORT`, co nie jest już odczytywane, więc zmień nazwę i uruchom ponownie), Crag Stats odczyta w tle publiczną historię każdej drogi z wykazu przejść z theCrag i oznaczy FA oraz FFA, w których figuruje Twoja nazwa użytkownika.

- **Liczą się tylko wpisy zawierające Twoją nazwę użytkownika w theCrag** (`@yourlogin`). Imiona i nazwiska w postaci zwykłego tekstu są ignorowane, ponieważ łatwo je pomylić. Synchronizacja przez API zapisuje ten login; jeśli Twój wykaz przejść pochodzi z plików CSV, ustaw `THECRAG_USERNAME`, aby import wiedział, które wpisy są Twoje.
- **Twoje wybory mają priorytet.** Ustawione przez Ciebie oznaczenia pozostają bez zmian, a drogi z odznaczonym symbolem pozostają nieoznaczone. **Ustawienia → Importuj dane dróg → Zastosuj ponownie** może nadpisać jedno i drugie, używając już zapisanej historii, bez ponownego odpytywania theCrag.
- **Bezpieczne dla theCrag.** Domyślnie każda droga jest sprawdzana **raz** (opcjonalne okresowe odświeżanie danych opisano poniżej), maksymalnie **100 dróg na jedno uruchomienie** i jedno zapytanie na sekundę. A run happens after each logbook sync or CSV upload, on the background import schedule (`IMPORT_CRON`, daily by default), when the app restarts with routes still waiting (for example after an upgrade), or when you press **Check next 100 routes now**. Jeśli theCrag zacznie ograniczać zapytania, import zostanie wstrzymany na co najmniej jeden dzień.
- Ustawienia pokazują, ile z Twoich dróg zostało do tej pory sprawdzonych. Przy codziennej synchronizacji sprawdzenie kilkuset dróg zajmuje kilka tygodni; kliknięcie przycisku przyspiesza ten proces.

Zapisywana jest tylko publiczna historia dróg, nigdy prywatne notatki do przejść. **Ustawienia → Wyczyść** usuwa je wraz z Twoimi oznaczeniami.

## Co pokazuje karta

Gdy karta zawiera zaimportowane wpisy FA/FFA lub autorstwa drogi, w stopce znajduje się informacja o pochodzeniu danych z historii dróg theCrag. Dotyczy to zapisanych wpisów autorstwa, nawet jeśli import zostanie później wyłączony. Ręczne oznaczenia nie wymagają etykiety źródła; w przypadku mieszanych zestawów zachowywana jest informacja o historii drogi.

- **Liczba:** ile dróg jest przypisanych jako FA lub FFA, na podstawie ręcznych oznaczeń lub importu danych o drogach (publicznej historii dróg). Gdy masz na koncie przejścia FFA, pokazuje również podział na FA / FFA.
- **Drogi autorskie:** unikalne drogi, których zachowana historia wymienia Cię jako autora drogi (`@yourlogin`). Obowiązuje ta sama zasada `@login` co przy imporcie FA; nazwy w postaci zwykłego tekstu nie są brane pod uwagę. Wymaga włączonego importu danych o drogach (`ROUTE_DATA_IMPORT=true`), aby te wiersze zostały zapisane lokalnie.
- **Przejścia społeczności (szacunkowo):** zapisane w pamięci przejścia na drogach Twojego autorstwa (oznaczenia FA/FFA **lub** autorstwo drogi), minus Twoje własne przejścia zarejestrowane podczas tego samego pobrania. Drugi kafel wyodrębnia drogi **sportowe / ubezpieczone** (styl asekuracji Sport lub dowolna droga z zarejestrowanymi punktami asekuracyjnymi/spitami). Późniejsze powtórzenia lub usunięcia dokonane przez właściciela nie zmieniają wcześniejszej migawki danych. Są to szacunkowe sumy przejść, a nie liczba unikalnych wspinaczy czy licznik na żywo; różnice w widoczności oraz niepełny wykaz przejść właściciela mogą wpływać na te dane.
- **Pokrycie społeczności:** karta pokazuje, ile przypisanych dróg z wykazu przejść ma sparowane migawki liczby przejść w stosunku do wszystkich kwalifikujących się dróg. Potwierdzone zerowe wartości są wyświetlane jako zero; niedostępne liczby przejść są pomijane, a nie traktowane jako zero. Częściowe pokrycie jest wyraźnie oznaczone. Całkowity brak danych w pamięci podręcznej powoduje wyświetlenie komunikatu o niedostępności.
- **Lata:** od roku Twojego pierwszego FA do najnowszego. Każde FA jest datowane na podstawie Twojego **pierwszego zarejestrowanego przejścia czystego** drogi (zobacz poniżej).
- **Zakres wycen:** Twoje najłatwiejsze i najtrudniejsze FA, przy użyciu wyceny całej drogi (a nie pojedynczego wyciągu). Drogi i buldery są wymienione osobno, ponieważ wycen w skali Ewbank i skali V nie można porównywać. Wyceny są wyświetlane w wybranych przez Ciebie systemach wycen dla dróg i bulderów.
- **Style:** jak Twoje FA dzielą się na sportowe, tradycyjne, buldering itp., na podstawie stylu drogi w theCrag.
- **Najnowsze:** Twoje trzy najnowsze FA na karcie pulpitu (pełna lista jest dostępna w wykazie przejść).
- **Społeczność wg dróg:** trzy najlepsze drogi z przypisanym autorstwem na pulpicie (kolejne są zliczane pod listą).
- **Społeczność wg dróg:** do ośmiu dróg z przypisanym autorstwem, uporządkowanych według szacunków społeczności. Każdy wiersz pokazuje oznaczenie FA, FFA i/lub autorstwo drogi, odznakę stylu (Sportowe/ubezpieczone, Trad, Bulder lub inny znany styl asekuracji z zapamiętanych informacji o drodze), szacowaną wartość (lub Niedostępne) oraz czas pobrania tej liczby. Świeżość danych liczbowych jest przechowywana oddzielnie od innych pól informacji o drodze, więc samo odświeżenie patentu lub oceny jakości nie powoduje udawania, że licznik jest nowy.

Karta pojawia się odwiedzającym dopiero po oznaczeniu co najmniej jednego FA. Do tego czasu właściciel widzi w tym miejscu krótki poradnik.

Import danych o drogach musi być włączony (`ROUTE_DATA_IMPORT=true`), aby wypełniać migawki liczby przejść. Suma przejść społeczności oraz migawki przejść właściciela pochodzą z API dróg podczas importu w tle (100 dróg na uruchomienie, obowiązują zasady kontroli tempa i wycofania). Aby automatycznie utrzymywać świeżość sum i innych danych dróg, ustaw `ROUTE_DATA_REFRESH_DAYS` na całkowitą liczbę dni od 30 do 3650 (np. zalecane `90` lub `180` dla około pół roku) obok `ROUTE_DATA_IMPORT=true`. Drogi stają się kwalifikowalne po upływie tej liczby dni i odświeżają się po pomyślnej synchronizacji wykazu przejść, dzieląc limit 100 dróg z nowymi drogami. Pierwszeństwo mają nowe drogi, a następnie najstarsze nieaktualne dane; duże zaległości mogą wymagać wielu synchronizacji. Brak ustawienia, `0`, wartość poniżej 30 lub powyżej 3650 zachowuje tryb jednorazowego pobierania; opcja **Odśwież wszystko** w Ustawieniach pozostaje opcjonalnym ręcznym resetem. Ręczne oznaczenia i ich usunięcia pozostają chronione.

W Ustawieniach przycisk sprawdzania historii dróg odlicza czas do momentu, gdy dozwolone będzie kolejne uruchomienie, i staje się dostępny automatycznie. Minimalny odstęp między uruchomieniami wynosi jedną minutę; blokada lub błąd może wymagać dłuższego czasu oczekiwania. Bez obsługi JavaScript odśwież Ustawienia, aby zaktualizować dostępność.

## Kiedy FA się liczy i jego data

Pierwsze przejście to przejście czyste, więc każde z nich jest datowane na Twoje **pierwsze zapisane przejście** oznaczonej drogi. Wcześniejsze próby i patentowanie podczas pracy nad drogą nie się nie liczą, podobnie jak późniejsze powtórzenia. Jeśli do tej pory zarejestrowano tylko próby, droga nadal pojawia się na karcie (z datą Twojego najwcześniejszego przejścia), ale nie przyznaje odznak ani kamienia milowego, dopóki nie zarejestrujesz czystego przejścia.

## Odznaki i kamienie milowe

Odblokowują się one na podstawie oznaczonych przez właściciela FA/FFA (oraz Twojego pierwszego czystego przejścia każdej oznaczonej drogi), a nie po włączeniu prywatnych notatek. Karta Kamienie milowe oraz katalog odznak używają tych samych progów — a nie jednego wiersza na drogę.

- **Pierwsze przejście** i **Pierwsze przejście klasyczne:** Twoje pierwsze czyste przejście drogi oznaczonej przez Ciebie jako FA lub FFA.
- **Łączna liczba pierwszych przejść** (5, 10 / Pionier, 20, 50, 100): tyle różnych dróg oznaczonych jako FA lub FFA.
- **Liczba pierwszych przejść klasycznych** (5, 10, 20, 50, 100): tylko oznaczenia FFA.
- **Liczba pierwszych przejść według stylu** (10, 20, 50 dla stylu Sport, Trad i Bulder): oznaczenia FA lub FFA w danym stylu asekuracji.
- **Autor drogi**, **Eksplorator dróg** (5), **Budowniczy ścian** (10), **Architekt rejonu** (25): wpisy autorstwa dróg z zapamiętanej historii, datowane na podstawie najwcześniejszego wpisu autora wymieniającego Twój `@login` na danej drodze (a nie czystych przejść z wykazu).
- **Wspólny rejon** (10), **Ulubieniec tłumów** (50), **Sto dłoni** (100), **Lokalny klasyk** (500): szacunkowa liczba przejść społeczności na drogach Twojego autorstwa (FA/FFA lub obijanie/autorstwo), ze sparowanych migawek liczby przejść. Liczby te oznaczają przejścia, a nie unikalnych wspinaczy. Niepełne pokrycie jest zaznaczone w szczegółach odznaki.
- **Szum obitych dróg** (10), **Magnes sportowy** (50), **Ekspresowy klasyk** (100): ten sam szacunek ograniczony do dróg w stylu Sport lub ubezpieczonych/obitych.

Każdy próg jest datowany na podstawie pierwszego czystego przejścia drogi, która go przekroczyła; w szczegółach podano nazwę tej odblokowującej drogi.

Wpisy autorstwa bez prawidłowej daty w historii nadal liczą się do odznak autora drogi, ale data ich uzyskania pozostaje nieznana. Odznaki za przejścia społeczności również pozostawiają datę uzyskania nieznaną — sumy są zagregowanymi danymi z pamięci podręcznej, a nie konkretnym dniem wydarzenia.
