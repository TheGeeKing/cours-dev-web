# Projet Cours Application Web

Application web full-stack réalisée dans le cadre du module **B3 Dew – Application web**. Le projet met en pratique l'architecture **MVVM**, le framework **React**, et le couplage à une **API** locale, dans une application modulaire couvrant les exigences du module et du projet transverse.

## Objectifs

### Objectifs du module

À l'issue du module, le projet vise à démontrer la maîtrise de :

- l'environnement web (HTML, CSS, HTTP/HTTPS, cycle de vie d'une requête) ;
- le pattern **MVVM** et la séparation claire des responsabilités ;
- un framework front-end JavaScript du marché (**React 19** avec **Next.js 16**) ;
- la réalisation d'un site **responsive** et **sécurisé**, couplé à une API ;
- les bonnes pratiques de qualité logicielle : versionnage Git, tests automatisés, validation des données.

### Objectifs du projet

L'application est **une seule codebase** regroupant plusieurs modules requis par le module et le projet transverse. Le projet est fait sous forme de modules qui répondent à des exigences techniques précises (carte, transfert de fichiers, visio).

Règles directrices :

- une application, plusieurs modules ;
- livraison par phases, avec des décisions d'architecture documentées (ADR) ;
- **MVVM obligatoire** sur chaque fonctionnalité ;
- tests automatisés dès les premières implémentations.

## Fonctionnalités

### Implémentées

| Module                  | Route(s)                        | Description                                                                                                                          |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Accueil**             | `/`                             | Présentation du projet, état de session, catalogue des routes                                                                        |
| **Authentification**    | —                               | Connexion via **GitHub OAuth** (Better Auth), sessions sécurisées par cookie                                                         |
| **Transfert de médias** | `/transfer`, `/transfer/[slug]` | Upload de fichiers (jusqu'à 100 Mo), lien de partage, téléchargement, expiration automatique après 7 jours                           |
| **Visio 1-à-1**         | `/visio`, `/visio/[slug]`       | Création de salon, accès par lien, WebRTC, signalisation SSE, contrôles caméra/micro                                                 |
| **Carte interactive**   | `/map`                          | Carte Leaflet / OpenStreetMap des musées de France (open data data.gouv.fr), filtres par région, département, catégorie et recherche |

## Architecture MVVM

Le projet applique un **MVVM par fonctionnalité** (*feature-based*). Chaque module regroupe ses trois couches dans `src/features/<nom>/` :

```text
src/features/<feature>/
├── view/           → View : composants UI, écrans, présentation
├── view-model/     → ViewModel : hooks, orchestration, état UI
└── model/          → Model : validation Zod, services, types, règles métier
```

Les routes Next.js (`src/app/`) et les routes API (`src/app/api/`) restent des points d'entrée ; la logique métier reste dans la feature concernée.

### Les trois couches

| Couche        | Rôle                                                                                                     | Exemples dans le projet                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **View**      | Affichage, mise en page, composants présentationnels. Pas de logique métier ni d'appels API directs.     | `map-explorer-shell.tsx`, `transfer-upload-form.tsx`, `visio-room-shell.tsx`                          |
| **ViewModel** | Orchestration : état local, formulaires, appels fetch, valeurs dérivées, gestion des erreurs/chargement. | `use-map-explorer-view-model.ts`, `use-transfer-upload-view-model.ts`, `use-visio-room-view-model.ts` |
| **Model**     | Contrats typés, validation Zod, services serveur, persistance, règles domaine.                           | `map.service.ts`, `transfer.service.ts`, `visio.service.ts`, `map.validation.ts`                      |

### Exemple concret : module Carte

1. **View** — `MapExplorerShell` affiche le panneau de filtres et la carte. Il consomme uniquement les propriétés exposées par le ViewModel.
2. **ViewModel** — `useMapExplorerViewModel` gère les filtres, le debounce de recherche, le chargement des facettes et des points, les libellés dérivés (`displayedCountLabel`).
3. **Model** — `fetchMuseumPoints` et `fetchMuseumFacets` interrogent l'API open data ; `map.validation.ts` valide les paramètres côté serveur.

```tsx
// View : branche le ViewModel à l'UI
const viewModel = useMapExplorerViewModel();
return <MapFiltersPanel filters={viewModel.filters} onReset={viewModel.resetFilters} ... />;
```

### Règles transverses

- Le code partagé (`src/shared/ui/`, utilitaires génériques) ne doit pas masquer la propriété d'une feature.
- Toute nouvelle fonctionnalité doit pouvoir indiquer clairement où se trouvent sa View, son ViewModel et son Model.
- Les décisions d'architecture sont documentées dans [`docs/adr/`](docs/adr/) (notamment [ADR 0002 – Feature-Based MVVM](docs/adr/0002-feature-based-mvvm.md)).

## Conformité au module

Le tableau ci-dessous relie les compétences visées par le module (*Guidelines B3 DW*) à ce que le projet met en œuvre.

| Exigence du module                            | Mise en œuvre dans le projet                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Maîtriser le modèle **MVVM**                  | Architecture feature-based documentée ; séparation View / ViewModel / Model sur chaque module                              |
| Framework front-end JavaScript                | **React 19** + **Next.js 16** (App Router)                                                                                 |
| Site **responsive**                           | Tailwind CSS, grilles adaptatives, composants partagés (`src/shared/ui/`)                                                  |
| Couplage à une **API**                        | Routes REST (`/api/map`, `/api/transfer`, `/api/visio`) + **tRPC** pour les procédures typées                              |
| Requêtes **AJAX / fetch** et échange **JSON** | `fetch` depuis les ViewModels ; réponses JSON validées avec **Zod**                                                        |
| **Session** avec cookie                       | **Better Auth** + OAuth GitHub                                                                                             |
| Transfert de fichiers en AJAX                 | Module Transfert : upload multipart, stockage local, lien de partage                                                       |
| **Carte dynamique**                           | Module Carte : Leaflet, OpenStreetMap, clustering, filtres                                                                 |
| **Chat vidéo**                                | Module Visio : WebRTC, signalisation SSE, salon 1-à-1                                                                      |
| Bibliothèque de composants                    | Composants UI réutilisables (`Button`, `Panel`, `FormPanel`, `Field`, etc.)                                                |
| Client B2C (profil, articles, adresse)        | Prévu en phase bonus (voir roadmap)                                                                                        |
| **Versionnage** Git                           | Dépôt versionné, historique de commits                                                                                     |
| **Tests** unitaires / d'intégration           | **Vitest** + Testing Library ; tests sur services, routes API, ViewModels et composants                                    |
| Sécurité                                      | Authentification sur les routes sensibles, validation des entrées, slugs non devinables, expiration des fichiers et salons |

## Stack technique

- **Next.js** (App Router) · **React 19** · **TypeScript** (framework front-end)
- **tRPC** · **TanStack React Query** (API)
- **Drizzle ORM** · **SQLite / libSQL** (base de données)
- **Better Auth** (GitHub OAuth)
- **Tailwind CSS 4** (CSS)
- **Leaflet** · **react-leaflet** (carte interactive)
- **Vitest** (tests)
- **Biome** (lint/format)

Gestionnaire de paquets : **Bun** (`bun install`, `bun dev`, `bun test`).

## Démarrage local

**Prérequis** : Node.js ≥ 24, Bun, compte GitHub (pour OAuth).

```bash
bun install
cp .env.example .env   # puis renseigner les variables (auth GitHub, base de données)
bun db:push            # initialiser le schéma
bun dev                # http://localhost:3000
```

Commandes utiles :

```bash
bun test          # lancer les tests
bun run typecheck # vérification TypeScript
bun run check     # lint Biome
bun run build     # build de production
```

## Structure du dépôt

```text
src/
├── app/              # Routes Next.js et points d'entrée API
├── features/         # Modules MVVM (map, transfer, visio, …)
├── server/           # Base de données, tRPC, auth
└── shared/           # UI partagée et utilitaires transverses
docs/
├── adr/              # Décisions d'architecture
└── roadmap.md        # Feuille de route par phases
```

## Documentation complémentaire

- [Direction du projet (ADR 0001)](docs/adr/0001-project-direction.md)
- [MVVM par fonctionnalité (ADR 0002)](docs/adr/0002-feature-based-mvvm.md)
- [Feuille de route d'implémentation](docs/roadmap.md)
