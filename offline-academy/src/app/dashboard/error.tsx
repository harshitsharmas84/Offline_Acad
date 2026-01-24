"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an observability service (e.g., Sentry)
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-4">
        <svg
          className="w-12 h-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Something went wrong!
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
        We couldn&apos;t load your dashboard. This might be a temporary connection issue.
        <br />
        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-2 inline-block">
          Error: {error.message}
        </span>
      </p>

      <button
        onClick={() => reset()} // Attempts to re-render the segment
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
