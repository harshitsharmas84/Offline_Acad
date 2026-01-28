"use client";

import { useAuth } from "@/hooks/useAuth";
import { Role } from "@prisma/client";
import { ReactNode } from "react";

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: Role[];
    fallback?: ReactNode; // Optional: Show "Access Denied" message instead of nothing
}

export default function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) return null; // Or a spinner/skeleton

    // Safe check
    if (!user || !allowedRoles.includes(user.role as Role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
