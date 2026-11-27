# Popularité des voies

La carte **Popularité des voies** utilise les statistiques communautaires mises en cache par theCrag pour chaque voie : **nombre d'ascensions**, **popularité** et **popularité relative** (0–100). Crag Stats les enregistre lorsque l'importation des données de voies s'exécute (`ROUTE_DATA_IMPORT=true` sur le serveur, puis redémarrez et synchronisez).

## Sentiers battus vs hors des sentiers battus

Pour chaque ascension disposant de données de popularité, nous comparons la **popularité relative** lorsqu'elle est présente, sinon la **popularité globale** :

| Catégorie                    | Règle         |
| ---------------------------- | ------------- |
| **Sentiers battus**          | Score ≥ 50    |
| **Hors des sentiers battus** | Score &lt; 50 |

La carte indique la **part de ces croix** qui correspond à chaque catégorie. Les ascensions sur des voies sans statistiques en cache sont exclues des pourcentages.

## Pépites cachées

Les **pépites cachées** sont des **enchaînements** sur des voies à la fois très appréciées (`qualityScore` ≥ 70, au moins ★★★ ou une mention de grande qualité sur votre croix) et peu fréquentées (**nombre d'ascensions** communautaire ≤ 100 et score de popularité &lt; 50). Jusqu'à trois voies distinctes sont affichées, classées par qualité.

## Carnet de croix

Triez par **Pop.** pour ordonner vos croix selon la popularité des voies (la plus élevée d'abord par défaut). Les lignes sans statistiques en cache sont reléguées en bas de liste.

## Source

Les chiffres proviennent de l'API des voies de theCrag (`show=info`). Elles reflètent l'ensemble de la communauté, et pas seulement votre carnet de croix.

La popularité utilise la popularité relative lorsqu'elle est disponible, puis la popularité globale. Le nombre d'ascensions de la communauté est affiché séparément et n'est jamais comparé numériquement aux scores de popularité.

Pour maintenir à jour les totaux d'ascensions de la communauté, la popularité et les évaluations, le propriétaire du serveur peut définir `ROUTE_DATA_REFRESH_DAYS` sur un nombre entier de jours compris entre 30 et 3650 (par ex. `90` recommandé, ou `180` pour environ six mois), avec `ROUTE_DATA_IMPORT=true`. Il s'agit d'intervalles de jours glissants. Après des synchronisations réussies du carnet de croix, les nouvelles voies sont prioritaires, puis les récupérations obsolètes les plus anciennes sont actualisées dans la même limite de 100 voies et selon la même cadence. Un retard accumulé peut nécessiter plusieurs synchronisations. Non défini, `0`, inférieur à 30 ou supérieur à 3650 conserve le cache par défaut à récupération unique ; **Tout actualiser** reste disponible dans les Paramètres.
