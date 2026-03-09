import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, Calendar, Users, MessageCircle, 
  Settings, Menu, X, Bot, LogOut, ChevronRight, Sparkles, TrendingUp
} from 'lucide-react';
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Visão Geral', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Agenda', icon: Calendar, page: 'Agenda' },
  { name: 'Pacientes', icon: Users, page: 'Clientes' },
  { name: 'Conversas', icon: MessageCircle, page: 'Conversas' },
  { name: 'Relatórios', icon: TrendingUp, page: 'Relatorios' },
  { name: 'Configurações', icon: Settings, page: 'Configuracoes' },
  { name: 'Conectar WhatsApp', icon: MessageCircle, page: 'ConectarWhatsApp' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-60 bg-white border-r border-zinc-100 flex flex-col transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="px-6 py-7 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[15px] font-semibold tracking-tight text-zinc-900">ZapSecretaria</span>
              <p className="text-[11px] text-zinc-400 leading-none mt-0.5">Secretária Inteligente</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-600")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* WhatsApp CTA */}
        <div className="px-3 pb-2">
          <Link
            to={createPageUrl('ConectarWhatsApp')}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors group"
          >
            <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-emerald-800">Conectar WhatsApp</p>
              <p className="text-[11px] text-emerald-600">Ativar atendimento via IA</p>
            </div>
          </Link>
        </div>

        {/* Logout */}
        <div className="px-3 pb-5 pt-1 border-t border-zinc-100 mt-1">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-[13px] text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-100 lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md hover:bg-zinc-100">
              <Menu className="w-5 h-5 text-zinc-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-zinc-900 text-sm">ZapSecretaria</span>
            </div>
            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>

      <style>{`
        * { -webkit-font-smoothing: antialiased; }
        body { font-family: 'Inter', system-ui, sans-serif; }
      `}</style>
    </div>
  );
}