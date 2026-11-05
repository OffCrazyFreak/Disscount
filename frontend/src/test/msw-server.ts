import { setupServer } from "msw/node";

// Starts with no handlers: each test declares the endpoints it expects with
// server.use(), and setup.ts fails any request nobody declared.
export const server = setupServer();
