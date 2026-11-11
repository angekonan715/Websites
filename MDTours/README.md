# MD Tours

Site vitrine pour l'agence de voyage **MD Tours** — voyages en Afrique de l'Ouest.

## Démarrage

```bash
npm install
npm run dev
```

`npm run dev` starts the local database, then copies the **live** voyages, menus, pages and photos from voyagezmdtours.com into this folder. Preview at [http://localhost:3000](http://localhost:3000) matches the published site (not live reservations). On Windows PowerShell use `npm.cmd run dev`. To skip the copy: `SKIP_LIVE_SYNC=1 npm run dev`. `npm run sync` does the copy without starting the site.

## Base de données

Comptes, réservations, voyages, menus, à propos, hero, campagnes et le reste du contenu admin sont stockés dans **PostgreSQL**. Les photos restent sur le disque (`data/uploads`).

- **En local :** `npm run dev` démarre une base Postgres fichier (PGlite) sur le port 54329. Rien d’autre à installer.
- **Postgres réel (Docker) :** `npm run db:up` puis `DATABASE_URL=postgresql://mdtours:mdtours@localhost:5432/mdtours` dans `.env.local`.
- **Railway :** ajoutez le plugin PostgreSQL (`DATABASE_URL` est injecté). Au premier démarrage, les JSON existants sont importés une seule fois. Ajoutez un volume monté sur **`/app/data/uploads`** (pas `/app/data`) pour que les nouvelles photos admin survivent aux déploiements. Un volume vide cache les fichiers de l’image Docker : les photos déjà publiées sont recopiées depuis `data/media-seed` au démarrage.
- Copier le contenu du site en ligne ici : `npm run sync` (JSON + photos). Un déploiement Railway **n’écrase pas** les voyages déjà en base : le JSON n’est importé que si la clé CMS est vide.

## Comptes

- **Utilisateur :** créez un compte via **Connexion → Créer un compte**
- **Admin (ajouter des voyages) :**
  - Email : `admin@voyagezmdtours.com`
  - Mot de passe : `MDs1996@@`

Après connexion admin, ouvrez [http://localhost:3000/admin](http://localhost:3000/admin) pour publier un nouveau voyage. Le mot de passe se change dans **Admin → Mot de passe**.

Mot de passe oublié : [Connexion → Mot de passe oublié](http://localhost:3000/connexion/mot-de-passe-oublie). En local, SMTP Zoho fonctionne. Sur Railway Hobby, SMTP est bloqué : ajoutez `RESEND_API_KEY`. Sur Railway Pro, `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` suffisent.

## Ajouter des images et des vidéos

Déposez vos fichiers dans `public/` :

| Dossier | Usage | Exemple |
|---|---|---|
| `public/background/` | Image du hero | Remplacez `hero.png` |
| `public/images/` | Photos des destinations | `accra.png`, `cape-coast.png`, … |
| `public/video/` | Vidéo du hero (optionnel) | `hero.mp4` |
