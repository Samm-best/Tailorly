import type { TenantRole } from "@/tenants/roles";

export const TENANT_PERMISSIONS = [
  "shop.manage",
  "catalogue.manage",
  "orders.manage",
  "custom_orders.manage",
  "production.view",
  "production.manage",
  "messages.manage",
  "appointments.manage",
  "deliveries.view",
  "deliveries.manage",
  "customers.view",
  "staff.manage",
  "analytics.view",
] as const;

export type TenantPermission = (typeof TENANT_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<TenantPermission, string> = {
  "shop.manage": "Manage shop settings",
  "catalogue.manage": "Manage products, categories and stock",
  "orders.manage": "Manage orders",
  "custom_orders.manage": "Manage custom orders and quotations",
  "production.view": "View production",
  "production.manage": "Update production",
  "messages.manage": "Manage customer messages",
  "appointments.manage": "Manage appointments",
  "deliveries.view": "View deliveries",
  "deliveries.manage": "Update deliveries",
  "customers.view": "View customer information",
  "staff.manage": "Manage staff and permissions",
  "analytics.view": "View shop analytics",
};

const OWNER_PERMISSIONS = [...TENANT_PERMISSIONS];
const ROLE_DEFAULTS: Record<Exclude<TenantRole, "owner" | "customer">, readonly TenantPermission[]> = {
  manager: TENANT_PERMISSIONS,
  tailor: ["production.view", "production.manage", "messages.manage", "customers.view"],
  staff: ["production.view", "production.manage", "messages.manage", "customers.view"],
  delivery: ["deliveries.view", "deliveries.manage"],
};

export function defaultPermissionsForRole(role: TenantRole): TenantPermission[] {
  if (role === "owner") return [...OWNER_PERMISSIONS];
  return [...(ROLE_DEFAULTS[role as Exclude<TenantRole, "owner" | "customer">] ?? [])];
}

export function isTenantPermission(value: string): value is TenantPermission {
  return (TENANT_PERMISSIONS as readonly string[]).includes(value);
}
