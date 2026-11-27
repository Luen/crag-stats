# Charge d'entraînement

La carte **Charge d'entraînement** (ainsi que la page dédiée [`/training-load`](/training-load)) estime l'intensité de votre grimpe récente par rapport à ce à quoi votre corps est habitué. C'est lors d'une augmentation rapide que les blessures aux doigts et aux épaules surviennent le plus souvent. La carte du tableau de bord résume les 12 dernières semaines ; la page affiche 26 semaines ainsi qu'une frise de charge quotidienne sur 28 jours.

## 1. Charge par ascension

Chaque ascension reçoit un score de charge :

> **charge = 10 × intensité × facteur de style**

L'**intensité** compare la cotation de l'ascension à votre **enchaînement le plus dur des 12 derniers mois** dans la même discipline. Les voies sont comparées sur l'échelle Ewbank et les blocs sur l'échelle V.

| Cotation par rapport à votre max sur 12 mois                          | Intensité   |
| --------------------------------------------------------------------- | ----------- |
| À votre max                                                           | 1,0         |
| 2 cotations Ewbank (1 cotation V) en dessous                          | 0,5         |
| 4 cotations Ewbank (2 cotations V) en dessous                         | 0,25        |
| Au-dessus de votre max (un nouveau record)                            | jusqu’à 1,5 |
| Travail d'une voie non cotée ou d'un Projet theCrag (voir ci-dessous) | 1,0         |
| Enchaînement non coté, ou aucun enchaînement sur 12 mois              | 0,3         |

Grimper près de votre limite compte beaucoup plus que d'accumuler du volume bien en dessous. Une journée de dix voies faciles et une journée passée sur un seul projet peuvent donner un score similaire.

**Projets non cotés et marqués :** une tentative, un essai avec pauses ou toute autre croix non enchaînée sur une voie **sans cotation**, ou sur une voie marquée par theCrag avec l'indicateur **Project** (issu de l'importation optionnelle des infos de voie), est considéré comme une grimpe **à votre max**. Les voies non cotées que vous continuez à travailler sont généralement de nouvelles lignes près de votre limite ; l'indicateur confirme ce cas lorsque nous l'avons. Ces mêmes tentatives comptent également dans la part proche de votre limite. Si vous avez vous-même attribué une cotation à la croix sur theCrag, c'est cette cotation qui est utilisée. Un _enchaînement_ non coté reste considéré comme léger (0,3), car une voie facile sans nom ne doit pas ressembler à une journée à la limite.

**Facteur de style :** un enchaînement en tête vaut 1,0. Les tentatives et les essais avec repos sur corde valent 0,8, car travailler une voie demande tout de même un réel effort. La moulinette ou la grimpe en second applique un facteur supplémentaire de 0,8×.

## 2. Fatigue et forme

Les charges quotidiennes sont moyennées de deux manières, toutes deux pondérées vers les jours récents :

- **Fatigue (aiguë) :** une moyenne pondérée exponentiellement sur 7 jours.
- **Forme (chronique) :** une moyenne pondérée exponentiellement sur 28 jours.

## 3. Ratio aigu : chronique

**ratio = fatigue ÷ forme**

| Ratio     | Statut           | Signification                                                       |
| --------- | ---------------- | ------------------------------------------------------------------- |
| —         | Au repos         | Rien d'enregistré récemment                                         |
| < 0,8     | Sous l'habituel  | Plus léger que d'habitude : frais, en affûtage ou en perte de forme |
| 0,8 – 1,3 | Zone optimale    | En phase avec ce à quoi vous êtes habitué                           |
| 1,3 – 1,5 | Montée en charge | Vous grimpez plus que d'habitude ; surveillez la récupération       |
| > 1,5     | Pic              | Un grand bond ; la zone la plus associée aux blessures de surcharge |

Ces plages proviennent du ratio de charge aiguë:chronique utilisé en sciences du sport et en entraînement d'escalade. Prenez-les comme un indicateur, pas comme un diagnostic.

## Également sur la carte / page

- **Charge hebdomadaire :** la charge totale pour chaque semaine (12 sur la carte, 26 sur la page). La semaine en cours correspond à la barre mise en évidence.
- **Charge quotidienne (page) :** les 28 derniers jours de charge pondérée par l'intensité, jours de repos inclus.
- **Enchaînements proches du max · 28 j :** enchaînements des 28 derniers jours situés à 2 cotations Ewbank au plus (1 cotation V) de votre max sur 12 mois.
- **Part proche du max :** le pourcentage des ascensions cotées des 28 derniers jours qui étaient proches de votre limite. Une part élevée sur plusieurs semaines signifie beaucoup de grimpe à la limite ; envisagez des semaines de décharge.
- **7 / 28 derniers jours :** ascensions, enchaînements, jours actifs et de repos, dénivelé grimpé et taux d'enchaînement.

## Mises en garde

- **Seul ce que vous enregistrez compte.** Les séances en salle, la poutre et tout autre entraînement non enregistré sont invisibles.
- **Les cotations sont approximatives**, et une voie généreuse ou sèche fausse l'intensité.
- **Le ratio nécessite un historique.** Avec moins de quelques semaines de données, la « forme » est basse et le ratio fluctue fortement.

Pour les voies marquées Project, une cotation personnelle doit provenir de l'ascension ou d'une longueur grimpée (ou du champ CSV Ascent Grade). Une cotation effective copiée depuis la voie n'est qu'une solution de repli et ne désactive donc pas l'hypothèse du Project à votre max.
