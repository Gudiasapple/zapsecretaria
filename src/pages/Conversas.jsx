import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, Search, Bot, User, Clock, 
  Plus, ArrowLeft, Phone, Calendar
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

import ChatInterface from '../components/chat/ChatInterface';

export default function Conversas() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChat, setShowChat] = useState(false);

  const { data: conversations = [], refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.agents.listConversations({ agent_name: 'dra_maria' }),
  });

  const handleNewConversation = (conv) => {
    setSelectedConversationId(conv.id);
    refetch();
  };

  const handleStartNew = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "dra_maria",
      metadata: { name: `Conversa ${new Date().toLocaleDateString('pt-BR')}` }
    });
    setSelectedConversationId(conv.id);
    setShowChat(true);
    refetch();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.id?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Conversations List */}
          <Card className={cn(
            "border-0 shadow-sm lg:col-span-1 flex flex-col",
            showChat && "hidden lg:flex"
          )}>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-violet-600" />
                  Conversas
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={handleStartNew}
                  className="bg-gradient-to-r from-violet-600 to-purple-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar conversas..."
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
                    <p className="text-slate-500">Nenhuma conversa encontrada</p>
                    <Button 
                      variant="link" 
                      onClick={handleStartNew}
                      className="mt-2 text-violet-600"
                    >
                      Iniciar nova conversa
                    </Button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversationId(conv.id);
                        setShowChat(true);
                      }}
                      className={cn(
                        "p-4 rounded-xl cursor-pointer transition-all",
                        selectedConversationId === conv.id
                          ? "bg-violet-100 border-violet-200"
                          : "bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900 truncate">
                              {conv.metadata?.name || 'Conversa'}
                            </p>
                            {conv.messages?.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {conv.messages.length}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 truncate mt-0.5">
                            {conv.messages?.[conv.messages.length - 1]?.content || 'Nenhuma mensagem'}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {conv.updated_date && formatDistanceToNow(new Date(conv.updated_date), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className={cn(
            "border-0 shadow-sm lg:col-span-2 flex flex-col",
            !showChat && "hidden lg:flex"
          )}>
            {showChat || selectedConversationId ? (
              <>
                <CardHeader className="pb-3 border-b flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setShowChat(false)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Dra. Maria</CardTitle>
                      <p className="text-sm text-slate-500">Secretária Virtual</p>
                    </div>
                  </div>
                </CardHeader>
                
                <div className="flex-1 overflow-hidden">
                  <ChatInterface 
                    conversationId={selectedConversationId}
                    onNewConversation={handleNewConversation}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-200">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Dra. Maria</h2>
                <p className="text-slate-500 max-w-md mb-6">
                  Sua secretária virtual inteligente. Selecione uma conversa ou inicie uma nova para começar.
                </p>
                <Button 
                  onClick={handleStartNew}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Conversa
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}