# CHKN-FIT 🐔

Le suivi sportif auto-hébergé de l'équipe — pensé pour les séances du midi entre collègues,
avec un principe simple : **le groupe est la référence**.

**Stack** : Spring Boot 3 (Java 17) · Next.js 16 (TypeScript, Tailwind 4) · PostgreSQL (prod) / H2 (dev) · Docker Compose

---

## ✨ Fonctionnalités

### 📅 Planning d'équipe
Le split de la semaine (modifiable dans Paramètres, identique pour tous par défaut) :

| Lundi | Mardi | Mercredi | Jeudi | Vendredi |
|---|---|---|---|---|
| Pecs | Dos | Épaules | Bras | Jambes |

- **Focus déterministe** : k-ième jour d'entraînement de la semaine → k-ième séance de la
  rotation. Tous les membres voient la même séance, tous les jours, sans exception.
- **Jours fériés français calculés localement** (Pâques, Ascension, Pentecôte via
  Meeus/Jones/Butcher — aucune API externe). Un férié supprime le jour pour tout le monde :
  toute l'équipe se décale pareil, la synchro tient.
- **Un skip / une absence ne décale rien** : les autres continuent, et au retour ta séance
  du jour est déjà celle du groupe. Le recalage est automatique.
- **Rattrapage** : une séance créée un jour off (week-end) propose le premier groupe
  musculaire non validé de ta semaine ; et le focus de n'importe quelle séance se change
  d'un clic (choix verrouillé, jamais écrasé par le recalibrage).
- Séances planifiées non faites → passage automatique en "Manquée".
- Génération du planning sur 2 à 12 semaines, suppression des séances créées par erreur.

### 🏋️ Séances
- Un programme prêt pour chaque jour du split (+ Push/Pull/Full Body/Cardio/HIIT/Mobilité
  en alternatives) sur une bibliothèque de ~40 exercices, extensible via l'API.
- Logging des séries en direct : poids × reps, durée/distance (cardio), durée (gainage).
- **Rest timer** plein écran avec beep et +30 s.
- **Détection de record en direct** (e1RM d'Epley) avec ton historique affiché pendant
  l'effort ("Record : 76 kg e1RM · Dernier : 8×60").
- Validation avec durée, RPE et notes ; skip ; réouverture pour correction.

### 📈 Progression
- Courbes e1RM et charge max par exercice, volume hebdomadaire, records actuels,
  historique des PRs.
- Dashboard : séance du jour, streak, assiduité 30 j, poids et delta, qui s'entraîne
  aujourd'hui, fil d'activité de l'équipe.

### 📸 Physique
- Photos de progression **privées** par angle (face/profil/dos) avec poids du jour.
- Comparateur avant/après : côte à côte ou superposition avec slider.
- Mensurations complètes + courbe de poids.

### 🏆 Équipe
- Leaderboard (semaine/mois/toujours) : séance 20 pts · PR 15 · photo 5 · mensuration 3 ·
  streak 2/jour.
- 9 badges à débloquer, fiches membres, fil d'activité.

### 🎨 Design
DA inspirée de Basic-Fit (tokens relevés sur leur site) : fond sable `#fbf7f0`, cartes
blanches, orange brand `#eb6800`, CTA violet `#592bb2`, badges jaunes `#ffd12e`,
titres Archivo 900 uppercase. Tokens centralisés dans `frontend/app/globals.css`,
primitives dans `frontend/components/ui.tsx`.

---

## 🚀 Démarrage rapide (dev, sans Docker)

Prérequis : JDK 17+, Maven, Node 20+.

```bash
# Terminal 1 — API (H2 embarqué, aucune DB à installer)
cd backend
mvn spring-boot:run
# → http://localhost:8080 (données dans backend/data/, photos dans backend/uploads/)

# Terminal 2 — Front
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

Crée ton compte sur http://localhost:3000/register — ton planning de 4 semaines est
généré automatiquement avec le split de l'équipe.

## 🐳 Déploiement auto-hébergé (Docker Compose + PostgreSQL)

```bash
cp .env.example .env
# Édite .env : JWT_SECRET obligatoire (ex: openssl rand -hex 48), DB_PASSWORD, URLs

docker compose up -d --build
# Front : http://localhost:3000 — API : http://localhost:8080
```

Pour exposer sur un domaine, mets un reverse proxy HTTPS (Caddy/Nginx/Traefik) devant et
règle dans `.env` : `FRONTEND_URL=https://fit.ton-domaine.fr` et
`API_URL=https://api-fit.ton-domaine.fr` (`API_URL` est inliné au **build** du front —
rebuild nécessaire si tu le changes).

Les données persistent dans les volumes Docker `pgdata` (base) et `uploads` (photos).

## 🔧 Configuration (variables d'environnement de l'API)

| Variable | Défaut | Description |
|---|---|---|
| `DB_URL` | H2 fichier `./data/chickenfitness` | URL JDBC (PostgreSQL en prod) |
| `DB_USER` / `DB_PASSWORD` | `sa` / vide | Identifiants DB |
| `JWT_SECRET` | valeur de dev | **À changer en prod** (64+ caractères) |
| `JWT_EXPIRATION_HOURS` | `168` | Durée de vie des tokens (7 j) |
| `UPLOAD_DIR` | `./uploads` | Dossier des photos |
| `CORS_ORIGINS` | `http://localhost:3000` | Origines autorisées (séparées par des virgules) |

Frontend : `NEXT_PUBLIC_API_URL` (défaut `http://localhost:8080`).

## 🧱 Architecture

```
backend/   Spring Boot — API REST JWT
  model/       entités JPA (User, WorkoutSession, SetEntry, ProgressPhoto, ...)
  service/     PlanningService (fériés FR + focus déterministe de groupe),
               SessionService (logging, PR, focus verrouillé),
               StatsService (e1RM, volume, PRs), TeamService (points, badges),
               PhotoService
  web/         /api/auth, /api/plan, /api/sessions, /api/progress, /api/team, /api/catalog
frontend/  Next.js App Router — dashboard, planning, seance/[id], progression,
           physique, mensurations, equipe, parametres
```

Points d'attention :
- e1RM = formule d'Epley : `poids × (1 + reps/30)`. Un PR = battre son meilleur e1RM.
- Le streak ne compte que les jours éligibles : repos, fériés et week-ends ne le cassent pas.
- Les photos sont stockées sur disque (jamais en base) et servies uniquement à leur
  propriétaire (token en query pour les `<img>`).
- La synchro d'équipe suppose les mêmes réglages (jours + rotation) — c'est le défaut à
  l'inscription.

## 🗺️ Idées pour la suite

- Notifications (rappel à 11 h 45 : "Séance Pecs dans 15 min").
- Planning d'équipe centralisé (un admin le modifie, tous les profils suivent).
- Progression automatique des charges (5/3/1, double progression).
- Défis d'équipe ("1000 kg de volume collectif cette semaine").
- Export CSV / intégration Strava ou Apple Santé.
- Mode TV pour l'écran de la salle de pause.
