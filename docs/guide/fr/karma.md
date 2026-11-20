# Karma

theCrag attribue du **Karma** pour les contributions à l'index d'escalade — l'enregistrement d'ascensions et la modification des données de topo. Consultez [Karma sur theCrag](https://www.thecrag.com/article/cragkarma).

## Ce que Crag Stats peut afficher

L'objet compte de l'API **carnet de croix** supporter n'inclut **pas** votre total de karma personnel ni la répartition entre ascensions et modifications. Les points de terminaison `/karma` d'une zone sont des classements de contributeurs pour une falaise, et non un substitut à votre score de compte.

Tant que theCrag n'expose pas le karma personnel (ou un accès négocié), la carte du tableau de bord constitue une **approximation de la part liée aux ascensions uniquement** :

| Source                                                      | Points                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Enregistrer une ascension                                   | **1** une seule fois par voie (nœud), conformément à la règle d'une attribution par type de contribution de theCrag |
| Modifications de topo (descriptions, tracés, historique, …) | **Indisponible** — impossible à reconstituer depuis le cache du carnet de croix                                     |

Lorsque votre compte synchronisé inclut `routesTicked` et que ce chiffre est au moins aussi grand que le cache local des voies, la carte l'utilise pour le total des ascensions (il correspond aux « voies que vous avez enregistrées » sur theCrag). Sinon, elle compte les voies distinctes dans votre cache SQLite local.

La tuile **voies locales enregistrées** affiche toujours le nombre de voies distinctes liées à vos ascensions en cache, même lorsque l'estimation des ascensions utilise le compteur de compte, plus élevé. Les répétitions ne comptent qu'une fois ; les métadonnées d'une voie sans ascension ne comptent pas.

## Ce que ce n'est pas

- Ce n'est pas une copie exacte au bit près du score affiché sur votre profil theCrag.
- Le vrai karma passe par une **file de modération** pendant environ une semaine avant d'apparaître sur votre compte.
- La suppression ou la modification d'ascensions, les comptes privés et les imports historiques peuvent désynchroniser les totaux locaux et theCrag.
- Nous n’inventons **pas** de points de modification à partir des mentions FA ou des crédits d’ouvreur — ces activités peuvent rapporter du karma sur theCrag, mais les règles de calcul prévoient un point par nœud et par type de contribution, et nous ne disposons pas de votre historique de modifications.

## Comment cela pourra s'améliorer

Si theCrag ajoute le karma (ou les totaux d'ascensions et de modifications) aux données de compte du carnet de croix ou à un point de terminaison documenté pour grimpeurs que nous pouvons synchroniser en toute sécurité, Crag Stats pourra remplacer l'estimation par les vrais chiffres et remplir la tuile des modifications.
