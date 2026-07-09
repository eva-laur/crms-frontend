import { describe, test, expect, beforeEach } from "@jest/globals";

import Booking from "../modules/bookings/bookings.model.js";
import Resource from "../modules/resources/resources.model.js";
import User from "../modules/users/users.model.js";

import {
  createBookingService,
  overrideBookingService,
} from "../modules/bookings/bookings.service.js";

let resource;
let studentUser;
let otherStudentUser;
let adminUser;

beforeEach(async () => {
  studentUser = await User.create({
    name: "Student One",
    email: "student1@example.com",
    password: "secret",
    role: "student",
  });

  otherStudentUser = await User.create({
    name: "Student Two",
    email: "student2@example.com",
    password: "secret",
    role: "student",
  });

  adminUser = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    password: "secret",
    role: "admin",
  });

  resource = await Resource.create({
    name: "Microscope",
    location: "Lab A",
    quantity: 1,
    type: "equipment",
    category: "science",
    totalCopies: 1,
    availableCopies: 1,
    status: "available",
  });
});

describe("Booking Service", () => {
  test("Two overlapping bookings on same resource -> second throws", async () => {
    await Booking.create({
      resource: resource._id,
      user: studentUser._id,
      startTime: new Date("2026-06-24T10:00:00"),
      endTime: new Date("2026-06-24T12:00:00"),
      status: "approved",
      purpose: "Research",
    });

    await expect(
      createBookingService({
        resource: resource._id,
        userId: otherStudentUser._id,
        userRole: "student",
        startTime: new Date("2026-06-24T11:00:00"),
        endTime: new Date("2026-06-24T13:00:00"),
        purpose: "Research",
      })
    ).rejects.toThrow();
  });

  test("Two non-overlapping bookings -> both succeed", async () => {
    await createBookingService({
      resource: resource._id,
      userId: studentUser._id,
      userRole: "student",
      startTime: new Date("2026-06-24T10:00:00"),
      endTime: new Date("2026-06-24T12:00:00"),
      purpose: "Morning",
    });

    const second = await createBookingService({
      resource: resource._id,
      userId: otherStudentUser._id,
      userRole: "student",
      startTime: new Date("2026-06-24T12:01:00"),
      endTime: new Date("2026-06-24T14:00:00"),
      purpose: "Afternoon",
    });

    expect(second).toBeTruthy();
  });

  test("Booking resource under maintenance -> throws", async () => {
    resource.status = "under_maintenance";
    await resource.save();

    await expect(
      createBookingService({
        resource: resource._id,
        userId: otherStudentUser._id,
        userRole: "student",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: "Use",
      })
    ).rejects.toThrow();
  });

  test("Student with overdue booking -> blocked", async () => {
    await Booking.create({
      resource: resource._id,
      user: studentUser._id,
      status: "overdue",
      purpose: "Overdue hold",
    });

    await expect(
      createBookingService({
        resource: resource._id,
        userId: studentUser._id,
        userRole: "student",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: "Blocked",
      })
    ).rejects.toThrow();
  });

  test("Admin with overdue booking -> allowed", async () => {
    await Booking.create({
      resource: resource._id,
      user: studentUser._id,
      status: "overdue",
      purpose: "Overdue hold",
    });

    const booking = await createBookingService({
      resource: resource._id,
      userId: adminUser._id,
      userRole: "admin",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      purpose: "Allowed",
    });

    expect(booking).toBeTruthy();
  });

  test("overrideBookingService cancels conflicting approved booking", async () => {
    const approved = await Booking.create({
      resource: resource._id,
      user: studentUser._id,
      startTime: new Date("2026-06-24T10:00:00"),
      endTime: new Date("2026-06-24T12:00:00"),
      status: "approved",
      purpose: "Approved booking",
    });

    const pending = await Booking.create({
      resource: resource._id,
      user: otherStudentUser._id,
      startTime: new Date("2026-06-24T11:00:00"),
      endTime: new Date("2026-06-24T13:00:00"),
      status: "pending",
      purpose: "Pending override",
    });

    await overrideBookingService(
      pending._id,
      adminUser._id,
      "Manager override"
    );

    const cancelled = await Booking.findById(approved._id);

    expect(cancelled.status).toBe("cancelled");
  });

  test("overrideBookingService throws if conflict checked_out", async () => {
    await Booking.create({
      resource: resource._id,
      user: studentUser._id,
      startTime: new Date("2026-06-24T10:00:00"),
      endTime: new Date("2026-06-24T12:00:00"),
      status: "checked_out",
      purpose: "Checked out booking",
    });

    const pending = await Booking.create({
      resource: resource._id,
      user: otherStudentUser._id,
      startTime: new Date("2026-06-24T11:00:00"),
      endTime: new Date("2026-06-24T13:00:00"),
      status: "pending",
      purpose: "Pending override",
    });

    await expect(
      overrideBookingService(
        pending._id,
        adminUser._id,
        "Force"
      )
    ).rejects.toThrow();
  });
});