"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { toast } from "react-hot-toast";
import DeleteModal from "@/components/DeleteModal";

interface Course {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  level: string;
  image: string | null;
  isPublished: boolean;
  _count: {
    lessons: number;
    enrollments: number;
  };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; courseId: string; title: string }>({
    isOpen: false,
    courseId: "",
    title: "",
  });
  const router = useRouter();

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/courses/${deleteModal.courseId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete course");

      toast.success("Course deleted successfully");
      setDeleteModal({ isOpen: false, courseId: "", title: "" });
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const togglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!res.ok) throw new Error("Failed to update course");

      toast.success(`Course ${!currentStatus ? "published" : "unpublished"}`);
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const levelColors: Record<string, string> = {
    BEGINNER: "success",
    INTERMEDIATE: "warning",
    ADVANCED: "danger",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⚙️</div>
          <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manage Courses 📚
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create, edit, and manage all your courses
            </p>
          </div>
          <Link href="/admin/courses/new">
            <Button className="flex items-center gap-2">
              <span>➕</span> Create New Course
            </Button>
          </Link>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Courses Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by creating your first course
              </p>
              <Link href="/admin/courses/new">
                <Button>Create Course</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-all">
                <div className="h-32 bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-6xl">
                  {course.image || "📚"}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <Badge variant={levelColors[course.level] as any}>
                      {course.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {course.subject}
                  </p>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {course.description || "No description"}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Lessons:</span>
                      <span className="ml-1 font-semibold">{course._count.lessons}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Enrolled:</span>
                      <span className="ml-1 font-semibold">{course._count.enrollments}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <Badge variant={course.isPublished ? "success" : "warning"}>
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/admin/courses/${course.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublish(course.id, course.isPublished)}
                    >
                      {course.isPublished ? "📝" : "✅"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        setDeleteModal({ isOpen: true, courseId: course.id, title: course.title })
                      }
                    >
                      🗑️
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone and will delete all associated lessons.`}
        onClose={() => setDeleteModal({ isOpen: false, courseId: "", title: "" })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
