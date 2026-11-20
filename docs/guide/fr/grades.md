# Cotations et tranches de cotation

Crag Stats affiche les cotations de la même manière que [theCrag](https://www.thecrag.com/en/article/grades). Chaque système de cotation est converti sur une échelle interne unique, divisée en cinq **tranches** identifiées par un code couleur.

## Les cinq tranches

<!-- component:grade-bands -->

Ces couleurs apparaissent dans chaque pyramide, pastille de cotation, graphique CPR et répartition par tranche. Elles correspondent à celles de theCrag, de sorte qu'une cotation s'affiche de la même façon ici et là-bas.

## Comment les cotations sont comparées

- **Une échelle interne par type d'escalade.** Les voies (sportive, trad, moulinette, alpinisme…) sont évaluées sur l'échelle **Ewbank** (la cotation numérique australienne). Les blocs sont évalués sur l’**échelle V**. Ils ne sont jamais mélangés dans une même liste : un bloc V5 et une voie cotée 21 figurent dans des pyramides distinctes.
- **C’est la cotation qui détermine l’échelle, pas le style.** Le psicobloc et les highballs reçoivent souvent des cotations en V bien qu’il ne s’agisse pas de blocs. Ils restent sur l'échelle V : ils sont comptabilisés avec les blocs pour les enchaînements les plus durs et les indices de cotation, et disposent de leur propre pyramide (par exemple **DWS · V**), jamais d'une pyramide Ewbank.
- **Vos systèmes d'affichage** se choisissent dans **Paramètres → Affichage et visibilité**, un pour chaque type d'escalade. **Les cotations de voies** (Ewbank, française ou YDS ; Ewbank par défaut) couvrent l'escalade sportive, le trad, la moulinette et les autres pratiques encordées. **Les cotations de blocs** (échelle V (Hueco) ou Fontainebleau ; échelle V par défaut) couvrent les blocs et les highballs cotés en V. Les deux sont indépendants : vous pouvez donc afficher les voies en cotation française et les blocs en cotation Fontainebleau. Un lien partagé peut les remplacer ponctuellement avec `?system=` (un système pour les voies ou les blocs) et `?boulderSystem=`.
- **Cotation attribuée vs votre cotation.** theCrag enregistre à la fois la cotation consensuelle de la voie et celle que vous lui avez attribuée. Crag Stats privilégie la cotation saisie sur l'ascension lorsqu'elle appartient au bon système, et se rabat sinon sur la cotation de la voie.
- **Lecture des ascensions individuelles.** Les sections Projets, Historique des projets et Carnet de croix affichent votre cotation sélectionnée en premier. Lorsque la cotation d'origine sur theCrag diffère, elle suit entre parenthèses, par exemple `6b (20)`. Pour une ascension partielle en grande voie, la première cotation décrit les longueurs que vous avez grimpées ; les parenthèses indiquent la cotation d'origine de la voie. Les cotations sans score conservent leur texte d'origine plutôt que d'estimer une conversion.
- **Grande voie :** la cotation retenue pour une ascension correspond à la longueur la plus dure que _vous_ avez grimpée, et non à la longueur la plus dure de la voie. Pour les systèmes que l'analyseur de texte ne sait pas lire, comme l'UIAA, une ascension complète ou une longueur à la cotation correspondante utilise le score universel de l'ascension. Les autres longueurs utilisent le point médian de leur tranche de difficulté lorsqu'il est disponible.
- **Nombres ambigus en bloc :** le contexte du système de cotation fourni par la source détermine si un nombre seul désigne l'échelle V ou l'échelle Ewbank. Le pays seul ne modifie jamais une cotation sur les lignes issues de l'API. Les corrections conservent les données d'origine de l'API. Les exports CSV ne comportent pas de colonne de système de cotation ; les lignes de blocs australiens avec des chiffres seuls (`9`, `1`) reçoivent donc un indice AU à partir des champs Country / Crag Path / segments d'URL australia ; les cotations explicites `V5` / `VB` restent sur l'échelle V. Comme pour les imports API, une cotation d'ascension AU déduite ne remplace pas une cotation de voie explicitement exprimée sur l'échelle V.
- **Les fourchettes** telles que `V1/2` comptent pour leur point médian (V1.5).
- **Le score universel de theCrag.** theCrag évalue chaque cotation, dans chaque système de cotation, sur une même échelle de difficulté. Les ascensions synchronisées incluent ce score, ce qui permet à Crag Stats de classer les cotations de n'importe quel système pris en charge par theCrag (UIAA, saxon, nordique, polonais, brésilien, etc.), même ceux qu'il ne peut pas interpréter sous forme de texte. Les nombres seuls dans ces systèmes (un `7` UIAA) ne sont jamais confondus avec des cotations Ewbank.
- **Cotations intermédiaires.** Les conversions française, YDS et Fontainebleau utilisent également les scores de theCrag : les cotations sans équivalent Ewbank ou V entier (`5c+`, `6a` et `7a+` en français, `6A+` et `7C+` à Fontainebleau) se classent donc strictement entre leurs voisines (`7a` < `7a+` < `7b`). Les pyramides française, YDS et Fontainebleau regroupent par la cotation la plus proche dans ce système d'affichage, les égalités à mi-chemin étant attribuées à la cotation la plus dure. Chaque ligne renvoie vers sa propre plage de cotations dans le carnet de croix. Les pyramides Ewbank et de l'échelle V conservent des lignes à cotation entière. Leur tranche provient également du score de theCrag : un `6a` français reste ainsi en Intermédiaire et un `7a+` en Confirmé.
- **Les imports CSV** n'ont pas de colonne de score ; leurs cotations sont donc lues à partir du texte. Les cotations française, YDS, Ewbank, V et Fontainebleau se convertissent comme ci-dessus ; les cotations d'autres systèmes peuvent s'afficher sans conversion.

## Tables de conversion

Les conversions entre systèmes sont approximatives : les cotations sont culturelles, et un « 6c » sur une falaise n'équivaut pas toujours à un « 23 » sur une autre. Les tableaux ci-dessous sont générés à partir du même code que celui utilisé par le tableau de bord.

### Voies (Ewbank ↔ Français ↔ YDS)

<!-- component:route-conversions -->

### Blocs (Échelle V ↔ Fontainebleau)

<!-- component:boulder-conversions -->

## Sources

- theCrag : [Cotations et conversions de cotations](https://www.thecrag.com/en/article/grades)
- theCrag : [Les cotations sur theCrag](https://www.thecrag.com/en/article/gradesonthecrag)

## Records de cotation du tableau de bord

Le tableau de bord commence par **Croix la plus dure** et **À vue / flash le plus dur**. Ils affichent votre cotation réussie la plus élevée de tous les temps et votre cotation réussie au premier essai la plus élevée, dans vos systèmes sélectionnés. Les essais non aboutis et les ascensions sans score ne sont pas pris en compte. Les voies et les blocs ont des résultats distincts ; le DWS et les highballs cotés en V comptent avec les blocs. Les ascensions partielles en grande voie utilisent la longueur la plus dure que vous avez grimpée. Chaque résultat indique le type de croix et renvoie vers l'ascension retenue. En cas d'égalité entre un record à vue et un record flash, la performance à vue est affichée. Lorsqu'un record est manquant, un tiret et une explication s'affichent.
