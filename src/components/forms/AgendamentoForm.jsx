import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, User, Phone, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const horarios = [];
for (let h = 8; h <= 17; h++) {
  if (h !== 12) { // Pula horário de almoço
    horarios.push(`${h.toString().padStart(2, '0')}:00`);
    horarios.push(`${h.toString().padStart(2, '0')}:30`);
  }
}

export default function AgendamentoForm({ 
  agendamento, 
  clientes = [],
  configuracao,
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_id: '',
    tipo: 'consulta',
    data: null,
    hora: '09:00',
    profissional: '',
    especialidade: '',
    forma_pagamento: '',
    preparo: '',
    observacoes: '',
    status: 'pendente',
    ...agendamento
  });

  useEffect(() => {
    if (agendamento?.data_hora_inicio) {
      const date = new Date(agendamento.data_hora_inicio);
      setFormData(prev => ({
        ...prev,
        data: date,
        hora: format(date, 'HH:mm')
      }));
    } else if (agendamento?.data) {
      setFormData(prev => ({
        ...prev,
        data: agendamento.data,
        hora: agendamento.hora || '09:00'
      }));
    }
  }, [agendamento]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const [hours, minutes] = formData.hora.split(':').map(Number);
    const dataHoraInicio = setMinutes(setHours(formData.data, hours), minutes);
    const dataHoraFim = new Date(dataHoraInicio.getTime() + 30 * 60000); // +30 min

    onSubmit({
      ...formData,
      data_hora_inicio: dataHoraInicio.toISOString(),
      data_hora_fim: dataHoraFim.toISOString(),
    });
  };

  const handleClienteSelect = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setFormData(prev => ({
        ...prev,
        cliente_id: cliente.id,
        cliente_nome: cliente.nome_completo,
        cliente_telefone: cliente.telefone
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cliente */}
        <div className="space-y-2">
          <Label>Cliente Existente</Label>
          <Select 
            value={formData.cliente_id} 
            onValueChange={handleClienteSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clientes.map(cliente => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome_completo} - {cliente.telefone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <span className="text-sm text-slate-500 mb-2">ou preencha os dados abaixo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="cliente_nome"
              value={formData.cliente_nome}
              onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
              placeholder="Nome completo"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cliente_telefone">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="cliente_telefone"
              value={formData.cliente_telefone}
              onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select 
            value={formData.tipo} 
            onValueChange={(v) => setFormData({ ...formData, tipo: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consulta">Consulta</SelectItem>
              <SelectItem value="exame">Exame</SelectItem>
              <SelectItem value="retorno">Retorno</SelectItem>
              <SelectItem value="procedimento">Procedimento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Data *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.data && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.data ? format(formData.data, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.data}
                onSelect={(date) => setFormData({ ...formData, data: date })}
                locale={ptBR}
                disabled={(date) => { const today = new Date(); today.setHours(0,0,0,0); return date < today || date.getDay() === 0; }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Horário *</Label>
          <Select 
            value={formData.hora} 
            onValueChange={(v) => setFormData({ ...formData, hora: v })}
          >
            <SelectTrigger>
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {horarios.map(h => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Profissional</Label>
          <Input
            value={formData.profissional}
            onChange={(e) => setFormData({ ...formData, profissional: e.target.value })}
            placeholder="Nome do profissional"
          />
        </div>

        <div className="space-y-2">
          <Label>Forma de Pagamento</Label>
          <Select 
            value={formData.forma_pagamento} 
            onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="convenio">Convênio</SelectItem>
              <SelectItem value="particular_pix">Particular (PIX)</SelectItem>
              <SelectItem value="particular_cartao">Particular (Cartão)</SelectItem>
              <SelectItem value="particular_dinheiro">Particular (Dinheiro)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Preparo / Instruções</Label>
        <Textarea
          value={formData.preparo}
          onChange={(e) => setFormData({ ...formData, preparo: e.target.value })}
          placeholder="Instruções de preparo para o paciente..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          placeholder="Observações adicionais..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.cliente_nome || !formData.data}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {agendamento ? 'Atualizar' : 'Criar Agendamento'}
        </Button>
      </div>
    </form>
  );
}