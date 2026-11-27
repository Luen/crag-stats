# Cele

Cele przekształcają wartość docelową z Twojego wykazu przejść w theCrag w pasek postępu w panelu głównym oraz na stronie **Cele**. Cele dotyczące wysokości i dni wspinaczkowych wypełniają się liniowo. Cele dotyczące **wyceny** wykorzystują przybliżony model **gotowości piramidy**, dzięki czemu znajdowanie się jeden stopień poniżej celu nie wygląda już na prawie ukończone.

## Rodzaje celów

| Rodzaj                  | Co oznacza „ukończone”                                                   | Pasek postępu                             |
| ----------------------- | ------------------------------------------------------------------------ | ----------------------------------------- |
| **Wycena w tym roku**   | Przejście o wycenie równej lub wyższej niż docelowa w roku objętym celem | Gotowość piramidy (poniżej)               |
| **Wysokość w tym roku** | Liczba przewspinanych metrów w danym roku                                | Liniowo: metry ÷ cel                      |
| **Dni w tym miesiącu**  | Poszczególne dni wspinaczkowe w bieżącym miesiącu kalendarzowym          | Liniowo: dni ÷ cel                        |
| **Niestandardowy**      | Oznaczasz go jako ukończony                                              | Ręcznie (brak automatycznego wypełniania) |

Zakres miejsca (w skałach / na panelu / dowolny) filtruje, które przejścia są uwzględniane. Cele dotyczące wyceny domyślnie ustawione są na **w skałach**.

Cele dotyczące wysokości zawsze **zapisują metry**. Formularz tworzenia pyta o cel w wybranej jednostce wysokości (metry lub stopy) i przelicza stopy przed zapisaniem, a etykiety postępu i celu również używają tej jednostki. Późniejsza zmiana jednostek zmienia etykietę celu bez zmiany zapisanego celu docelowego. Zobacz [Ustawienia wyświetlania](/docs/display-settings).

Cele dotyczące wyceny zachowują swoją skalę dla **Dróg** lub **Buldringu**. Etykiety celów i postępu są zgodne z odpowiednim systemem wycen w Ustawieniach; zmiana wyświetlanego systemu nie zmienia celu ani wartości procentowej. Tytuły sugerowanych celów również są zgodne z Ustawieniami, podczas gdy tytuły niestandardowe pozostają takie, jak wprowadzono. W **Preferencjach wyceny** celu możesz wybrać jego skalę oraz to, czy ma być używany tytuł automatyczny.

Jeśli cel wskazuje **Wymagana skala wyceny**, jego postęp jest niedostępny, dopóki właściciel nie wybierze opcji **Drogi** lub **Buldring**. Jego tytuł i zapisana wartość docelowa zostają zachowane; tytuł zawierający wycenę nie decyduje o jego skali.

## Gotowość na wycenę

Cel dotyczący wyceny wymaga **przejścia ≥ cel** (kanoniczna punktacja, zazwyczaj Ewbank dla dróg lub skala V dla bulderów) w roku objętym celem. Pasek **nie** wynosi `najlepsze przejście ÷ cel` — to sprawiało, że przejście z 22 na 23 wyglądało na ~96%, podczas gdy nadal potrzebne było przejście stopnia 23.

Zamiast tego model sprawdza, jak zbudowana jest Twoja piramida poniżej celu **N**, a następnie ile pracy włożono w jej pobliżu:

1. **Ukończono (100%)**, gdy Twoje najlepsze kwalifikujące się przejście wynosi już ≥ N.
2. **Baza**, gdy masz przejście na poziomie N−1 (~35%) lub tylko na poziomie N−2 (~10%).
3. **Wypełnienie piramidy** z różnych dróg z przejściem w tych przedziałach — elastyczne zapotrzebowanie wynosi około **2 dróg na poziomie N−1** i **4 na poziomie N−2** (do około +20% i +25%).
4. **Wypełnienie próbami** z wpisów bez przejścia (wstawek) o efektywnej punktacji **≥ N−1** — do około +20%, z elastycznym zapotrzebowaniem **skalowanym horyzontem czasowym**, dzięki czemu krótkoterminowe projekty posuwają się szybciej z każdą próbą niż projekty długoterminowe.
5. **Ogranicz model bazowy do 94%.** Pierwsza kwalifikująca się sesja wyznacza poziom odniesienia; każdy dodatkowy oddzielny dzień wspinaczkowy z wstawkami na poziomie ≥ N−1 dodaje jeden punkt gotowości, aż do 99%. Tylko kwalifikujące się przejście pozwala osiągnąć 100%. Wiele dróg lub prób tego samego dnia daje jedną sesję; brakujące, nieprawidłowe i przyszłe daty nie dają żadnej. Zaliczenie sesji jest zgodne z rokiem celu i miejscem wspinaczkowym oraz nie zmienia proporcji celów dotyczących wysokości ani dni wspinaczkowych.

Dowód przejścia używa tego samego filtra roku i miejsca co ukończenie: **efektywna wycena** (najtrudniejszy pokonany wyciąg na drodze wielowyciągowej) oraz **różne drogi** w przedziale piramidy (powtórzone przejścia tej samej drogi liczą się raz). Próby uwzględniają każdą kwalifikującą się wstawkę (powtórzenia na tej samej drodze nadal przesuwają pasek).

Linia postępu pokazuje Twoje najlepsze przejście, liczbę dróg N−1 / N−2, dowody prób, jeśli występują, oraz krótką podpowiedź dotyczącą horyzontu czasowego:

| Różnica do celu                  | Podpowiedź       | Orientacyjna liczba prób (≈ wypełnienie pasma prób) |
| -------------------------------- | ---------------- | --------------------------------------------------- |
| 1 stopień                        | Krótkoterminowy  | ~15 prób                                            |
| 2 stopnie                        | Średnioterminowy | ~35 prób                                            |
| Większa różnica / brak przejścia | Długoterminowy   | ~75 prób                                            |

## Sugerowany kolejny stopień

Na stronie **Cele**, gdy masz przejścia w skałach z ostatnich **dwóch lat**, Crag Stats może zaproponować delikatną sugestię: weź swoje najtrudniejsze przejście w skałach (droga i/lub balder, traktowane oddzielnie) i celuj w **kolejny stopień wyceny** w tym roku (V5 → V6, 25 → 26). Sugestie nigdy nie tworzą celu, dopóki nie klikniesz **Dodaj cel**. Jeśli już śledzisz ten cel w skałach na dany rok, na plakietce pojawi się napis **Już śledzone**.

## Co widzisz

- Karta „Aktywne cele” w **Panelu głównym**: do kilku otwartych celów z tymi samymi wartościami procentowymi i etykietami.
- Strona **Cele**: opcjonalne plakietki sugerowanego kolejnego stopnia, pełne listy Aktywne / Osiągnięte, tworzenie/edycja oraz ten sam tekst dotyczący gotowości dla celów związanych z wyceną.

## Uwagi i zastrzeżenia

- **Szacunkowe.** Szacunkowe liczby w piramidzie to trenerska reguła kciuka, a nie przepowiednia, że zrobisz przejście na poziomie N.
- **Punktacja w tym samym systemie.** Wspierające przedziały to zakresy punktowe [N−1, N) i [N−2, N−1), więc częściowe przejścia poniżej celu nadal go wspierają. Punktacja wykorzystuje kanoniczną ocenę celu; mieszane systemy wycen nie są przeliczane wewnątrz paska.
- **Skala, rok i miejsce.** Dowody dotyczące dróg i skali V nigdy się nie mieszają. Starsze wpisy spoza roku objętego celem lub z niewłaściwego miejsca wspinaczkowego nie wpływają na gotowość. Wyceniane w skali V przejścia DWS i highballe zaliczają się do celów bulderowych, z wykorzystaniem systemu wyceny, a nie stylu asekuracji.
- **Próby są szacunkowe.** Widzimy tylko zarejestrowane wstawki bez przejścia z wyceną ≥ N−1 — a nie każdą wstawkę w projekt bez wyceny.
- **Cele niestandardowe** nigdy nie wypełniają się automatycznie z wykazu przejść.

Cele dotyczące wysokości i dni pozostają prostymi stosunkami liniowymi, dzięki czemu pokonany w połowie kilometr lub miesiąc nadal wskazuje połowę drogi.
