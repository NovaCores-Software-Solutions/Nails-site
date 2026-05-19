import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, TrendingUp, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Link } from "wouter";
import { trpc as trpcClient } from "@/lib/trpc";

const statusConfig = {
  pending: { label: "Pendente", icon: AlertCircle, class: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmado", icon: CheckCircle, class: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Concluído", icon: CheckCircle, class: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelado", icon: XCircle, class: "bg-red-50 text-red-700 border-red-200" },
};

export default function AdminDashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: todayAppts = [], refetch } = trpc.appointments.listByDate.useQuery({ date: today });
  const { data: weekAppts = [] } = trpc.appointments.listByWeek.useQuery({ weekStart });
  const { data: services = [] } = trpc.services.list.useQuery({ activeOnly: false });
  const { data: professionals = [] } = trpc.professionals.list.useQuery({ activeOnly: false });

  const utils = trpcClient.useUtils();
  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => { refetch(); utils.appointments.listByWeek.invalidate(); },
  });

  const todayStats = {
    total: todayAppts.length,
    pending: todayAppts.filter(a => a.status === "pending").length,
    confirmed: todayAppts.filter(a => a.status === "confirmed").length,
    completed: todayAppts.filter(a => a.status === "completed").length,
  };

  const weekRevenue = weekAppts
    .filter(a => a.status === "completed")
    .reduce((sum, a) => sum + Number(a.price), 0);

  // Build week calendar
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Hoje — Total", value: todayStats.total, icon: Calendar, color: "text-primary" },
            { label: "Pendentes", value: todayStats.pending, icon: AlertCircle, color: "text-amber-600" },
            { label: "Confirmados", value: todayStats.confirmed, icon: CheckCircle, color: "text-blue-600" },
            { label: "Receita da Semana", value: `R$ ${weekRevenue.toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-green-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className={`font-serif text-2xl font-medium ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Today's appointments */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-serif text-lg font-medium text-foreground">
              Agenda de Hoje — {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
            </h2>
            <Link href="/admin/agendamentos">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                Ver todos
              </Button>
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              Nenhum agendamento para hoje.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {todayAppts.map((appt) => {
                const service = services.find(s => s.id === appt.serviceId);
                const professional = professionals.find(p => p.id === appt.professionalId);
                const statusInfo = statusConfig[appt.status] ?? statusConfig.pending;
                const time = new Date(appt.scheduledAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"
                });
                return (
                  <div key={appt.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="text-center w-12 flex-shrink-0">
                      <p className="text-sm font-semibold text-foreground">{time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{appt.clientName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {service?.name} · {professional?.name}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                    {appt.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs rounded-full flex-shrink-0 border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => updateStatus.mutate({ id: appt.id, status: "confirmed" })}
                      >
                        Confirmar
                      </Button>
                    )}
                    {appt.status === "confirmed" && (
                      <Button
                        size="sm"
                        className="text-xs rounded-full flex-shrink-0 bg-green-600 hover:bg-green-700"
                        onClick={() => updateStatus.mutate({ id: appt.id, status: "completed" })}
                      >
                        Concluir
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Week calendar */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="font-serif text-lg font-medium text-foreground">Visão Semanal</h2>
          </div>
          <div className="grid grid-cols-7 divide-x divide-border">
            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayAppts = weekAppts.filter(a => {
                const d = format(new Date(a.scheduledAt), "yyyy-MM-dd");
                return d === dayStr;
              });
              const isToday = dayStr === today;
              return (
                <div key={dayStr} className={`p-3 min-h-24 ${isToday ? "bg-primary/5" : ""}`}>
                  <p className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {format(day, "EEE", { locale: ptBR })}
                  </p>
                  <p className={`text-sm font-semibold mb-2 ${isToday ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </p>
                  <div className="space-y-1">
                    {dayAppts.slice(0, 3).map(a => (
                      <div key={a.id} className={`text-xs px-1.5 py-0.5 rounded truncate ${
                        a.status === "cancelled" ? "bg-red-100 text-red-700" :
                        a.status === "completed" ? "bg-green-100 text-green-700" :
                        a.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {new Date(a.scheduledAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"
                        })} {a.clientName.split(" ")[0]}
                      </div>
                    ))}
                    {dayAppts.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{dayAppts.length - 3}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
