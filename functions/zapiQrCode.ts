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

  // Status da conexão
  const statusRes = await fetch(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/status`,
    { headers: { 'Client-Token': CLIENT_TOKEN } }
  );
  const status = await statusRes.json();

  if (status.connected) {
    return Response.json({ connected: true, status });
  }

  // Busca QR Code
  const qrRes = await fetch(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/qr-code/image`,
    { headers: { 'Client-Token': CLIENT_TOKEN } }
  );

  if (!qrRes.ok) {
    return Response.json({ connected: false, error: 'QR Code não disponível', status });
  }

  const imageBuffer = await qrRes.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  const qrCodeBase64 = `data:image/png;base64,${base64}`;

  return Response.json({ connected: false, qrCode: qrCodeBase64, status });
});