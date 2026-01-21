"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useEffect } from "react";

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  // Sample data
  const stats = [
    { label: "Courses Enrolled", value: "12", icon: "📚", color: "from-blue-500 to-indigo-600" },
    { label: "Hours Learned", value: "48.5", icon: "⏱️", color: "from-purple-500 to-pink-600" },
    { label: "Lessons Completed", value: "156", icon: "✅", color: "from-green-500 to-emerald-600" },
    { label: "Upcoming Tests", value: "3", icon: "📝", color: "from-orange-500 to-red-600" },
  ];

  const courses = [
    {
      id: 1,
      title: "Mathematics Fundamentals",
      progress: 65,
      lessons: "24/36",
      subject: "Mathematics",
    },
    {
      id: 2,
      title: "English Language Arts",
      progress: 42,
      lessons: "15/36",
      subject: "Language Arts",
    },
    {
      id: 3,
      title: "Science Basics",
      progress: 78,
      lessons: "28/36",
      subject: "Science",
    },
    {
      id: 4,
      title: "History & Geography",
      progress: 55,
      lessons: "20/36",
      subject: "Social Studies",
    },
  ];

  const recentActivity = [
    { type: "lesson", title: "Completed: Quadratic Equations", time: "2 hours ago", subject: "Math" },
    { type: "test", title: "Scored 85% on Chapter 5 Quiz", time: "1 day ago", subject: "Science" },
    { type: "lesson", title: "Started: British Literature", time: "2 days ago", subject: "English" },
    { type: "achievement", title: "Earned: Math Champion Badge", time: "3 days ago", subject: "Achievement" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's your learning dashboard. Keep up the great work!
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`text-3xl p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                      {stat.icon}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Courses Section */}
              <div className="lg:col-span-2">
                <Card className="mb-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>My Courses</CardTitle>
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className="p-4 border rounded-lg hover:border-indigo-400 transition dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {course.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {course.subject} • {course.lessons} Lessons
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className="bg-gradient-to-r from-indigo-600 to-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            {course.progress}% Complete
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, idx) => (
                        <div key={idx} className="pb-4 border-b dark:border-gray-700 last:border-b-0">
                          <div className="flex gap-3">
                            <span className="text-xl">
                              {activity.type === "lesson"
                                ? "✏️"
                                : activity.type === "test"
                                ? "📝"
                                : "🏆"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {activity.title}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {activity.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Offline Reading Section */}
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📡</span>
                    <CardTitle>Offline Content</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                    Online
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Cached Courses</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">8/12</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-900 dark:text-green-200">Storage Used</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">2.4 GB</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-200">Last Sync</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">2 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
