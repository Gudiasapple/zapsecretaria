import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, Search, Phone, Mail, MoreHorizontal, 
  Edit, Trash2, CreditCard, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useTheme } from '../Layout';
import ClienteForm from '../components/forms/ClienteForm';

export default function Clientes() {
  const { dark } = useTheme();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email));
  }, []);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes', userEmail],
    queryFn: () => userEmail ? base44.entities.Cliente.filter({ created_by: userEmail }, '-created_date') : [],
    enabled: !!userEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cliente.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); setShowForm(false); setSelectedCliente(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); setShowForm(false); setSelectedCliente(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });

  const handleSubmit = (data) => {
    if (selectedCliente) updateMutation.mutate({ id: selectedCliente.id, data });
    else createMutation.mutate(data);
  };

  const filtered = clientes.filter(c =>
    c.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone?.includes(searchTerm) ||
    c.cpf?.includes(searchTerm)
  );

  const avatarColors = ['from-violet-500 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-blue-400 to-cyan-500'];

  return (
    <div className={cn("min-h-screen px-4 py-8 md:px-8", dark ? "bg-[#0A0A0F]" : "bg-[#F5F6FA]")}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.15em] mb-1.5", dark ? "text-violet-400" : "text-violet-500")}>Gestão</p>
            <h1 className={cn("text-3xl font-bold tracking-tight", dark ? "text-white" : "text-zinc-900")}>Pacientes</h1>
            <p className={cn("text-sm mt-1", dark ? "text-white/30" : "text-zinc-400")}>{clientes.length} paciente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setSelectedCliente(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25"
          >
            <Plus className="w-4 h-4" />
            Novo Paciente
          </button>
        </div>

        {/* Search */}
        <div className={cn("rounded-2xl border p-4", dark ? "bg-[#13131C] border-white/5" : "bg-white border-zinc-100")}>
          <div className="relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", dark ? "text-white/20" : "text-zinc-400")} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, telefone ou CPF..."
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all",
                dark
                  ? "bg-white/5 border-white/5 text-white placeholder:text-white/20 focus:border-violet-500/50"
                  : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-300 focus:bg-white"
              )}
            />
          </div>
        </div>

        {/* Table */}
        <div className={cn("rounded-2xl border overflow-hidden", dark ? "bg-[#13131C] border-white/5" : "bg-white border-zinc-100")}>
          {/* Table header */}
          <div className={cn("grid grid-cols-[1fr_1fr_auto_auto_40px] gap-4 px-6 py-3 text-[11px] font-bold uppercase tracking-widest border-b", dark ? "text-white/20 border-white/5" : "text-zinc-400 border-zinc-100")}>
            <span>Paciente</span>
            <span className="hidden md:block">Contato</span>
            <span className="hidden lg:block">Convênio</span>
            <span className="hidden lg:block">Cadastro</span>
            <span></span>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className={cn("h-14 rounded-xl animate-pulse", dark ? "bg-white/5" : "bg-zinc-100")} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users className={cn("w-10 h-10", dark ? "text-white/10" : "text-zinc-200")} />
              <p className={cn("text-sm", dark ? "text-white/20" : "text-zinc-400")}>
                {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((cliente, idx) => (
                <div
                  key={cliente.id}
                  className={cn(
                    "grid grid-cols-[1fr_1fr_auto_auto_40px] gap-4 px-6 py-4 items-center transition-colors",
                    dark ? "divide-white/5 hover:bg-white/[0.02] border-white/5" : "divide-zinc-100 hover:bg-zinc-50/50 border-zinc-100"
                  )}
                >
                  {/* Nome */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold flex-shrink-0", avatarColors[idx % avatarColors.length])}>
                      {cliente.nome_completo?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("font-semibold text-sm truncate", dark ? "text-white/90" : "text-zinc-900")}>{cliente.nome_completo}</p>
                      {cliente.cpf && (
                        <p className={cn("text-[11px] flex items-center gap-1 mt-0.5", dark ? "text-white/25" : "text-zinc-400")}>
                          <CreditCard className="w-2.5 h-2.5" /> {cliente.cpf}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="hidden md:block space-y-1">
                    {cliente.telefone && (
                      <p className={cn("text-xs flex items-center gap-1.5", dark ? "text-white/50" : "text-zinc-500")}>
                        <Phone className="w-3 h-3" /> {cliente.telefone}
                      </p>
                    )}
                    {cliente.email && (
                      <p className={cn("text-xs flex items-center gap-1.5 truncate", dark ? "text-white/30" : "text-zinc-400")}>
                        <Mail className="w-3 h-3" /> {cliente.email}
                      </p>
                    )}
                  </div>

                  {/* Convênio */}
                  <div className="hidden lg:block">
                    {cliente.convenio ? (
                      <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border", dark ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-700 bg-emerald-50 border-emerald-200")}>
                        {cliente.convenio}
                      </span>
                    ) : (
                      <span className={cn("text-[11px]", dark ? "text-white/20" : "text-zinc-300")}>Particular</span>
                    )}
                  </div>

                  {/* Data */}
                  <div className="hidden lg:block">
                    {cliente.created_date && (
                      <span className={cn("text-xs", dark ? "text-white/25" : "text-zinc-400")}>
                        {format(new Date(cliente.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", dark ? "text-white/20 hover:text-white/60 hover:bg-white/5" : "text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100")}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={cn("border text-xs", dark ? "bg-[#1a1a28] border-white/10 text-white" : "")}>
                      <DropdownMenuItem onClick={() => { setSelectedCliente(cliente); setShowForm(true); }}>
                        <Edit className="w-3.5 h-3.5 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.confirm('Excluir este paciente?') && deleteMutation.mutate(cliente.id)} className="text-rose-500">
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", dark ? "bg-[#13131C] border-white/10 text-white" : "")}>
          <DialogHeader>
            <DialogTitle className={dark ? "text-white" : ""}>{selectedCliente ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <ClienteForm
            cliente={selectedCliente}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setSelectedCliente(null); }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}