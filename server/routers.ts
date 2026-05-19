import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

// ─── Services Router ──────────────────────────────────────────────────────────
const servicesRouter = router({
  list: publicProcedure
    .input(z.object({ activeOnly: z.boolean().optional().default(true) }))
    .query(({ input }) => db.listServices(input.activeOnly)),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const s = await db.getServiceById(input.id);
      if (!s) throw new TRPCError({ code: "NOT_FOUND" });
      return s;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        durationMinutes: z.number().int().min(15),
        price: z.string(),
        category: z.enum(["manicure", "pedicure", "alongamento", "manutencao", "outro"]),
      })
    )
    .mutation(({ input }) => db.createService(input)),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        durationMinutes: z.number().int().min(15).optional(),
        price: z.string().optional(),
        category: z
          .enum(["manicure", "pedicure", "alongamento", "manutencao", "outro"])
          .optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateService(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteService(input.id)),
});

// ─── Professionals Router ─────────────────────────────────────────────────────
const professionalsRouter = router({
  list: publicProcedure
    .input(z.object({ activeOnly: z.boolean().optional().default(true) }))
    .query(({ input }) => db.listProfessionals(input.activeOnly)),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const p = await db.getProfessionalById(input.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      return p;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bio: z.string().optional(),
        phone: z.string().optional(),
        specialties: z.string().optional(),
      })
    )
    .mutation(({ input }) => db.createProfessional(input)),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        specialties: z.string().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateProfessional(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteProfessional(input.id)),

  getAvailability: publicProcedure
    .input(z.object({ professionalId: z.number() }))
    .query(({ input }) => db.getAvailabilityByProfessional(input.professionalId)),

  setAvailability: adminProcedure
    .input(
      z.object({
        professionalId: z.number(),
        slots: z.array(
          z.object({
            dayOfWeek: z.number().int().min(0).max(6),
            startTime: z.string(),
            endTime: z.string(),
          })
        ),
      })
    )
    .mutation(({ input }) =>
      db.setAvailability(
        input.professionalId,
        input.slots.map((s) => ({ ...s, professionalId: input.professionalId }))
      )
    ),
});

// ─── Appointments Router ──────────────────────────────────────────────────────
const appointmentsRouter = router({
  getAvailableSlots: publicProcedure
    .input(
      z.object({
        professionalId: z.number(),
        serviceId: z.number(),
        date: z.string(), // ISO date string "YYYY-MM-DD"
      })
    )
    .query(async ({ input }) => {
      const [professional, service, avail, existing] = await Promise.all([
        db.getProfessionalById(input.professionalId),
        db.getServiceById(input.serviceId),
        db.getAvailabilityByProfessional(input.professionalId),
        db.listAppointmentsByProfessionalAndDate(
          input.professionalId,
          new Date(input.date + "T00:00:00Z")
        ),
      ]);

      if (!professional || !service) return [];

      const dateObj = new Date(input.date + "T00:00:00Z");
      const dayOfWeek = dateObj.getUTCDay();
      const dayAvail = avail.find((a) => a.dayOfWeek === dayOfWeek);
      if (!dayAvail) return [];

      const [startH, startM] = dayAvail.startTime.split(":").map(Number);
      const [endH, endM] = dayAvail.endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const duration = service.durationMinutes;

      const slots: string[] = [];
      for (let m = startMinutes; m + duration <= endMinutes; m += 30) {
        const slotStart = new Date(input.date + "T00:00:00Z");
        slotStart.setUTCHours(Math.floor(m / 60), m % 60, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        const conflict = existing.some((appt) => {
          const apptStart = new Date(appt.scheduledAt).getTime();
          const apptEnd = new Date(appt.endsAt).getTime();
          return slotStart.getTime() < apptEnd && slotEnd.getTime() > apptStart;
        });

        if (!conflict) {
          slots.push(slotStart.toISOString());
        }
      }
      return slots;
    }),

  create: publicProcedure
    .input(
      z.object({
        professionalId: z.number(),
        serviceId: z.number(),
        clientName: z.string().min(1),
        clientPhone: z.string().min(1),
        clientEmail: z.string().email().optional(),
        scheduledAt: z.string(), // ISO datetime
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = await db.getServiceById(input.serviceId);
      if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Serviço não encontrado." });

      const scheduledAt = new Date(input.scheduledAt);
      const endsAt = new Date(scheduledAt.getTime() + service.durationMinutes * 60000);

      // Check for conflicts
      const existing = await db.listAppointmentsByProfessionalAndDate(
        input.professionalId,
        scheduledAt
      );
      const conflict = existing.some((appt) => {
        const apptStart = new Date(appt.scheduledAt).getTime();
        const apptEnd = new Date(appt.endsAt).getTime();
        return scheduledAt.getTime() < apptEnd && endsAt.getTime() > apptStart;
      });
      if (conflict) {
        throw new TRPCError({ code: "CONFLICT", message: "Horário já ocupado." });
      }

      await db.createAppointment({
        professionalId: input.professionalId,
        serviceId: input.serviceId,
        clientName: input.clientName,
        clientPhone: input.clientPhone,
        clientEmail: input.clientEmail,
        scheduledAt,
        endsAt,
        status: "pending",
        notes: input.notes,
        price: service.price,
        userId: ctx.user?.id ?? null,
      });

      // Notify owner
      try {
        await notifyOwner({
          title: "Novo agendamento recebido",
          content: `${input.clientName} agendou ${service.name} para ${scheduledAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`,
        });
      } catch (_) {}

      return { success: true };
    }),

  listByDate: adminProcedure
    .input(z.object({ date: z.string() }))
    .query(({ input }) =>
      db.listAppointmentsByDate(new Date(input.date + "T00:00:00Z"))
    ),

  listByWeek: adminProcedure
    .input(z.object({ weekStart: z.string() }))
    .query(({ input }) =>
      db.listAppointmentsByWeek(new Date(input.weekStart + "T00:00:00Z"))
    ),

  listAll: adminProcedure
    .input(z.object({ limit: z.number().optional().default(100), offset: z.number().optional().default(0) }))
    .query(({ input }) => db.listAllAppointments(input.limit, input.offset)),

  myAppointments: protectedProcedure.query(({ ctx }) =>
    db.listAppointmentsByUser(ctx.user.id)
  ),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
      })
    )
    .mutation(({ input }) => db.updateAppointmentStatus(input.id, input.status)),

  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const appt = await db.getAppointmentById(input.id);
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" });
      if (appt.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.updateAppointmentStatus(input.id, "cancelled");
      return { success: true };
    }),
});

// ─── Clients Router ───────────────────────────────────────────────────────────
const clientsRouter = router({
  list: adminProcedure.query(() => db.listClients()),

  history: adminProcedure
    .input(z.object({ phone: z.string() }))
    .query(({ input }) => db.getClientAppointmentHistory(input.phone)),
});

// ─── Financial Router ─────────────────────────────────────────────────────────
const financialRouter = router({
  summary: adminProcedure
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(async ({ input }) => {
      const from = new Date(input.from + "T00:00:00Z");
      const to = new Date(input.to + "T23:59:59Z");
      const [summary, topServices, byProfessional, allServices, allProfessionals] =
        await Promise.all([
          db.getFinancialSummary(from, to),
          db.getTopServices(from, to),
          db.getRevenueByProfessional(from, to),
          db.listServices(false),
          db.listProfessionals(false),
        ]);

      const enrichedTopServices = topServices.map((ts) => ({
        ...ts,
        serviceName:
          allServices.find((s) => s.id === ts.serviceId)?.name ?? "Desconhecido",
      }));

      const enrichedByProfessional = byProfessional.map((bp) => ({
        ...bp,
        professionalName:
          allProfessionals.find((p) => p.id === bp.professionalId)?.name ?? "Desconhecido",
      }));

      return {
        ...summary,
        topServices: enrichedTopServices,
        byProfessional: enrichedByProfessional,
      };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha inválidos" });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha inválidos" });
        }
        const token = await sdk.createSessionToken(user.id, user.role);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { ok: true, role: user.role } as const;
      }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await db.createUser({
          name: input.name,
          email: input.email,
          passwordHash,
          phone: input.phone ?? null,
          role: "user",
        });
        const token = await sdk.createSessionToken(user.id, user.role);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { ok: true } as const;
      }),
  }),
  services: servicesRouter,
  professionals: professionalsRouter,
  appointments: appointmentsRouter,
  clients: clientsRouter,
  financial: financialRouter,
});

export type AppRouter = typeof appRouter;
