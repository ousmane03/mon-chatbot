# Mon Chatbot IA pour Restaurants

Salut ! C'est un projet que j'ai fait pour apprendre à connecter une IA à une vraie application web. L'idée c'est simple : créer un petit widget de chat qu'un restaurant peut coller sur son site avec une seule ligne de code, et qui répond automatiquement aux questions des clients (horaires, menu, réservations, etc.).

Le truc cool c'est que c'est multi-clients — un seul serveur peut gérer plusieurs restaurants, chacun avec sa propre config.

---

## Comment ça marche

Le widget (`widget.js`) se charge sur n'importe quel site via une balise script. Il va chercher la config du restaurant sur mon serveur, puis envoie les messages à l'API Groq (modèle Llama 3.3). Tout ça sans que le client ait besoin de toucher à du code.

---

## Lancer le projet en local

Il faut **Node.js** installé.

```bash
npm install
```

Crée un fichier `.env` à la racine :

```
GROQ_API_KEY=ta-clé-ici
```

Puis lance le serveur :

```bash
npm run build
node server.js
```

Et ouvre `http://localhost:3001/test.html` dans ton navigateur.

---

## Ajouter un client

Il suffit de créer un fichier JSON dans le dossier `clients/` avec les infos du restaurant (nom, couleurs, horaires, prompt système, etc.).

Ensuite le client colle ça dans son site :

```html
<script src="https://mon-chatbot-production.up.railway.app/widget.js?client=nom-du-resto"></script>
```

C'est vraiment tout.

---

## Structure des fichiers

```
mon-chatbot/
├── clients/        → un fichier JSON par restaurant
├── public/
│   ├── widget.js   → le widget qu'on intègre chez les clients
│   └── test.html   → page de test en local
├── src/            → interface React (pour tester l'IA directement)
├── server.js       → serveur Express + routes API
└── .env            → clés API (à ne jamais commiter)
```

---

## Déploiement

Le projet tourne sur **Railway**. Un `git push` sur `main` et c'est redéployé automatiquement.

URL : `https://mon-chatbot-production.up.railway.app`

---

Fait à Montréal dans le cadre d'un projet perso pour apprendre le développement fullstack avec l'IA.
