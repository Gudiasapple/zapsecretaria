const INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
const TOKEN = Deno.env.get("ZAPI_TOKEN");
const CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

Deno.serve(async (req) => {
  try {
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

    const contentType = qrRes.headers.get('content-type') || '';

    let qrCodeBase64;
    if (contentType.includes('application/json')) {
      // Z-API retorna JSON com campo "value" contendo o base64
      const json = await qrRes.json();
      const raw = json.value || json.qrcode || json.qr || '';
      // Se já tem o prefixo data:image, usa direto; senão monta
      qrCodeBase64 = raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
    } else {
      const imageBuffer = await qrRes.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      qrCodeBase64 = `data:image/png;base64,${base64}`;
    }

    return Response.json({ connected: false, qrCode: qrCodeBase64, status });
  } catch (error) {
    return Response.json({ connected: false, error: error.message }, { status: 500 });
  }
});