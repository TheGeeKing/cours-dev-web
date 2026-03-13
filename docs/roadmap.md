# Implementation Roadmap

This roadmap translates the exam requirements into a delivery order that keeps the project manageable. The application is modular by design: some modules share data and user flows, while others exist primarily because they are required by the exam brief. All modules must still live inside one maintainable application and follow the same architectural rules.

## Phase 1 - Documentation reset and architecture baseline

### Learner outcomes

- Understand the repository baseline and the exam-driven project direction
- Learn how ADRs and roadmaps drive implementation choices
- Understand that `MVVM` is a required implementation rule, not an optional style

### Technical goals

- Replace starter-oriented documentation with project-oriented documentation
- Reframe the project as a modular exam application
- Record feature-based `MVVM` as a mandatory rule
- Confirm the implementation order for core and later required modules

### Deliverables

- Updated README
- Updated project-direction ADR
- New MVVM ADR
- Updated roadmap aligned with required module sequencing

### Test expectations

- Review documentation for consistency with the current repository baseline
- Ensure `Vitest` remains the default test framework
- Ensure later advanced modules are described as required later phases, not optional stretch work

### Acceptance criteria

- The repository no longer presents itself as a generic starter
- The docs describe the actual exam-driven project shape
- `MVVM` is documented as a hard rule

## Phase 2 - Engineering baseline cleanup and test harness

### Learner outcomes

- Learn how to stabilize a scaffold before feature work
- Establish a repeatable automated testing workflow

### Technical goals

- Remove starter-only UI and sample demo behavior
- Replace fragile scaffold defaults that block reliable builds
- Add a minimal app shell suitable for the project direction
- Install `Vitest` and the first automated tests

### Deliverables

- Cleaned app shell
- No sample `post` demo in the main flow
- Working `Vitest` setup with component and model/server test examples

### Test expectations

- Add one smoke test for rendering
- Add one auth or model-level test to prove the harness works

### Acceptance criteria

- The scaffold is ready for feature work
- Tests run locally and become part of the development baseline

## Phase 3 - Account module: profile and saved address

### Learner outcomes

- Build authenticated user-facing flows
- Practice strict separation between `View`, `ViewModel`, and `Model`
- Apply client and server validation to real account data

### Technical goals

- Add profile data and one saved address per user
- Protect all account mutations behind GitHub-authenticated sessions
- Define account schemas, validation rules, and typed server procedures
- Build the first full feature using feature-based `MVVM`

### Deliverables

- Account page
- Profile edit flow
- Saved address create and edit flow
- Placeholder order-history section for future order data

### Test expectations

- Add `Vitest` validation tests for invalid address data
- Add authorization tests for protected profile and address mutations
- Add happy-path tests for reading and updating account data

### Acceptance criteria

- A signed-in user can view and update account information
- A signed-in user can save one validated address
- Invalid address data is rejected safely
- The feature follows the required `MVVM` separation

## Phase 4 - Catalog, cart, checkout, and order history

### Learner outcomes

- Build a complete typed user flow across frontend, API, and database layers
- Practice state management around cart and checkout behavior
- Model transactional behavior with clear validation and persistence rules

### Technical goals

- Add a seeded catalog grid from local database data
- Add persistent cart behavior with increment, decrement, add, and remove actions
- Add checkout using the saved account address
- Add local mock payment confirmation
- Record orders and show them in account order history

### Deliverables

- Catalog listing and detail flow
- Cart interface
- Checkout screen
- Order history integrated into account

### Test expectations

- Add tests for cart mutations and quantity updates
- Add checkout success and empty-cart rejection tests
- Add order-history retrieval tests

### Acceptance criteria

- A signed-in user can browse products and manage a cart
- Checkout creates an accepted local order without an external payment gateway
- The saved address is used during checkout
- Order history is visible in the account area

## Phase 5 - UI quality, shared components, and responsiveness

### Learner outcomes

- Improve implementation quality beyond core functionality
- Learn how a component library supports consistency and speed
- Strengthen usability on desktop and mobile layouts

### Technical goals

- Integrate a free component library
- Refine navigation, forms, cards, dialogs, and feedback states
- Improve responsive behavior across account, catalog, cart, and checkout
- Reduce duplication in the core feature UI

### Deliverables

- Shared UI primitives
- Improved responsive layouts
- Better loading, empty, and error states

### Test expectations

- Add component and integration tests for major UI states
- Add responsive sanity checks for the main flows

### Acceptance criteria

- Core screens remain usable on mobile and desktop
- Shared components reduce repeated UI code
- Errors and pending states are visible and safe

## Phase 6 - Map module

### Learner outcomes

- Integrate a browser mapping feature into an existing domain model
- Understand how location data interacts with saved address information

### Technical goals

- Add a map screen using `Leaflet` and `OpenStreetMap`
- Show a saved location tied to account or order address data
- Allow simple location selection via map interaction or browser geolocation

### Deliverables

- Map screen
- Address-linked marker or coordinate flow
- Basic fallback behavior for unsupported location access

### Test expectations

- Add tests or documented checks for location permission failures
- Verify the module does not break account or checkout flows

### Acceptance criteria

- The map feature is functional and connected to address data
- Unsupported states fail safely

## Phase 7 - Camera and media transfer module

### Learner outcomes

- Work with browser media APIs and server-side file handling
- Learn when transport choices should differ between metadata and file bodies

### Technical goals

- Add camera capture support for supported browsers/devices
- Store uploaded media metadata in the application domain
- Send file bodies through a dedicated upload route
- Persist uploaded files to a writable uploads directory
- Apply moderate-size, demo-friendly upload constraints

### Deliverables

- Camera capture flow
- Media upload flow
- Media metadata records linked to users

### Test expectations

- Add tests for unsupported device and permission states
- Add validation tests for upload constraints and metadata handling

### Acceptance criteria

- A signed-in user can capture or upload supported media
- The application stores metadata and files safely for the local-first deployment model
- Failure states are visible and controlled

## Phase 8 - One-to-one video chat

### Learner outcomes

- Build a focused real-time communication feature without over-scaling complexity
- Understand the signaling and permission concerns of browser video chat

### Technical goals

- Add authenticated one-to-one room creation and join flows
- Use WebRTC for media streams
- Use app-level signaling suitable for a local-first MVP
- Provide basic in-call controls and safe failure handling

### Deliverables

- Room creation and join UI
- Basic one-to-one call interface
- Signaling and session records needed for the MVP

### Test expectations

- Add tests for room lifecycle logic
- Add permission and error-state coverage around camera and microphone access

### Acceptance criteria

- Two authenticated users can create or join a one-to-one call flow
- The feature remains limited and maintainable for the exam scope

## Cross-phase rules

- `MVVM` is mandatory across all implemented features.
- The project remains one application with multiple required modules.
- `Vitest` is the default automated test framework across phases.
- Core account and catalog flows must be completed before later required modules are treated as in scope for implementation.
- Security starts with the first authenticated features and continues through all later phases.
- Major structural or architectural changes should be captured in additional ADRs.
