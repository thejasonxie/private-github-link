import * as Sentry from '@sentry/tanstackstart-react'

// Sentry DSN from environment variables
// - Local dev: loaded from .env.local via dotenv
// - Deployed: injected by SST from secrets
const sentryDsn = process.env.SENTRY_DSN ?? process.env.VITE_SENTRY_DSN

if (!sentryDsn) {
  console.warn('[Sentry] No DSN configured. Sentry is not running.')
} else {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
    // Adjust sample rates for production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  })
}
