import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, Clock, CheckCircle2, MessageCircle, RefreshCw, Bot, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AgendaTimeline from '../components/dashboard/AgendaTimeline';

function StatCard({ label, value, icon: Icon, color = 'zinc' }) {
  const colors = {
    zinc:    { bg: 'bg-zinc-900',    text: 'text-zinc-900',    light: 'bg-zinc-50',   icon: 'text-white' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', icon: 'text-white' },
    amber:   { bg: 'bg-amber-500',   text: 'text-amber-700',   light: 'bg-amber-50',  icon: 'text-white' },
    blue:    { bg: 'bg-blue-500',    text: 'text-blue-700',    light: 'bg-blue-50',   icon: 'text-white' },
  };
  const c = colors[color];
  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-100 flex items-center gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", c.bg)}>
        <Icon className={cn("w-5 h-5", c.icon)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-900 leading-none">{value}</p>
        <p className="text-xs text-zinc-400 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

const filterLabels = ['hoje', 'semana', 'todos'];
const filterNames  = { hoje: 'Hoje', semana: 'Esta semana', todos: 'Todos' };

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState('hoje');
  const today = new Date();

  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list('-data_hora_inicio', 100),
  });
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('-created_date', 100),
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
  const pendentes   = todayAg.filter(ag => ag.status === 'pendente').length;

  const filtered = agendamentos.filter(ag => {
    if (!ag.data_hora_inicio) return false;
    const d = new Date(ag.data_hora_inicio);
    if (dateFilter === 'hoje')   return isToday(d);
    if (dateFilter === 'semana') return d >= startOfWeek(today, { locale: ptBR }) && d <= endOfWeek(today, { locale: ptBR });
    return true;
  });

  const agHoje = agendamentos.filter(ag => ag.data_hora_inicio && isToday(new Date(ag.created_date))).length;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
              {format(today, "EEEE", { locale: ptBR })}
            </p>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              {format(today, "d 'de' MMMM", { locale: ptBR })}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => queryClient.invalidateQueries()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-white rounded-lg border border-zinc-200 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </button>
            <a
              href={base44.agents.getWhatsAppConnectURL('dra_maria')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Conectar WhatsApp
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Consultas hoje"  value={todayAg.length}  icon={Calendar}      color="zinc"    />
          <StatCard label="Confirmados"     value={confirmados}      icon={CheckCircle2}  color="emerald" />
          <StatCard label="Pendentes"       value={pendentes}        icon={Clock}         color="amber"   />
          <StatCard label="Pacientes"       value={clientes.length}  icon={Users}         color="blue"    />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Agenda */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Agenda</h2>
              <div className="flex bg-white border border-zinc-200 rounded-lg p-0.5 gap-0.5">
                {filterLabels.map(f => (
                  <button
                    key={f}
                    onClick={() => setDateFilter(f)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      dateFilter === f ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700"
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
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* IA Card */}
            <div className="bg-zinc-900 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Maria</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-zinc-400">Ativa no WhatsApp</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xl font-bold">{agHoje}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Agendados hoje</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xl font-bold">{clientes.length}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Pacientes</p>
                </div>
              </div>

              <a
                href={base44.agents.getWhatsAppConnectURL('dra_maria')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs font-semibold"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Conectar WhatsApp
              </a>
            </div>

            {/* Fluxo */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-5">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Como funciona</h3>
              <div className="space-y-4">
                {[
                  { n: '1', text: 'Paciente manda mensagem no WhatsApp da clínica' },
                  { n: '2', text: 'Maria responde, conversa e marca a consulta' },
                  { n: '3', text: 'Agendamento aparece aqui em tempo real' },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
                    <p className="text-xs text-zinc-600 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-100">
              {[
                { label: 'Ver agenda completa', page: 'Agenda' },
                { label: 'Gerenciar pacientes', page: 'Clientes' },
                { label: 'Histórico de conversas', page: 'Conversas' },
              ].map(({ label, page }) => (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className="flex items-center justify-between px-4 py-3 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  {label}
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}