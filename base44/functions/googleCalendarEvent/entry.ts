import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { agendamento } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const event = {
      summary: `${agendamento.tipo?.charAt(0).toUpperCase() + agendamento.tipo?.slice(1)} - ${agendamento.cliente_nome}`,
      description: [
        agendamento.profissional ? `Profissional: ${agendamento.profissional}` : '',
        agendamento.especialidade ? `Especialidade: ${agendamento.especialidade}` : '',
        agendamento.forma_pagamento ? `Pagamento: ${agendamento.forma_pagamento}` : '',
        agendamento.preparo ? `Preparo: ${agendamento.preparo}` : '',
        agendamento.observacoes ? `Obs: ${agendamento.observacoes}` : '',
      ].filter(Boolean).join('\n'),
      start: {
        dateTime: agendamento.data_hora_inicio,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: agendamento.data_hora_fim,
        timeZone: 'America/Sao_Paulo',
      },
      attendees: agendamento.cliente_telefone ? [] : [],
    };

    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data.error?.message || 'Erro ao criar evento' }, { status: 500 });
    }

    return Response.json({ success: true, eventId: data.id, eventLink: data.htmlLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});