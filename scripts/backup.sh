#!/usr/bin/env bash
# Sauvegarde de l'instance CHKN-FIT (base PostgreSQL + photos).
# À lancer depuis la racine du projet, par ex. en cron quotidien :
#   0 3 * * * /chemin/vers/scripts/backup.sh /chemin/vers/backups
set -euo pipefail

DEST="${1:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"

# base de données
docker compose exec -T db pg_dump -U chicken chickenfitness | gzip > "$DEST/chkn-fit-db-$STAMP.sql.gz"

# photos (volume uploads)
docker run --rm -v chickenfitness-project_uploads:/data -v "$(realpath "$DEST")":/backup alpine \
  tar czf "/backup/chkn-fit-uploads-$STAMP.tar.gz" -C /data .

# rétention : 30 jours
find "$DEST" -name 'chkn-fit-*' -mtime +30 -delete

echo "Backup OK → $DEST (db + uploads, $STAMP)"
