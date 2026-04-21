// Returns the redirect target only if it is a safe same-origin path.
// Rejects absolute URLs, protocol-relative URLs ("//evil.com"), and malformed paths.
export function isSafeRedirect(url) {
  if (typeof url !== 'string' || url.length === 0) return false;
  // Must start with a single slash, not two (// is protocol-relative)
  if (!url.startsWith('/') || url.startsWith('//')) return false;
  // Reject backslash tricks and control chars
  if (/[\\\t\n\r\0]/.test(url)) return false;
  return true;
}

export function safeRedirectOr(url, fallback = '/') {
  return isSafeRedirect(url) ? url : fallback;
}
