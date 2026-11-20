# Projets

Crag Stats répertorie les voies en extérieur comme **projets en cours** après des essais non enchaînés sur **au moins deux jours d'escalade distincts** dans le carnet de croix. Plusieurs essais effectués au cours d'une seule journée ne créent pas de projet en cours. Les projets en cours disparaissent après un an sans activité.

Un **projet abouti** est une voie enchaînée après avoir été travaillée sur au moins deux jours, ou après **au moins deux essais infructueux le jour de l'enchaînement** (trois essais ou plus en comptant l'enchaînement). Les essais peuvent être saisis comme des entrées distinctes ou enregistrés dans le nombre d'essais de l'enchaînement. Les entrées distinctes et le compteur d'essais de l'enchaînement ne sont pas additionnés, afin d'éviter de compter les mêmes essais deux fois. Les enchaînements au premier essai ainsi qu'un seul essai manqué suivi d'un enchaînement le même jour ne constituent pas des projets. Seul le travail antérieur au premier enchaînement est pris en compte ; les répétitions ultérieures ne transforment pas un enchaînement antérieur en projet. Les dates manquantes ou invalides ne créent pas de séances. Les projets aboutis apparaissent dans la section **Enchaînements récents** pendant les six derniers mois civils.

Lorsqu'un essai et le premier enchaînement comportent tous deux un horodatage, les essais postérieurs à cet enchaînement sont exclus de la classification. Les entrées ne comportant qu'une date le jour de l'enchaînement sont considérées comme du travail y menant, car leur ordre chronologique dans la journée est inconnu. Plusieurs enchaînements à égalité sur une même date sans heure exploitable utilisent leur ordre d'enregistrement des ascensions, de sorte qu'une répétition ultérieure ne remplace pas le premier enchaînement enregistré. Les totaux de séances sur les cartes et le tableau de bord utilisent les mêmes jours civils valides que l'algorithme de classification.

**Enchaînements récents** couvre les six derniers mois civils en UTC, y compris le jour limite pour les enchaînements sans heure. En fin de mois, la limite s'ajuste au dernier jour valide (le 31 octobre remonte au 30 avril). Les dates futures sont exclues. Les enchaînements horodatés conservent l'heure de référence à la limite. Le tableau de bord utilise la même fenêtre temporelle lorsqu'il remplit les emplacements de projets disponibles avec des enchaînements récents.

## Choisir vos propres projets

Le propriétaire voit des pastilles de projet compactes à côté des contrôles FA/FFA dans le carnet de croix ainsi que sur les cartes et fiches de projet :

- **Marquer comme projet** sélectionne une voie en extérieur enregistrée même après une seule séance ou un an sans activité.
- **Pas un projet** / **Retirer des projets** la retire de Projets, du tableau de bord et du compteur de projets actifs jusqu'à ce que le propriétaire la marque de nouveau ou rétablisse la détection automatique.
- **Mode automatique** supprime le choix manuel et rétablit les règles ci-dessus.

Chaque pastille enregistre directement la modification. Les pastilles du carnet de croix vous laissent sur la même page filtrée ; celles des cartes et fiches de projet ramènent à la liste des projets. L'étiquette Projet / Pas un projet indique un choix manuel sans dépendre uniquement de la couleur.

Ces sélections sont des métadonnées locales qui survivent aux synchronisations, aux reconstructions du cache et même à la suppression puis au retour ultérieur d'une voie en amont. Elles ne modifient ni le carnet de croix de theCrag ni son marqueur public Projet. Seul un véritable enchaînement enregistré fait passer un projet sélectionné à l'état enchaîné. Les enchaînements sélectionnés en dehors de la fenêtre des six mois apparaissent sous **Enchaînements sélectionnés antérieurs** au lieu d'Enchaînements récents. Paramètres → Effacer supprime les sélections. Les visiteurs peuvent consulter les projets qui en résultent, mais ne peuvent pas modifier ces choix. Les voies en salle et les voies non enregistrées ne peuvent pas être ajoutées manuellement.

## Détails du projet, progression et estimations

Cliquez sur le nom d'un projet depuis la page Projets ou le tableau de bord pour ouvrir sa page de détail. Elle affiche la voie, les extraits publics du topo lorsqu'ils sont en cache, la progression datée par séance ainsi que les essais et enchaînements précédents (y compris les libellés des longueurs gravies). Le lien en bas de page ouvre toutes les entrées du carnet de croix pour cette voie exacte, y compris les répétitions plus anciennes. Les notes d'ascension privées restent dans le carnet de croix selon le paramètre existant de visibilité réservée au propriétaire.

La barre de **préparation approximative** suit l'approche de préparation des objectifs : elle mesure les indices de soutien disponibles, et non un pourcentage d'une cotation ni la probabilité d'enchaîner. Seul un enchaînement enregistré sur cette voie remplit complètement la barre. Une autre voie de la même cotation ne le peut pas. Les séances antérieures n'utilisent que les données disponibles à cette date d'escalade, afin qu'un enchaînement ultérieur ne réécrive pas leur niveau de préparation.

Pour chaque jour de référence, le modèle utilise les 365 jours précédents (ce jour inclus) d'enchaînements en extérieur dans la même discipline et la même échelle de cotation, en utilisant les cotations effectives gravies. Les comptages de la pyramide de soutien utilisent des voies distinctes ; les répétitions ne remplissent pas la pyramide une seconde fois. La voie cible est exclue des indices de soutien.

- Meilleur enchaînement récent au niveau de la cible ou au-dessus : 60 points ; un cran en dessous : 35 ; deux crans en dessous : 10 ; sinon zéro.
- Deux voies distinctes un cran en dessous ajoutent jusqu'à 20 points, et quatre voies deux crans en dessous ajoutent jusqu'à 25 points.
- Les essais infructueux sur la cible ajoutent jusqu'à 15 points, par rapport à un seuil indicatif de 15, 35 ou 75 essais. L'horizon est **Court terme** lorsque l'écart avec votre meilleur enchaînement récent est d'au plus un cran, **Moyen terme** pour deux crans, sinon **Long terme** (également lorsqu'aucun enchaînement récent n'est connu).
- Le modèle de base est plafonné à 94 %, puis gagne un point par jour d'escalade valide supplémentaire sur cette voie (le premier jour établit la référence), jusqu'à 99 % tant que ce projet n'a pas d'enchaînement enregistré. Les cotations inconnues ne donnent lieu à aucune estimation. Les cotations en échelle V égales à zéro ou négatives sont prises en charge et ne sont jamais mélangées avec les cotations de voies.

La pratique peut faire monter cette barre sans prouver qu'un mouvement particulier est résolu. Les cotations et les efforts enregistrés ne peuvent révéler ni les méthodes, ni les conditions, ni les blessures, ni la confiance ; il s’agit donc d’une heuristique explicable, et non d’un modèle scientifiquement validé.

**Travail restant estimé** compare votre historique de projets en extérieur aboutis dans la même discipline et la même échelle, à un cran numérique de cotation près. Les enchaînements au premier essai n'entrent pas dans cette cohorte ; les enchaînements partiels de longueurs inférieurs à la cotation de la voie ne remplacent pas les enchaînements complets de la voie. Pour chaque indicateur séparément, au moins trois projets aboutis doivent avoir nécessité plus de séances ou d'essais que vous n'en avez enregistrés jusqu'ici. La fourchette affichée correspond à la moitié centrale (du 25e au 75e centile, en utilisant les rangs observés encadrants) de ces totaux moins votre travail enregistré ; les essais restants incluent l'enchaînement final. Lorsque vous dépassez cet historique ou qu'il y a trop peu de comparaisons, l'estimation n'est pas affichée plutôt que d'inventer une échéance. Les cohortes incluent toutes les années enregistrées, tandis que la préparation utilise les enchaînements récents.

Ces estimations décrivent uniquement les projets aboutis : les projets non enchaînés et les essais non enregistrés en sont absents, et le niveau évolue avec le temps. Il s'agit de comparaisons personnelles approximatives, et non d'un effort restant garanti. Les totaux de séances comptent les jours civils valides saisis. Les dates manquantes, invalides et futures figurent dans l'historique mais sont exclues de la progression et des estimations. Les compteurs d'essais sur les entrées d'enchaînement incluent l'essai réussi et peuvent recouper les entrées d'échec distinctes ; les résumés utilisent le total d'échecs le plus élevé au lieu d'additionner les deux. Une répétition ultérieure reste visible sans modifier quel enchaînement a le premier fait aboutir le projet.

## Nouvelle voie ?

Lorsqu'un projet n'a **aucune cotation** sur theCrag (ou porte littéralement la cotation « Project » / « Proj »), les cartes affichent un badge **Nouvelle voie ?** — généralement une nouvelle ligne que vous équipez ou travaillez encore. Le même badge apparaît également pour les **fourchettes provisoires larges** telles que `21-23` ou `V1-3`, qui signifient souvent que la cotation est encore en cours d'affinage. Les demi-cotations adjacentes comme `V1/2` restent des cotations publiées ordinaires et ne reçoivent pas ce badge. La pastille de cotation continue d'afficher la valeur médiane analysée lorsqu'elle existe ; seul le badge change. Un marqueur explicite **Project** sur theCrag (issu de l'import des informations de voie) affiche à la place le badge Projet distinct.

## Texte du topo sur les cartes de projet

Lorsque l'**import des données de voies** a mis en cache des données publiques de topo pour une voie, les cartes de projet peuvent afficher :

- Un court extrait de **description**
- Un avertissement d'**accès** lorsque le topo signale des restrictions d'accès (par exemple des falaises fermées ou tolérées)

Ce texte provient des pages de voies publiques de theCrag (champs `beta` tels que Description et Problèmes d'accès). Il ne s'agit **pas** de vos notes privées du carnet de croix.

### Confidentialité

- Les **notes d'ascension privées** (`ascents.comment`) restent séparées. Elles n'apparaissent dans le carnet de croix que si vous activez l'option dans Paramètres, et jamais sur les cartes de projet ni dans les statistiques du tableau de bord.
- Les **informations du topo** sont du contenu communautaire public. Crag Stats stocke de courts extraits dans `routes.beta_json` lors du même import facultatif des voies que l'historique des FA, sans jamais les mélanger avec vos notes.

### Licences et attribution

theCrag : le contenu des topos peut être publié sous une licence telle que [Creative Commons BY-SA](https://creativecommons.org/licenses/by-sa/4.0/). Les pages de voies mentionnent souvent les contributeurs (par exemple les clubs locaux). Crag Stats n'affiche que de **courts extraits**, renvoie vers la **page de la voie sur theCrag** et indique la source (CC BY-SA). Pour la description complète, l'éthique, l'approche et l'état actuel des accès, utilisez le lien figurant sur la carte.

L'import des voies est **désactivé par défaut** (`ROUTE_DATA_IMPORT`). Définissez `ROUTE_DATA_IMPORT=true` sur le serveur et redémarrez si vous souhaitez obtenir les extraits de topo et les indications automatiques de FA ; consultez [Premières ascensions](/docs/first-ascents) pour les limites de confidentialité et de cadence.
