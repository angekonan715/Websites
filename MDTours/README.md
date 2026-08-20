# MD Tours

Site vitrine pour l'agence de voyage **MD Tours** — voyages en Afrique de l'Ouest.

## Démarrage

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Comptes

- **Utilisateur :** créez un compte via **Connexion → Créer un compte**
- **Admin (ajouter des voyages) :**
  - Email : `admin@mdtours.com`
  - Mot de passe : `Admin123!`

Après connexion admin, ouvrez [http://localhost:3000/admin](http://localhost:3000/admin) pour publier un nouveau voyage (titre, pays, durée, prix, photo).

## Ajouter des images et des vidéos

Déposez vos fichiers dans `public/` :

| Dossier | Usage | Exemple |
|---|---|---|
| `public/background/` | Image du hero | Remplacez `hero.png` |
| `public/images/` | Photos des destinations | `accra.png`, `cape-coast.png`, … |
| `public/video/` | Vidéo du hero (optionnel) | `hero.mp4` |
