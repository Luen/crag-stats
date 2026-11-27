# Jour de la semaine

La carte **Jour de la semaine** indique les jours de la semaine où vous grimpez, inspirée du graphique hebdomadaire de [Dreeve](https://dreeve.app/) pour Strava. La répartition est présentée sous forme de **graphique en anneau (diagramme circulaire)** avec une légende du lun. au dim. Par défaut, elle se trouve à gauche de **Séances par semaine** (demi-largeur), sur la ligne située sous les statistiques **Mensuelles** / **Annuelles** ; l'option Personnaliser le tableau de bord permet de déplacer l'une ou l'autre carte.

## Ce qui est comptabilisé

- **Séances** (par défaut) — un jour calendaire comportant au moins une ascension correspondante (même principe que [Séances par semaine](/docs/sessions-per-week))
- **Ascensions** — chaque croix correspondante réalisée ce jour-là

Le jour de la semaine est déduit de la date `YYYY-MM-DD` de l'ascension en UTC — les entrées du carnet de croix sont datées au jour près, sans heure.

## Filtres

- **Depuis toujours** / **12 dernières semaines** — fenêtre inclusive de 84 jours se terminant aujourd'hui pour la période courte
- **Séances** / **Ascensions** — ce que représente la taille des parts
- **Tout** / **Sport** / **Trad** / **Bloc** — les pastilles de style reprennent les mêmes couleurs de discipline que le reste de l'application et correspondent aux filtres de style du carnet de croix (style d'ascension **ou** style de la voie). La moulinette et les autres styles n'apparaissent que sous **Tout**.

Les choix sont enregistrés dans le navigateur (`cs_weekday_range`, `cs_weekday_metric`, `cs_weekday_style`).

## Jour le plus actif

Le centre de l'anneau et la ligne d'en-tête indiquent le jour de la semaine ayant la valeur la plus élevée pour l'indicateur actif (les égalités sont départagées selon l'autre indicateur). La part et la ligne de légende de ce jour sont mises en évidence. **Afficher les valeurs par jour** sous le graphique liste le nombre exact de séances, d'ascensions et la proportion pour les lecteurs d'écran et les utilisateurs au clavier.
