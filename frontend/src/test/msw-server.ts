import { setupServer } from "msw/node";

// No handlers: each test declares its endpoints with server.use(), and setup.ts fails any request nobody declared.
export const server = setupServer();
