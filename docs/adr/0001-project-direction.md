# 0001 - Project Direction

- Status: Accepted
- Date: 2026-03-13

## Context

This repository started from a generic T3-style scaffold. The baseline already provides authentication, database access, typed server procedures, and a frontend shell, but it does not define the real purpose of the project.

The exam brief requires multiple practical features, including profile work, catalog interactions, address handling, component usage, map integration, camera and media handling, and video chat. Some of these modules naturally connect. Others are included because the exam requires them and should not force the project into an artificial single-product story.

Without an explicit direction, the repository could drift into:

- a generic starter demo
- a collection of disconnected experiments
- an over-designed product narrative that makes required modules feel unnatural

The project needs a planning baseline that explains:

- why the repository exists
- which modules come first
- how required later modules fit into the plan
- why the current stack is kept
- which architecture rule is mandatory during implementation

## Decision

We will use this repository as a modular exam web application delivered in phases.

### Product framing

The application is one codebase containing several required modules. The project does not need a perfectly coherent business story across every feature. Instead, it should stay believable where that helps and pragmatic where the exam requires technically unrelated modules.

The first core product flow will connect:

- GitHub-authenticated account access
- profile and saved address management
- seeded catalog browsing
- cart management with quantity changes
- checkout with a locally accepted payment action
- order history inside the user account

Later required modules will then extend the same application:

- map integration
- camera capture
- media transfer
- one-to-one video chat

These later modules are required phases, not optional stretch ideas.

### Stack baseline

We keep the current stack as the official technical baseline:

- Next.js App Router
- React
- TypeScript
- tRPC
- React Query
- Drizzle ORM
- Better Auth
- Tailwind CSS

This is a deliberate constraint. The learning value comes from building on top of a stable foundation instead of restarting stack selection.

### Scope conventions

Core implementation scope comes first:

- account / profile
- one saved address
- catalog
- cart
- checkout
- order history
- typed fetch and API usage
- state management
- responsive UI
- security

Required later scope comes after the core release is stable:

- map
- camera
- media transfer
- one-to-one video chat

Later required modules must not delay the initial core milestone, but they are still part of the committed roadmap.

### Authentication baseline

GitHub OAuth is the first-class sign-in method for the project. This keeps the implementation aligned with the current authentication setup and provides a concrete authenticated user identity for the account, cart, order, media, and video features.

### Architecture baseline

`MVVM` is mandatory for this project. The specific structure is documented in ADR 0002, but the decision is established here as a project-wide rule rather than an optional teaching aid.

### Planning conventions

- The repository remains one maintainable application.
- Modules may be loosely connected if the exam scope requires it.
- Strong automated testing is a project goal from the start.
- `Vitest` is the default automated test framework.
- Security applies from the first real user flows onward.
- Architectural changes that materially affect delivery should be recorded with additional ADRs.

## Consequences

### Positive consequences

- The project gains a realistic implementation order tied to the exam goals.
- The team can work module by module without losing architectural consistency.
- The first delivery milestone becomes concrete and testable.
- Later required modules are acknowledged early without destabilizing the initial build.

### Tradeoffs

- Not every module will share a perfect product narrative.
- Advanced modules are intentionally delayed even though they are required.
- Documentation must stay current as the implementation grows.

## Alternatives considered

### Keep the repo as a generic starter

Rejected because it does not describe the actual project goals, scope ordering, or exam requirements.

### Force every module into one strict product story

Rejected because some required modules, especially media and video, would feel artificial and drive poor product decisions.

### Re-evaluate the technical stack before implementation

Rejected because the existing stack already supports the required learning and delivery goals.
