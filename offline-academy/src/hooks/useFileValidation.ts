/**
 * OWASP Security: React Hook for File Upload Validation
 *
 * Client-side validation for file uploads
 * Complements server-side validation (defense-in-depth)
 */

"use client";

import { useCallback, useState } from "react";
import { validateFileUpload } from "@/lib/file-upload";


interface UseFileValidationResult {
  error: string;
  file: File | null;
  validate: (selectedFile?: File) => boolean;
  clear: () => void;
}

/**
 * useFileValidation
 * Validates files before upload (type, size, extension)
 *
 * NOTE:
 * - Client-side validation improves UX
 * - Server-side validation is STILL REQUIRED
 */
export function useFileValidation(
  maxSize?: number
): UseFileValidationResult {
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const validate = useCallback(
    (selectedFile?: File): boolean => {
      if (!selectedFile) {
        setError("");
        setFile(null);
        return false;
      }

      const result = validateFileUpload(selectedFile, maxSize);

      if (!result.valid) {
        setError(result.error ?? "Invalid file");
        setFile(null);
        return false;
      }

      setError("");
      setFile(selectedFile);
      return true;
    },
    [maxSize]
  );

  const clear = useCallback(() => {
    setError("");
    setFile(null);
  }, []);

  return { validate, error, file, clear };
}
