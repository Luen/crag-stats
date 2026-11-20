# Types de roche

theCrag enregistre la géologie de nombreuses voies sous la forme d'une étiquette structurée **Type de roche** (par exemple Granite ou Grès). Crag Stats lit cette étiquette à partir du carnet de croix / cache des voies synchronisé — il ne scrappe jamais les pages et ne déduit jamais la roche d'après le nom de la falaise.

## Carte Types de roche

La carte **Types de roche** du tableau de bord comptabilise les ascensions dont la voie comporte une étiquette Type de roche et affiche la part de chacune. Le type dominant peut afficher un court descriptif géologique. Chaque nom renvoie vers le carnet de croix filtré avec `?rock=`.

Les voies sans étiquette Type de roche sont exclues du graphique, de sorte que les pourcentages ne décrivent que les ascensions étiquetées.

## Carte Roche & performance

Dès lors que **20 journées d'escalade ou plus** comportent au moins un enchaînement ou un essai sur une voie dotée d'une étiquette Type de roche, la carte **Roche & performance** compare vos résultats selon le type de roche. Avant cela, elle indique le nombre de journées étiquetées enregistrées jusqu'à présent. La carte reste masquée tant qu'aucun enchaînement ni essai étiqueté n'existe, et peut être déplacée ou masquée depuis Paramètres → Tableau de bord.

**Ce qui est comptabilisé.** Les enchaînements et les essais (la même classification de croix que partout ailleurs) sur les voies comportant une étiquette Type de roche. Les ascensions non étiquetées ne sont mentionnées qu'au titre de la couverture (« N de plus … n'ont pas d'étiquette de type de roche »).

**Indicateurs** (même principe que [Météo & performance](/docs/weather)) :

- **Taux d'enchaînement :** proportion d'enchaînements par rapport à l'ensemble des enchaînements et essais sur cette roche.
- **Proche de la limite :** la part d'enchaînements cotés situés à 2 cotations près (1 degré sur l'échelle V) de votre enchaînement le plus difficile du **même style et de la même échelle de cotation** dans les 365 jours précédant cette date. L'échelle V et les cotations de voies ne sont jamais mélangées.
- **À vue/flash :** part des ascensions à vue et flash par rapport à l'ensemble des enchaînements sur cette roche.

**Interpréter ces données avec lucidité.**

- Un type de roche doit totaliser au moins **10** ascensions (pour le dénominateur de cet indicateur) réparties sur au moins **3** jours avant d'afficher un taux.
- **Supérieur** / **Inférieur** utilise le même test robuste aux grappes que la performance météo : chaque groupe roche-jour constitue une unité, de sorte qu'une seule grosse séance ne peut pas créer de tendance à elle seule.
- Le choix de la falaise, les voyages et les projets constituent des facteurs de confusion par rapport au type de roche. Considérez ces différences comme une corrélation, pas comme une causalité.
- Lorsque vous avez de nombreux noms de roche distincts, les moins fréquents sont regroupés sous **Autre** (aucun lien vers le carnet de croix). Les barres nommées renvoient vers `/logbook?rock=…` avec la même correspondance insensible à la casse que la carte Types de roche.

La consultation de la carte ne déclenche jamais de requête vers le fournisseur, et les notes privées ne sont jamais utilisées.

La référence proche de la limite inclut vos enchaînements du même style et de la même échelle, même lorsque
ces voies de référence n'ont pas d'étiquette de roche. Elle utilise la cotation de longueur grimpée la plus difficile
lorsqu'elle est disponible, inclut le 365e jour précédent et exclut tous les enchaînements du jour
comparé. Les performances par roche et par météo partagent ce calcul de référence ;
la météo restreint en outre ses enchaînements de référence aux ascensions en extérieur.
