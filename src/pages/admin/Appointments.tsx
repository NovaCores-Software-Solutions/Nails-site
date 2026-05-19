import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const statusConfig = {
  pending: { label: "Pendente", class: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmado", class: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Concluído", class: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelado", class: "bg-red-50 text-red-700 border-red-200" },
};

type Status = "pending" | "confirmed" | "completed" | "cancelled";

export default function AdminAppointments() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [search, setSearch] = useState("");

  const { data: appointments = [], refetch } = trpc.appointments.listByDate.useQuery({
    date: selectedDate,
  });
  const { data: services = [] } = trpc.services.list.useQuery({ activeOnly: false });
  const { data: professionals = [] } = trpc.professionals.list.useQuery({ activeOnly: false });

  const utils = trpc.useUtils();
  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = appointments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.clientName.toLowerCase().includes(q) ||
      a.clientPhone.includes(q)
    );
  });

  const prevDay = () => setSelectedDate(format(subDays(new Date(selectedDate + "T00:00:00"), 1), "yyyy-MM-dd"));
  const nextDay = () => setSelectedDate(format(addDays(new Date(selectedDate + "T00:00:00"), 1), "yyyy-MM-dd"));

  return (
    <AdminLayout title="Agendamentos">
      <div className="space-y-6">
        {/* Date navigation */}
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-border p-4 shadow-sm">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={prevDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 text-center">
            <p className="font-serif text-lg font-medium text-foreground">
              {format(new Date(selectedDate + "T00:00:00"), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={nextDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-36 text-sm"
          />
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-muted-foreground text-sm">{filtered.length} agendamento(s)</p>
        </div>

        {/* Appointments list */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-sm">
                {search ? "Nenhum resultado encontrado." : "Nenhum agendamento nesta data."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((appt) => {
                const service = services.find(s => s.id === appt.serviceId);
                const professional = professionals.find(p => p.id === appt.professionalId);
                const statusInfo = statusConfig[appt.status] ?? statusConfig.pending;
                const time = new Date(appt.scheduledAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"
                });
                const endTime = new Date(appt.endsAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"
                });

                return (
                  <div key={appt.id} className="p-5">
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Time */}
                      <div className="text-center w-16 flex-shrink-0">
                        <p className="text-sm font-semibold text-foreground">{time}</p>
                        <p className="text-xs text-muted-foreground">{endTime}</p>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">{appt.clientName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {service?.name} · {professional?.name}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{appt.clientPhone}</span>
                          {appt.clientEmail && <span>{appt.clientEmail}</span>}
                          {appt.notes && <span className="italic">"{appt.notes}"</span>}
                        </div>
                      </div>

                      {/* Price + Status control */}
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-semibold text-foreground">
                          R$ {Number(appt.price).toFixed(2).replace(".", ",")}
                        </p>
                        <Select
                          value={appt.status}
                          onValueChange={(v) =>
                            updateStatus.mutate({ id: appt.id, status: v as Status })
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-36 rounded-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="confirmed">Confirmado</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
