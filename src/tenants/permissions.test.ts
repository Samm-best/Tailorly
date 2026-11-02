import { describe, expect, it } from "vitest";
import { defaultPermissionsForRole, isTenantPermission } from "@/tenants/permissions";

describe("tenant permissions", () => {
  it("gives owners every permission", () => {
    expect(defaultPermissionsForRole("owner")).toContain("staff.manage");
    expect(defaultPermissionsForRole("owner")).toContain("deliveries.manage");
  });

  it("limits operational roles to their responsibilities", () => {
    expect(defaultPermissionsForRole("delivery")).toEqual(["deliveries.view", "deliveries.manage"]);
    expect(defaultPermissionsForRole("tailor")).toContain("production.manage");
    expect(defaultPermissionsForRole("tailor")).not.toContain("catalogue.manage");
  });

  it("rejects unknown permission values", () => {
    expect(isTenantPermission("platform.manage")).toBe(false);
  });
});
