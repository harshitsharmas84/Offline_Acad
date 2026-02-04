"use client";
import { useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Role } from "@prisma/client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";

export default function AdminDashboard() {
  const adminStats = [
    { label: "Total Courses", value: "12", icon: "📚", color: "indigo", link: "/admin/courses" },
    { label: "Total Lessons", value: "156", icon: "✏️", color: "green", link: "/admin/lessons" },
    { label: "Active Students", value: "2,547", icon: "👥", color: "purple", link: "/admin/users" },
    { label: "Enrollments", value: "8,231", icon: "📊", color: "yellow", link: "/admin/enrollments" },
  ];

  const quickActions = [
    { label: "Create Course", href: "/admin/courses/new", icon: "➕", color: "bg-indigo-600" },
    { label: "Create Lesson", href: "/admin/lessons/new", icon: "✍️", color: "bg-green-600" },
    { label: "Manage Users", href: "/admin/users", icon: "👤", color: "bg-purple-600" },
    { label: "View Reports", href: "/admin/reports", icon: "📈", color: "bg-yellow-600" },
  ];

  const recentActivity = [
    { action: "New course created", course: "Advanced React Patterns", time: "2 hours ago", icon: "📚" },
    { action: "Lesson published", course: "JavaScript Basics - Lesson 5", time: "4 hours ago", icon: "✅" },
    { action: "New student enrolled", course: "Python for Beginners", time: "6 hours ago", icon: "👤" },
    { action: "Course updated", course: "Data Structures", time: "1 day ago", icon: "✏️" },
  ];

  return (
    <RoleGuard 
      allowedRoles={[Role.ADMIN]} 
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need Admin privileges to access this area.
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard 🎓
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage courses, lessons, and monitor platform activity
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {adminStats.map((stat) => (
              <Link key={stat.label} href={stat.link}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </p>
                      </div>
                      <div className="text-4xl opacity-50">{stat.icon}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>⚡ Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href}>
                    <button
                      className={`${action.color} text-white p-6 rounded-lg w-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col items-center gap-2`}
                    >
                      <span className="text-3xl">{action.icon}</span>
                      <span className="font-semibold">{action.label}</span>
                    </button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <span className="text-2xl">{activity.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.course}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Management Links */}
            <Card>
              <CardHeader>
                <CardTitle>🛠️ Management Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/courses">
                  <Button className="w-full justify-start" variant="outline">
                    📚 Manage Courses
                  </Button>
                </Link>
                <Link href="/admin/lessons">
                  <Button className="w-full justify-start" variant="outline">
                    ✏️ Manage Lessons
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button className="w-full justify-start" variant="outline">
                    👥 Manage Users
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button className="w-full justify-start" variant="outline">
                    ⚙️ Platform Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
