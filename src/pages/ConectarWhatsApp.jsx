import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, Smartphone, RefreshCw, Wifi, WifiOff, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConectarWhatsApp() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  async function fetchStatus() {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke('zapiQrCode', {});
    const data = res.data;

    if (data.connected) {
      setConnected(true);
      setQrCode(null);
    } else {
      setConnected(false);
      setQrCode(data.qrCode || null);
      if (!data.qrCode) setError(data.error || 'Não foi possível obter o QR Code');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  // Polling para detectar conexão após QR Code exibido
  useEffect(() => {
    if (!qrCode || connected) return;

    const interval = setInterval(async () => {
      const res = await base44.functions.invoke('zapiQrCode', {});
      if (res.data.connected) {
        setConnected(true);
        setQrCode(null);
        clearInterval(interval);
      } else if (res.data.qrCode && res.data.qrCode !== qrCode) {
        // QR Code atualizado
        setQrCode(res.data.qrCode);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [qrCode, connected]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Conectar WhatsApp</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Escaneie o QR Code com o celular da clínica para ativar a secretária automática
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-8 shadow-sm text-center">

          {loading && (
            <div className="py-12">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Carregando...</p>
            </div>
          )}

          {!loading && connected && (
            <div className="py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 mb-2">WhatsApp Conectado!</h2>
              <p className="text-sm text-zinc-500 mb-6">
                A secretária virtual está ativa e pronta para atender seus pacientes.
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium">
                <Wifi className="w-4 h-4" />
                Instância ZapSecretarIA online
              </div>
            </div>
          )}

          {!loading && !connected && qrCode && (
            <div>
              <div className="bg-zinc-50 rounded-xl p-4 mb-6 inline-block">
                <img src={qrCode} alt="QR Code WhatsApp" className="w-56 h-56 mx-auto" />
              </div>
              <div className="text-left bg-zinc-50 rounded-xl p-4 mb-6 space-y-2">
                <p className="text-xs font-semibold text-zinc-700 mb-3">Como conectar:</p>
                {[
                  'Abra o WhatsApp no celular da clínica',
                  'Toque nos 3 pontos → Dispositivos conectados',
                  'Toque em "Conectar dispositivo"',
                  'Aponte a câmera para o QR Code acima',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-zinc-600">{step}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Verificando conexão automaticamente a cada 5 segundos...
              </p>
              <Button variant="outline" size="sm" onClick={fetchStatus} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar QR Code
              </Button>
            </div>
          )}

          {!loading && !connected && !qrCode && (
            <div className="py-8">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <WifiOff className="w-8 h-8 text-zinc-400" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">QR Code indisponível</h2>
              <p className="text-xs text-zinc-500 mb-6">{error || 'Tente novamente em alguns instantes.'}</p>
              <Button variant="outline" size="sm" onClick={fetchStatus} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Tentar novamente
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}