# 0003 - Visio Signaling Over SSE

- Status: Accepted
- Date: 2026-04-03

## Context

The `/visio` module needs a maintainable one-to-one video chat flow inside the
existing Next.js, Drizzle, and Better Auth application. Media transport should
use WebRTC, but WebRTC still requires an application-managed signaling channel to
exchange offers, answers, ICE candidates, and room lifecycle events.

The project already runs as one local-first application with HTTP route handlers
and SQLite-backed feature state. Adding a dedicated WebSocket server would
increase operational and architectural complexity for the exam MVP.

## Decision

The project will use:

- WebRTC for audio and video media streams
- Next.js route handlers for room lifecycle mutations and signaling writes
- Server-Sent Events (SSE) for one-way live room event delivery to each
  participant
- Drizzle-backed room, participant, and event records as the source of truth

The signaling flow is intentionally simple:

- clients `POST` signaling payloads and room actions into the app
- the app persists ordered room events
- each participant receives new events through an authenticated SSE stream

## Consequences

### Positive consequences

- The feature stays inside the existing application architecture.
- The signaling layer remains inspectable and testable with normal HTTP tooling.
- MVVM boundaries stay clear: routes and views orchestrate, while domain rules
  stay in the visio model layer.

### Tradeoffs

- SSE is not a full duplex transport, so outgoing and incoming flows are split
  across `POST` and `GET`.
- Route-handler streaming plus polling is less scalable than a dedicated
  realtime service, but acceptable for a one-to-one local-first MVP.
- TURN support still depends on runtime ICE server configuration, even though the
  app is structured to accept it cleanly.

## Alternatives considered

### Dedicated WebSocket signaling service

Rejected for the MVP because it adds a second realtime runtime surface and more
deployment complexity than the exam scope needs.

### Polling-only HTTP signaling

Rejected because participant reactions would feel slower and less natural than a
streamed event channel.
