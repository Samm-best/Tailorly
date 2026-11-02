import { describe, expect, it } from "vitest";
import { appointmentSchema, conversationSchema, productionUpdateSchema } from "@/operations/schemas";

describe("operations schemas", () => {
  it("only accepts forward production stages and valid appointment windows", () => {
    expect(productionUpdateSchema.safeParse({ stage: "sewing" }).success).toBe(true);
    expect(appointmentSchema.safeParse({ startsAt: "2026-01-01T10:00:00.000Z", endsAt: "2026-01-01T09:00:00.000Z", type: "fitting" }).success).toBe(false);
  });
  it("bounds messaging input", () => {
    expect(conversationSchema.safeParse({ subject: "Fitting", body: "Please confirm the fitting time." }).success).toBe(true);
    expect(conversationSchema.safeParse({ subject: "", body: "x" }).success).toBe(false);
  });
});
