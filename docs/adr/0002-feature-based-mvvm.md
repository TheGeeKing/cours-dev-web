# 0002 - Feature-Based MVVM

- Status: Accepted
- Date: 2026-03-13

## Context

The exam requires the project to follow `MVVM`. The repository already uses Next.js App Router, tRPC, Drizzle, and Better Auth, which means UI, client logic, and server/domain logic naturally live in different places. Without a clear rule, the team could interpret `MVVM` too loosely and end up with inconsistent feature structure.

Risks without an explicit `MVVM` rule include:

- pages that mix rendering, form orchestration, and domain logic
- hooks that become unstructured utility buckets
- server procedures that expose domain rules without clear feature ownership
- a global layers-only folder structure that makes features harder to understand and evolve

The project needs an `MVVM` approach that works with the existing stack and remains practical for exam delivery.

## Decision

We will use feature-based `MVVM` as a mandatory project rule.

### Structural rule

Each implemented feature must clearly express:

- `View`: route segments, pages, layouts, and presentational components
- `ViewModel`: hooks and orchestration logic for forms, queries, mutations, local UI state, and derived UI behavior
- `Model`: database schema, Zod validation, tRPC procedures, domain services, and typed contracts

The feature owns these layers even if the files live in framework-driven locations such as `src/app` or `src/server`.

### Practical interpretation

`MVVM` does not require a single top-level `views/`, `view-models/`, and `models/` directory for the whole application. Instead, the project groups code by feature and makes the `View`, `ViewModel`, and `Model` boundaries explicit within that feature.

Examples:

- account pages and form components are `View`
- account hooks that coordinate profile and address queries or mutations are `ViewModel`
- account schemas, server procedures, and persistence logic are `Model`

### Shared code rule

Shared utilities are allowed only when they support multiple features without hiding feature ownership. Reusable helpers such as auth guards, error mappers, or generic UI primitives may be shared, but feature-specific orchestration and domain rules should stay near the owning feature.

### Enforcement rule

When a new feature is added, the implementation must identify:

- where its `View` lives
- where its `ViewModel` lives
- where its `Model` lives

If a change cannot explain those boundaries clearly, it should be considered a structure problem and refactored before the feature grows further.

## Consequences

### Positive consequences

- The exam requirement is satisfied with a clear and repeatable pattern.
- Features remain easier to read, teach, test, and extend.
- The approach fits naturally with Next.js App Router and tRPC.

### Tradeoffs

- Some files may feel more distributed than in a simpler page-only project.
- The team must resist the temptation to place orchestration logic directly in route components.
- Shared abstractions need discipline so they do not erase feature boundaries.

## Alternatives considered

### Loose MVVM interpretation

Rejected because it would be difficult to prove or maintain consistently during the exam project.

### Global layers-only MVVM folders

Rejected because it weakens feature ownership and becomes harder to navigate as modules grow.

### No explicit MVVM ADR

Rejected because the project needs a durable reference for a mandatory architectural rule.
