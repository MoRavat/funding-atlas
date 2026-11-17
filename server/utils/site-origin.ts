export function siteOrigin(event) {
  return new URL(useRuntimeConfig(event).public.siteUrl || getRequestURL(event).origin).origin
}
