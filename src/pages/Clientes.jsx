import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, Search, Phone, Mail, MoreHorizontal, 
  User, Edit, Trash2, Calendar, CreditCard 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

import ClienteForm from '../components/forms/ClienteForm';

export default function Clientes() {
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
    queryFn: () => userEmail
      ? base44.entities.Cliente.filter({ created_by: userEmail }, '-created_date')
      : [],
    enabled: !!userEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cliente.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowForm(false);
      setSelectedCliente(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowForm(false);
      setSelectedCliente(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  const handleSubmit = (data) => {
    if (selectedCliente) {
      updateMutation.mutate({ id: selectedCliente.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (cliente) => {
    setSelectedCliente(cliente);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone?.includes(searchTerm) ||
    cliente.cpf?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clientes</h1>
            <p className="text-slate-500 mt-1">{clientes.length} clientes cadastrados</p>
          </div>
          
          <Button 
            onClick={() => {
              setSelectedCliente(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, telefone ou CPF..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-16">
                      <div className="animate-pulse flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-200 rounded" />
                          <div className="h-3 w-24 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {cliente.nome_completo?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{cliente.nome_completo}</p>
                          {cliente.cpf && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {cliente.cpf}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {cliente.telefone && (
                          <p className="text-sm flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3.5 h-3.5" />
                            {cliente.telefone}
                          </p>
                        )}
                        {cliente.email && (
                          <p className="text-sm flex items-center gap-1.5 text-slate-500">
                            <Mail className="w-3.5 h-3.5" />
                            {cliente.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cliente.convenio ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {cliente.convenio}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-sm">Particular</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cliente.created_date && (
                        <span className="text-sm text-slate-500">
                          {format(new Date(cliente.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(cliente.id)}
                            className="text-rose-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Dialog for Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <ClienteForm
            cliente={selectedCliente}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setSelectedCliente(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}