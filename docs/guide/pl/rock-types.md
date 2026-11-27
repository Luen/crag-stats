# Rodzaje skał

theCrag przechowuje informacje geologiczne dla wielu dróg w formie ustrukturyzowanego tagu **Rodzaj skały** (na przykład Granit lub Piaskowiec). Crag Stats odczytuje ten tag ze zsynchronizowanego wykazu / pamięci podręcznej dróg — nigdy nie scrapuje stron ani nie zgaduje rodzaju skały na podstawie nazwy rejonu.

## Karta rodzajów skał

Karta **Rodzaje skał** na pulpicie zlicza przejścia dróg posiadających tag Rodzaj skały i pokazuje udział procentowy każdej z nich. Przy dominującym rodzaju może wyświetlić się krótka notka geologiczna. Każda nazwa prowadzi do wykazu przejść przefiltrowanego przez `?rock=`.

Drogi bez tagu Rodzaj skały są pomijane na wykresie, więc wartości procentowe dotyczą wyłącznie otagowanych wspinaczek.

## Karta Skała a wyniki

Gdy co najmniej **20** dni wspinaczkowych obejmuje przynajmniej jedno przejście lub próbę na drodze z tagiem Rodzaj skały, karta **Skała a wyniki** porównuje rezultaty tych wspinaczek w zależności od rodzaju skały. Wcześniej pokazuje, ile otagowanych dni masz do tej pory na koncie. Karta pozostaje ukryta, dopóki nie ma żadnego otagowanego przejścia lub próby. Można ją przenieść lub ukryć w sekcji Ustawienia → Pulpit.

**Co jest liczone.** Przejścia i próby (ta sama klasyfikacja „ticków”, co wszędzie indziej) na drogach z tagiem Rodzaj skały. Nieotagowane wspinaczki są raportowane jedynie jako pokrycie („N więcej … nie ma tagu rodzaju skały”).

**Miary** (te same zasady co w [Pogoda a wyniki](/docs/weather)):

- **Skuteczność przejść:** przejścia jako udział we wszystkich przejściach i próbach na danej skale.
- **Blisko limitu:** udział przejść z wyceną w granicach 2 stopni trudności (1 stopień w skali V) od Twojego najtrudniejszego przejścia w **tym samym stylu i skali** w ciągu 365 dni poprzedzających dany dzień. Skala V i wyceny dróg nigdy nie są ze sobą mieszane.
- **Onsight/flash:** onsighty i flashe jako udział w przejściach na danej skale.

**Jak rzetelnie interpretować dane.**

- Dany rodzaj skały wymaga co najmniej **10** przejść (dla mianownika tej miary) w ciągu co najmniej **3** dni, zanim zostanie wyświetlony wynik.
- Oznaczenia **Wyżej** / **Niżej** wykorzystują ten sam odporny na klastry test, co wyniki pogodowe: każda grupa „skała i dzień” jest traktowana jako jedna jednostka, dzięki czemu jedna intensywna sesja nie stworzy samodzielnie sztucznego wzorca.
- Wybór rejonu, podróże i projekty mogą zniekształcać dane dotyczące rodzaju skały. Traktuj różnice jako korelację, a nie przyczynę.
- Jeśli masz wiele różnych nazw skał, te najrzadsze są grupowane w kategorii **Inne** (bez linku do wykazu przejść). Nazwane sekcje linkują do `/logbook?rock=…` z tym samym dopasowaniem bez względu na wielkość liter, co na karcie Rodzaje skał.

Wyświetlenie karty nigdy nie wysyła żądania do dostawcy danych, a prywatne notatki nigdy nie są wykorzystywane.

Punkt odniesienia dla „blisko limitu” obejmuje Twoje przejścia w tym samym stylu i skali, nawet jeśli te drogi referencyjne nie mają tagu skały. Wykorzystuje wycenę najtrudniejszego pokonanego wyciągu,
jeśli jest dostępna, obejmuje dzień 365 wstecz i wyklucza wszystkie przejścia z dnia,
który jest porównywany. Wyniki dla skały i pogody korzystają z tego samego sposobu obliczania punktu odniesienia; w przypadku pogody dodatkowo ogranicza się przejścia referencyjne do wspinaczek w skałach.
