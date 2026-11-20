# Répétitions vs nouvelles voies

La carte **Répétitions vs nouvelles voies** indique la part de votre pratique consacrée aux voies déjà enregistrées dans votre carnet de croix, par rapport aux voies nouvelles pour vous. Elle se place par défaut après **Popularité des voies** (demi-largeur), et vous pouvez la déplacer via Personnaliser le tableau de bord.

## Ce qui est comptabilisé

Chaque ascension enregistrée compte, enchaînement comme tentative, dès lors qu'elle dispose d'une date calendaire valide et d'un identifiant de voie du fournisseur.

- Une **première visite** correspond à toute ascension effectuée le premier jour où vous avez enregistré cette voie. Une tentative et un enchaînement réalisés ce même premier jour comptent tous deux comme des premières visites.
- Une **répétition** correspond à toute ascension réalisée un jour ultérieur sur la même voie.

Les voies sont associées via leur identifiant theCrag, jamais par leur nom ; ainsi, deux voies différentes appelées « Arete » restent distinctes. Les jours correspondent aux dates d'escalade saisies dans votre carnet de croix, sans décalage de fuseau horaire.

## Filtres

- **Depuis toujours** ou **12 derniers mois**. La période courte correspond aux 365 jours se terminant aujourd'hui. Le caractère répétitif d'une ascension dépend toujours de l'ensemble de votre historique : une voie gravie pour la première fois il y a trois ans compte donc comme une répétition cette année.
- **Tout**, **Sport**, **Trad** ou **Bloc**. Ils correspondent aux filtres de style du carnet de croix (style grimpé **ou** style de la voie). La moulinette et les autres styles n'apparaissent que sous **Tout**.

Vos choix sont enregistrés dans ce navigateur (`cs_repeats_range`, `cs_repeats_style`).

## Étiquettes

Dès que la vue actuelle comporte au moins 20 ascensions, la carte affiche une courte étiquette descriptive :

| Étiquette                  | Règle                                                   |
| -------------------------- | ------------------------------------------------------- |
| **Explorateur**            | Au moins 75 % des ascensions sont des premières visites |
| **Adepte des répétitions** | Au moins 50 % des ascensions sont des répétitions       |
| **Un peu des deux**        | Tout ce qui se situe entre les deux                     |

Les seuils utilisent les proportions exactes ; les pourcentages affichés sur la carte sont arrondis. Aucun profil n'est meilleur qu'un autre : le travail d'un projet, les longueurs d'entraînement et les circuits favoris apparaissent tous comme des répétitions.

## Les plus répétées

Jusqu'à cinq voies sur lesquelles vous êtes le plus revenu dans la vue actuelle, classées par nombre de jours différents où vous les avez grimpées, puis par nombre d'ascensions, puis par date la plus récente. Chacune renvoie vers ses entrées dans le carnet de croix.

## Quand la carte s'affiche

La carte reste masquée tant que vous n'avez pas au moins 20 ascensions datées associées à un identifiant de voie.

## Badges associés

**Explorateur**, **Baroudeur**, **Collectionneur de voies**, **Explorateur de topos**, **Fidèle habitude** et **Terrain connu** utilisent les mêmes règles de première visite et de répétition. Voir [Badges](/docs/badges).
