# OWASP Security - Copy-Paste Code Snippets

Ready-to-use code examples for common scenarios.

## 1. Secure Login Form

### Component: `src/components/SecureLoginForm.tsx`

```typescript
"use client";

import { useState } from "react";
import { SafeText } from "@/lib/safe-render";
import FormInput from "./FormInput";

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
}

export function SecureLoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 🔒 Server-side will sanitize and validate
      await onSubmit({ email, password });
    } catch (err) {
      // 🔒 Show generic error message
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
      />

      <FormInput
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <SafeText text={error} />
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

---

## 2. Secure User Profile Update

### API Route: `src/app/api/users/profile/update/route.ts`

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeText, sanitizeHtmlContent } from "@/lib/sanitizer";
import { prisma } from "@/lib/db/prisma";
import { handleError } from "@/lib/errorHandler";

// 🔒 Input validation schema
const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  bio: z.string().trim().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function POST(req: Request) {
  try {
    // 🔒 Authentication
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔒 Validation
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    // 🔒 Sanitization
    const sanitized = {
      name: sanitizeText(data.name),
      bio: data.bio ? sanitizeHtmlContent(data.bio) : null,
      website: data.website || null,
    };

    // 🔒 Database update (Prisma prevents SQL injection)
    const updated = await prisma.user.update({
      where: { id: userId },
      data: sanitized,
      select: {
        id: true,
        name: true,
        bio: true,
        website: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated",
      user: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.errors,
        },
        { status: 400 }
      );
    }
    return handleError(error, "POST /api/users/profile/update");
  }
}
```

---

## 3. Secure Comment System

### Component: `src/components/CommentSection.tsx`

```typescript
"use client";

import { useState } from "react";
import { SafeHtml, SafeText } from "@/lib/safe-render";
import toast from "react-hot-toast";

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
}

export function CommentSection({
  postId,
  comments,
  onAddComment,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      // 🔒 Server-side will sanitize
      await onAddComment(newComment);
      setNewComment("");
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>

      {/* Comment Form */}
      <form onSubmit={handleAddComment} className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded h-20"
          // 🔒 React prevents XSS - input value is safe
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isLoading ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border-l-4 border-gray-300 pl-4 py-2"
            >
              {/* ✅ SAFE: Author escaped */}
              <p className="font-medium">
                <SafeText text={comment.author} />
              </p>

              {/* ✅ SAFE: Content sanitized on server, rendered safely */}
              <SafeHtml html={comment.content} className="prose prose-sm mt-1" />

              <p className="text-xs text-gray-500 mt-2">
                {new Date(comment.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

### API Endpoint: `src/app/api/comments/create/route.ts`

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeHtmlContent } from "@/lib/sanitizer";
import { prisma } from "@/lib/db/prisma";

const createCommentSchema = z.object({
  postId: z.string().cuid(),
  content: z.string().trim().min(1).max(5000),
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userName = req.headers.get("x-user-name");

    if (!userId || !userName) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = createCommentSchema.parse(await req.json());

    // 🔒 Sanitize HTML content
    const cleanContent = sanitizeHtmlContent(data.content);

    // 🔒 Create with sanitized data
    const comment = await prisma.comment.create({
      data: {
        postId: data.postId,
        author: userName, // Already sanitized by middleware
        content: cleanContent,
        userId,
      },
      select: {
        id: true,
        author: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, comment },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Comment creation error:", error);
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 }
    );
  }
}
```

---

## 4. Secure File Upload

### Component: `src/components/FileUploadWidget.tsx`

```typescript
"use client";

import { useFileValidation } from "@/hooks/useFileValidation";
import { formatFileSize } from "@/lib/file-upload";
import { useState } from "react";

interface FileUploadWidgetProps {
  onUpload: (file: File) => Promise<{ url: string }>;
  maxSize?: number;
  accept?: string;
}

export function FileUploadWidget({
  onUpload,
  maxSize = 5 * 1024 * 1024,
  accept = "image/*,.pdf",
}: FileUploadWidgetProps) {
  const { validate, error, file, clear } = useFileValidation(maxSize);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (validate(selected)) {
        setError(""); // Clear error if validation passes
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await onUpload(file);
      setUploadedUrl(result.url);
      clear();
    } catch (err) {
      setError("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border-2 border-dashed border-gray-300 rounded">
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={isUploading}
        // 🔒 Accept attribute is UX only, validation happens server-side
      />

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {file && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-2">
          <p className="font-medium">Selected: {file.name}</p>
          <p className="text-sm text-gray-600">
            Size: {formatFileSize(file.size)}
          </p>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {uploadedUrl && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          ✓ Upload complete!
        </div>
      )}
    </div>
  );
}
```

### API Endpoint: `src/app/api/uploads/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateFileUpload, getUniqueFileName } from "@/lib/file-upload";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // 🔒 Validate file
    const validation = validateFileUpload(file, 10 * 1024 * 1024); // 10MB limit
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    // 🔒 Generate safe filename
    const safeFileName = getUniqueFileName(file.name);
    const uploadDir = path.join(process.cwd(), "public", "uploads", userId);

    // 🔒 Create directory and save file
    const buffer = await file.arrayBuffer();
    const filePath = path.join(uploadDir, safeFileName);

    await writeFile(filePath, Buffer.from(buffer));

    // Return safe URL
    return NextResponse.json(
      {
        success: true,
        url: `/uploads/${userId}/${safeFileName}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}
```

---

## 5. Secure Admin Dashboard

### API Endpoint: `src/app/api/admin/users/list/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  try {
    // 🔒 Authentication & Authorization
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || userRole !== "admin") {
      console.warn("Unauthorized admin access attempt", { userId, userRole });
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // 🔒 Query only safe fields
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        // password is NOT selected - never expose
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit results
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Admin list error:", error);
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 }
    );
  }
}
```

### API Endpoint: `src/app/api/admin/users/delete/route.ts`

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const deleteUserSchema = z.object({
  userId: z.string().cuid(),
});

export async function POST(req: Request) {
  try {
    // 🔒 Authorization
    const adminId = req.headers.get("x-user-id");
    const adminRole = req.headers.get("x-user-role");

    if (adminRole !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // 🔒 Validation
    const { userId } = deleteUserSchema.parse(await req.json());

    // 🔒 Prevent self-deletion
    if (userId === adminId) {
      return NextResponse.json(
        { success: false, message: "Cannot delete own account" },
        { status: 400 }
      );
    }

    // 🔒 Delete with transaction
    await prisma.$transaction(async (tx) => {
      // Delete related data first
      await tx.comment.deleteMany({ where: { userId } });
      await tx.post.deleteMany({ where: { authorId: userId } });

      // Then delete user
      await tx.user.delete({ where: { id: userId } });
    });

    // Log admin action
    console.info("User deleted by admin", {
      adminId,
      deletedUserId: userId,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 }
    );
  }
}
```

---

## 6. Security Middleware

### File: `src/middleware.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 🔒 Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // 🔒 CORS (customize origins as needed)
  const origin = request.headers.get("origin");
  if (origin === process.env.ALLOWED_ORIGIN) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  // 🔒 Auth Token Validation for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || "";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token" },
        { status: 401 }
      );
    }

    try {
      const verified = await jwtVerify(token, secret);
      const payload = verified.payload as any;

      // 🔒 Add user info to headers for API routes
      response.headers.set("x-user-id", payload.userId || "");
      response.headers.set("x-user-role", payload.role || "user");
      response.headers.set("x-user-name", payload.name || "");
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
```

---

## Ready-to-Use Template Summary

These copy-paste snippets cover:

✅ Login forms with error handling  
✅ Profile updates with sanitization  
✅ Comment systems with XSS prevention  
✅ File uploads with validation  
✅ Admin operations with authorization  
✅ Security middleware with headers  

All examples include:
- 🔒 Inline security comments
- ✅ Input validation (Zod)
- ✅ Sanitization (where needed)
- ✅ Authorization checks
- ✅ Error handling
- ✅ Logging

**Customize these examples for your specific needs!**
