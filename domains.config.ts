/**
 * Domain configuration - single source of truth
 * Used by both SST (deploy-time) and the app (runtime)
 */
export const domains = {
  app: "share-github.com",
  landing: "privategithub.link",
} as const;
