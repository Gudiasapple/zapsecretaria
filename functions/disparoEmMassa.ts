import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
const TOKEN = Deno.env.get("ZAPI_TOKEN");
const CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

async function sendMessage(phone, message) {
  const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': CLIENT_TOKEN
    },
    body: JSON.stringify({ phone, message })
  });
  return response.json();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, motivo, periodo, horarioEspecifico } = await req.json();

  if (!data) {
    return Response.json({ error: 'data é obrigatória' }, { status: 400 });
  }

  // Busca todos os agendamentos do dia que não estão cancelados
  const agendamentos = await base44.asServiceRole.entities.Agendamento.filter({ created_by: user.email });

  const dataAlvo = new Date(data);
  const agendamentosDoDia = agendamentos.filter(ag => {
    if (!ag.data_hora_inicio) return false;
    if (ag.status === 'cancelado') return false;
    const agData = new Date(ag.data_hora_inicio);
    const mesmodia = agData.getFullYear() === dataAlvo.getFullYear() &&
                     agData.getMonth() === dataAlvo.getMonth() &&
                     agData.getDate() === dataAlvo.getDate();
    if (!mesmodia) return false;

    if (periodo === 'manha') return agData.getHours() < 12;
    if (periodo === 'tarde') return agData.getHours() >= 12;
    if (periodo === 'especifico' && horarioEspecifico) {
      const [h, m] = horarioEspecifico.split(':').map(Number);
      return agData.getHours() === h && agData.getMinutes() === m;
    }
    return true;
  });

  if (agendamentosDoDia.length === 0) {
    return Response.json({ enviados: 0, mensagem: 'Nenhum agendamento encontrado para este dia.' });
  }

  const resultados = [];

  for (const ag of agendamentosDoDia) {
    const telefone = ag.cliente_telefone;
    if (!telefone) {
      resultados.push({ cliente: ag.cliente_nome, status: 'sem_telefone' });
      continue;
    }

    // Cancela o agendamento
    await base44.asServiceRole.entities.Agendamento.update(ag.id, { status: 'cancelado' });

    // Monta a mensagem
    const dataFormatada = dataAlvo.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const horario = new Date(ag.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const mensagem = `Olá ${ag.cliente_nome}! 👋\n\nInfelizmente precisamos cancelar sua consulta do dia *${dataFormatada}* às *${horario}h*.\n\n${motivo ? `Motivo: ${motivo}\n\n` : ''}Por favor, entre em contato conosco para remarcar seu atendimento. Pedimos desculpas pelo inconveniente! 🙏`;

    const resultado = await sendMessage(telefone, mensagem);
    resultados.push({ cliente: ag.cliente_nome, telefone, status: 'enviado', resultado });
  }

  return Response.json({ 
    enviados: resultados.filter(r => r.status === 'enviado').length,
    total: agendamentosDoDia.length,
    resultados 
  });
});