/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "private-github-link",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
       providers: {
        aws: {
          profile: 'jasonxie-prod',
        },
      },
    };
  },
  async run() {
    const { domains } = await import("./domains.config");

    // Sentry DSN secret for error tracking
    const sentryDsn = new sst.Secret('SentryDsn')

    // PostHog API key for analytics
    const posthogApiKey = new sst.Secret('PosthogApiKey')

    const isProduction = $app.stage === 'production'

    new sst.aws.TanStackStart('PrivateGithubLink', {
      path: '.',
      link: [sentryDsn, posthogApiKey],
      domain: isProduction
        ? {
            name: domains.app,
            redirects: [`www.${domains.app}`],
            aliases: [domains.landing, `www.${domains.landing}`],
          }
        : undefined,
      environment: {
        // Client-side Sentry DSN (VITE_ prefix exposes to browser)
        VITE_SENTRY_DSN: sentryDsn.value,
        // Server-side Sentry DSN
        SENTRY_DSN: sentryDsn.value,
        // PostHog API key for analytics (client-side)
        VITE_POSTHOG_API_KEY: posthogApiKey.value,
      },
    })
  },
});

