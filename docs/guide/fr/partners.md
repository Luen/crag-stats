# Partenaires

La page **Partenaires** (ainsi que la carte du tableau de bord) classe les personnes identifiées dans le champ `with` / partenaires de votre carnet de croix. Cliquez sur un nom pour ouvrir le carnet de croix filtré exactement sur ce partenaire.

## Indicateurs (`/partners`)

Utilisez le sélecteur en haut à droite :

- **Ascensions** (par défaut) — chaque ascension enregistrée mentionnant ce partenaire
- **Séances** — jours calendaires distincts avec au moins une ascension partagée (même principe de « séance = jour » que dans [Séances par semaine](/docs/sessions-per-week) ; les valeurs génériques non valides comme `2018-00-00` sont ignorées, comme pour Jour de la semaine)
- **Falaises** — différentes falaises grimpées avec ce partenaire, en utilisant les identifiants de falaise mis en cache par le fournisseur lorsqu'ils sont disponibles. Les renommages conservent une identité unique et les falaises portant le même nom mais ayant des identifiants différents restent distinctes. Sans identifiant, la correspondance des noms ne tient pas compte de la casse ; les noms vides et « Inconnu » sont ignorés. Une ligne comportant uniquement un nom n’est associée à un identifiant connu que si ce nom correspond exactement à un seul identifiant

Votre choix est enregistré dans le navigateur (`cs_partners_metric`).

## Remarques

- Les pseudonymes sont normalisés (le `@` initial est retiré) ; la même personne écrite avec une casse différente partage la même barre.
- Les journées en grande voie avec de nombreuses croix gonflent davantage le nombre d'**Ascensions** que celui des **Séances**.
- Une personne avec qui vous ne grimpez que sur une seule falaise sera moins bien classée sous **Falaises** qu'un partenaire de voyage ayant moins de croix.

L'aperçu du tableau de bord et la page complète utilisent les mêmes ascensions enregistrées, y compris les anciennes ascensions dont la fiche de voie n'est plus disponible. L'absence de détails sur la voie ne supprime pas les ascensions avec un partenaire ni les jours de séance valides ; elles ne contribuent simplement à aucune falaise sans site connu. Les autres analyses du tableau de bord basées sur les voies nécessitent toujours une fiche de voie.

La carte du tableau de bord partage l'indicateur sélectionné avec cette page et affiche les sept principaux partenaires pour cet indicateur. Cliquez sur le titre Partenaires pour afficher la liste complète.

Les badges, les croix les plus dures, les ascensions marquantes, les activités récentes ainsi que les étapes de cotation/première ascension spécifiques à une voie affichent également les compagnons enregistrés. L'attribution est liée à l'ascension sélectionnée, et non à chaque répétition de la voie. Les cartes communautaires/d'équipement au niveau de la voie et les jalons cumulés ne déduisent pas automatiquement les compagnons de cordée. Les doublons de noms sont fusionnés sans tenir compte de la casse ; les noms manquants sont ignorés et ne sont jamais considérés comme une preuve d'escalade en solo.
