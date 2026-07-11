import { describe, test, expect, jest, beforeEach } from "@jest/globals";

import Permission from "../modules/permissions/permission.model.js";
import {
  checkPermissionFromDB,
  clearPermissionCache,
} from "../modules/permissions/permission.service.js";

beforeEach(() => {
  clearPermissionCache?.();
});

describe("Permission Service", () => {
  test("Seeded allowed:true row passes", async () => {
    await Permission.create({
      role: "faculty",
      module: "booking",
      action: "create",
      allowed: true,
    });

    const result = await checkPermissionFromDB(
      "faculty",
      "booking",
      "create"
    );

    expect(result).toBe(true);
  });

  test("Missing permission row is denied", async () => {
    const result = await checkPermissionFromDB(
      "student",
      "admin",
      "delete"
    );

    expect(result).toBe(false);
  });

  test("Second call uses cache without DB hit", async () => {
    // Use a non-admin role: admin bypasses DB entirely (always allowed),
    // so Permission.findOne would never be called for admin.
    await Permission.create({
      role: "faculty",
      module: "users",
      action: "view",
      allowed: true,
    });

    const spy = jest.spyOn(Permission, "findOne");

    await checkPermissionFromDB("faculty", "users", "view");
    await checkPermissionFromDB("faculty", "users", "view");

    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});