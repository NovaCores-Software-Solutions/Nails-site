import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, DollarSign, Calendar, Percent } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["#be4a4a", "#c9a84c", "#d47fa6", "#8b6b4a", "#a85c6e"];

export default function AdminFinancial() {
  const today = new Date();
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(today), "yyyy-MM-dd"));

  const { data, isLoading } = trpc.financial.summary.useQuery({ from, to });

  const totalRevenue = Number(data?.totalRevenue ?? 0);
  const totalAppts = Number(data?.totalAppointments ?? 0);
  const completedAppts = Number(data?.completedAppointments ?? 0);
  const occupancyRate = totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 0;
  const avgTicket = completedAppts > 0 ? totalRevenue / completedAppts : 0;

  const topServicesData = (data?.topServices ?? []).map(s => ({
    name: s.serviceName,
    agendamentos: Number(s.count),
    receita: Number(s.revenue),
  }));

  const byProfData = (data?.byProfessional ?? []).map(p => ({
    name: p.professionalName,
    value: Number(p.revenue),
  }));

  return (
    <AdminLayout title="Relatório Financeiro">
      <div className="space-y-6">
        {/* Period filter */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">De</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Até</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => {
                  setFrom(format(startOfMonth(today), "yyyy-MM-dd"));
                  setTo(format(endOfMonth(today), "yyyy-MM-dd"));
                }}
              >
                Este mês
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => {
                  const start = new Date(today);
                  start.setDate(today.getDate() - 6);
                  setFrom(format(start, "yyyy-MM-dd"));
                  setTo(format(today, "yyyy-MM-dd"));
                }}
              >
                Últimos 7 dias
              </Button>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Receita Total",
              value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`,
              icon: DollarSign,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Agendamentos",
              value: totalAppts,
              icon: Calendar,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Taxa de Conclusão",
              value: `${occupancyRate}%`,
              icon: Percent,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Ticket Médio",
              value: `R$ ${avgTicket.toFixed(2).replace(".", ",")}`,
              icon: TrendingUp,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">{kpi.label}</p>
              <p className={`font-serif text-2xl font-medium ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top services bar chart */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-serif text-base font-medium text-foreground mb-4">
              Serviços Mais Agendados
            </h3>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Carregando...
              </div>
            ) : topServicesData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topServicesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ece8" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "receita" ? `R$ ${Number(value).toFixed(2)}` : value,
                      name === "receita" ? "Receita" : "Agendamentos",
                    ]}
                  />
                  <Bar dataKey="agendamentos" fill="#be4a4a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue by professional pie chart */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-serif text-base font-medium text-foreground mb-4">
              Receita por Profissional
            </h3>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Carregando...
              </div>
            ) : byProfData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={byProfData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {byProfData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`R$ ${Number(v).toFixed(2)}`, "Receita"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top services table */}
        {topServicesData.length > 0 && (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-serif text-base font-medium text-foreground">Detalhamento por Serviço</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Serviço</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Agendamentos</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topServicesData.map((s, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{s.agendamentos}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">
                      R$ {s.receita.toFixed(2).replace(".", ",")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
