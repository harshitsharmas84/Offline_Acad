/**
 * OWASP Security Example: Secure User Profile Component
 * 
 * This component demonstrates best practices for displaying user-generated content
 * while protecting against XSS and other security vulnerabilities.
 */

import React from "react";
import { SafeText, SafeHtml, renderSafeContent } from "@/lib/safe-render";

/**
 * Example User Profile Component
 * Shows how to safely render various types of user content
 */
interface UserProfileExampleProps {
  user: {
    name: string;
    email: string;
    role: "admin" | "user";
    bio?: string;
    website?: string;
    joinDate: string;
  };
}

export function UserProfileExample({ user }: UserProfileExampleProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">
        {/* ✅ SAFE: SafeText automatically escapes HTML */}
        <SafeText text={user.name} />
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* ✅ SAFE: Email as plain text */}
        <div>
          <label className="text-sm font-medium text-gray-600">Email</label>
          <p className="mt-1">
            <SafeText text={user.email} />
          </p>
        </div>

        {/* ✅ SAFE: Role badge */}
        <div>
          <label className="text-sm font-medium text-gray-600">Role</label>
          <p className="mt-1 capitalize font-medium">{user.role}</p>
        </div>

        {/* ✅ SAFE: Date string */}
        <div>
          <label className="text-sm font-medium text-gray-600">
            Joined
          </label>
          <p className="mt-1">{new Date(user.joinDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* ✅ SAFE: Bio with HTML support (sanitized) */}
      {user.bio && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600">Bio</label>
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <SafeHtml html={user.bio} className="text-gray-700 prose prose-sm" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Safe Comment Display
 * Shows how to handle user-generated comments with formatting
 */
interface CommentExampleProps {
  comment: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
  };
}

export function CommentExample({ comment }: CommentExampleProps) {
  return (
    <div className="border-l-4 border-blue-500 pl-4 py-3">
      <div className="flex justify-between items-start mb-2">
        {/* ✅ SAFE: Author name escaped */}
        <strong className="text-sm">
          <SafeText text={comment.author} />
        </strong>
        <span className="text-xs text-gray-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* ✅ SAFE: Comment content with HTML rendering (sanitized) */}
      <div className="text-sm text-gray-700">
        <SafeHtml html={comment.content} />
      </div>
    </div>
  );
}

/**
 * Example: Form with Sanitization
 * Shows how to handle form submission securely
 */
interface CreateCommentFormProps {
  onSubmit: (data: { title: string; content: string }) => Promise<void>;
}

export function CreateCommentFormExample({
  onSubmit,
}: CreateCommentFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 🔒 Form data is sanitized on the server
      // No need to sanitize here - API will handle it
      await onSubmit({ title, content });
      setTitle("");
      setContent("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="Enter title"
          disabled={isLoading}
          // 🔒 React prevents XSS - input value is safe
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-1">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded h-32"
          placeholder="Enter content (supports: bold, italic, links)"
          disabled={isLoading}
          // 🔒 React prevents XSS - textarea content is safe
        />
        <p className="text-xs text-gray-500 mt-1">
          Supports: &lt;b&gt;, &lt;i&gt;, &lt;a href=...&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !title || !content}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isLoading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

/**
 * Example: Search Results with User Input
 * Shows how to safely display search queries
 */
interface SearchResultsExampleProps {
  query: string;
  results: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

export function SearchResultsExample({
  query,
  results,
}: SearchResultsExampleProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        {/* ✅ SAFE: Query is automatically escaped */}
        Search results for "{query}"
      </h2>

      {results.length === 0 ? (
        <p className="text-gray-500">
          No results found for{" "}
          <SafeText text={query} className="font-mono" />
        </p>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.id} className="border rounded p-4">
              {/* ✅ SAFE: Result title escaped */}
              <h3 className="font-medium mb-2">
                <SafeText text={result.title} />
              </h3>
              {/* ✅ SAFE: Result description - supports formatting */}
              <SafeHtml
                html={result.description}
                className="text-sm text-gray-600"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ATTACK SCENARIOS AND HOW THIS COMPONENT PROTECTS
 */

/**
 * SCENARIO 1: Stored XSS in User Name
 * 
 * Attacker submits:
 * name = "<img src=x onerror='fetch(\"/admin?delete=1\")'>"
 * 
 * Without Protection (old code):
 * <h1 dangerouslySetInnerHTML={{ __html: name }} />
 * ❌ XSS executes: fetch request sent to /admin?delete=1
 * 
 * With Protection (this code):
 * <SafeText text={name} />
 * ✅ Result: Renders "&lt;img src=x onerror='...'&gt;"
 * ✅ No fetch happens, user name safely displayed
 */

/**
 * SCENARIO 2: XSS in Comment Content
 * 
 * Attacker submits:
 * content = "<p>Check this: <script>document.location='https://phishing.site'</script></p>"
 * 
 * Without Protection:
 * <div dangerouslySetInnerHTML={{ __html: content }} />
 * ❌ All users viewing redirected to phishing site
 * 
 * With Protection:
 * <SafeHtml html={content} />
 * ✅ <script> tag removed by sanitizer
 * ✅ Only <p>Check this:</p> rendered
 * ✅ No redirection happens
 */

/**
 * SCENARIO 3: Event Handler Injection
 * 
 * Attacker submits:
 * bio = "<div onmouseover='fetch(\"/api/private\")'>"
 * 
 * Without Protection:
 * <div dangerouslySetInnerHTML={{ __html: bio }} />
 * ❌ Fetch request triggers when user hovers (CSRF attack)
 * 
 * With Protection:
 * <SafeHtml html={bio} />
 * ✅ onmouseover attribute removed by sanitizer
 * ✅ Only <div> rendered without event handler
 * ✅ No unwanted requests made
 */

/**
 * SCENARIO 4: JavaScript Protocol Injection
 * 
 * Attacker submits in bio:
 * "<a href='javascript:alert(\"xss\")'>Click me</a>"
 * 
 * Without Protection:
 * <div dangerouslySetInnerHTML={{ __html: bio }} />
 * ❌ Clicking link executes JavaScript
 * 
 * With Protection:
 * <SafeHtml html={bio} />
 * ✅ javascript: protocol detected and removed
 * ✅ Renders: "<a>Click me</a>"
 * ✅ Clicking link does nothing
 */

/**
 * SCENARIO 5: SVG-based XSS
 * 
 * Attacker submits:
 * content = "<svg onload='window.location=\"https://evil.com\"'></svg>"
 * 
 * Without Protection:
 * <div dangerouslySetInnerHTML={{ __html: content }} />
 * ❌ User redirected to evil.com on page load
 * 
 * With Protection:
 * <SafeHtml html={content} />
 * ✅ SVG tag completely removed (not in allowed tags)
 * ✅ Nothing rendered, no redirection
 */

export default UserProfileExample;
