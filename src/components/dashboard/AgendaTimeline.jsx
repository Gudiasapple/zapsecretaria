import React from 'react';
import { format } from 'date-fns';
import { Clock, User, Phone, CheckCircle2, XCircle, MoreHorizontal } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  pendente:       { dot: 'bg-amber-400',   label: 'Pendente',       badge: 'text-amber-600',   darkBadge: 'text-amber-300' },
  confirmado:     { dot: 'bg-emerald-400', label: 'Confirmado',     badge: 'text-emerald-600', darkBadge: 'text-emerald-300' },
  cancelado:      { dot: 'bg-zinc-300',    label: 'Cancelado',      badge: 'text-zinc-400',    darkBadge: 'text-white/30' },
  remarcado:      { dot: 'bg-blue-400',    label: 'Remarcado',      badge: 'text-blue-600',    darkBadge: 'text-blue-300' },
  concluido:      { dot: 'bg-zinc-400',    label: 'Concluído',      badge: 'text-zinc-500',    darkBadge: 'text-white/40' },
  nao_compareceu: { dot: 'bg-rose-400',    label: 'Não Compareceu', badge: 'text-rose-600',    darkBadge: 'text-rose-300' },
};

const tipoLabel = {
  consulta: 'Consulta', exame: 'Exame', retorno: 'Retorno', procedimento: 'Procedimento',
};

export default function AgendaTimeline({ agendamentos, onStatusChange, onEdit, dark = false }) {
  const sorted = [...agendamentos].sort((a, b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio));

  if (sorted.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className={cn("w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center", dark ? "bg-white/5" : "bg-zinc-100")}>
          <Clock className={cn("w-5 h-5", dark ? "text-white/20" : "text-zinc-400")} />
        </div>
        <p className={cn("text-sm font-medium", dark ? "text-white/30" : "text-zinc-500")}>Nenhum agendamento neste período</p>
        <p className={cn("text-xs mt-1", dark ? "text-white/15" : "text-zinc-400")}>A secretária agenda automaticamente via WhatsApp</p>
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
              "rounded-xl border px-4 py-3.5 flex items-center gap-4 transition-all",
              dark
                ? "bg-[#13131C] border-white/5 hover:border-white/10"
                : "bg-white border-zinc-100 hover:border-zinc-200 hover:shadow-sm",
              isCanceled && "opacity-40"
            )}
          >
            {/* Hora */}
            <div className="text-right min-w-[44px] flex-shrink-0">
              <p className={cn("text-sm font-bold tabular-nums", dark ? "text-white/80" : "text-zinc-900")}>{horaInicio}</p>
              {horaFim && <p className={cn("text-[10px] tabular-nums", dark ? "text-white/25" : "text-zinc-400")}>{horaFim}</p>}
            </div>

            {/* Divider */}
            <div className={cn("w-px h-10 flex-shrink-0", dark ? "bg-white/5" : "bg-zinc-100")} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn("text-sm font-semibold truncate", dark ? "text-white/90" : "text-zinc-900")}>{ag.cliente_nome}</p>
                <span className={cn("flex items-center gap-1 text-[10px] font-semibold", dark ? s.darkBadge : s.badge)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                  {s.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className={cn("text-[11px] font-medium", dark ? "text-white/30" : "text-zinc-400")}>{tipoLabel[ag.tipo] || ag.tipo}</span>
                {ag.profissional && (
                  <span className={cn("text-[11px] flex items-center gap-1", dark ? "text-white/25" : "text-zinc-400")}>
                    <User className="w-3 h-3" />{ag.profissional}
                  </span>
                )}
                {ag.cliente_telefone && (
                  <span className={cn("text-[11px] flex items-center gap-1", dark ? "text-white/20" : "text-zinc-400")}>
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
                    className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-emerald-500", dark ? "hover:bg-emerald-500/10" : "hover:bg-emerald-50")}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onStatusChange?.(ag.id, 'cancelado')}
                    className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", dark ? "text-white/15 hover:text-rose-400 hover:bg-rose-500/10" : "text-zinc-300 hover:bg-zinc-50 hover:text-rose-500")}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", dark ? "text-white/15 hover:text-white/40 hover:bg-white/5" : "text-zinc-300 hover:bg-zinc-50 hover:text-zinc-600")}>
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn("text-xs border", dark ? "bg-[#1a1a28] border-white/10 text-white" : "")}>
                  <DropdownMenuItem onClick={() => onStatusChange?.(ag.id, 'confirmado')}>Confirmar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange?.(ag.id, 'concluido')}>Marcar Concluído</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange?.(ag.id, 'nao_compareceu')}>Não Compareceu</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange?.(ag.id, 'cancelado')} className="text-rose-500">Cancelar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}