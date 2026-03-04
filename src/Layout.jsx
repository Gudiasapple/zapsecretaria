import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, Calendar, Users, MessageCircle, 
  Settings, Menu, X, Bot, LogOut, ChevronRight
} from 'lucide-react';
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Agenda', icon: Calendar, page: 'Agenda' },
  { name: 'Clientes', icon: Users, page: 'Clientes' },
  { name: 'Conversas', icon: MessageCircle, page: 'Conversas' },
  { name: 'Configurações', icon: Settings, page: 'Configuracoes' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-200">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">ProntaIA</h1>
                <p className="text-xs text-slate-500">Secretária Inteligente</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive 
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-200" 
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                    {item.name}
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* WhatsApp Link */}
          <div className="p-4 border-t border-slate-100">
            <a
              href={base44.agents.getWhatsAppConnectURL('dra_maria')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">WhatsApp</p>
                <p className="text-xs text-emerald-600">Conectar agente</p>
              </div>
            </a>
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-slate-500 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200 lg:hidden">
          <div className="flex items-center justify-between px-4 h-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-violet-600" />
              <span className="font-bold text-slate-900">ProntaIA</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}