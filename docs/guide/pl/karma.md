# Karma

theCrag przyznaje **Karmę** za wkład w indeks wspinaczkowy — rejestrowanie przejść i edycję danych w przewodnikach. Zobacz [Karma na theCrag](https://www.thecrag.com/article/cragkarma).

## Co może pokazać Crag Stats

Obiekt konta API **logbook** użytkowników wspierających **nie** zawiera Twojej łącznej liczby punktów karmy ani podziału na przejścia/edycje. Punkty końcowe obszaru `/karma` to rankingi współtwórców dla danego rejonu, a nie zastępstwo dla wyniku Twojego konta.

Dopóki theCrag nie udostępni osobistej karmy (lub negocjowanego dostępu), karta na pulpicie nawigacyjnym jest **szacunkiem obejmującym wyłącznie część dotyczącą przejść**:

| Źródło                                        | Punkty                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Zarejestrowanie przejścia                     | **1** raz na drogę (węzeł), zgodnie z zasadą theCrag dotyczącą jednego punktu na dany typ wkładu |
| Edycje przewodnika (opisy, topo, historia, …) | **Niedostępne** — niemożliwe do odtworzenia z pamięci podręcznej logbooka                        |

Gdy Twoje zsynchronizowane konto zawiera `routesTicked` i liczba ta jest co najmniej tak duża jak lokalna pamięć podręczna dróg, karta używa jej dla łącznej liczby przejść (odpowiada to sekcji „drogi zarejestrowane przez Ciebie” na theCrag). W przeciwnym razie zlicza unikalne drogi w Twojej lokalnej pamięci podręcznej SQLite.

Kafel **lokalnie zarejestrowane drogi** zawsze pokazuje liczbę unikalnych dróg powiązanych z Twoimi zsynchronizowanymi przejściami, nawet jeśli szacunek przejść wykorzystuje większy licznik konta. Powtórzone przejścia liczą się tylko raz; metadane drogi bez przejścia nie są wliczane.

## Czym to nie jest

- Nie jest to dokładny klon wyniku z Twojego profilu na theCrag.
- Rzeczywista karma oczekuje w **kolejce weryfikacyjnej** przez około tydzień, zanim trafi na Twoje konto.
- Usuwanie lub edycja przejść, konta prywatne oraz importy historyczne mogą powodować brak synchronizacji między lokalnymi statystykami a theCrag.
- **Nie** tworzymy sztucznie punktów za edycję na podstawie oznaczeń FA ani autorstwa dróg — te działania mogą przynosić karmę na theCrag, ale zasady punktowania to jeden punkt na węzeł dla danego typu wkładu, a nie mamy Twojej historii edycji.

## Kiedy może się to poprawić

Jeśli theCrag doda karmę (lub sumy przejść/edycji) do danych konta logbooka lub udokumentowanego punktu końcowego wspinacza, z którym będziemy mogli bezpiecznie się zsynchronizować, Crag Stats zastąpi wartości szacunkowe rzeczywistymi liczbami i uzupełni kafel edycji.
