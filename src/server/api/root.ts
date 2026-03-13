import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * Primary router for the application API.
 *
 * Feature routers will be added here as the real modules land.
 */
export const appRouter = createTRPCRouter({});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
