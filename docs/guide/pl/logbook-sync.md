# Synchronizacja wykazu przejść

Crag Stats pobiera Twój wykaz przejść na jeden z dwóch sposobów:

- **Synchronizacja przez API** z kluczem API wspierającego theCrag. Działa według istniejącego harmonogramu (`SYNC_CRON`, domyślnie codziennie), z poziomu **Ustawienia → Synchronizuj teraz** (otwórz **`/settings`** lub najpierw **`/login`**, gdy ustawiono `APP_PASSWORD`) oraz z poziomu kontenera roboczego Docker. Nowa instalacja wykonuje synchronizację przy uruchomieniu, jeśli skonfigurowano klucz.
- **Ręczne przesyłanie pliku CSV**. Wyeksportuj swój wykaz przejść w serwisie theCrag i prześlij plik w sekcji **Ustawienia → Import CSV**, gdy tylko chcesz odświeżyć dane.

## Kopia zapasowa: zachowaj lokalną kopię

Twoje konto w serwisie theCrag pozostaje głównym źródłem danych dla Twojego aktualnego wykazu przejść. Crag Stats przechowuje zsynchronizowane przejścia, ustawienia, cele, pamięć podręczną historii dróg, dane pogodowe i powiązany stan w bazie **SQLite** (`DATABASE_PATH`, zazwyczaj `./data/crag-stats.sqlite` lub `/data/crag-stats.sqlite` w Dockerze). Twórz kopię zapasową **wolumenu danych** Docker (lub katalogu hosta montowanego w `/data`) razem z resztą kopii zapasowych swojego homelabu. Aby uzyskać spójną kopię zapasową plików, zatrzymaj wszystkie aplikacje i procesy robocze korzystające z tej bazy danych, skopiuj wolumen wraz z plikami pomocniczymi `-wal` / `-shm`, a następnie uruchom je ponownie. Kopiowanie tych plików pojedynczo, gdy trwa zapis, może prowadzić do niespójności kopii zapasowej; użyj narzędzia do kopii zapasowych online obsługującego SQLite, jeśli aplikacja musi pozostać uruchomiona. Compose zachowuje wolumen podczas aktualizacji obrazów.

Aby uzyskać przenośną kopię w formacie arkusza kalkulacyjnego, otwórz **Ustawienia → Prywatność i kontrola danych** i użyj **Pobierz CSV wykazu przejść** (to samo działanie co `/settings/export`). Plik to CSV w stylu theCrag z lokalnym wykazem: drogi, przejścia, partnerzy, ocena jakości, daty i komentarze/notatki. Notatki są zawsze dołączane do pobieranego pliku, ponieważ jest to Twoja kopia zapasowa; traktuj ten plik jak dane osobowe. Możesz go później ponownie zaimportować przez **Ustawienia → Import CSV** (tylko aktualizacja/wstawianie — nie usuwa przejść, których brakuje w pliku). Pobierz plik CSV przed użyciem opcji **Wyczyść wszystkie dane lokalne**, jeśli chcesz mieć wyjście awaryjne podczas ponownego pobierania danych z theCrag — pełną ścieżką przywracania pozostaje jednak kopia zapasowa wolumenu.

Plik CSV z Ustawień pochodzi z Crag Stats, a nie bezpośrednio z serwisu theCrag. Aby utworzyć kopię zapasową samego wykazu przejść bezpośrednio ze źródła, użyj opcji **Akcja → Eksportuj wykaz przejść jako CSV** w swoim wykazie online w serwisie theCrag.

## Co zaimportowano podczas ręcznej synchronizacji

Po pomyślnym wykonaniu **Synchronizuj teraz** lub **Pełna ponowna synchronizacja** Ustawienia pokazują przetworzone przejścia,
nowe przejścia, odświeżone istniejące przejścia, nowe drogi oraz usunięte przejścia/drogi.
Droga udostępniana przez kilka przejść jest liczona jako jedna nowa droga. „Odświeżono” oznacza, że
istniejące przejście zostało ponownie przetworzone; nie oznacza to, że jego treść uległa zmianie.
Niezmieniony wykaz przejść pokazuje zatem zero dodanych/usuniętych elementów oraz odświeżenie istniejących
przejść. Pominięte uruchomienia i błędy wyświetlają własne komunikaty, a nie podsumowanie sukcesu.

Ręczne przesłania plików CSV również pokazują liczby przetworzonych/nowych/odświeżonych pozycji, ale nigdy nie usuwają
brakujących wpisów. Route data and weather enrichment are separate background
imports: when enabled, they start after every successful sync or CSV upload
(including uploads to `POST /api/logbook/csv`), and are not included in these
logbook counts. Podsumowanie opisuje wykonaną
akcję przycisku; nie stanowi ono trwałej historii synchronizacji.

## Synchronizacja przez API

Ustaw `THECRAG_API_KEY` na Twój klucz odczytu wykazu przejść dla wspierających. Każda synchronizacja odczytuje pełny wykaz przejść i uzgadnia lokalne przejścia, uwzględniając usunięcia. Ten tryb zapewnia bogatsze dane dotyczące dróg, profilu i dróg wielowyciągowych, i jest to jedyny sposób, w jaki Crag Stats automatycznie łączy się z theCrag w celu pobrania Twojego wykazu przejść.

### Jeśli synchronizacja przez API się nie powiedzie

Ustawienia pokazują niepowodzenie i zachowują czas ostatniej pomyślnej synchronizacji. Komunikat podaje przyczynę, jeśli theCrag ją zgłosi, a następnie krótki kod błędu z theCrag (na przykład `invalid-api-key`):

- **Nieprawidłowy klucz:** serwis theCrag odrzucił `THECRAG_API_KEY`. Sprawdź, czy nie ma w nim literówek, lub wymień go, jeśli wygasł bądź został odwołany, a następnie uruchom ponownie serwer.
- **Brak dostępu:** klucz nie posiada uprawnień do odczytu wykazu przejść. Sprawdź swój klucz wspierającego lub prześlij wyeksportowany plik CSV ręcznie (poniżej).
- **Limit użycia:** klucz osiągnął limit żądań serwisu theCrag. Poczekaj na jego zresetowanie, a następnie wykonaj synchronizację ponownie.

Jeśli późniejsza strona ulegnie awarii, aktualizacje z wcześniejszych stron pozostaną zapisane w pamięci podręcznej, ale żadne brakujące przejścia nie zostaną usunięte, a uruchomienie nie zostanie oznaczone jako pomyślne. Kolejne zaplanowane uruchomienie (domyślnie codziennie) lub **Synchronizuj teraz** ponowi próbę pobrania pełnego wykazu przejść od strony 1. Błędy API nie wstrzymują harmonogramu.

## Ręczne przesyłanie pliku CSV

Brak klucza wspierającego? W serwisie theCrag otwórz swój wykaz przejść i wybierz **Akcja → Eksportuj wykaz przejść jako CSV**, a następnie prześlij plik w sekcji **Ustawienia → Import CSV**. Powtarzaj tę czynność za każdym razem, gdy chcesz dodać nowe przejścia.

Ręczne przesyłanie dodaje i aktualizuje przejścia, ale nigdy nie usuwa przejść, których brakuje w pliku. Aby usunąć usunięte przejścia, użyj opcji **Wyczyść wszystkie dane lokalne** i prześlij świeży wyeksportowany plik. Plik CSV zawiera mniej pól niż API, w tym mniej danych o profilu, metadanych dróg i informacji o drogach wielowyciągowych, a także nie zawiera prywatnych notatek do przejść z theCrag (`privateMarkdown`); importowana jest tylko publiczna kolumna z komentarzem. Samodzielne cyfry wyceny bulderowej z Australii używają ścieżki kraju/lokalizacji jako wskazówki AU, dzięki czemu nie zostają błędnie zinterpretowane jako stopnie V.

Import danych dróg dopasowuje autorów pierwszych przejść FA/FFA do Twojej nazwy użytkownika w theCrag. Synchronizacja przez API zapisuje ją z Twojego profilu, a parametr `THECRAG_USERNAME` jest w tym trybie ignorowany; instalacja korzystająca wyłącznie z pliku CSV ustawia ją w ten sposób. Bez nazwy użytkownika import zatrzymuje się przed pobraniem czegokolwiek, więc ustaw ją (lub oznacz pierwsze przejścia ręcznie w wykazie przejść).

## Wykaz przejść z CSV wraz z danymi dróg

Możesz prowadzić wykaz przejść na podstawie plików CSV i nadal korzystać z danych dróg (popularność, liczba przejść, ocena jakości, sezonowość, wyciągi) oraz automatycznych oznaczeń FA/FFA. Ustaw:

- `CSV_INGEST_TOKEN`: długą losową wartość. Pozwala to kontenerowi lub skryptowi na wysłanie wyeksportowanego pliku CSV, informując również Crag Stats, że źródłem wykazu przejść są przesłane pliki: synchronizacja przez API nie uruchamia się, więc przesłane przejścia nigdy nie są usuwane, a synchronizacja nie zapisuje profilu wspinacza właściciela klucza.
- `THECRAG_API_KEY`: Twój klucz odczytu wykazu przejść wspierającego, używany teraz wyłącznie do pobierania danych dróg oraz wyszukiwania lokalizacji rejonów/sektorów.
- `THECRAG_USERNAME`: Twoja nazwa użytkownika w theCrag, dzięki czemu historia FA/FFA będzie dopasowana do Ciebie (pliki eksportu CSV jej nie zawierają).

To cała konfiguracja: trzy wartości, bez przełączania trybów. Bez `CSV_INGEST_TOKEN` parametr `THECRAG_API_KEY` synchronizuje wykaz przejść, a dane dróg korzystają z tego samego klucza. Background route and weather imports start after each successful sync or CSV upload, and also follow `IMPORT_CRON` (daily by default) rather than the logbook schedule, so a weekly or monthly `SYNC_CRON` still gets route data daily. Ustawienia → **Importuj dane dróg** pokazuje postęp i pozwala ręcznie uruchomić ten proces.

## Przesyłanie pliku CSV z innego kontenera

Ręczne przesyłanie sprawdza się przy okazjonalnym odświeżaniu. Jeśli przechowujesz wyeksportowany plik w miejscu dostępnym dla Twojej sieci — w udostępnionym katalogu, zasobie Nextcloud lub Dropbox bądź w małym kontenerze towarzyszącym, który przesyła każdy nowy plik — Crag Stats może przyjąć go przez HTTP. Ustaw `CSV_INGEST_TOKEN` na długą losową wartość, uruchom ponownie serwer, a następnie prześlij plik metodą `POST`:

```bash
curl -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @thecrag-logbook.csv
```

Przesłanie multipart z plikiem w polu `file` również zadziała. Żądania bez tokena są odrzucane, a pomyślna odpowiedź raportuje, ile przejść zostało przetworzonych i ile było nowych:

```json
{ "ok": true, "imported": 412, "created": { "routes": 318, "ascents": 412 } }
```

Aby sprawdzić instalację bez importowania czegokolwiek, wyślij treść żądania, która nie jest plikiem eksportu:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" --data-binary 'x'
```

`400` oznacza, że endpoint jest dostępny, a token został zaakceptowany: treść żądania została odrzucona, więc nic nie zapisano. `401` oznacza, że token był nieprawidłowy, natomiast `404` oznacza, że używany obraz Docker jest starszy niż ten punkt końcowy. W przypadku instalacji z ograniczeniem dostępu do całego interfejsu (`AUTH_SCOPE=all`), starszy obraz zwraca kod `401` dla każdej nieznanej ścieżki `/api/`, dlatego kod `401` należy interpretować jako "nieprawidłowy token lub zbyt stary obraz".

Pusty plik, pomyłkowo zapisana strona logowania lub plik o rozmiarze przekraczającym 25 MB zostaną odrzucone zamiast zaimportowane. Ten endpoint wykonuje ten sam import wyłącznie typu upsert co formularz w Ustawieniach, więc nigdy nie usuwa przejść, których brakuje w pliku. Nie wysyła on żadnych żądań do serwisu theCrag: plik eksportu musi pochodzić z Twojej przeglądarki lub innego narzędzia, nad którym masz kontrolę.

## Dlaczego brak automatycznego pobierania plików CSV

Crag Stats nigdy nie loguje się do witryny theCrag ani nie pobiera plików eksportu za Ciebie. [Regulamin](https://www.thecrag.com/terms#ownership-and-licenses) serwisu theCrag wymaga, aby cały dostęp programistyczny odbywał się przez API, a każdy eksport to zrzut pełnego wykazu przejść, który obciąża ich serwery. Samodzielne eksportowanie i przesyłanie pliku CSV jest w pełni dozwolone.
