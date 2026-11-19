# Mettre PROTO.ME en ligne, pas à pas

Ce guide est écrit pour quelqu'un qui n'a jamais fait de mise en ligne. Suivez les étapes dans l'ordre. Comptez **30 minutes** la première fois.

## Faut-il faire autre chose que publier sur Vercel ?

- **Si vous publiez seulement sur Vercel** (sans l'étape Supabase) :
  - le site s'affiche et fonctionne avec son contenu actuel, et le formulaire envoie bien sur WhatsApp ;
  - mais l'espace admin affiche « pas encore relié », et les demandes ne sont pas enregistrées.
- **Pour que l'admin marche**, il faut d'abord préparer Supabase (étapes 1 à 5) : c'est là que sont gardés le compte admin, les demandes et le contenu. Ensuite seulement, on publie sur Vercel (étape 6).

```
Ce que contient le dossier
index.html            le site public
admin/                l'espace admin (adresse : votresite/admin/)
config.js             les 2 réglages Supabase à remplir (étape 5)
supabase/schema.sql   la base de données et ses règles de sécurité
vendor/  media/       fichiers nécessaires, ne pas toucher
vercel.json           protections de sécurité, ne pas toucher
```

---

## Étape 1 — Créer un compte Supabase (5 min)

1. Allez sur **supabase.com** et cliquez sur **Start your project**.
2. Connectez-vous avec Google ou GitHub, ou créez un compte avec votre e-mail.
3. Cliquez sur **New project** et remplissez :
   - **Name** : `protome`
   - **Database Password** : cliquez sur **Generate a password**, puis copiez-le dans un endroit sûr. Ce n'est **pas** le mot de passe de l'admin, vous n'en aurez presque jamais besoin.
   - **Region** : choisissez *Central EU (Frankfurt)* ou la plus proche.
4. Cliquez sur **Create new project** et attendez 1 à 2 minutes.

## Étape 2 — Installer la base de données (2 min)

1. Dans le menu de gauche, cliquez sur **SQL Editor**, puis sur **+ New query**.
2. Sur votre ordinateur, ouvrez le fichier `supabase/schema.sql` avec le Bloc-notes (ou TextEdit sur Mac).
3. Sélectionnez tout (**Ctrl + A**), copiez (**Ctrl + C**), puis collez dans Supabase (**Ctrl + V**).
4. Cliquez sur le bouton vert **Run** en bas à droite.
5. Le message **Success. No rows returned** s'affiche : c'est bon.

## Étape 3 — Empêcher les inconnus de créer un compte (1 min)

1. Menu de gauche : **Authentication**, puis **Sign In / Providers**.
2. Dans la partie **Email**, **désactivez « Allow new users to sign up »**, puis **Save**.

## Étape 4 — Créer votre compte admin (2 min)

1. Toujours dans **Authentication**, cliquez sur **Users**, puis **Add user > Create new user**.
2. **Email** : `protomecontact@gmail.com`
3. **Password** : choisissez un **nouveau** mot de passe d'au moins 16 caractères, avec des majuscules, des chiffres et des symboles. Gardez-le dans un gestionnaire de mots de passe.
   Celui qui a été écrit dans la conversation n'est plus secret : ne l'utilisez pas.
4. Cochez **Auto Confirm User**, puis cliquez sur **Create user**.

## Étape 5 — Relier le site à Supabase (3 min)

1. Menu de gauche : l'icône **roue dentée (Project Settings)**, puis **API** (ou **Data API**).
2. Repérez deux informations :
   - **Project URL**, qui ressemble à `https://abcdefgh.supabase.co` ;
   - la clé **anon** / **public**, un long texte qui commence par `eyJ…`.
3. Sur votre ordinateur, ouvrez `config.js` avec le Bloc-notes et collez-les entre les apostrophes :

```js
supabaseUrl: 'https://abcdefgh.supabase.co',
supabaseAnonKey: 'eyJhbGciOi…',
```

4. Enregistrez le fichier.

> Ces deux valeurs sont faites pour être publiques. **Ne collez jamais la clé `service_role` ni un mot de passe dans ce fichier.**

## Étape 6 — Publier sur Vercel avec Vercel Drop (5 min)

1. Remettez le dossier en fichier zip :
   - **Windows** : clic droit sur le dossier, puis **Compresser dans un fichier ZIP** ;
   - **Mac** : clic droit, puis **Compresser**.
   Vérifiez que `index.html` est bien **à la racine** du zip, et pas dans un sous-dossier.
2. Allez sur **vercel.com/drop** et connectez-vous. Un compte gratuit suffit ; l'idéal est de se connecter avec GitHub ou Google.
3. **Glissez le fichier zip** (ou le dossier) dans la page.
4. Donnez un nom au projet, par exemple `protome`, puis cliquez sur **Deploy**.
5. Après quelques secondes, Vercel affiche l'adresse de votre site, par exemple `https://protome.vercel.app`.
6. Retournez dans Supabase : **Authentication > URL Configuration > Site URL**, collez cette adresse, puis **Save**.

**Pour mettre à jour le site plus tard** : ouvrez votre projet sur vercel.com et glissez le nouveau dossier dessus. Vercel publie la nouvelle version.

**Pour avoir votre propre nom de domaine** (par exemple proto.me) : dans le projet Vercel, allez dans **Settings > Domains** et suivez les indications.

## Étape 7 — Première connexion à l'admin (3 min)

1. Ouvrez `https://votresite.vercel.app/admin/`. Ajoutez cette adresse à vos favoris : aucun lien du site n'y mène.
2. Connectez-vous avec l'e-mail et le mot de passe de l'étape 4.
3. Cliquez sur **Sécurité**, puis **Activer la 2FA** :
   - installez **Google Authenticator** sur votre téléphone ;
   - scannez le QR code et tapez le code à 6 chiffres.
   À partir de là, même quelqu'un qui volerait votre mot de passe ne pourra rien modifier.

## Étape 8 — Vérifier que tout marche (5 min)

- Sur le site, remplissez le formulaire « Démarrer un projet » : la demande apparaît dans **Briefs projets**.
- Réservez une consultation : elle apparaît dans **Réservations**.
- Dans **Formations**, ajoutez une leçon avec un lien YouTube : elle apparaît sur le site.
- Ouvrez `/admin/` dans une fenêtre privée sans vous connecter : rien ne doit être visible.

---

## Ajouter une formation avec YouTube

1. Sur YouTube, mettez votre vidéo en ligne en choisissant la visibilité **« Non répertoriée »**. Elle reste invisible sur YouTube et ne se regarde que depuis votre site.
2. Copiez son lien : bouton **Partager**, puis **Copier** (le lien ressemble à `https://youtu.be/…`).
3. Dans l'admin : **Formations**, ouvrez la formation, puis dans **Ajouter une leçon**, collez le lien, donnez un titre et cliquez sur **Ajouter**.
4. Choisissez la **catégorie** (IA, Marketing, Business development, Design, Programmation, Prototypage & 3D, Juridique & finance, Autres), remplissez la petite description, le nom et la photo du formateur, puis passez le statut sur **Publiée**.

Sur le site, les élèves filtrent les formations par catégorie. Seules les catégories qui contiennent au moins une formation s'affichent.

Les élèves voient les leçons dans l'ordre. Ils peuvent revenir en arrière mais pas avancer la vidéo, et la leçon suivante démarre toute seule.

> **Limite à connaître** : avec YouTube, une personne qui sait lire le code de la page peut retrouver le lien de la vidéo et la regarder sur YouTube, où l'avance rapide est possible. Pour des formations payantes, il faudra plus tard un hébergeur vidéo privé (Vimeo, Bunny Stream…).

## Joindre des documents à une formation (PDF, Word, Excel…)

1. Dans l'admin : **Formations**, ouvrez la formation.
2. Descendez jusqu'à **Documents à télécharger** et glissez vos fichiers dans la zone (ou cliquez pour les choisir). Formats acceptés : PDF, Word, Excel, PowerPoint, CSV, 50 Mo maximum.
3. Renommez le titre si besoin et changez l'ordre avec les flèches. La poubelle supprime le document.

Les élèves voient la liste sous la formation, avec un bouton **Télécharger**. S'il n'y a aucun document, rien ne s'affiche.

> **Vous aviez déjà installé la base ?** Relancez une fois `supabase/schema.sql` dans **SQL Editor** (comme à l'étape 2). Le fichier peut être relancé sans risque : il ajoute la table des documents, les catégories des formations, et autorise les fichiers PDF, Word et Excel, sans rien effacer.

## Ce qui protège le site

| Protection | Comment |
|---|---|
| Mot de passe jamais écrit dans le code | Compte créé dans Supabase |
| Seul votre e-mail peut modifier | Règles de sécurité de la base |
| Code 2FA exigé une fois activé | Règles de la base + écran de connexion |
| Le public lit seulement le contenu publié | Règles de la base |
| Le public envoie des demandes sans pouvoir les relire | Règles de la base |
| Inscriptions fermées | Étape 3 |
| Blocage après 5 essais, déconnexion après 30 min | Espace admin + Supabase |
| /admin non indexé par Google, protections HTTPS | `vercel.json`, `robots.txt` |

## Limites de l'offre gratuite Supabase

À vérifier sur supabase.com/pricing, ces limites peuvent changer :

- **50 Mo maximum par fichier** envoyé (photos, vidéos, documents).
- **1 Go de stockage**.
- **Un projet sans aucune visite pendant une semaine est mis en pause.** Il suffit de le relancer depuis supabase.com.

## En cas de problème

| Message | Solution |
|---|---|
| « Espace admin pas encore relié » | `config.js` est vide : refaites l'étape 5, puis republiez (étape 6). |
| « Identifiants incorrects » | Vérifiez l'e-mail et le mot de passe dans Supabase > Authentication > Users. |
| « Ce compte n'a pas accès » | L'e-mail n'est pas dans la liste des admins. Dans SQL Editor : `insert into public.admins (email) values ('votre@email.com');` |
| « Action refusée » | Votre session a expiré ou le code 2FA est demandé : reconnectez-vous. |
| Une vidéo YouTube ne se lit pas | Vérifiez qu'elle est en « Non répertoriée » (pas « Privée ») et que l'intégration est autorisée dans YouTube Studio. |
