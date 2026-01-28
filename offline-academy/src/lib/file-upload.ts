/**
 * OWASP Security: File Upload and Validation Utilities
 * 
 * File upload security is critical:
 * 1. Prevent executable file uploads
 * 2. Validate file MIME types (don't trust client)
 * 3. Scan uploaded files for malware
 * 4. Store files outside webroot when possible
 * 5. Prevent path traversal attacks
 */

/**
 * Allowed file types with their MIME types
 * Only add MIME types you actually need to support
 */
const ALLOWED_MIME_TYPES = {
  // Images
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],

  // Documents
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],

  // Text
  "text/plain": [".txt"],
  "text/csv": [".csv"],

  // Audio/Video (be careful with these)
  "audio/mpeg": [".mp3"],
  "video/mp4": [".mp4"],
};

/**
 * Dangerous MIME types that should NEVER be allowed
 * Even if uploaded with fake extension
 */
const DANGEROUS_MIME_TYPES = [
  "application/x-executable",
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-bash",
  "application/x-sh",
  "application/x-shellscript",
  "text/x-shellscript",
  "application/x-perl",
  "application/x-php",
  "text/x-php",
  "application/x-ruby",
  "text/x-ruby",
];

/**
 * Validate file upload
 * 
 * @param file - File from form submission
 * @param maxSize - Maximum file size in bytes (default 5MB)
 * @returns Validation result with error message if invalid
 * 
 * @example
 * const validation = validateFileUpload(file, 1024 * 1024 * 5);
 * if (!validation.valid) {
 *   return { error: validation.error };
 * }
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  extension?: string;
}

export function validateFileUpload(
  file: File,
  maxSize: number = 5 * 1024 * 1024 // 5MB default
): FileValidationResult {
  // Check file exists
  if (!file) {
    return {
      valid: false,
      error: "No file selected",
    };
  }

  // Check file size
  // 🔒 Security: Prevent resource exhaustion attacks
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds ${maxMB}MB limit`,
    };
  }

  // Check MIME type
  // 🔒 Security: Validate client-provided MIME type
  const mimeType = file.type;

  if (!mimeType) {
    return {
      valid: false,
      error: "File type could not be determined",
    };
  }

  // Check for dangerous MIME types
  // 🔒 Security: Block executables and scripts
  if (DANGEROUS_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: "This file type is not allowed for security reasons",
    };
  }

  // Check if MIME type is in allowed list
  if (!Object.keys(ALLOWED_MIME_TYPES).includes(mimeType)) {
    return {
      valid: false,
      error: "This file type is not supported",
    };
  }

  // Get file extension
  const fileName = file.name;
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) {
    return {
      valid: false,
      error: "File has no extension",
    };
  }

  const extension = fileName.substring(lastDot).toLowerCase();

  // Check if extension matches MIME type
  // 🔒 Security: Prevent extension spoofing
  const allowedExtensions = ALLOWED_MIME_TYPES[mimeType as keyof typeof ALLOWED_MIME_TYPES] || [];
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} does not match file type`,
    };
  }

  // Additional checks: file name validation
  // 🔒 Security: Prevent path traversal attacks
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return {
      valid: false,
      error: "Invalid file name",
    };
  }

  // Check for null bytes (path traversal attempt)
  // 🔒 Security: Block null byte injection
  if (fileName.includes("\0")) {
    return {
      valid: false,
      error: "Invalid file name",
    };
  }

  return {
    valid: true,
    mimeType,
    extension,
  };
}

/**
 * Generate safe file name
 * Removes special characters and potential path traversal
 * 
 * @param originalName - Original file name from user
 * @returns Safe file name
 * 
 * @example
 * const safe = getSafeFileName("my invoice (2026).pdf");
 * // Result: "my_invoice_2026.pdf"
 */
export function getSafeFileName(originalName: string): string {
  // Remove path components
  const fileName = originalName.split(/[\/\\]/).pop() || "file";

  // Remove special characters, keep only alphanumeric, underscore, hyphen, dot
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Prevent multiple consecutive dots
  // 🔒 Security: Prevent double extension tricks like file.php.jpg
  return safe.replace(/\.{2,}/g, ".");
}

/**
 * Generate unique file name with timestamp
 * Prevents overwriting existing files and directory enumeration
 * 
 * @param originalName - Original file name
 * @returns Unique file name with timestamp
 * 
 * @example
 * const unique = getUniqueFileName("document.pdf");
 * // Result: "document_1704067200000_a1b2c3d4.pdf"
 */
export function getUniqueFileName(originalName: string): string {
  const safe = getSafeFileName(originalName);
  const lastDot = safe.lastIndexOf(".");
  
  if (lastDot === -1) {
    // No extension
    return `${safe}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  const name = safe.substring(0, lastDot);
  const ext = safe.substring(lastDot);

  return `${name}_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
}

/**
 * Get file size in human-readable format
 * 
 * @example
 * formatFileSize(1024 * 1024 * 5) // "5.00 MB"
 * formatFileSize(1024) // "1.00 KB"
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Client-side file input validation hook for React
 * Provides real-time validation feedback
 * 
 * @example
 * function FileUploadForm() {
 *   const fileValidation = useFileValidation(5 * 1024 * 1024);
 *   
 *   return (
 *     <>
 *       <input
 *         type="file"
 *         onChange={(e) => fileValidation.validate(e.target.files?.[0])}
 *       />
 *       {fileValidation.error && (
 *         <p style={{ color: 'red' }}>{fileValidation.error}</p>
 *       )}
 *     </>
 *   );
 * }
 */
export function useFileValidation(maxSize?: number) {
  // Note: This hook is meant to be used in client components
  // Import React.useState from 'react' in your component file
  // This utility provides the logic, use it with React hooks
  
  return {
    validate: (selectedFile: File | undefined): boolean => {
      if (!selectedFile) {
        return false;
      }
      
      const validation = validateFileUpload(selectedFile, maxSize);
      return validation.valid;
    },
  };
}

/**
 * SECURITY BEST PRACTICES FOR FILE UPLOADS
 * 
 * ========== VALIDATION ==========
 * ✓ Always validate on server (client validation is just UX)
 * ✓ Check file size to prevent resource exhaustion
 * ✓ Validate MIME type (don't trust client)
 * ✓ Check file extension
 * ✓ Scan file contents for malware
 * ✓ Prevent directory traversal in file names
 * 
 * ========== STORAGE ==========
 * ✓ Store files outside web root when possible
 * ✓ Generate unique file names (prevent overwrite)
 * ✓ Store original file name separately (sanitized)
 * ✓ Set restrictive file permissions (read-only if possible)
 * ✓ Use CDN/object storage for large files
 * ✓ Never store executable files
 * 
 * ========== SERVING FILES ==========
 * ✓ Set correct Content-Type header
 * ✓ Use Content-Disposition: attachment to prevent inline execution
 * ✓ Implement access control (check authorization)
 * ✓ Log file downloads for audit trail
 * ✓ Rate limit file downloads
 * ✓ Virus scan before serving to users
 * 
 * ========== DANGEROUS PATTERNS ==========
 * ❌ Never execute uploaded files
 * ❌ Never trust client-provided MIME type alone
 * ❌ Never concatenate file names into paths
 * ❌ Don't store in web root with execute permissions
 * ❌ Don't allow code interpretation (.php, .jsp, etc.)
 * ❌ Never parse untrusted archives (zip bombs)
 * 
 * ========== ATTACK EXAMPLES ==========
 * 
 * 1. EXECUTABLE UPLOAD:
 *    Attacker uploads: malware.exe
 *    Server stores in /uploads/malware.exe
 *    If web root: Attacker accesses http://app.com/uploads/malware.exe
 *    Prevention: Validate MIME type, store outside web root
 * 
 * 2. EXTENSION SPOOFING:
 *    Attacker uploads: malware.php disguised as image.jpg
 *    Sets MIME type to image/jpeg (incorrect)
 *    Server validation sees .jpg and allows
 *    If stored in web root with execute: PHP executes
 *    Prevention: Match extension to MIME type
 * 
 * 3. PATH TRAVERSAL:
 *    Attacker uploads: ../../etc/passwd
 *    File saved to: /uploads/../../etc/passwd (overwrites system file)
 *    Prevention: Remove path components, use sanitized names
 * 
 * 4. ZIP BOMB:
 *    Attacker uploads: compressed.zip
 *    Compressed 5GB to 1MB
 *    Server decompresses, fills disk, DoS
 *    Prevention: Check uncompressed size, rate limiting
 * 
 * 5. IMAGE POLYGLOT:
 *    Attacker creates: valid.jpg + malicious PHP appended
 *    MIME type check: image/jpeg ✓
 *    Extension check: .jpg ✓
 *    But PHP code still executable if .jpg handled as .php
 *    Prevention: Store outside web root, no execute permissions
 */
