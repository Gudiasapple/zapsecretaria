import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, Users, Clock, CheckCircle2,
  MessageCircle, RefreshCw, Bot, Zap, Link2
} from 'lucide-react';

import StatsCard from '../components/dashboard/StatsCard';
import AgendaTimeline from '../components/dashboard/AgendaTimeline';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });

  const handleStatusChange = async (id, status) => {
    await updateMutation.mutateAsync({ id, data: { status } });
  };

  // Real-time updates from agent
  useEffect(() => {
    const unsubscribe = base44.entities.Agendamento.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    });
    return unsubscribe;
  }, []);

  // Filter agendamentos by date
  const filteredAgendamentos = agendamentos.filter(ag => {
    if (!ag.data_hora_inicio) return false;
    const agDate = new Date(ag.data_hora_inicio);
    if (dateFilter === 'hoje') return isToday(agDate);
    if (dateFilter === 'semana') {
      return agDate >= startOfWeek(today, { locale: ptBR }) && 
             agDate <= endOfWeek(today, { locale: ptBR });
    }
    return true;
  });

  const todayAgendamentos = agendamentos.filter(ag => 
    ag.data_hora_inicio && isToday(new Date(ag.data_hora_inicio))
  );
  const confirmados = todayAgendamentos.filter(ag => ag.status === 'confirmado').length;
  const pendentes = todayAgendamentos.filter(ag => ag.status === 'pendente').length;
  const agendadosPelaIA = agendamentos.filter(ag => ag.created_by === 'agent').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <a href={base44.agents.getWhatsAppConnectURL('dra_maria')} target="_blank" rel="noopener noreferrer">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <MessageCircle className="w-4 h-4 mr-2" />
                Conectar WhatsApp
              </Button>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Agendamentos Hoje" value={todayAgendamentos.length} icon={Calendar} />
          <StatsCard title="Confirmados" value={confirmados} icon={CheckCircle2} />
          <StatsCard title="Pendentes" value={pendentes} icon={Clock} />
          <StatsCard title="Total Clientes" value={clientes.length} icon={Users} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agenda */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Agenda</CardTitle>
                  <Tabs value={dateFilter} onValueChange={setDateFilter}>
                    <TabsList className="bg-slate-100">
                      <TabsTrigger value="hoje">Hoje</TabsTrigger>
                      <TabsTrigger value="semana">Semana</TabsTrigger>
                      <TabsTrigger value="todos">Todos</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <AgendaTimeline
                  agendamentos={filteredAgendamentos}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditAgendamento}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* IA Status Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-600 to-purple-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-white/20">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Maria — IA Ativa</h3>
                    <p className="text-sm text-white/80">Atendendo no WhatsApp 24h</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-2xl font-bold">{agendamentos.filter(ag => {
                      const d = new Date(ag.created_date);
                      return isToday(d);
                    }).length}</p>
                    <p className="text-xs text-white/70">Agendados hoje</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{clientes.length}</p>
                    <p className="text-xs text-white/70">Pacientes</p>
                  </div>
                </div>
                <a
                  href={base44.agents.getWhatsAppConnectURL('dra_maria')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Conectar WhatsApp
                </a>
              </CardContent>
            </Card>

            {/* Como funciona */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Como funciona
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                  <p>Paciente manda mensagem no WhatsApp</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                  <p>Maria responde, verifica horários e agenda</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                  <p>Agendamento aparece aqui automaticamente</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}