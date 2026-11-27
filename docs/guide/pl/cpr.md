# CPR (Climber Performance Rating)

**CPR** to używana przez theCrag ocena Twoich umiejętności wspinaczkowych. Crag Stats pokazuje linię czasu CPR osobno dla wspinaczki **sportowej**, **tradowej** i **boulderingu**, tak jak theCrag, ponieważ te trzy dyscypliny wyceniane są zupełnie inaczej.

## Jak theCrag oblicza CPR

theCrag stworzył CPR na podstawie analizy statystycznej około miliona przejść. Główne założenia:

- **Każda wycena jest około 5× trudniejsza od poprzedniej** (współczynnik potęgowy _P_ = 5 w skali Ewbanka). Każda unikalna droga, którą przeszedłeś, dodaje do sumy w przybliżeniu _P_ podniesione do potęgi jej wyceny. Suma ta jest przeliczana z powrotem na wycenę za pomocą logarytmu o podstawie 5. Dzięki temu pięć przejść na danej wycenie ma mniej więcej taką samą wartość, jak jedno przejście na wycenie o stopień wyższej.
- **Korekty stylu przejścia.** Sposób, w jaki pokonałeś drogę, ma znaczenie. Przejścia przed punktacją są przesuwane o odpowiednie przesunięcie wyceny. Na przykład we wspinaczce sportowej wspina się w stylu red point o około **2.1 stopnia** trudniej niż w onsight, a we wspinaczce tradowej pink point jest o około **0.8 stopnia** łatwiejszy niż red point. Przesunięcia są obliczane osobno dla wspinaczki sportowej, tradowej i boulderingu.
- **Ugruntowanie wyceny.** Jedno przejście na nowym poziomie wyceny może być miękką drogą lub kwestią przypadku. Twoja _wycena_ rośnie dopiero po około **trzech** przejściach na tym poziomie, ale każde przejście i tak podnosi Twój ogólny wynik.
- **Spadek aktywności.** Jeśli przestaniesz się wspinać, CPR spada o około **0.7 stopnia w skali Ewbanka rocznie** (w przybliżeniu trzy czwarte stopnia).
- **Powtórzenia** drogi liczą się tylko raz (najlepszy wpis), a pod uwagę brana jest oficjalnie przypisana wycena drogi, a nie Twoje osobiste odczucie.

theCrag utrzymuje ocenę z uwzględnieniem spadku aktywności oraz bez niego dla wspinaczki sportowej, tradowej i boulderingu.

## Skąd Crag Stats pobiera dane

- **Z API theCrag (preferowane).** Podczas synchronizacji z kluczem API dla wspierających, każde przejście może zawierać własne wartości CPR z theCrag. Jeśli wystarczająca liczba Twoich przejść w danej dyscyplinie posiada te dane (co najmniej 3 i co najmniej 20% przejść w tej dyscyplinie), linia czasu używa **CPR z theCrag z uwzględnieniem spadku**, oznaczonego jako _theCrag CPR_.
- **Model szacunkowy (zastępczy).** W przeciwnym razie Crag Stats oblicza własny CPR, oznaczony jako _Approx._ Używa tych samych założeń: _P_ = 5, najlepszy tick na drogę, korekty stylu przejścia i spadek 0.7 stopnia/rok. Przesunięcia dla stylów przejścia są szacunkowe, np. dla wspinaczki sportowej: onsight +2.1, flash +1.4, red point 0, pink point −0.5, próby −3. **Nie jest to dokładna kopia autorskiej implementacji theCrag**, więc należy spodziewać się niewielkich różnic.

## Jak czytać linię czasu

- Każda **kolumna** odpowiada jednemu kwartałowi roku.
- **Świece** pokazują zakres wycen dróg pokonanych w poszczególnych stylach przejścia w danym kwartale. Jak na theCrag, najczystsze przejście jest na górze: onsight zielony, flash żółty, redpoint czerwony, pink point różowy, przejście/clean niebieski, próby szare.
- **Czarna linia** reprezentuje Twój CPR w czasie. Pierścień oznacza Twój **szczyt**, a pusty punkt **aktualną** ocenę.
- **Kolorowe tło** pokazuje przedziały wycen (Początkujący → Elita) na ich rzeczywistych granicach trudności.
- **Paski** poniżej pokazują liczbę przejść zarejestrowanych w danym kwartale. Kliknij jeden z nich, aby otworzyć te przejścia w wykazie przejść.
- **Przerywana linia podziału** z **⋯** na osi czasu oznacza przerwę dłuższą niż jeden kwartał.
- **Pokaż puste kwartały** przypisuje własną kolumnę każdemu kwartałowi między Twoim pierwszym a ostatnim zarejestrowanym wpisem. Kwartały bez przejść pozostają puste i **przerywają czarną linię**, dzięki czemu długa przerwa nie wygląda jak stały progres. Wykres przewija się w bok, gdy dodatkowe kolumny wymagają więcej miejsca. Pozostaw to pole odznaczone, aby zachować widok kompaktowy, w którym kolumny mają tylko kwartały z zarejestrowanymi przejściami.

theCrag zauważa, że **szary wierzchołek** nad linią (nieudane próby na wyższych trudnościach) często pojawia się tuż przed skokiem na wyższy poziom.

## Źródła

- theCrag: [Climber Performance Rating (CPR)](https://www.thecrag.com/en/article/cpr)
- theCrag: [Wyjaśnienie linii czasu CPR](https://www.thecrag.com/en/article/cprtimeline)
