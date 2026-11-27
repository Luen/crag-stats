# Ustawienia wyświetlania

**Ustawienia → Wyświetlanie i widoczność** określa sposób wyświetlania dat i jednostek miary w całym serwisie. Wybory te dotyczą każdego odwiedzającego, a nie tylko przeglądarki właściciela, i wchodzą w życie przy następnym załadowaniu strony.

## Format daty

| Opcja             | Przykład    |
| ----------------- | ----------- |
| **Automatycznie** | 27 paź 2026 |
| **DD/MM/RRRR**    | 27/10/2026  |
| **MM/DD/RRRR**    | 10/27/2026  |
| **RRRR-MM-DD**    | 2026-10-27  |

Opcja **Auto** dostosowuje się do ustawień regionalnych witryny (`DISPLAY_LOCALE`), dzięki czemu jest naturalna dla większości odwiedzających bez konieczności dodatkowej konfiguracji.

Format zmienia widoczne dni kalendarzowe w panelu głównym, wykazie przejść, stronach pogody, odznakach, celach, kamieniach milowych i wykresach. Linki filtrów, atrybuty `datetime`, dane wykresów i parametry URL zachowują swoje wartości ISO `YYYY-MM-DD`, dzięki czemu udostępniony link zawsze wskazuje ten sam dzień.

## Jednostki miary

Każdy pomiar ma własne ustawienie, więc możesz je dowolnie łączyć:

| Pomiar          | Opcje                                            |
| --------------- | ------------------------------------------------ |
| **Wysokość**    | Metry (m), stopy (ft)                            |
| **Odległość**   | Kilometry (km), mile (mi)                        |
| **Temperatura** | Stopnie Celsjusza (°C), Stopnie Fahrenheita (°F) |
| **Wiatr**       | km/h, mph                                        |
| **Opady**       | Milimetry (mm), cale (in)                        |

Ustawienia wstępne wypełniają wszystkie pięć pól jednocześnie:

- **Metryczne**: metry, kilometry, stopnie Celsjusza, km/h i milimetry.
- **Imperialne (USA)**: stopy, mile, stopnie Fahrenheita, mph i cale.
- **Brytyjskie (mieszane)**: metry, mile, stopnie Celsjusza, mph i milimetry.

Ustawienia wstępne to tylko skrót: późniejsza zmiana pojedynczej jednostki tworzy własną kombinację, a formularz Ustawień pokazuje, które wartości są zapisane.

## Co pozostaje w systemie metrycznym

Baza danych zawsze przechowuje wysokości w metrach, odległości w kilometrach, temperaturę w °C, wiatr w km/h, a opady w milimetrach. Konwersja następuje dopiero podczas renderowania strony, więc przełączanie jednostek nigdy nie nadpisuje Twojego wykazu przejść, celów ani importów.

- **Eksport do CSV** zachowuje swoje kanoniczne kolumny metryczne.
- **Progi odznak** (wysokość, upał, mróz, deszcz, wiatr itd.) są zdefiniowane w systemie metrycznym. Zmienia się tylko sformułowanie, na przykład **Fala upałów** brzmi „35°C lub cieplej” w jednostkach metrycznych i „95°F lub cieplej” w stopniach Fahrenheita. Te same przejścia pozwalają zdobyć te same odznaki niezależnie od wybranego systemu.
- **Filtry pogodowe**, takie jak filtry upału, mrozu, deszczu, śniegu i wiatru w wykazie przejść, zachowują swoje metryczne progi.
- **Przeliczenia są zaokrąglane** na potrzeby wyświetlania, więc wartość pokazana w stopach, milach lub calach jest wartością przybliżoną, a nie drugą zapisaną wartością.

## Jednorazowe nadpisania

Panel główny akceptuje parametry `?units=metric`, `?units=imperial` lub `?units=uk`, aby umożliwić podgląd ustawienia wstępnego bez jego zapisywania. Poszczególne parametry nadpisują jeden pomiar naraz: `unitHeight`, `unitDistance`, `unitTemp`, `unitWind` oraz `unitPrecip` (na przykład `?unitTemp=fahrenheit&unitWind=mph`). Mają one zastosowanie tylko do tego jednego załadowania strony i nie zmieniają Ustawień.

## Gdzie pojawiają się ustawienia

Wybory daty i jednostek wpływają na panel główny, wykaz przejść, kalendarz aktywności, obciążenie treningowe, strony pogody, sektory, mapę wspinaczkową, cele, odznaki, kamienie milowe, karty do osadzenia i migawkę offline. Systemy wycen są niezależne: zobacz [Wyceny](/docs/grades).
