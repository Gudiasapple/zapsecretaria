import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ChevronLeft, ChevronRight, BellOff } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useTheme } from '../Layout';
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
  const { dark } = useTheme();
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
    <div className={cn("min-h-screen px-4 py-8 md:px-8", dark ? "bg-[#0A0A0F]" : "bg-[#F5F6FA]")}>
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.15em] mb-1.5", dark ? "text-violet-400" : "text-violet-500")}>Agenda</p>
            <h1 className={cn("text-3xl font-bold tracking-tight", dark ? "text-white" : "text-zinc-900")}>
              {format(weekStart, "'Semana de' d 'de' MMMM", { locale: ptBR })}
            </h1>
          </div>
          
          <div className="flex gap-2">
            <div className={cn("flex items-center rounded-xl border", dark ? "bg-white/5 border-white/5" : "bg-white border-zinc-200")}>
              <button onClick={handlePrevWeek} className={cn("w-9 h-9 flex items-center justify-center rounded-l-xl transition-colors", dark ? "text-white/30 hover:text-white/60 hover:bg-white/5" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50")}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setSelectedDate(new Date())} className={cn("px-3 text-xs font-semibold transition-colors", dark ? "text-white/40 hover:text-white/70" : "text-zinc-500 hover:text-zinc-800")}>
                Hoje
              </button>
              <button onClick={handleNextWeek} className={cn("w-9 h-9 flex items-center justify-center rounded-r-xl transition-colors", dark ? "text-white/30 hover:text-white/60 hover:bg-white/5" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50")}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowDisparo(true)}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all", dark ? "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/15" : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100")}
            >
              <BellOff className="w-3.5 h-3.5" />
              Cancelar dia
            </button>
            <button
              onClick={() => { setSelectedAgendamento(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25"
            >
              <Plus className="w-4 h-4" />
              Novo
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={cn("rounded-2xl border overflow-hidden", dark ? "bg-[#13131C] border-white/5" : "bg-white border-zinc-100")}>
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header with days */}
              <div className={cn("grid grid-cols-8 border-b", dark ? "bg-white/[0.02] border-white/5" : "bg-zinc-50 border-zinc-100")}>
                <div className={cn("p-3 text-center text-xs font-bold uppercase tracking-widest border-r", dark ? "text-white/20 border-white/5" : "text-zinc-400 border-zinc-100")}>
                  Horário
                </div>
                {weekDays.map((day, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "p-3 text-center border-r last:border-r-0",
                      dark ? "border-white/5" : "border-zinc-100",
                      isToday(day) && (dark ? "bg-violet-500/10" : "bg-violet-50")
                    )}
                  >
                    <p className={cn("text-[10px] font-bold uppercase tracking-widest", dark ? "text-white/25" : "text-zinc-400")}>
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={cn(
                      "text-xl font-bold mt-1",
                      isToday(day) ? "text-violet-500" : dark ? "text-white/70" : "text-zinc-800"
                    )}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              <div className={cn("divide-y", dark ? "divide-white/[0.03]" : "divide-zinc-50")}>
                {timeSlots.map((time) => (
                  <div key={time} className={cn("grid grid-cols-8 divide-x", dark ? "divide-white/[0.03]" : "divide-zinc-100")}>
                    <div className={cn("p-2 text-center text-xs font-semibold tabular-nums", dark ? "text-white/15 bg-white/[0.01]" : "text-zinc-400 bg-zinc-50/50")}>
                      {time}
                    </div>
                    {weekDays.map((day, dayIndex) => {
                      const slots = getAgendamentosForSlot(day, time);
                      return (
                        <div 
                          key={dayIndex} 
                          className={cn(
                            "p-1 min-h-[60px] transition-colors cursor-pointer",
                            dark ? "hover:bg-white/[0.02]" : "hover:bg-zinc-50",
                            isToday(day) && (dark ? "bg-violet-500/[0.04]" : "bg-violet-50/20")
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
                                "p-2 rounded-lg text-xs mb-1 border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer",
                                tipoColors[ag.tipo] || "border-l-zinc-400",
                                dark ? "bg-white/5 hover:bg-white/8" : "bg-white hover:shadow-md"
                              )}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={cn("font-semibold truncate", dark ? "text-white/80" : "text-zinc-800")}>{ag.cliente_nome}</span>
                                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusColors[ag.status])} />
                              </div>
                              <p className={cn("truncate text-[10px]", dark ? "text-white/25" : "text-zinc-400")}>{ag.tipo}</p>
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
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-5 justify-center">
          {[
            { color: 'bg-amber-400',  label: 'Pendente' },
            { color: 'bg-emerald-400', label: 'Confirmado' },
            { color: 'bg-rose-400',   label: 'Cancelado' },
            { color: 'bg-zinc-400',   label: 'Concluído' },
          ].map(({ color, label }) => (
            <div key={label} className={cn("flex items-center gap-2 text-xs font-medium", dark ? "text-white/25" : "text-zinc-400")}>
              <div className={cn("w-2 h-2 rounded-full", color)} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Dialog Disparo em Massa */}
      <DisparoEmMassaDialog
        open={showDisparo}
        onOpenChange={setShowDisparo}
        data={selectedDate}
        agendamentos={agendamentos}
      />

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