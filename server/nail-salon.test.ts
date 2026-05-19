import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module to avoid real DB connections in tests
vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  listServices: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Manicure Simples",
      description: "Limpeza e esmaltação",
      durationMinutes: 60,
      price: "45.00",
      category: "manicure",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getServiceById: vi.fn().mockResolvedValue(null),
  createService: vi.fn().mockResolvedValue({ id: 99 }),
  updateService: vi.fn().mockResolvedValue(undefined),
  deleteService: vi.fn().mockResolvedValue(undefined),
  listProfessionals: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Ana Costa",
      bio: "Especialista",
      phone: "(11) 99111-1111",
      specialties: "Manicure",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getProfessionalById: vi.fn().mockResolvedValue(null),
  createProfessional: vi.fn().mockResolvedValue({ id: 99 }),
  updateProfessional: vi.fn().mockResolvedValue(undefined),
  deleteProfessional: vi.fn().mockResolvedValue(undefined),
  getAvailabilityByProfessional: vi.fn().mockResolvedValue([
    { id: 1, professionalId: 1, dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
  ]),
  setAvailability: vi.fn().mockResolvedValue(undefined),
  createAppointment: vi.fn().mockResolvedValue({ id: 99 }),
  getAppointmentById: vi.fn().mockResolvedValue(null),
  listAppointmentsByDate: vi.fn().mockResolvedValue([]),
  listAppointmentsByWeek: vi.fn().mockResolvedValue([]),
  listAppointmentsByUser: vi.fn().mockResolvedValue([]),
  listAppointmentsByProfessionalAndDate: vi.fn().mockResolvedValue([]),
  updateAppointmentStatus: vi.fn().mockResolvedValue(undefined),
  updateAppointment: vi.fn().mockResolvedValue(undefined),
  listAllAppointments: vi.fn().mockResolvedValue([]),
  getFinancialSummary: vi.fn().mockResolvedValue({
    totalRevenue: "0",
    totalAppointments: 0,
    completedAppointments: 0,
  }),
  getTopServices: vi.fn().mockResolvedValue([]),
  getRevenueByProfessional: vi.fn().mockResolvedValue([]),
  getClientAppointmentHistory: vi.fn().mockResolvedValue([]),
  listClients: vi.fn().mockResolvedValue([]),
}));

function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

function makeAdminCtx(): TrpcContext {
  return makeCtx({
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Admin User",
      email: "admin@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  });
}

function makeUserCtx(): TrpcContext {
  return makeCtx({
    user: {
      id: 2,
      openId: "user-open-id",
      name: "Regular User",
      email: "user@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  });
}

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const ctx = makeUserCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Regular User");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeUserCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

describe("services.list", () => {
  it("returns list of services for public access", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.services.list({ activeOnly: true });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

describe("professionals.list", () => {
  it("returns list of professionals for public access", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.professionals.list({ activeOnly: true });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("appointments.create", () => {
  it("throws error when required fields are missing", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.appointments.create({
        serviceId: 0,
        professionalId: 0,
        scheduledAt: "",
        clientName: "",
        clientPhone: "",
      })
    ).rejects.toThrow();
  });
});

describe("appointments.listByDate (admin only)", () => {
  it("throws FORBIDDEN for non-admin user", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.appointments.listByDate({ date: "2026-01-01" })
    ).rejects.toThrow();
  });

  it("succeeds for admin user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.appointments.listByDate({ date: "2026-01-01" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("financial.summary (admin only)", () => {
  it("throws for non-admin user", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.financial.summary({ from: "2026-01-01", to: "2026-01-31" })
    ).rejects.toThrow();
  });

  it("returns summary for admin user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.financial.summary({ from: "2026-01-01", to: "2026-01-31" });
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("totalAppointments");
    expect(result).toHaveProperty("topServices");
  });
});

describe("clients.list (admin only)", () => {
  it("throws for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.clients.list()).rejects.toThrow();
  });

  it("succeeds for admin user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.clients.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
