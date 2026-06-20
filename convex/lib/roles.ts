export const USER_ROLES = ["admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function hasRole(roles: string[] | undefined, role: string): boolean {
  return roles?.includes(role) ?? false;
}

export function isAdmin(roles: string[] | undefined): boolean {
  return hasRole(roles, "admin");
}
