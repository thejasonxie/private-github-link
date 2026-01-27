import { defineEventHandler, getRequestHost, sendRedirect } from "h3";
import { domains } from "../../domains.config";

/**
 * Middleware to redirect non-landing routes from the landing domain to the app domain.
 * Landing domain should only serve the index page (/).
 */
export default defineEventHandler((event) => {
  const host = getRequestHost(event, { xForwardedHost: true });
  const path = event.path;

  // Check if we're on the landing domain
  const isLandingDomain =
    host === domains.landing ||
    host === `www.${domains.landing}` ||
    host?.endsWith(`.${domains.landing}`);

  if (!isLandingDomain) {
    return; // Continue normally for app domain
  }

  // Allow the landing page (index) and static assets
  const isLandingPage = path === "/" || path === "";
  const isStaticAsset =
    path.startsWith("/assets/") ||
    path.startsWith("/_build/") ||
    path.startsWith("/favicon") ||
    path.endsWith(".css") ||
    path.endsWith(".js") ||
    path.endsWith(".woff2") ||
    path.endsWith(".png") ||
    path.endsWith(".svg") ||
    path.endsWith(".ico");

  if (isLandingPage || isStaticAsset) {
    return; // Allow these requests on landing domain
  }

  // Redirect all other routes to the app domain
  const redirectUrl = `https://${domains.app}${path}`;
  return sendRedirect(event, redirectUrl, 302);
});
