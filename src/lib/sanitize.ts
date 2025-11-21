// DOMPurify-based sanitizer. Falls back to basic escaping on server.
import DOMPurify from 'dompurify';

// On the server (SSR) DOMPurify may not have DOM; fallback to escape only.
function fallbackEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function sanitizeText(input: string): string {
  const withBreaks = input.replace(/\r\n|\n/g, '<br/>');
  if (typeof window === 'undefined') {
    // Server-side render path
    return fallbackEscape(withBreaks);
  }
  return DOMPurify.sanitize(withBreaks, {
    ALLOWED_TAGS: ['br'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'canvas'],
  });
}
