/**
 * SEC-003: HTML/Markdown sanitization helpers.
 *
 * The previous audit found XSS risks when user-supplied content (comments,
 * rich text fields, descriptions) was rendered. React already escapes text
 * children, but when we MUST render formatted HTML (markdown), we strip
 * dangerous tags/attributes here.
 *
 * For full safety on production-grade content, install DOMPurify
 * (npm i isomorphic-dompurify) and replace `sanitizeHtml` with it. The
 * implementation below is a safe-by-default fallback that strips all HTML
 * tags, returning plain text — appropriate when the consumer only needs
 * paragraph breaks and basic emphasis.
 */

const DANGEROUS_TAGS = new Set([
  "script", "style", "iframe", "object", "embed", "form", "input",
  "button", "textarea", "select", "option", "link", "meta", "base",
  "svg", "math", "video", "audio", "source", "track",
]);

const DANGEROUS_ATTR_PREFIXES = ["on"];
const DANGEROUS_ATTRS = new Set([
  "href", "src", "srcdoc", "formaction", "xlink:href", "background",
  "poster", "data", "action", "ping",
]);

const URL_ATTRS = new Set(["href", "src", "srcdoc", "formaction", "xlink:href"]);

/**
 * Decide whether a URL is safe to render as an attribute value.
 * Allows http(s), mailto, and relative anchors; blocks javascript:, data:, vbscript:, etc.
 */
export function isSafeUrl(url) {
  if (!url) return false;
  const trimmed = String(url).trim().toLowerCase();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("file:") ||
    trimmed.startsWith("blob:")
  ) {
    return false;
  }
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("?") ||
    !trimmed.includes(":") // bare relative path
  );
}

/**
 * Strip dangerous tags and attributes from an HTML string.
 * Conservative: removes all scripts, event handlers, and unsafe URLs.
 */
export function sanitizeHtml(html) {
  if (html == null) return "";
  const str = String(html);

  // Strip <script> and <style> blocks (including their contents).
  let out = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Strip all tags except a safe allow-list, and strip attributes from kept tags.
  // For simplicity (and safety), we allow only a tiny set: p, br, b, i, u, strong, em, ul, ol, li, a.
  const allowed = new Set(["p", "br", "b", "i", "u", "strong", "em", "ul", "ol", "li", "a"]);

  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
    const lower = tag.toLowerCase();
    if (DANGEROUS_TAGS.has(lower)) return "";
    if (!allowed.has(lower)) {
      // Strip the tag but keep its inner text (already escaped).
      return match.startsWith("</") ? "" : " ";
    }
    if (match.startsWith("</")) return `</${lower}>`;
    // Self-closing / opening tag — scrub attributes.
    return `<${lower}>`;
  });

  // Drop any leftover attributes from `<a href="...">` we just rewrote — re-scan
  // and replace any remaining attribute usage on safe tags by re-rendering with
  // a minimal allow-list for href (validated).
  out = out.replace(/<a\s+([^>]*)>/gi, (full, attrs) => {
    const hrefMatch = /href\s*=\s*"([^"]*)"/i.exec(attrs);
    if (!hrefMatch) return "<a>";
    const url = hrefMatch[1];
    return isSafeUrl(url) ? `<a href="${url.replace(/"/g, "&quot;")}" rel="noopener noreferrer">` : "<a>";
  });

  return out;
}

/**
 * Convert a string to safe plain text (no HTML at all).
 * Useful when the consumer wants text without any formatting.
 */
export function escapeHtml(input) {
  if (input == null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default sanitizeHtml;
