# Types de croix

Un **type de croix** indique _comment_ vous avez grimpé une voie ou un bloc, et pas seulement si vous avez atteint le sommet. Une croix à vue a plus de valeur qu'un enchaînement après travail dans la même voie. C'est pourquoi theCrag (et Crag Stats) les distinguent.

Dans les tableaux ci-dessous, **Enchaînement** signifie que Crag Stats comptabilise la croix comme une ascension réussie (sans chute ni repos), par exemple dans les « ascensions réussies », les taux de réussite et les pyramides. **Essai** signifie que la tentative est enregistrée comme un essai : elle apparaît en gris dans les graphiques, compte toujours dans le volume d'escalade et peut marquer une voie comme projet.

<!-- component:tick-types -->

## Comment les croix sont utilisées ici

- **Les pyramides et les graphiques** attribuent une couleur fixe à chaque type de croix : à vue en vert, flash en jaune, après travail en rouge, pink point en rose, enchaînements et ascensions sans chute ni repos en bleu, et essais en gris.
- Le **CPR** applique un décalage de cotation à chaque croix (un à vue compte comme plus dur qu'un après travail) ; voir [CPR](/docs/cpr).
- Les **projets** sont des voies comportant des essais mais pas encore d'enchaînement. Une voie réussie au premier essai (à vue ou flash) n'est jamais un projet.
- La **charge d'entraînement** comptabilise les essais à 0,8× d'un enchaînement, car travailler une voie reste un effort intense ; voir [Charge d'entraînement](/docs/training-load).

## Types de croix comptabilisés dans les analyses

Sur theCrag, les essais sans enchaînement (tels que `Working`, `Attempt`, `Hang dog` ou `Retreat`) sont enregistrés comme des ascensions. Si vous enregistrez de nombreux essais de travail sur vos projets, le fait de comptabiliser chaque essai dans les totaux du tableau de bord peut fausser votre nombre total d'ascensions, la répartition des styles et votre profil de grimpeur.

Dans **Paramètres → Affichage et visibilité → Types de croix comptabilisés**, vous pouvez configurer la manière dont chaque type de croix est traité dans Crag Stats :

- **Activer (Comptabiliser partout) :** Inclus dans les ascensions principales, la répartition par discipline, les falaises et secteurs, les pyramides, les totaux de la carte, les nombres d'Eddington, les répétitions de voies, les axes du profil de grimpeur, les cartes thermiques d'activité, la charge d'entraînement, les badges, les projets et les objectifs.
- **Projets et objectifs uniquement (Hors totaux) :** Exclus des ascensions principales, de la répartition par discipline, des falaises, des secteurs, des pyramides, des totaux de la carte, des nombres d'Eddington, des répétitions de voies et des axes du profil de grimpeur, mais toujours pris en compte pour la détection des projets, l'activité des séances (carte thermique, séries, séances par semaine et graphiques par jour de la semaine), la fatigue liée à la charge d'entraînement, les badges et les objectifs de cotation.
- **Masquer (Exclure complètement) :** Exclus de toutes les analyses, ainsi que des projets, objectifs et badges.

Le carnet de croix conserve et affiche toujours toutes vos ascensions enregistrées avec un filtrage complet, quel que soit ce réglage. Pour savoir quels badges dépendent de chaque choix, consultez [Badges](/docs/badges).

Lorsqu'un type de croix configuré exclut certaines de vos ascensions enregistrées, le tableau de bord recalcule également les chiffres du profil provenant habituellement de theCrag (ascensions en extérieur et en intérieur, voies cochées, hauteur totale et profil de grimpeur) à partir de vos ascensions comptabilisées, afin que chaque total sur la page corresponde au même ensemble de croix. Réinitialisez la configuration avec le préréglage **Toutes les croix enregistrées** pour revenir aux totaux propres à theCrag.

## Source

Les définitions sont paraphrasées à partir de l'article [Tick types](https://www.thecrag.com/en/article/ticktypes) de theCrag. Tous les types de croix ne s'appliquent pas à tous les styles d'équipement.
