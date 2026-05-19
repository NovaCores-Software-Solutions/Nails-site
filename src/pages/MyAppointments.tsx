import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scissors, ChevronLeft, Calendar, Clock, User } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const statusConfig = {
  pending: { label: "Pendente", class: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmado", class: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Concluído", class: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelado", class: "bg-red-50 text-red-700 border-red-200" },
};

export default function MyAppointments() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: appointments = [], refetch } = trpc.appointments.myAppointments.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: services = [] } = trpc.services.list.useQuery({ activeOnly: false });
  const { data: professionals = [] } = trpc.professionals.list.useQuery({ activeOnly: false });

  const cancelMutation = trpc.appointments.cancel.useMutation({
    onSuccess: () => {
      toast.success("Agendamento cancelado.");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 p-8">
        <Scissors className="w-10 h-10 text-primary" />
        <h2 className="font-serif text-3xl font-light text-foreground text-center">
          Acesso Restrito
        </h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Faça login para visualizar e gerenciar seus agendamentos.
        </p>
        <Link href="/login">
          <Button className="rounded-full px-8">Entrar com minha conta</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar ao início
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <Scissors className="w-4 h-4 text-primary" />
            <span className="font-serif text-lg font-semibold text-foreground">Nail Studio</span>
          </Link>
          <span className="text-sm text-muted-foreground">Olá, {user?.name?.split(" ")[0]}</span>
        </div>
      </header>

      <div className="container max-w-2xl py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-light text-foreground">Meus Agendamentos</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie seus horários agendados</p>
          </div>
          <Link href="/agendar">
            <Button size="sm" className="rounded-full">
              Novo Agendamento
            </Button>
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-serif text-xl font-light text-foreground">Nenhum agendamento</h3>
            <p className="text-muted-foreground text-sm">Você ainda não possui agendamentos.</p>
            <Link href="/agendar">
              <Button className="rounded-full mt-2">Agendar agora</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => {
              const service = services.find((s) => s.id === appt.serviceId);
              const professional = professionals.find((p) => p.id === appt.professionalId);
              const statusInfo = statusConfig[appt.status] ?? statusConfig.pending;
              const scheduledDate = new Date(appt.scheduledAt);
              const isPast = scheduledDate < new Date();
              const canCancel = !isPast && appt.status !== "cancelled" && appt.status !== "completed";

              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-border p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-foreground">
                        {service?.name ?? "Serviço"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{professional?.name ?? "Profissional"}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {format(scheduledDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {scheduledDate.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "America/Sao_Paulo",
                        })}
                      </span>
                    </div>
                    <div className="ml-auto font-semibold text-foreground">
                      R$ {Number(appt.price).toFixed(2).replace(".", ",")}
                    </div>
                  </div>

                  {canCancel && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/5 rounded-full text-xs"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate({ id: appt.id })}
                      >
                        Cancelar agendamento
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
