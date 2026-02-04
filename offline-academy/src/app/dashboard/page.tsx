"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import FileUpload from "@/components/FileUpload";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, ProgressBar } from "@/components/ui";
import Link from "next/link";
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

  const recentLessons = [
    { id: 1, title: "React Fundamentals", subject: "Computer Science", progress: 100, status: "completed", icon: "⚛️" },
    { id: 2, title: "Advanced Algebra", subject: "Mathematics", progress: 65, status: "in-progress", icon: "📐" },
    { id: 3, title: "Cellular Biology", subject: "Science", progress: 80, status: "in-progress", icon: "🔬" },
    { id: 4, title: "Essay Writing", subject: "English", progress: 45, status: "in-progress", icon: "✍️" },
  ];

  const quickStats = [
    { label: "Courses Enrolled", value: "6", icon: "📚", color: "indigo" },
    { label: "Completed Lessons", value: "42", icon: "✅", color: "green" },
    { label: "Learning Hours", value: "38.5", icon: "⏱️", color: "purple" },
    { label: "Achievements", value: "12", icon: "🏆", color: "yellow" },
  ];

  const upcomingLessons = [
    { id: 1, title: "Introduction to Physics", time: "Today, 3:00 PM", icon: "⚡" },
    { id: 2, title: "World Geography", time: "Tomorrow, 10:00 AM", icon: "🌍" },
    { id: 3, title: "Spanish Basics", time: "Wed, 2:00 PM", icon: "🇪🇸" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome back, {user?.name || "Student"}! 👋
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ready to continue your learning journey?
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      All systems online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {quickStats.map((stat) => (
                <Card key={stat.label} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                        <p className={`text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className="text-4xl opacity-50">{stat.icon}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Lessons - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                {/* Continue Learning */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Continue Learning</CardTitle>
                      <Link href="/lessons">
                        <Button variant="outline" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="p-4 rounded-lg border dark:border-gray-700 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800"
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-3xl">{lesson.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {lesson.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {lesson.subject}
                                  </p>
                                </div>
                                <Badge variant={lesson.status === "completed" ? "success" : "warning"}>
                                  {lesson.status === "completed" ? "Completed" : "In Progress"}
                                </Badge>
                              </div>
                              <ProgressBar value={lesson.progress} size="sm" />
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {lesson.progress}% complete
                                </span>
                                <Button size="sm">
                                  {lesson.status === "completed" ? "Review" : "Continue"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* File Upload Module */}
                <Card>
                  <CardHeader>
                    <CardTitle>📁 Upload Learning Materials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUpload />
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Takes 1 column */}
              <div className="space-y-6">
                {/* Upcoming Lessons */}
                <Card>
                  <CardHeader>
                    <CardTitle>📅 Upcoming Lessons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{lesson.icon}</span>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {lesson.title}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {lesson.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Streak */}
                <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
                  <CardHeader>
                    <CardTitle className="text-orange-900 dark:text-orange-200">
                      🔥 Learning Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">7</p>
                      <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                        Days in a row
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-3">
                        Keep going! You're doing great! 🎉
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>⚡ Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/courses">
                      <Button className="w-full justify-start" variant="outline">
                        📚 Browse Courses
                      </Button>
                    </Link>
                    <Link href="/progress">
                      <Button className="w-full justify-start" variant="outline">
                        📈 View Progress
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button className="w-full justify-start" variant="outline">
                        ⚙️ Settings
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
