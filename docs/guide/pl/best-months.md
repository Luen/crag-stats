# Najlepsze miesiące

Karta **Najlepsze miesiące** porównuje [sezonowość z theCrag](https://www.thecrag.com/article/Seasonality) dla rejonów, w których wspinasz się najczęściej, z tym, **kiedy faktycznie się tam wspinasz**.

## Skąd pochodzą dane

theCrag przechowuje **krzywą sezonowości o 12 wartościach** dla każdej drogi (jedna wartość na miesiąc kalendarzowy). Crag Stats zapisuje ją w pamięci podręcznej dla każdej drogi podczas opcjonalnego importu danych dróg (`ROUTE_DATA_IMPORT`, domyślnie wyłączonego). Dopóki droga nie zostanie pobrana co najmniej raz, nie ma możliwości wyświetlenia jej sezonowości.

## Jak agregujemy dane

Dla każdego rejonu w Twoim wykazie przejść:

1. **Twoja objętość** — zliczaj swoje przejścia według miesięcy kalendarzowych (ze wszystkich lat łącznie).
2. **Sezonowość z theCrag** — dla każdej drogi zapisanej w Twoim wykazie w danym rejonie bierze zbuforowaną 12-miesięczną krzywą i waży ją według tego, **ile razy wspinałeś się na tę drogę**. Drogi z większą liczbą Twoich przejść mają większy wpływ na średnią dla całego rejonu.

Pokazujemy maksymalnie **sześć** rejonów uszeregowanych według łącznej liczby Twoich przejść, ale tylko te rejony, w których co najmniej jedna pokonana droga ma zapisaną sezonowość w pamięci podręcznej.

## Jak czytać wykres

- **Pomarańczowe słupki** — ważona średnia sezonowość (wyższa wartość = większa popularność na theCrag w danym miesiącu).
- **Szare słupki** — Twoje przejścia w danym miesiącu w tym rejonie.

Gdy szare słupki osiągają szczyt w innych miesiącach niż pomarańczowy pasek, może to oznaczać, że wspinasz się poza sezonem — lub że Twoja próba jest niewielka.

## Odświeżanie sezonowości

Uruchom **Synchronizację** z poziomu Ustawień. Przy włączonym imporcie danych dróg, sezonowość jest uzupełniana w tle (z ograniczeniem prędkości, do 100 dróg na jedno uruchomienie).

Strona Sektory może również pokazywać [pogodę w dniach Twoich zapisanych wizyt](/docs/weather). Opisuje to warunki w dniach Twoich zalogowanych wizyt, niezależnie od sezonowości dróg używanej w tym miejscu.

## Wyszukiwanie według miesiąca

Otwórz [Wyszukiwanie sezonowości](/seasonality) z karty Najlepsze miesiące, aby przeglądać wszystkie rejony i drogi w zsynchronizowanym wykazie przejść z zapisanymi danymi miesięcznymi. Wybierz miesiąc (domyślnie bieżący miesiąc w Twojej strefie czasowej), wyszukaj nazwę rejonu, obszaru lub drogi i przełączaj się między zakładkami **Rejony** i **Drogi**. Wyszukiwania, wybór miesiąca, sortowanie i strony są zapisywane w adresie URL, dzięki czemu możesz dodać je do zakładek lub udostępnić. Wybierz **Zobacz drogi**, aby zawęzić wynik do jednego rejonu, lub **Szukaj we wszystkich rejonach**, aby opuścić ten zakres.

Wyniki są szeregowane według wartości wybranego miesiąca podzielonej przez najwyższą wartość w rocznej krzywej danego wyniku. Na przykład wartość 5 przy rocznym szczycie wynoszącym 10 wyświetli **50% rocznego szczytu**. Nazwy rozstrzygają remisy; możesz również sortować według nazwy. Nie ma sztywnego progu „w sezonie”. Krzywa zawierająca same zera ma status **Brak sygnału sezonowego** i jest sortowana po krzywych z dodatnim szczytem. Pasek miesięcy oraz rozwijana tabela wartości pokazują wszystkie dwanaście miesięcy.

Krzywe rejonów używają tej samej średniej ważonej przejściami co pulpit nawigacyjny: drogi z większą liczbą zalogowanych przejść mają większy wpływ; brakujące krzywe dróg nie są uwzględniane w średniej. Wyszukanie nazwy drogi pozwala znaleźć jej rejon, ale nie zmienia pełnej krzywej tego rejonu. Rejony są rozdzielane według identyfikatora obszaru u dostawcy, jeśli jest on dostępny. Każdy rejon pokazuje, ile z jego zalogowanych dróg posiada dane; strona informuje również o stopniu pokrycia wśród pasujących dróg. Brakujące lub nieprawidłowo sformatowane krzywe pozostają nieznane i są pomijane w uszeregowanych wynikach.

Wyniki dla dróg prowadzą do wszystkich Twoich wpisów w wykazie przejść dla tej konkretnej drogi oraz do jej strony w przewodniku na theCrag. Przycisk Wstecz w przeglądarce powraca do wyszukiwania. Wyszukiwanie odczytuje wyłącznie lokalną pamięć podręczną i nie wywołuje pobierania danych od dostawcy ani nie przeszukuje całego katalogu theCrag. Włącz opcjonalny import danych dróg i wykonaj synchronizację, aby zwiększyć pokrycie danymi.

Sezonowość opisuje **wzorce wspinaczkowe społeczności**, a nie prognozę pogody ani zmierzone warunki podczas Twoich zalogowanych wizyt. Zobacz [Pogoda](/docs/weather), aby zapoznać się z obserwacjami z dni wizyt.
