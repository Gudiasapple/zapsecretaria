import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

const roleConfig = {
  user: { bg: "bg-slate-100", text: "text-slate-700", label: "Cliente" },
  assistant: { bg: "bg-violet-100", text: "text-violet-700", label: "Dra. Maria" },
  system: { bg: "bg-amber-100", text: "text-amber-700", label: "Sistema" },
};

export default function RecentConversations({ logs, onViewMore }) {
  // Group by session/client
  const groupedLogs = logs.reduce((acc, log) => {
    const key = log.cliente_telefone || log.sessao_id || log.id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(log);
    return acc;
  }, {});

  const conversations = Object.entries(groupedLogs)
    .map(([key, messages]) => ({
      id: key,
      telefone: messages[0]?.cliente_telefone,
      lastMessage: messages[messages.length - 1],
      messageCount: messages.length,
      timestamp: messages[messages.length - 1]?.created_date
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center border-0 shadow-sm">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-slate-500">Nenhuma conversa recente</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => {
        const role = roleConfig[conv.lastMessage?.papel] || roleConfig.user;
        
        return (
          <Card 
            key={conv.id}
            className="p-4 border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
            onClick={() => onViewMore?.(conv)}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                role.bg
              )}>
                <MessageCircle className={cn("w-5 h-5", role.text)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900">
                    {conv.telefone || 'Conversa'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {conv.messageCount} msgs
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-600 truncate">
                  {conv.lastMessage?.conteudo}
                </p>
                
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {conv.timestamp && formatDistanceToNow(new Date(conv.timestamp), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}