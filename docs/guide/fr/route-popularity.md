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

Les chiffres proviennent de l'API des voies de theCrag (`show=info`). They reflect the whole community, not just your logbook.

Popularity uses relative popularity when available, then global popularity. Community ascent counts are shown separately and never compared numerically with popularity scores.

To keep community ascent totals, popularity and ratings fresh, the server owner can set `ROUTE_DATA_REFRESH_DAYS` to a whole number of days from 30 through 3650 (e.g. `90` recommended, or `180` for about half a year), with `ROUTE_DATA_IMPORT=true`. These are rolling day intervals. After successful logbook syncs, new routes take priority, then the oldest stale fetches refresh within the same 100-route limit and pacing. A backlog can take several syncs. Unset, `0`, under 30, or over 3650 keeps the default fetch-once cache; **Refresh all** remains available in Settings.
