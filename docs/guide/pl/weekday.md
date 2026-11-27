# Dzień tygodnia

Karta **Dzień tygodnia** pokazuje, w które dni tygodnia się wspinasz, zainspirowana wykresem dni tygodnia [Dreeve](https://dreeve.app/) dla aplikacji Strava. Rozkład przedstawiony jest jako **wykres pierścieniowy (kołowy)** z legendą Pon–Niedz. Domyślnie znajduje się po lewej stronie karty **Sesje tygodniowo** (szerokość połowiczna), w rzędzie pod statystykami **Miesięcznymi** / **Rocznymi**; funkcja Dostosuj pulpit pozwala na przeniesienie dowolnej karty.

## Co się liczy

- **Sesje** (domyślnie) — dzień kalendarzowy z co najmniej jednym pasującym przejściem (ta sama zasada co w [Sesje tygodniowo](/docs/sessions-per-week))
- **Przejścia** — każdy pasujący wpis w ten dzień tygodnia

Dzień tygodnia jest pobierany z daty przejścia w formacie `YYYY-MM-DD` w czasie UTC — wiersze dziennika przejść mają przypisaną datę bez konkretnej godziny.

## Filtry

- **Cały czas** / **Ostatnie 12 tygodni** — obejmuje 84-dniowe okno kończące się dzisiaj dla krótkiego zakresu
- **Sesje** / **Przejścia** — co oznacza rozmiar wycinka
- **Wszystkie** / **Sport** / **Trad** / **Boulder** — etykiety stylów używają tych samych kolorów dyscyplin co reszta aplikacji i odpowiadają filtrom stylu w dzienniku przejść (styl przejścia **lub** rodzaj drogi). Wspinanie na wędkę i inne style pojawiają się tylko w kategorii **Wszystkie**.

Wybory są przechowywane w przeglądarce (`cs_weekday_range`, `cs_weekday_metric`, `cs_weekday_style`).

## Najbardziej aktywny dzień

Środek pierścienia oraz linia wskazująca nazywają dzień tygodnia o najwyższej wartości dla bieżącego parametru (remisy są rozstrzygane na korzyść drugiego parametru). Wycinek tego dnia tygodnia oraz odpowiadający mu wiersz w legendzie są wyróżnione. Sekcja **Wyświetl wartości dni tygodnia** pod wykresem zawiera listę dokładnych sesji, przejść i udziału procentowego dla czytników ekranu i użytkowników klawiatury.
