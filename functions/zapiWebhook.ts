import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
const TOKEN = Deno.env.get("ZAPI_TOKEN");

async function sendMessage(phone, message) {
  const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message })
  });
  return response.json();
}

async function processMessageWithAI(base44, telefone, mensagem, historicoConversa) {
  // Busca configuração da clínica
  const configs = await base44.asServiceRole.entities.ConfiguracaoClinica.list();
  const config = configs[0] || {};

  // Busca ou cria cliente
  let clientes = await base44.asServiceRole.entities.Cliente.filter({ telefone });
  let cliente = clientes[0];
  if (!cliente) {
    cliente = await base44.asServiceRole.entities.Cliente.create({
      nome_completo: 'Paciente ' + telefone,
      telefone,
      ultima_interacao: new Date().toISOString()
    });
  } else {
    await base44.asServiceRole.entities.Cliente.update(cliente.id, {
      ultima_interacao: new Date().toISOString()
    });
  }

  // Busca agendamentos futuros do cliente
  const agendamentos = await base44.asServiceRole.entities.Agendamento.filter({
    cliente_telefone: telefone
  });

  const hoje = new Date();
  const agendamentosFuturos = agendamentos
    .filter(a => new Date(a.data_hora_inicio) > hoje && a.status !== 'cancelado')
    .slice(0, 3);

  // Monta contexto para a IA
  const nomeSecretaria = config.nome_secretaria || 'Maria';
  const nomeClinica = config.nome_clinica || 'Clínica';

  const systemPrompt = `Você é ${nomeSecretaria}, secretária virtual da ${nomeClinica}.

INFORMAÇÕES DA CLÍNICA:
- Nome: ${config.nome_clinica || 'não informado'}
- Endereço: ${config.endereco || 'não informado'}
- Telefone: ${config.telefone || 'não informado'}
- WhatsApp: ${config.whatsapp || 'não informado'}
- Horário: ${config.horario_abertura || '08:00'} às ${config.horario_fechamento || '18:00'}
- Almoço: ${config.horario_almoco_inicio || '12:00'} às ${config.horario_almoco_fim || '13:00'}
- Dias: ${(config.dias_funcionamento || ['Segunda a Sexta']).join(', ')}
- Especialidades: ${(config.especialidades || []).join(', ') || 'não informado'}
- Convênios: ${(config.convenios_aceitos || []).join(', ') || 'não informado'}
- Chave PIX: ${config.chave_pix || 'não informado'}
- Emergência: ${config.contato_emergencia || 'SAMU 192'}

PROFISSIONAIS:
${(config.profissionais || []).map(p => `- ${p.nome} (${p.especialidade}${p.crm ? ', CRM: ' + p.crm : ''})`).join('\n') || 'não informado'}

PACIENTE ATUAL:
- Nome: ${cliente.nome_completo}
- Telefone: ${telefone}
- Convênio: ${cliente.convenio || 'não informado'}

PRÓXIMOS AGENDAMENTOS DO PACIENTE:
${agendamentosFuturos.length > 0
  ? agendamentosFuturos.map(a => `- ${new Date(a.data_hora_inicio).toLocaleString('pt-BR')} - ${a.tipo} com ${a.profissional || 'profissional'} (${a.status})`).join('\n')
  : 'Nenhum agendamento futuro'}

INSTRUÇÕES:
- Seja cordial, humana e profissional
- Responda SEMPRE em português brasileiro
- Respostas curtas e objetivas (máximo 3 parágrafos)
- Para agendar: colete nome, data desejada, tipo de consulta e convênio
- Para emergências graves: encaminhe para ${config.contato_emergencia || 'SAMU 192'} imediatamente
- Data/hora atual: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
- NÃO mencione que é uma IA a menos que perguntado diretamente`;

  const mensagens = [
    { role: 'system', content: systemPrompt },
    ...historicoConversa.slice(-10),
    { role: 'user', content: mensagem }
  ];

  const resposta = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: mensagens.map(m => `${m.role}: ${m.content}`).join('\n\n'),
    response_json_schema: null
  });

  return { resposta, clienteId: cliente.id };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  if (req.method === 'GET') {
    return Response.json({ status: 'Webhook Z-API ativo' });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Método não permitido' }, { status: 405 });
  }

  const body = await req.json();

  // Z-API envia mensagens neste formato
  const isFromMe = body.fromMe;
  if (isFromMe) {
    return Response.json({ status: 'ignored' });
  }

  const telefone = body.phone || body.from;
  const mensagem = body.text?.message || body.message || '';

  if (!telefone || !mensagem) {
    return Response.json({ status: 'ignored' });
  }

  // Normaliza telefone (remove @c.us se existir)
  const telefoneLimpo = telefone.replace('@c.us', '').replace(/\D/g, '');

  // Busca histórico recente da conversa
  const logs = await base44.asServiceRole.entities.LogConversa.filter({
    cliente_telefone: telefoneLimpo
  });

  const historico = logs
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-20)
    .map(l => ({ role: l.papel, content: l.conteudo }));

  // Salva mensagem do usuário
  await base44.asServiceRole.entities.LogConversa.create({
    cliente_telefone: telefoneLimpo,
    papel: 'user',
    conteudo: mensagem,
    tipo_midia: 'texto',
    sessao_id: telefoneLimpo
  });

  // Processa com IA
  const { resposta, clienteId } = await processMessageWithAI(base44, telefoneLimpo, mensagem, historico);

  // Salva resposta da IA
  await base44.asServiceRole.entities.LogConversa.create({
    cliente_id: clienteId,
    cliente_telefone: telefoneLimpo,
    papel: 'assistant',
    conteudo: resposta,
    tipo_midia: 'texto',
    sessao_id: telefoneLimpo
  });

  // Envia resposta via Z-API
  await sendMessage(telefoneLimpo, resposta);

  return Response.json({ status: 'ok' });
});