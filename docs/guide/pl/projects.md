# Projekty

Crag Stats wyświetla drogi w skałach jako **otwarte projekty**, jeśli w dzienniku przejść znajdują się nieudane próby z **co najmniej dwóch różnych dni wspinaczkowych**. Wiele prób podjętych wyłącznie jednego dnia nie tworzy otwartego projektu. Otwarte projekty znikają po roku bez jakiejkolwiek aktywności.

**Ukończony projekt** to droga poprowadzona po pracy trwającej co najmniej dwa dni lub po **co najmniej dwóch nieudanych próbach w dniu przejścia** (łącznie trzy lub więcej prób, wliczając samo przejście). Próby mogą być zapisanymi osobnymi wpisami lub ujęte w liczniku prób przy samym przejściu. Osobne wpisy oraz liczba prób przy przejściu nie są sumowane, aby uniknąć podwójnego liczenia tych samych prób. Przejścia w pierwszej próbie oraz jedna nieudana próba zakończona przejściem tego samego dnia nie są uznawane za projekty. Liczy się tylko praca wykonana do momentu pierwszego przejścia; późniejsze powtórzenia nie zmieniają wcześniejszego przejścia w projekt. Brakujące lub nieprawidłowe daty nie pozwalają na wyznaczenie sesji. Ukończone projekty pojawiają się na półce **Ostatnio zrobione** przez sześć miesięcy kalendarzowych.

Gdy zarówno próba, jak i pierwsze przejście posiadają oznaczenie godziny, próby po tym przejściu są wykluczane z klasyfikacji. Wpisy zawierające tylko datę w dniu przejścia są traktowane jako praca nad drogą, ponieważ ich kolejność w ciągu dnia jest nieznana. W przypadku wielu przejść z tą samą datą bez podanej godziny, brana jest pod uwagę kolejność ich zapisania, więc późniejsze powtórzenie nie zastępuje pierwszego odnotowanego przejścia. Suma sesji na kartach i w panelu głównym wykorzystuje te same prawidłowe dni kalendarzowe co klasyfikator.

**Ostatnio zrobione** obejmuje ostatnie sześć miesięcy kalendarzowych według czasu UTC, wliczając dzień graniczny dla przejść z samą datą. Pod koniec miesiąca granica przesuwa się na ostatni poprawny dzień (np. 31 października cofa się do 30 kwietnia). Daty z przyszłości są wykluczone. Przejścia z oznaczeniem godziny zachowują czas odniesienia na granicy okresu. Panel główny używa tego samego okna czasowego przy zapełnianiu wolnych miejsc na projekty ostatnimi przejściami.

## Wybieranie własnych projektów

Właściciel widzi kompaktowe kontrolki projektów obok przycisków FA/FFA w wykazie oraz na kartach i w szczegółach projektów:

- **Oznacz jako projekt** pozwala wybrać zapisaną drogę w skałach nawet po tylko jednej sesji lub po roku braku aktywności.
- **To nie projekt** / **Usuń oznaczenie** usuwa drogę z Projektów, panelu głównego i licznika aktywnych projektów, dopóki właściciel nie oznaczy jej ponownie lub nie przywróci automatycznego wykrywania.
- **Użyj automatycznych** usuwa ręczny wybór i przywraca powyższe zasady.

Każda zmiana kontrolki jest zapisywana bezpośrednio. Kontrolki w wykazie pozostawiają użytkownika na tej samej przefiltrowanej stronie; te na karcie lub w szczegółach projektu powodują powrót do listy projektów. Tag Projekt / To nie projekt wskazuje na ręczny wybór bez polegania na kolorach.

Wybory są lokalnymi metadanymi i przetrwają synchronizację, przebudowę pamięci podręcznej, a nawet sytuację, w której droga zostanie usunięta z serwisu i później do niego wróci. Nie zmieniają one wykazu w serwisie theCrag ani jego publicznej flagi projektu. Tylko faktyczne zapisane przejście sprawia, że wybrany projekt zostanie uznany za zrobiony. Wybrane przejścia spoza sześciomiesięcznego okna pojawiają się w sekcji **Wcześniej wybrane przejścia** zamiast w Ostatnio zrobionych. Ustawienia → Wyczyść usuwa zaznaczenia. Odwiedzający mogą widzieć wynikowe projekty, ale nie mogą zmieniać wyborów. Drogi halowe i niezalogowane nie mogą być dodawane ręcznie.

## Szczegóły projektu, postępy i szacunki

Kliknij nazwę projektu na stronie Projektów lub w panelu głównym, aby otworzyć stronę jego szczegółów. Pokazuje drogę, fragmenty publicznego przewodnika w pamięci podręcznej, postęp sesji z datami oraz poprzednie próby/przejścia (wliczając etykiety przebytych wyciągów). Link na dole otwiera każdy wpis w wykazie dla tej konkretnej drogi, w tym starsze powtórzenia. Prywatne notatki o przejściach pozostają w wykazie zgodnie z istniejącymi ustawieniami widoczności tylko dla właściciela.

Pasek **przybliżonej gotowości** opiera się na metodzie gotowości do celów: mierzy on dowody wspierające, a nie procent trudności drogi czy prawdopodobieństwo przejścia. Tylko zapisane przejście na tej konkretnej drodze zapełnia pasek do końca. Inna droga o tych samych trudnościach nie może tego zrobić. Wcześniejsze sesje biorą pod uwagę tylko dowody dostępne do danego dnia wspinaczkowego, więc późniejsze przejście nie zmienia wstecznie poziomu ich gotowości.

Dla każdego dnia odniesienia model wykorzystuje dane z poprzednich 365 dni (wliczając ten dzień) z przejść w skałach w tej samej dyscyplinie i skali trudności, biorąc pod uwagę efektywne trudności dróg. Liczba dróg wspierających w piramidzie dotyczy unikalnych dróg; powtórzenia nie zapełniają piramidy ponownie. Docelowa droga jest wykluczona z dowodów wspierających.

- Najlepsze ostatnie przejście o trudnościach celu lub wyższych: 60 punktów; o jeden stopień niższych: 35; o dwa stopnie niższych: 10; w innych przypadkach zero.
- Dwie unikalne drogi o jeden stopień niższe dają łącznie 20 punktów, a cztery drogi o dwa stopnie niższe dają łącznie 25 punktów.
- Nieudane próby na celu dają łącznie do 15 punktów, w odniesieniu do elastycznych progów 15, 35 lub 75 prób. Horyzont jest **Krótkoterminowy**, gdy różnica względem Twojego ostatniego najlepszego przejścia wynosi co najwyżej jeden stopień, **Średni**, gdy wynosi dwa stopnie, w innych przypadkach jest **Długofalowy** (również gdy nie są znane żadne ostatnie przejścia).
- Model bazowy osiąga maksymalnie 94%, po czym zyskuje jeden punkt za każdy dodatkowy poprawny dzień wspinaczkowy na tej drodze (pierwszy dzień ustala punkt odniesienia), do maksymalnie 99%, dopóki ten projekt nie zostanie zapisany jako zrobiony. Dla nieznanych trudności nie ma szacunków. Zerowe i ujemne stopnie w skali V są obsługiwane i nigdy nie są mieszane z wycenami dróg.

Trening może podnieść ten pasek, nawet jeśli nie udowodniono, że konkretny ruch został rozpracowany. Trudności i zapisany wysiłek nie oddają patentów, warunków, kontuzji ani pewności siebie, dlatego jest to zrozumiała heurystyka, a nie naukowo potwierdzony model.

**Szacowana pozostała praca** porównuje Twoją historię ukończonych projektów w skałach w tej samej dyscyplinie i skali, w granicach jednego stopnia trudności. Przejścia w pierwszej próbie nie wchodzą do tej grupy porównawczej; przejścia pojedynczych wyciągów o trudnościach mniejszych niż cała droga nie zastępują przejść pełnej drogi. Dla każdego wskaźnika z osobna, co najmniej trzy ukończone projekty muszą mieć zapisaną większą liczbę sesji lub prób niż ta, którą odnotowano u Ciebie do tej pory. Wyświetlany zakres to środkowa połowa (między 25. a 75. percentylem, przy użyciu domykających obserwowanych rang) tych sum pomniejszona o Twoją zapisaną pracę; pozostałe próby obejmują ostateczne przejście. Gdy przekroczysz tę historię lub jest zbyt mało porównań, szacunek jest wstrzymywany zamiast wymyślania terminu końcowego. Grupy porównawcze obejmują wszystkie zapisane lata, podczas gdy gotowość bazuje na ostatnich przejściach.

Szacunki te opisują wyłącznie ukończone projekty: brak w nich nieukończonych projektów i niezapisanych prób, a umiejętności zmieniają się w czasie. Są to przybliżone porównania osobiste, a nie gwarancja pozostałego wysiłku. Suma sesji liczy prawidłowe zapisane dni kalendarzowe. Brakujące, nieprawidłowe i przyszłe daty są wymienione w historii, ale wykluczone z postępów i szacunków. Liczba prób we wpisie z przejściem obejmuje udaną próbę i może nakładać się na osobne wpisy z niepowodzeniami; podsumowania używają wyższej sumy niepowodzeń zamiast dodawania obu wartości. Późniejsze powtórzenie pozostaje widoczne, nie zmieniając tego, które przejście jako pierwsze ukończyło projekt.

## Nowa droga?

Gdy projekt nie ma **żadnych trudności** w serwisie theCrag (lub jest opisany dosłownie jako „Project” / „Proj”), karty wyświetlają plakietkę **Nowa droga?** — zazwyczaj dotyczy to nowej linii, którą ubezpieczasz lub nad którą wciąż pracujesz. Ta sama plakietka pojawia się również przy **szerokich zakresach tymczasowych**, takich jak `21-23` lub `V1-3`, co często oznacza, że wycena jest jeszcze doprecyzowywana. Sąsiadujące połówki stopni, np. `V1/2`, pozostają zwykłymi opublikowanymi wycenami i nie otrzymują plakietki. Etykieta trudności nadal pokazuje wyliczony punkt środkowy, jeśli taki istnieje; zmienia się tylko plakietka. Wyraźna flaga **Projekt** w serwisie theCrag (z importu informacji o drodze) powoduje wyświetlenie osobnej plakietki Projekt.

## Tekst z przewodnika na kartach projektów

Gdy **import danych o drogach** pobrał publiczne dane z przewodnika dla danej drogi, karty projektów mogą wyświetlać:

- Krótki fragment **opisu**
- Ostrzeżenie o **dostępie**, gdy przewodnik wymienia problemy z dostępem (na przykład rejony zamknięte lub tylko tolerowane)

Tekst ten pochodzi z publicznych stron dróg w serwisie theCrag (pola `beta`, takie jak Opis i Problemy z dostępem). To **nie są** Twoje prywatne notatki z dziennika przejść.

### Prywatność

- **Prywatne notatki o przejściach** (`ascents.comment`) pozostają oddzielone. Pojawiają się one w wykazie tylko po wyrażeniu zgody w Ustawieniach i nigdy nie są widoczne na kartach projektów ani w statystykach panelu głównego.
- **Beta z przewodnika** to publiczna treść społecznościowa. Crag Stats przechowuje krótkie fragmenty w `routes.beta_json` podczas tego samego opcjonalnego importu dróg, co historię FA — nigdy nie są one mieszane z notatkami.

### Licencjonowanie i przypisanie autorstwa

treści przewodnika theCrag mogą być licencjonowane na warunkach takich jak [Creative Commons BY-SA](https://creativecommons.org/licenses/by-sa/4.0/). Strony dróg często wymieniają współtwórców (na przykład lokalne kluby). Crag Stats pokazuje tylko **krótkie fragmenty**, zawiera link zwrotny do **strony drogi w serwisie theCrag** i oznaczenie źródła (CC BY-SA). Aby zobaczyć pełny opis, etykę, dojście i aktualny status dostępu, skorzystaj z linku na karcie.

Import danych o drogach jest **domyślnie wyłączony** (`ROUTE_DATA_IMPORT`). Ustaw `ROUTE_DATA_IMPORT=true` na serwerze i zrestartuj go, jeśli chcesz otrzymywać fragmenty przewodnika i automatyczne podpowiedzi FA; zobacz [Pierwsze przejścia](/docs/first-ascents), aby poznać ograniczenia dotyczące prywatności i tempa pracy.
