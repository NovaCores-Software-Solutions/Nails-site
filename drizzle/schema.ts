import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  time,
} from "drizzle-orm/mysql-core";

// ─── Users (OAuth) ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  phone: varchar("phone", { length: 30 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Services ────────────────────────────────────────────────────────────────
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  durationMinutes: int("durationMinutes").notNull().default(60),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: mysqlEnum("category", ["manicure", "pedicure", "alongamento", "manutencao", "outro"])
    .default("outro")
    .notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── Professionals ───────────────────────────────────────────────────────────
export const professionals = mysqlTable("professionals", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  bio: text("bio"),
  phone: varchar("phone", { length: 30 }),
  specialties: text("specialties"), // JSON array of service categories
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Professional = typeof professionals.$inferSelect;
export type InsertProfessional = typeof professionals.$inferInsert;

// ─── Professional Availability ───────────────────────────────────────────────
export const availability = mysqlTable("availability", {
  id: int("id").autoincrement().primaryKey(),
  professionalId: int("professionalId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: time("startTime").notNull(), // e.g. "09:00"
  endTime: time("endTime").notNull(),     // e.g. "18:00"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = typeof availability.$inferInsert;

// ─── Appointments ────────────────────────────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null = guest booking
  professionalId: int("professionalId").notNull(),
  serviceId: int("serviceId").notNull(),
  clientName: varchar("clientName", { length: 120 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 30 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  scheduledAt: timestamp("scheduledAt").notNull(), // UTC start time
  endsAt: timestamp("endsAt").notNull(),           // UTC end time
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"])
    .default("pending")
    .notNull(),
  notes: text("notes"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
