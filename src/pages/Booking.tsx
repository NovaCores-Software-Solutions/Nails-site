import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Scissors, ChevronLeft, ChevronRight, Check, Clock, User, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfToday, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

type Step = "service" | "professional" | "datetime" | "confirm" | "done";

const STEPS: Step[] = ["service", "professional", "datetime", "confirm", "done"];

const categoryLabels: Record<string, string> = {
  manicure: "Manicure",
  pedicure: "Pedicure",
  alongamento: "Alongamento",
  manutencao: "Manutenção",
  outro: "Outros",
};

const stepLabels: Record<Step, string> = {
  service: "Serviço",
  professional: "Profissional",
  datetime: "Data & Hora",
  confirm: "Confirmação",
  done: "Concluído",
};

export default function Booking() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");

  const { data: services = [] } = trpc.services.list.useQuery({ activeOnly: true });
  const { data: professionals = [] } = trpc.professionals.list.useQuery({ activeOnly: true });
  const { data: slots = [], isLoading: slotsLoading } = trpc.appointments.getAvailableSlots.useQuery(
    {
      professionalId: selectedProfessional ?? 0,
      serviceId: selectedService ?? 0,
      date: selectedDate,
    },
    { enabled: !!selectedProfessional && !!selectedService && !!selectedDate }
  );

  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      setStep("done");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar agendamento.");
    },
  });

  const service = services.find((s) => s.id === selectedService);
  const professional = professionals.find((p) => p.id === selectedProfessional);

  const today = startOfToday();
  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(today, i + 1));

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };
  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleConfirm = () => {
    if (!selectedService || !selectedProfessional || !selectedSlot || !clientName || !clientPhone) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    createMutation.mutate({
      serviceId: selectedService,
      professionalId: selectedProfessional,
      scheduledAt: selectedSlot,
      clientName,
      clientPhone,
      clientEmail: clientEmail || undefined,
      notes: notes || undefined,
    });
  };

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
          <span className="text-sm text-muted-foreground font-medium">Agendamento Online</span>
        </div>
      </header>

      <div className="container max-w-2xl py-10">
        {/* Progress */}
        {step !== "done" && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              {STEPS.filter(s => s !== "done").map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    STEPS.indexOf(step) > i
                      ? "bg-primary text-primary-foreground"
                      : STEPS.indexOf(step) === i
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {STEPS.indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < 3 && <div className={`h-0.5 w-12 sm:w-20 transition-all ${STEPS.indexOf(step) > i ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Passo {stepIndex + 1} de 4 — <span className="font-medium text-foreground">{stepLabels[step]}</span>
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 1: Service */}
            {step === "service" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-3xl font-light text-foreground">Escolha o Serviço</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Selecione o serviço que deseja agendar</p>
                </div>
                <div className="grid gap-3">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedService(s.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedService === s.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{s.name}</p>
                          {s.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{s.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {s.durationMinutes} min
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[s.category] ?? s.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            R$ {Number(s.price).toFixed(2).replace(".", ",")}
                          </p>
                          {selectedService === s.id && (
                            <Check className="w-5 h-5 text-primary ml-auto mt-1" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full rounded-full"
                  disabled={!selectedService}
                  onClick={goNext}
                >
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Step 2: Professional */}
            {step === "professional" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-3xl font-light text-foreground">Escolha a Profissional</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Selecione com quem deseja ser atendida</p>
                </div>
                <div className="grid gap-3">
                  {professionals.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProfessional(p.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedProfessional === p.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{p.name}</p>
                          {p.bio && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{p.bio}</p>}
                        </div>
                        {selectedProfessional === p.id && (
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={goBack}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  <Button className="flex-1 rounded-full" disabled={!selectedProfessional} onClick={goNext}>
                    Continuar <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Date & Time */}
            {step === "datetime" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-3xl font-light text-foreground">Data e Horário</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Escolha o melhor dia e horário para você</p>
                </div>

                {/* Date picker */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Selecione a data</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {dateOptions.map((date) => {
                      const iso = format(date, "yyyy-MM-dd");
                      const isSelected = selectedDate === iso;
                      return (
                        <button
                          key={iso}
                          onClick={() => { setSelectedDate(iso); setSelectedSlot(""); }}
                          className={`p-2 rounded-xl border-2 text-center transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/40 bg-white"
                          }`}
                        >
                          <p className="text-xs text-current opacity-70">
                            {format(date, "EEE", { locale: ptBR })}
                          </p>
                          <p className="text-sm font-semibold mt-0.5">
                            {format(date, "d")}
                          </p>
                          <p className="text-xs opacity-70">
                            {format(date, "MMM", { locale: ptBR })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      Horários disponíveis
                    </Label>
                    {slotsLoading ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Carregando horários...
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm bg-muted rounded-xl">
                        Nenhum horário disponível nesta data.
                        <br />Tente outra data ou profissional.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((slot) => {
                          const time = new Date(slot).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Sao_Paulo",
                          });
                          return (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                selectedSlot === slot
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/40 bg-white text-foreground"
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={goBack}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  <Button
                    className="flex-1 rounded-full"
                    disabled={!selectedDate || !selectedSlot}
                    onClick={goNext}
                  >
                    Continuar <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === "confirm" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-3xl font-light text-foreground">Seus Dados</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Confirme suas informações para finalizar</p>
                </div>

                {/* Summary */}
                <div className="bg-secondary rounded-2xl p-5 space-y-3">
                  <h3 className="font-serif text-base font-medium text-foreground">Resumo do Agendamento</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serviço</span>
                      <span className="font-medium text-foreground">{service?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profissional</span>
                      <span className="font-medium text-foreground">{professional?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data</span>
                      <span className="font-medium text-foreground">
                        {selectedDate && format(new Date(selectedDate + "T00:00:00"), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horário</span>
                      <span className="font-medium text-foreground">
                        {selectedSlot && new Date(selectedSlot).toLocaleTimeString("pt-BR", {
                          hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-muted-foreground">Valor</span>
                      <span className="font-semibold text-foreground">
                        R$ {service ? Number(service.price).toFixed(2).replace(".", ",") : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client form */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Input
                      id="notes"
                      placeholder="Alguma preferência ou observação?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={goBack}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  <Button
                    className="flex-1 rounded-full"
                    disabled={!clientName || !clientPhone || createMutation.isPending}
                    onClick={handleConfirm}
                  >
                    {createMutation.isPending ? "Confirmando..." : "Confirmar Agendamento"}
                  </Button>
                </div>
              </div>
            )}

            {/* Done */}
            {step === "done" && (
              <div className="text-center space-y-6 py-10">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h2 className="font-serif text-3xl font-light text-foreground">Agendamento Confirmado!</h2>
                  <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
                    Seu agendamento foi realizado com sucesso. Entraremos em contato para confirmar.
                  </p>
                </div>
                <div className="bg-secondary rounded-2xl p-5 text-left space-y-2 text-sm max-w-xs mx-auto">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviço</span>
                    <span className="font-medium">{service?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profissional</span>
                    <span className="font-medium">{professional?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">
                      {selectedDate && format(new Date(selectedDate + "T00:00:00"), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário</span>
                    <span className="font-medium">
                      {selectedSlot && new Date(selectedSlot).toLocaleTimeString("pt-BR", {
                        hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo"
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/">
                    <Button variant="outline" className="rounded-full px-8">
                      Voltar ao Início
                    </Button>
                  </Link>
                  <Link href="/meus-agendamentos">
                    <Button className="rounded-full px-8">
                      Meus Agendamentos
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
