/**
 * Global constants for the application
 */
import { domains } from "../../domains.config";

// Domain configuration (re-exported from shared config)
export const APP_DOMAIN = domains.app;
export const LANDING_DOMAIN = domains.landing;

// Cache durations (in milliseconds)
export const CACHE_FIVE_MINUTES = 5 * 60 * 1000;
export const CACHE_TEN_MINUTES = 10 * 60 * 1000;

// Request timeouts (in milliseconds)
export const API_REQUEST_TIMEOUT = 5000;
export const LOADER_TIMEOUT = 8000;

// UI feedback durations (in milliseconds)
export const CLIPBOARD_FEEDBACK_DURATION = 2000;

// API pagination defaults
export const BRANCHES_PER_PAGE = 100;
export const CONTRIBUTORS_PER_PAGE = 10;
export const INITIAL_CONTRIBUTORS_COUNT = 1;
export const COMMITS_PER_PAGE = 30;
