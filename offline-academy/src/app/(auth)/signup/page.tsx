"use client";
import { useState, FormEvent, ChangeEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "ADMIN">("STUDENT");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    toast.loading("Creating account...");
    
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Signup failed");
      }

      toast.dismiss();
      toast.success("Account created successfully!");

      // Login user with returned data
      login({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      });

      // Redirect based on role
      router.push(result.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (error: any) {
      toast.dismiss();
      const errorMessage = error.message || "Signup failed. Please try again.";
      
      // Check if it's a database connection error
      if (errorMessage.includes("database") || errorMessage.includes("reach")) {
        setError("Database is currently unavailable. Please wait a moment and try again.");
        toast.error("Database connection issue. Retrying...", { duration: 4000 });
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-xl group-hover:scale-110 transition-transform">
              O
            </div>
            <span className="text-3xl font-black tracking-tight text-gradient">
              OfflineAcad
            </span>
          </Link>
        </div>

        {/* Signup Card */}
        <Card className="card-premium !p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-2 bg-gradient-to-r from-indigo-600 to-blue-600"></div>
          <CardHeader className="p-8 pb-0 border-none">
            <CardTitle className="text-3xl font-black text-center">Create Account</CardTitle>
            <p className="text-center text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Join 50,000+ students learning offline
            </p>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                className="!bg-gray-50 dark:!bg-gray-900/50 border-none focus:ring-2 focus:ring-indigo-500"
              />

              <Input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="!bg-gray-50 dark:!bg-gray-900/50 border-none focus:ring-2 focus:ring-indigo-500"
              />

              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="!bg-gray-50 dark:!bg-gray-900/50 border-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  I am signing up as
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("STUDENT")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      role === "STUDENT"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-400"
                    }`}
                  >
                    <div className="text-4xl mb-2">🎓</div>
                    <div className="text-base font-bold">Student</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Learn courses</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("ADMIN")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      role === "ADMIN"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-400"
                    }`}
                  >
                    <div className="text-4xl mb-2">👑</div>
                    <div className="text-base font-bold">Admin</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage platform</div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 animate-pulse">
                  <p className="text-red-700 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </p>
                </div>
              )}

              <Button type="submit" isLoading={isLoading} className="w-full !py-4 !rounded-xl shadow-lg shadow-indigo-500/25 text-lg font-black">
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-400">
                  Or
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 px-4 leading-relaxed">
              By creating an account, you agree to our <Link href="/" className="text-indigo-600 font-bold">Terms of Service</Link> and <Link href="/" className="text-indigo-600 font-bold">Privacy Policy</Link>.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 dark:text-gray-400 mt-10 font-medium">
          Already have an account?{" "}
          <Link href="/login" className="font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
