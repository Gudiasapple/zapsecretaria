import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, isToday, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, Clock, CheckCircle2, MessageCircle, Bot, TrendingUp, ArrowRight, Zap, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTheme } from '../Layout';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import AgendaTimeline from '../components/dashboard/AgendaTimeline';

function KpiCard({ label, value, icon: Icon, accent = 'violet', trend, dark }) {
  const accents = {
    violet: { grad: 'from-amber-400 via-yellow-300 to-amber-500', glow: 'shadow-amber-400/30', badge: dark ? 'text-amber-300 bg-amber-500/10' : 'text-amber-800 bg-amber-50' },
    emerald: { grad: 'from-slate-300 via-zinc-100 to-slate-400', glow: 'shadow-zinc-400/20', badge: dark ? 'text-zinc-300 bg-zinc-500/10' : 'text-zinc-700 bg-zinc-50' },
    amber: { grad: 'from-amber-500 via-yellow-400 to-amber-600', glow: 'shadow-amber-500/25', badge: dark ? 'text-amber-300 bg-amber-500/10' : 'text-amber-800 bg-amber-50' },
    blue: { grad: 'from-zinc-300 via-slate-200 to-zinc-500', glow: 'shadow-zinc-400/20', badge: dark ? 'text-zinc-300 bg-zinc-500/10' : 'text-zinc-700 bg-zinc-50' },
  };
  const a = accents[accent];
  return (
    <div className={cn(
      "rounded-2xl p-5 border transition-all hover:scale-[1.01] cursor-default",
      dark ? "bg-[#13131C] border-white/5 hover:border-white/10" : "bg-white border-zinc-100 hover:border-zinc-200 hover:shadow-md"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg", a.grad, a.glow)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", a.badge)}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className={cn("text-3xl font-bold tracking-tight", dark ? "text-white" : "text-zinc-900")}>{value}</p>
      <p className={cn("text-[12px] font-medium mt-1", dark ? "text-white/40" : "text-zinc-400")}>{label}</p>
    </div>
  );
}

const MiniTooltip = ({ active, payload, dark }) => {
  if (active && payload?.length) {
    return (
      <div className={cn("text-xs px-2.5 py-1.5 rounded-lg shadow-xl border", dark ? "bg-[#1a1a28] border-white/10 text-white" : "bg-white border-zinc-100 text-zinc-900")}>
        {payload[0].value} consultas
      </div>
    );
  }
  return null;
};

const filterLabels = ['hoje', 'semana', 'todos'];
const filterNames = { hoje: 'Hoje', semana: 'Semana', todos: 'Todos' };

export default function Dashboard() {
  const { dark } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState('hoje');
  const today = new Date();

  const [userEmail, setUserEmail] = useState(null);
  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email));
  }, []);

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos', userEmail],
    queryFn: () => userEmail ? base44.entities.Agendamento.filter({ created_by: userEmail }, '-data_hora_inicio', 200) : [],
    enabled: !!userEmail,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes', userEmail],
    queryFn: () => userEmail ? base44.entities.Cliente.filter({ created_by: userEmail }, '-created_date', 200) : [],
    enabled: !!userEmail,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agendamento.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agendamentos'] }),
  });

  useEffect(() => {
    const unsub = base44.entities.Agendamento.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    });
    return unsub;
  }, []);

  const todayAg = agendamentos.filter(ag => ag.data_hora_inicio && isToday(new Date(ag.data_hora_inicio)));
  const confirmados = todayAg.filter(ag => ag.status === 'confirmado').length;
  const pendentes = todayAg.filter(ag => ag.status === 'pendente').length;

  const filtered = agendamentos.filter(ag => {
    if (!ag.data_hora_inicio) return false;
    const d = new Date(ag.data_hora_inicio);
    if (dateFilter === 'hoje') return isToday(d);
    if (dateFilter === 'semana') return d >= startOfWeek(today, { locale: ptBR }) && d <= endOfWeek(today, { locale: ptBR });
    return true;
  });

  // Sparkline data (últimos 7 dias)
  const sparkData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const count = agendamentos.filter(ag => {
      if (!ag.data_hora_inicio) return false;
      return isWithinInterval(new Date(ag.data_hora_inicio), { start: startOfDay(d), end: endOfDay(d) });
    }).length;
    return { date: format(d, 'dd/MM'), count };
  });

  const { data: conversas = [] } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: () => base44.agents.listConversations({ agent_name: 'dra_maria' }),
  });

  const convHoje = conversas.filter(c => c.updated_date && isToday(new Date(c.updated_date))).length;

  return (
    <div className={cn("min-h-screen px-4 py-8 md:px-8", dark ? "bg-[#0A0A0F]" : "bg-[#F5F6FA]")}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.15em] mb-1.5", dark ? "text-amber-400" : "text-amber-600")}>
              {format(today, "EEEE", { locale: ptBR })}
            </p>
            <h1 className={cn("text-3xl font-bold tracking-tight", dark ? "text-white" : "text-zinc-900")}>
              {format(today, "d 'de' MMMM", { locale: ptBR })}
            </h1>
            <p className={cn("text-sm mt-1", dark ? "text-white/30" : "text-zinc-400")}>
              {todayAg.length} consultas agendadas hoje
            </p>
          </div>
          <button
            onClick={() => navigate(createPageUrl('ConectarWhatsApp'))}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 text-xs font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/30"
          >
            <Zap className="w-3.5 h-3.5" />
            Conectar WhatsApp
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Consultas hoje" value={todayAg.length} icon={Calendar} accent="violet" dark={dark} />
          <KpiCard label="Confirmados" value={confirmados} icon={CheckCircle2} accent="emerald" dark={dark} />
          <KpiCard label="Pendentes" value={pendentes} icon={Clock} accent="amber" dark={dark} />
          <KpiCard label="Total de pacientes" value={clientes.length} icon={Users} accent="blue" dark={dark} />
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Agenda */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className={cn("text-sm font-bold uppercase tracking-widest", dark ? "text-white/50" : "text-zinc-400")}>Agenda</h2>
              <div className={cn("flex p-0.5 rounded-lg border gap-0.5", dark ? "bg-white/5 border-white/5" : "bg-white border-zinc-200")}>
                {filterLabels.map(f => (
                  <button
                    key={f}
                    onClick={() => setDateFilter(f)}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                      dateFilter === f
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-sm"
                        : dark ? "text-white/30 hover:text-white/60" : "text-zinc-400 hover:text-zinc-700"
                    )}
                  >
                    {filterNames[f]}
                  </button>
                ))}
              </div>
            </div>
            <AgendaTimeline
              agendamentos={filtered}
              onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status } })}
              onEdit={() => {}}
              dark={dark}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* IA Card */}
            <div className="relative rounded-2xl p-6 overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Secretária IA</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[11px] text-white/60">Ativa no WhatsApp</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <p className="text-2xl font-bold text-white">{todayAg.length}</p>
                    <p className="text-[11px] text-white/50 mt-0.5">Consultas hoje</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <p className="text-2xl font-bold text-white">{convHoje}</p>
                    <p className="text-[11px] text-white/50 mt-0.5">Conv. hoje</p>
                  </div>
                </div>

                {/* Mini sparkline */}
                <div className="mb-5">
                  <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest mb-2">Últimos 7 dias</p>
                  <ResponsiveContainer width="100%" height={48}>
                    <AreaChart data={sparkData}>
                      <defs>
                        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="count" stroke="rgba(255,255,255,0.5)" strokeWidth={2} fill="url(#sparkGrad)" dot={false} />
                      <Tooltip content={({ active, payload }) => <MiniTooltip active={active} payload={payload} dark={true} />} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <button
                  onClick={() => navigate(createPageUrl('ConectarWhatsApp'))}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-xs font-semibold text-white border border-white/10"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Gerenciar conexão
                </button>
              </div>
            </div>

            {/* Atividade recente */}
            <div className={cn("rounded-2xl p-5 border", dark ? "bg-[#13131C] border-white/5" : "bg-white border-zinc-100")}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn("text-xs font-bold uppercase tracking-widest", dark ? "text-white/30" : "text-zinc-400")}>
                  Navegação Rápida
                </h3>
                <Activity className={cn("w-3.5 h-3.5", dark ? "text-white/20" : "text-zinc-300")} />
              </div>
              <div className="space-y-1">
                {[
                  { label: 'Ver agenda completa', page: 'Agenda', icon: Calendar },
                  { label: 'Gerenciar pacientes', page: 'Clientes', icon: Users },
                  { label: 'Histórico de conversas', page: 'Conversas', icon: MessageCircle },
                  { label: 'Relatórios & Análises', page: 'Relatorios', icon: TrendingUp },
                ].map(({ label, page, icon: Icon }) => (
                  <Link
                    key={page}
                    to={createPageUrl(page)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all",
                      dark ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    <ArrowRight className={cn("w-3 h-3 ml-auto", dark ? "text-white/15" : "text-zinc-300")} />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}