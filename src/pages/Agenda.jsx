import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus, ChevronLeft, ChevronRight, Clock, User, Phone,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

import AgendamentoForm from '../components/forms/AgendamentoForm';
import DisparoEmMassaDialog from '../components/agenda/DisparoEmMassaDialog';

const statusColors = {
  pendente: "bg-amber-500",
  confirmado: "bg-emerald-500",
  cancelado: "bg-rose-500",
  remarcado: "bg-blue-500",
  concluido: "bg-slate-500",
  nao_compareceu: "bg-orange-500",
};

const tipoColors = {
  consulta: "border-l-violet-500",
  exame: "border-l-cyan-500",
  retorno: "border-l-emerald-500",
  procedimento: "border-l-rose-500",
};

export default function Agenda() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [showDisparo, setShowDisparo] = useState(false);

  // Real-time update when IA creates an appointment
  useEffect(() => {
    const unsubscribe = base44.entities.Agendamento.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    });
    return unsubscribe;
  }, []);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'

  const [userEmail, setUserEmail] = useState(null);
  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email));
  }, []);

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ['agendamentos', userEmail],
    queryFn: () => userEmail
      ? base44.entities.Agendamento.filter({ created_by: userEmail }, '-data_hora_inicio')
      : [],
    enabled: !!userEmail,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes', userEmail],
    queryFn: () => userEmail
      ? base44.entities.Cliente.filter({ created_by: userEmail })
      : [],
    enabled: !!userEmail,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const ag = await base44.entities.Agendamento.create(data);
      // Cria evento no Google Calendar em background
      base44.functions.invoke('googleCalendarEvent', { agendamento: { ...data, id: ag.id } }).catch(() => {});
      return ag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const ag = await base44.entities.Agendamento.update(id, data);
      // Atualiza/cria evento no Google Calendar em background
      base44.functions.invoke('googleCalendarEvent', { agendamento: { ...data, id } }).catch(() => {});
      return ag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setShowForm(false);
      setSelectedAgendamento(null);
    },
  });

  const handleSubmit = (data) => {
    if (selectedAgendamento?.id) {
      updateMutation.mutate({ id: selectedAgendamento.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Generate week days
  const weekStart = startOfWeek(selectedDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Generate time slots (8:00 to 18:00, excluding 12:00-13:00)
  const timeSlots = [];
  for (let h = 8; h <= 17; h++) {
    if (h !== 12) {
      timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
      timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }

  const getAgendamentosForSlot = (date, time) => {
    return agendamentos.filter(ag => {
      if (!ag.data_hora_inicio) return false;
      const agDate = new Date(ag.data_hora_inicio);
      const agTime = format(agDate, 'HH:mm');
      return isSameDay(agDate, date) && agTime === time;
    });
  };

  const handlePrevWeek = () => setSelectedDate(addDays(selectedDate, -7));
  const handleNextWeek = () => setSelectedDate(addDays(selectedDate, 7));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agenda</h1>
            <p className="text-slate-500 mt-1">
              {format(weekStart, "'Semana de' d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center bg-white rounded-lg shadow-sm border">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedDate(new Date())}
                className="px-4"
              >
                Hoje
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              onClick={() => {
                setSelectedAgendamento(null);
                setShowForm(true);
              }}

              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header with days */}
              <div className="grid grid-cols-8 border-b bg-slate-50">
                <div className="p-3 text-center text-sm font-medium text-slate-500 border-r">
                  Horário
                </div>
                {weekDays.map((day, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "p-3 text-center border-r last:border-r-0",
                      isToday(day) && "bg-violet-50"
                    )}
                  >
                    <p className="text-xs text-slate-500 uppercase">
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={cn(
                      "text-lg font-semibold mt-1",
                      isToday(day) ? "text-violet-600" : "text-slate-900"
                    )}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              <div className="divide-y">
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 divide-x">
                    <div className="p-2 text-center text-sm text-slate-500 bg-slate-50/50">
                      {time}
                    </div>
                    {weekDays.map((day, dayIndex) => {
                      const slots = getAgendamentosForSlot(day, time);
                      return (
                        <div 
                          key={dayIndex} 
                          className={cn(
                            "p-1 min-h-[60px] hover:bg-slate-50 transition-colors cursor-pointer",
                            isToday(day) && "bg-violet-50/30"
                          )}
                          onClick={() => {
                            setSelectedDate(day);
                            setSelectedAgendamento({ data: day, hora: time });
                            setShowForm(true);
                          }}
                        >
                          {slots.map((ag) => (
                            <div
                              key={ag.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAgendamento(ag);
                                setShowForm(true);
                              }}
                              className={cn(
                                "p-2 rounded-lg text-xs mb-1 border-l-4 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer",
                                tipoColors[ag.tipo] || "border-l-slate-400"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium truncate">{ag.cliente_nome}</span>
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  statusColors[ag.status]
                                )} />
                              </div>
                              <p className="text-slate-500 truncate">{ag.tipo}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            Pendente
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            Confirmado
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            Cancelado
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            Concluído
          </div>
        </div>
      </div>

      {/* Dialog for Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAgendamento?.id ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
          </DialogHeader>
          <AgendamentoForm
            agendamento={selectedAgendamento}
            clientes={clientes}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setSelectedAgendamento(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}