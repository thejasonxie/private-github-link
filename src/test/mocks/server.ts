import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Create MSW server with default handlers
export const server = setupServer(...handlers);
