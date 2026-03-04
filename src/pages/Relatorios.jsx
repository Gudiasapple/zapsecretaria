import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, isToday, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, Users, Calendar, MessageCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

const filters = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '3 meses', days: 90 },
];

function MetricCard({ label, value, icon: Icon, sub, color = 'zinc' }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-center gap-4">
      <div className={cn(
        "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
        color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-400' : color === 'rose' ? 'bg-rose-500' : 'bg-zinc-900'
      )}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-900 leading-none">{value}</p>
        <p className="text-xs text-zinc-400 mt-1 font-medium">{label}</p>
        {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Relatorios() {
  const [selectedDays, setSelectedDays] = useState(30);

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list('-data_hora_inicio', 500),
  });

  const { data: conversas = [] } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: () => base44.agents.listConversations({ agent_name: 'dra_maria' }),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('-created_date', 500),
  });

  const rangeStart = startOfDay(subDays(new Date(), selectedDays));
  const rangeEnd = endOfDay(new Date());

  const agNoRange = agendamentos.filter(ag => {
    if (!ag.data_hora_inicio) return false;
    return isWithinInterval(new Date(ag.data_hora_inicio), { start: rangeStart, end: rangeEnd });
  });

  const confirmados = agNoRange.filter(a => a.status === 'confirmado' || a.status === 'concluido').length;
  const cancelados  = agNoRange.filter(a => a.status === 'cancelado').length;
  const pendentes   = agNoRange.filter(a => a.status === 'pendente').length;
  const taxaConversao = agNoRange.length > 0 ? Math.round((confirmados / agNoRange.length) * 100) : 0;

  // Agendamentos por dia (últimos N dias)
  const byDay = {};
  for (let i = selectedDays - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'dd/MM');
    byDay[d] = 0;
  }
  agNoRange.forEach(ag => {
    const d = format(new Date(ag.data_hora_inicio), 'dd/MM');
    if (byDay[d] !== undefined) byDay[d]++;
  });
  const byDayData = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  // Status breakdown
  const statusData = [
    { name: 'Confirmados', value: confirmados },
    { name: 'Cancelados', value: cancelados },
    { name: 'Pendentes', value: pendentes },
    { name: 'Outros', value: agNoRange.length - confirmados - cancelados - pendentes },
  ].filter(d => d.value > 0);

  // Tipo breakdown
  const tipoMap = {};
  agNoRange.forEach(ag => {
    const t = ag.tipo || 'outro';
    tipoMap[t] = (tipoMap[t] || 0) + 1;
  });
  const tipoData = Object.entries(tipoMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const convsNoRange = conversas.filter(c => {
    if (!c.updated_date) return false;
    return isWithinInterval(new Date(c.updated_date), { start: rangeStart, end: rangeEnd });
  });

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Análise</p>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Relatórios</h1>
          </div>
          <div className="flex bg-white border border-zinc-200 rounded-lg p-0.5 gap-0.5">
            {filters.map(f => (
              <button
                key={f.days}
                onClick={() => setSelectedDays(f.days)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  selectedDays === f.days ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Agendamentos" value={agNoRange.length} icon={Calendar} color="zinc" />
          <MetricCard label="Confirmados" value={confirmados} icon={CheckCircle2} color="emerald" />
          <MetricCard label="Cancelados" value={cancelados} icon={XCircle} color="rose" />
          <MetricCard label="Taxa de conversão" value={`${taxaConversao}%`} icon={TrendingUp} color="amber" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Conversas no WhatsApp" value={convsNoRange.length} icon={MessageCircle} color="zinc" />
          <MetricCard label="Total de pacientes" value={clientes.length} icon={Users} color="zinc" />
          <MetricCard label="Pendentes" value={pendentes} icon={Clock} color="amber" />
          <MetricCard label="Total na agenda" value={agendamentos.length} icon={Calendar} color="zinc" sub="histórico completo" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Linha - Agendamentos por dia */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 p-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-6">Agendamentos por dia</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDayData} barSize={selectedDays <= 7 ? 24 : selectedDays <= 30 ? 12 : 6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#a1a1aa' }}
                  tickLine={false}
                  axisLine={false}
                  interval={selectedDays <= 7 ? 0 : selectedDays <= 30 ? 3 : 6}
                />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Agendamentos" fill="#18181b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie - Status */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-6">Status dos agendamentos</h2>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {statusData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-zinc-600">{d.name}</span>
                      </div>
                      <span className="font-semibold text-zinc-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">Sem dados</div>
            )}
          </div>
        </div>

        {/* Tipo */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-6">Agendamentos por tipo</h2>
          {tipoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tipoData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#52525b' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Total" fill="#18181b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-24 text-zinc-400 text-sm">Sem dados neste período</div>
          )}
        </div>

      </div>
    </div>
  );
}