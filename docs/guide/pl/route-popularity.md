# Popularność dróg

Karta **Popularność dróg** korzysta ze statystyk społeczności zapisanych w pamięci podręcznej theCrag dla każdej drogi: **liczby przejść**, **popularności** oraz **relatywnej popularności** (0–100). Crag Stats zapisuje te dane, gdy uruchamiany jest import danych o drogach (`ROUTE_DATA_IMPORT=true` na serwerze, a następnie restart i synchronizacja).

## Główny nurt kontra poza utartym szlakiem

Dla każdego przejścia, dla którego istnieją dane o popularności, porównujemy **relatywną popularność**, jeśli jest dostępna, w przeciwnym razie **globalną popularność**:

| Kategoria                 | Reguła        |
| ------------------------- | ------------- |
| **Główny nurt**           | Wynik ≥ 50    |
| **Poza utartym szlakiem** | Wynik &lt; 50 |

Karta pokazuje, jaki **udział tych przejść** wpada do każdej kategorii. Przejścia na drogach bez zapisanych statystyk są wykluczone z obliczeń procentowych.

## Ukryte perełki

**Ukryte perełki** to **przejścia** na drogach, które są zarówno wysoko oceniane (`qualityScore` ≥ 70, lub co najmniej ★★★, lub wysoka ocena jakości przy Twoim wpisie), jak i rzadko uczęszczane (społecznościowa **liczba przejść** ≤ 100 oraz wynik popularności &lt; 50). Wyświetlane są maksymalnie trzy różne drogi, uszeregowane według jakości.

## Wykaz przejść

Sortuj według **Pop.**, aby uporządkować przejścia według popularności drogi (domyślnie od najwyższej). Wiersze bez zapisanych statystyk trafiają na sam dół.

## Źródło

Liczby pochodzą z API dróg serwisu theCrag (`show=info`). Odzwierciedlają one całą społeczność, a nie tylko Twój wykaz przejść.

Popularność wykorzystuje relatywną popularność, gdy jest dostępna, a następnie popularność globalną. Społecznościowe liczby przejść są wyświetlane oddzielnie i nigdy nie są porównywane numerycznie z wynikami popularności.

Aby utrzymać aktualność sumarycznej liczby przejść, popularności i ocen, właściciel serwera może ustawić `ROUTE_DATA_REFRESH_DAYS` na całkowitą liczbę dni od 30 do 3650 (np. zalecane `90` lub `180` dla około pół roku), przy `ROUTE_DATA_IMPORT=true`. Są to kroczące przedziały dniowe. Po pomyślnych synchronizacjach wykazu przejść, nowe drogi mają priorytet, a następnie najstarsze nieaktualne pobrania są odświeżane w ramach tego samego limitu 100 dróg i tempa. Nadrabianie zaległości może zająć kilka synchronizacji. Brak ustawienia, `0`, wartość poniżej 30 lub powyżej 3650 zachowuje domyślną zasadę jednorazowego pobierania do pamięci podręcznej; opcja **Odśwież wszystko** pozostaje dostępna w Ustawieniach.
