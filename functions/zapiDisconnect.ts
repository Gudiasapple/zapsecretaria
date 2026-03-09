import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
const TOKEN = Deno.env.get("ZAPI_TOKEN");
const CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(
      `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/disconnect`,
      {
        method: 'DELETE',
        headers: { 'Client-Token': CLIENT_TOKEN },
      }
    );

    const data = await res.json().catch(() => ({}));
    return Response.json({ success: res.ok, data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});