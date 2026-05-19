import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Calendar, Phone, Mail, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  pending: { label: "Pendente", class: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmado", class: "bg-blue-50 text-blue-700" },
  completed: { label: "Concluído", class: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelado", class: "bg-red-50 text-red-700" },
};

export default function AdminClients() {
  const [search, setSearch] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: history = [] } = trpc.clients.history.useQuery(
    { phone: selectedPhone ?? "" },
    { enabled: !!selectedPhone }
  );
  const { data: services = [] } = trpc.services.list.useQuery({ activeOnly: false });
  const { data: professionals = [] } = trpc.professionals.list.useQuery({ activeOnly: false });

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout title="Clientes">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-muted-foreground text-sm">{filtered.length} clientes</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              {search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Contato</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Desde</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-semibold">{c.name?.[0] ?? "?"}</span>
                        </div>
                        <p className="font-medium text-foreground">{c.name ?? "—"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Mail className="w-3 h-3" /> {c.email}
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Phone className="w-3 h-3" /> {c.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell text-muted-foreground text-xs">
                      {format(new Date(c.createdAt), "dd/MM/yyyy")}
                    </td>
                    <td className="px-5 py-4">
                      {c.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs"
                          onClick={() => setSelectedPhone(c.phone!)}
                        >
                          Ver histórico
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* History dialog */}
      <Dialog open={!!selectedPhone} onOpenChange={() => setSelectedPhone(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif font-light text-xl">
              Histórico de Agendamentos
            </DialogTitle>
          </DialogHeader>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              Nenhum agendamento encontrado.
            </p>
          ) : (
            <div className="space-y-3 mt-2">
              {history.map((appt) => {
                const service = services.find(s => s.id === appt.serviceId);
                const professional = professionals.find(p => p.id === appt.professionalId);
                const statusInfo = statusConfig[appt.status] ?? statusConfig.pending;
                return (
                  <div key={appt.id} className="bg-muted/30 rounded-xl p-4 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-foreground text-sm">{service?.name ?? "Serviço"}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(appt.scheduledAt), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(appt.scheduledAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"
                        })}
                      </span>
                      <span>{professional?.name}</span>
                      <span className="ml-auto font-semibold text-foreground">
                        R$ {Number(appt.price).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
