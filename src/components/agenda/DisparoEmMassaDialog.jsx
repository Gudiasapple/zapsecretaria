import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

const PERIODOS = [
  { label: 'Dia todo', value: 'todos', horaDe: null, horaAte: null },
  { label: 'Manhã (até 12h)', value: 'manha', horaDe: 0, horaAte: 12 },
  { label: 'Tarde (12h em diante)', value: 'tarde', horaDe: 12, horaAte: 24 },
  { label: 'Horário específico', value: 'especifico', horaDe: null, horaAte: null },
];

export default function DisparoEmMassaDialog({ open, onOpenChange, data, agendamentos = [] }) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [periodo, setPeriodo] = useState('todos');
  const [horarioEspecifico, setHorarioEspecifico] = useState('');

  // Filtra agendamentos do dia e período selecionado
  const agendamentosFiltrados = useMemo(() => {
    if (!data) return [];
    return agendamentos.filter(ag => {
      if (!ag.data_hora_inicio || ag.status === 'cancelado') return false;
      const agData = new Date(ag.data_hora_inicio);
      if (!isSameDay(agData, data)) return false;

      if (periodo === 'manha') return agData.getHours() < 12;
      if (periodo === 'tarde') return agData.getHours() >= 12;
      if (periodo === 'especifico' && horarioEspecifico) {
        const [h, m] = horarioEspecifico.split(':').map(Number);
        return agData.getHours() === h && agData.getMinutes() === m;
      }
      return true;
    });
  }, [data, agendamentos, periodo, horarioEspecifico]);

  const handleDisparo = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('disparoEmMassa', {
      data: data.toISOString(),
      motivo,
      periodo,
      horarioEspecifico: periodo === 'especifico' ? horarioEspecifico : null,
    });
    setResultado(res.data);
    setLoading(false);
  };

  const handleClose = () => {
    setMotivo('');
    setResultado(null);
    setPeriodo('todos');
    setHorarioEspecifico('');
    onOpenChange(false);
  };

  const dataFormatada = data ? format(data, "EEEE, d 'de' MMMM", { locale: ptBR }) : '';
  const total = agendamentosFiltrados.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Cancelar e notificar pacientes
          </DialogTitle>
        </DialogHeader>

        {!resultado ? (
          <div className="space-y-4">
            {/* Seleção de período */}
            <div className="space-y-2">
              <Label>Qual período cancelar?</Label>
              <div className="grid grid-cols-2 gap-2">
                {PERIODOS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setPeriodo(p.value); setHorarioEspecifico(''); }}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm border font-medium transition-all text-left",
                      periodo === p.value
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input de horário específico */}
            {periodo === 'especifico' && (
              <div className="space-y-2">
                <Label>Informe o horário</Label>
                <input
                  type="time"
                  value={horarioEspecifico}
                  onChange={e => setHorarioEspecifico(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            )}

            {/* Resumo */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>{dataFormatada}</strong>
              {periodo === 'manha' && ' — manhã'}
              {periodo === 'tarde' && ' — tarde'}
              {periodo === 'especifico' && horarioEspecifico && ` — ${horarioEspecifico}h`}
              {' '}—{' '}
              {total > 0
                ? <><strong>{total}</strong> paciente{total !== 1 ? 's' : ''} será{total !== 1 ? 'ão' : ''} notificado{total !== 1 ? 's' : ''}.</>
                : <span className="text-amber-700">Nenhum agendamento encontrado para este filtro.</span>
              }
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                placeholder="Ex: O médico precisou viajar por urgência familiar."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-slate-500">Se informado, será incluído na mensagem enviada aos pacientes.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800">Disparos concluídos!</p>
                <p className="text-sm text-emerald-700">{resultado.enviados} de {resultado.total} mensagens enviadas.</p>
              </div>
            </div>
            {resultado.resultados?.some(r => r.status === 'sem_telefone') && (
              <p className="text-xs text-amber-600">
                ⚠️ {resultado.resultados.filter(r => r.status === 'sem_telefone').length} paciente(s) sem telefone cadastrado não foram notificados.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {!resultado ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>Cancelar</Button>
              <Button
                onClick={handleDisparo}
                disabled={loading || total === 0 || (periodo === 'especifico' && !horarioEspecifico)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Confirmar e Enviar</>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}