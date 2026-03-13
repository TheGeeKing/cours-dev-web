# Web Application Learning Sandbox

This repository is a learner-oriented web application project used to practice modern full-stack web development in a structured way. It starts from a T3-style scaffold, but the goal is no longer to demonstrate the starter itself. The goal is to grow this repo into a realistic training project with documented decisions, phased delivery, and room for stretch features.

## Why this project exists

The project supports hands-on practice around the module goals:

- use version control in a real project
- produce quality UI mockups and integrations
- add automated tests with Vitest as features are introduced
- work on common product flows such as profile management, article selection, and validated forms
- learn how frontend and backend concerns connect in a secure, responsive application

## Current state

The repository currently contains a minimal working baseline with:

- Next.js App Router
- React 19
- tRPC
- React Query
- Drizzle ORM
- Better Auth
- Tailwind CSS
- TypeScript

This baseline is intentionally kept as the project constraint so the team can focus on feature design, architecture, and delivery rather than restarting the stack selection from scratch.

## Planned learning scope

### Core scope

- Profile management
- Article listing, display, and selection
- Address form and validation
- Fetch and API integration
- State management
- Lightweight MVVM-style frontend organization
- Responsive design
- Security through authentication, validation, and controlled server access

### Stretch scope

- Dynamic map integration
- Camera and photo capture
- Large photo and video file transfer
- Video chat

## Documentation

- [Project direction MADR](docs/adr/0001-project-direction.md)
- [Implementation roadmap](docs/roadmap.md)

These documents explain why the project exists, what will be delivered first, what is optional later, and how the current technical stack supports the learning path.

## Planned modules

The documentation defines the future project around these modules:

- `Profile`
- `Catalog / Article Selection`
- `Address Form`
- `Map`
- `Media Transfer`
- `Video Chat`

Not all modules will be implemented at once. Core modules are mandatory. Advanced modules are planned as stretch phases.

## Development approach

- Keep the current stack and extend it incrementally
- Document key decisions before major implementation work
- Build core flows before advanced media features
- Use Vitest as the default automated test framework for planned tests
- Treat testing as part of each phase, not as a final cleanup task
- Use the project to practice both product thinking and technical execution
