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
  const [showAgendamentoForm, setShowAgendamentoForm] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [dateFilter, setDateFilter] = useState('hoje');

  const today = new Date();

  const { data: agendamentos = [], isLoading: loadingAgendamentos } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list('-data_hora_inicio', 100),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('-created_date', 100),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['logs'],
    queryFn: () => base44.entities.LogConversa.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Agendamento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setShowAgendamentoForm(false);
      setSelectedAgendamento(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agendamento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setShowAgendamentoForm(false);
      setSelectedAgendamento(null);
    },
  });

  const handleStatusChange = async (id, status) => {
    await updateMutation.mutateAsync({ id, data: { status } });
  };

  const handleSubmitAgendamento = (data) => {
    if (selectedAgendamento) {
      updateMutation.mutate({ id: selectedAgendamento.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEditAgendamento = (agendamento) => {
    setSelectedAgendamento(agendamento);
    setShowAgendamentoForm(true);
  };

  // Filter agendamentos by date
  const filteredAgendamentos = agendamentos.filter(ag => {
    if (!ag.data_hora_inicio) return false;
    const agDate = new Date(ag.data_hora_inicio);
    
    if (dateFilter === 'hoje') {
      return isToday(agDate);
    } else if (dateFilter === 'semana') {
      return agDate >= startOfWeek(today, { locale: ptBR }) && 
             agDate <= endOfWeek(today, { locale: ptBR });
    }
    return true;
  });

  // Calculate stats
  const todayAgendamentos = agendamentos.filter(ag => 
    ag.data_hora_inicio && isToday(new Date(ag.data_hora_inicio))
  );
  const confirmados = todayAgendamentos.filter(ag => ag.status === 'confirmado').length;
  const pendentes = todayAgendamentos.filter(ag => ag.status === 'pendente').length;
  const cancelados = agendamentos.filter(ag => ag.status === 'cancelado').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => queryClient.invalidateQueries()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              onClick={() => {
                setSelectedAgendamento(null);
                setShowAgendamentoForm(true);
              }}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Agendamentos Hoje"
            value={todayAgendamentos.length}
            icon={Calendar}
            trend="+12% vs ontem"
            trendUp
          />
          <StatsCard
            title="Confirmados"
            value={confirmados}
            icon={CheckCircle2}
          />
          <StatsCard
            title="Pendentes"
            value={pendentes}
            icon={Clock}
          />
          <StatsCard
            title="Total Clientes"
            value={clientes.length}
            icon={Users}
          />
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
            {/* Quick Stats */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-600 to-purple-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-white/20">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Dra. Maria</h3>
                    <p className="text-sm text-white/80">Secretária IA</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-2xl font-bold">{logs.length}</p>
                    <p className="text-xs text-white/70">Mensagens hoje</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">98%</p>
                    <p className="text-xs text-white/70">Taxa de resolução</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Conversations */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-violet-600" />
                    Conversas Recentes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <RecentConversations logs={logs} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog for Agendamento Form */}
      <Dialog open={showAgendamentoForm} onOpenChange={setShowAgendamentoForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAgendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
          </DialogHeader>
          <AgendamentoForm
            agendamento={selectedAgendamento}
            clientes={clientes}
            onSubmit={handleSubmitAgendamento}
            onCancel={() => {
              setShowAgendamentoForm(false);
              setSelectedAgendamento(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}