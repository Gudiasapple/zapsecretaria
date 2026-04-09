import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
const TOKEN = Deno.env.get("ZAPI_TOKEN");
const CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phone, message } = await req.json();

  if (!phone || !message) {
    return Response.json({ error: 'phone e message são obrigatórios' }, { status: 400 });
  }

  const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Client-Token': CLIENT_TOKEN
    },
    body: JSON.stringify({ phone, message })
  });

  const result = await response.json();
  return Response.json(result);
});