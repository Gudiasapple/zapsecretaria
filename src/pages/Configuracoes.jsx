import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Clock, MapPin, Phone, Mail, CreditCard,
  Users, Stethoscope, AlertTriangle, Save, Loader2,
  Plus, X, Bot, MessageSquare, Calendar, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { useTheme } from '../Layout';

function FieldGroup({ label, hint, children, dark }) {
  return (
    <div className="space-y-1.5">
      <label className={cn("text-xs font-semibold uppercase tracking-wide", dark ? "text-white/40" : "text-zinc-400")}>{label}</label>
      {children}
      {hint && <p className={cn("text-[11px]", dark ? "text-white/20" : "text-zinc-400")}>{hint}</p>}
    </div>
  );
}

function PremiumInput({ icon: Icon, dark, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5", dark ? "text-white/20" : "text-zinc-400")} />}
      <input
        {...props}
        className={cn(
          "w-full py-2.5 rounded-xl border text-sm outline-none transition-all",
          Icon ? "pl-9 pr-4" : "px-4",
          dark
            ? "bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:border-violet-500/50 focus:bg-white/[0.07]"
            : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-300 focus:bg-white"
        )}
      />
    </div>
  );
}

function PremiumTextarea({ icon: Icon, dark, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className={cn("absolute left-3 top-3 w-3.5 h-3.5", dark ? "text-white/20" : "text-zinc-400")} />}
      <textarea
        {...props}
        className={cn(
          "w-full py-2.5 rounded-xl border text-sm outline-none transition-all resize-none",
          Icon ? "pl-9 pr-4" : "px-4",
          dark
            ? "bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:border-violet-500/50"
            : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-300 focus:bg-white"
        )}
      />
    </div>
  );
}

function SectionCard({ title, description, children, dark }) {
  return (
    <div className={cn("rounded-2xl border p-6 space-y-5", dark ? "bg-[#13131C] border-white/5" : "bg-white border-zinc-100")}>
      <div className="border-b pb-4 mb-5" style={{ borderColor: dark ? 'rgba(255,255,255,0.05)' : '#f4f4f5' }}>
        <h2 className={cn("text-sm font-bold", dark ? "text-white/80" : "text-zinc-900")}>{title}</h2>
        {description && <p className={cn("text-xs mt-0.5", dark ? "text-white/25" : "text-zinc-400")}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function Configuracoes() {
  const { dark } = useTheme();
  const queryClient = useQueryClient();
  
  const { data: configuracoes = [], isLoading } = useQuery({
    queryKey: ['configuracao'],
    queryFn: () => base44.entities.ConfiguracaoClinica.list(),
  });

  const config = configuracoes[0] || {};

  const [formData, setFormData] = useState({
    nome_clinica: '', nome_secretaria: 'Maria', endereco: '',
    telefone: '', whatsapp: '', email: '',
    horario_abertura: '08:00', horario_fechamento: '18:00',
    horario_almoco_inicio: '12:00', horario_almoco_fim: '13:00',
    dias_funcionamento: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    especialidades: [], convenios_aceitos: [], chave_pix: '',
    mensagem_emergencia: '', contato_emergencia: '',
    google_calendar_link: '', icloud_calendar_link: '',
    latitude: null, longitude: null, profissionais: []
  });

  const [newEspecialidade, setNewEspecialidade] = useState('');
  const [newConvenio, setNewConvenio] = useState('');
  const [newProfissional, setNewProfissional] = useState({ nome: '', especialidade: '', crm: '' });

  useEffect(() => {
    if (config.id) {
      setFormData(prev => ({
        ...prev, ...config,
        dias_funcionamento: config.dias_funcionamento || ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
        especialidades: config.especialidades || [],
        convenios_aceitos: config.convenios_aceitos || [],
        profissionais: config.profissionais || []
      }));
    }
  }, [config.id]);

  const saveMutation = useMutation({
    mutationFn: (data) => config.id
      ? base44.entities.ConfiguracaoClinica.update(config.id, data)
      : base44.entities.ConfiguracaoClinica.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['configuracao'] }); toast.success('Configurações salvas!'); },
    onError: () => toast.error('Erro ao salvar'),
  });

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const addEspecialidade = () => {
    if (newEspecialidade.trim()) { set('especialidades', [...(formData.especialidades || []), newEspecialidade.trim()]); setNewEspecialidade(''); }
  };
  const addConvenio = () => {
    if (newConvenio.trim()) { set('convenios_aceitos', [...(formData.convenios_aceitos || []), newConvenio.trim()]); setNewConvenio(''); }
  };
  const addProfissional = () => {
    if (newProfissional.nome.trim()) { set('profissionais', [...(formData.profissionais || []), newProfissional]); setNewProfissional({ nome: '', especialidade: '', crm: '' }); }
  };
  const toggleDia = (dia) => {
    const dias = formData.dias_funcionamento || [];
    set('dias_funcionamento', dias.includes(dia) ? dias.filter(d => d !== dia) : [...dias, dia]);
  };

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  if (isLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", dark ? "bg-[#0A0A0F]" : "bg-[#F5F6FA]")}>
        <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
      </div>
    );
  }

  const tabClass = (active) => cn(
    "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all",
    active
      ? dark ? "bg-violet-600/20 text-violet-300" : "bg-violet-50 text-violet-700"
      : dark ? "text-white/30 hover:text-white/60" : "text-zinc-400 hover:text-zinc-700"
  );

  return (
    <div className={cn("min-h-screen px-4 py-8 md:px-8", dark ? "bg-[#0A0A0F]" : "bg-[#F5F6FA]")}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.15em] mb-1.5", dark ? "text-amber-400" : "text-amber-600")}>Sistema</p>
            <h1 className={cn("text-3xl font-bold tracking-tight", dark ? "text-white" : "text-zinc-900")}>Configurações</h1>
          </div>
          <button
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-amber-950 text-xs font-semibold rounded-xl transition-all shadow-lg shadow-amber-400/30"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar
          </button>
        </div>

        <Tabs defaultValue="clinica" className="space-y-5">
          <div className={cn("rounded-xl border p-1 flex flex-wrap gap-0.5", dark ? "bg-[#13131C] border-white/5" : "bg-white border-zinc-100")}>
            {[
              { value: 'clinica',    label: 'Clínica',    icon: Building2 },
              { value: 'horarios',   label: 'Horários',   icon: Clock },
              { value: 'equipe',     label: 'Equipe',     icon: Users },
              { value: 'convenios',  label: 'Convênios',  icon: CreditCard },
              { value: 'emergencia', label: 'Emergência', icon: AlertTriangle },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-amber-950">
                <Icon className="w-3.5 h-3.5" /> {label}
              </TabsTrigger>
            ))}
          </div>

          <TabsContent value="clinica">
            <SectionCard title="Informações da Clínica" description="Dados básicos utilizados pela IA" dark={dark}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldGroup label="Nome da Clínica" dark={dark}>
                  <PremiumInput icon={Building2} dark={dark} value={formData.nome_clinica} onChange={e => set('nome_clinica', e.target.value)} placeholder="Nome da clínica" />
                </FieldGroup>
                <FieldGroup label="Telefone" dark={dark}>
                  <PremiumInput icon={Phone} dark={dark} value={formData.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 0000-0000" />
                </FieldGroup>
                <FieldGroup label="WhatsApp" dark={dark}>
                  <PremiumInput icon={MessageSquare} dark={dark} value={formData.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(00) 00000-0000" />
                </FieldGroup>
                <FieldGroup label="Email" dark={dark}>
                  <PremiumInput icon={Mail} dark={dark} value={formData.email} onChange={e => set('email', e.target.value)} placeholder="email@clinica.com" />
                </FieldGroup>
              </div>
              <FieldGroup label="Endereço" dark={dark}>
                <PremiumTextarea icon={MapPin} dark={dark} rows={2} value={formData.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade - estado" />
              </FieldGroup>
              <FieldGroup label="Chave PIX" dark={dark}>
                <PremiumInput icon={CreditCard} dark={dark} value={formData.chave_pix} onChange={e => set('chave_pix', e.target.value)} placeholder="CPF, CNPJ, email ou telefone" />
              </FieldGroup>

              <div className={cn("border-t pt-5 space-y-4", dark ? "border-white/5" : "border-zinc-100")}>
                <p className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", dark ? "text-amber-400" : "text-amber-600")}>
                  <Sparkles className="w-3.5 h-3.5" /> Secretária Virtual IA
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup label="Nome da Secretária" hint="Nome com que a IA se apresentará" dark={dark}>
                    <PremiumInput icon={Bot} dark={dark} value={formData.nome_secretaria} onChange={e => set('nome_secretaria', e.target.value)} placeholder="Ex: Maria, Luisa..." />
                  </FieldGroup>
                  <FieldGroup label="Link Google Calendar" hint="Cole o link público do seu calendar" dark={dark}>
                    <PremiumInput icon={Calendar} dark={dark} value={formData.google_calendar_link} onChange={e => set('google_calendar_link', e.target.value)} placeholder="https://calendar.google.com/..." />
                  </FieldGroup>
                </div>
                <FieldGroup label="🍎 iCloud Calendar" hint="webcal://p181-caldav.icloud.com/..." dark={dark}>
                  <PremiumInput icon={Calendar} dark={dark} value={formData.icloud_calendar_link} onChange={e => set('icloud_calendar_link', e.target.value)} placeholder="webcal://..." />
                </FieldGroup>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="horarios">
            <SectionCard title="Horários de Funcionamento" description="A IA usará esses horários para agendar" dark={dark}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Abertura', key: 'horario_abertura' },
                  { label: 'Fechamento', key: 'horario_fechamento' },
                  { label: 'Almoço início', key: 'horario_almoco_inicio' },
                  { label: 'Almoço fim', key: 'horario_almoco_fim' },
                ].map(({ label, key }) => (
                  <FieldGroup key={key} label={label} dark={dark}>
                    <input
                      type="time"
                      value={formData[key]}
                      onChange={e => set(key, e.target.value)}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all",
                        dark ? "bg-white/5 border-white/8 text-white focus:border-violet-500/50" : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-violet-300"
                      )}
                    />
                  </FieldGroup>
                ))}
              </div>
              <FieldGroup label="Dias de Funcionamento" dark={dark}>
                <div className="flex flex-wrap gap-2 mt-1">
                  {diasSemana.map(dia => {
                    const ativo = formData.dias_funcionamento?.includes(dia);
                    return (
                      <button
                        key={dia}
                        onClick={() => toggleDia(dia)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          ativo
                            ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-amber-950 border-transparent shadow-md shadow-amber-400/30"
                            : dark ? "border-white/10 text-white/30 hover:border-white/20" : "border-zinc-200 text-zinc-400 hover:border-violet-200 hover:text-violet-600"
                        )}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>
            </SectionCard>
          </TabsContent>

          <TabsContent value="equipe">
            <SectionCard title="Equipe" description="Profissionais disponíveis para agendamento" dark={dark}>
              <FieldGroup label="Especialidades" dark={dark}>
                <div className="flex gap-2">
                  <PremiumInput dark={dark} value={newEspecialidade} onChange={e => setNewEspecialidade(e.target.value)} placeholder="Nova especialidade" onKeyPress={e => e.key === 'Enter' && addEspecialidade()} />
                  <button onClick={addEspecialidade} className="px-3 rounded-xl border text-xs font-semibold transition-all flex-shrink-0" style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : '' }}>
                    <Plus className={cn("w-4 h-4", dark ? "text-white/40" : "text-zinc-400")} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.especialidades?.map((esp, i) => (
                    <span key={i} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", dark ? "bg-violet-500/10 border-violet-500/20 text-violet-300" : "bg-violet-50 border-violet-200 text-violet-700")}>
                      {esp} <X className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100" onClick={() => set('especialidades', formData.especialidades.filter((_, j) => j !== i))} />
                    </span>
                  ))}
                </div>
              </FieldGroup>

              <FieldGroup label="Profissionais" dark={dark}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <PremiumInput dark={dark} value={newProfissional.nome} onChange={e => setNewProfissional({ ...newProfissional, nome: e.target.value })} placeholder="Nome" />
                  <PremiumInput dark={dark} value={newProfissional.especialidade} onChange={e => setNewProfissional({ ...newProfissional, especialidade: e.target.value })} placeholder="Especialidade" />
                  <div className="flex gap-2">
                    <PremiumInput dark={dark} value={newProfissional.crm} onChange={e => setNewProfissional({ ...newProfissional, crm: e.target.value })} placeholder="CRM / OAB" />
                    <button onClick={addProfissional} className="px-3 rounded-xl border flex-shrink-0" style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : '' }}>
                      <Plus className={cn("w-4 h-4", dark ? "text-white/40" : "text-zinc-400")} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 mt-3">
                  {formData.profissionais?.map((prof, i) => (
                    <div key={i} className={cn("flex items-center justify-between p-3 rounded-xl border", dark ? "bg-white/3 border-white/5" : "bg-zinc-50 border-zinc-100")}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-600 flex items-center justify-center">
                          <Stethoscope className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className={cn("text-sm font-semibold", dark ? "text-white/80" : "text-zinc-900")}>{prof.nome}</p>
                          <p className={cn("text-xs", dark ? "text-white/30" : "text-zinc-500")}>{prof.especialidade} {prof.crm && `• ${prof.crm}`}</p>
                        </div>
                      </div>
                      <button onClick={() => set('profissionais', formData.profissionais.filter((_, j) => j !== i))} className="text-zinc-300 hover:text-rose-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </FieldGroup>
            </SectionCard>
          </TabsContent>

          <TabsContent value="convenios">
            <SectionCard title="Convênios Aceitos" description="Lista de convênios que a clínica atende" dark={dark}>
              <div className="flex gap-2">
                <PremiumInput dark={dark} value={newConvenio} onChange={e => setNewConvenio(e.target.value)} placeholder="Nome do convênio" onKeyPress={e => e.key === 'Enter' && addConvenio()} />
                <button onClick={addConvenio} className="px-4 rounded-xl border text-xs font-semibold" style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : '' }}>
                  <Plus className={cn("w-4 h-4", dark ? "text-white/40" : "text-zinc-400")} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.convenios_aceitos?.length === 0 ? (
                  <p className={cn("text-sm", dark ? "text-white/20" : "text-zinc-400")}>Nenhum convênio cadastrado</p>
                ) : formData.convenios_aceitos?.map((conv, i) => (
                  <span key={i} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border", dark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700")}>
                    <CreditCard className="w-3 h-3" /> {conv}
                    <X className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 ml-0.5" onClick={() => set('convenios_aceitos', formData.convenios_aceitos.filter((_, j) => j !== i))} />
                  </span>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="emergencia">
            <SectionCard title="Emergência" description="A IA usará estas informações ao detectar situações críticas" dark={dark}>
              <FieldGroup label="Contato de Emergência" dark={dark}>
                <PremiumInput icon={Phone} dark={dark} value={formData.contato_emergencia} onChange={e => set('contato_emergencia', e.target.value)} placeholder="Telefone para emergências" />
              </FieldGroup>
              <FieldGroup label="Mensagem de Emergência" hint="Enviada quando a IA detectar sintomas graves" dark={dark}>
                <PremiumTextarea dark={dark} rows={4} value={formData.mensagem_emergencia} onChange={e => set('mensagem_emergencia', e.target.value)} placeholder="Mensagem que será enviada em casos de emergência..." />
              </FieldGroup>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}