"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { useEffect, useState } from "react";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  isPublished: boolean;
  contentUrl: string | null;
  course: {
    id: string;
    title: string;
    subject: string;
  };
  _count: {
    progress: number;
  };
}

export default function LessonsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchLessons = async () => {
      try {
        setLoading(true);
        // Fetch only published lessons for students
        const response = await fetch("/api/lessons?published=true");
        
        if (!response.ok) {
          throw new Error("Failed to fetch lessons");
        }

        const data = await response.json();
        setLessons(data);
      } catch (err: any) {
        setError(err.message || "Failed to load lessons");
        console.error("Error fetching lessons:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const statusConfig = {
    completed: {
      badge: "Completed",
      color: "success",
      button: "Review",
    },
    "in-progress": {
      badge: "In Progress",
      color: "warning",
      button: "Continue",
    },
    "not-started": {
      badge: "Not Started",
      color: "danger",
      button: "Start",
    },
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Lessons</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Continue your learning journey with our comprehensive lessons
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading lessons...</p>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Error Loading Lessons
                  </h3>
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && lessons.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Lessons Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Check back later for new learning content
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Lessons Table/List */}
            {!loading && !error && lessons.length > 0 && (
              <>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Lesson
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Course
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Subject
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Duration
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {lessons.map((lesson, index) => (
                            <tr
                              key={lesson.id}
                              className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {lesson.title}
                                    </p>
                                    {lesson.description && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                {lesson.course.title}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline">
                                  {lesson.course.subject}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                {lesson.duration} min
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // Navigate to lesson detail or start lesson
                                    if (lesson.contentUrl) {
                                      window.open(lesson.contentUrl, '_blank');
                                    } else {
                                      router.push(`/lessons/${lesson.id}`);
                                    }
                                  }}
                                >
                                  Start Lesson
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {lessons.length}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Total Lessons</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {lessons.filter(l => l.contentUrl).length}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">With Content</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {lessons.reduce((sum, l) => sum + l.duration, 0)}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Total Minutes</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
