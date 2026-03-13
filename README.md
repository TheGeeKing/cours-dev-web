# Modular Exam Web Application

This repository is an exam-oriented full-stack web application built from a T3-style baseline and reshaped into a modular delivery project. The goal is not to keep a generic starter alive. The goal is to implement the required module features in a controlled order, document key decisions, and apply a strict `MVVM` architecture while shipping a working application.

## Project intent

The application is one codebase with several required modules. Some modules connect naturally, such as account, address, cart, checkout, and order history. Others exist because the exam requires them and do not need a forced product story.

The guiding rule is:

- one application
- several required modules
- phased delivery
- explicit architecture decisions
- small, reviewable implementation steps

## Stack baseline

The current technical stack remains the official baseline:

- Next.js App Router
- React 19
- TypeScript
- tRPC
- React Query
- Drizzle ORM
- Better Auth
- Tailwind CSS
- SQLite / libSQL

This stack is intentionally kept so the project can focus on implementation, architecture, and testing rather than re-evaluating platform choices.

## Required architecture rule

`MVVM` is mandatory for this project.

The project uses feature-based `MVVM`, not a loose interpretation and not a single global layers-only folder structure. Each feature must clearly separate:

- `View`: pages, screens, layouts, and presentational components
- `ViewModel`: hooks and orchestration logic for UI state, queries, mutations, and forms
- `Model`: schema, validation, server procedures, domain rules, and typed contracts

See the architecture decisions for the official rules:

- [Project direction ADR](docs/adr/0001-project-direction.md)
- [Feature-based MVVM ADR](docs/adr/0002-feature-based-mvvm.md)
- [Implementation roadmap](docs/roadmap.md)

## Delivery sequence

The planned delivery order is:

1. Documentation reset and architectural baseline
2. Engineering baseline cleanup and test setup
3. Account module with profile and one saved address
4. Catalog, cart, checkout, and order history
5. UI quality, shared components, and responsiveness
6. Map module
7. Camera and media transfer module
8. One-to-one video chat module

The later modules are required phases, not optional stretch work. They come after the core account and catalog flows because those flows are the safest base for the rest of the application.

## Core product flow

The main end-to-end flow for the first implementation milestones is:

- sign in with GitHub
- browse a seeded catalog grid
- increment or decrement quantities
- manage a cart
- confirm checkout with a saved address
- accept payment through a local mock payment action
- review order history from the user account

Payment is intentionally local and simulated. No external payment provider is required for the core scope.

## Module roadmap

### Core modules

- `Account / Profile`
- `Saved Address`
- `Catalog`
- `Cart`
- `Checkout`
- `Order History`

### Required later modules

- `Map`
- `Camera`
- `Media Transfer`
- `1-to-1 Video Chat`

## Testing strategy

- `Vitest` is the default automated test runner
- testing starts early and grows with each phase
- core flows must be covered before advanced modules are considered complete
- authorization, validation, and unsupported browser/device states are part of the expected test surface

## Local-first assumptions

The project is designed for local demonstration first and can later be adapted to a self-hosted Docker or VPS deployment.

Planned implementation defaults:

- GitHub OAuth as the first-class sign-in path
- seeded database data for the catalog
- one saved address per user in the core flow
- dedicated upload route for file bodies
- filesystem-backed uploads in a dedicated writable folder
- moderate media handling appropriate for an exam demo, not production-scale uploads

## Current state

The repository currently still contains much of the original scaffold baseline. The roadmap and ADRs define the target implementation order, but most product modules are not implemented yet.
