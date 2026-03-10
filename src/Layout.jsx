import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, Calendar, Users, MessageCircle, 
  Settings, Menu, X, Bot, LogOut, Sparkles, TrendingUp,
  Moon, Sun, MessageSquare, Wifi
} from 'lucide-react';
import { cn } from "@/lib/utils";

export const ThemeContext = createContext({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Agenda', icon: Calendar, page: 'Agenda' },
  { name: 'Pacientes', icon: Users, page: 'Clientes' },
  { name: 'Conversas', icon: MessageCircle, page: 'Conversas' },
  { name: 'Relatórios', icon: TrendingUp, page: 'Relatorios' },
  { name: 'Falar com IA', icon: Bot, page: 'ChatIA' },
  { name: 'Configurações', icon: Settings, page: 'Configuracoes' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // dark é o padrão
  });

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark-app');
    } else {
      document.documentElement.classList.remove('dark-app');
    }
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: toggleTheme }}>
      <div className={cn("min-h-screen flex", dark ? "bg-[#0A0A0F] text-white" : "bg-[#F5F6FA] text-zinc-900")}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed top-0 left-0 z-50 h-full w-[220px] flex flex-col transition-transform duration-300 lg:translate-x-0 border-r",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          dark
            ? "bg-[#0D0D14] border-white/5"
            : "bg-white border-zinc-100/80"
        )}>

          {/* Logo */}
          <div className={cn("px-5 py-6 border-b", dark ? "border-white/5" : "border-zinc-100")}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Sparkles className="w-4 h-4 text-amber-900" />
              </div>
              <div>
                <p className={cn("text-[14px] font-bold tracking-tight", dark ? "text-white" : "text-zinc-900")}>ZapSecretarIA</p>
                <p className={cn("text-[10px] leading-none mt-0.5 font-medium", dark ? "text-white/30" : "text-zinc-400")}>Secretária com IA</p>
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group",
                    isActive
                      ? dark
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                      : dark
                        ? "text-white/40 hover:text-white/80 hover:bg-white/5"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive
                      ? dark ? "text-amber-400" : "text-amber-700"
                      : dark ? "text-white/30 group-hover:text-white/60" : "text-zinc-400 group-hover:text-zinc-600"
                  )} />
                  {item.name}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* WhatsApp pill */}
          <div className="px-3 pb-2">
            <Link
              to={createPageUrl('ConectarWhatsApp')}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group border",
                dark
                  ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15"
                  : "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/80"
              )}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30">
                <Wifi className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className={cn("text-[12px] font-semibold", dark ? "text-emerald-400" : "text-emerald-700")}>WhatsApp</p>
                <p className={cn("text-[10px]", dark ? "text-emerald-500/70" : "text-emerald-600/70")}>Ativar atendimento IA</p>
              </div>
            </Link>
          </div>

          {/* Bottom actions */}
          <div className={cn("px-3 py-4 border-t flex items-center justify-between", dark ? "border-white/5" : "border-zinc-100")}>
            <button
              onClick={() => base44.auth.logout()}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all flex-1",
                dark ? "text-white/30 hover:text-white/60 hover:bg-white/5" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
              )}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
            <button
              onClick={toggleTheme}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all border",
                dark
                  ? "bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10"
                  : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              )}
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 lg:ml-[220px] flex flex-col min-h-screen">
          {/* Mobile header */}
          <header className={cn(
            "sticky top-0 z-30 backdrop-blur-xl border-b lg:hidden",
            dark ? "bg-[#0D0D14]/80 border-white/5" : "bg-white/80 border-zinc-100"
          )}>
            <div className="flex items-center justify-between px-4 h-14">
              <button onClick={() => setSidebarOpen(true)} className={cn("p-1.5 rounded-lg", dark ? "hover:bg-white/10 text-white/60" : "hover:bg-zinc-100 text-zinc-600")}>
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-600 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-amber-900" />
                </div>
                <span className={cn("font-bold text-sm", dark ? "text-white" : "text-zinc-900")}>ZapSecretarIA</span>
              </div>
              <button onClick={toggleTheme} className={cn("p-1.5 rounded-lg", dark ? "hover:bg-white/10 text-white/40" : "hover:bg-zinc-100 text-zinc-400")}>
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
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
    </ThemeContext.Provider>
  );
}