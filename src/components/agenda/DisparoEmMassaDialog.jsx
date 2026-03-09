import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DisparoEmMassaDialog({ open, onOpenChange, data, totalAgendamentos }) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleDisparo = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('disparoEmMassa', {
      data: data.toISOString(),
      motivo,
    });
    setResultado(res.data);
    setLoading(false);
  };

  const handleClose = () => {
    setMotivo('');
    setResultado(null);
    onOpenChange(false);
  };

  const dataFormatada = data ? format(data, "EEEE, d 'de' MMMM", { locale: ptBR }) : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Cancelar dia e notificar pacientes
          </DialogTitle>
        </DialogHeader>

        {!resultado ? (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>{dataFormatada}</strong> — {totalAgendamentos} agendamento{totalAgendamentos !== 1 ? 's' : ''} será{totalAgendamentos !== 1 ? 'ão' : ''} cancelado{totalAgendamentos !== 1 ? 's' : ''} e todos os pacientes receberão uma mensagem no WhatsApp.
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                placeholder="Ex: O médico precisou viajar por urgência familiar."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-slate-500">Se informado, o motivo será incluído na mensagem enviada aos pacientes.</p>
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
                disabled={loading || totalAgendamentos === 0}
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