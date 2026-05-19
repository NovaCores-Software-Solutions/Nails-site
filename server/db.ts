import { and, between, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Appointment,
  InsertAppointment,
  InsertAvailability,
  InsertProfessional,
  InsertService,
  appointments,
  availability,
  professionals,
  services,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  role?: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    phone: data.phone ?? null,
    role: data.role ?? "user",
  });
  const created = await getUserByEmail(data.email);
  if (!created) throw new Error("Failed to create user");
  return created;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function listClients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "user")).orderBy(desc(users.createdAt));
}

// ─── Services ────────────────────────────────────────────────────────────────
export async function listServices(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(services).where(eq(services.active, true)).orderBy(services.name);
  }
  return db.select().from(services).orderBy(services.name);
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0];
}

export async function createService(data: InsertService) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(services).values(data);
}

export async function updateService(id: number, data: Partial<InsertService>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(services).set(data).where(eq(services.id, id));
}

export async function deleteService(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(services).set({ active: false }).where(eq(services.id, id));
}

// ─── Professionals ───────────────────────────────────────────────────────────
export async function listProfessionals(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db
      .select()
      .from(professionals)
      .where(eq(professionals.active, true))
      .orderBy(professionals.name);
  }
  return db.select().from(professionals).orderBy(professionals.name);
}

export async function getProfessionalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(professionals)
    .where(eq(professionals.id, id))
    .limit(1);
  return result[0];
}

export async function createProfessional(data: InsertProfessional) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(professionals).values(data);
}

export async function updateProfessional(id: number, data: Partial<InsertProfessional>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(professionals).set(data).where(eq(professionals.id, id));
}

export async function deleteProfessional(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(professionals).set({ active: false }).where(eq(professionals.id, id));
}

// ─── Availability ─────────────────────────────────────────────────────────────
export async function getAvailabilityByProfessional(professionalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(availability)
    .where(eq(availability.professionalId, professionalId))
    .orderBy(availability.dayOfWeek);
}

export async function setAvailability(professionalId: number, slots: InsertAvailability[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(availability).where(eq(availability.professionalId, professionalId));
  if (slots.length > 0) {
    await db.insert(availability).values(slots);
  }
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(appointments).values(data);
  return result;
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result[0];
}

export async function listAppointmentsByDate(date: Date) {
  const db = await getDb();
  if (!db) return [];
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return db
    .select()
    .from(appointments)
    .where(between(appointments.scheduledAt, start, end))
    .orderBy(appointments.scheduledAt);
}

export async function listAppointmentsByWeek(weekStart: Date) {
  const db = await getDb();
  if (!db) return [];
  const start = new Date(weekStart);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return db
    .select()
    .from(appointments)
    .where(between(appointments.scheduledAt, start, end))
    .orderBy(appointments.scheduledAt);
}

export async function listAppointmentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(desc(appointments.scheduledAt));
}

export async function listAppointmentsByProfessionalAndDate(
  professionalId: number,
  date: Date
) {
  const db = await getDb();
  if (!db) return [];
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.professionalId, professionalId),
        between(appointments.scheduledAt, start, end),
        ne(appointments.status, "cancelled")
      )
    )
    .orderBy(appointments.scheduledAt);
}

export async function updateAppointmentStatus(
  id: number,
  status: Appointment["status"]
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function listAllAppointments(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(appointments)
    .orderBy(desc(appointments.scheduledAt))
    .limit(limit)
    .offset(offset);
}

// ─── Financial ────────────────────────────────────────────────────────────────
export async function getFinancialSummary(from: Date, to: Date) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalAppointments: 0, completedAppointments: 0 };

  const result = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${appointments.status} = 'completed' THEN CAST(${appointments.price} AS DECIMAL(10,2)) ELSE 0 END), 0)`,
      totalAppointments: sql<number>`COUNT(*)`,
      completedAppointments: sql<number>`SUM(CASE WHEN ${appointments.status} = 'completed' THEN 1 ELSE 0 END)`,
    })
    .from(appointments)
    .where(
      and(
        gte(appointments.scheduledAt, from),
        lte(appointments.scheduledAt, to),
        ne(appointments.status, "cancelled")
      )
    );

  return result[0] ?? { totalRevenue: 0, totalAppointments: 0, completedAppointments: 0 };
}

export async function getTopServices(from: Date, to: Date, limit = 5) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      serviceId: appointments.serviceId,
      count: sql<number>`COUNT(*) as count`,
      revenue: sql<number>`COALESCE(SUM(CAST(${appointments.price} AS DECIMAL(10,2))), 0)`,
    })
    .from(appointments)
    .where(
      and(
        gte(appointments.scheduledAt, from),
        lte(appointments.scheduledAt, to),
        eq(appointments.status, "completed")
      )
    )
    .groupBy(appointments.serviceId)
    .orderBy(sql`count DESC`)
    .limit(limit);
}

export async function getRevenueByProfessional(from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      professionalId: appointments.professionalId,
      count: sql<number>`COUNT(*) as count`,
      revenue: sql<number>`COALESCE(SUM(CAST(${appointments.price} AS DECIMAL(10,2))), 0)`,
    })
    .from(appointments)
    .where(
      and(
        gte(appointments.scheduledAt, from),
        lte(appointments.scheduledAt, to),
        eq(appointments.status, "completed")
      )
    )
    .groupBy(appointments.professionalId);
}

export async function getClientAppointmentHistory(clientPhone: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.clientPhone, clientPhone))
    .orderBy(desc(appointments.scheduledAt));
}
