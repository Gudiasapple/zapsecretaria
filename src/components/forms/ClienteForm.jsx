import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, User, Phone, Mail, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ClienteForm({ cliente, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: '',
    email: '',
    cpf: '',
    rg: '',
    data_nascimento: null,
    convenio: '',
    numero_carteirinha: '',
    endereco: '',
    observacoes: '',
    ...cliente,
    data_nascimento: cliente?.data_nascimento ? new Date(cliente.data_nascimento) : null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      data_nascimento: formData.data_nascimento ? format(formData.data_nascimento, 'yyyy-MM-dd') : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome_completo">Nome Completo *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="nome_completo"
              value={formData.nome_completo}
              onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              placeholder="Nome completo"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Data de Nascimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.data_nascimento && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.data_nascimento 
                  ? format(formData.data_nascimento, 'dd/MM/yyyy', { locale: ptBR }) 
                  : 'Selecionar data'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.data_nascimento}
                onSelect={(date) => setFormData({ ...formData, data_nascimento: date })}
                locale={ptBR}
                captionLayout="dropdown-buttons"
                fromYear={1920}
                toYear={new Date().getFullYear()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rg">RG</Label>
          <Input
            id="rg"
            value={formData.rg}
            onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
            placeholder="00.000.000-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="convenio">Convênio</Label>
          <Input
            id="convenio"
            value={formData.convenio}
            onChange={(e) => setFormData({ ...formData, convenio: e.target.value })}
            placeholder="Nome do convênio"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero_carteirinha">Nº Carteirinha</Label>
          <Input
            id="numero_carteirinha"
            value={formData.numero_carteirinha}
            onChange={(e) => setFormData({ ...formData, numero_carteirinha: e.target.value })}
            placeholder="Número da carteirinha"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            id="endereco"
            value={formData.endereco}
            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            placeholder="Endereço completo"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          placeholder="Alergias, condições especiais, etc..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.nome_completo || !formData.telefone}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {cliente ? 'Atualizar' : 'Cadastrar Cliente'}
        </Button>
      </div>
    </form>
  );
}