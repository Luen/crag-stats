# Meilleurs mois

La carte **Meilleurs mois** compare la [saisonnalité theCrag](https://www.thecrag.com/article/Seasonality) des falaises où vous grimpez le plus avec **les moments où vous y grimpez réellement**.

## Origine des données

theCrag enregistre une **courbe de saisonnalité à 12 valeurs** par voie (une valeur par mois calendaire). Crag Stats la met en cache pour chaque voie lors de l'importation facultative des données de voies (`ROUTE_DATA_IMPORT`, désactivée par défaut). Tant qu'une voie n'a pas été récupérée au moins une fois, aucune saisonnalité ne peut être affichée.

## Comment nous les agrégeons

Pour chaque falaise de votre carnet de croix :

1. **Votre volume** — décompte de vos ascensions par mois calendaire (toutes années confondues).
2. **Saisonnalité theCrag** — pour chaque voie que vous avez cochée sur cette falaise, utilisation de la courbe sur 12 mois en cache, pondérée par **le nombre de fois où vous avez grimpé cette voie**. Les voies que vous avez cochées le plus souvent influencent davantage la moyenne de la falaise.

Nous affichons jusqu'à **six** falaises classées selon votre nombre total d'ascensions sur place, mais uniquement celles dont au moins une voie grimpée possède une saisonnalité en cache.

## Lecture du graphique

- **Barres orange** — saisonnalité moyenne pondérée (plus elle est élevée, plus l'affluence sur theCrag est forte ce mois-là).
- **Barres grises** — vos ascensions ce mois-là sur cette falaise.

Lorsque les barres grises culminent à d'autres mois que la bande orange, il se peut que vous grimpiez hors saison — ou que votre échantillon soit réduit.

## Actualisation de la saisonnalité

Lancez **Synchroniser** depuis les Paramètres. Lorsque l'importation des données de voies est activée, la saisonnalité est complétée en arrière-plan (avec limitation de débit, jusqu'à 100 voies par exécution).

La page Secteurs peut également afficher la [météo de vos jours de visite en cache](/docs/weather). Cela décrit les conditions lors de vos journées enregistrées, indépendamment de la saisonnalité des voies utilisée ici.

## Rechercher par mois

Ouvrez [Recherche de saisonnalité](/seasonality) depuis la carte Meilleurs mois pour parcourir toutes les falaises et voies de votre carnet de croix synchronisé disposant de données mensuelles en cache. Choisissez un mois (par défaut le mois en cours selon votre fuseau horaire d'affichage), recherchez un nom de falaise, de zone ou de voie, et basculez entre **Falaises** et **Voies**. Les recherches, la sélection du mois, le tri et la pagination sont conservés dans l'URL afin que vous puissiez les mettre en favoris ou les partager. Choisissez **Voir les voies** pour filtrer sur une falaise, ou **Rechercher dans toutes les falaises** pour quitter ce filtre.

Les résultats sont classés selon la valeur du mois sélectionné divisée par la valeur la plus élevée de la courbe annuelle de ce résultat. Par exemple, une valeur de 5 avec un pic annuel de 10 affiche **50 % du pic annuel**. Les noms servent à départager les ex aequo ; vous pouvez également trier par nom. Il n'y a pas de seuil « en saison ». Une courbe composée uniquement de zéros affiche **Aucun signal saisonnier** et est classée après les courbes présentant un pic positif. La bande des mois et le tableau dépliable des valeurs affichent les douze mois.

Les courbes des falaises utilisent la même moyenne pondérée par les ascensions que le tableau de bord : les voies où vous avez enregistré le plus d'ascensions ont davantage d'influence ; les courbes de voies manquantes n'entrent pas dans le calcul de la moyenne. Rechercher le nom d'une voie permet de trouver sa falaise, mais ne modifie pas la courbe complète de cette falaise. Les falaises restent distinctes selon l'identifiant de zone du fournisseur lorsqu'il est disponible. Chaque falaise indique combien de ses voies enregistrées disposent de données ; la page signale également la couverture parmi les voies correspondantes. Les courbes manquantes ou mal formées restent inconnues et sont exclues des résultats classés.

Les résultats par voie renvoient vers toutes vos entrées du carnet de croix pour cette voie précise ainsi que vers sa fiche topo sur theCrag. Le bouton Précédent de votre navigateur permet de revenir à la recherche. La recherche lit uniquement le cache local et ne déclenche aucune requête auprès du fournisseur ni aucune recherche dans l'ensemble du catalogue theCrag. Activez l'importation facultative des données de voies et synchronisez pour enrichir la couverture.

La saisonnalité décrit les **habitudes de grimpe de la communauté**, et non les prévisions météo ou les conditions mesurées lors de vos visites enregistrées. Consultez [Météo](/docs/weather) pour ces observations des jours de visite.
