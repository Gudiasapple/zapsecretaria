import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Search, Bot, User, Clock, ArrowLeft, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

export default function Conversas() {
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

  // Load and subscribe to selected conversation
  useEffect(() => {
    if (!selectedConversationId) return;
    base44.agents.getConversation(selectedConversationId).then(setSelectedConversation);

    const unsubscribe = base44.agents.subscribeToConversation(selectedConversationId, (data) => {
      setSelectedConversation(data);
    });
    return unsubscribe;
  }, [selectedConversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const filteredConversations = conversations.filter(conv => {
    const name = conv.metadata?.name || conv.id || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (conv) => {
    setSelectedConversationId(conv.id);
    setShowChat(true);
  };

  const messages = selectedConversation?.messages || [];
  const convName = selectedConversation?.metadata?.name || 'Conversa';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Conversas do WhatsApp</h1>
          <p className="text-slate-500 text-sm mt-1">Histórico de atendimentos feitos pela IA com pacientes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 180px)' }}>
          {/* Lista de conversas */}
          <Card className={cn("border-0 shadow-sm flex flex-col overflow-hidden", showChat && "hidden lg:flex")}>
            <CardHeader className="pb-3 border-b flex-shrink-0">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-violet-600" />
                Conversas
                <Badge variant="secondary" className="ml-auto">{conversations.length}</Badge>
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por paciente..."
                  className="pl-10"
                />
              </div>
            </CardHeader>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm">Nenhuma conversa ainda</p>
                    <p className="text-slate-400 text-xs mt-1">As conversas do WhatsApp aparecerão aqui</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const lastMsg = conv.messages?.[conv.messages.length - 1];
                    const isSelected = selectedConversationId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelect(conv)}
                        className={cn(
                          "p-4 rounded-xl cursor-pointer transition-all border",
                          isSelected
                            ? "bg-violet-50 border-violet-200"
                            : "bg-white hover:bg-slate-50 border-transparent hover:border-slate-200"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-slate-900 truncate text-sm">
                                {conv.metadata?.name || conv.id}
                              </p>
                              {conv.messages?.length > 0 && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                  {conv.messages.length}
                                </Badge>
                              )}
                            </div>
                            {lastMsg && (
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {lastMsg.role === 'assistant' ? '🤖 ' : '👤 '}{lastMsg.content}
                              </p>
                            )}
                            {conv.updated_date && (
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
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
          </Card>

          {/* Área de mensagens (somente leitura) */}
          <Card className={cn("border-0 shadow-sm lg:col-span-2 flex flex-col overflow-hidden", !showChat && "hidden lg:flex")}>
            {selectedConversation ? (
              <>
                <CardHeader className="pb-3 border-b flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      className="lg:hidden p-1 rounded-lg hover:bg-slate-100"
                      onClick={() => setShowChat(false)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{convName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Bot className="w-3 h-3 text-violet-500" />
                        Atendido pela Dra. Maria
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg, i) => {
                      const isBot = msg.role === 'assistant';
                      return (
                        <div key={i} className={cn("flex gap-3", isBot ? "justify-start" : "justify-end")}>
                          {isBot && (
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
                              <Bot className="w-4 h-4 text-violet-600" />
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                            isBot
                              ? "bg-white border border-slate-200 text-slate-800"
                              : "bg-emerald-500 text-white"
                          )}>
                            <ReactMarkdown className={cn("prose prose-sm max-w-none", isBot ? "prose-slate" : "prose-invert [&>*]:text-white")}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          {!isBot && (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                              <User className="w-4 h-4 text-emerald-600" />
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Conversas do WhatsApp</h2>
                <p className="text-slate-500 max-w-md text-sm">
                  Selecione uma conversa à esquerda para ver o histórico de atendimento da IA com o paciente.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}