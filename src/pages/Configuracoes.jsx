import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Building2, Clock, MapPin, Phone, Mail, CreditCard,
  Users, Stethoscope, AlertTriangle, Save, Loader2,
  Plus, X, Bot, MessageSquare, Calendar, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function Configuracoes() {
  const queryClient = useQueryClient();
  
  const { data: configuracoes = [], isLoading } = useQuery({
    queryKey: ['configuracao'],
    queryFn: () => base44.entities.ConfiguracaoClinica.list(),
  });

  const config = configuracoes[0] || {};

  const [formData, setFormData] = useState({
    nome_clinica: '',
    nome_secretaria: 'Maria',
    endereco: '',
    telefone: '',
    whatsapp: '',
    email: '',
    horario_abertura: '08:00',
    horario_fechamento: '18:00',
    horario_almoco_inicio: '12:00',
    horario_almoco_fim: '13:00',
    dias_funcionamento: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    especialidades: [],
    convenios_aceitos: [],
    chave_pix: '',
    mensagem_emergencia: '',
    contato_emergencia: '',
    google_calendar_link: '',
    icloud_calendar_link: '',
    latitude: null,
    longitude: null,
    profissionais: []
  });

  const [newEspecialidade, setNewEspecialidade] = useState('');
  const [newConvenio, setNewConvenio] = useState('');
  const [newProfissional, setNewProfissional] = useState({ nome: '', especialidade: '', crm: '' });

  useEffect(() => {
    if (config.id) {
      setFormData({
        ...formData,
        ...config,
        dias_funcionamento: config.dias_funcionamento || ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
        especialidades: config.especialidades || [],
        convenios_aceitos: config.convenios_aceitos || [],
        profissionais: config.profissionais || []
      });
    }
  }, [config.id]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (config.id) {
        return base44.entities.ConfiguracaoClinica.update(config.id, data);
      } else {
        return base44.entities.ConfiguracaoClinica.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const addEspecialidade = () => {
    if (newEspecialidade.trim()) {
      setFormData({
        ...formData,
        especialidades: [...(formData.especialidades || []), newEspecialidade.trim()]
      });
      setNewEspecialidade('');
    }
  };

  const removeEspecialidade = (index) => {
    setFormData({
      ...formData,
      especialidades: formData.especialidades.filter((_, i) => i !== index)
    });
  };

  const addConvenio = () => {
    if (newConvenio.trim()) {
      setFormData({
        ...formData,
        convenios_aceitos: [...(formData.convenios_aceitos || []), newConvenio.trim()]
      });
      setNewConvenio('');
    }
  };

  const removeConvenio = (index) => {
    setFormData({
      ...formData,
      convenios_aceitos: formData.convenios_aceitos.filter((_, i) => i !== index)
    });
  };

  const addProfissional = () => {
    if (newProfissional.nome.trim()) {
      setFormData({
        ...formData,
        profissionais: [...(formData.profissionais || []), newProfissional]
      });
      setNewProfissional({ nome: '', especialidade: '', crm: '' });
    }
  };

  const removeProfissional = (index) => {
    setFormData({
      ...formData,
      profissionais: formData.profissionais.filter((_, i) => i !== index)
    });
  };

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const toggleDia = (dia) => {
    const dias = formData.dias_funcionamento || [];
    if (dias.includes(dia)) {
      setFormData({ ...formData, dias_funcionamento: dias.filter(d => d !== dia) });
    } else {
      setFormData({ ...formData, dias_funcionamento: [...dias, dia] });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações</h1>
            <p className="text-slate-500 mt-1">Configure as informações da sua clínica</p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>

        <Tabs defaultValue="clinica" className="space-y-6">
          <TabsList className="bg-white shadow-sm border p-1">
            <TabsTrigger value="clinica" className="gap-2">
              <Building2 className="w-4 h-4" />
              Clínica
            </TabsTrigger>
            <TabsTrigger value="horarios" className="gap-2">
              <Clock className="w-4 h-4" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-2">
              <Users className="w-4 h-4" />
              Equipe
            </TabsTrigger>
            <TabsTrigger value="convenios" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Convênios
            </TabsTrigger>
            <TabsTrigger value="emergencia" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Emergência
            </TabsTrigger>
          </TabsList>

          {/* Clínica Tab */}
          <TabsContent value="clinica">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Informações da Clínica</CardTitle>
                <CardDescription>Dados básicos que serão usados pela IA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Clínica</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.nome_clinica}
                        onChange={(e) => setFormData({ ...formData, nome_clinica: e.target.value })}
                        placeholder="Nome da clínica"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(00) 0000-0000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@clinica.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Endereço Completo</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Textarea
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, número, bairro, cidade - estado"
                      className="pl-10 min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Chave PIX</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.chave_pix}
                      onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                      placeholder="CPF, CNPJ, email ou telefone"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Separador IA */}
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Secretária Virtual
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Secretária</Label>
                      <div className="relative">
                        <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          value={formData.nome_secretaria}
                          onChange={(e) => setFormData({ ...formData, nome_secretaria: e.target.value })}
                          placeholder="Ex: Maria, Luisa, Ana..."
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-slate-400">Nome com que a IA se apresentará no WhatsApp</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Link do Google Calendar</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          value={formData.google_calendar_link}
                          onChange={(e) => setFormData({ ...formData, google_calendar_link: e.target.value })}
                          placeholder="https://calendar.google.com/calendar/..."
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-slate-400">Cole o link público do seu Google Calendar para acompanhar no celular</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Horários Tab */}
          <TabsContent value="horarios">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Horários de Funcionamento</CardTitle>
                <CardDescription>A IA usará esses horários para agendamentos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Abertura</Label>
                    <Input
                      type="time"
                      value={formData.horario_abertura}
                      onChange={(e) => setFormData({ ...formData, horario_abertura: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fechamento</Label>
                    <Input
                      type="time"
                      value={formData.horario_fechamento}
                      onChange={(e) => setFormData({ ...formData, horario_fechamento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Almoço (início)</Label>
                    <Input
                      type="time"
                      value={formData.horario_almoco_inicio}
                      onChange={(e) => setFormData({ ...formData, horario_almoco_inicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Almoço (fim)</Label>
                    <Input
                      type="time"
                      value={formData.horario_almoco_fim}
                      onChange={(e) => setFormData({ ...formData, horario_almoco_fim: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Dias de Funcionamento</Label>
                  <div className="flex flex-wrap gap-2">
                    {diasSemana.map((dia) => (
                      <Badge
                        key={dia}
                        variant={formData.dias_funcionamento?.includes(dia) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          formData.dias_funcionamento?.includes(dia)
                            ? "bg-violet-600 hover:bg-violet-700"
                            : "hover:bg-slate-100"
                        }`}
                        onClick={() => toggleDia(dia)}
                      >
                        {dia}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipe Tab */}
          <TabsContent value="equipe">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Equipe Médica</CardTitle>
                <CardDescription>Profissionais disponíveis para agendamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Especialidades */}
                <div className="space-y-3">
                  <Label>Especialidades</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newEspecialidade}
                      onChange={(e) => setNewEspecialidade(e.target.value)}
                      placeholder="Nova especialidade"
                      onKeyPress={(e) => e.key === 'Enter' && addEspecialidade()}
                    />
                    <Button onClick={addEspecialidade} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.especialidades?.map((esp, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {esp}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-rose-500" 
                          onClick={() => removeEspecialidade(i)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Profissionais */}
                <div className="space-y-3">
                  <Label>Profissionais</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      value={newProfissional.nome}
                      onChange={(e) => setNewProfissional({ ...newProfissional, nome: e.target.value })}
                      placeholder="Nome"
                    />
                    <Input
                      value={newProfissional.especialidade}
                      onChange={(e) => setNewProfissional({ ...newProfissional, especialidade: e.target.value })}
                      placeholder="Especialidade"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newProfissional.crm}
                        onChange={(e) => setNewProfissional({ ...newProfissional, crm: e.target.value })}
                        placeholder="CRM"
                      />
                      <Button onClick={addProfissional} variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.profissionais?.map((prof, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-violet-600" />
                          </div>
                          <div>
                            <p className="font-medium">{prof.nome}</p>
                            <p className="text-sm text-slate-500">
                              {prof.especialidade} {prof.crm && `• CRM ${prof.crm}`}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeProfissional(i)}
                        >
                          <X className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Convênios Tab */}
          <TabsContent value="convenios">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Convênios Aceitos</CardTitle>
                <CardDescription>Lista de convênios que a clínica atende</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newConvenio}
                    onChange={(e) => setNewConvenio(e.target.value)}
                    placeholder="Nome do convênio"
                    onKeyPress={(e) => e.key === 'Enter' && addConvenio()}
                  />
                  <Button onClick={addConvenio} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.convenios_aceitos?.map((conv, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 py-1.5 px-3">
                      <CreditCard className="w-3 h-3" />
                      {conv}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-rose-500 ml-1" 
                        onClick={() => removeConvenio(i)}
                      />
                    </Badge>
                  ))}
                  {formData.convenios_aceitos?.length === 0 && (
                    <p className="text-slate-500 text-sm">Nenhum convênio cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergência Tab */}
          <TabsContent value="emergencia">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Configurações de Emergência
                </CardTitle>
                <CardDescription>
                  A IA usará estas informações quando detectar situações de emergência
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Contato de Emergência</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.contato_emergencia}
                      onChange={(e) => setFormData({ ...formData, contato_emergencia: e.target.value })}
                      placeholder="Telefone para emergências"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem de Emergência</Label>
                  <Textarea
                    value={formData.mensagem_emergencia}
                    onChange={(e) => setFormData({ ...formData, mensagem_emergencia: e.target.value })}
                    placeholder="Mensagem que será enviada em casos de emergência..."
                    rows={4}
                  />
                  <p className="text-xs text-slate-500">
                    Esta mensagem será enviada quando a IA detectar sintomas graves como dor intensa, 
                    falta de ar, sangramento, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}