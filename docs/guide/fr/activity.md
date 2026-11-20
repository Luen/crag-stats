# Activité

Les cartes **Statistiques mensuelles** et **Statistiques annuelles** du tableau de bord résument votre volume en un coup d'œil. **Activité** (`/activity`) est la page détaillée lorsque vous souhaitez aller au-delà des graphiques : un tableau mensuel complet (ascensions, enchaînements, hauteur, répartition des styles) et le comparatif annuel d’une année sur l’autre.

## Ce qui est comptabilisé

- **Ascensions** — chaque croix ou essai enregistré ce jour/mois/cette année (tentatives incluses).
- **Enchaînements** — les croix classées comme des réussites (voir [Types de croix](/docs/tick-types)).
- **Hauteur** — mètres issus de la hauteur de l'ascension ou de la voie lorsqu'elle est renseignée.
- **Styles** — Sport / Trad / Bloc selon le style d'équipement ; tout le reste est regroupé dans **Autre** dans le tableau.

Les liens des mois ouvrent le carnet de croix pour le mois calendaire correspondant. Les liens des années (sur la carte ou le tableau annuel) ouvrent `/logbook?year=`.

## Pourquoi une page distincte

Répéter uniquement les deux mêmes graphiques encombrerait inutilement la barre latérale. La page Activité justifie sa propre route en proposant le **tableau de répartition mensuelle** et en gardant les écarts d'une année sur l'autre faciles à parcourir — le niveau d'exigence fixé pour aller au-delà de simples cartes succinctes.

## Séries

La carte Séries affiche vos séries actuelles en jours, semaines et mois à côté de votre
**plus longue** série de jours de tous les temps (quatre tuiles de mesures). Les dates de début et de fin de votre plus longue série
s'affichent sous les tuiles. En cas d'égalité entre plusieurs records de même durée, la période la plus ancienne est affichée.
Une seule journée d'escalade n'affiche qu'une seule date ; un historique vide n'affiche aucune date de record.

Le pied de carte indique également votre dernier jour d'escalade, le nombre de jours entiers écoulés
depuis lors lorsque la série de jours en cours est interrompue, ainsi que le total de vos **jours actifs**
(jours d'escalade distincts). Les jours proviennent des dates d'ascension valides enregistrées ; les essais et
les réalisations, en salle comme en extérieur, comptent de la même façon, et plusieurs ascensions le même jour ne comptent
qu'une seule fois. Consultez [Badges](/docs/badges) pour les paliers de 7, 10 et 30 jours.

La série de jours actuelle se termine aujourd'hui, ou hier tant que vous n'avez pas encore grimpé aujourd'hui.
Les comparaisons de jours calendaires utilisent UTC, de sorte que le fuseau horaire du serveur et les changements d'heure
ne puissent pas décaler une journée enregistrée. Les entrées datées dans le futur ne prolongent pas la série en cours.

Les séries de semaines et de mois en cours suivent la même règle de tolérance : comptent les périodes
consécutives se terminant dans la période en cours, ou dans celle qui la précède immédiatement s'il
n'y a pas encore eu d'ascension durant cette période. Après une semaine ou un mois entier sans escalade, ce compteur
retombe à zéro. Les semaines commencent le lundi et les limites calendaires utilisent le temps UTC, y compris lors du passage
de la semaine ISO 53 à la nouvelle année. Les entrées datées dans le futur ne sont pas prises en compte dans ces compteurs.

## Activités récentes

Le tableau de bord affiche le **jour d'escalade** le plus récent en premier. Au sein d'une même journée, l'ascension la plus
récemment **enregistrée** apparaît en premier, d'après l'horodatage de création fourni par la plateforme source.
La date affichée reste la date d'escalade : enregistrer aujourd'hui une ascension plus ancienne ne
la place pas au-dessus des ascensions d'un jour d'escalade ultérieur. L'ordre d'enregistrement sert d'approximation pour
l'ordre d'ascension lorsque vous saisissez vos voies ou blocs à la suite, et non d'heure d'ascension enregistrée.

Les entrées dont l'heure d'enregistrement est manquante ou invalide suivent celles horodatées du même jour.
En cas d'heures d'enregistrement identiques ou indisponibles, l'identifiant d'ascension stocké est utilisé, du plus récent au plus ancien, pour garder un
ordre stable. Les horodatages de modification ou de synchronisation ne sont pas utilisés comme heures de création.

Les activités récentes affichent également les mêmes badges de style d'escalade que le carnet de croix : la discipline de la voie, un style de protection différent enregistré lors de l'ascension le cas échéant, ainsi que les variantes en solo explicites comme Solo en tête ou Solo en moulinette. L'absence de partenaire renseigné n'implique jamais un solo.
