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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

type ServiceForm = {
  name: string;
  description: string;
  durationMinutes: number;
  price: string;
  category: "manicure" | "pedicure" | "alongamento" | "manutencao" | "outro";
};

const defaultForm: ServiceForm = {
  name: "",
  description: "",
  durationMinutes: 60,
  price: "",
  category: "manicure",
};

const categoryLabels = {
  manicure: "Manicure",
  pedicure: "Pedicure",
  alongamento: "Alongamento",
  manutencao: "Manutenção",
  outro: "Outros",
};

export default function AdminServices() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceForm>(defaultForm);

  const { data: services = [], refetch } = trpc.services.list.useQuery({ activeOnly: false });
  const utils = trpc.useUtils();

  const createMutation = trpc.services.create.useMutation({
    onSuccess: () => { toast.success("Serviço criado!"); refetch(); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.services.update.useMutation({
    onSuccess: () => { toast.success("Serviço atualizado!"); refetch(); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.services.delete.useMutation({
    onSuccess: () => { toast.success("Serviço removido!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (s: typeof services[0]) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      description: s.description ?? "",
      durationMinutes: s.durationMinutes,
      price: String(s.price),
      category: s.category,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) {
      toast.error("Preencha nome e preço.");
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <AdminLayout title="Serviços">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">{services.length} serviços cadastrados</p>
          <Button onClick={openCreate} className="rounded-full gap-2">
            <Plus className="w-4 h-4" /> Novo Serviço
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {services.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              Nenhum serviço cadastrado ainda.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Serviço</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Duração</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Preço</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                        {categoryLabels[s.category]}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" /> {s.durationMinutes} min
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      R$ {Number(s.price).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {s.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate({ id: s.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif font-light text-xl">
              {editId ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Manicure Simples"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descrição do serviço"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duração (minutos) *</Label>
                <Input
                  type="number"
                  min={15}
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as ServiceForm["category"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
