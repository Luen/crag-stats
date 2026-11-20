# Calendrier des ascensions

Le **Calendrier des ascensions** est une carte thermique annuelle des jours où vous avez enregistré des ascensions. Les cellules renvoient vers `/logbook?day=` pour la date correspondante.

## Intensité

Les couleurs varient selon le nombre d'ascensions enregistrées ce jour-là (aucune → peu → beaucoup), en utilisant le même dégradé de vert. Les essais comptent pour l'intensité ; l'infobulle indique toujours le nombre d'enchaînements séparément.

## Cotation

Chaque jour est coloré selon l'**enchaînement réussi le plus difficile** de la journée, avec la même palette Débutant → Élite que les pastilles de cotation ailleurs dans l'application. Les jours ne comportant que des essais (sans enchaînement) utilisent un remplissage atténué « essai ». Lorsqu'une journée mêle des cotations de bloc et de voie, le calendrier retient l'identifiant de niveau le plus élevé — les niveaux ne sont pas parfaitement comparables d'un système à l'autre.

Votre préférence Intensité / Cotation est enregistrée dans le navigateur (`cs_heatmap_mode`).

## Météo

Lorsque le [cache météo](/docs/weather) activé contient au moins un de vos jours d'escalade, un troisième mode **Météo** apparaît. Chaque jour grimpé est coloré selon les conditions de sa première ascension en extérieur disposant de données météo en cache : neige, pluie, chaud (35 °C+), gel, beau temps (15–25 °C et sec) ou doux, selon les mêmes règles que les badges. Les jours sans données météo en cache (salle, absence de coordonnées, pas encore récupérés) restent en gris atténué. Les infobulles indiquent la maximale, la minimale et les précipitations, et un tableau **Afficher les valeurs météo** sous le calendrier présente ces mêmes chiffres sous forme de texte pour l'année sélectionnée.

Les cellules du calendrier conservent la date calendaire enregistrée dans tous les fuseaux horaires du navigateur, y compris lors des changements d'heure. Elles ne convertissent pas les jours d'escalade en horodatages locaux.
