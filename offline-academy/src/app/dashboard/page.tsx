/* eslint-disable react-hooks/purity */
export default async function DashboardPage() {
  // Simulate network latency to demonstrate loading.tsx
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Simulate server failure to demonstrate error.tsx
  // Note: Using impure function for demonstration purposes only
  const shouldError = Date.now() % 2 === 0;

  if (shouldError) {
    throw new Error("Failed to connect to the Learning Management System (500).");
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-2">Lesson {i}: React Fundamentals</h2>
            <p className="text-gray-500 mb-4">Duration: 45 mins - Offline Ready</p>
            <span className="text-green-600 font-medium">Completed</span>
          </div>
        ))}
      </div>
    </div>
  );
}
