# CHKN-FIT

Suivi sportif auto-hébergé pour l'équipe (séances du midi). Spring Boot + Next.js + PostgreSQL, le tout dans Docker.

## Lancer en dev

JDK 17, Maven et Node 20+ requis. Pas de base à installer, l'API écrit dans un fichier H2 en dev.

```bash
cd backend && mvn spring-boot:run      # API sur :8080
cd frontend && npm i && npm run dev    # front sur :3000
```

## Déployer

```bash
cp .env.example .env    # renseigner JWT_SECRET (openssl rand -hex 48), DB_PASSWORD, etc.
docker compose up -d --build
```

Mettre un reverse proxy HTTPS devant les ports 3000 et 8080. Attention : `API_URL` est
inliné dans le build du front, si l'URL change il faut rebuild (`docker compose build web`).

Le premier compte créé est admin : il gère le planning d'équipe et peut réinitialiser
les mots de passe des membres.

## Config

| Variable | Défaut | |
|---|---|---|
| `JWT_SECRET` | – | obligatoire, 64+ caractères |
| `DB_PASSWORD` | – | mot de passe Postgres |
| `FRONTEND_URL` | `http://localhost:3000` | pour le CORS de l'API |
| `API_URL` | `http://localhost:8080` | URL de l'API vue du navigateur (build du front) |
| `INVITE_CODE` | vide | si renseigné, demandé à l'inscription |
| `WEBHOOK_URL` | vide | webhook Slack/Teams : rappel de séance |
| `REMINDER_CRON` | `0 45 11 * * MON-FRI` | horaire du rappel (Europe/Paris) |

## Comment marche le planning

Le focus d'un jour est calculé, pas stocké : k-ième jour d'entraînement de la semaine →
k-ième séance de la rotation. Conséquences :

- tout le monde (à réglages identiques) voit la même séance chaque jour ;
- un férié supprime le jour pour tous, la semaine se décale pareil pour toute l'équipe ;
- un skip perso ne décale rien : au retour on est déjà calé sur le groupe.

Les jours fériés français sont calculés localement (algorithme de Meeus pour Pâques),
aucune API externe. Chacun peut quitter le planning d'équipe pour un planning perso
et y revenir dans Paramètres.

## Divers

- Tests : `mvn -f backend/pom.xml test`. La CI GitHub Actions tourne à chaque push.
- Backup : `scripts/backup.sh <dossier>` (pg_dump + photos, rétention 30 j), à mettre en cron.
- Les photos sont recompressées côté serveur (1600 px max, EXIF redressé) et privées.
- Export CSV de ses séances dans Paramètres.
- Le schéma DB est géré par `ddl-auto: update` : prévoir Flyway avant de grosses évolutions.
