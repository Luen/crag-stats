# Synchronisation du carnet de croix

Crag Stats récupère votre carnet de croix de deux manières différentes :

- **Synchronisation par API** avec une clé d'API supporter theCrag. Elle s'exécute selon la planification définie (`SYNC_CRON`, quotidienne par défaut), depuis **Paramètres → Synchroniser maintenant** (ouvrez **`/settings`**, ou d'abord **`/login`** si `APP_PASSWORD` est configuré), ainsi que depuis le worker Docker. Une nouvelle installation se synchronise au démarrage lorsqu'une clé est configurée.
- **Import manuel de fichier CSV**. Exportez votre carnet de croix sur theCrag et importez le fichier dans **Paramètres → Import CSV** chaque fois que vous souhaitez l'actualiser.

## Sauvegarde : conserver une copie locale

Votre compte theCrag reste la source de référence pour votre carnet de croix en ligne. Crag Stats stocke les croix synchronisées, les paramètres, les objectifs, le cache de l'historique des voies, l'historique météo et les états associés dans **SQLite** (`DATABASE_PATH`, généralement `./data/crag-stats.sqlite` ou `/data/crag-stats.sqlite` sous Docker). Sauvegardez le **volume de données** Docker (ou le répertoire hôte que vous montez sur `/data`) avec le reste de vos sauvegardes homelab. Pour une sauvegarde de fichiers cohérente, arrêtez chaque application et worker utilisant cette base de données, copiez le volume en incluant les fichiers auxiliaires `-wal` / `-shm`, puis redémarrez-les. Copier ces fichiers un par un pendant que des écritures sont en cours peut produire une sauvegarde incohérente ; utilisez un outil de sauvegarde à chaud adapté à SQLite si vous devez laisser l'application tourner. Compose conserve déjà le volume lors des mises à jour d'image.

Pour obtenir une copie portable au format tableur, ouvrez **Paramètres → Confidentialité et contrôle des données** et utilisez **Télécharger le CSV du carnet** (même action que `/settings/export`). Le fichier est un CSV similaire à celui de theCrag pour le carnet de croix local : voies, croix, partenaires, note/qualité, dates et commentaires/notes. Les notes sont toujours incluses dans ce téléchargement puisqu'il s'agit de votre sauvegarde ; traitez ce fichier comme des données personnelles. Vous pouvez le réimporter plus tard avec **Paramètres → Import CSV** (mise à jour/insertion uniquement — les croix absentes du fichier ne sont pas supprimées). Téléchargez un CSV avant d'effectuer un **Effacement de toutes les données locales** si vous souhaitez disposer d'une solution de secours pendant la reconstruction depuis theCrag — la sauvegarde de volume reste la méthode de restauration complète.

Le CSV des paramètres provient de Crag Stats, il ne s'agit pas d'une extraction en direct depuis theCrag. Pour une sauvegarde directe du carnet de croix lui-même à la source, utilisez également l'option de theCrag **Action → Exporter le carnet de croix au format CSV** dans votre carnet en ligne.

## Ce qu'une synchronisation manuelle a importé

Une fois que **Synchroniser maintenant** ou **Resynchronisation complète** a réussi, les Paramètres affichent les croix traitées,
les nouvelles croix, les croix existantes actualisées, les nouvelles voies et les croix/voies supprimées.
Une voie partagée par plusieurs croix compte comme une seule nouvelle voie. « Actualisée » signifie qu'une
croix existante a été traitée à nouveau ; cela ne signifie pas que son contenu a changé.
Un carnet de croix inchangé affiche donc zéro ajout/suppression et des croix
existantes actualisées. Les exécutions ignorées et les erreurs affichent leurs propres messages, et non un récapitulatif de succès.

Les imports manuels de CSV affichent aussi le nombre d'entrées traitées/nouvelles/actualisées, mais ne suppriment jamais
les entrées manquantes. Route data and weather enrichment are separate background
imports: when enabled, they start after every successful sync or CSV upload
(including uploads to `POST /api/logbook/csv`), and are not included in these
logbook counts. Le récapitulatif décrit l'action
du bouton qui vient de se terminer ; il ne s'agit pas d'un historique de synchronisation persistant.

## Synchronisation par API

Définissez `THECRAG_API_KEY` avec votre clé de lecture de carnet supporter. Chaque synchronisation lit l'intégralité du carnet de croix et réconcilie les croix locales, y compris les suppressions. Ce mode fournit des données plus riches sur les voies, les profils et les grandes voies, et constitue le seul moyen pour Crag Stats de contacter automatiquement theCrag pour votre carnet de croix.

### En cas d'échec de la synchronisation par API

Les Paramètres indiquent l'échec et conservent l'heure de la dernière synchronisation réussie. Le message indique la cause lorsque theCrag en signale une, suivie du code d'erreur court de theCrag (par exemple `invalid-api-key`) :

- **Clé non valide :** theCrag a rejeté `THECRAG_API_KEY`. Vérifiez qu'elle ne contient pas de fautes de frappe, ou remplacez-la si elle a expiré ou a été révoquée, puis redémarrez le serveur.
- **Accès refusé :** la clé n'a pas les droits de lecture sur le carnet de croix. Vérifiez votre clé supporter, ou importez manuellement votre export CSV à la place (ci-dessous).
- **Limite d'utilisation atteinte :** la clé a atteint la limite de requêtes de theCrag. Attendez qu'elle soit réinitialisée, puis synchronisez à nouveau.

Si une page ultérieure échoue, les mises à jour des pages précédentes restent en cache, mais aucune croix manquante n'est supprimée et l'exécution n'est pas marquée comme réussie. La prochaine exécution planifiée (quotidienne par défaut) ou **Synchroniser maintenant** réessaiera l'ensemble du carnet depuis la page 1. Les échecs d'API ne mettent pas la planification en pause.

## Import manuel de CSV

Pas de clé supporter ? Sur theCrag, ouvrez votre carnet de croix et choisissez **Action → Exporter le carnet de croix au format CSV**, puis importez le fichier dans **Paramètres → Import CSV**. Répétez l'opération chaque fois que vous souhaitez intégrer de nouvelles croix.

Les imports manuels ajoutent et mettent à jour les croix, mais ne suppriment jamais les croix absentes du fichier. Pour supprimer les croix effacées, effectuez un **Effacement de toutes les données locales** et importez un nouvel export. Le CSV comporte moins de champs que l'API, notamment moins de détails sur le profil, les métadonnées de voies et les grandes voies, et il n'inclut pas les notes privées d'ascension de theCrag (`privateMarkdown`) ; seule la colonne publique Commentaire est importée. Les chiffres de bloc australiens sans préfixe utilisent le pays / chemin comme indication AU afin de ne pas être convertis à tort en cotations V.

L’import des données de voies rapproche les crédits FA/FFA de votre nom d’utilisateur theCrag. La synchronisation par API l'enregistre à partir de votre profil, et `THECRAG_USERNAME` est ignoré dans ce mode ; une installation basée uniquement sur CSV le configure à la place. Sans identifiant, l'import s'arrête avant de récupérer quoi que ce soit, veillez donc à le définir (ou marquez manuellement les premières ascensions dans le carnet de croix).

## Carnet CSV avec données de voies

Vous pouvez conserver le carnet de croix en CSV tout en bénéficiant des données de voies (popularité, nombre de répétitions, note, saisonnalité, longueurs) et des mentions automatiques de FA/FFA. Configurez :

- `CSV_INGEST_TOKEN` : une valeur aléatoire longue. C'est ce qui permet à un conteneur ou à un script de vous envoyer un export CSV, et cela indique également à Crag Stats que les imports sont la source du carnet de croix : aucune synchronisation API n'est lancée, les croix importées ne sont donc jamais supprimées, et la synchronisation n'écrit jamais le profil de grimpeur du titulaire de la clé.
- `THECRAG_API_KEY` : votre clé de lecture de carnet supporter, désormais utilisée uniquement pour les données de voies et la recherche de localisation des falaises/secteurs.
- `THECRAG_USERNAME` : votre nom d'utilisateur theCrag, pour que l'historique FA/FFA vous soit attribué (les exports CSV ne l'incluent pas).

C'est l'ensemble de la configuration : trois valeurs, aucun changement de mode. Sans `CSV_INGEST_TOKEN`, `THECRAG_API_KEY` synchronise le carnet de croix et les données de voies partagent la même clé. Background route and weather imports start after each successful sync or CSV upload, and also follow `IMPORT_CRON` (daily by default) rather than the logbook schedule, so a weekly or monthly `SYNC_CRON` still gets route data daily. Paramètres → **Importer les données de voies** affiche la progression et lance une exécution manuellement.

## Importer un CSV depuis un autre conteneur

L'import manuel convient très bien pour des actualisations occasionnelles. Si vous conservez votre export à un endroit accessible sur votre réseau — un dossier partagé, un partage Nextcloud ou Dropbox, ou un petit conteneur compagnon qui envoie chaque nouvel export —, Crag Stats peut le recevoir via HTTP à la place. Définissez `CSV_INGEST_TOKEN` avec une valeur aléatoire longue, redémarrez, puis envoyez le fichier avec un `POST` :

```bash
curl -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @thecrag-logbook.csv
```

Un import multipart avec le fichier dans un champ `file` fonctionne également. Les requêtes sans le jeton sont rejetées, et une réponse réussie indique combien de croix ont été traitées et combien étaient nouvelles :

```json
{ "ok": true, "imported": 412, "created": { "routes": 318, "ascents": 412 } }
```

Pour tester une installation sans rien importer, envoyez un corps de requête qui n'est pas un export :

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://cragstats.example.com/api/logbook/csv \
  -H "Authorization: Bearer $CSV_INGEST_TOKEN" \
  -H "Content-Type: text/csv" --data-binary 'x'
```

`400` signifie que le point de terminaison est accessible et que le jeton a été accepté : le corps a été rejeté, donc rien n'a été écrit. `401` signifie que le jeton ne correspond pas, tandis que `404` indique que cette image est antérieure à ce point de terminaison. Sur une installation protégeant toute l'interface (`AUTH_SCOPE=all`), une image plus ancienne renvoie `401` pour tout chemin `/api/` inconnu ; interprétez donc `401` comme « jeton ou image ».

Un fichier vide, une page de connexion enregistrée par erreur ou tout élément supérieur à 25 Mo est rejeté au lieu d'être importé. Ce point de terminaison effectue le même import avec mise à jour/insertion que le formulaire des Paramètres, il ne supprime donc jamais les croix absentes du fichier. Il n'effectue aucune requête auprès de theCrag : l'export doit toujours provenir de votre propre navigateur ou d'un autre outil que vous contrôlez.

## Pourquoi il n'y a pas de téléchargements automatiques de CSV

Crag Stats ne se connecte jamais au site web theCrag et ne télécharge aucun export à votre place. theCrag : ses [conditions d’utilisation](https://www.thecrag.com/terms#ownership-and-licenses) exigent que tout accès programmatique passe par l’API, et chaque export est une extraction complète du carnet de croix coûteuse pour ses serveurs. Exporter et importer le CSV vous-même ne pose aucun problème.
