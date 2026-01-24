export default function Loading() {
  return (
    <div className="p-8 space-y-6">
      {/* Title Skeleton */}
      <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />

      {/* Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 animate-pulse"
          >
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <div className="h-4 w-20 bg-green-100 dark:bg-green-900 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
