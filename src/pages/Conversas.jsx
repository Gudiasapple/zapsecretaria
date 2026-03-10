import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Search, Bot, User, Clock, ArrowLeft, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../Layout';

export default function Conversas() {
  const { dark } = useTheme();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChat, setShowChat] = useState(false);
  const bottomRef = useRef(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: () => base44.agents.listConversations({ agent_name: 'dra_maria' }),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!selectedConversationId) return;
    base44.agents.getConversation(selectedConversationId).then(setSelectedConversation);
    const unsubscribe = base44.agents.subscribeToConversation(selectedConversationId, (data) => {
      setSelectedConversation(data);
    });
    return unsubscribe;
  }, [selectedConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const filtered = conversations.filter(conv => {
    const name = conv.metadata?.name || conv.id || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (conv) => {
    setSelectedConversationId(conv.id);
    setShowChat(true);
  };

  const messages = selectedConversation?.messages || [];
  const convName = selectedConversation?.metadata?.name || 'Conversa';

  const panelClass = cn(
    "rounded-2xl border flex flex-col overflow-hidden",
    dark ? "bg-[#13131C] border-white/5" : "bg-white border-zinc-100"
  );

  return (
    <div className={cn("min-h-screen px-4 py-8 md:px-8", dark ? "bg-[#0A0A0F]" : "bg-[#F5F6FA]")}>
      <div className="max-w-7xl mx-auto space-y-6">

        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-[0.15em] mb-1.5", dark ? "text-amber-400" : "text-amber-600")}>WhatsApp</p>
          <h1 className={cn("text-3xl font-bold tracking-tight", dark ? "text-white" : "text-zinc-900")}>Conversas</h1>
          <p className={cn("text-sm mt-1", dark ? "text-white/30" : "text-zinc-400")}>Histórico de atendimentos da secretária IA</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 220px)' }}>

          {/* Lista */}
          <div className={cn(panelClass, showChat && "hidden lg:flex")}>
            <div className={cn("px-4 py-4 border-b flex-shrink-0 space-y-3", dark ? "border-white/5" : "border-zinc-100")}>
              <div className="flex items-center justify-between">
                <h2 className={cn("text-xs font-bold uppercase tracking-widest", dark ? "text-white/30" : "text-zinc-400")}>Conversas</h2>
                <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", dark ? "bg-white/5 text-white/30" : "bg-zinc-100 text-zinc-400")}>
                  {conversations.length}
                </span>
              </div>
              <div className="relative">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5", dark ? "text-white/20" : "text-zinc-400")} />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar paciente..."
                  className={cn(
                    "w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-none transition-all",
                    dark ? "bg-white/5 border-white/5 text-white placeholder:text-white/20 focus:border-violet-500/50" : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-300"
                  )}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className={cn("w-8 h-8 mx-auto mb-3", dark ? "text-white/10" : "text-zinc-200")} />
                    <p className={cn("text-sm", dark ? "text-white/20" : "text-zinc-400")}>Nenhuma conversa ainda</p>
                  </div>
                ) : (
                  filtered.map((conv) => {
                    const lastMsg = conv.messages?.[conv.messages.length - 1];
                    const isSelected = selectedConversationId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelect(conv)}
                        className={cn(
                          "p-3 rounded-xl cursor-pointer transition-all",
                          isSelected
                            ? dark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-100"
                            : dark ? "hover:bg-white/[0.03] border border-transparent" : "hover:bg-zinc-50 border border-transparent"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
                            <Phone className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn("font-semibold truncate text-xs", dark ? "text-white/80" : "text-zinc-900")}>
                                {conv.metadata?.name || conv.id}
                              </p>
                              {conv.messages?.length > 0 && (
                                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", dark ? "bg-white/5 text-white/30" : "bg-zinc-100 text-zinc-400")}>
                                  {conv.messages.length}
                                </span>
                              )}
                            </div>
                            {lastMsg && (
                              <p className={cn("text-[11px] truncate mt-0.5", dark ? "text-white/25" : "text-zinc-400")}>
                                {lastMsg.role === 'assistant' ? '🤖 ' : '👤 '}{lastMsg.content}
                              </p>
                            )}
                            {conv.updated_date && (
                              <p className={cn("text-[10px] mt-1 flex items-center gap-1", dark ? "text-white/15" : "text-zinc-400")}>
                                <Clock className="w-2.5 h-2.5" />
                                {formatDistanceToNow(new Date(conv.updated_date), { addSuffix: true, locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat */}
          <div className={cn(panelClass, "lg:col-span-2", !showChat && "hidden lg:flex")}>
            {selectedConversation ? (
              <>
                <div className={cn("px-5 py-4 border-b flex-shrink-0", dark ? "border-white/5" : "border-zinc-100")}>
                  <div className="flex items-center gap-3">
                    <button
                      className={cn("lg:hidden p-1.5 rounded-lg transition-colors", dark ? "hover:bg-white/5 text-white/40" : "hover:bg-zinc-100 text-zinc-400")}
                      onClick={() => setShowChat(false)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className={cn("font-bold text-sm", dark ? "text-white/90" : "text-zinc-900")}>{convName}</p>
                      <p className={cn("text-[11px] flex items-center gap-1 mt-0.5", dark ? "text-white/30" : "text-zinc-400")}>
                        <Bot className="w-3 h-3 text-violet-500" />
                        Atendido pela secretária IA
                      </p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg, i) => {
                      if (msg.role === 'system') return null;
                      const isBot = msg.role === 'assistant';
                      return (
                        <div key={i} className={cn("flex gap-3", isBot ? "justify-start" : "justify-end")}>
                          {isBot && (
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", dark ? "bg-amber-500/15" : "bg-amber-100")}>
                              <Bot className={cn("w-3.5 h-3.5", dark ? "text-amber-300" : "text-amber-700")} />
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                            isBot
                              ? dark ? "bg-white/5 border border-white/5 text-white/70" : "bg-zinc-50 border border-zinc-100 text-zinc-700"
                              : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                          )}>
                            <ReactMarkdown className={cn("prose prose-sm max-w-none", isBot ? (dark ? "prose-invert" : "prose-slate") : "prose-invert [&>*]:text-white")}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          {!isBot && (
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", dark ? "bg-emerald-500/20" : "bg-emerald-100")}>
                              <User className={cn("w-3.5 h-3.5", dark ? "text-emerald-300" : "text-emerald-600")} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-5 shadow-xl shadow-emerald-500/20">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className={cn("text-xl font-bold mb-2", dark ? "text-white/70" : "text-zinc-900")}>
                  Conversas do WhatsApp
                </h2>
                <p className={cn("text-sm max-w-sm", dark ? "text-white/25" : "text-zinc-400")}>
                  Selecione uma conversa para ver o histórico completo do atendimento com a IA.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}