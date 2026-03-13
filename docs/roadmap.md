# Implementation Roadmap

This roadmap translates the project direction into phased implementation work. It is designed to keep core learning goals in focus while reserving advanced media features for later iterations.

## Phase 1 - Foundation and documentation alignment

### Learner outcomes

- Understand the current stack and repository structure
- Connect the module brief to a concrete project direction
- Learn how architecture decisions and roadmap planning guide implementation

### Technical goals

- Replace starter-oriented documentation with project-oriented documentation
- Confirm the baseline architecture and scope conventions
- Record Vitest as the default testing framework for future automated tests
- Identify the first functional modules and their responsibilities

### Deliverables

- Updated README with project goals and learning scope
- Main MADR describing project direction
- Roadmap document describing phased delivery
- Documented testing baseline based on Vitest

### Test expectations

- Review documentation for consistency with the current repository baseline
- Ensure Vitest is identified as the default testing framework
- Ensure core scope and stretch scope are clearly separated

### Acceptance criteria

- The repository no longer presents itself as a generic starter
- The project direction, stack choice, and sequencing rationale are documented

## Phase 2 - Core user flows and domain model

### Learner outcomes

- Build authenticated user-facing flows
- Practice typed client/server communication
- Model core application data and validation rules

### Technical goals

- Introduce `Profile`, `Catalog / Article Selection`, and `Address Form`
- Define the first real domain models and server procedures
- Use fetch and typed API access for real application data
- Organize UI logic with a lightweight MVVM approach

### Deliverables

- Authenticated profile view and edit flow
- Article listing and selection flow
- Address form with client and server validation
- Initial domain schema and related server endpoints or procedures

### Test expectations

- Add Vitest automated tests for the main happy-path flows
- Add Vitest validation tests for incorrect or incomplete address data
- Add Vitest authorization tests for protected profile actions

### Acceptance criteria

- A signed-in user can view and update profile information
- A user can browse and select an article
- Address submission is validated and rejected safely on invalid input
- Server access is protected and typed

## Phase 3 - UI quality, component library, responsiveness, and stronger validation

### Learner outcomes

- Improve implementation quality beyond functional correctness
- Learn how design systems and responsive behavior affect product delivery
- Reinforce secure and maintainable frontend patterns

### Technical goals

- Integrate a free component library
- Improve visual consistency and form usability
- Strengthen responsive behavior for mobile and desktop
- Expand state management patterns where the core flows require it
- Harden validation, error states, and access control

### Deliverables

- Refined UI for profile, catalog, and form flows
- Shared components and styling conventions
- Responsive layouts for key screens
- Improved validation and error handling behavior

### Test expectations

- Add Vitest component and integration tests for major UI states
- Add responsive scenario checks for the main screens
- Extend Vitest security-oriented tests around protected data access and invalid inputs

### Acceptance criteria

- Core screens remain usable on mobile and desktop layouts
- Shared components reduce duplication in key flows
- Error handling is visible, clear, and safe
- Validation and authorization rules are enforced consistently

## Phase 4 - Stretch features and guided extensions

### Learner outcomes

- Explore advanced browser and real-time capabilities
- Understand the extra architectural complexity introduced by rich media features
- Practice scoping optional features without destabilizing the core product

### Technical goals

- Add `Map` integration for location-based interaction
- Add camera and photo capture support
- Explore `Media Transfer` for large files such as photos and videos
- Explore `Video Chat` as an advanced real-time extension

### Deliverables

- Dynamic map proof of concept or integrated module
- Camera capture workflow for supported devices
- Media upload or transfer workflow with explicit constraints
- Video chat spike or prototype

### Test expectations

- Add Vitest targeted tests for permissions, failure states, and unsupported environments
- Add Vitest tests or documented checks for upload constraints and real-time session behavior
- Keep core flow regression coverage active while stretch features are added

### Acceptance criteria

- Stretch features remain optional and do not block completion of core scope
- Each advanced feature is introduced with explicit constraints and fallback behavior
- Core profile, catalog, and address flows continue to work after stretch additions

## Cross-phase rules

- Core features are mandatory before advanced features are treated as committed scope.
- Testing is part of every phase.
- Vitest is the default framework for automated tests across phases.
- Security work starts with the first real user flows and continues through all later phases.
- New architectural decisions should be documented with additional ADRs when they materially affect delivery or structure.
