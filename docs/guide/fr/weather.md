# Météo

Crag Stats peut mettre en cache la **météo quotidienne en extérieur** pour les ascensions disposant de coordonnées de voie, puis l'utiliser pour les badges, le tableau de bord, le carnet de croix et une comparaison de vos performances selon les conditions météo.

## Activation volontaire

Désactivé par défaut. Le propriétaire du serveur définit `WEATHER_IMPORT=true` dans `.env` et redémarre. Après chaque synchronisation réussie du carnet de croix, selon la planification d'import en arrière-plan (`IMPORT_CRON`, quotidienne par défaut, qui couvre aussi les carnets importés par CSV), et depuis **Paramètres → Importer la météo**, Crag Stats récupère jusqu'à **50** journées en extérieur manquantes par exécution via l'API météo historique d'[Open-Meteo](https://open-meteo.com/), en commençant par les jours d'escalade les plus anciens, avec au moins **1,1 seconde** entre les requêtes. L'action dans les Paramètres lance cette exécution en arrière-plan afin que la page n'attende pas la fin de tout le lot. L'effacement vide le cache.

L'offre gratuite non commerciale d'Open-Meteo est destinée aux installations personnelles auto-hébergées. N'activez pas cette option pour un service commercial multi-locataire sans avoir consulté leurs conditions d'utilisation et leurs offres payantes.

## Données récupérées

- **Extérieur uniquement** — les voies probablement en salle sont ignorées (mêmes heuristiques que pour les objectifs).
- **Coordonnées requises** — la voie doit disposer d'une latitude et d'une longitude (via la synchronisation theCrag ou l'import des données de voies pour les carnets CSV).
- **Jours passés** — la date UTC du jour même est ignorée ; les archives sont souvent incomplètes pour la journée en cours.
- **Clé de cache partagée** — la latitude et la longitude sont arrondies à **une décimale**, de sorte que les voies voisines d'une même falaise partagent une même entrée journalière.

Champs enregistrés : températures quotidiennes max/min (°C), précipitations (mm), code météo OMM, humidité moyenne et vent max/moyen à 10 m (km/h). Les unités d'affichage pour la température (°C ou °F), le vent (km/h ou mph) et les précipitations (mm ou po) peuvent être choisies dans **Paramètres → Affichage et visibilité**.

## Badges

Une fois une journée mise en cache, ces badges peuvent être débloqués par toute ascension **en extérieur** enregistrée ce jour-là à cet endroit (les essais comptent ; les entrées en salle sont ignorées même si elles partagent des coordonnées mises en cache) :

| Badge                      | Règle                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------- |
| **Vague de chaleur**       | Maximale du jour ≥ 35°C                                                                |
| **Image congelée**         | Minimale du jour ≤ 0°C                                                                 |
| **Pause pluie**            | ≥ 1 mm de précipitations et non classé comme neige                                     |
| **Escalade sous la neige** | Codes neige OMM (71–77, 85–86), ou ≥ 1 mm de précipitations avec maximale ≤ 1°C        |
| **Emporté par le vent**    | Vent max du jour à 10 m ≥ 50 km/h                                                      |
| **Grand beau**             | Maximale 15–25°C, précipitations mesurées < 0,1 mm, sans code neige/orage OMM          |
| **Moite**                  | Humidité moyenne ≥ 85%                                                                 |
| **Croix de tempête**       | Un **enchaînement** un jour avec ≥ 10 mm de précipitations hors neige                  |
| **Quatre saisons**         | Obtenir Canicule, Coup de gel, Jour de pluie et Grimpe sous la neige au moins une fois |

Sans `WEATHER_IMPORT` (ou avant la récupération de l'historique), ces badges restent verrouillés même si vous avez grimpé dans ces conditions. Une « série caniculaire » (plusieurs jours de forte chaleur sur une même semaine) est reportée à plus tard.

## Page de détail météo

Ouvrez [Météo](/weather) depuis la barre latérale d'analyses ou depuis le titre de l'une des cartes météo du tableau de bord. Le tableau de bord conserve des conditions compactes et un résumé maximale du jour / taux d'enchaînement lorsqu'un signal clair existe. Sans signal clair, la carte de performance conserve ses tranches détaillées et ses contrôles ; la page de détail offre toujours la vue complète. La visibilité et les positions enregistrées des cartes du tableau de bord continuent de s'appliquer.

Sur la page de détail, le regroupement et la mesure de performance sont enregistrés dans l'URL (`group=temperature|conditions`, `measure=sendRate|nearLimit|onsightFlash`), ce qui vous permet d'ajouter une vue aux favoris et d'utiliser Précédent/Suivant. Les tendances météo décrivent des corrélations, et non des recommandations ou des causes.

**Couverture et qualité de localisation** sépare les jours-lieux exploitables en cache, les jours vérifiés sans météo disponible et les jours pas encore vérifiés (y compris aujourd'hui et les dates futures). Les ascensions en extérieur avec une date valide mais sans localisation résolue sont comptées séparément : elles ne peuvent pas être rattachées à un jour-lieu et sont exclues de ce dénominateur. Les conditions comptent toutes les croix en extérieur ; la performance compte uniquement les enchaînements et les essais. Les contrôles d'import et de localisation restent dans les Paramètres, accessibles via un lien depuis Météo pour le propriétaire connecté.

Sans météo en extérieur en cache, la page explique le fonctionnement de l'import. Un cache encore limité affiche tout de même les conditions, tandis que la performance attend son échantillon minimal habituel. Consulter la page Météo ne déclenche jamais de requête auprès du fournisseur.

## Conditions météo

La carte **Conditions météo** du tableau de bord apparaît dès qu'au moins une journée d'escalade en extérieur dispose d'une ligne météo en cache ; sans `WEATHER_IMPORT` (ou avant la fin de la première récupération), elle reste masquée. Elle peut être affichée, masquée ou déplacée depuis Paramètres → Tableau de bord comme n'importe quelle autre carte.

- Les **jours** sont des _jours-lieux_ : un jour calendaire à un endroit mis en cache (latitude/longitude arrondies à une décimale). Une journée répartie sur deux falaises compte double ; les voies en salle ou probablement en intérieur ne comptent jamais.
- **Couverture** compare les jours disposant d'une ligne météo en cache à l'ensemble des jours en extérieur dotés de coordonnées de voie. Les jours sans ligne exploitable en cache (y compris les jours non vérifiés et ceux vérifiés mais indisponibles) sont indiqués comme « sans météo exploitable » et exclus de tous les autres chiffres de la vue des conditions.
- **Ascension la plus chaude / la plus froide** utilise la température maximale et minimale du jour. Le lien mène à la première ascension enregistrée ce jour-là sur theCrag.
- **Répartition des jours** affiche la part des jours parfaits, pluvieux, neigeux, glacials et très chauds parmi les jours avec météo en cache, selon les mêmes règles que les badges ci-dessus (pluie ≥ 1 mm hors neige, codes neige, minimale ≤ 0°C, maximale ≥ 35°C). Une même journée peut figurer dans plusieurs lignes, par exemple une journée glaciale et neigeuse.
- Un jour **Parfait** est un beau jour (maximale 15–25°C, sec, sans neige ni orage) qui est aussi calme (vent max inférieur à 25 km/h), peu humide (humidité moyenne inférieure à 85%) et sans gel nocturne. Si le vent, l'humidité ou la minimale manque pour une journée, elle n'est pas comptée comme parfaite.
- **Maximale du jour** est un petit histogramme de la température maximale de chaque jour par tranches de 5°C, libellé dans l'unité de température choisie. Les plages incluent la borne inférieure et excluent la borne supérieure (par exemple, 0–<5°C ou 32–<41°F).

Il s'agit de valeurs modélisées pour la maille de grille la plus proche, et non de normales climatiques officielles ni de mesures au pied de la paroi.

## Météo et performance

À partir de **20 jours-lieux ou plus** en extérieur avec météo en cache, la vue détaillée **Météo et performance** compare comment s'est déroulée votre grimpe en extérieur selon les conditions météo. Avant cela, elle indique combien de jours-lieux éligibles sont en cache jusqu'à présent. Le résumé du tableau de bord reste masqué tant qu'aucune météo n'est en cache et peut être déplacé ou masqué depuis Paramètres → Tableau de bord ; la page de détail reste accessible avec une explication de l'état vide.

**Ce qui est compté.** Les enchaînements et essais en extérieur (selon la même classification des croix que partout ailleurs) dont le jour-lieu dispose d'une météo en cache. Les voies en salle, les croix qui ne sont ni un enchaînement ni un essai, ainsi que les ascensions sans emplacement météo sont exclus. Les ascensions dont la météo provient d'un lieu proche approximatif ou d'un polygone de zone sont incluses, et la vue précise leur nombre.

Le résumé compact du tableau de bord affiche la maximale du jour / taux d'enchaînement. Son affichage de repli sans signal et la page de détail proposent les deux contrôles ci-dessous.

**Grouper par :**

- **Maximale du jour :** moins de 10°, 10–17°, 18–24°, 25–29° et 30°+. Chaque tranche inclut sa borne inférieure et s'arrête juste en dessous de la suivante, comme la plage de température du carnet de croix.
- **Conditions :** Beau, Sec (précipitations mesurées inférieures à 1 mm et sans neige ; une valeur de pluie manquante est inconnue, pas sèche), Pluvieux, Neigeux, Chaud, Glacial, Calme (vent max inférieur à 25 km/h) et Venteux (≥ 50 km/h), selon les règles des badges et du carnet de croix ci-dessus. Une même journée peut appartenir à plusieurs conditions. Un vent mesuré entre 25 et moins de 50 km/h n'est ni Calme ni Venteux.

**Mesures :**

- **Taux d'enchaînement :** les enchaînements rapportés à l'ensemble des enchaînements et essais.
- **Proche du niveau max :** la part des enchaînements cotés situés à 2 cotations maximum (1 degré V sur l'échelle V) de votre enchaînement en extérieur le plus dur dans le **même style et la même échelle de cotation** au cours des 365 jours précédents. Le trad est comparé au trad et l’escalade sportive à l’escalade sportive, et les cotations sur l’échelle V et les cotations de voie ne sont jamais mélangées. Utiliser votre meilleur niveau récent plutôt que votre record absolu évite que votre progression au fil des années ne donne l'impression que la météo récente était plus favorable. Les enchaînements sans précédent enchaînement dans le même style sur cette période d'un an, ainsi que les enchaînements non cotés, sont exclus de cette mesure.
- **À vue / flash :** les ascensions à vue et flash en proportion des enchaînements.

**Interpréter les résultats avec honnêteté.**

- Chaque barre indique le taux de la tranche ; la ligne marque votre taux global. Une tranche doit compter au moins **10** ascensions (pour le dénominateur de cette mesure) réparties sur au moins **3** jours pour afficher un taux. Les tranches plus petites affichent « Pas assez de données ».
- Une tranche n'est marquée **Plus élevé** ou **Plus bas** que lorsqu'elle diffère de l'ensemble de vos _autres_ jours météo au-delà de ce qu'explique la variation d'un jour à l'autre (un test bilatéral à environ 95 %), avec au moins 5 jours de chaque côté. Les ascensions d'une même journée partagent la même météo et généralement la même falaise et le même partenaire, le test traite donc chaque jour-lieu comme une unité plutôt que chaque ascension. Une grosse journée dehors ne peut pas créer une tendance à elle seule.
- Le résumé en une ligne nomme la tranche qui se démarque le plus pour la mesure sélectionnée, ou indique que rien ne se démarque encore.
- Il s'agit d'une **corrélation, pas d'une causalité**. La saison, la falaise, les partenaires et votre avancée dans un projet varient tous avec la météo. Avec de nombreuses tranches et mesures, un « Plus élevé » ou « Plus bas » occasionnel peut apparaître par pur hasard.

Chaque tranche de maximale du jour et les conditions beau, pluie, neige, chaleur, gel, calme et venteux renvoient vers le carnet de croix filtré sur ces ascensions. Sec ne dispose pas de filtre dans le carnet de croix. Un tableau de valeurs sous les barres de la page de détail liste chaque tranche avec les décomptes pour les trois mesures. Afficher la carte ne déclenche jamais de requête météo, et les notes privées ne sont jamais utilisées.

Lorsque la comparaison maximale du jour / taux d'enchaînement du tableau de bord ne montre aucun signal clair, la carte Météo et performance conserve ses tranches détaillées, ses contrôles locaux de regroupement/mesure et son tableau de valeurs. Ces contrôles ne modifient pas l'URL du tableau de bord. Un signal clair conserve le résumé compact ; les deux versions renvoient vers la page météo. Les seuils d'échantillon minimal restent inchangés.

## Filtres et pastilles du carnet de croix

Les références proche du niveau max utilisent le même calcul par style et échelle de cotation que
[Roche et performance](/docs/rock-types), en utilisant les cotations des longueurs grimpées lorsqu'elles sont disponibles.
La référence météo inclut les enchaînements en extérieur sans météo en cache, inclut
le 365e jour précédent et exclut les enchaînements du jour comparé.

Dès qu'une météo est en cache, le carnet de croix dispose d'un filtre **Météo du jour** (`?weather=`) : `fair`, `perfect`, `heat`, `freeze`, `rain`, `snow`, `wind` ou `calm`. **Journée venteuse** correspond à un vent max quotidien à 10 m **≥ 50 km/h**, soit le même seuil que **Emporté par le vent**. **Journée calme / sans vent** correspond à un vent max mesuré **inférieur à 25 km/h**, soit le seuil de calme utilisé par **Jour parfait**, sans exiger de températures agréables, de temps sec ni de faible humidité. Les relevés de vent manquants ne correspondent à aucune des deux options ; les journées entre 25 et moins de 50 km/h ne correspondent à aucun filtre de vent. Les autres options utilisent les mêmes règles que les badges. Il ne correspond qu'aux ascensions **en extérieur** dotées de coordonnées de voie et d'une journée en cache pour cet endroit ; les voies en salle, les ascensions sans coordonnées et les journées non récupérées ne correspondent jamais.

Les lignes des jours en cache affichent aussi de petites pastilles textuelles (par exemple « Chaud 36°C », « Gel -2°C », « Pluie 4 mm », « Neige », « Venteux 55 km/h », « Beau 21°C »). Les journées ordinaires n'affichent rien.

Le propriétaire connecté dispose également de **Sans météo en cache** (`?missing=weather`), qui liste les ascensions en extérieur avec coordonnées et une date passée n'ayant pas encore de météo en cache, afin de voir ce que récupéreront les prochains imports. Les visiteurs ne voient jamais cette option.

La file des jours sans météo exclut les journées déjà vérifiées auprès du fournisseur mais que celui-ci n'a pas pu fournir. Ces entrées négatives en cache ne produisent pas de pastilles météo et ne sont pas automatiquement remises en file d'attente. Les dates calendaires invalides sont exclues à la fois de l'importateur et de la file d'attente.

## Activités récentes

La carte **Activités récentes** du tableau de bord affiche les mêmes pastilles textuelles sous une ascension en extérieur lorsque sa journée est en cache. Elles sont lues comme une courte liste intitulée « Météo du jour », jamais uniquement par la couleur, et la bande est omise pour les voies en salle, les jours non mis en cache et les conditions ordinaires.

## Récit d'escalade

Les pourcentages du récit décrivent les jours-lieux en extérieur mis en cache, et non les jours dont la météo reste inconnue.

Lorsque le cache couvre au moins 20 jours en extérieur et au moins la moitié de vos journées en extérieur, le [Récit d'escalade](/docs/climbing-story) peut ajouter une courte ligne sur les conditions dans lesquelles vous grimpez (neige, froid, chaleur, pluie ou large amplitude thermique). Il décrit les conditions dans lesquelles vous grimpez, jamais celles que vous évitez, et n'apparaît pas dans le récit lorsque la couverture est insuffisante.

## Calendrier des ascensions

Le [Calendrier des ascensions](/docs/ascent-calendar) propose un mode de couleur **Météo** (affiché uniquement une fois la météo mise en cache). Il partage les règles des badges ; consultez cette page pour la légende des couleurs.

## Secteurs : climat lors de vos visites

Sur la page **Secteurs**, une falaise comptant au moins **5** jours de visite en extérieur en cache affiche un résumé sur une ligne : températures maximales et minimales moyennes du jour, ainsi que la part de ces jours avec pluie, neige, gel ou forte chaleur (neige, gel et forte chaleur uniquement au-dessus de 0 %). Il décrit les jours où vous y avez réellement grimpé, et reflète donc les saisons auxquelles vous vous y rendez. Il ne s'agit **pas** de normales climatiques officielles ni de prévisions, et ce résumé est masqué pour les falaises sous le seuil, pour les voies en salle et lorsqu'aucune météo n'est en cache.

## Taux de beau temps

À partir de **20 jours ou plus** en extérieur avec météo en cache, la carte Conditions météo ajoute un **Taux de beau temps** : la part de ces jours qui étaient _beaux_ (maximale 15-25°C, sec, sans neige ni orage — la même règle que **Grand beau**). Elle indique aussi la part des jours _difficiles_ (très chauds, glacials, humides, neigeux ou très venteux). Les journées intermédiaires, comme une journée sèche à 29°C, ne sont comptées dans aucun des deux groupes.

L'étiquette est descriptive, ce n'est pas une note : **Plutôt par beau temps** à 60 % de beau temps ou plus, **Grimpeur tout temps** à 50 % de jours difficiles ou plus, sinon **Un peu des deux**. Les groupes peuvent se chevaucher : une journée douce et sèche peut tout de même être très venteuse ou glaciale la nuit. Lorsque les deux seuils d'étiquette sont atteints, **Grimpeur tout temps** est prioritaire. En dessous de 20 jours, rien n'est affiché, afin qu'un cache trop limité ne vous attribue jamais d'étiquette. Le lien ouvre le carnet de croix filtré sur les beaux jours.
Pour les recommandations saisonnières issues des métadonnées des voies, consultez [Meilleurs mois](/docs/best-months) ; ces recommandations sont distinctes de la météo relevée lors de vos visites enregistrées.

Les étiquettes de beau temps utilisent le nombre exact de jours pour leurs seuils ; les taux affichés sont arrondis à une décimale. L'arrondi d'affichage seul ne modifie jamais votre étiquette.

### Des détails météo à votre carnet de croix

Chaque ligne de condition et chaque barre de maximale du jour dans la vue détaillée **Conditions météo** ouvre le carnet de croix filtré sur ces journées. Une barre de température inclut sa borne inférieure et s'arrête juste en dessous de la barre suivante (par exemple, 20–24° couvre de 20,0 °C jusqu'à 25 °C non inclus). La plage reste appliquée lorsque vous triez, changez de page ou ajoutez d'autres filtres ; utilisez **Effacer la plage météo** pour ne supprimer que cette plage.

La carte compte les _jours_ en extérieur à chaque endroit, tandis que le carnet de croix liste chaque _ascension_ correspondante : les deux nombres peuvent donc différer. Sur grand écran, le carnet de croix affiche une colonne Météo avec la maximale, la minimale et la pluie du jour en cache ; sur plus petit écran, les pastilles de conditions apparaissent à côté de la voie. Les ascensions en salle ou sans cache affichent un tiret. Consulter ces pages ne déclenche jamais de requête météo.

## Emplacements météo lorsque les coordonnées de voie manquent

Les exports CSV n'incluent pas les coordonnées. Lorsque l'import météo et l'import des données de voies sont tous deux activés (`WEATHER_IMPORT=true` et `ROUTE_DATA_IMPORT=true`), la clé API supporter configurée peut également rechercher les emplacements correspondant aux identifiants de falaise/secteur présents dans les données de voies en cache. Cela n'importe ni le carnet de croix ni le profil du propriétaire de cette clé. Les ancêtres de carnet par clé ainsi que les tableaux d'ancêtres de l'API des voies sont pris en charge.

Les recherches de zones partagent le budget de dix requêtes et la cadence d'une seconde de l'import des voies. Les vérifications de voies utilisent d'abord ce budget ; les requêtes restantes vérifient jusqu'à dix zones chacune. Les Paramètres affichent **zones météo en attente** et proposent **Vérifier les emplacements météo maintenant** une fois toutes les voies vérifiées. Les installations CSV existantes peuvent compléter les emplacements de zones manquants sans **Actualiser toutes les voies**. La prochaine exécution d'import vérifie également la file d'attente. Une fois les vérifications d'emplacements terminées, un lot météo démarre en arrière-plan s'il existe des jours éligibles.

Les réponses de zones (y compris les emplacements manquants) sont mises en cache une fois par identifiant de zone du fournisseur. `ROUTE_DATA_REFRESH_DAYS` contrôle aussi leur délai d'actualisation facultatif, et **Actualiser toutes les voies** rend les recherches de zones de nouveau éligibles. Les échecs d'accès arrêtent l'import et utilisent son mécanisme de temporisation existant ; une clé capable de lire l'historique des voies n'a pas nécessairement accès aux emplacements des zones. Si l'API ne fournit aucun emplacement pris en charge, utilisez le repli explicite vers un lieu proche ci-dessous. Aucun appel API n'est exécuté lors de la consultation des pages météo.

La météo privilégie un point explicite de voie, puis le point de sa falaise principale (TLC), puis le point de son secteur immédiat issu des données en cache du fournisseur. Elle ignore les géométries limitées au pays ou à des ancêtres arbitraires. Les anciens points en cache dépourvus de géométrie d'origine du fournisseur restent utilisables et portent la mention « Point en cache » ; leur précision initiale ne peut pas être retrouvée à partir de ce seul point. Les voies en salle restent exclues.

Paramètres → Importer la météo → **Vérifier les emplacements météo** liste les zones en extérieur et le nombre de voies non résolues. Pour un emplacement manquant, recherchez une ville proche à l'aide de son nom/région et d'un code pays à deux lettres, puis choisissez explicitement le bon résultat. La recherche n'envoie que ce texte saisi et ce code pays au [géocodage Open-Meteo](https://open-meteo.com/en/docs/geocoding-api), dont les données de localisation proviennent de GeoNames. Elle n'envoie ni voies, ni dates d'ascension, ni notes privées, ni clés API. Les recherches n'ont lieu qu'après soumission du formulaire, sont mises en cache pendant 30 jours, cadencées et espacées en cas d'erreur.

Une ville choisie constitue un **repli approximatif vers un lieu proche**, partagé uniquement par le même identifiant de zone du fournisseur (ou l'identité de la voie s'il n'existe pas d'identifiant de zone). Elle n'écrase pas les coordonnées des voies, ne modifie pas les cartes des voies et ne prétend pas être la localité la plus proche. Un point valide de voie, de secteur ou de falaise a toujours la priorité. La météo d'une ville peut différer de celle d'une falaise en raison de la distance, de l'altitude et du relief ; les données basées sur une ville apparaissent donc dans les vues et filtres météo, mais **ne débloquent pas les badges météo**. Vous pouvez supprimer ce repli à tout moment.

Le carnet de croix et les activités récentes affichent la source de l'emplacement météo. L'importateur, la file d'attente, le calendrier, la carte des conditions, les résumés de visite de falaise et le carnet de croix utilisent la même clé emplacement/jour résolue. Modifier ou supprimer un repli cesse immédiatement d'utiliser son ancienne clé ; l'ancienne météo reste en cache et peut toujours servir pour d'autres ascensions à cet endroit. Lancez la récupération du prochain lot météo pour remplir un nouvel emplacement choisi. L'effacement supprime les résolutions, les choix de lieux et les résultats de recherche, et annule les recherches en cours.

Lorsque ces points manquent, une géométrie GeoJSON Polygon/MultiPolygon explicitement typée sur une falaise ou un secteur identifié peut fournir directement sa première coordonnée de contour extérieur ; aucun centre ni centroïde n'est calculé. Ceci porte la mention **Polygone de zone approximative** et ne débloque ni la météo ni les badges Face au soleil d'été. Les points de voie et de falaise ont toujours la priorité. Les limites de pays ou de région, les formes malformées, les grandes zones (dépassant une diagonale englobante prudente de 15 km) et les formes traversant la ligne de changement de date sont exclues. Les tableaux de limites non typés et les formats Fence non documentés restent non pris en charge ; aucun échantillon de polygone capturé auprès du fournisseur n'est encore disponible. Une ville sélectionnée n'est utilisée que si ces solutions de repli géométriques échouent également. L'importation météo doit toujours être activée pour récupérer les jours manquants. Face au soleil d'été utilise des indices issus de tags de voie vérifiés séparément ; voir [Badges](/docs/badges).
