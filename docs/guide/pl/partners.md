# Partnerzy

Strona **Partnerzy** (oraz karta w panelu głównym) przedstawia ranking osób oznaczonych w Twoim logbooku w polu `with` / partnerzy. Kliknij nazwę użytkownika, aby otworzyć logbook z filtrowaniem według konkretnego partnera.

## Metryki (`/partners`)

Użyj przełącznika w prawym górnym rogu:

- **Przejścia** (domyślne) — każde zarejestrowane przejście, w którym wymieniony jest dany partner
- **Sesje** — unikalne dni kalendarzowe z co najmniej jednym wspólnym przejściem (zgodnie z tą samą ideą „sesja = dzień”, co w [Sesjach na tydzień](/docs/sessions-per-week); nieprawidłowe symbole zastępcze, takie jak `2018-00-00`, są pomijane, analogicznie jak w widoku Dni tygodnia)
- **Rejony** — poszczególne rejony odwiedzone z danym partnerem, z wykorzystaniem zapamiętanych identyfikatorów rejonów od dostawcy danych, jeśli są dostępne. Zmiany nazw zachowują tę samą tożsamość, a rejony o tej samej nazwie, ale różnych identyfikatorach, pozostają oddzielne. W przypadku braku identyfikatora nazwy są dopasowywane bez względu na wielkość liter; puste nazwy oraz „Unknown” są pomijane. Wiersz zawierający wyłącznie nazwę zostaje powiązany ze znanym identyfikatorem tylko wtedy, gdy nazwa ta odpowiada dokładnie jednemu identyfikatorowi

Twój wybór jest przechowywany w przeglądarce (`cs_partners_metric`).

## Uwagi

- Nazwy użytkowników są normalizowane (początkowy znak `@` jest usuwany); ta sama osoba wpisana z różną wielkością liter jest reprezentowana przez jeden słupek wykresu.
- Dni spędzone na drogach wielowyciągowych z wieloma przejściami zawyżają statystykę **Przejść** bardziej niż **Sesji**.
- Osoba, z którą wspinasz się tylko w jednym rejonie, zajmie niższą pozycję w kategorii **Rejony** niż partner, z którym podróżujesz, nawet jeśli ma on mniej przejść.

Podgląd w panelu głównym i pełna strona korzystają z tych samych zarejestrowanych przejść, w tym przejść archiwalnych, dla których rekord drogi jest niedostępny. Brakujące szczegóły drogi nie powodują usunięcia przejść z partnerem ani prawidłowych dni sesji; nie są one jednak wliczane do rejonów, jeśli miejsce nie jest znane. Inne analizy w panelu głównym oparte na drogach nadal wymagają zapisu konkretnej drogi.

Karta w panelu głównym korzysta z tej samej metryki, którą wybierzesz na tej stronie, i wyświetla siedmiu najlepszych partnerów dla tej metryki. Kliknij tytuł Partnerzy, aby zobaczyć pełną listę.

Odznaki, najtrudniejsze przejścia, godne uwagi przejścia, ostatnie aktywności oraz kamienie milowe dotyczące wycen lub FA dla konkretnych dróg również pokazują zapisanych partnerów. Przypisanie dotyczy wybranego przejścia, a nie każdego powtórzenia danej drogi. Karty dotyczące rozwoju drogi/społeczności oraz zagregowane kamienie milowe nie wyliczają towarzyszy. Nazwy są deduplikowane bez względu na wielkość liter; brakujące nazwy są pomijane i nigdy nie są traktowane jako dowód wspinaczki solo.
