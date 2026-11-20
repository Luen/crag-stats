# Paramètres d'affichage

**Paramètres → Affichage et visibilité** définit la façon dont les dates et les unités de mesure s'affichent sur l'ensemble du site. Ces choix s'appliquent à chaque visiteur, et non uniquement au navigateur du propriétaire, et prennent effet dès le prochain chargement de page.

## Format de date

| Option         | Exemple      |
| -------------- | ------------ |
| **Auto**       | 27 oct. 2026 |
| **JJ/MM/AAAA** | 27/10/2026   |
| **MM/JJ/AAAA** | 10/27/2026   |
| **AAAA-MM-JJ** | 2026-10-27   |

**Auto** suit la langue d'affichage du site (`DISPLAY_LOCALE`), offrant ainsi une lecture naturelle à la plupart des visiteurs sans configuration supplémentaire.

Ce format modifie les dates affichées sur le tableau de bord, le carnet de croix, les pages météo, les badges, les objectifs, les étapes clés et les graphiques. Les liens de filtrage, les attributs `datetime`, les données des graphiques et les paramètres d'URL conservent leurs valeurs ISO `YYYY-MM-DD`, afin qu'un lien partagé pointe toujours vers le même jour.

## Unités de mesure

Chaque mesure dispose de son propre paramètre, vous permettant ainsi de les combiner à votre guise :

| Mesure             | Options                       |
| ------------------ | ----------------------------- |
| **Hauteur**        | Mètres (m), pieds (ft)        |
| **Distance**       | Kilomètres (km), miles (mi)   |
| **Température**    | Celsius (°C), Fahrenheit (°F) |
| **Vent**           | km/h, mph                     |
| **Précipitations** | Millimètres (mm), pouces (in) |

Les préréglages remplissent les cinq champs en une seule fois :

- **Métrique** : mètres, kilomètres, Celsius, km/h et millimètres.
- **Impérial (US)** : pieds, miles, Fahrenheit, mph et pouces.
- **Royaume-Uni (Mixte)** : mètres, miles, Celsius, mph et millimètres.

Les préréglages ne sont qu'un raccourci : modifier ensuite une unité individuelle crée une combinaison personnalisée, et le formulaire des Paramètres indique les valeurs enregistrées.

## Ce qui reste en système métrique

La base de données enregistre toujours les hauteurs en mètres, les distances en kilomètres, les températures en °C, le vent en km/h et les précipitations en millimètres. La conversion n'a lieu que lors du rendu d'une page ; changer d'unités ne modifie donc jamais votre carnet de croix, vos objectifs ou vos importations.

- **L'exportation CSV** conserve ses colonnes métriques canoniques.
- **Les seuils des badges** (paliers de hauteur, chaleur, gel, pluie, vent, etc.) sont définis en unités métriques. Seul le libellé est converti : par exemple, **Vague de chaleur** indique « 35 °C ou plus » en métrique et « 95 °F ou plus » en Fahrenheit. Les mêmes ascensions permettent d'obtenir les mêmes badges dans les deux cas.
- **Les filtres météo** tels que ceux de chaleur, gel, pluie, neige et vent du carnet de croix conservent leurs seuils métriques.
- **Les conversions sont arrondies** pour l'affichage ; une valeur indiquée en pieds, en miles ou en pouces est donc approximative et ne correspond pas à une seconde mesure enregistrée.

## Remplacements ponctuels

Le tableau de bord accepte `?units=metric`, `?units=imperial` ou `?units=uk` pour prévisualiser un préréglage sans l'enregistrer. Des paramètres individuels permettent de remplacer une mesure à la fois : `unitHeight`, `unitDistance`, `unitTemp`, `unitWind` et `unitPrecip` (par exemple `?unitTemp=fahrenheit&unitWind=mph`). Ces paramètres s'appliquent uniquement à ce chargement de page et ne modifient pas les Paramètres.

## Où les paramètres s'appliquent

Les choix de date et d'unités s'appliquent au tableau de bord, au carnet de croix, au calendrier d'activité, à la charge d'entraînement, aux pages météo, aux secteurs, à la carte d'escalade, aux objectifs, aux badges, aux étapes clés, aux cartes intégrables et à l'instantané hors ligne. Les systèmes de cotation sont distincts : voir [Cotations](/docs/grades).
