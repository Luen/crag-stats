# CPR (Climber Performance Rating)

Le **CPR** est l'indice attribué par theCrag pour évaluer votre niveau en escalade. Crag Stats affiche une chronologie du CPR distincte pour l'**escalade sportive**, le **trad** et le **bloc**, tout comme theCrag, car ces trois disciplines s'évaluent très différemment.

## Comment theCrag calcule le CPR

theCrag a conçu le CPR à partir d'une analyse statistique d'environ un million de croix. Les principes clés :

- **Chaque cotation est environ 5× plus difficile que la précédente** (facteur de puissance _P_ = 5 sur l'échelle Ewbank). Chaque voie distincte que vous avez réussie ajoute environ _P_ à la puissance de sa cotation à un total. Ce total est reconverti en cotation à l'aide d'un logarithme en base 5. Ainsi, cinq ascensions d'une cotation donnée équivalent à peu près à une ascension de la cotation supérieure.
- **Décalages de croix.** La manière dont vous avez grimpé compte. Les croix subissent un décalage de cotation avant le calcul du score. Par exemple, en escalade sportive, on grimpe après travail environ **2,1 cotations** plus dur qu’à vue, et en trad, un pink point est environ **0,8 cotation** plus facile qu’un enchaînement après travail. Les décalages sont calculés séparément pour l'escalade sportive, le trad et le bloc.
- **Consolider une cotation.** Une seule croix dans une nouvelle cotation peut venir d'une voie généreuse ou d'un coup de chance. Votre _cotation_ n'augmente qu'après environ **trois** croix à ce niveau, mais chaque ascension contribue tout de même à l'indice.
- **Décroissance.** Si vous arrêtez de grimper, le CPR baisse d'environ **0,7 cotation Ewbank par an** (environ trois quarts de cotation).
- Les **répétitions** d'une voie ne comptent qu'une seule fois (la meilleure croix), et c'est la cotation attribuée à la voie qui est utilisée plutôt que votre avis personnel.

theCrag conserve un indice avec décroissance et un indice sans décroissance pour chacune des disciplines : escalade sportive, trad et bloc.

## Comment Crag Stats l'obtient

- **Depuis l'API de theCrag (recommandé).** Lorsque vous synchronisez avec une clé API supporter, chaque ascension peut inclure les valeurs de CPR propres à theCrag. Si suffisamment de vos ascensions dans une discipline en disposent (au moins 3, et au moins 20 % des ascensions de cette discipline), la chronologie utilise **le CPR avec décroissance de theCrag**, libellé _theCrag CPR_.
- **Modèle approximatif (de secours).** Sinon, Crag Stats calcule son propre CPR, libellé _Approx._ Il reprend les mêmes principes : _P_ = 5, la meilleure croix par voie, les décalages de croix et une décroissance de 0,7 cotation/an. Les décalages de croix sont des estimations : par exemple en escalade sportive, à vue +2,1, flash +1,4, après travail 0, pink point −0,5, essais −3. **Il ne s'agit pas d'une copie de l'implémentation propriétaire de theCrag**, attendez-vous donc à de légères différences.

## Lire la chronologie

- Chaque **colonne** représente un trimestre.
- Les **bougies** indiquent la plage de cotations grimpées pour chaque type de croix au cours de ce trimestre. Comme sur theCrag, la croix la plus pure se place au sommet : à vue en vert, flash en jaune, après travail en rouge, pink point en rose, enchaînement/sans chute en bleu, essais en gris.
- La **ligne noire** représente l'évolution de votre CPR au fil du temps. Un anneau marque votre **pic**, et un point creux votre indice **actuel**.
- L'**arrière-plan coloré** indique les tranches de niveau (Débutant → Élite) selon leurs véritables seuils de cotation.
- Les **barres** en dessous indiquent le nombre d'ascensions enregistrées au cours de ce trimestre. Cliquez sur l'une d'elles pour ouvrir ces ascensions dans le carnet de croix.
- Un **séparateur en pointillés** avec **⋯** sur l'axe temporel signale un intervalle de plus d'un trimestre.
- L'option **Afficher les trimestres vides** attribue sa propre colonne à chaque trimestre entre votre premier et votre dernier trimestre enregistré. Les trimestres sans ascension restent vides et **interrompent la ligne noire**, de sorte qu'une longue pause n'apparaît plus comme une progression régulière. Le graphique défile horizontalement lorsque les colonnes supplémentaires nécessitent plus d'espace. Laissez cette case décochée pour conserver la vue compacte, où seuls les trimestres contenant des ascensions ont une colonne.

theCrag souligne qu'un **sommet gris** au-dessus de la ligne (des tentatives échouées dans une cotation supérieure) précède souvent un passage à la cotation suivante.

## Sources

- theCrag : [Climber Performance Rating (CPR)](https://www.thecrag.com/en/article/cpr)
- theCrag : [Explication de la chronologie du CPR](https://www.thecrag.com/en/article/cprtimeline)
