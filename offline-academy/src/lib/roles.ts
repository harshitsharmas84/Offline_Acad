import { Role } from "@prisma/client"; // Use the Enum from your DB schema

export type Permission =
    | "view:content"
    | "create:lesson"
    | "delete:user"
    | "view:analytics";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.STUDENT]: ["view:content"],
    [Role.TEACHER]: ["view:content", "create:lesson", "view:analytics"],
    [Role.ADMIN]: ["view:content", "create:lesson", "delete:user", "view:analytics"],
};

export function hasPermission(userRole: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}
