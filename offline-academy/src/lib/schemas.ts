import { z } from "zod";

// 1. Auth Schema (Shared between Login Form & API)
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// 2. Lesson Schema (For Teachers creating content)
export const lessonSchema = z.object({
  title: z.string().min(3, "Title too short").max(100),
  description: z.string().optional(),
  duration: z.number().positive("Duration must be positive (minutes)"),
  isOfflineAvailable: z.boolean().default(false),
});

// 3. Export Types (Auto-generated from Zod)
export type LoginInput = z.infer<typeof loginSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
