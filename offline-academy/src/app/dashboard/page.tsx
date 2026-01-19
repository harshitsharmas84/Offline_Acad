export default function DashboardPage() {
  return (
    <main className="flex flex-col items-center mt-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">
        Only authenticated users can access this page.
      </p>
    </main>
  );
}
