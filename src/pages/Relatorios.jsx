import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line
} from 'recharts';
import { TrendingUp, Users, Calendar, MessageCircle, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTheme } from '../Layout';

const STATUS_COLORS = {
  Confirmados: '#8b5cf6',
  Cancelados:  '#f43f5e',
  Pendentes:   '#f59e0b',
  Outros:      '#64748b',
};

const filters = [
  { label: '7d',    days: 7 },
  { label: '30d',   days: 30 },
  { label: '90d',   days: 90 },
];

function MetricCard({ label, value, icon: Icon, sub, accent = 'violet', dark }) {
  const accents = {
    violet:  { grad: 'from-amber-400 via-yellow-300 to-amber-500',   glow: 'shadow-amber-400/30' },
    emerald: { grad: 'from-slate-300 via-zinc-100 to-slate-400',     glow: 'shadow-zinc-400/20' },
    rose:    { grad: 'from-rose-400 to-pink-500',                    glow: 'shadow-rose-500/20' },
    amber:   { grad: 'from-amber-500 via-yellow-400 to-amber-600',   glow: 'shadow-amber-500/25' },
    blue:    { grad: 'from-zinc-300 via-slate-200 to-zinc-500',      glow: 'shadow-zinc-400/20' },
  };
  const a = accents[accent] || accents.violet;
  return (
    <div className={cn(
      "rounded-2xl p-5 border transition-all hover:scale-[1.01]",
      dark ? "bg-[#13131C] border-white/5" : "bg-white border-zinc-100 hover:shadow-md"
    )}>
      <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg mb-4", a.grad, a.glow)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className={cn("text-2xl font-bold tracking-tight", dark ? "text-white" : "text-zinc-900")}>{value}</p>
      <p className={cn("text-[11px] font-medium mt-1", dark ? "text-white/35" : "text-zinc-400")}>{label}</p>
      {sub && <p className={cn("text-[10px] mt-0.5", dark ? "text-white/20" : "text-zinc-300")}>{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children, dark }) {
  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      dark ? "bg-[#13131C] border-white/5" : "bg-white border-zinc-100"
    )}>
      <h2 className={cn("text-xs font-bold uppercase tracking-[0.12em] mb-5", dark ? "text-white/30" : "text-zinc-400")}>
        {title}
      </h2>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, dark }) => {
  if (active && payload?.length) {
    return (
      <div className={cn("text-xs px-3 py-2 rounded-xl shadow-2xl border", dark ? "bg-[#1a1a2e] border-white/10 text-white" : "bg-white border-zinc-100 text-zinc-900")}>
        <p className="font-semibold mb-1 opacity-60">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: <span className="font-bold">{p.value}</span></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Relatorios() {
  const { dark } = useTheme();
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
  const rangeEnd   = endOfDay(new Date());

  const agNoRange = agendamentos.filter(ag => {
    if (!ag.data_hora_inicio) return false;
    return isWithinInterval(new Date(ag.data_hora_inicio), { start: rangeStart, end: rangeEnd });
  });

  const confirmados = agNoRange.filter(a => a.status === 'confirmado' || a.status === 'concluido').length;
  const cancelados  = agNoRange.filter(a => a.status === 'cancelado').length;
  const pendentes   = agNoRange.filter(a => a.status === 'pendente').length;
  const taxaConversao = agNoRange.length > 0 ? Math.round((confirmados / agNoRange.length) * 100) : 0;

  // Area chart - agendamentos por dia
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

  const statusData = [
    { name: 'Confirmados', value: confirmados },
    { name: 'Cancelados',  value: cancelados },
    { name: 'Pendentes',   value: pendentes },
    { name: 'Outros',      value: Math.max(0, agNoRange.length - confirmados - cancelados - pendentes) },
  ].filter(d => d.value > 0);

  const tipoMap = {};
  agNoRange.forEach(ag => {
    const t = ag.tipo || 'outro';
    tipoMap[t] = (tipoMap[t] || 0) + 1;
  });
  const tipoData = Object.entries(tipoMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value
  }));

  const convsNoRange = conversas.filter(c => {
    if (!c.updated_date) return false;
    return isWithinInterval(new Date(c.updated_date), { start: rangeStart, end: rangeEnd });
  });

  const gridColor   = dark ? 'rgba(255,255,255,0.04)' : '#f4f4f5';
  const tickColor   = dark ? 'rgba(255,255,255,0.25)' : '#a1a1aa';
  const barFill     = dark ? '#d97706' : '#f59e0b';
  const areaStroke  = dark ? '#d97706' : '#f59e0b';
  const areaFillId  = dark ? 'areaDark' : 'areaLight';

  return (
    <div className={cn("min-h-screen px-4 py-8 md:px-8", dark ? "bg-[#0A0A0F]" : "bg-[#F5F6FA]")}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.15em] mb-1.5", dark ? "text-amber-400" : "text-amber-600")}>Análise</p>
            <h1 className={cn("text-3xl font-bold tracking-tight", dark ? "text-white" : "text-zinc-900")}>Relatórios</h1>
          </div>
          <div className={cn("flex p-0.5 rounded-xl border gap-0.5", dark ? "bg-white/5 border-white/5" : "bg-white border-zinc-200")}>
            {filters.map(f => (
              <button
                key={f.days}
                onClick={() => setSelectedDays(f.days)}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  selectedDays === f.days
                    ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-amber-950 shadow-md shadow-amber-400/30"
                    : dark ? "text-white/30 hover:text-white/60" : "text-zinc-400 hover:text-zinc-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Agendamentos" value={agNoRange.length} icon={Calendar} accent="violet" dark={dark} />
          <MetricCard label="Confirmados"  value={confirmados}      icon={CheckCircle2} accent="emerald" dark={dark} />
          <MetricCard label="Cancelados"   value={cancelados}       icon={XCircle}      accent="rose"    dark={dark} />
          <MetricCard label="Taxa conversão" value={`${taxaConversao}%`} icon={TrendingUp} accent="amber" dark={dark} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Conversas WhatsApp" value={convsNoRange.length} icon={MessageCircle} accent="blue" dark={dark} />
          <MetricCard label="Pacientes total"    value={clientes.length}      icon={Users}          accent="violet" dark={dark} />
          <MetricCard label="Pendentes"          value={pendentes}            icon={Clock}           accent="amber"  dark={dark} />
          <MetricCard label="Total histórico"    value={agendamentos.length}  icon={Activity}        accent="blue" sub="todos os registros" dark={dark} />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Area chart */}
          <div className="lg:col-span-2">
            <ChartCard title="Volume de agendamentos" dark={dark}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={byDayData}>
                  <defs>
                    <linearGradient id="areaDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#d97706" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: tickColor }}
                    tickLine={false} axisLine={false}
                    interval={selectedDays <= 7 ? 0 : selectedDays <= 30 ? 3 : 6}
                  />
                  <YAxis tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip dark={dark} />} />
                  <Area type="monotone" dataKey="count" name="Agendamentos" stroke={areaStroke} strokeWidth={2.5} fill={`url(#${areaFillId})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Donut chart */}
          <ChartCard title="Status" dark={dark}>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={3}>
                      {statusData.map((d, i) => (
                        <Cell key={i} fill={STATUS_COLORS[d.name] || '#64748b'} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip dark={dark} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {statusData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[d.name] || '#64748b' }} />
                        <span className={dark ? "text-white/50" : "text-zinc-500"}>{d.name}</span>
                      </div>
                      <span className={cn("font-bold", dark ? "text-white" : "text-zinc-900")}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={cn("flex items-center justify-center h-40 text-sm", dark ? "text-white/20" : "text-zinc-300")}>Sem dados</div>
            )}
          </ChartCard>
        </div>

        {/* Tipo chart */}
        <ChartCard title="Por tipo de atendimento" dark={dark}>
          {tipoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tipoData} layout="vertical" barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: tickColor }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} width={100} />
                <Tooltip content={<CustomTooltip dark={dark} />} />
                <Bar dataKey="value" name="Total" fill={barFill} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={cn("flex items-center justify-center h-24 text-sm", dark ? "text-white/20" : "text-zinc-300")}>Sem dados neste período</div>
          )}
        </ChartCard>

      </div>
    </div>
  );
}