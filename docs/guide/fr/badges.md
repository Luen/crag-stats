# Badges

La plupart des badges célèbrent des étapes clés de votre parcours en escalade : votre première séance ou croix, le nombre total d'ascensions, les cotations et bien plus encore. Ils utilisent les dates des ascensions concernées dans votre carnet de croix. L'importation d'une ascension plus ancienne peut donc avancer la date d'une étape.

**Premiers mouvements** célèbre l'arrivée de votre carnet de croix dans Crag Stats. Sa date correspond à la première importation ou synchronisation réussie contenant au moins une ascension, et son compteur est enregistré avec cette importation. Les synchronisations ultérieures et l'importation d'ascensions plus anciennes ne modifient pas cette date. Il n'est lié à aucune ascension en particulier. L'horodatage des importations utilise le fuseau horaire d'affichage du site.

Si une base de données plus ancienne ne contient aucune date d'importation enregistrée, la prochaine importation réussie non vide la fournit. Les dates déjà enregistrées sont conservées.

L'effacement des données locales réinitialise cette étape en même temps que le carnet de croix ; la prochaine importation réussie non vide en déclenche une nouvelle.

## Ordre

Les badges obtenus sont classés selon l'ascension qui les a débloqués, du plus récent au plus ancien. La carte du tableau de bord affiche les huit derniers. Les badges obtenus le même jour conservent leur ordre dans la galerie. Premiers mouvements et les estimations d'ascensions de la communauté ne sont liés à aucune ascension ; ils apparaissent donc après tous les badges datés par une ascension.

## Types d'ascensions comptabilisés

Le paramètre **Types d'ascensions comptabilisés** dans Paramètres → Affichage et visibilité détermine quelles ascensions enregistrées sont prises en compte par chaque badge. Consultez [Types d'ascensions](/docs/tick-types) pour en savoir plus sur ce paramètre.

- Les types d'ascensions définis sur **Projets et objectifs uniquement** sont exclus des ascensions principales et des totaux du tableau de bord, mais ils permettent tout de même d'obtenir des badges : **La persévérance paie**, les séries de jours consécutifs, **Journée en grande voie**, **Semaine itinérante**, les paliers de dénivelé et les autres badges d'activité continuent tous de les comptabiliser. Les paliers de dénivelé continuent ainsi de progresser grâce aux essais dans vos projets, même si vos totaux d'ascensions restent épurés.
- Les types d'ascensions définis sur **Masquer** ne rapportent rien : ces ascensions sont exclues des badges ainsi que de toutes les autres analyses.

Cette distinction est volontaire. Les totaux principaux filtrent ce que vous enchaînez, tandis que les badges reflètent ce que vous avez accompli : un essai dans un projet reste une journée sur le rocher et compte toujours pour les badges qui célèbrent cela. Si un badge attendu n'apparaît pas, vérifiez si son type d'ascension est masqué plutôt que simplement exclu des totaux.

## Dénivelé grimpé

Les badges de dénivelé comptabilisent la hauteur totale de vos ascensions enregistrées : 1, 5, 10, 20, 50, 100 et 150 km. Chacun est daté par l'ascension qui fait passer votre cumul au-delà du seuil. **Journée de 250 m** additionne quant à lui la hauteur grimpée sur une seule journée civile.

Les seuils des badges sont définis en unités métriques et ne changent jamais avec le réglage des unités d'affichage. Seul le libellé est converti : lorsque les unités impériales sont sélectionnées, **1 km grimpé** s'affiche en miles et **Journée de 250 m** s'affiche en pieds. Les mêmes ascensions débloquent exactement les mêmes badges quel que soit le système d'unités. Voir [Paramètres d'affichage](/docs/display-settings).

## Météo

**Vague de chaleur**, **Image congelée**, **Pause pluie**, **Escalade sous la neige**, **Emporté par le vent**, **Grand beau**, **Moite**, **Croix de tempête** et **Quatre saisons** nécessitent le cache météo extérieur optionnel (`WEATHER_IMPORT`). Voir [Météo](/docs/weather). Tant que ces journées n'ont pas été récupérées, ces badges restent verrouillés. **Croix de tempête** exige une réussite lors d'une journée de fortes pluies ; les simples essais ne comptent pas.

## Presque atteint

Sur la page complète **[Badges](/badges)**, la section **Presque atteint** répertorie jusqu'à trois badges verrouillés les plus proches d'être débloqués. Seuls les seuils **quantifiables** sont éligibles (nombre total d'ascensions, dénivelé, croix par tranche de cotation, premières ascensions FA/FFA, voies ouvertes, etc.). Les badges ponctuels tels que les jours fériés, les journées météo ou Premiers mouvements en sont exclus. La progression est classée selon le pourcentage de l'objectif atteint (plafonné sous les 100 % tant que le badge n'est pas obtenu), puis par objectif le plus petit en cas d'égalité. La carte des badges du tableau de bord continue de n'afficher que les badges obtenus récemment.

## Partenaires, grandes voies et déplacements

Ces quatre badges utilisent des champs déjà présents dans votre carnet de croix et sont datés par l'ascension qui les complète :

| Badge                      | Règle                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Relais encombré**        | Une ascension mentionne 3 partenaires différents ou plus (la comparaison des noms ne tient pas compte de la casse).                                                                                                                                                                                                                                                       |
| **Journée en grande voie** | Vous enchaînez 3 longueurs ou plus au cours d'une même journée civile : les plages et listes de longueurs sont développées et dédupliquées par voie et par jour. Les saisies de voie complète et de longueurs individuelles ne sont pas comptées en double. Lorsqu'il existe des saisies de longueurs issues du cache de l'API, seules les longueurs enchaînées comptent. |
| **Semaine itinérante**     | Vous enregistrez des ascensions sur 4 falaises extérieures différentes sur une période de 7 jours consécutifs. Les salles d'escalade et les sites inconnus ne comptent pas.                                                                                                                                                                                               |
| **La persévérance paie**   | Vous enchaînez une voie pour la première fois après l'avoir enregistrée sur 4 jours différents ou plus (essais compris). Répéter une voie déjà enchaînée ne compte pas.                                                                                                                                                                                                   |

Il s'agit de badges ponctuels ; ils n'apparaissent donc pas dans **Presque atteint**.

## Répétitions et nouvelles voies

Ces badges partagent les règles de la carte [Répétitions vs nouvelles voies](/docs/repeats). Les voies sont identifiées par leur identifiant de voie theCrag, les essais comptent, et chaque badge est daté par l'ascension qui le complète.

| Badge                       | Règle                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Explorateur**             | Ascensions enregistrées sur 50 voies différentes.                                                                                                       |
| **Baroudeur**               | Ascensions enregistrées sur 100 voies différentes.                                                                                                      |
| **Collectionneur de voies** | Ascensions enregistrées sur 250 voies différentes.                                                                                                      |
| **Explorateur de topos**    | Ascensions enregistrées sur 500 voies différentes.                                                                                                      |
| **Fidèle habitude**         | Une même voie grimpée lors de 10 jours différents. Plusieurs ascensions le même jour ne comptent qu'une fois.                                           |
| **Terrain connu**           | 25 répétitions (tout jour postérieur au premier jour enregistré pour une voie) sur des voies d'une même falaise. Les premières visites ne comptent pas. |

Tous les six sont quantifiables et peuvent donc apparaître dans **Presque atteint**.

## Face au soleil d'été

Enregistrez une ascension en extérieur sur une voie orientée vers l'équateur pendant l'été météorologique local : N/NE/NO de décembre à février dans l'hémisphère sud, ou S/SE/SO de juin à août dans l'hémisphère nord. Cette version prudente couvre les latitudes absolues de 25° jusqu'à 60° (exclu). Les essais comptent comme des ascensions enregistrées, tout comme pour les badges liés aux journées météo. Le badge se débloque une seule fois à la première date éligible et ne possède pas de compteur dans Presque atteint.

Utilisez d'abord les tags d'ensoleillement et d'orientation propres à la voie. Lorsqu'elle n'a pas de tags d'exposition propres, les tags hérités de son **parent immédiat** (par exemple son secteur, sa falaise ou son bloc) peuvent prendre le relais. L'identifiant source du tag en cache doit correspondre exactement à ce parent. Les tags provenant de niveaux supérieurs, de sources inconnues ou de zones géographiques larges ne sont jamais utilisés. Les tags d'exposition propres à la voie ont la priorité même si le parent indique autre chose ; les orientations inconnues ou contradictoires au niveau de la voie ne déclenchent pas de repli sur le parent.

Au niveau retenu, **Soleil toute la journée** peut rendre la voie éligible sans indication d'orientation. **Toujours à l'ombre** empêche l'obtention du badge. Dans les autres cas, l'orientation doit faire face à l'équateur comme décrit ci-dessus ; les tags d'ensoleillement limités au matin, au midi ou à l'après-midi ne suffisent pas à eux seuls. Il n'est pas nécessaire de disposer à la fois des tags d'ensoleillement et d'orientation.

Les ascensions en salle, les dates invalides, les sites tropicaux ou de haute latitude, les anciens points de précision inconnue et les approximations à la ville voisine ne sont pas éligibles. Les mises à niveau des données en cache récupèrent la provenance de la voie, du parent et des niveaux supérieurs sans nouvelle synchronisation ni requête externe.

Cela enregistre l'exposition décrite par le fournisseur associée à une heuristique saisonnière. Cela ne détermine ni l'heure de votre ascension, ni l'ensoleillement réel, ni l'ombre des dévers ou la température du rocher, et ne nécessite aucun cache Open-Meteo. Le badge de chaleur distinct s'appuie sur les températures de l'air élevées en cache. Des jeux de données minimisés de tags réels issus de l'API ainsi que leur provenance sont documentés dans le dépôt.

## Greenpoint

**Greenpoint** est un badge ponctuel récompensant l’enchaînement en tête d’une voie sportive équipée, en utilisant uniquement vos propres protections amovibles. Il se débloque la première fois que vous :

- enregistrez sur theCrag une coche **Green point**, **Green point onsight** ou **Green point flash** comptant comme une réussite, ou
- enchaînez une voie classée **Sport** avec une ascension enregistrée en **Trad**, au moyen d’une croix en tête sans repos sur corde ni chute (à vue, flash, après travail, pink point, après travail depuis le sol ou en tête).

Les saisies génériques Coche/Réussite/Enchaînement, les essais, la moulinette et la grimpe en second ne comptent pas pour ce second cas, car ils ne démontrent pas que vous avez grimpé en tête sur coinceurs. Comme les badges ci-dessus, il n'apparaît pas dans **Presque atteint**. Consultez les [types de coches](https://www.thecrag.com/en/article/ticktypes) de theCrag pour connaître la définition des coches Green point.

## Premières ascensions en solo auto-assuré

**Premier solo en tête auto-assuré** se débloque lors de votre première ascension réussie explicitement enregistrée comme Solo en tête. **Premier solo moulinette auto-assuré** se débloque séparément lors de votre première ascension réussie en Solo auto-assuré / Solo en moulinette. Chacun pointe vers l'ascension éligible la plus ancienne, en utilisant l'identifiant d'ascension pour départager les ex aequo du même jour, et aucun n'apparaît dans Presque atteint.

La classification correspond à celle de la carte Escalade en solo. L'[API du fournisseur](https://www.thecrag.com/en/article/api) documente `leadsolo` et `ropedsolo` ; les libellés d'affichage ainsi que leurs variantes de casse, d'espacement et de séparateurs sont reconnus sans modifier le texte d'origine de la coche. Une mise à niveau des données en cache ne corrige les anciens indicateurs de réussite que lorsque les données brutes du fournisseur stockées confirment la même méthode explicite de solo. La discipline de la voie et le style d'ascension restent distincts.

Les essais, les ascensions avec repos sur corde, les réchappes, les solos intégraux, le psicobloc, les solos artificiels, les ascensions ordinaires en moulinette et les entrées dont la réussite est inconnue ne sont pas éligibles. Une ascension explicitement enregistrée comme Bloc ou Second contredit également l'une ou l'autre méthode de solo auto-assuré et ne peut pas débloquer ces badges. L'absence de partenaire renseigné ne suffit pas à elle seule à établir une ascension en solo. Ces étapes s'appliquent aux ascensions en salle comme en extérieur et ne nécessitent ni coordonnées ni importation météo.

## Séries de jours consécutifs

**Série de 7 jours**, **Série de 10 jours** et **Série de 30 jours** célèbrent l'enregistrement d'au moins une ascension chaque jour civil consécutif. Les essais comptent, et les ascensions en salle comme en extérieur sont prises en compte, conformément à la carte Séries. Plusieurs ascensions le même jour ne comptent qu'une fois ; les dates manquantes ou invalides ne permettent pas de valider une journée. Ce sont les dates d'ascension, et non les heures de saisie, qui déterminent la série, sans décaler les dates écrites entre fuseaux horaires.

Chaque badge est daté au premier jour où son seuil a été atteint. Faire une pause n'efface pas une étape déjà acquise dans votre historique enregistré. Ce sont des récompenses ponctuelles et elles n'apparaissent pas dans Presque atteint.

## Vos partenaires d'ascension

Les badges obtenus associés à une ascension éligible affichent les compagnons de cordée enregistrés pour celle-ci. La mention « Partenaires sur cette ascension » désigne uniquement l'ascension liée, y compris pour les badges obtenus sur plusieurs longueurs, jours ou voies. Il ne s'agit pas d'une liste de toutes les personnes ayant contribué à l'ensemble de l'accomplissement. L'absence de noms ne signifie pas qu'il s'agit d'une ascension en solo.
