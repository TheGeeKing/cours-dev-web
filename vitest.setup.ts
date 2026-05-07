import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.BETTER_AUTH_GITHUB_CLIENT_ID ??= "test-client-id";
process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET ??= "test-client-secret";
process.env.DATABASE_URL ??= "file:./db.sqlite";

vi.mock("server-only", () => ({}));
