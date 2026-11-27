# Premières ascensions

La carte **Premières ascensions** comptabilise les voies et les blocs dont vous avez réalisé la première ascension (**FA**) ou la première ascension en libre (**FFA**). Lorsque l'historique des voies est mis en cache, elle indique également le nombre de voies pour lesquelles vous êtes crédité comme **ouvreur/équipeur** (équipement / ouverture).

## Ce dont vous avez besoin

- **Connexion propriétaire** — Si `APP_PASSWORD` est défini, connectez-vous pour pouvoir ouvrir les Paramètres et utiliser **Marquer FA** / **FFA** dans le carnet de croix. Les visiteurs voient la carte et les badges dès qu'au moins une voie est marquée, mais ne peuvent pas ajouter de marquages eux-mêmes.
- **Importation facultative des données de voie** — Définissez `ROUTE_DATA_IMPORT=true` sur le serveur si vous souhaitez que Crag Stats marque automatiquement les FA et FFA à partir de l'historique public des voies sur theCrag (voir ci-dessous). Les marquages manuels et l'importation écrivent tous deux dans la même table `first_ascents` ; aucun des deux ne dépend des notes privées.
- **Les notes privées ne sont pas liées** — **Paramètres → Afficher les notes privées** contrôle uniquement si vos **commentaires d'ascension** apparaissent sur `/logbook` (et dans la recherche). Cela ne conditionne ni la carte Premières ascensions, ni les badges FA/FFA, ni les jalons, ni l'importation des données de voie.

## Marquer une première ascension

theCrag enregistre les premières ascensions dans l'**historique** de chaque voie (les entrées FA / FFA sur la page de la voie), et non comme un type de croix. Son API de carnet de croix ne renvoie pas l'historique des voies, une synchronisation normale ne peut donc pas les voir. Vous pouvez les marquer vous-même ou activer l'importation facultative ci-dessous.

### En marquer une vous-même

1. Ouvrez le **Carnet de croix** et trouvez n'importe quelle ascension de la voie.
2. Survolez la ligne (ou utilisez la touche Tab) et cliquez sur **Marquer FA** ou **FFA**.
3. Cliquez sur **Démarquer** pour annuler.

Seule une personne pouvant ouvrir les Paramètres peut marquer des FA : n'importe qui si aucun `APP_PASSWORD` n'est défini, sinon uniquement en étant connecté. Les visiteurs voient le badge FA et la carte, mais pas les boutons.

Le marquage est enregistré avec l'identifiant de la voie sur theCrag, il est donc conservé lors des resynchronisations. Il disparaît de la carte si toutes les ascensions de la voie sont supprimées sur theCrag, et réapparaît si vous enregistrez à nouveau la voie. **Paramètres → Tout effacer** supprime tous les marquages.

### Filtrer le carnet de croix

Dans le **Carnet de croix**, utilisez le filtre **Marquage de première ascension** pour n'afficher que vos FA, FFA, l'un ou l'autre, ou les voies sans marquage (`?fa=FA|FFA|any|none`). Si l'importation des données de voie est activée, le propriétaire dispose également de l'option **Historique pas encore vérifié** (`?history=pending`), qui liste les ascensions que le module d'importation n'a pas encore récupérées.

### Les importer depuis l'historique des voies (facultatif, désactivé par défaut)

Si le propriétaire de votre serveur l'active (`ROUTE_DATA_IMPORT=true` ; les anciennes versions utilisaient `ROUTE_HISTORY_IMPORT`, qui n'est plus pris en compte, renommez-la donc puis redémarrez), Crag Stats lit en arrière-plan l'historique public de chaque voie du carnet de croix sur theCrag et marque les FA et FFA qui vous mentionnent.

- **Seules les entrées mentionnant votre nom d'utilisateur theCrag** (`@yourlogin`) sont prises en compte. Les noms en texte brut sont ignorés car ils prêtent trop facilement à confusion. La synchronisation API enregistre cet identifiant ; si votre carnet de croix provient d'imports CSV, définissez `THECRAG_USERNAME` pour que l'importation sache quelles entrées vous appartiennent.
- **Vos choix prévalent.** Les marquages que vous avez définis restent inchangés, et les voies que vous avez démarquées restent non marquées. **Paramètres → Importer les données de voie → Réappliquer** peut écraser l'un ou l'autre en utilisant l'historique déjà enregistré, sans solliciter à nouveau theCrag.
- **Respectueux envers theCrag.** Chaque voie est vérifiée **une seule fois** par défaut (les actualisations périodiques facultatives des données sont décrites ci-dessous), à raison de **100 voies par exécution** au maximum et d'une requête par seconde. A run happens after each logbook sync or CSV upload, on the background import schedule (`IMPORT_CRON`, daily by default), when the app restarts with routes still waiting (for example after an upgrade), or when you press **Check next 100 routes now**. Si theCrag applique une limitation, l'importation est mise en pause pendant au moins un jour.
- Les Paramètres indiquent combien de vos voies ont été vérifiées jusqu'à présent. Avec la synchronisation quotidienne, quelques centaines de voies prennent quelques semaines ; cliquer sur le bouton permet d'accélérer le processus.

Seul l'historique public des voies est enregistré, jamais vos notes d'ascension privées. **Paramètres → Tout effacer** le supprime en même temps que vos marquages.

## Ce qu'affiche la carte

Lorsque la carte inclut des crédits importés de FA/FFA ou d'ouvreur, son pied de page crédite l'historique des voies de theCrag. Cela suit les crédits enregistrés, même si l'importation est désactivée par la suite. Les marquages manuels ne nécessitent aucune mention d'attribution ; les collections mixtes conservent le crédit de l'historique des voies.

- **Nombre :** combien de voies sont créditées en FA ou FFA, d'après les marquages manuels ou l'importation des données de voie (historique public des voies). Lorsque vous avez des FFA, elle affiche également la répartition FA / FFA.
- **Voies ouvertes :** voies distinctes dont l'historique en cache vous mentionne comme ouvreur (`@yourlogin`). Même règle d'identifiant `@login` que pour l'importation de FA ; les noms en texte brut ne comptent pas. Nécessite l'importation des données de voie (`ROUTE_DATA_IMPORT=true`) pour que ces lignes soient enregistrées localement.
- **Ascensions communautaires (estimation) :** croix en cache sur les voies que vous avez ouvertes (marquages FA/FFA **ou** crédits d'ouvreur), moins vos propres croix du carnet de croix enregistrées lors de la même récupération. Une seconde tuile isole les voies **sportives / équipées** (style de matériel Sport, ou toute voie enregistrée avec des points d'assurage). Les répétitions ou suppressions ultérieures par le propriétaire ne modifient pas l'ancien instantané. Il s'agit d'estimations du total des ascensions, et non de grimpeurs uniques ni de compteurs en direct ; des différences de visibilité et un carnet de croix incomplet du propriétaire peuvent influer sur ces chiffres.
- **Couverture communautaire :** la carte indique combien de voies créditées du carnet de croix disposent d'un instantané de comptage associé, par rapport à l'ensemble des voies éligibles. Les totaux connus comme nuls sont affichés à zéro ; les comptages indisponibles sont exclus plutôt que considérés comme nuls. Une couverture partielle est explicitement indiquée. Un cache totalement absent affiche un message d'indisponibilité.
- **Années :** de l'année de votre première FA jusqu'à votre plus récente. Chaque FA est datée selon votre **premier enchaînement enregistré** de la voie (voir ci-dessous).
- **Éventail de cotations :** votre FA la plus facile et la plus difficile, en utilisant la cotation globale de la voie (et non celle d'une seule longueur). Les voies et les blocs sont listés séparément, car les cotations Ewbank et les cotations V ne peuvent pas être comparées. Les cotations s'affichent selon vos systèmes d'affichage pour les voies et les blocs.
- **Styles :** répartition de vos FA entre sport, trad, bloc, etc., selon le style de la voie sur theCrag.
- **Plus récentes :** vos trois FA les plus récentes sur la carte du tableau de bord (liste complète via le carnet de croix).
- **Communauté par voie :** les trois voies créditées en tête sur le tableau de bord (le reste étant comptabilisé sous la liste).
- **Communauté par voie :** jusqu'à huit voies créditées, classées selon l'estimation communautaire. Chaque ligne affiche le crédit FA, FFA et/ou ouvreur, un badge de style (Sport/équipé, Trad, Bloc, ou autre style de matériel connu d'après les infos de voie en cache), l'estimation (ou Indisponible) et la date de récupération de ce décompte. La fraîcheur du décompte est enregistrée séparément des autres champs d'informations de la voie, ainsi le simple rafraîchissement des méthodes ou de la qualité ne fait pas passer le compteur pour récent.

La carte n'apparaît pour les visiteurs que lorsqu'au moins une FA est marquée. D'ici là, le propriétaire voit à la place un court guide pratique.

L'importation des données de voie doit être activée (`ROUTE_DATA_IMPORT=true`) pour remplir les instantanés de comptage. Les totaux communautaires et les instantanés de comptage du propriétaire proviennent de l'API des voies lors de l'importation en arrière-plan (100 voies par exécution, avec régulation du rythme et temporisation). Pour maintenir automatiquement à jour les totaux et les autres données de voie, définissez `ROUTE_DATA_REFRESH_DAYS` sur un nombre entier de jours compris entre 30 et 3650 (ex. : `90` recommandé, ou `180` pour environ six mois) en plus de `ROUTE_DATA_IMPORT=true`. Les voies deviennent éligibles après ce délai et s'actualisent après une synchronisation réussie du carnet de croix, en partageant le quota de 100 voies avec les nouvelles voies. Les nouvelles voies sont traitées en premier, puis les données obsolètes les plus anciennes ; un arriéré important peut nécessiter plusieurs synchronisations. Une valeur non définie, `0`, inférieure à 30 ou supérieure à 3650 conserve le comportement d'une récupération unique ; **Tout actualiser** dans les Paramètres reste une réinitialisation manuelle facultative. Les marquages et démarquages manuels restent protégés.

Dans les Paramètres, le bouton de vérification de l'historique des voies décompte le temps jusqu'à la prochaine exécution autorisée et redevient disponible automatiquement. Les exécutions ont un intervalle minimal d'une minute ; un blocage ou une erreur peut nécessiter une attente plus longue. Sans JavaScript, rechargez les Paramètres pour mettre à jour la disponibilité.

## Quand une FA est prise en compte, et sa date

Une première ascension correspond à l'enchaînement, ainsi chacune est datée selon votre **premier enchaînement enregistré** de la voie marquée. Les essais préalables et les repos à la corde pendant que vous la travailliez ne comptent pas, pas plus que les répétitions ultérieures. Si vous n'avez enregistré que des essais jusqu'à présent, la voie apparaît tout de même sur la carte (datée de votre première ascension), mais elle ne débloque ni badge ni jalon tant que vous n'avez pas enregistré l'enchaînement.

## Badges et jalons

Ceux-ci se débloquent à partir des FA/FFA marquées par le propriétaire (et de votre premier enchaînement de chaque voie marquée), et non en activant les notes privées. La carte Jalons et le catalogue de badges utilisent les mêmes seuils — et non une ligne par voie.

- **Première ascension** et **Première ascension libre :** votre premier enchaînement d’une voie que vous avez marquée en FA ou en FFA.
- **Cumul de premières ascensions** (5, 10 / Pioneer, 20, 50, 100) : ce nombre de voies différentes marquées FA ou FFA.
- **Nombre de premières ascensions en libre** (5, 10, 20, 50, 100) : marquages FFA uniquement.
- **Nombre de premières ascensions par style** (10, 20, 50 pour Sport, Trad et Boulder) : marquages FA ou FFA sur ce style de matériel.
- **Ouvreur**, **Équipeur de voies** (5), **Bâtisseur de murs** (10), **Architecte de falaise** (25) : crédits d'ouvreur/équipeur issus de l'historique de voie en cache, datés d'après la première mention d'ouvreur indiquant votre `@login` sur chaque voie (et non d'après les enchaînements du carnet de croix).
- **Falaise partagée** (10), **Succès populaire** (50), **Cent mains** (100), **Classique locale** (500) : estimation approximative des ascensions communautaires sur les voies que vous avez ouvertes (FA/FFA ou ouvreur), d'après les instantanés de comptage associés. Les comptages correspondent aux ascensions, et non à des grimpeurs distincts. Une couverture incomplète est signalée dans le détail du badge.
- **Engouement équipé** (10), **Aimant à couennes** (50), **Classique à dégaines** (100) : la même estimation restreinte au matériel Sport ou aux voies équipées.

Chaque seuil est daté selon le premier enchaînement de la voie qui l'a franchi ; le détail indique le nom de cette voie de déblocage.

Les crédits d'ouvreur sans date d'historique valide comptent tout de même pour les badges d'ouvreur, mais leur date d'obtention reste inconnue. De même, les badges d'ascensions communautaires laissent la date d'obtention inconnue — les totaux sont des agrégats en cache, et non une date d'événement.
