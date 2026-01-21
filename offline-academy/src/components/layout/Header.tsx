"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";

export default function Header() {
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useUI();

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group transition-all">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
              O
            </div>
            <span className="text-2xl font-bold tracking-tight text-gradient">OfflineAcad</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            <Link href="/" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/dashboard" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Dashboard
                </Link>
                <Link href="/courses" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Courses
                </Link>
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all group overflow-hidden"
              title="Toggle theme"
            >
              <div className="relative z-10 text-xl group-hover:rotate-12 transition-transform">
                {theme === "light" ? "🌙" : "☀️"}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Welcome back,</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{user}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all font-bold text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-bold text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all font-bold text-sm hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}