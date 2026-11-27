# Wyceny i przedziały wycen

Crag Stats przedstawia wyceny w taki sam sposób jak [theCrag](https://www.thecrag.com/en/article/grades). Każdy system wycen jest przeliczany na jedną wewnętrzną skalę, a skala ta jest podzielona na pięć oznaczonych kolorami **przedziałów**.

## Pięć przedziałów

<!-- component:grade-bands -->

Kolory te pojawiają się w każdej piramidzie, pigułce z wyceną, wykresie CPR oraz zestawieniu przedziałów. Są one zgodne z theCrag, więc wycena wygląda tutaj tak samo jak tam.

## Jak porównywane są wyceny

- **Jedna wewnętrzna skala dla każdego rodzaju wspinania.** Drogi (sportowe, tradycyjne, na wędkę, alpejskie…) są punktowane w skali **Ewbanka** (australijska numeracja). Baldery są punktowane w skali **V**. Nigdy nie są mieszane na jednej liście: balder V5 i droga o wycenie 21 znajdują się w różnych piramidach.
- **To wycena decyduje o skali, a nie styl.** Przejścia deep water solo i highballe często otrzymują wyceny w skali V, mimo że nie są balderami. Te pozostają w skali V: są zaliczane razem z balderami do najtrudniejszych przejść i indeksów wycen oraz otrzymują własną piramidę (na przykład **DWS · V**), a nie piramidę Ewbanka.
- **Twoje systemy wyświetlania** wybiera się w **Ustawienia → Wyświetlanie i widoczność**, po jednym dla każdego rodzaju wspinania. **Wyceny dróg** (Ewbank, francuska lub YDS; domyślnie Ewbank) obejmują wspinanie sportowe, tradycyjne, na wędkę i inne wspinanie z liną. **Wyceny balderów** (skala V (Hueco) lub Fontainebleau; domyślnie skala V) obejmują baldery i highballe wyceniane w skali V. Oba systemy są niezależne, więc możesz wyświetlać drogi w skali francuskiej, a baldery w skali Font. Udostępniony link może je jednorazowo nadpisać za pomocą `?system=` (system dla dróg lub balderów) oraz `?boulderSystem=`.
- **Wycena przypisana a Twoja wycena.** theCrag przechowuje zarówno wycenę wypracowaną przez konsensus, jak i wycenę zaproponowaną przez Ciebie. Crag Stats preferuje wycenę podaną przy przejściu, jeśli jest w odpowiednim systemie, a w przeciwnym razie używa wyceny drogi.
- **Odczytywanie poszczególnych dróg.** Projekty, historia projektów i Wykaz przejść pokazują najpierw wybraną przez Ciebie wycenę. Gdy oryginalna wycena drogi na theCrag jest inna, pojawia się ona w nawiasie, na przykład `6b (20)`. W przypadku częściowego przejścia drogi wielowyciągowej pierwsza wycena nadal opisuje pokonane przez Ciebie wyciągi, a nawias pokazuje oryginalną wycenę drogi. Wyceny bez przypisanej punktacji zachowują swój oryginalny tekst, zamiast próbować zgadywać przeliczenie.
- **Wielowyciągi:** faktyczna wycena przejścia to najtrudniejszy wyciąg pokonany przez _Ciebie_, a nie najtrudniejszy wyciąg na drodze. W przypadku systemów, których parser tekstu nie potrafi odczytać, takich jak UIAA, pełne przejście lub pasująca wycena wyciągu korzysta z uniwersalnej punktacji przejścia. Pozostałe wyciągi korzystają ze środka swojego przedziału trudności, jeśli jest dostępny.
- **Dwuznaczne numery balderów:** kontekst systemu wycen dostawcy decyduje, czy sama cyfra oznacza skalę V, czy skalę Ewbanka. Sam kraj nigdy nie zmienia wyceny w wierszach API. Naprawy zachowują oryginalne dane źródłowe z API. Eksporty CSV nie mają kolumny z systemem wycen, więc australijskie wiersze z balderami zawierające same cyfry (`9`, `1`) otrzymują wskazówkę AU na podstawie Kraju / Ścieżki rejonu / fragmentów URL z australia; jawne `V5` / `VB` pozostają w skali V. Tak jak w przypadku importów API, wywnioskowana wycena przejścia AU nie nadpisuje jawnej wyceny drogi w skali V.
- **Zakresy**, takie jak `V1/2`, są liczone jako wartość średnia (V1.5).
- **Uniwersalna punktacja theCrag.** theCrag ocenia każdą wycenę, w każdym systemie wycen, na jednej skali trudności. Zsynchronizowane przejścia posiadają tę punktację, dzięki czemu Crag Stats może klasyfikować wyceny w dowolnym systemie obsługiwanym przez theCrag (UIAA, saksońskim, nordyckim, polskim, brazylijskim i innych), nawet w takich, których nie potrafi odczytać jako tekst. Same cyfry w tych systemach (np. UIAA `7`) nigdy nie są mylone z wycenami w skali Ewbanka.
- **Wyceny pośrednie.** Przeliczenia skali francuskiej, YDS i Fontainebleau również korzystają z punktacji theCrag, dzięki czemu wyceny niemające dokładnego odpowiednika w skali Ewbanka lub V (francuskie `5c+`, `6a` i `7a+`, Font `6A+` i `7C+`) nadal plasują się ściśle między swoimi sąsiadami (`7a` < `7a+` < `7b`). Piramidy w skali francuskiej, YDS i Font grupują według najbliższej wyceny w danym systemie wyświetlania, a w przypadku wartości środkowych remis rozstrzygany jest na korzyść trudniejszej wyceny. Każdy wiersz linkuje do własnego zakresu wycen w wykazie przejść. Piramidy w skali Ewbanka i V zachowują wiersze z pełnymi stopniami. Ich przedział również wynika z punktacji theCrag, dzięki czemu francuskie `6a` pozostaje w przedziale Intermediate, a `7a+` w przedziale Experienced.
- **Pliki CSV** wgrywane do systemu nie mają kolumny z punktacją, więc ich wyceny są odczytywane z tekstu. Wyceny w skalach francuskiej, YDS, Ewbanka, V i Font przeliczają się jak wyżej; wyceny w innych systemach mogą być wyświetlane bez przeliczenia.

## Tabele przeliczeniowe

Przeliczenia między systemami są przybliżone: wyceny zależą od lokalnej kultury i „6c” w jednym rejonie nie zawsze odpowiada „23” w innym. Poniższe tabele są generowane na podstawie tego samego kodu, z którego korzysta pulpit nawigacyjny.

### Drogi (Ewbank ↔ Francuska ↔ YDS)

<!-- component:route-conversions -->

### Baldery (Skala V ↔ Fontainebleau)

<!-- component:boulder-conversions -->

## Źródła

- theCrag: [Wyceny i przeliczanie wycen](https://www.thecrag.com/en/article/grades)
- theCrag: [Wyceny na theCrag](https://www.thecrag.com/en/article/gradesonthecrag)

## Rekordy wycen na pulpicie nawigacyjnym

Pulpit nawigacyjny zaczyna się od sekcji **Najtrudniejsze przejście** i **Najtrudniejszy onsight / flash**. Pokazują one Twoją najwyższą życiową wycenę zwieńczoną sukcesem oraz najwyższą wycenę pokonaną w pierwszej próbie, w wybranych przez Ciebie systemach. Próby i wspinaczki bez wyceny nie są brane pod uwagę. Drogi i baldery mają osobne wyniki; DWS i highballe wyceniane w skali V są zaliczane do balderów. Częściowe przejścia dróg wielowyciągowych uwzględniają najtrudniejszy pokonany przez Ciebie wyciąg. Każdy wynik podaje nazwę przejścia i zawiera link do kwalifikującego się przejścia. W przypadku remisu między rekordem onsight a flash, wyświetlany jest onsight. Brakujący rekord jest wskazywany przez myślnik i wyjaśnienie.
