export const TENANT_ROLES = ["owner", "manager", "tailor", "staff", "delivery", "customer"] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

export const PLATFORM_ROLES = ["super_admin", "platform_admin", "platform_support"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Business roles (everything except customer) may enter shop operations. */
export function isOperationsRole(role: TenantRole): boolean {
  return role !== "customer";
}

/** Phase 5 interim rule: only owner and manager manage the catalogue. Phase 10 replaces this with a permission matrix. */
export const CATALOGUE_MANAGER_ROLES: readonly TenantRole[] = ["owner", "manager"];
