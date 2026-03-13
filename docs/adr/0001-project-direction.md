# 0001 - Project Direction

- Status: Accepted
- Date: 2026-03-13

## Context

This repository started as a generic T3-style starter application. That baseline provides authentication, data access, server procedures, and a frontend shell, but it does not yet describe the educational goal of the project or the product direction the team should follow.

The module brief calls for practical work that helps learners:

- use version control in context
- produce quality mockups and interface work
- integrate automated tests with a simple and consistent workflow

The brief also suggests realistic features such as profile management, article selection, address forms, component library usage, dynamic maps, camera capture, large file transfer, and video chat.

Without an explicit direction, the repository could drift into either a generic demo app or a collection of unrelated experiments. The team needs a planning baseline that explains:

- why this project exists
- why the current stack is kept
- which features are core
- which features are stretch goals
- how the architecture should be taught and extended

## Decision

We will use this repository as a learner-oriented web application sandbox with phased delivery.

### Product framing

The project is intentionally framed as a learning sandbox rather than a narrowly fixed B2C product. This gives the team enough freedom to practice several applied web scenarios while still working inside one coherent codebase.

The sandbox will center on realistic user flows:

- authenticated profile management
- article display and selection
- validated address submission
- client and server data fetching
- responsive layouts
- secure backend access and validation

### Stack baseline

We keep the current stack as the official project baseline:

- Next.js App Router for application structure and server/client boundaries
- React for interactive UI
- tRPC for typed server procedures
- React Query for client-side data fetching and cache management
- Drizzle ORM for database access and schema evolution
- Better Auth for authentication and session handling
- Tailwind CSS and TypeScript for implementation speed and consistency

This is a deliberate constraint. The project should practice product and engineering decisions on top of a stable baseline instead of spending time re-evaluating the stack.

### Scope conventions

Core scope is mandatory:

- `Profile`
- `Catalog / Article Selection`
- `Address Form`
- fetch and API usage
- state management
- responsive UI
- security

Stretch scope is planned for later phases:

- `Map`
- camera and photo capture
- `Media Transfer`
- `Video Chat`

Core features must be completed before stretch features are treated as committed implementation work.

### Architecture teaching pattern

The frontend will use a lightweight MVVM interpretation:

- Views: pages, layouts, and presentational components
- View-models: hooks, form state, query state, mutation handlers, and orchestration logic
- Models: database schema, server procedures, domain services, and typed data contracts

This pattern is intended as a teaching aid, not as a rigid framework. It gives learners a simple way to separate UI rendering, user interaction logic, and data/domain behavior inside the existing Next.js structure.

### Planning conventions

- The repository remains one coherent application, not a set of disconnected mini-projects.
- Strong automated testing is a project goal from the start.
- Vitest is the default automated testing framework for this project.
- Security applies from the core phase onward through authentication, authorization, server-side validation, and controlled data access.
- Future runtime APIs and database models may change during implementation, but this document defines the planning baseline and sequencing rules now.

## Consequences

### Positive consequences

- The repo gains a clear educational purpose.
- The team can align implementation choices with learning outcomes.
- Scope is easier to manage because core work is separated from stretch work.
- The current stack can be used to teach typed full-stack development without additional platform churn.
- Documentation becomes a stable reference for future feature ADRs.

### Tradeoffs

- The project is less open-ended than a pure experimentation repo.
- Some advanced ideas will be intentionally delayed even if they are attractive technically.
- The team commits to maintaining architecture and roadmap documentation as implementation evolves.

## Alternatives considered

### Keep the repo as a generic starter

Rejected because it does not explain the module goals, the delivery order, or the expected learning outcomes.

### Define a strict single-product commerce application

Rejected because it would narrow the teaching scope too early and make some suggested module exercises feel artificial.

### Re-evaluate the technical stack before planning

Rejected because the existing stack already supports the target learning goals and provides a usable baseline for immediate iteration.
