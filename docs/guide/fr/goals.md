# Objectifs

Les objectifs transforment une cible de votre carnet de croix theCrag en une barre de progression sur le tableau de bord et sur la page **Objectifs**. Les objectifs de dénivelé et de journées d'escalade se remplissent de manière linéaire. Les objectifs de **cotation** utilisent un modèle approximatif de **préparation pyramidale**, de sorte qu'être à une cotation sous la cible n'apparaît plus comme presque accompli.

## Types d'objectifs

| Type                     | Ce que « accompli » signifie                                                       | Barre de progression                   |
| ------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------- |
| **Cotation cette année** | Un enchaînement égal ou supérieur au score cible au cours de l'année de l'objectif | Préparation pyramidale (ci-dessous)    |
| **Dénivelé cette année** | Mètres gravis au cours de cette année                                              | Linéaire : mètres ÷ cible              |
| **Journées ce mois-ci**  | Journées d'escalade distinctes au cours du mois civil en cours                     | Linéaire : jours ÷ cible               |
| **Personnalisé**         | Vous le marquez comme terminé                                                      | Manuel (aucun remplissage automatique) |

Le périmètre du lieu (extérieur / intérieur / tous) filtre les ascensions prises en compte. Les objectifs de cotation sont définis par défaut sur **extérieur**.

Les objectifs de dénivelé **enregistrent toujours des mètres**. Le formulaire de création demande la cible dans l'unité de hauteur sélectionnée (mètres ou pieds) et convertit les pieds avant d'enregistrer, et les libellés de progression et de cible suivent également cette unité. Changer d'unité ultérieurement met à jour l'intitulé de l'objectif sans modifier la cible enregistrée. Consultez [Paramètres d'affichage](/docs/display-settings).

Les objectifs de cotation conservent leur échelle **Voies** ou **Blocs**. Les cibles et les libellés de progression suivent le système de cotation correspondant dans les Paramètres ; modifier le système d'affichage ne modifie ni la cible ni le pourcentage. Les titres des objectifs suggérés suivent également les Paramètres, tandis que les titres personnalisés restent tels qu'ils ont été saisis. Dans les **Préférences de cotation** d'un objectif, vous pouvez choisir son échelle et décider d'utiliser ou non un titre automatique.

Si un objectif indique **Échelle de cotation requise**, sa progression n'est pas disponible tant que le propriétaire n'a pas choisi **Voies** ou **Blocs**. Son titre et sa cible enregistrée sont conservés ; un titre mentionnant une cotation ne détermine pas son échelle.

## Préparation à la cotation

Un objectif de cotation demande un **enchaînement ≥ cible** (score canonique, généralement Ewbank pour les voies ou échelle V pour les blocs) au cours de l'année de l'objectif. La barre n’est **pas** `best send ÷ target` — cela donnait l’impression que 22→23 était à ~96 % alors qu’il vous restait encore à enchaîner le 23.

À la place, le modèle évalue la solidité de votre pyramide sous la cible **N**, puis le travail fourni à proximité de celle-ci :

1. **Accompli (100 %)** lorsque votre meilleur enchaînement valide est déjà ≥ N.
2. **Base** lorsque vous avez un enchaînement à N−1 (~35 %) ou seulement à N−2 (~10 %).
3. **Remplissage de la pyramide** à partir de voies distinctes enchaînées dans ces paliers — besoin indicatif d'environ **2 voies à N−1** et **4 à N−2** (jusqu'à environ +20 % et +25 %).
4. **Remplissage par les essais** à partir des coches de travail (sans enchaînement) avec un score effectif **≥ N−1** — jusqu'à environ +20 %, avec un besoin indicatif **ajusté selon l'horizon**, de sorte que les projets à court terme progressent plus vite par essai que les projets de longue haleine.
5. **Plafonnement du modèle de base à 94 %.** La première séance qualificative établit la base de référence ; chaque journée d'escalade distincte supplémentaire comportant des coches de travail à ≥ N−1 ajoute un point de préparation, jusqu'à 99 %. Seul un enchaînement valide permet d'atteindre 100 %. Plusieurs voies ou essais le même jour ne comptent que pour une seule séance ; les dates manquantes, invalides ou futures n'en rapportent aucune. Le crédit de séance suit l'année et le lieu de l'objectif, et ne modifie pas les ratios des objectifs de dénivelé ou de journées d'escalade.

La validation des enchaînements utilise le même filtre d'année et de lieu que l'accomplissement : **cotation effective** (longueur la plus dure gravie en grande voie) et **voies distinctes** par palier de la pyramide (les répétitions d'enchaînement sur une même voie ne comptent qu'une fois). Les essais comptabilisent chaque coche de travail valide (les répétitions sur la même voie continuent de faire avancer la barre).

La ligne de progression affiche votre meilleur enchaînement, le nombre de voies à N−1 / N−2, l'historique des essais le cas échéant, ainsi qu'une brève indication sur l'horizon :

| Écart par rapport à la cible                   | Indication     | Besoin indicatif en essais (≈ pour remplir la tranche des essais) |
| ---------------------------------------------- | -------------- | ----------------------------------------------------------------- |
| 1 cotation                                     | Court terme    | ~15 essais                                                        |
| 2 cotations                                    | Moyen terme    | ~35 essais                                                        |
| Plus large / aucun enchaînement pour l'instant | Longue haleine | ~75 essais                                                        |

## Cotation suivante suggérée

Sur la page **Objectifs**, lorsque vous avez des enchaînements en extérieur au cours des **deux dernières années**, Crag Stats peut vous proposer une suggestion : prendre votre enchaînement en falaise le plus difficile (voie et/ou bloc, comptabilisés séparément) et viser le **palier de cotation suivant** cette année (V5 → V6, 25 → 26). Les suggestions ne créent jamais d'objectif tant que vous ne cliquez pas sur **Ajouter un objectif**. Si vous suivez déjà cette cible en extérieur pour l'année, le badge indique **Déjà suivi**.

## Ce que vous voyez

- Encadré « Objectifs actifs » du **Tableau de bord** : jusqu'à quelques objectifs en cours avec les mêmes pourcentages et libellés.
- Page **Objectifs** : badges optionnels de cotation suivante suggérée, listes complètes Actifs / Atteints, création/modification, et le même texte de préparation pour les objectifs de cotation.

## Remarques importantes

- **Approximatif.** Les chiffres indicatifs de la pyramide sont une règle empirique d'entraînement, et non une prédiction que vous allez enchaîner N.
- **Scores du même système.** Les paliers de soutien correspondent aux plages de scores [N−1, N) et [N−2, N−1), de sorte que les enchaînements intermédiaires sous une cible continuent de la soutenir. Les scores utilisent le score canonique de l'objectif ; les systèmes de cotation différents ne sont pas convertis à l'intérieur de la barre.
- **Échelle, année et lieu.** Les données de voies et celles sur l’échelle V ne sont jamais mélangées. Les coches plus anciennes en dehors de l'année de l'objectif, ou sur le mauvais lieu, ne contribuent pas à la préparation. Le DWS et les highballs cotés sur l’échelle V comptent dans les objectifs de bloc, en se basant sur le système de cotation plutôt que sur le style d’équipement.
- **Les essais sont approximatifs.** Nous ne prenons en compte que les essais non enchaînés enregistrés avec une cotation ≥ N−1 — et non chaque essai dans un projet non coté.
- Les **objectifs personnalisés** ne se remplissent jamais automatiquement à partir du carnet de croix.

Les objectifs de dénivelé et de journées restent de simples ratios linéaires, de sorte qu'un kilomètre ou un mois à moitié complété indique toujours la moitié du chemin.
