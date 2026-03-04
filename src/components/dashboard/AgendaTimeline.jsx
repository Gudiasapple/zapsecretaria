import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Phone, CheckCircle2, XCircle, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  pendente: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Pendente" },
  confirmado: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Confirmado" },
  cancelado: { color: "bg-rose-100 text-rose-700 border-rose-200", label: "Cancelado" },
  remarcado: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Remarcado" },
  concluido: { color: "bg-slate-100 text-slate-700 border-slate-200", label: "Concluído" },
  nao_compareceu: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "Não Compareceu" },
};

const tipoConfig = {
  consulta: { color: "bg-violet-500", label: "Consulta" },
  exame: { color: "bg-cyan-500", label: "Exame" },
  retorno: { color: "bg-emerald-500", label: "Retorno" },
  procedimento: { color: "bg-rose-500", label: "Procedimento" },
};

export default function AgendaTimeline({ agendamentos, onStatusChange, onEdit }) {
  const sortedAgendamentos = [...agendamentos].sort((a, b) => 
    new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio)
  );

  if (sortedAgendamentos.length === 0) {
    return (
      <Card className="p-12 text-center border-0 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <Clock className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Nenhum agendamento</h3>
        <p className="text-slate-500 mt-1">Não há agendamentos para este período</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedAgendamentos.map((agendamento, index) => {
        const status = statusConfig[agendamento.status] || statusConfig.pendente;
        const tipo = tipoConfig[agendamento.tipo] || tipoConfig.consulta;
        const horaInicio = format(new Date(agendamento.data_hora_inicio), 'HH:mm');
        const horaFim = agendamento.data_hora_fim 
          ? format(new Date(agendamento.data_hora_fim), 'HH:mm')
          : null;

        return (
          <Card 
            key={agendamento.id} 
            className={cn(
              "p-4 border-0 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden",
              agendamento.status === 'cancelado' && "opacity-60"
            )}
          >
            <div className={cn("absolute left-0 top-0 bottom-0 w-1", tipo.color)} />
            
            <div className="flex items-center gap-4 pl-3">
              <div className="text-center min-w-[60px]">
                <p className="text-2xl font-bold text-slate-900">{horaInicio}</p>
                {horaFim && (
                  <p className="text-xs text-slate-400">{horaFim}</p>
                )}
              </div>

              <div className="h-12 w-px bg-slate-200" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900 truncate">
                    {agendamento.cliente_nome}
                  </h4>
                  <Badge variant="outline" className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", tipo.color)} />
                    {tipo.label}
                  </span>
                  {agendamento.profissional && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {agendamento.profissional}
                    </span>
                  )}
                  {agendamento.cliente_telefone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {agendamento.cliente_telefone}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {agendamento.status === 'pendente' && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={() => onStatusChange?.(agendamento.id, 'confirmado')}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => onStatusChange?.(agendamento.id, 'cancelado')}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(agendamento)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange?.(agendamento.id, 'confirmado')}>
                      Confirmar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange?.(agendamento.id, 'concluido')}>
                      Marcar como Concluído
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange?.(agendamento.id, 'nao_compareceu')}>
                      Não Compareceu
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onStatusChange?.(agendamento.id, 'cancelado')}
                      className="text-rose-600"
                    >
                      Cancelar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}