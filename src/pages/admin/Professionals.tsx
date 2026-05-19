import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

type ProfForm = {
  name: string;
  bio: string;
  phone: string;
  specialties: string;
};

const defaultForm: ProfForm = { name: "", bio: "", phone: "", specialties: "" };

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type AvailSlot = { dayOfWeek: number; startTime: string; endTime: string };

export default function AdminProfessionals() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProfForm>(defaultForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [availSlots, setAvailSlots] = useState<AvailSlot[]>([]);

  const { data: professionals = [], refetch } = trpc.professionals.list.useQuery({ activeOnly: false });

  const createMutation = trpc.professionals.create.useMutation({
    onSuccess: () => { toast.success("Profissional criada!"); refetch(); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.professionals.update.useMutation({
    onSuccess: () => { toast.success("Profissional atualizada!"); refetch(); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.professionals.delete.useMutation({
    onSuccess: () => { toast.success("Profissional removida!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const setAvailMutation = trpc.professionals.setAvailability.useMutation({
    onSuccess: () => toast.success("Disponibilidade salva!"),
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (p: typeof professionals[0]) => {
    setEditId(p.id);
    setForm({ name: p.name, bio: p.bio ?? "", phone: p.phone ?? "", specialties: p.specialties ?? "" });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Nome é obrigatório."); return; }
    if (editId) updateMutation.mutate({ id: editId, ...form });
    else createMutation.mutate(form);
  };

  const toggleExpand = (id: number, currentSlots: AvailSlot[]) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setAvailSlots(currentSlots);
    }
  };

  const toggleDay = (day: number) => {
    const exists = availSlots.find(s => s.dayOfWeek === day);
    if (exists) {
      setAvailSlots(availSlots.filter(s => s.dayOfWeek !== day));
    } else {
      setAvailSlots([...availSlots, { dayOfWeek: day, startTime: "09:00", endTime: "18:00" }]);
    }
  };

  const updateSlot = (day: number, field: "startTime" | "endTime", value: string) => {
    setAvailSlots(availSlots.map(s => s.dayOfWeek === day ? { ...s, [field]: value } : s));
  };

  return (
    <AdminLayout title="Profissionais">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">{professionals.length} profissionais cadastradas</p>
          <Button onClick={openCreate} className="rounded-full gap-2">
            <Plus className="w-4 h-4" /> Nova Profissional
          </Button>
        </div>

        <div className="space-y-3">
          {professionals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-10 text-center text-muted-foreground text-sm shadow-sm">
              Nenhuma profissional cadastrada ainda.
            </div>
          ) : (
            professionals.map((p) => (
              <ProfessionalCard
                key={p.id}
                professional={p}
                expanded={expandedId === p.id}
                availSlots={expandedId === p.id ? availSlots : []}
                onToggle={(slots) => toggleExpand(p.id, slots)}
                onEdit={() => openEdit(p)}
                onDelete={() => deleteMutation.mutate({ id: p.id })}
                onToggleDay={toggleDay}
                onUpdateSlot={updateSlot}
                onSaveAvail={() => setAvailMutation.mutate({ professionalId: p.id, slots: availSlots })}
              />
            ))
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif font-light text-xl">
              {editId ? "Editar Profissional" : "Nova Profissional"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Breve apresentação" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>Especialidades</Label>
              <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Ex: Manicure, Pedicure, Alongamento" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function ProfessionalCard({
  professional,
  expanded,
  availSlots,
  onToggle,
  onEdit,
  onDelete,
  onToggleDay,
  onUpdateSlot,
  onSaveAvail,
}: {
  professional: { id: number; name: string; bio: string | null; phone: string | null; specialties: string | null; active: boolean };
  expanded: boolean;
  availSlots: AvailSlot[];
  onToggle: (slots: AvailSlot[]) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDay: (day: number) => void;
  onUpdateSlot: (day: number, field: "startTime" | "endTime", value: string) => void;
  onSaveAvail: () => void;
}) {
  const { data: avail = [] } = trpc.professionals.getAvailability.useQuery(
    { professionalId: professional.id },
    { enabled: true }
  );

  const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 p-5">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-semibold text-sm">{professional.name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{professional.name}</p>
          {professional.bio && <p className="text-xs text-muted-foreground truncate">{professional.bio}</p>}
          {professional.specialties && (
            <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{professional.specialties}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            professional.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {professional.active ? "Ativa" : "Inativa"}
          </span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => onToggle(avail.map(a => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime })))}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-5 bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Disponibilidade
            </p>
            <Button size="sm" className="rounded-full text-xs" onClick={onSaveAvail}>
              Salvar Horários
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {DAYS.map((day, i) => {
              const active = availSlots.some(s => s.dayOfWeek === i);
              return (
                <button
                  key={day}
                  onClick={() => onToggleDay(i)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    active ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            {availSlots.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((slot) => (
              <div key={slot.dayOfWeek} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-border">
                <span className="text-xs font-medium text-foreground w-8">{DAYS[slot.dayOfWeek]}</span>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => onUpdateSlot(slot.dayOfWeek, "startTime", e.target.value)}
                  className="text-xs border border-border rounded px-2 py-1 text-foreground bg-background"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => onUpdateSlot(slot.dayOfWeek, "endTime", e.target.value)}
                  className="text-xs border border-border rounded px-2 py-1 text-foreground bg-background"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
