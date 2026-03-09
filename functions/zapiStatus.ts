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

  const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/status`;
  const response = await fetch(url, {
    headers: { 'Client-Token': CLIENT_TOKEN }
  });
  const result = await response.json();

  return Response.json(result);
});