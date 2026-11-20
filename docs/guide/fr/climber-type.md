# Type de grimpeur

Le tableau de bord vous attribue un **type de grimpeur**, comme _Grimpeur sportif_ ou _Grimpeur sur rocher_. Il s'affiche en haut du tableau de bord et dans la carte « Type de grimpeur ».

## Comment il est déterminé

1. **theCrag d'abord, tant que chaque type de croix est comptabilisé.** Si un type de grimpeur est défini sur votre compte theCrag (synchronisé via l'API), Crag Stats l'utilise tel quel. Dès que vous définissez un type de croix sur _Projets et objectifs uniquement_ ou _Masquer_ dans les Paramètres, l'intitulé est recalculé à partir de vos ascensions comptabilisées, évitant ainsi que les montées de travail dans vos projets ne vous maintiennent dans la mauvaise discipline.
2. **Sinon, à partir de votre carnet de croix.** Chaque ascension comptabilisée est attribuée à sa discipline (style d'équipement) : Sport, Trad, Bloc, Moulinette, Alpinisme, Artif, Deep-water solo, etc. Par défaut, les essais comptent également, mais vous pouvez configurer les [types de croix comptabilisés](/docs/tick-types) dans les Paramètres pour éviter que les essais de travail (comme travailler des blocs) ne faussent votre type de grimpeur.
3. **La règle des 40 %.** Si une seule discipline représente **au moins 40 %** de l'ensemble de vos ascensions comptabilisées, _et_ que cette discipline est **Sport, Trad ou Bloc**, vous êtes « Grimpeur sportif », « Grimpeur trad » ou « Bloqueur ».
4. **Dans tous les autres cas**, vous êtes un **Grimpeur sur rocher**. Cela concerne les situations où aucune discipline n'atteint 40 %, ou lorsque la part la plus importante revient à une pratique comme la moulinette.

La barre colorée sur la carte affiche la part de chaque discipline, avec les mêmes couleurs que partout ailleurs : bleu pour le sport, orange pour le trad et rouge pour le bloc.

## Pourquoi 40 % ?

La plupart des grimpeurs varient les disciplines. Un seuil nettement inférieur à 50 % permet de refléter une nette préférence (par exemple 47 % sport, 24 % bloc et 24 % trad) sans enfermer un grimpeur polyvalent dans une seule catégorie. Les grimpeurs dont la pratique est répartie de façon assez équilibrée restent « Grimpeur sur rocher ».

## Le modifier

- Définissez un type de grimpeur sur votre profil theCrag et synchronisez,
- ajustez vos types de croix comptabilisés dans les Paramètres si les essais dans vos projets faussent la répartition de vos disciplines, ou
- enregistrez davantage d'ascensions dans le style auquel vous vous identifiez. L'intitulé s'actualise au prochain chargement de page.
