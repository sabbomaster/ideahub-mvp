const defaultSiteUrl = "https://ideahub.jp";

export function getSiteUrl() {
  const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl).replace(/\/$/, "");

  if (configuredSiteUrl.includes(".vercel.app")) {
    return defaultSiteUrl;
  }

  return configuredSiteUrl;
}

export function isLocalOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function getAppOrigin(currentOrigin?: string) {
  if (currentOrigin && isLocalOrigin(currentOrigin)) {
    return currentOrigin.replace(/\/$/, "");
  }

  return getSiteUrl();
}

export function getAuthCallbackUrl(currentOrigin?: string) {
  return `${getAppOrigin(currentOrigin)}/auth/callback`;
}
