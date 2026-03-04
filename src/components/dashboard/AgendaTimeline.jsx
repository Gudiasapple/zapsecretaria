import React from 'react';
import { format } from 'date-fns';
import { Clock, User, Phone, CheckCircle2, XCircle, MoreHorizontal } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  pendente:       { dot: 'bg-amber-400',   label: 'Pendente',        badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  confirmado:     { dot: 'bg-emerald-400', label: 'Confirmado',      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  cancelado:      { dot: 'bg-zinc-300',    label: 'Cancelado',       badge: 'bg-zinc-50 text-zinc-500 ring-zinc-200' },
  remarcado:      { dot: 'bg-blue-400',    label: 'Remarcado',       badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  concluido:      { dot: 'bg-zinc-400',    label: 'Concluído',       badge: 'bg-zinc-50 text-zinc-600 ring-zinc-200' },
  nao_compareceu: { dot: 'bg-rose-400',    label: 'Não Compareceu',  badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

const tipoLabel = {
  consulta: 'Consulta', exame: 'Exame', retorno: 'Retorno', procedimento: 'Procedimento',
};

export default function AgendaTimeline({ agendamentos, onStatusChange, onEdit }) {
  const sorted = [...agendamentos].sort((a, b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio));

  if (sorted.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <Clock className="w-5 h-5 text-zinc-400" />
        </div>
        <p className="text-sm font-medium text-zinc-500">Nenhum agendamento neste período</p>
        <p className="text-xs text-zinc-400 mt-1">A Maria agenda automaticamente via WhatsApp</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((ag) => {
        const s = statusConfig[ag.status] || statusConfig.pendente;
        const horaInicio = format(new Date(ag.data_hora_inicio), 'HH:mm');
        const horaFim = ag.data_hora_fim ? format(new Date(ag.data_hora_fim), 'HH:mm') : null;
        const isCanceled = ag.status === 'cancelado';

        return (
          <div
            key={ag.id}
            className={cn(
              "bg-white rounded-xl border border-zinc-100 px-4 py-3.5 flex items-center gap-4 hover:border-zinc-200 transition-all",
              isCanceled && "opacity-50"
            )}
          >
            {/* Hora */}
            <div className="text-right min-w-[44px] flex-shrink-0">
              <p className="text-sm font-bold text-zinc-900 tabular-nums">{horaInicio}</p>
              {horaFim && <p className="text-[10px] text-zinc-400 tabular-nums">{horaFim}</p>}
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-zinc-100 flex-shrink-0" />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-zinc-900 truncate">{ag.cliente_nome}</p>
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1", s.badge)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full mr-1", s.dot)} />
                  {s.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-[11px] text-zinc-400 font-medium">{tipoLabel[ag.tipo] || ag.tipo}</span>
                {ag.profissional && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <User className="w-3 h-3" />{ag.profissional}
                  </span>
                )}
                {ag.cliente_telefone && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" />{ag.cliente_telefone}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {ag.status === 'pendente' && (
                <>
                  <button
                    onClick={() => onStatusChange?.(ag.id, 'confirmado')}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onStatusChange?.(ag.id, 'cancelado')}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:bg-zinc-50 hover:text-rose-500 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:bg-zinc-50 hover:text-zinc-600 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem onClick={() => onStatusChange?.(ag.id, 'confirmado')}>Confirmar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange?.(ag.id, 'concluido')}>Marcar Concluído</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange?.(ag.id, 'nao_compareceu')}>Não Compareceu</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange?.(ag.id, 'cancelado')} className="text-rose-600">Cancelar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}